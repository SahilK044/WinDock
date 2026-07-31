import { app, BrowserWindow, screen, ipcMain, globalShortcut, nativeTheme, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, execFile } from 'child_process';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let lastDetectedTitle = '';
let lastBatteryLevel = -1;
let lastChargingState = null;
let pollerInterval = null;
let batteryInterval = null;
let bluetoothInterval = null;
// null = not polled yet (next successful poll is the "initial" snapshot, no
// connect/disconnect notification should fire for it). Map<instanceId, {name, battery}>.
let lastBluetoothDevices = null;

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
    fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write settings:', e);
  }
}

// ── WinDock config bridge (theme / weather / island prefs) ─────────────────
// WinDock (the .NET host) writes this file every time it refreshes the
// weather (~every 15 min, plus on launch) and whenever settings are saved.
// We read it once for the initial state, then watch it for changes.
const WINLAND_THEME_PATH = path.join(os.tmpdir(), 'winland_theme.json');

function readWinlandConfig() {
  try {
    if (!fs.existsSync(WINLAND_THEME_PATH)) return null;
    return JSON.parse(fs.readFileSync(WINLAND_THEME_PATH, 'utf8'));
  } catch (e) {
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

const PS1_SPOTIFY = path.join(os.tmpdir(), 'winland_spotify_poll.ps1');
fs.writeFileSync(PS1_SPOTIFY, [
  '$procs = Get-Process -Name Spotify -ErrorAction SilentlyContinue',
  '$main = $procs | Where-Object { $_.MainWindowTitle -ne "" } | Select-Object -First 1',
  'if ($main) { Write-Output $main.MainWindowTitle }',
].join('\n'), 'utf8');

const PS_SPOTIFY_CMD = `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${PS1_SPOTIFY}"`;
const PS1_BATTERY = path.join(os.tmpdir(), 'winland_battery_poll.ps1');
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

const PS_BATTERY_CMD = `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${PS1_BATTERY}"`;

// ── Window ─────────────────────────────────────────────────────────────────
function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  // Sized to fit the tallest/widest Dynamic Island state (expanded-lyrics: 390x300,
  // state-notification/expanded-call: 400 wide) plus margin so no state's rounded
  // corners get hard-clipped by the OS window bounds.
  const windowWidth = 440;
  const windowHeight = 340;

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
    },
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173').catch(() => {
      mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    });
  }

  mainWindow.on('closed', () => { mainWindow = null; });

  setTimeout(() => {
    startSpotifyPoller();
    startBatteryPoller();
    startFullscreenPoller();
    startBluetoothPoller();
    registerVolumeKeys();
    watchWinlandConfig();
    broadcastWinlandConfig();
  }, 1500);
}

function pollSpotifyTitle() {
  if (!mainWindow || !mainWindow.webContents) return;

  const exePath = getSpotifyExePath();

  if (fs.existsSync(exePath)) {
    exec(`"${exePath}"`, { timeout: 3000 }, (err, stdout) => {
      if (!mainWindow || !mainWindow.webContents) return;
      const raw = (stdout || '').trim();
      if (raw) {
        let title = raw;
        let posMs = 0;
        let endMs = 0;
        let isPlaying = true;

        if (raw.includes('|')) {
          const parts = raw.split('|');
          const gTitle = parts[0] || '';
          const gArtist = parts[1] || '';
          posMs = parseInt(parts[2], 10) || 0;
          endMs = parseInt(parts[3], 10) || 0;
          const coverPath = parts[5] || '';
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
            } catch (e) {}
          }

          const hasTrack = gTitle.length > 0 && gTitle !== 'Spotify' && gTitle !== 'Spotify Free' && gTitle !== 'Spotify Premium';
          isPlaying = parts[4] === '1';

          if (hasTrack) {
            lastDetectedTitle = `${gTitle} - ${gArtist}`;
            mainWindow.webContents.send('system-media-update', {
              title: gTitle,
              artist: gArtist,
              posMs,
              endMs,
              isPlaying,
              coverUrl,
            });
            return;
          }
        }
      }
      fallbackSpotifyPoll();
    });
  } else {
    fallbackSpotifyPoll();
  }
}

