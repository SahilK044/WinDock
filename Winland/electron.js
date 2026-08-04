import { app, BrowserWindow, screen, ipcMain, globalShortcut, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, execFile } from 'child_process';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NOTE: no-sandbox / disable-http-cache were removed — the sandbox stays on and
// Chromium's HTTP cache makes album-art fetches cheap.

let mainWindow;
let isQuitting = false; // set when the user chooses Exit, so window-all-closed lets us go
let lastDetectedTitle = '';
let lastBatteryLevel = -1;
let lastChargingState = null;
let pollerInterval = null;
let batteryInterval = null;
let bluetoothInterval = null;
// Guards the Spotify poller — unlike the other pollers it had no in-flight guard,
// so a slow/missing spotify_info.exe let successive 800ms execs stack up unbounded.
let isPollingSpotify = false;
// Identity of the last track sent via the exe path (title|artist|playing). The
// album-art base64 is large, so it's only shipped over IPC when this changes.
let lastSpotifyTrack = '';
let posTracker = {
  rawPos: 0,             // Baseline position from GSMTC (ms)
  wallClockAtCapture: 0, // Date.now() when baseline rawPos was established
  isPlaying: false,      // Previous play state
  trackKey: '',          // Track title|artist identity
};
// null = not polled yet (next successful poll is the "initial" snapshot, no
// connect/disconnect notification should fire for it). Map<instanceId, {name, battery}>
// of devices we've confirmed (and told the UI) are connected.
let lastBluetoothDevices = null;
// Map<instanceId, missedPollCount> - devices confirmed-connected but absent from the
// most recent raw enumeration. Kept as a hook for tuning debounce if needed, but the
// real source of the spam was failed PowerShell polls being treated as mass
// disconnects (see the `if (err) return;` below) - that alone fixes it, so a missed
// device is reported disconnected on the very next real poll, same as before.
let bluetoothMissingStreaks = new Map();
// A confirmed-connected device must be absent for this many consecutive real polls
// before we declare a disconnect. 2 (instead of 1) stops a single flaky enumeration
// from firing a spurious "Disconnected" popup under WMI/system load.
const BLUETOOTH_DISCONNECT_CONFIRM_POLLS = 2;

// ── Settings ──────────────────────────────────────────────────────────────
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json');
const DEFAULT_SETTINGS = {
  autostart: false,
  reduceMotion: false,
  showBattery: true,
  showVolume: true,
  pollInterval: 2500,
};

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')) };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function writeSettings(data) {
  try {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return;
    fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    // Merge over defaults so the renderer can only ever persist known keys.
    const clean = {};
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (key in data) clean[key] = data[key];
    }
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify({ ...DEFAULT_SETTINGS, ...clean }, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write settings:', e);
  }
}

// Helper scripts are written under userData (ACL'd to this user) instead of the
// world-writable shared temp dir, so another process can't swap them out from
// under us between launches.
const SCRIPT_DIR = path.join(app.getPath('userData'), 'scripts');
fs.mkdirSync(SCRIPT_DIR, { recursive: true });

// ── WinDock config bridge (theme / weather / island prefs) ─────────────────
// WinDock (the .NET host) writes this file every time it refreshes the
// weather (~every 15 min, plus on launch) and whenever settings are saved.
// We read it once for the initial state, then watch it for changes.
const WINLAND_THEME_PATH = path.join(os.tmpdir(), 'winland_theme.json');

