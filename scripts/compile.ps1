Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Compiling WinDock using dotnet build..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$output = "WinDock.exe"

if (Test-Path $output) {
    Remove-Item $output -Force -ErrorAction SilentlyContinue
}
if (Test-Path "WinDockConsole.exe") {
    Remove-Item "WinDockConsole.exe" -Force -ErrorAction SilentlyContinue
}

# Run dotnet build
dotnet build --configuration Release WinDock.csproj
$buildExit = $LASTEXITCODE

if ($buildExit -eq 0) {
    # Copy output to root directory
    if (Test-Path "bin\Release\net48\WinDock.exe") {
        Copy-Item -Path "bin\Release\net48\WinDock.exe" -Destination "WinDock.exe" -Force
        if (Test-Path "bin\Release\net48\WinDock.pdb") {
            Copy-Item -Path "bin\Release\net48\WinDock.pdb" -Destination "WinDock.pdb" -Force
        }
        Copy-Item -Path "bin\Release\net48\WinDock.exe" -Destination "WinDockConsole.exe" -Force
    }
    elseif (Test-Path "bin\Debug\net48\WinDock.exe") {
        Copy-Item -Path "bin\Debug\net48\WinDock.exe" -Destination "WinDock.exe" -Force
        if (Test-Path "bin\Debug\net48\WinDock.pdb") {
            Copy-Item -Path "bin\Debug\net48\WinDock.pdb" -Destination "WinDock.pdb" -Force
        }
        Copy-Item -Path "bin\Debug\net48\WinDock.exe" -Destination "WinDockConsole.exe" -Force
    }

    Write-Host ""
    Write-Host "SUCCESS: Compiled WinDock successfully!" -ForegroundColor Green
    Write-Host "You can run it by executing .\WinDock.exe" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ERROR: Compilation failed. dotnet build exit code: $buildExit" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    exit 1
}