function fallbackSpotifyPoll() {
  exec(PS_SPOTIFY_CMD, { timeout: 5000 }, (err, stdout) => {
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
  pollSpotifyTitle();
  pollerInterval = setInterval(pollSpotifyTitle, 800);
}

// ── Battery Poller ──────────────────────────────────────────────────────────
function pollBattery() {
  if (!mainWindow || !mainWindow.webContents) return;

  exec(PS_BATTERY_CMD, { timeout: 8000 }, (err, stdout) => {
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
// Get-PnpDevice reports every Bluetooth PnP node (radio, RFCOMM channels,
// HID, audio, etc.) - we filter down to the handful that represent an actual
// paired accessory so the adapter itself never shows up as a "device".
const PS1_BLUETOOTH = path.join(os.tmpdir(), 'winland_bluetooth_poll.ps1');
fs.writeFileSync(PS1_BLUETOOTH, [
  '$devices = Get-PnpDevice -Class Bluetooth -PresentOnly -ErrorAction SilentlyContinue |',
  "  Where-Object { $_.Status -eq 'OK' -and $_.FriendlyName -and $_.FriendlyName -notmatch 'Bluetooth (Radio|Enumerator|Adapter|Peripheral Device)|Microsoft Bluetooth|Generic Bluetooth|RFCOMM' }",
  'foreach ($d in $devices) {',
  '  $bat = -1',
  '  try {',
  "    $prop = Get-PnpDeviceProperty -InstanceId $d.InstanceId -KeyName '{104EA319-6EE2-4701-BD47-8DDBF425BBE5} 2' -ErrorAction SilentlyContinue",
  '    if ($prop -and $null -ne $prop.Data) { $bat = [int]$prop.Data }',
  '  } catch {}',
  "  $name = ($d.FriendlyName -replace '[|]', '/').Trim()",
  '  Write-Output "$($d.InstanceId)|$name|$bat"',
  '}',
].join('\n'), 'utf8');

const PS_BLUETOOTH_CMD = `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${PS1_BLUETOOTH}"`;

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
    devices.set(id, { name, battery });
  }
  return devices;
}

function pollBluetooth() {
  if (!mainWindow || !mainWindow.webContents) return;

  exec(PS_BLUETOOTH_CMD, { timeout: 6000, maxBuffer: 1024 * 512 }, (err, stdout) => {
    if (!mainWindow || !mainWindow.webContents) return;

    const current = parseBluetoothOutput(stdout);
    const isInitial = lastBluetoothDevices === null;
    const previous = lastBluetoothDevices || new Map();

    // Newly connected devices: present now, weren't present on the last poll.
    for (const [id, info] of current) {
      if (!previous.has(id)) {
        lastBluetoothDevices = current;
        mainWindow.webContents.send('bluetooth-update', {
          deviceName: info.name,
          batteryPct: info.battery,
          isCharging: false,
          leftPct: null,
          rightPct: null,
          connectionState: 'connected',
          isInitial,
        });
        return; // one event per tick keeps rapid multi-device changes from racing each other
      }
    }

    // Disconnected devices: were present last poll, are gone now.
    for (const [id, info] of previous) {
      if (!current.has(id)) {
        lastBluetoothDevices = current;
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
    }

    lastBluetoothDevices = current;
  });
}

function startBluetoothPoller() {
  if (bluetoothInterval) clearInterval(bluetoothInterval);
  pollBluetooth();
  bluetoothInterval = setInterval(pollBluetooth, 4000);
}

// ── Fullscreen App Detector (macOS Tahoe Auto-Hide) ─────────────────────────
function getFullscreenExePath() {
  if (app.isPackaged) {
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'scripts', 'fullscreen_check.exe');
    if (fs.existsSync(unpacked)) return unpacked;
    const resPath = path.join(process.resourcesPath, 'scripts', 'fullscreen_check.exe');
    if (fs.existsSync(resPath)) return resPath;
  }
  return path.join(__dirname, 'scripts', 'fullscreen_check.exe');
}

let isFullscreenActive = false;
let fullscreenInterval = null;

function checkFullscreenState() {
  if (!mainWindow || !mainWindow.webContents) return;
  const exePath = getFullscreenExePath();
  if (!fs.existsSync(exePath)) return;

  exec(`"${exePath}"`, { timeout: 2000 }, (err, stdout) => {
    if (!mainWindow || !mainWindow.webContents) return;
    const res = (stdout || '').trim();
    const isFS = res === 'FULLSCREEN';

    if (isFS !== isFullscreenActive) {
      isFullscreenActive = isFS;
      mainWindow.webContents.send('fullscreen-state', isFS);
    }
  });
}

function startFullscreenPoller() {
  if (fullscreenInterval) clearInterval(fullscreenInterval);
  checkFullscreenState();
  fullscreenInterval = setInterval(checkFullscreenState, 1000);
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

ipcMain.on('media-control', (event, action) => {
  let charCode = 179; // Play/Pause
  if (action === 'next') charCode = 176;
  if (action === 'previous') charCode = 177;

  exec(`cscript //nologo "${VBS_MEDIA}" ${charCode}`, { timeout: 2000 }, () => {
    setTimeout(pollSpotifyTitle, 200);
    setTimeout(pollSpotifyTitle, 800);
  });
});

ipcMain.on('resize-window', (event, { width, height }) => {
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

ipcMain.on('open-path', (event, filePath) => {
  if (filePath) {
    shell.openPath(filePath).catch(() => {
      execFile('explorer.exe', [filePath]);
    });
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
      shell.openExternal('ms-settings:');
      break;
    default:
      // Unrecognized command — do not shell-exec arbitrary renderer input.
      console.warn('Ignored unrecognized launch-app command:', cmd);
  }
});

// ── App Lifecycle ──────────────────────────────────────────────────────────
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
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
