# WinDock Suite

![WinDock Banner](windock_logo.png)

**WinDock Suite** is an all-in-one desktop enhancement suite for Windows 10 and 11. It combines a macOS-style dock, the Ripple Dynamic Island helper, and a live weather widget into one Windows desktop experience.

## Integrated Components

- **WinDock**: Fluid desktop dock with app magnification, stack folders, an app launcher, and Spotlight-style search utilities.
- **Ripple Dynamic Island**: Floating media and system-status pill with track artwork, controls, and quick workflows.
- **Weather App**: Live forecast widget with current conditions and hourly weather data.
- **Setup Installer**: Light themed setup wizard with animated progress and install options.
- **Deep Uninstaller**: Removes suite processes and installed files during uninstall.

## What's New in v2.0

- Bundled WinDock, Ripple Dynamic Island, and Weather App into a single suite.
- Redesigned setup wizard with clean light-mode styling.
- Added animated installer progress and live file telemetry.
- Added smooth toggle switches and direction-aware wizard transitions.
- Improved uninstall cleanup for running suite processes and installed directories.

## Building from Source

### Prerequisites

- Windows 10 or Windows 11
- .NET Framework 4.8 SDK or Visual Studio 2022

### Build Steps

```powershell
# Clone your fork or local copy, then enter the repository.
git clone <repository-url>
cd WinDock

# Build the main WinDock application.
dotnet build --configuration Release WinDock.csproj

# Build the installer setup executable.
dotnet build --configuration Release Setup/Setup.csproj
```

The main application is generated at `bin\Release\net48\WinDock.exe`.
The installer is generated at `Setup\bin\Release\net48\WinDock_Setup.exe`.

## Configuration And Secrets

- `config.example.json` is the safe template committed to Git.
- `config.json` is local-only and ignored by Git. Keep personal paths, Spotify client ids, and machine-specific settings there.
- Do not commit `.env`, private keys, tokens, local config files, generated logs, or build outputs.

## Project Structure

```text
WinDock/
|-- DockApp.cs              # Main WinDock application logic and dock UI
|-- NativeBlur.cs           # Win32 DWM blur and composition interop
|-- WinDock.csproj          # Main WinDock WPF project
|-- config.example.json     # Safe template configuration
|-- Setup/                  # Setup installer project
|-- Ripple/                 # Packaged Dynamic Island helper and runtime assets
|-- Weather/                # Packaged Weather helper and runtime assets
|-- F1 Cars/                # F1 car renders
|-- Drivers/                # F1 driver full-body assets
|-- Headshots/              # F1 driver headshots
|-- Driver Number/          # F1 driver number art
|-- Team Logos/             # F1 constructor logos
`-- Track/                  # F1 circuit maps
```

## Credits

- **Dynamic Island**: Thanks to [Ripple](https://github.com/TopMyster/Ripple) by TopMyster for the foundation of the Dynamic Island widget experience.

## License

This project is licensed under the MIT License.
