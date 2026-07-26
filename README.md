# 🚀 WinDock Suite

![WinDock Banner](windock_logo.png)

**WinDock Suite** is an all-in-one desktop enhancement suite for Windows 10 & 11, combining a **macOS-style Dock**, the **Ripple Dynamic Island**, and a **Live Weather App**. Built natively in C# and WPF with zero bloat and hardware acceleration, WinDock Suite delivers a refined, fluid, and responsive desktop experience.

---

## 🌟 Integrated Suite Components

- 🍏 **WinDock**: Fluid macOS-style desktop dock with app magnification, stack folders, app launcher, and Spotlight search assistant (math calculations, unit conversions, web search).
- 🌊 **Ripple (Dynamic Island)**: Interactive floating Dynamic Island pill providing media controls, track artwork, volume/system stats, and quick workflows.
- ⛅ **Weather App**: Real-time atmospheric forecast overlay widget with current conditions and hourly weather data.
- 🎨 **Minimalist Setup Installer**: High-quality light mode installation wizard with smooth step slide transitions, smooth toggle switch animations, and an animated shimmer progress bar.
- 🧹 **Deep Uninstaller**: Complete uninstallation routine with process lock termination and recursive directory cleanup.

---

## 📦 What's New — v2.0

### ✨ Highlights
- **WinDock Suite Integration**: Seamlessly bundles WinDock, Ripple Dynamic Island, and Weather App into a single cohesive installation package.
- **Modern Light Mode Setup Wizard**: Redesigned macOS-inspired setup wizard with high-contrast typography and clean cards.
- **60 FPS Shimmer Glow Progress Bar**: GPU-accelerated gradient shimmer animation sweeping continuously across the progress track during installation.
- **Live File Telemetry**: Real-time file extraction paths displayed directly under the progress bar.
- **Smooth Toggle Switches**: Physics-inspired spring slide animation for all setup toggle options.
- **Direction-Aware Step Transitions**: Fluid page slide transitions when navigating through installer steps.
- **Complete Uninstallation**: Automatically terminates running suite processes (`WinDock`, `Ripple`, `Weather`) and performs a deep recursive folder cleanup.

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

# Build the main WinDock application
dotnet build --configuration Release WinDock.csproj

# Build the installer setup executable
dotnet build --configuration Release Setup/Setup.csproj
```

The compiled binary `WinDock.exe` is generated in `bin\Release\net48\WinDock.exe`.
The installer `WinDock_Setup.exe` is generated in `Setup\bin\Release\net48\WinDock_Setup.exe`.

---

## 📁 Project Structure

```
WinDock/
├── DockApp.cs              # Main WinDock application logic & dock UI
├── NativeBlur.cs           # Win32 DWM blur & composition interop
├── WinDock.csproj          # Main WinDock WPF project
├── config.example.json     # Default template configuration
├── Setup/                  # Setup Installer project
│   ├── Setup.csproj
│   ├── MainWindow.xaml     # Setup shell & step dots
│   ├── Steps/              # Wizard steps (Welcome, Options, Progress, Finish)
│   └── Styles/             # Light mode design tokens & control templates
├── Ripple/                 # Dynamic Island app & assets
├── Weather/                # Weather app binary & forecast widgets
├── F1 Cars/                # F1 car renders
├── Drivers/                # F1 driver full-body assets
├── Headshots/              # F1 driver headshots
├── Driver Number/          # F1 driver number art
├── Team Logos/             # F1 team constructor logos
└── Track/                  # F1 circuit maps
```

---

## 🙏 Credits & Acknowledgments

- **Dynamic Island**: Special thanks to **[Ripple](https://github.com/TopMyster/Ripple)** by TopMyster for inspiring and providing the foundation for the Dynamic Island widget experience.

---

## 📄 License

This project is licensed under the MIT License.

