// Runs in a Node worker_thread (spawned from main.js), never on the main
// process, so FFT math can never cause UI jank or block audio capture.
//
// Receives raw mono PCM Float32 chunks from the native WASAPI addon,
// analyzes a short rolling FFT window, normalizes spectrum bands against an
// adaptive floor/peak, and separately detects musical onsets for beat pulses.

const { parentPort } = require("worker_threads");

const FFT_SIZE = 1024; // ~21ms at 48kHz; lower latency matters for beat sync.
const BAND_COUNT = 24;
const POST_INTERVAL_MS = 16;
const ATTACK = 1.0;
const RELEASE = 0.65;
const BEAT_COOLDOWN_MS = 120;
const ONSET_HISTORY_SIZE = 48;
const HOP_SIZE = 256; // Sliding window stride (~5.3ms at 48kHz)

let ringBuffer = new Float32Array(FFT_SIZE);
let writeIndex = 0;
let filled = false;
let samplesSinceLastFFT = 0;
let sampleRate = 48000;
let smoothedBands = new Float32Array(BAND_COUNT);
let adaptiveFloor = new Float32Array(BAND_COUNT).fill(0.03);
let adaptivePeak = new Float32Array(BAND_COUNT).fill(0.25);
let previousMagnitudes = new Float32Array(FFT_SIZE / 2);
let bassEnvelope = 0;
let onsetHistory = new Float32Array(ONSET_HISTORY_SIZE);
let onsetHistoryIndex = 0;
let onsetHistoryFilled = false;
let beatPulse = 0;
let lastBeatTime = 0;
let lastPostTime = 0;

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

