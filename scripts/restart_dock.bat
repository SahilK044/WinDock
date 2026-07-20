@echo off
echo Closing existing WinDock...
taskkill /F /IM WinDock.exe /T 2>nul
taskkill /F /IM WinDockConsole.exe /T 2>nul
timeout /t 1 /nobreak >nul

echo Launching WinDock...
start "" "%~dp0..\WinDock.exe"

echo Done! WinDock has been restarted.
