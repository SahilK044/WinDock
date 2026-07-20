# 🚀 WinDock

![WinDock Banner](windock_logo.png)

**WinDock** is a state-of-the-art macOS-style desktop dock and Spotlight search assistant built natively for Windows 10 & 11 in C# and WPF. Designed for speed, elegance, and pixel-perfect aesthetics, WinDock brings the refined desktop navigation experience of macOS to Windows with zero bloat and native hardware acceleration.

---

## 🌟 Key Features

- 🍎 **1:1 macOS Spotlight Search**: Dual-column instant search with smart math calculations, unit/currency conversions, app launchers, file previews, and Google web suggestions.
- 🎨 **Frosted Glass & Acrylic Composition Blur**: Real-time Win32 DWM composition blur with customizable dark/light themes and wallpaper accent tinting.
- ⚡ **Fluid 120+ FPS Spring Animations**: Hardware-accelerated scale, squish, poof, and springy pop-up animations built using WPF hardware rendering.
- 🎵 **Spotify & Media Controls**: Integrated album art displays, track progress indicators, and customizable Spotify API integration.
- 🧩 **Desktop Widgets**: Built-in interactive weather, adaptive clock, calendar, and F1 sports widgets.
- 🚀 **Zero Dependencies**: Standalone C# WPF binary built for maximum performance and instant startup.

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
- .NET 8.0 SDK or Visual Studio 2022

### Build Steps
```powershell
# Clone the repository
git clone https://github.com/SahilK044/WinDock.git
cd WinDock

# Compile the application
dotnet build --configuration Release WinDock.csproj
```

The compiled binary `WinDock.exe` will be generated in `bin\Release\net48\WinDock.exe`.

---

## 📄 License

This project is licensed under the MIT License.