const hann = new Float32Array(FFT_SIZE);
for (let i = 0; i < FFT_SIZE; i++) {
  hann[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
}

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

function averageMagnitude(magnitudes, startHz, endHz, binHz) {
  const startBin = Math.max(1, Math.floor(startHz / binHz));
  const endBin = Math.min(magnitudes.length - 1, Math.ceil(endHz / binHz));
  let sum = 0, count = 0;
  for (let bin = startBin; bin <= endBin; bin++) {
    sum += magnitudes[bin];
    count++;
  }
  return count > 0 ? sum / count : 0;
}

function positiveFlux(magnitudes, startHz, endHz, binHz) {
  const startBin = Math.max(1, Math.floor(startHz / binHz));
  const endBin = Math.min(magnitudes.length - 1, Math.ceil(endHz / binHz));
  let sum = 0, count = 0;
  for (let bin = startBin; bin <= endBin; bin++) {
    const prev = previousMagnitudes[bin] || 0;
    const cur = magnitudes[bin];
    sum += Math.max(0, cur - prev) / (prev + 0.002);
    count++;
  }
  return count > 0 ? sum / count : 0;
}

function getOnsetStats() {
  const length = onsetHistoryFilled ? ONSET_HISTORY_SIZE : onsetHistoryIndex;
  if (length < 8) return { mean: 0, std: 0.001 };
  let sum = 0;
  for (let i = 0; i < length; i++) sum += onsetHistory[i];
  const mean = sum / length;
  let variance = 0;
  for (let i = 0; i < length; i++) {
    const d = onsetHistory[i] - mean;
    variance += d * d;
  }
  return { mean, std: Math.sqrt(variance / length) };
}

function processWindow() {
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);
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
    for (let bin = startBin; bin <= endBin; bin++) {
      sum += magnitudes[bin];
      count++;
    }
    const avg = count > 0 ? sum / count : 0;
    rawBands[b] = Math.min(1, Math.log10(1 + avg * 250) / 1.8);
  }

  let bassLevel = 0;
  for (let b = 0; b < 6; b++) bassLevel += rawBands[b];
  bassLevel /= 6;

  const kickEnergy = averageMagnitude(magnitudes, 45, 170, binHz);
  const lowMidEnergy = averageMagnitude(magnitudes, 170, 420, binHz);
  const musicEnergy = averageMagnitude(magnitudes, 45, 6000, binHz);
  const kickFlux = positiveFlux(magnitudes, 45, 170, binHz);
  const lowMidFlux = positiveFlux(magnitudes, 170, 420, binHz);
  const fullFlux = positiveFlux(magnitudes, 45, 6000, binHz);

  for (let b = 0; b < BAND_COUNT; b++) {
    const raw = rawBands[b];
    const floorRate = raw < adaptiveFloor[b] ? 0.08 : 0.003;
    const peakRate = raw > adaptivePeak[b] ? 0.25 : 0.004;
    adaptiveFloor[b] += (raw - adaptiveFloor[b]) * floorRate;
    adaptivePeak[b] += (raw - adaptivePeak[b]) * peakRate;
    const range = Math.max(0.04, adaptivePeak[b] - adaptiveFloor[b]);
    rawBands[b] = Math.max(0, Math.min(1, (raw - adaptiveFloor[b] * 0.75) / range));
  }

  const bassAttack = Math.max(0, bassLevel - bassEnvelope);
  bassEnvelope += (bassLevel - bassEnvelope) * (bassLevel > bassEnvelope ? 0.20 : 0.045);

  const onset = kickFlux * 0.55 + lowMidFlux * 0.25 + fullFlux * 0.12 + bassAttack * 2.2;
  const { mean: onsetMean, std: onsetStd } = getOnsetStats();
  const threshold = Math.max(0.12, onsetMean + onsetStd * 1.85);
  const energyGate = musicEnergy > 0.006 && kickEnergy + lowMidEnergy > 0.01;
  const strength = Math.max(0, (onset - threshold) / Math.max(0.08, threshold));
  const now = Date.now();

  onsetHistory[onsetHistoryIndex] = onset;
  onsetHistoryIndex = (onsetHistoryIndex + 1) % ONSET_HISTORY_SIZE;
  if (onsetHistoryIndex === 0) onsetHistoryFilled = true;

  if (energyGate && onset > threshold && now - lastBeatTime > BEAT_COOLDOWN_MS) {
    lastBeatTime = now;
    beatPulse = Math.min(1, 0.45 + strength * 0.55);
  }
  beatPulse *= 0.72;
  previousMagnitudes.set(magnitudes);

  for (let b = 0; b < BAND_COUNT; b++) {
    const rate = rawBands[b] > smoothedBands[b] ? ATTACK : RELEASE;
    smoothedBands[b] += (rawBands[b] - smoothedBands[b]) * rate;
  }

  if (now - lastPostTime >= POST_INTERVAL_MS) {
    lastPostTime = now;
    parentPort.postMessage({
      type: "analysis",
      bands: Array.from(smoothedBands),
      beat: beatPulse,
      bass: Math.max(0, Math.min(1, bassLevel)),
    });
  }
}

parentPort.on("message", (msg) => {
  if (msg?.type === "pcm") {
    const chunk = msg.samples;
    sampleRate = msg.sampleRate || sampleRate;
    for (let i = 0; i < chunk.length; i++) {
      ringBuffer[writeIndex] = chunk[i];
      writeIndex = (writeIndex + 1) % FFT_SIZE;
      samplesSinceLastFFT++;
      if (!filled && writeIndex === 0) filled = true;
    }
    if (filled && samplesSinceLastFFT >= HOP_SIZE) {
      samplesSinceLastFFT = 0;
      processWindow();
    }
  } else if (msg?.type === "reset") {
    ringBuffer.fill(0);
    smoothedBands.fill(0);
    adaptiveFloor.fill(0.03);
    adaptivePeak.fill(0.25);
    previousMagnitudes.fill(0);
    onsetHistory.fill(0);
    onsetHistoryIndex = 0;
    onsetHistoryFilled = false;
    bassEnvelope = 0;
    beatPulse = 0;
    lastBeatTime = 0;
    writeIndex = 0;
    samplesSinceLastFFT = 0;
    filled = false;
  }
});
