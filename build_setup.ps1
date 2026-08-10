$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "      Building WinDock Standalone Installer  " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$rootDir = Get-Location

# Step 1: Build WinDock Release binary
Write-Host "`n[1/4] Building WinDock Release binary..." -ForegroundColor Yellow
dotnet build --configuration Release WinDock.csproj
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build WinDock.csproj"
    exit 1
}

# Copy compiled binary to root
Copy-Item -Path "bin\Release\net48\WinDock.exe" -Destination "WinDock.exe" -Force
Copy-Item -Path "bin\Release\net48\WinDock.pdb" -Destination "WinDock.pdb" -Force

# Step 2: Package WinDock payload zip archive
Write-Host "`n[2/4] Packaging app_payload.zip..." -ForegroundColor Yellow
$payloadZip = Join-Path $rootDir "app_payload.zip"
if (Test-Path $payloadZip) {
    Remove-Item -Path $payloadZip -Force
}

$tempPayloadDir = Join-Path $rootDir "temp_payload"
if (Test-Path $tempPayloadDir) {
    Remove-Item -Path $tempPayloadDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempPayloadDir | Out-Null

# Copy WinDock core runtime files
Copy-Item -Path "WinDock.exe" -Destination $tempPayloadDir -Force
Copy-Item -Path "WinDock.pdb" -Destination $tempPayloadDir -Force
if (Test-Path "MacSettings.txt") { Copy-Item -Path "MacSettings.txt" -Destination $tempPayloadDir -Force }
if (Test-Path "windock.ico") { Copy-Item -Path "windock.ico" -Destination $tempPayloadDir -Force }
if (Test-Path "f1_logo_white.png") { Copy-Item -Path "f1_logo_white.png" -Destination $tempPayloadDir -Force }
if (Test-Path "f1_logo_black.png") { Copy-Item -Path "f1_logo_black.png" -Destination $tempPayloadDir -Force }

# Copy asset folders if present
$folders = @("F1 Cars", "Drivers", "Headshots", "Driver Number", "Team Logos", "Track")
foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Copy-Item -Path $folder -Destination (Join-Path $tempPayloadDir $folder) -Recurse -Force
    }
}

# Compress into app_payload.zip
Compress-Archive -Path "$tempPayloadDir\*" -DestinationPath $payloadZip -Force
Remove-Item -Path $tempPayloadDir -Recurse -Force

Write-Host "Created app_payload.zip ($( (Get-Item $payloadZip).Length / 1MB | ForEach-Object { '{0:N2}' -f $_ } ) MB)" -ForegroundColor Green

# Step 3: Build Setup Installer project
Write-Host "`n[3/4] Building Setup/Setup.csproj..." -ForegroundColor Yellow
dotnet build --configuration Release Setup/Setup.csproj
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build Setup/Setup.csproj"
    exit 1
}

# Step 4: Publish root installer executable
Write-Host "`n[4/4] Publishing WinDock_Setup.exe..." -ForegroundColor Yellow
$setupExeSrc = Join-Path $rootDir "Setup\bin\Release\net48\WinDock_Setup.exe"
$setupExeDest = Join-Path $rootDir "WinDock_Setup.exe"
Copy-Item -Path $setupExeSrc -Destination $setupExeDest -Force

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "  SUCCESS: Created $setupExeDest" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