function readWinlandConfig() {
  try {
    if (!fs.existsSync(WINLAND_THEME_PATH)) return null;
    return JSON.parse(fs.readFileSync(WINLAND_THEME_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function broadcastWinlandConfig() {
  const data = readWinlandConfig();
  if (!data || !mainWindow || !mainWindow.webContents) return;
  mainWindow.webContents.send('config-update', data);
  if (data.theme) mainWindow.webContents.send('theme-update', { theme: data.theme });
}

function watchWinlandConfig() {
  // fs.watch is unreliable across platforms (esp. Windows) for files that don't
  // exist yet; watchFile's polling is slower but predictable, and WinDock only
  // rewrites this file every ~15 min (or on demand for settings changes), so a
  // 3s poll is plenty responsive without adding real overhead.
  fs.watchFile(WINLAND_THEME_PATH, { interval: 3000 }, (curr, prev) => {
    if (curr.mtimeMs !== prev.mtimeMs) broadcastWinlandConfig();
  });
}

function getSpotifyExePath() {
  if (app.isPackaged) {
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'scripts', 'spotify_info.exe');
    if (fs.existsSync(unpacked)) return unpacked;
    const resPath = path.join(process.resourcesPath, 'scripts', 'spotify_info.exe');
    if (fs.existsSync(resPath)) return resPath;
  }
  return path.join(__dirname, 'scripts', 'spotify_info.exe');
}

const PS1_SPOTIFY = path.join(SCRIPT_DIR, 'winland_spotify_poll.ps1');
fs.writeFileSync(PS1_SPOTIFY, [
  '$procs = Get-Process -Name Spotify -ErrorAction SilentlyContinue',
  '$main = $procs | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object -First 1',
  'if ($main) { Write-Output $main.MainWindowTitle }',
].join('\n'), 'utf8');

const PS1_BATTERY = path.join(SCRIPT_DIR, 'winland_battery_poll.ps1');
fs.writeFileSync(PS1_BATTERY, [
  '$b = Get-WmiObject Win32_Battery -ErrorAction SilentlyContinue | Select-Object -First 1',
  'if ($b) {',
  '  $charging = if ($b.BatteryStatus -eq 2) { "charging" } else { "discharging" }',
  '  $pct = $b.EstimatedChargeRemaining',
  '  $mins = $b.EstimatedRunTime',
  '  Write-Output "$pct|$charging|$mins"',
  '} else {',
  '  # Fallback via PowerStatus',
  '  Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue',
  '  $ps = [System.Windows.Forms.SystemInformation]::PowerStatus',
  '  $pct = [math]::Round($ps.BatteryLifePercent * 100)',
  '  $charging = if ($ps.PowerLineStatus -eq "Online") { "charging" } else { "discharging" }',
  '  $mins = if ($ps.BatteryLifeRemaining -gt 0) { [math]::Round($ps.BatteryLifeRemaining / 60) } else { -1 }',
  '  Write-Output "$pct|$charging|$mins"',
  '}',
].join('\n'), 'utf8');

// ── Window ─────────────────────────────────────────────────────────────────
function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  // Sized to fit the tallest/widest Dynamic Island state (expanded-lyrics: 390x300,
  // state-notification/expanded-call: 400 wide) plus margin so no state's rounded
  // corners get hard-clipped by the OS window bounds.
  const windowWidth = 470;
  const windowHeight = 360;

  mainWindow = new BrowserWindow({
    title: 'WinLand',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    width: windowWidth,
    height: windowHeight,
    x: Math.round((screenWidth - windowWidth) / 2),
    y: 12,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Sandboxed renderer: preload only needs contextBridge + ipcRenderer, both
      // of which work under the sandbox, so there's no reason to weaken it.
      sandbox: true,
      // This overlay is always-on-top and never focused, so Chromium's default
      // background throttling can cap its animation loops well below the
      // display's refresh rate. Disabling it lets the island, visualizer and
      // 3D previews run at the monitor's full rate (120/144Hz where available)
      // instead of being held down. The render loops are time-normalized, so a
      // higher frame rate makes them smoother, not faster.
      backgroundThrottling: false,
    },
  });

  // The island only ever displays its own local bundle — block any attempt to
  // navigate away or pop a new window (defense-in-depth behind the CSP).
  mainWindow.webContents.on('will-navigate', (e) => e.preventDefault());
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  const localDist = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(localDist)) {
    mainWindow.loadFile(localDist);
  } else {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadFile(localDist);
    });
  }

  mainWindow.on('closed', () => { mainWindow = null; });

  // Log renderer console messages to file for crash debugging. Batched + async:
  // appendFileSync per message blocked the main process on every renderer log.
  const logPath = path.join(os.tmpdir(), 'winland_renderer.log');
  fs.writeFileSync(logPath, `=== WinLand Renderer Log ${new Date().toISOString()} ===\n`);
  let logBuffer = [];
  let logFlushTimer = null;
  const flushLog = () => {
    logFlushTimer = null;
    if (logBuffer.length === 0) return;
    const chunk = logBuffer.join('');
    logBuffer = [];
    fs.appendFile(logPath, chunk, () => {});
  };
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const prefix = ['LOG', 'WARN', 'ERROR'][level] || 'LOG';
    logBuffer.push(`[${prefix}] ${message} (${sourceId}:${line})\n`);
    if (!logFlushTimer) logFlushTimer = setTimeout(flushLog, 1000);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('RENDERER CRASHED:', details.reason, details.exitCode);
    // Recover: recreate the window
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
    }
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('WEBCONTENTS CRASHED - recovering');
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
    }
  });

  mainWindow.on('unresponsive', () => {
    console.error('WINDOW UNRESPONSIVE');
  });

  setTimeout(() => {
    startSpotifyPoller();
    startBatteryPoller();
    startBluetoothPoller();
    startFullscreenPoller();
    registerVolumeKeys();
    watchWinlandConfig();
    broadcastWinlandConfig();

    // Periodically re-assert alwaysOnTop every 5s so Windows never pushes us behind other apps
    setInterval(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
      }
    }, 5000);
  }, 1500);
}

let settingsWindow = null;

