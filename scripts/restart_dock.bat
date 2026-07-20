@echo off
echo Closing existing MacDock...
taskkill /F /IM MacDock.exe /T 2>nul
taskkill /F /IM MacDockConsole.exe /T 2>nul
timeout /t 1 /nobreak >nul

echo Launching MacDock from downloads folder...
start "" "c:\Users\sahil\Downloads\Antigravity\MacDock.exe"

echo Done! MacDock has been restarted in Downloads folder.
