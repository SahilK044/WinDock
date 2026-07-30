[void][System.Reflection.Assembly]::LoadWithPartialName("System.Runtime.WindowsRuntime")
[void][Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]

$async = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()
$mgr = [System.WindowsRuntimeSystemExtensions]::GetAwaiter($async).GetResult()

if ($mgr) {
  $s = $mgr.GetCurrentSession()
  if ($s) {
    $pAsync = $s.TryGetMediaPropertiesAsync()
    $props = [System.WindowsRuntimeSystemExtensions]::GetAwaiter($pAsync).GetResult()

    $timeline = $s.GetTimelineProperties()
    $posMs = [math]::Round($timeline.Position.TotalMilliseconds)
    $endMs = [math]::Round($timeline.EndTime.TotalMilliseconds)

    Write-Output "$($props.Title)|$($props.Artist)|$posMs|$endMs"
  }
}
