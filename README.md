# WinDock Suite

![WinDock Banner](windock_logo.png)

---

**WinDock Suite** is a desktop enhancement suite for Windows 10 and 11. It combines a macOS-style dock, the Winland Dynamic Island helper, live weather telemetry, and an F1 race center into a high-performance Windows desktop experience.

---

## 🌟 Key Features & Highlights

### 🏎️ Formula 1 Race Center & Standings Overlay
- **Official F1 Dock Widget**: Hover or click the F1 dock icon to launch the live Formula 1 overlay window.
- **Driver & Constructor Standings**: Displays live driver/constructor championship tables, points, driver headshots, team logos, and car renders.
- **Race Calendar & Track Maps**: High-definition circuit maps and race countdown timers for all Grand Prix events on the calendar.

### 🎧 Bluetooth Accessory Auto-Connect Pop-ups (AirPods & Controllers)
- **Real-Time Device Detection**: Automatically senses paired Bluetooth accessories (AirPods, wireless headphones, Xbox controllers, Bluetooth mice/keyboards) connecting or disconnecting on Windows.
- **macOS-Style Dynamic Island Connection Card**: Expands into a Bluetooth connection card with device name, battery percentage (`%`), and subtle connection chime, auto-collapsing after 4.5 seconds.

### 📡 High-Speed Wi-Fi AirDrop HTTP Server
- **Instant Wireless Drag-and-Drop Sharing**: Drop any file onto the AirDrop drop zone to instantly generate a local Wi-Fi download link (`http://<Local-IP>:8999/download`).
- **Cross-Platform Support**: Transfer files instantly to Android (Samsung, Pixel), iOS (iPhone, iPad), macOS, and Linux without third-party cloud services.
- **Auto-Clipboard Sync**: Direct download link automatically copies to your clipboard upon file drop.

### 🎤 Apple Music-Style Synced Karaoke Lyrics
- **Real-Time Word-Wipe**: Lyrics fill progressively from left to right as words are sung in real-time.
- **Deterministic UI Hooks**: Robust React state flow guarantees zero rendering crashes when toggling between album art and lyrics views.

### 🎨 Liquid Glass Tinting & Translucent Dock UI
- **Translucent Backdrop Blur**: Powered by Win32 DWM AccentBlur and HSL gradient brushes for dynamic translucent glass effects.
- **Clean Glass Rendering**: Transparent glass dock background with zero white box artifacts on startup.

### 🎵 Media Key Simulation & Dynamic Island Controls
- **System-Wide Playback Integration**: Control playback across Spotify, Apple Music, and web browsers using native Win32 WScript key event execution (`⏮ Previous`, `⏸ Play/Pause`, `⏭ Next`).
- **Animated Audio Visualizer & Track Glow**: Real-time canvas audio visualizers and smooth album artwork palette glow.

### 🖥️ Windows Taskbar & System Integration
- **Taskbar Auto-Hide Sync**: Native taskbar visibility toggles with auto-hide state detection.
- **System Telemetry & Performance Meters**: Real-time CPU, RAM, GPU, and network throughput counters.

---

## 🛠️ Integrated Components

- **WinDock**: Fluid desktop dock with app magnification, stack folders, an app launcher, and Spotlight-style search utilities.
- **Winland Dynamic Island**: Floating media, system-status, and Bluetooth accessory pill with track artwork, controls, and quick workflows.
- **WinCast Weather**: Live forecast and weather overlay widget with current conditions and hourly weather data.
- **F1 Widget**: Standings, driver bios, constructor stats, and circuit maps overlay.
- **Setup Installer**: Light-themed setup wizard with animated progress and install options.
- **Deep Uninstaller**: Removes suite processes and installed files cleanly during uninstall.

---

## ⚙️ Building from Source

### Prerequisites

- Windows 10 or Windows 11
- .NET Framework 4.8 SDK or Visual Studio 2022
- Node.js 18+ and npm (for compiling the Winland Electron helper)

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
- `config.json` is local-only and ignored by Git.
- **Zero External Telemetry / Data Privacy**: All file transfers, telemetry, and background sync run 100% locally on your machine and local network. No external tracking or secret keys required.

---

## 📁 Project Structure

```text
WinDock/
├── DockApp.cs              # Main WinDock application logic, glass dock UI, and AirDrop HTTP server
├── NativeBlur.cs           # Win32 DWM blur and composition interop
├── WinDock.csproj          # Main WinDock WPF project
├── config.example.json     # Safe template configuration
├── Setup/                  # Setup installer project
├── Winland/                # Packaged Dynamic Island helper and runtime assets
├── Weather/                # Packaged Weather helper and runtime assets
├── F1 Cars/                # F1 car renders
├── Drivers/                # F1 driver full-body assets
├── Headshots/              # F1 driver headshots
├── Driver Number/          # F1 driver number art
├── Team Logos/             # F1 constructor logos
└── Track/                  # F1 circuit maps
```

---

## 📄 License

This project is licensed under the MIT License.
