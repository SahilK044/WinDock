Add-Type -AssemblyName System.Runtime.WindowsRuntime -ErrorAction SilentlyContinue

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and
    $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

function Await-WinRt($WinRtAsync) {
    if (-not $WinRtAsync) { return $null }
    try {
        $iface = $WinRtAsync.GetType().GetInterfaces() | Where-Object { $_.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
        if (-not $iface) { return $null }
        $genericMethod = $asTaskGeneric.MakeGenericMethod($iface.GetGenericArguments())
        $task = $genericMethod.Invoke($null, @($WinRtAsync))
        $task.Wait()
        return $task.Result
    } catch {
        return $null
    }
}

try {
    [void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
    $asyncMgr = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
    $mgr = Await-WinRt $asyncMgr

    if ($mgr) {
        $session = $mgr.GetCurrentSession()
        if ($session) {
            $props = Await-WinRt ($session.TryGetMediaPropertiesAsync())
            $tl = $session.GetTimelineProperties()

            $title = if ($props -and $props.Title) { $props.Title } else { "" }
            $artist = if ($props -and $props.Artist) { $props.Artist } else { "" }
            $posMs = if ($tl) { [math]::Round($tl.Position.TotalMilliseconds) } else { 0 }
            $endMs = if ($tl) { [math]::Round($tl.EndTime.TotalMilliseconds) } else { 0 }

            if ($title -ne "") {
                Write-Output "$title|$artist|$posMs|$endMs"
                exit
            }
        }
    }
} catch {}

# Fallback to process window title
$procs = Get-Process -Name Spotify -ErrorAction SilentlyContinue
$main = $procs | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object -First 1
if ($main) {
    Write-Output "$($main.MainWindowTitle)|0|0"
}
