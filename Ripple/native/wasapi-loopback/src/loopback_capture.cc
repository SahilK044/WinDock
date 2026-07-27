// WASAPI loopback capture addon.
//
// Captures whatever is currently being sent to the default audio render
// device (i.e. "what you hear") without any cooperation from the app that's
// actually playing it (Spotify, Apple Music, a browser, etc). This is the
// only way to get real, sample-accurate audio data for a visualizer when the
// playing app doesn't expose its decoded audio buffer (Spotify's Web
// Playback SDK is DRM-protected and blocks this on purpose).
//
// Flow:
//   Start(jsCallback) -> spins up a capture thread that:
//     1. Opens the default render endpoint in loopback mode via IAudioClient
//     2. Polls IAudioCaptureClient for packets (~10ms cadence)
//     3. Downmixes to mono float32 and hands the buffer to JS via a
//        thread-safe N-API callback
//   Stop() -> signals the thread to exit and tears down COM objects safely
//
// The JS side (audioWorker.js) takes these raw PCM chunks, runs an FFT, and
// buckets the result into visualizer bands.

#include <napi.h>
#include <windows.h>
#include <mmdeviceapi.h>
#include <audioclient.h>
#include <avrt.h>
#include <mmreg.h>
#include <ksmedia.h> // KSDATAFORMAT_SUBTYPE_IEEE_FLOAT
#include <atomic>
#include <thread>
#include <vector>
#include <cstring>

#pragma comment(lib, "ole32.lib")

static const IID IID_IAudioClient_ = __uuidof(IAudioClient);
static const IID IID_IAudioCaptureClient_ = __uuidof(IAudioCaptureClient);
static const CLSID CLSID_MMDeviceEnumerator_ = __uuidof(MMDeviceEnumerator);
static const IID IID_IMMDeviceEnumerator_ = __uuidof(IMMDeviceEnumerator);

// Returns true if the given mix format's actual sample representation is
// IEEE float. WAVE_FORMAT_EXTENSIBLE does NOT itself imply float — the real
// subtype lives in WAVEFORMATEXTENSIBLE::SubFormat and must be checked
// explicitly, otherwise this would silently misinterpret PCM-in-extensible
// streams as float (garbage/distorted band data, not just "less accurate").
bool IsIeeeFloatFormat(const WAVEFORMATEX* wfx) {
  if (wfx->wFormatTag == WAVE_FORMAT_IEEE_FLOAT) return true;
  if (wfx->wFormatTag == WAVE_FORMAT_EXTENSIBLE &&
      wfx->cbSize >= sizeof(WAVEFORMATEXTENSIBLE) - sizeof(WAVEFORMATEX)) {
    const auto* wfxExt = reinterpret_cast<const WAVEFORMATEXTENSIBLE*>(wfx);
    return wfxExt->SubFormat == KSDATAFORMAT_SUBTYPE_IEEE_FLOAT;
  }
  return false;
}

class LoopbackCapture {
 public:
  std::atomic<bool> running{false};
  std::thread worker;
  Napi::ThreadSafeFunction tsfn;
  bool tsfnReleased = false;

  ~LoopbackCapture() {
    // Safety net: std::thread's destructor calls std::terminate() if the
    // thread object is still joinable when destroyed. Every code path that
    // deletes a LoopbackCapture should already call Stop() first, but this
    // guards against any path that doesn't, instead of crashing the process.
    running = false;
    if (worker.joinable()) worker.join();
  }

  // Safe to call multiple times and safe to call even if the capture thread
  // already exited on its own (e.g. after a device error) without anyone
  // calling Stop() yet — both cases used to be able to leave `worker`
  // joinable and `tsfn` un-released, which would crash on delete or on a
  // second Stop().
  void Stop() {
    running = false;
    if (worker.joinable()) worker.join();
    if (!tsfnReleased) {
      tsfn.Release();
      tsfnReleased = true;
    }
  }

