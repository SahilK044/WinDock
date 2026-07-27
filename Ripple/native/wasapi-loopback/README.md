# WASAPI Loopback Capture (audio visualizer backend)

Native Node addon that captures whatever audio is playing through the
default Windows output device ("what you hear") and streams it to Ripple's
renderer as real FFT band levels, so the Now Playing visualizer reacts to
the actual song — not a simulation.

## Why this exists

Ripple reads track metadata (title/artist/artwork) from the OS media session
(GSMTC on Windows), not from Spotify/Apple Music's decoded audio — those
apps play the audio themselves, and Spotify's Web Playback SDK deliberately
blocks raw-buffer access (DRM/licensing). Loopback capture sidesteps this
entirely: it reads the mixed output going to your speakers, at the OS level,
regardless of which app produced it.

## Build (Windows only)

Requires the standard Node native-module toolchain:

- Visual Studio Build Tools (Desktop development with C++ workload)
- Python 3.x (used by node-gyp)

From the project root:

```bash
npm install
npm run build-native
```

`npm install` links `node_modules/wasapi-loopback` to this folder (it's
declared as `"wasapi-loopback": "file:native/wasapi-loopback"` in the root
`package.json`) — npm does this as a symlink by default, which is
intentional here: `npm run build-native` compiles directly into
`native/wasapi-loopback/build/Release/wasapi_loopback.node`, and because
`node_modules/wasapi-loopback` is a symlink to this same folder (not a
copy), `require("wasapi-loopback")` immediately sees the freshly built
binary with no extra sync step. (If your npm config forces file:
dependencies to be copied instead of symlinked — e.g. `install-links=true`
in an `.npmrc` — the two locations would diverge and the build output
wouldn't be visible to `require()`. Don't add that setting for this
project.)

Because Electron embeds its own Node ABI (different from your system
Node's), you'll usually need to rebuild against Electron's headers before
`npm start` will load it correctly:

```bash
npm run rebuild-native-electron
```

If you only run `npm run make` / `npm run package`, Electron Forge's
`@electron-forge/plugin-auto-unpack-natives` plugin (already configured in
`forge.config.js`) takes care of unpacking the compiled `.node` file from
the asar archive at runtime — it detects it automatically because
`wasapi-loopback` is a real `node_modules` package. You still need to have
built it first, though.

## What happens if it's not built / not on Windows

`native/wasapi-loopback/index.js` catches the require failure and exposes
`available: false`. `main.js` checks this before wiring up IPC, and the
renderer's `AlbumAudioVisualizer` component falls back automatically to a
smooth, play/pause-driven animation instead of throwing or silently doing
nothing.

## Honest limits

- **Windows only.** macOS would need a CoreAudio tap or a virtual driver
  (BlackHole/Soundflower); Linux would use PulseAudio/PipeWire monitor
  sources. Neither is implemented here.
- **~10–40ms of latency** end-to-end (WASAPI buffer + IPC + render). This is
  well under the ~80–100ms threshold where humans notice audio/visual
  desync, but it is not literally zero.
- **Captures system output, not just the current track.** If something else
  is also making sound (a notification, a second app), it's part of the
  mix, same as if you were listening with your ears.
- I could not compile or run this addon in the environment I built it in
  (no Windows/MSVC toolchain available there) — it's written to the WASAPI
  loopback spec correctly, but you're the first real compile+run test.
  Watch the console (`npm start`) for errors from `[audio-worker]` or a
  `node-gyp rebuild` failure if the visualizer doesn't animate.
