Add-Type -AssemblyName System.IO.Compression.FileSystem

$zipPath = "app_payload.zip"
$staging = "payload_staging"

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
if (Test-Path "app_payload_part1.dat") { Remove-Item "app_payload_part1.dat" -Force }
if (Test-Path "app_payload_part2.dat") { Remove-Item "app_payload_part2.dat" -Force }

New-Item -ItemType Directory -Path $staging -Force | Out-Null
New-Item -ItemType Directory -Path "$staging\Winland" -Force | Out-Null
New-Item -ItemType Directory -Path "$staging\Weather" -Force | Out-Null

Copy-Item "WinDock.exe" "$staging\WinDock.exe" -Force
Copy-Item "WinDockConsole.exe" "$staging\WinDockConsole.exe" -Force

# Copy Winland runtime files (excluding source/node_modules/dist_app)
Get-ChildItem "Winland" -Exclude "node_modules", "dist_app", ".git", ".vite" | Copy-Item -Destination "$staging\Winland" -Recurse -Force
# Copy Weather runtime files
Get-ChildItem "Weather" -Exclude "node_modules", ".git" | Copy-Item -Destination "$staging\Weather" -Recurse -Force

Write-Host "Zipping payload using .NET ZipFile..." -ForegroundColor Cyan
[System.IO.Compression.ZipFile]::CreateFromDirectory($staging, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)

Remove-Item $staging -Recurse -Force

Write-Host "Reading compressed payload bytes..." -ForegroundColor Cyan
$bytes = [System.IO.File]::ReadAllBytes($zipPath)
$half = [math]::Floor($bytes.Length / 2)

$p1 = New-Object byte[] $half
[Array]::Copy($bytes, 0, $p1, 0, $half)
[System.IO.File]::WriteAllBytes("app_payload_part1.dat", $p1)

$p2Size = $bytes.Length - $half
$p2 = New-Object byte[] $p2Size
[Array]::Copy($bytes, $half, $p2, 0, $p2Size)
[System.IO.File]::WriteAllBytes("app_payload_part2.dat", $p2)

Write-Host "Building Setup.csproj with newly embedded Winland payload..." -ForegroundColor Cyan
dotnet build --configuration Release Setup/Setup.csproj

Copy-Item -Path "Setup\bin\Release\net48\WinDock_Setup.exe" -Destination "WinDock_Setup.exe" -Force
Copy-Item -Path "Setup\bin\Release\net48\WinDock_Setup.exe" -Destination "C:\Users\sahil\OneDrive\Desktop\WinDock_Setup.exe" -Force
Write-Host "SUCCESS: Updated Desktop WinDock_Setup.exe!" -ForegroundColor Green
