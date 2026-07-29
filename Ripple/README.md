# Ripple

**Dynamic Island, for Everyone.**

Ripple is a fast, lightweight, dynamic desktop overlay for Windows, macOS, and Linux. Inspired by mobile island design systems, Ripple brings smooth media controls, a real-time audio spectrum visualizer, system metrics, weather alerts, quick app launchers, and smart productivity tools straight to your desktop.

---

## Highlights & Key Features

### 🎵 1:1 Real-Time Audio Visualizer & Media Hub
- **Native WASAPI Audio Capture** — Captures system audio loopback with low latency and zero attack lag.
- **24-Band Logarithmic Spectrum** — Frequency analysis from 35Hz to 16kHz covering sub-bass, midrange, and treble.
- **Zero-Latency Win32 Media Controls** — Instant native media keystroke dispatch for Play, Pause, Next, and Previous.
- **Smart Artwork Resolution** — Retrieves high-resolution album covers from iTunes and fetches video thumbnails for YouTube and web browser media streams.
- **UTF-8 Multi-Language Metadata** — Full support for international track titles, artist names, and special characters.

### ⚡ Performance & Efficiency
- **Instant Lag-Free Launch** — Smart background app index caching eliminates startup CPU spikes and system stuttering.
- **In-Flight Media Protection** — Guarded system polling prevents process stacking.
- **Low Memory Footprint** — Offloads FFT audio processing to worker threads to maintain 60 FPS / 120 FPS rendering.

### 🖥️ Desktop Experience
- **Three Dynamic Modes**:
  - **Still Mode** — Minimal, unobtrusive idle pill.
  - **Quick Mode** — Hover to inspect playing track, time, weather, and instant media controls.
  - **Large Mode** — Expanded widget hub with tabs, search, tasks, and settings.
- **Multi-Monitor & Workspace Sync** — Pins seamlessly above full-screen windows and stays visible across workspaces.
- **Custom Themes & Personalization** — Dark glassmorphism, OLED black, vintage Win95, and accent color customizers.

---

## Quick Start

### Installation
Download the latest pre-built release for your platform:
- **Windows**: `WinDock_Setup.exe` installer or portable package
- **macOS**: `.dmg` installer (Apple Silicon & Intel)
- **Linux**: `.deb` or `.rpm` packages

### Keyboard Shortcuts
- **Hover** — View Quick Mode media preview and controls.
- **Click Island** — Expand to Large Mode.
- **Ctrl + 1..9** — Switch tabs instantly.
- **Arrow Keys / Mouse Wheel** — Cycle through tabs.

---

## Development Setup

### Prerequisites
- **Node.js** 18+ and `npm`
- **C++ Build Tools** (for native WASAPI module build):
  - **Windows**: Visual Studio Build Tools (C++ Workload)
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `build-essential`

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/SahilK044/WinDock.git
cd Ripple

# Install dependencies
npm install

# Run development server
npm start
```

### Packaging Production Release
```bash
# Package for host platform
npm run package

# Build setup installer
npm run make
```

---

## Architecture Overview

```
Ripple/
├── native/wasapi-loopback/   # C++ WASAPI system audio loopback capture & Win32 media keys
├── resources/audioWorker.js  # Worker thread running 1024-point FFT & onset beat detection
├── src/
│   ├── main.js              # Electron main process, IPC handlers, app discovery & media manager
│   ├── preload.js           # Secure context bridge API
│   ├── Island.jsx           # Canvas audio visualizer & Dynamic Island UI
│   └── App.css              # Glassmorphism design system & micro-animations
```

---

## License

Ripple is open-source software released under the [MIT License](LICENSE).