  void Run() {
    // Ensures `running` is always reset to false when this function returns,
    // on ANY exit path (early device-init failure or the main loop ending),
    // so a later Start() call never gets stuck thinking capture is still
    // active when the thread has actually already terminated.
    struct RunningGuard {
      std::atomic<bool>& flag;
      ~RunningGuard() { flag = false; }
    } guard{running};

    HRESULT hr = CoInitializeEx(nullptr, COINIT_MULTITHREADED);
    bool comInitialized = SUCCEEDED(hr);

    IMMDeviceEnumerator* enumerator = nullptr;
    IMMDevice* device = nullptr;
    IAudioClient* audioClient = nullptr;
    IAudioCaptureClient* captureClient = nullptr;
    WAVEFORMATEX* mixFormat = nullptr;

    auto cleanup = [&]() {
      if (captureClient) captureClient->Release();
      if (audioClient) audioClient->Release();
      if (device) device->Release();
      if (enumerator) enumerator->Release();
      if (mixFormat) CoTaskMemFree(mixFormat);
      if (comInitialized) CoUninitialize();
    };

    hr = CoCreateInstance(CLSID_MMDeviceEnumerator_, nullptr, CLSCTX_ALL,
                           IID_IMMDeviceEnumerator_, (void**)&enumerator);
    if (FAILED(hr)) { cleanup(); return; }

    hr = enumerator->GetDefaultAudioEndpoint(eRender, eConsole, &device);
    if (FAILED(hr)) { cleanup(); return; }

    hr = device->Activate(IID_IAudioClient_, CLSCTX_ALL, nullptr, (void**)&audioClient);
    if (FAILED(hr)) { cleanup(); return; }

    hr = audioClient->GetMixFormat(&mixFormat);
    if (FAILED(hr)) { cleanup(); return; }

    // 200ms shared buffer is plenty of headroom; we drain it every ~10ms.
    const REFERENCE_TIME bufferDuration = 200 * 10000; // 100ns units
    hr = audioClient->Initialize(AUDCLNT_SHAREMODE_SHARED,
                                  AUDCLNT_STREAMFLAGS_LOOPBACK,
                                  bufferDuration, 0, mixFormat, nullptr);
    if (FAILED(hr)) { cleanup(); return; }

    hr = audioClient->GetService(IID_IAudioCaptureClient_, (void**)&captureClient);
    if (FAILED(hr)) { cleanup(); return; }

    const UINT32 channels = mixFormat->nChannels;
    const bool isFloat = IsIeeeFloatFormat(mixFormat);
    const UINT32 bitsPerSample = mixFormat->wBitsPerSample;
    const UINT32 nativeSampleRate = mixFormat->nSamplesPerSec;

    hr = audioClient->Start();
    if (FAILED(hr)) { cleanup(); return; }

    DWORD taskIndex = 0;
    HANDLE avrtHandle = AvSetMmThreadCharacteristicsW(L"Pro Audio", &taskIndex);

    while (running.load()) {
      UINT32 packetLength = 0;
      hr = captureClient->GetNextPacketSize(&packetLength);
      if (FAILED(hr)) break;

      while (packetLength != 0 && running.load()) {
        BYTE* data = nullptr;
        UINT32 numFrames = 0;
        DWORD flags = 0;

        hr = captureClient->GetBuffer(&data, &numFrames, &flags, nullptr, nullptr);
        if (FAILED(hr)) break;

        // Downmix to mono float32 for the FFT stage. Silence flag means the
        // buffer contents are undefined, so we emit zeros instead of noise.
        auto* samples = new std::vector<float>(numFrames);
        if (flags & AUDCLNT_BUFFERFLAGS_SILENT) {
          std::fill(samples->begin(), samples->end(), 0.0f);
        } else if (isFloat) {
          const float* src = reinterpret_cast<const float*>(data);
          for (UINT32 i = 0; i < numFrames; i++) {
            float sum = 0.0f;
            for (UINT32 c = 0; c < channels; c++) sum += src[i * channels + c];
            (*samples)[i] = sum / static_cast<float>(channels);
          }
        } else if (bitsPerSample == 16) {
          const int16_t* src = reinterpret_cast<const int16_t*>(data);
          for (UINT32 i = 0; i < numFrames; i++) {
            int32_t sum = 0;
            for (UINT32 c = 0; c < channels; c++) sum += src[i * channels + c];
            (*samples)[i] = (sum / static_cast<float>(channels)) / 32768.0f;
          }
        } else {
          std::fill(samples->begin(), samples->end(), 0.0f);
        }

        hr = captureClient->ReleaseBuffer(numFrames);

        // Hand the chunk to JS. If the queue is full or the tsfn has already
        // been released (shutdown race), NonBlockingCall returns something
        // other than napi_ok and never invokes our lambda — without this
        // check `samples` would leak on every dropped frame.
        napi_status status = tsfn.NonBlockingCall(samples,
            [nativeSampleRate](Napi::Env env, Napi::Function jsCallback, std::vector<float>* samples) {
              Napi::Float32Array arr = Napi::Float32Array::New(env, samples->size());
              std::memcpy(arr.Data(), samples->data(), samples->size() * sizeof(float));
              jsCallback.Call({ arr, Napi::Number::New(env, nativeSampleRate) });
              delete samples;
            });
        if (status != napi_ok) {
          delete samples;
        }

        if (FAILED(hr)) break;
        hr = captureClient->GetNextPacketSize(&packetLength);
        if (FAILED(hr)) break;
      }

      Sleep(10);
    }

    audioClient->Stop();
    if (avrtHandle) AvRevertMmThreadCharacteristics(avrtHandle);
    cleanup();
  }
};

static LoopbackCapture* g_capture = nullptr;

Napi::Value Start(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (g_capture && g_capture->running.load()) {
    return Napi::Boolean::New(env, false); // already running
  }
  if (info.Length() < 1 || !info[0].IsFunction()) {
    Napi::TypeError::New(env, "Expected a callback function").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (g_capture) {
    // Must fully stop (join thread, release tsfn) before deleting — a bare
    // `delete` here previously could hit a joinable-but-undestructed thread
    // (e.g. one that exited early due to a device error) and crash via
    // std::thread's std::terminate-on-destroy behavior.
    g_capture->Stop();
    delete g_capture;
    g_capture = nullptr;
  }

  g_capture = new LoopbackCapture();
  g_capture->running = true;
  g_capture->tsfn = Napi::ThreadSafeFunction::New(
      env, info[0].As<Napi::Function>(), "wasapi-loopback", 0, 1);

  g_capture->worker = std::thread([]() {
    g_capture->Run();
  });

  return Napi::Boolean::New(env, true);
}

Napi::Value Stop(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  if (g_capture) {
    g_capture->Stop();
    delete g_capture;
    g_capture = nullptr;
  }
  return Napi::Boolean::New(env, true);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set("start", Napi::Function::New(env, Start));
  exports.Set("stop", Napi::Function::New(env, Stop));
  return exports;
}

NODE_API_MODULE(wasapi_loopback, Init)
