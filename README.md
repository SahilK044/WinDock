# 🚀 WinDock

![WinDock Banner](windock_logo.png)

**WinDock** is a state-of-the-art macOS-style desktop dock and Spotlight search assistant built natively for Windows 10 & 11 in C# and WPF. Designed for speed, elegance, and pixel-perfect aesthetics, WinDock brings the refined desktop navigation experience of macOS to Windows with zero bloat and native hardware acceleration.

---

## 🌟 Key Features

- 🍎 **1:1 macOS Spotlight Search**: Dual-column instant search with smart math calculations, unit/currency conversions, app launchers, file previews, and Google web suggestions.
- 🎨 **Frosted Glass & Acrylic Composition Blur**: Real-time Win32 DWM composition blur with customizable dark/light themes and wallpaper accent tinting.
- ⚡ **Fluid 120+ FPS Spring Animations**: Hardware-accelerated scale, squish, poof, and springy pop-up animations built using WPF hardware rendering.
- 🎵 **Spotify & Media Controls**: Integrated album art displays, track progress indicators, and customizable Spotify API integration.
- 🧩 **Desktop Widgets**: Built-in interactive weather, adaptive clock, calendar, and F1 sports widgets with live data.
- 🏎️ **Live F1 Overlay**: Real-time driver standings, constructor standings with team logos & car renders, circuit maps, and session data powered by the OpenF1 API.
- 🌤️ **Weather Widget**: Interactive weather overlay with current conditions, hourly forecasts, and support for custom weather apps.
- 🚀 **Zero Dependencies**: Standalone C# WPF binary built for maximum performance and instant startup.
- 🛠️ **Premium Installer**: Custom glassmorphic dark-themed setup experience with configurable install options.

---

## 📦 What's New — v1.1

### ✨ New Features
- **Weather Widget Click-to-Open**: Clicking the weather widget now opens a custom weather app (place `Weather.exe` in a `Weather/` subfolder next to WinDock) or falls back to the built-in Windows Weather app.
- **Premium Installer UI**: Completely redesigned setup experience with glassmorphic dark theme, smooth step-based navigation, configurable install path, toggle switches for startup/shortcuts, and an animated progress bar.
- **Uninstaller Support**: The installer now supports clean uninstallation with an option to preserve user configuration.

### 🐛 Bug Fixes
- **Fixed missing F1 driver headshots**: Driver headshot images now resolve correctly from the bundled `Headshots/` asset directory.
- **Fixed missing team logos**: Constructor team logos now display properly in both the Drivers and Teams tabs of the F1 overlay.
- **Fixed missing car renders**: Constructor car images now load correctly on the Teams standings cards.
- **Fixed missing driver number art**: Driver number images now resolve from the bundled `Driver Number/` directory.
- **Fixed constructor standings layout**: Teams tab now shows team name text and a visible team logo on the left side of each card, alongside the existing points display and car render.
- **Fixed System Preferences crash**: Resolved a startup error when `MacSettings.txt` was missing by adding embedded resource fallback.
- **Robust F1 asset resolution**: All F1 image assets (headshots, team logos, car renders, driver numbers, track maps) now use a multi-directory fallback resolver that searches the app directory and project root.

### 🔧 Improvements
- **Build system**: F1 asset directories (`Drivers/`, `Headshots/`, `Driver Number/`, `Team Logos/`, `Cars/`, `Track/`) are now automatically bundled into the build output via MSBuild.
- **Portable paths**: All file references are now relative to the application directory — no hardcoded user-specific paths.

> 🚧 **More changes are coming soon!** We're actively working on new widgets, UI polish, and performance improvements. Stay tuned.

---

## 🛠️ Spotify API Setup

WinDock supports custom Spotify API integration. Simply add your **Spotify Client ID** to `config.json` or through the settings menu:

```json
{
  "SpotifyClientId": "YOUR_SPOTIFY_CLIENT_ID_HERE"
}
```

---

## 🏗️ Building from Source

### Prerequisites
- Windows 10 or Windows 11
- .NET Framework 4.8 SDK or Visual Studio 2022

### Build Steps
```powershell
# Clone the repository
git clone https://github.com/SahilK044/WinDock.git
cd WinDock

# Build the main application
dotnet build --configuration Release WinDock.csproj

# Build the installer (optional)
dotnet build --configuration Release Setup/Setup.csproj
```

The compiled binary `WinDock.exe` will be generated in `bin\Release\net48\WinDock.exe`.
The installer `WinDock_Setup.exe` will be in `Setup\bin\Release\net48\WinDock_Setup.exe`.

---

## 📁 Project Structure

```
WinDock/
├── DockApp.cs              # Main application logic (dock, widgets, overlays)
├── NativeBlur.cs           # Win32 DWM blur interop
├── WinDock.csproj          # Main project file
├── config.json             # User configuration
├── Setup/                  # Installer project
│   ├── Setup.csproj
│   ├── MainWindow.xaml     # Installer shell
│   ├── Steps/              # Install wizard steps (Welcome, Options, Progress, Complete)
│   └── Styles/             # Shared WPF styles & design tokens
├── Drivers/                # F1 driver full-body images
├── Headshots/              # F1 driver headshot images
├── Driver Number/          # F1 driver number art
├── Team Logos/             # F1 constructor team logos
├── Cars/                   # F1 constructor car renders
└── Track/                  # F1 circuit map images
```

---

## 📄 License

This project is licensed under the MIT License.
