$procs = Get-Process -Name Spotify -ErrorAction SilentlyContinue
$main = $procs | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object -First 1
if ($main) {
  Write-Output $main.MainWindowTitle
}
