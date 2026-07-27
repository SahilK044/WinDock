// Thin wrapper around the compiled .node binary. Returns null instead of
// throwing when the addon isn't available (wrong platform, not yet built),
// so callers can fall back gracefully.
let addon = null;
try {
  if (process.platform === "win32") {
    // eslint-disable-next-line global-require
    addon = require("./build/Release/wasapi_loopback.node");
  }
} catch (err) {
  addon = null;
}

module.exports = {
  available: !!addon,
  /**
   * Starts loopback capture. `onChunk(float32Array, sampleRate)` is called
   * from a background thread every ~10ms with mono PCM samples.
   * Returns true if capture started, false if already running or addon
   * unavailable.
   */
  start(onChunk) {
    if (!addon) return false;
    return addon.start(onChunk);
  },
  stop() {
    if (!addon) return false;
    return addon.stop();
  },
};