function createSettingsWindow() {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  const w = 880;
  const h = 560;

  settingsWindow = new BrowserWindow({
    title: 'WinLand Settings',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    width: w,
    height: h,
    x: Math.round((screenWidth - w) / 2),
    y: Math.round((screenHeight - h) / 2),
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    hasShadow: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  settingsWindow.webContents.on('will-navigate', (e) => e.preventDefault());
  settingsWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  settingsWindow.setAlwaysOnTop(true, 'screen-saver');

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    settingsWindow.loadFile(indexPath, { search: 'route=settings', hash: 'settings' });
  } else {
    settingsWindow.loadURL('http://localhost:5173?route=settings#settings').catch(() => {
      settingsWindow.loadFile(indexPath, { search: 'route=settings', hash: 'settings' });
    });
  }

  settingsWindow.show();
  settingsWindow.focus();

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function pollSpotifyTitle() {
  if (!mainWindow || !mainWindow.webContents || isPollingSpotify) return;
  isPollingSpotify = true;
  let doneCalled = false;
  const done = () => {
    if (!doneCalled) {
      doneCalled = true;
      isPollingSpotify = false;
    }
  };
  const safetyTimer = setTimeout(done, 8500);

  const exePath = getSpotifyExePath();

  if (fs.existsSync(exePath)) {
    // runtime; client-side extrapolation smooths the bar between snapshots.
    exec(`"${exePath}"`, { timeout: 8000 }, (err, stdout) => {
      if (!mainWindow || !mainWindow.webContents) { done(); return; }
      const raw = (stdout || '').trim();
      if (raw) {
        let posMs = 0;
        let endMs = 0;
        let isPlaying = true;

        if (raw.includes('|')) {
          const parts = raw.split('|');
          const gTitle = parts[0] || '';
          const gArtist = parts[1] || '';
          const rawPosSnapshotMs = parseInt(parts[2], 10) || 0;
          endMs = parseInt(parts[3], 10) || 0;
          const coverPath = parts[5] || '';
          const gsmtcTimestamp = parseInt(parts[7], 10) || 0;
          let coverUrl = null;
          if (coverPath && fs.existsSync(coverPath)) {
            try {
              const buf = fs.readFileSync(coverPath);
              if (buf && buf.length > 0) {
                const isPng = buf[0] === 0x89 && buf[1] === 0x50;
                const isWebp = buf[0] === 0x52 && buf[1] === 0x49;
                const mime = isPng ? 'image/png' : (isWebp ? 'image/webp' : 'image/jpeg');
                coverUrl = `data:${mime};base64,${buf.toString('base64')}`;
              }
            } catch {}
          }

          const hasTrack = gTitle.length > 0 && gTitle !== 'Spotify' && gTitle !== 'Spotify Free' && gTitle !== 'Spotify Premium';
          isPlaying = parts[4] === '1';

          if (hasTrack) {
            // ── Monotonic Smooth Position Extrapolation ───────────────────
            // GSMTC returns periodic Position snapshots. Between snapshots,
            // we extrapolate smoothly using wall-clock time. We re-baseline
            // ONLY on track change, play/pause toggle, seek (>3s jump), or startup.
            const now = Date.now();

            // GSMTC hands back a Position captured at LastUpdatedTime, not at
            // the moment we asked — the player only pushes a new timeline when
            // something changes, so the snapshot can be many seconds old. Age
            // it forward before use, or every reading starts life behind and
            // the whole extrapolation below inherits that offset. This is what
            // made progress wrong when WinLand was started mid-song: it
            // baselined on a stale snapshot and then tracked in parallel to
            // the real position, permanently behind it.
            let snapshotAgeMs = 0;
            if (isPlaying && gsmtcTimestamp > 0) {
              const age = now - gsmtcTimestamp;
              // Ignore nonsense (clock skew, or a timestamp we failed to read)
              // rather than trusting it and jumping somewhere arbitrary.
              if (age > 0 && age < 60000) snapshotAgeMs = age;
            }
            let rawPosMs = rawPosSnapshotMs + snapshotAgeMs;
            if (endMs > 0 && rawPosMs > endMs) rawPosMs = endMs;

            const trackId = `${gTitle}|${gArtist}`;
            const isNewTrack = trackId !== posTracker.trackKey;
            const playStateChanged = isPlaying !== posTracker.isPlaying;

            const expectedPosMs = posTracker.wallClockAtCapture > 0
              ? posTracker.rawPos + (posTracker.isPlaying ? (now - posTracker.wallClockAtCapture) : 0)
              : rawPosMs;

            const posJumped = Math.abs(rawPosMs - expectedPosMs) > 3000 || (rawPosMs < posTracker.rawPos - 1500);

            if (isNewTrack || playStateChanged || posJumped || posTracker.wallClockAtCapture === 0) {
              posTracker = {
                rawPos: rawPosMs,
                wallClockAtCapture: now,
                isPlaying: isPlaying,
                trackKey: trackId,
              };
              posMs = rawPosMs;
            } else {
              if (isPlaying) {
                const elapsed = now - posTracker.wallClockAtCapture;
                posMs = posTracker.rawPos + elapsed;
              } else {
                posMs = posTracker.rawPos;
              }
            }

            // Clamp to duration
            if (endMs > 0 && posMs > endMs) posMs = endMs;

            // Track identity — lets us keep the live-progress send every tick while
            // only shipping the (large) album-art base64 over IPC when the art
            // actually changes.
            const trackKey = `${gTitle}|${gArtist}|${isPlaying ? '1' : '0'}`;
            const trackChanged = trackKey !== lastSpotifyTrack;
            lastSpotifyTrack = trackKey;
            if (trackChanged) lastDetectedTitle = `${gTitle} - ${gArtist}`;
            mainWindow.webContents.send('system-media-update', {
              title: gTitle,
              artist: gArtist,
              posMs: Math.round(posMs),
              endMs,
              isPlaying,
              coverUrl: coverUrl || null,
            });
            done();
            return;
          }
        }
      }
      fallbackSpotifyPoll(done);
    });
  } else {
    fallbackSpotifyPoll(done);
  }
}

function fallbackSpotifyPoll(onDone) {
  exec(PS_SPOTIFY_CMD, { timeout: 5000 }, (err, stdout) => {
    if (onDone) onDone();
    if (!mainWindow || !mainWindow.webContents) return;
    const title = (stdout || '').trim();
    const isPlaying = title.length > 0 && title !== 'Spotify' && title !== 'Spotify Free' && title !== 'Spotify Premium';

    if (isPlaying) {
      if (title !== lastDetectedTitle) {
        lastDetectedTitle = title;
        mainWindow.webContents.send('system-media-update', title);
      }
    } else {
      if (lastDetectedTitle !== '__NO_MEDIA__') {
        lastDetectedTitle = '__NO_MEDIA__';
        mainWindow.webContents.send('system-media-update', '__NO_MEDIA__');
      }
    }
  });
}

function startSpotifyPoller() {
  if (pollerInterval) clearInterval(pollerInterval);
  isPollingSpotify = false;
  lastSpotifyTrack = '';
  pollSpotifyTitle();
  pollerInterval = setInterval(pollSpotifyTitle, 800);
}

let isPollingBattery = false;

function pollBattery() {
  if (!mainWindow || !mainWindow.webContents || isPollingBattery) return;
  isPollingBattery = true;

  exec(PS_BATTERY_CMD, { timeout: 8000 }, (err, stdout) => {
    isPollingBattery = false;
    if (!mainWindow || !mainWindow.webContents) return;
    const raw = (stdout || '').trim();
    if (!raw) return;

    const parts = raw.split('|');
    const pct = parseInt(parts[0], 10);
    const charging = parts[1] === 'charging';
    const minsLeft = parseInt(parts[2], 10);

    if (isNaN(pct) || pct < 0 || pct > 100) return;

    const changed = pct !== lastBatteryLevel || charging !== lastChargingState;
    lastBatteryLevel = pct;
    lastChargingState = charging;

    mainWindow.webContents.send('battery-update', { pct, charging, minsLeft, changed });
  });
}

function startBatteryPoller() {
  if (batteryInterval) clearInterval(batteryInterval);
  pollBattery();
  batteryInterval = setInterval(pollBattery, 30000);
}

// ── Bluetooth Connect/Disconnect Poller ─────────────────────────────────────
// Get-PnpDevice reports Bluetooth PnP nodes. We filter to actual paired accessories
// and check DEVPKEY_Device_IsConnected ({83DA63EC-97A6-4640-9453-A630571B6028} 15)
// to accurately detect real-time connect/disconnect states.
// Real-time AudioEndpoint Bluetooth Device & Battery Level Detector.
const PS1_BLUETOOTH = path.join(SCRIPT_DIR, 'winland_bluetooth_poll.ps1');
fs.writeFileSync(PS1_BLUETOOTH, [
  '$connected = @{}',
  '# 1. USB Connected Phones (Class WPD)',
  '$wpd = Get-PnpDevice -Class WPD -PresentOnly -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "OK" -and $_.FriendlyName }',
  'foreach ($w in $wpd) {',
  '  $cleanName = ($w.FriendlyName -replace "\\s*(Avrcp Transport|Hands-Free|AG|HF|Audio).*", "").Trim()',
  '  if ($cleanName -and $cleanName -notmatch "Enumerator|Service|Protocol|Transport|Attribute|Adapter|Controller|Hub|Root|Interface|Composite|Gateway|Push|Access|Serial|LE|RFCOMM|Intel\\(R\\)|Microsoft|Realtek|Bluetooth") {',
  '    if (-not $connected.ContainsKey($cleanName)) {',
  '      $connected[$cleanName] = @{ id = $cleanName; name = $cleanName; bat = -1; type = "phone" }',
  '    }',
  '  }',
  '}',
  '# 2. Active Audio Endpoints (Earbuds, Headphones, Bluetooth Speakers)',
  '$audio = Get-PnpDevice -Class AudioEndpoint -PresentOnly -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "OK" -and $_.FriendlyName }',
  'foreach ($a in $audio) {',
  '  $name = $a.FriendlyName',
  '  if ($name -match "Realtek|High Definition Audio|Default|Communications|Stereo Mix|Virtual|Steam|NVIDIA|DisplayAudio|Odyssey|7\\.1 Surround|Microphone") {',
  '    continue',
  '  }',
  '  if ($name -match "^(Headphones|Headset|Speakers)\\s*\\((.*)\\)$") {',
  '    $clean = $Matches[2].Trim()',
  '  } else {',
  '    $clean = $name.Trim()',
  '  }',
  '  $clean = ($clean -replace "\\s*(Hands-Free|AG|HF|Stereo|Audio|Avrcp Transport).*", "").Trim()',
  '  if ($clean -and -not $connected.ContainsKey($clean)) {',
  '    $connected[$clean] = @{ id = $clean; name = $clean; bat = -1; type = "audio" }',
  '  }',
  '}',
  '# 3. Bluetooth Phones (BTHENUM with IsConnected property)',
  '$bt = Get-PnpDevice -Class Bluetooth -PresentOnly -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "OK" -and $_.FriendlyName }',
  'foreach ($b in $bt) {',
  '  $name = $b.FriendlyName',
  '  if ($name -match "Enumerator|Service|Protocol|Transport|Attribute|Adapter|Controller|Hub|Root|Interface|Composite|Gateway|Push|Access|Serial|LE|RFCOMM|Intel\\(R\\)|Microsoft|Realtek|Bluetooth|Hands-Free") {',
  '    continue',
  '  }',
  '  $isConn = $false',
  '  try {',
  '    $prop = Get-PnpDeviceProperty -InstanceId $b.InstanceId -KeyName "{83DA6326-97A6-4088-9453-A630571B6028} 15" -ErrorAction SilentlyContinue',
  '    if ($prop -and $null -ne $prop.Data) {',
  '      $isConn = [bool]$prop.Data',
  '    }',
  '  } catch {}',
  '  if ($isConn) {',
  '    $cleanName = ($name -replace "\\s*(Avrcp Transport|Hands-Free|AG|HF|Audio).*", "").Trim()',
  '    if ($cleanName -and -not $connected.ContainsKey($cleanName)) {',
  '      $connected[$cleanName] = @{ id = $cleanName; name = $cleanName; bat = -1; type = "phone" }',
  '    }',
  '  }',
  '}',
  'foreach ($item in $connected.Values) {',
  '  Write-Output "$($item.id)|$($item.name)|$($item.bat)|$($item.type)"',
  '}',
].join('\n'), 'utf8');

function parseBluetoothOutput(stdout) {
  const devices = new Map();
  const lines = (stdout || '').split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const parts = line.split('|');
    if (parts.length < 2 || !parts[0]) continue;
    const id = parts[0];
    const name = (parts[1] || 'Bluetooth Device').trim();
    const batteryRaw = parseInt(parts[2], 10);
    const battery = (!isNaN(batteryRaw) && batteryRaw >= 0 && batteryRaw <= 100) ? batteryRaw : null;
    const typeStr = (parts[3] || 'audio').trim();
    devices.set(id, { name, battery, typeStr });
  }
  return devices;
}

let isPollingBluetooth = false;

function pollBluetooth() {
  if (!mainWindow || !mainWindow.webContents || isPollingBluetooth) return;
  isPollingBluetooth = true;

  exec(PS_BLUETOOTH_CMD, { timeout: 6000, maxBuffer: 1024 * 512 }, (err, stdout) => {
    isPollingBluetooth = false;
    if (!mainWindow || !mainWindow.webContents) return;

    if (err) {
      return;
    }

    const raw = parseBluetoothOutput(stdout);

    if (lastBluetoothDevices === null) {
      // Initial scan: populate confirmed devices and notify renderer of primary connected device
      lastBluetoothDevices = new Map(raw);
      if (raw.size > 0) {
        const [, firstDev] = Array.from(raw.entries())[0];
        mainWindow.webContents.send('bluetooth-update', {
          deviceName: firstDev.name,
          batteryPct: firstDev.battery,
          isCharging: false,
          leftPct: null,
          rightPct: null,
          typeStr: firstDev.typeStr || 'phone',
          connectionState: 'connected',
          isInitial: false,
        });
      }
      return;
    }

    const confirmed = lastBluetoothDevices;

    // Newly connected devices: present now, weren't confirmed-connected before.
    for (const [id, info] of raw) {
      bluetoothMissingStreaks.delete(id); // seen again - cancel any pending disconnect
      if (!confirmed.has(id)) {
        confirmed.set(id, info);
        lastBluetoothDevices = confirmed;
        mainWindow.webContents.send('bluetooth-update', {
          deviceName: info.name,
          batteryPct: info.battery,
          isCharging: false,
          leftPct: null,
          rightPct: null,
          typeStr: info.typeStr || 'phone',
          connectionState: 'connected',
          isInitial: false,
        });
        return; // one event per tick keeps rapid multi-device changes from racing each other
      }
      confirmed.set(id, info); // keep name/battery fresh for already-confirmed devices
    }

    // Devices confirmed-connected but missing from this poll: declare a disconnect.
    for (const [id, info] of confirmed) {
      if (raw.has(id)) continue;

      const streak = (bluetoothMissingStreaks.get(id) || 0) + 1;
      if (streak < BLUETOOTH_DISCONNECT_CONFIRM_POLLS) {
        bluetoothMissingStreaks.set(id, streak);
        continue;
      }

      bluetoothMissingStreaks.delete(id);
      confirmed.delete(id);
      lastBluetoothDevices = confirmed;
      mainWindow.webContents.send('bluetooth-update', {
        deviceName: info.name,
        batteryPct: info.battery,
        isCharging: false,
        leftPct: null,
        rightPct: null,
        connectionState: 'disconnected',
        isInitial: false,
      });
      return;
    }

    lastBluetoothDevices = confirmed;
  });
}

ipcMain.on('trigger-phone-notification', () => {
  if (!mainWindow || !mainWindow.webContents) return;
  mainWindow.webContents.send('bluetooth-update', {
    deviceName: "Sahil's S24 Ultra",
    batteryPct: 88,
    isCharging: false,
    leftPct: null,
    rightPct: null,
    typeStr: 'phone',
    connectionState: 'connected',
    isInitial: false,
  });
});

function startBluetoothPoller() {
  if (bluetoothInterval) clearInterval(bluetoothInterval);
  lastBluetoothDevices = null;
  bluetoothMissingStreaks.clear();
  isPollingBluetooth = false;
  pollBluetooth();
  bluetoothInterval = setInterval(pollBluetooth, 6000);
}

// ── Fullscreen App Detector ─────────────────────────────────────────────────
const EXE_FULLSCREEN = app.isPackaged
  ? path.join(process.resourcesPath, 'scripts', 'fullscreen_check.exe')
  : path.join(__dirname, 'scripts', 'fullscreen_check.exe');

let lastFullscreenState = false;
let isPollingFullscreen = false;
let fullscreenInterval = null;

function pollFullscreen() {
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.webContents || isPollingFullscreen) return;
  isPollingFullscreen = true;

  exec(`"${EXE_FULLSCREEN}"`, { timeout: 2000 }, (err, stdout) => {
    isPollingFullscreen = false;
    if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.webContents) return;

    const raw = (stdout || '').trim();
    const isFullscreen = raw === 'FULLSCREEN';

    if (isFullscreen !== lastFullscreenState) {
      lastFullscreenState = isFullscreen;
      if (isFullscreen) {
        mainWindow.webContents.send('fullscreen-state', true);
        setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed() && lastFullscreenState) {
            mainWindow.hide();
          }
        }, 400);
      } else {
        mainWindow.showInactive();
        mainWindow.setAlwaysOnTop(true, 'screen-saver');
        mainWindow.webContents.send('fullscreen-state', false);
      }
    }
  });
}

