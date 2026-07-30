# WinLand — Dynamic Island for Windows

**WinLand** is an interactive, fluid Dynamic Island desktop component for Windows, built with React 19, Vite, and Electron. It integrates with **WinDock** to display live weather forecasts, now-playing media controls, system telemetry, file sharing, and interactive widgets.

---

## 🌟 Features

- **📡 Real-Time Live Weather Sync**: Displays accurate local temperature (°C / °F) and weather conditions auto-detected via IP location and Open-Meteo.
- **🎵 System Now Playing Card**: Displays track title, artist, album art, progress bar, and media controls (Play/Pause, Skip, Previous) for Spotify, Apple Music, and web media.
- **🎨 Dynamic Accent Extraction**: Canvas-based dominant color sampler extracts vibrant accent colors from current album artwork to generate dynamic translucent background gradients.
- **⚡ System Telemetry & Monitor**: Live CPU, RAM, and GPU usage metrics.
- **📦 AirDrop Drop Zone**: Drag-and-drop file sharing via local Wi-Fi HTTP server.
- **🔋 Battery & Volume OSDs**: Real-time status cards for battery charge level and system volume.
- **🌙 Glassmorphic Tahoe Theme**: Translucent pill UI with dark mode support.

---

## 🛠️ Architecture & IPC Sync

WinLand runs as a lightweight Electron process communicating with WinDock (.NET 4.8) via `%TEMP%\winland_theme.json` and Electron IPC (`preload.js`):

- `getInitialConfig`: Synchronously fetches weather, theme, and island preferences on component mount.
- `onConfigUpdate`: Receives real-time weather and configuration updates.
- `onSystemMediaUpdate`: Receives media track metadata and playback progress.

---

## ⚙️ Development & Building

### Prerequisites

- Node.js 18+
- npm

### Commands

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build production Vite bundle
npm run build

# Package Electron executable
npm run dist
```

---

## 📄 License

MIT License.
