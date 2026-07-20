[CmdletBinding()]
param (
    [Parameter(Mandatory=$true)]
    [ValidateSet('Bluetooth', 'WiFi')]
    [string]$RadioKind,

    [Parameter(Mandatory=$true)]
    [ValidateSet('On', 'Off')]
    [string]$State
)

try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

    function Await($WinRtTask, $ResultType) {
        $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
        $netTask = $asTask.Invoke($null, @($WinRtTask))
        $netTask.Wait(-1) | Out-Null
        $netTask.Result
    }

    [Windows.Devices.Radios.Radio,Windows.System.Devices,ContentType=WindowsRuntime] | Out-Null
    [Windows.Devices.Radios.RadioAccessStatus,Windows.System.Devices,ContentType=WindowsRuntime] | Out-Null

    $status = Await ([Windows.Devices.Radios.Radio]::RequestAccessAsync()) ([Windows.Devices.Radios.RadioAccessStatus])
    $radios = Await ([Windows.Devices.Radios.Radio]::GetRadiosAsync()) ([System.Collections.Generic.IReadOnlyList[Windows.Devices.Radios.Radio]])

    $radio = $radios | Where-Object { $_.Kind -eq $RadioKind }
    if ($radio) {
        [Windows.Devices.Radios.RadioState,Windows.System.Devices,ContentType=WindowsRuntime] | Out-Null
        $res = Await ($radio.SetStateAsync($State)) ([Windows.Devices.Radios.RadioAccessStatus])
        if ($res -eq 'Allowed') {
            Write-Output "Successfully turned $RadioKind $State."
        } else {
            Write-Error "Access denied when trying to turn $RadioKind $State. Result: $res"
        }
    } else {
        Write-Error "No $RadioKind radio device found on this system."
    }
} catch {
    Write-Error "Failed to change radio state: $_"
}