function startFullscreenPoller() {
  if (fullscreenInterval) clearInterval(fullscreenInterval);
  pollFullscreen();
  fullscreenInterval = setInterval(pollFullscreen, 2000);
}

const PS1_VOLUME = path.join(os.tmpdir(), 'winland_volume_poll.ps1');
fs.writeFileSync(PS1_VOLUME, [
  'Add-Type -TypeDefinition @"',
  'using System;',
  'using System.Runtime.InteropServices;',
  'namespace NativeAudio {',
  '  [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]',
  '  interface IAudioEndpointVolume {',
  '    int RegisterControlChangeNotify(IntPtr pNotify);',
  '    int UnregisterControlChangeNotify(IntPtr pNotify);',
  '    int GetChannelCount(out uint pnChannelCount);',
  '    int SetMasterVolumeLevel(float fLevelDB, Guid pguidEventContext);',
  '    int SetMasterVolumeLevelScalar(float fLevelScalar, Guid pguidEventContext);',
  '    int GetMasterVolumeLevel(out float pfLevelDB);',
  '    int GetMasterVolumeLevelScalar(out float pfLevelScalar);',
  '  }',
  '  [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]',
  '  interface IMMDevice {',
  '    int Activate(ref Guid iid, uint dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);',
  '  }',
  '  [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]',
  '  interface IMMDeviceEnumerator {',
  '    int EnumAudioEndpoints(int dataFlow, int dwStateMask, out object ppDevices);',
  '    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);',
  '  }',
  '  [ComImport, Guid("BCDE0385-4D65-4F76-9C2C-4540B3F33549")] class MMDeviceEnumeratorComObject { }',
  '  public class Audio {',
  '    public static float GetMasterVolume() {',
  '      try {',
  '        var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());',
  '        IMMDevice dev;',
  '        enumerator.GetDefaultAudioEndpoint(0, 1, out dev);',
  '        var iid = typeof(IAudioEndpointVolume).GUID;',
  '        object obj;',
  '        dev.Activate(ref iid, 23, IntPtr.Zero, out obj);',
  '        var endpoint = (IAudioEndpointVolume)obj;',
  '        float vol;',
  '        endpoint.GetMasterVolumeLevelScalar(out vol);',
  '        return vol * 100f;',
  '      } catch { return 50f; }',
  '    }',
  '  }',
  '}',
  '"@ -ErrorAction SilentlyContinue',
  '[math]::Round([NativeAudio.Audio]::GetMasterVolume())',
].join('\n'), 'utf8');

