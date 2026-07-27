// Runs in a Node worker_thread (spawned from main.js), never on the main
// process, so FFT math can never cause UI jank or block audio capture.
//
// Receives raw mono PCM Float32 chunks (~10ms each, ~480 samples at 48kHz)
// from the native WASAPI addon, accumulates them into a rolling analysis
// window, runs an FFT, buckets the spectrum into log-spaced bands (roughly
// matching how humans perceive pitch — bass bands are narrower in Hz,
// treble bands are wider), and posts smoothed band levels back at a capped
// rate so the render process never gets flooded.

const { parentPort } = require("worker_threads");

const FFT_SIZE = 2048; // ~43ms window at 48kHz — good balance of latency vs. frequency resolution
const BAND_COUNT = 24; // matches the visualizer's bar count
const POST_INTERVAL_MS = 16; // ~60fps cap; audio arrives faster than this, we just use the latest window
const ATTACK = 0.6; // how fast a band rises (higher = snappier)
const RELEASE = 0.15; // how fast a band falls (lower = smoother trailing decay)

let ringBuffer = new Float32Array(FFT_SIZE);
let writeIndex = 0;
let filled = false;
let sampleRate = 48000;
let smoothedBands = new Float32Array(BAND_COUNT);
let lastPostTime = 0;

// In-place iterative radix-2 Cooley-Tukey FFT. `re`/`im` length must be a
// power of two (FFT_SIZE = 2048 satisfies this).
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang), wI = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1, curIm = 0;
      for (let k = 0; k < len / 2; k++) {
        const uRe = re[i + k], uIm = im[i + k];
        const vRe = re[i + k + len / 2] * curRe - im[i + k + len / 2] * curIm;
        const vIm = re[i + k + len / 2] * curIm + im[i + k + len / 2] * curRe;
        re[i + k] = uRe + vRe;
        im[i + k] = uIm + vIm;
        re[i + k + len / 2] = uRe - vRe;
        im[i + k + len / 2] = uIm - vIm;
        const nextRe = curRe * wRe - curIm * wI;
        const nextIm = curRe * wI + curIm * wRe;
        curRe = nextRe; curIm = nextIm;
      }
    }
  }
}

// Precomputed Hann window to reduce spectral leakage at the FFT edges.
const hann = new Float32Array(FFT_SIZE);
for (let i = 0; i < FFT_SIZE; i++) {
  hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
}

// Precomputed log-spaced band edges (20Hz - ~20kHz), recalculated only if
// sampleRate changes (it won't, in practice, mid-stream).
let bandEdges = null;
let bandEdgesSampleRate = null;
function getBandEdges(sr) {
  if (bandEdges && bandEdgesSampleRate === sr) return bandEdges;
  const minHz = 30, maxHz = Math.min(16000, sr / 2);
  const edges = new Array(BAND_COUNT + 1);
  for (let i = 0; i <= BAND_COUNT; i++) {
    const t = i / BAND_COUNT;
    edges[i] = minHz * Math.pow(maxHz / minHz, t);
  }
  bandEdges = edges;
  bandEdgesSampleRate = sr;
  return edges;
}

function processWindow() {
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);
  // Read the ring buffer out in correct chronological order, windowed.
  for (let i = 0; i < FFT_SIZE; i++) {
    const idx = (writeIndex + i) % FFT_SIZE;
    re[i] = ringBuffer[idx] * hann[i];
  }
  fft(re, im);

  const magnitudes = new Float32Array(FFT_SIZE / 2);
  for (let i = 0; i < magnitudes.length; i++) {
    magnitudes[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
  }

  const edges = getBandEdges(sampleRate);
  const binHz = sampleRate / FFT_SIZE;
  const rawBands = new Float32Array(BAND_COUNT);

  for (let b = 0; b < BAND_COUNT; b++) {
    const startBin = Math.max(1, Math.floor(edges[b] / binHz));
    const endBin = Math.min(magnitudes.length - 1, Math.ceil(edges[b + 1] / binHz));
    let sum = 0, count = 0;
    for (let bin = startBin; bin <= endBin; bin++) { sum += magnitudes[bin]; count++; }
    const avg = count > 0 ? sum / count : 0;
    // Log-compress amplitude so quiet passages are still visible and loud
    // transients don't just pin every bar at max.
    rawBands[b] = Math.min(1, Math.log10(1 + avg * 40) / 2.2);
  }

  // Per-band attack/release smoothing so bars rise fast on transients but
  // fall smoothly instead of flickering.
  for (let b = 0; b < BAND_COUNT; b++) {
    const rate = rawBands[b] > smoothedBands[b] ? ATTACK : RELEASE;
    smoothedBands[b] += (rawBands[b] - smoothedBands[b]) * rate;
  }

  const now = Date.now();
  if (now - lastPostTime >= POST_INTERVAL_MS) {
    lastPostTime = now;
    parentPort.postMessage({ type: "bands", bands: Array.from(smoothedBands) });
  }
}

parentPort.on("message", (msg) => {
  if (msg?.type === "pcm") {
    const chunk = msg.samples; // Float32Array (transferred)
    sampleRate = msg.sampleRate || sampleRate;
    for (let i = 0; i < chunk.length; i++) {
      ringBuffer[writeIndex] = chunk[i];
      writeIndex = (writeIndex + 1) % FFT_SIZE;
      if (writeIndex === 0) filled = true;
    }
    if (filled) processWindow();
  } else if (msg?.type === "reset") {
    ringBuffer.fill(0);
    smoothedBands.fill(0);
    writeIndex = 0;
    filled = false;
  }
});
