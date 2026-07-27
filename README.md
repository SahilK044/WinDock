# WinDock Suite

![WinDock Banner](windock_logo.png)


## 🎥 Video Preview

https://github.com/SahilK044/WinDock/raw/main/preview.mp4

---


**WinDock Suite** is an all-in-one desktop enhancement suite for Windows 10 and 11. It combines a macOS-style dock, the Ripple Dynamic Island helper, and a live weather widget into a unified, high-performance Windows desktop experience.

---

## 🌟 Key Features & What's New in v2.5

### 📡 High-Speed Wi-Fi AirDrop HTTP Server
- **Instant Wireless Drag-and-Drop Sharing**: Drop any file onto the AirDrop drop zone to instantly generate a local Wi-Fi download link (`http://<Local-IP>:8999/download`).
- **Cross-Platform Support**: Transfer files instantly to Android (Samsung Galaxy S24 Ultra, Pixel), iOS (iPhone, iPad), macOS, and Linux without third-party cloud services.
- **Auto-Clipboard Sync**: Direct download link automatically copies to your clipboard upon file drop.

### 🎨 Liquid Glass Tinting & Translucent Dock UI
- **Translucent Backdrop Blur**: Powered by Win32 DWM AccentBlur and HSL gradient brushes for dynamic translucent glass effects.
- **Clean Startup Rendering**: Completely removed solid white block artifacts on launch for a 100% transparent glass dock background.

### 🎵 Media Key Simulation & Dynamic Island Controls
- **System-Wide Playback Integration**: Control playback across Spotify, Apple Music, and web browsers using native Win32 WScript key event execution (`⏮ Previous`, `⏸ Play/Pause`, `⏭ Next`).
- **Compact Now Playing Card**: Optimized `140px` card height with click propagation isolation (`e.stopPropagation()`) ensuring playback controls operate without unwanted window collapse.
- **Animated Audio Visualizer & Track Glow**: Real-time canvas audio visualizers and smooth album artwork palette glow.

### 🖥️ Windows Taskbar & System Integration
- **Taskbar Auto-Hide Sync**: Native taskbar visibility toggles with auto-hide state detection.
- **System Telemetry & Performance Meters**: Real-time CPU, RAM, GPU, and network throughput counters.

---

## 🛠️ Integrated Components

- **WinDock**: Fluid desktop dock with app magnification, stack folders, an app launcher, and Spotlight-style search utilities.
- **Ripple Dynamic Island**: Floating media and system-status pill with track artwork, controls, and quick workflows.
- **Weather App**: Live forecast widget with current conditions and hourly weather data.
- **Setup Installer**: Light-themed setup wizard with animated progress and install options.
- **Deep Uninstaller**: Removes suite processes and installed files cleanly during uninstall.

---

## ⚙️ Building from Source

### Prerequisites

- Windows 10 or Windows 11
- .NET Framework 4.8 SDK or Visual Studio 2022
- Node.js 18+ and npm (for compiling the Ripple Electron helper)

### Build Steps

```powershell
# Clone the repository and enter directory
git clone https://github.com/SahilK044/WinDock.git
cd WinDock

# Build the main WinDock application
dotnet build --configuration Release WinDock.csproj

# Build the installer setup executable
dotnet build --configuration Release Setup/Setup.csproj
```

The main application executable is generated at `bin\Release\net48\WinDock.exe`.
The setup installer is generated at `Setup\bin\Release\net48\WinDock_Setup.exe`.

---

## 🔐 Configuration & Privacy

- `config.example.json` is the safe template committed to Git.
- `config.json` is local-only and ignored by Git. Store machine-specific paths, Spotify client secrets, and credentials locally.
- **Zero Telemetry / Data Privacy**: All file transfers and telemetry run 100% locally on your machine and local network. No external data tracking or API key leaks.

---

## 📁 Project Structure

```text
WinDock/
├── DockApp.cs              # Main WinDock application logic, glass dock UI, and AirDrop HTTP server
├── NativeBlur.cs           # Win32 DWM blur and composition interop
├── WinDock.csproj          # Main WinDock WPF project
├── config.example.json     # Safe template configuration
├── Setup/                  # Setup installer project
├── Ripple/                 # Packaged Dynamic Island helper and runtime assets
├── Weather/                # Packaged Weather helper and runtime assets
├── F1 Cars/                # F1 car renders
├── Drivers/                # F1 driver full-body assets
├── Headshots/              # F1 driver headshots
├── Driver Number/          # F1 driver number art
├── Team Logos/             # F1 constructor logos
└── Track/                  # F1 circuit maps
```

---

## 👏 Credits

- **Dynamic Island**: Thanks to [Ripple](https://github.com/TopMyster/Ripple) by TopMyster for the initial foundation of the Dynamic Island widget experience.

---

## 📄 License

This project is licensed under the MIT License.