const PS_VOLUME_CMD = `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${PS1_VOLUME}"`;

// ── Volume Key Interception ────────────────────────────────────────────────
function registerVolumeKeys() {
  const getVolume = () => {
    exec(PS_VOLUME_CMD, { timeout: 3000 }, (err, stdout) => {
      const vol = parseInt((stdout || '').trim(), 10);
      if (!isNaN(vol) && mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('volume-update', { vol });
      }
    });
  };

  const keyMap = {
    VolumeUp: 175,
    VolumeDown: 174,
    VolumeMute: 173,
  };

  Object.entries(keyMap).forEach(([key, charCode]) => {
    try {
      globalShortcut.register(key, () => {
        exec(`cscript //nologo "${VBS_MEDIA}" ${charCode}`, { timeout: 2000 }, () => {
          setTimeout(getVolume, 100);
        });
      });
    } catch {}
  });
}

// Pre-created media control script (zero per-click disk I/O latency)
const VBS_MEDIA = path.join(os.tmpdir(), 'winland_media.vbs');
try {
  fs.writeFileSync(VBS_MEDIA, 'Set w = CreateObject("WScript.Shell")\nw.SendKeys Chr(WScript.Arguments(0))\n', 'utf8');
} catch {}

function forceRefreshMediaInfo() {
  isPollingSpotify = false;
  lastSpotifyTrack = '';
  const delays = [150, 400, 800, 1400, 2200];
  delays.forEach((delay) => {
    setTimeout(() => {
      isPollingSpotify = false;
      pollSpotifyTitle();
    }, delay);
  });
}

