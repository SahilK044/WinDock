# WinDock

![WinDock Banner](windock_logo.png)

---

**WinDock** is a high-performance, macOS-style desktop dock for Windows 10 and 11. Built with C# and WPF on .NET Framework 4.8, it combines smooth icon magnification, crisp high-DPI icon rendering, live Formula 1 standings, a compact media controller, and local Wi-Fi AirDrop file sharing into a sleek Windows desktop utility.

---

## 🌟 Key Features & Highlights

### 🚀 High-Performance macOS-Style Dock
- **Ultra-Smooth Magnification**: Dynamic icon scaling with high-quality bicubic rendering (`BitmapScalingMode.HighQuality`).
- **High-DPI 256x256 Icon Extraction**: Extracts ultra-crisp HD 256x256 icons from Windows executables, UWP apps, and shell shortcuts without low-resolution pixelation.
- **Single-Pass Window & Process Mapping**: Ultra-optimized $O(1)$ process-to-window dictionary mapping for instant window activation and zero CPU lag.
- **Leak-Free Resource Management**: Clean deterministic disposal of Win32 handles and GDI process handles.

### 🏎️ Formula 1 Race Center & Standings Overlay
- **Official F1 Dock Widget**: Hover or click the F1 dock icon to launch the live Formula 1 overlay window.
- **Driver & Constructor Standings**: Live driver and constructor championship tables with points, 256x256 HD driver headshots, official constructor logos, and team colors.
- **Race Calendar & Podiums**: Full race schedule countdown, Grand Prix dates, and podium race summaries.

### 🎵 Compact Spotify & Media Player Controller
- **Hover Media Card**: Hovering over Spotify or active media apps displays a sleek, compact player overlay (album artwork, track title, artist, play/pause, next/previous, and volume control).
- **Non-Intrusive Controls**: Plays/pauses and skips tracks system-wide via native Win32 media keys without auto-expanding heavy overlays.

### 📡 High-Speed Wi-Fi AirDrop File Sharing
- **Instant Drag-and-Drop Sharing**: Drop any file onto the AirDrop drop zone to generate a local Wi-Fi download link (`http://<Local-IP>:8999/download`).
- **Cross-Platform Compatibility**: Transfer files wirelessly to Android (Samsung, Pixel), iOS (iPhone, iPad), macOS, and Linux without external cloud services.
- **Automatic Clipboard Sync**: Direct download links automatically copy to your clipboard upon file drop.

### 🎨 Liquid Glass Translucency & Customization
- **Translucent Backdrop Blur**: Powered by Win32 DWM `AccentBlur` and dynamic HSL gradient brushes.
- **Modular Settings Window**: Clean settings menu to configure dock position, alignment, performance mode, auto-hide, and widget toggles.

---

## ⚙️ Building from Source

### Prerequisites

- Windows 10 or Windows 11
- .NET Framework 4.8 SDK or Visual Studio 2022

### Build Steps

```powershell
# Clone the repository and enter directory
git clone https://github.com/SahilK044/WinDock.git
cd WinDock

# Build the main WinDock application
dotnet build --configuration Release WinDock.csproj
```

The compiled application executable is generated at `bin\Release\net48\WinDock.exe` and copied to `WinDock.exe` in the root folder.

---

## 📁 Project Structure

```text
WinDock/
├── DockApp.cs              # Main WinDock application logic, glass dock UI, and AirDrop HTTP server
├── NativeBlur.cs           # Win32 DWM blur and composition interop
├── WinDock.csproj          # Main WinDock WPF project
├── MacSettings.txt         # Settings window XAML template
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