ipcMain.on('media-control', (event, action) => {
  if (typeof action === 'object' && action.action === 'seek') {
    const exePath = getSpotifyExePath();
    const posMs = action.posMs || 0;
    if (fs.existsSync(exePath)) {
      exec(`"${exePath}" seek ${Math.round(posMs)}`, { timeout: 8000 }, () => {
        forceRefreshMediaInfo();
      });
    }
    return;
  }

  let charCode = 179; // Play/Pause
  if (action === 'next') charCode = 176;
  if (action === 'previous') charCode = 177;

  exec(`cscript //nologo "${VBS_MEDIA}" ${charCode}`, { timeout: 2000 }, () => {
    forceRefreshMediaInfo();
  });
});

ipcMain.on('resize-window', (_event, { width: _width, height: _height }) => {
  // Fixed window stage: OS window does not resize dynamically.
  // CSS spring animation inside webview handles fluid morphing without DWM sharp rectangle artifacts.
});

ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    if (ignore) {
      win.setIgnoreMouseEvents(true, { forward: true });
    } else {
      win.setIgnoreMouseEvents(false);
    }
  }
});

ipcMain.handle('read-settings', () => readSettings());
ipcMain.on('write-settings', (event, data) => writeSettings(data));
ipcMain.handle('get-initial-config', () => readWinlandConfig());
ipcMain.handle('get-bluetooth-state', () => {
  if (lastBluetoothDevices && lastBluetoothDevices.size > 0) {
    const [, info] = Array.from(lastBluetoothDevices.entries())[0];
    return {
      deviceName: info.name,
      batteryPct: info.battery,
      isCharging: false,
      leftPct: null,
      rightPct: null,
      connectionState: 'connected',
      isInitial: false,
    };
  }
  return null;
});

ipcMain.on('open-path', (event, filePath) => {
  if (filePath) {
    shell.openPath(filePath).catch(() => {
      execFile('explorer.exe', [filePath]);
    });
  }
});

// Device / animation preferences live in the Settings window but are consumed
// by the island, which is a separate renderer. Relay changes so the island
// updates live instead of only picking them up on next launch.
ipcMain.on('device-prefs-changed', (event, prefs) => {
  for (const win of BrowserWindow.getAllWindows()) {
    if (win.webContents !== event.sender && !win.isDestroyed()) {
      win.webContents.send('device-prefs-update', prefs);
    }
  }
});

ipcMain.on('open-settings-window', () => {
  createSettingsWindow();
});

ipcMain.on('close-settings-window', () => {
  if (settingsWindow) {
    settingsWindow.close();
    settingsWindow = null;
  }
});

ipcMain.on('launch-app', (event, cmd) => {
  switch (cmd) {
    case 'browser':
      shell.openExternal('https://www.google.com');
      break;
    case 'spotify':
      shell.openExternal('spotify:');
      break;
    case 'explorer':
      execFile('explorer.exe', [], (err) => {
        if (err) console.error('Failed to launch explorer.exe:', err);
      });
      break;
    case 'terminal':
      execFile('cmd.exe', [], { detached: true }, (err) => {
        if (err) console.error('Failed to launch cmd.exe:', err);
      });
      break;
    case 'settings':
      createSettingsWindow();
      break;
    case 'exit':
      // User asked to shut WinLand down from the launcher, so they no longer
      // have to kill it from Task Manager. app.quit() runs the normal quit
      // path (will-quit cleanup below). This app keeps itself alive on
      // window-all-closed to stay resident as an overlay, so as a guarantee we
      // force-exit shortly after in case that keeps the quit from completing.
      isQuitting = true;
      app.quit();
      setTimeout(() => app.exit(0), 600);
      break;
    default:
      // Unrecognized command — do not shell-exec arbitrary renderer input.
      console.warn('Ignored unrecognized launch-app command:', cmd);
  }
});

ipcMain.on('trigger-bluetooth-demo', (event, customDevice) => {
  if (!mainWindow || !mainWindow.webContents) return;
  const name = typeof customDevice === 'string' ? customDevice : (customDevice?.deviceName || 'AirPods Pro');
  mainWindow.webContents.send('bluetooth-update', {
    deviceName: name,
    batteryPct: customDevice?.batteryPct ?? 88,
    isCharging: false,
    leftPct: customDevice?.leftPct ?? 85,
    rightPct: customDevice?.rightPct ?? 90,
    connectionState: 'connected',
    isInitial: false,
  });
});

ipcMain.on('trigger-bluetooth-disconnect', (event, customDevice) => {
  if (!mainWindow || !mainWindow.webContents) return;
  const name = typeof customDevice === 'string' ? customDevice : (customDevice?.deviceName || 'AirPods Pro');
  mainWindow.webContents.send('bluetooth-update', {
    deviceName: name,
    batteryPct: null,
    isCharging: false,
    leftPct: null,
    rightPct: null,
    connectionState: 'disconnected',
    isInitial: false,
  });
});

ipcMain.on('trigger-bluetooth-low-battery', (event, customDevice, pct) => {
  if (!mainWindow || !mainWindow.webContents) return;
  const name = typeof customDevice === 'string' ? customDevice : (customDevice?.deviceName || 'AirPods Pro');
  mainWindow.webContents.send('bluetooth-update', {
    deviceName: name,
    batteryPct: pct || 15,
    isCharging: false,
    leftPct: 12,
    rightPct: 15,
    connectionState: 'low-battery',
    isInitial: false,
  });
});

// ── App Lifecycle & Safety ──────────────────────────────────────────────────
const mainCrashLog = path.join(os.tmpdir(), 'winland_main_crash.log');

process.on('uncaughtException', (err) => {
  console.error('WinLand Uncaught Exception:', err);
  try {
    fs.appendFileSync(mainCrashLog, `[${new Date().toISOString()}] Uncaught Exception: ${err?.stack || err}\n`);
  } catch {}
});

process.on('unhandledRejection', (reason) => {
  console.error('WinLand Unhandled Rejection:', reason);
  try {
    fs.appendFileSync(mainCrashLog, `[${new Date().toISOString()}] Unhandled Rejection: ${reason?.stack || reason}\n`);
  } catch {}
});

app.whenReady().then(createWindow);

app.on('window-all-closed', (e) => {
  // Stay resident as an overlay when the window is merely closed — but not when
  // the user explicitly chose Exit, or we'd block our own shutdown.
  if (!isQuitting) e.preventDefault();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (pollerInterval) clearInterval(pollerInterval);
  if (batteryInterval) clearInterval(batteryInterval);
  if (fullscreenInterval) clearInterval(fullscreenInterval);
  if (bluetoothInterval) clearInterval(bluetoothInterval);
  fs.unwatchFile(WINLAND_THEME_PATH);
});
