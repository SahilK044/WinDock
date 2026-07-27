"use strict";const{app:c,BrowserWindow:_,screen:E,ipcMain:p,shell:A,Tray:j,Menu:G,nativeImage:L}=require("electron"),h=require("node:path"),f=require("fs");process.platform==="linux"&&(c.commandLine.appendSwitch("enable-transparent-visuals"),c.commandLine.appendSwitch("disable-gpu-compositing"),c.disableHardwareAcceleration());let k=null,i=null;const{exec:l,spawn:T}=require("child_process");function R(){return new Promise(n=>{const e=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$shell   = New-Object -ComObject WScript.Shell
$dirs    = @("$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs","$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs")
$results = [System.Collections.Generic.List[object]]::new()
foreach ($dir in $dirs) {
  if (-not (Test-Path $dir)) { continue }
  Get-ChildItem $dir -Recurse -Filter '*.lnk' -EA SilentlyContinue | ForEach-Object {
    try {
      $target = $shell.CreateShortcut($_.FullName).TargetPath
      if ($target -and $target.EndsWith('.exe') -and
          $target -notlike '*\\\\explorer.exe' -and
          $target -notmatch 'WindowsApps' -and
          (Test-Path $target -EA SilentlyContinue)) {
        $results.Add([PSCustomObject]@{ name = $_.BaseName; type = 'win32'; path = $target })
      }
    } catch {}
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:5*1024*1024},(r,s)=>{if(r||!s)return n([]);try{const o=JSON.parse(s.trim());n(Array.isArray(o)?o:o?[o]:[])}catch{n([])}})})}function U(){return new Promise(n=>{const e=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:2*1024*1024},(r,s)=>{if(r||!s)return n([]);try{const o=JSON.parse(s.trim());n(Array.isArray(o)?o:o?[o]:[])}catch{n([])}})})}async function q(){const[n,t]=await Promise.all([R(),U()]),e=new Set,r=[];for(const s of[...n,...t]){if(!s.name||!(s.path||s.appId))continue;const o=s.type==="uwp"?`shell:AppsFolder\\${s.appId}`:s.path,a=o.toLowerCase();e.has(a)||(e.add(a),r.push({name:s.name,launch:o}))}return r.sort((s,o)=>s.name.localeCompare(o.name))}function O(n){const t=[];let e=0;for(;e<n.length;){for(;e<n.length&&/\s/.test(n[e]);)e++;if(e>=n.length)break;let r="";for(;e<n.length&&!/\s/.test(n[e]);)if(n[e]==='"'){for(e++;e<n.length&&n[e]!=='"';)r+=n[e++];e<n.length&&e++}else r+=n[e++];r&&t.push(r)}return t}function B(n){const t=n.replace(/\//g,"\\").replace(/%([^%]+)%/g,(o,a)=>process.env[a]||`%${a}%`),e=t.match(/^"([^"]+)"(.*)/);if(e)return{exe:e[1],args:e[2].trim()?O(e[2].trim()):[]};const r=t.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(r)return{exe:r[1],args:r[2]?O(r[2]):[]};const s=t.search(/\s/);return s===-1?{exe:t,args:[]}:{exe:t.slice(0,s),args:O(t.slice(s+1).trim())}}function J(n){const t=n.trim();try{const e=h.join(c.getPath("userData"),"app-cache.json");if(f.existsSync(e)){const s=JSON.parse(f.readFileSync(e,"utf8")).find(o=>o.name&&o.name.toLowerCase()===t.toLowerCase()&&o.path&&!o.path.startsWith("shell:"));if(s&&s.path){A.openPath(s.path).then(o=>{o&&l(`start "" "${s.path}"`)});return}}}catch{}if(t.startsWith("shell:")||t.includes("!")||t.endsWith(":")||t.toLowerCase().includes("spotify")){let e=t;t.toLowerCase().includes("spotify")&&!t.includes("!")?e="spotify:":t.includes("!")&&!t.startsWith("shell:")&&(e=`shell:AppsFolder\\${t}`);const r=e.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${r}'"`);return}if(/[\\\/]/.test(t)){const{exe:e,args:r}=B(t);if(r.length===0){if(e.toLowerCase().endsWith(".url")){try{const u=f.readFileSync(e,"utf8").match(/^URL=(.+)$/im);u&&A.openExternal(u[1].trim())}catch{}return}A.openPath(e).then(a=>{a&&l(`start "" "${e}"`)});return}const s=/[\\/]/.test(e)&&!/\.[^\\.]+$/.test(e)?e+".exe":e;if(/\.(cmd|bat)$/i.test(s)){const a=T("cmd.exe",["/c",s,...r],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}if(/\.ps1$/i.test(s)){const a=T("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",s,...r],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}const o=T(s,r,{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(t.includes(" ")){const e=t.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`)}else l(`start "" ${t}`)}p.handle("set-ignore-mouse-events",(n,t,e)=>{i&&(process.platform!=="linux"?i.setIgnoreMouseEvents(t,{forward:e||!1}):i.setIgnoreMouseEvents(t))});p.handle("focus-window",()=>{i&&i.focus()});p.handle("open-external",async(n,t)=>{await A.openExternal(t)});p.handle("launch-app",async(n,t)=>{var r;const e=process.platform;if(e==="darwin")l(`open -a "${t}"`);else if(e==="win32"){let s=null;try{const o=h.join(c.getPath("userData"),"app-cache.json");if(f.existsSync(o)){const a=JSON.parse(f.readFileSync(o,"utf8")),u=t.trim().toLowerCase(),d=a.filter(m=>m.name&&m.name.toLowerCase()===u);s=((r=d.find(m=>!m.launch.startsWith("shell:"))||d[0])==null?void 0:r.launch)||null}}catch{}J(s||t)}else l(t)});p.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const n=h.join(c.getPath("userData"),"app-cache.json");try{const t=await q();f.writeFileSync(n,JSON.stringify(t))}catch{}});p.handle("search-apps",async(n,t)=>{if(process.platform!=="win32"||!t)return[];const e=h.join(c.getPath("userData"),"app-cache.json");try{if(!f.existsSync(e))return[];const r=JSON.parse(f.readFileSync(e,"utf8")),s=t.toLowerCase();return r.filter(o=>o.name&&o.name.toLowerCase().includes(s)).slice(0,8)}catch{return[]}});p.handle("get-displays",()=>E.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));p.handle("set-display",(n,t)=>{if(i){const r=E.getAllDisplays().find(d=>d.id.toString()===t.toString())||E.getPrimaryDisplay(),{x:s,y:o,width:a,height:u}=r.bounds;process.platform,i.setBounds({x:s,y:o,width:a,height:u}),i.show()}});p.handle("update-window-position",(n,t,e)=>{});p.handle("set-auto-launch",(n,t)=>{if(process.platform==="linux"){const e=h.join(c.getPath("home"),".config","autostart"),r=h.join(e,"ripple.desktop");try{if(t){f.existsSync(e)||f.mkdirSync(e,{recursive:!0});const s=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${c.getPath("exe")}"
Icon=${x()}
Terminal=false
`;f.writeFileSync(r,s)}else f.existsSync(r)&&f.unlinkSync(r)}catch(s){console.error("Failed to set auto-launch on Linux:",s)}}else if(process.platform==="win32")try{c.setLoginItemSettings({openAtLogin:t,path:c.getPath("exe")})}catch(e){console.error("Failed to set login item settings on Windows:",e)}});const x=()=>{const n="png";if(c.isPackaged){const t=h.join(process.resourcesPath,`icon.${n}`),e=h.join(process.resourcesPath,`assets/icons/icon.${n}`);return f.existsSync(t)?t:f.existsSync(e)?e:t}return h.join(__dirname,`../../src/assets/icons/icon.${n}`)},N=()=>{const n=E.getPrimaryDisplay(),{x:t,y:e,width:r,height:s}=n.bounds,o=process.platform==="linux",a=process.platform==="win32",u=process.platform==="darwin",d=r,w=s,m=t,I=e,b=a?"toolbar":"panel";i=new _({width:d,height:w,x:m,y:I,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...a?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:x(),...u?{hiddenInMissionControl:!0}:{},type:b,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:h.join(__dirname,"preload.js"),devTools:!1},show:!0}),o?i.setIgnoreMouseEvents(!0):i.setIgnoreMouseEvents(!0,{forward:!0});const v=o?500:0;i.once("ready-to-show",()=>{setTimeout(()=>{i&&(i.show(),o?i.setAlwaysOnTop(!0,"screen-saver"):i.setAlwaysOnTop(!0,"pop-up-menu"),i.focus())},v)}),setTimeout(()=>{i&&!i.isVisible()&&(i.show(),i.focus())},5e3),i.on("closed",()=>{i=null});try{i.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!c.isPackaged||process.env.NODE_ENV==="development")i.loadURL("http://localhost:5173");else{const F=h.join(__dirname,"../renderer/main_window/index.html");i.loadFile(F)}};c.whenReady().then(()=>{process.platform==="darwin"&&c.dock.hide(),N(),c.on("activate",()=>{_.getAllWindows().length===0&&N()});try{const n=x(),e=L.createFromPath(n).resize({width:16,height:16});k=new j(e);const r=G.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{i&&(i.isVisible()?i.hide():i.show())}},{type:"separator"},{label:"Quit",click:()=>{c.quit()}}]);k.setToolTip("Ripple"),k.setContextMenu(r)}catch(n){console.error("Failed to create tray:",n)}});const $=new Map;function Y(){const n=require("fs"),e=require("path").join(c.getPath("userData"),"get_media.ps1"),r=`
[System.Reflection.Assembly]::LoadWithPartialName('System.Runtime.WindowsRuntime') | Out-Null
$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' }[0]

function AwaitOperation($asyncOp, $type) {
    $asTask = $asTaskGeneric.MakeGenericMethod($type)
    $task = $asTask.Invoke($null, @($asyncOp))
    $task.Wait()
    return $task.Result
}

try {
    $asyncOp = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync()
    $manager = AwaitOperation $asyncOp ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
    if ($manager) {
        $session = $manager.GetCurrentSession()
        if (-not $session) {
            $sessions = $manager.GetSessions()
            $session = $sessions | Where-Object { $_.SourceAppUserModelId -like '*Spotify*' } | Select-Object -First 1
            if (-not $session) { $session = $sessions | Select-Object -First 1 }
        }
        if ($session) {
            $propsOp = $session.TryGetMediaPropertiesAsync()
            $props = AwaitOperation $propsOp ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
            $playback = $session.GetPlaybackInfo()
            
            $artwork = ""
            if ($props.Thumbnail) {
                try {
                    $streamOp = $props.Thumbnail.OpenReadAsync()
                    $stream = AwaitOperation $streamOp ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
                    if ($stream) {
                        $buffer = New-Object byte[] $stream.Size
                        $reader = New-Object Windows.Storage.Streams.DataReader $stream
                        $reader.LoadAsync($stream.Size).GetAwaiter().GetResult() | Out-Null
                        $reader.ReadBytes($buffer)
                        $artwork = 'data:image/png;base64,' + [Convert]::ToBase64String($buffer)
                        $reader.Close()
                        $stream.Close()
                    }
                } catch {}
            }

            $info = @{
                Title = $props.Title
                Artist = $props.Artist
                Album = $props.AlbumTitle
                Status = $playback.PlaybackStatus.ToString().ToLower()
                Source = $session.SourceAppUserModelId
                Artwork = $artwork
            }
            return $info | ConvertTo-Json -Compress
        }
    }
} catch {}

try {
    $proc = Get-Process | Where-Object { $_.ProcessName -eq 'Spotify' -and $_.MainWindowTitle -ne '' } | Select-Object -First 1
    if ($proc -and $proc.MainWindowTitle -like '*-*') {
        $parts = $proc.MainWindowTitle -split ' - '
        $artist = $parts[0]
        $title = ($parts[1..($parts.Length-1)]) -join ' - '
        $info = @{
            Title = $title
            Artist = $artist
            Album = ''
            Status = 'playing'
            Source = 'Spotify'
            Artwork = ''
        }
        return $info | ConvertTo-Json -Compress
    }
} catch {}

return 'null'
`;try{(!n.existsSync(e)||n.readFileSync(e,"utf8")!==r)&&n.writeFileSync(e,r,"utf8")}catch{}return e}async function K(n,t){if(n==="Unknown Artist"||t==="Unknown Title")return null;const e=`${n}-${t}`.toLowerCase();return $.has(e)?$.get(e):new Promise(r=>{const o=`https://itunes.apple.com/search?term=${encodeURIComponent(`${n} ${t}`)}&entity=song&limit=1`,u=require("https").get(o,{timeout:2500},d=>{let w="";d.on("data",m=>w+=m),d.on("end",()=>{try{const m=JSON.parse(w);if(m.results&&m.results.length>0){const I=m.results[0].artworkUrl100,b=I?I.replace("100x100bb","600x600bb"):null;return $.set(e,b),r(b)}}catch{}$.set(e,null),r(null)})});u.on("error",()=>{$.set(e,null),r(null)}),u.on("timeout",()=>{u.destroy(),$.set(e,null),r(null)})})}p.handle("get-system-media",async()=>new Promise(n=>{const t=process.platform;if(t==="darwin")l(`osascript -e '
            tell application "System Events"
                set spotifyRunning to (name of every process) contains "Spotify"
                set musicRunning to (name of every process) contains "Music"
            end tell
            if spotifyRunning then
                try
                    tell application "Spotify"
                        set mediaState to player state as string
                        set songName to name of current track
                        set artistName to artist of current track
                        set albumName to album of current track
                        try
                            set artUrl to artwork url of current track
                        on error
                            set artUrl to ""
                        end try
                    end tell
                    return "Spotify" & "||" & mediaState & "||" & songName & "||" & artistName & "||" & albumName & "||" & artUrl
                on error
                    return "Error"
                end try
            else if musicRunning then
                try
                    tell application "Music" 
                        set mediaState to player state as string
                        set songName to name of current track
                        set artistName to artist of current track
                        set albumName to album of current track
                    end tell
                    return "Music" & "||" & mediaState & "||" & songName & "||" & artistName & "||" & albumName & "||" & "" 
                on error
                    return "Error"
                end try
            else
                return "None"
            end if
            '`,(r,s)=>{if(r)return n(null);const o=s.trim();if(!o||o==="None"||o==="Error")return n(null);const a=o.split("||");a.length>=4?n({name:a[2],artist:a[3],album:a[4],artwork_url:a[5]||null,state:a[1]==="playing"?"playing":"paused",source:a[0]}):n(null)});else if(t==="win32"){const e=Y();l(`powershell -NoProfile -ExecutionPolicy Bypass -File "${e}"`,{maxBuffer:10*1024*1024,encoding:"utf8"},async(r,s)=>{if(r||!s||s.trim()==="null"||s.trim()==="'null'")return n(null);try{const o=JSON.parse(s.trim()),a=o.Title||"Unknown Title",u=o.Artist||"Unknown Artist";let d=o.Artwork||null;!d&&a!=="Unknown Title"&&(d=await K(u,a)),n({name:a,artist:u,album:o.Album||"",artwork_url:d,state:o.Status==="playing"||o.Status==="opened"?"playing":"paused",source:o.Source||"Spotify"})}catch{n(null)}})}else t==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(e,r)=>{if(e||!r)return n(null);const s=r.trim().split("||");n({name:s[0],artist:s[1],album:s[2],state:s[3].toLowerCase(),source:"System"})}):n(null)}));p.handle("get-bluetooth-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?l("system_profiler SPBluetoothDataType -json",(e,r)=>{if(e)return n(!1);try{const o=JSON.parse(r).SPBluetoothDataType[0],a=o.device_connected&&o.device_connected.length>0;n(a)}catch{n(!1)}}):t==="win32"?l(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(r,s)=>{if(r)return n(!1);n(s.trim().toLowerCase()==="true")}):t==="linux"?l("bluetoothctl devices Connected",(e,r)=>{if(e)return n(!1);n(r.trim().length>0)}):n(!1)}));p.handle("get-camera-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?l('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(e,r)=>{n(r?r.includes("= Yes"):!1)}):t==="win32"?l(`powershell -NoProfile -Command "
        $inUse = $false
        $keys = Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam" -Recurse -ErrorAction SilentlyContinue
        foreach ($key in $keys) {
            $val = Get-ItemProperty -Path $key.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue
            if ($val -and $val.LastUsedTimeStop -eq 0) {
                $inUse = $true
                break
            }
        }
        $inUse
      "`,(r,s)=>{if(r)return n(!1);n(s.trim().toLowerCase()==="true")}):t==="linux"?l("fuser /dev/video* 2>/dev/null",(e,r)=>{n(r.trim().length>0)}):n(!1)}));p.handle("get-microphone-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?l('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(e,r)=>{n(r?r.trim().length>0:!1)}):t==="win32"?l('powershell -NoProfile -Command "@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0"',(r,s)=>{if(r)return n(!1);n(s.trim().toLowerCase()==="true")}):t==="linux"?l("pactl list source-outputs | grep -q 'Source #'",e=>{n(!e)}):n(!1)}));c.on("window-all-closed",()=>{process.platform==="linux"&&!k&&c.quit()});p.handle("control-system-media",async(n,t)=>{const e=process.platform;if(e==="darwin"){const r=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${t} track
        else if musicRunning then
            tell application "Music" to ${t} track
        end if
        `;l(`osascript -e '${r}'`)}else if(e==="linux"){let r=t;t==="playpause"&&(r="play-pause"),l(`playerctl ${r}`)}});const{Worker:V}=require("worker_threads");let g=null;try{g=require("wasapi-loopback")}catch(n){console.error("[wasapi-loopback] module failed to resolve — has it been built? Reason:",n.message),g={available:!1,start:()=>!1,stop:()=>!1}}let S=null,P=!1,M=0;function H(){return c.isPackaged?h.join(process.resourcesPath,"audioWorker.js"):h.join(c.getAppPath(),"src","audio","audioWorker.js")}function z(){if(S)return S;const n=H();return f.existsSync(n)?(S=new V(n),S.on("message",t=>{(t==null?void 0:t.type)==="bands"&&i&&!i.isDestroyed()&&i.webContents.send("audio-bands",t.bands)}),S.on("error",t=>{console.error("[audio-worker] error:",t)}),S):(console.error(`[audio-worker] script not found at ${n}`),null)}let C=null,W=0;global.startWasapiSampler=function(){};function D(){if(C||process.platform!=="win32")return;const n=`
$code = @'
using System;
using System.Runtime.InteropServices;

namespace AudioMeter {
    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator {
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice {
        int Activate(ref Guid iid, uint dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
    }

    [Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioMeterInformation {
        int GetPeakValue(out float pfPeak);
    }

    public class Meter {
        [DllImport("Ole32.dll")]
        private static extern int CoCreateInstance(ref Guid rclsid, IntPtr pUnkOuter, uint dwClsContext, ref Guid riid, out IntPtr ppv);

        private static IAudioMeterInformation meter = null;

        public static float GetPeak() {
            try {
                if (meter == null) {
                    Guid CLSID_MMDeviceEnumerator = new Guid("BCDE0395-E52F-467C-8E3D-C4579291692E");
                    Guid IID_IMMDeviceEnumerator = new Guid("A95664D2-9614-4F35-A746-DE8DB63617E6");
                    Guid IID_IAudioMeterInformation = new Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064");

                    IntPtr enumeratorPtr;
                    if (CoCreateInstance(ref CLSID_MMDeviceEnumerator, IntPtr.Zero, 1, ref IID_IMMDeviceEnumerator, out enumeratorPtr) != 0) return 0f;
                    IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)Marshal.GetObjectForIUnknown(enumeratorPtr);
                    IMMDevice device;
                    if (enumerator.GetDefaultAudioEndpoint(0, 1, out device) != 0) return 0f;
                    object meterObj;
                    if (device.Activate(ref IID_IAudioMeterInformation, 1, IntPtr.Zero, out meterObj) != 0) return 0f;
                    meter = (IAudioMeterInformation)meterObj;
                }
                float peak = 0f;
                meter.GetPeakValue(out peak);
                return peak;
            } catch { return 0f; }
        }
    }
}
'@
Add-Type -TypeDefinition $code
while ($true) {
    $p = [AudioMeter.Meter]::GetPeak()
    [Console]::WriteLine($p)
    Start-Sleep -Milliseconds 20
}
  `;try{const t=T("powershell",["-NoProfile","-Command",n],{shell:!1,detached:!1,stdio:["ignore","pipe","ignore"]});t.stdout.on("data",e=>{const s=e.toString().trim().split(`
`),o=s[s.length-1],a=parseFloat(o);if(!isNaN(a)){W=a;const u=new Array(24),d=Date.now()/1e3;for(let w=0;w<24;w++){const m=.6+Math.sin(w*.45+d*2)*.3+Math.cos(w*.8-d*3)*.2;u[w]=Math.max(.05,Math.min(1,W*2.5*m))}i&&!i.isDestroyed()&&i.webContents.send("audio-bands",u)}}),t.on("error",()=>{}),C=t}catch(t){console.error("[wasapi-sampler] Error starting sampler:",t)}}function Z(){if(C){try{C.kill()}catch{}C=null}}p.handle("audio-viz-start",()=>{if(typeof D=="function"&&D(),M++,D(),g.available&&!P){const n=z();n&&(P=g.start((e,r)=>{n.postMessage({type:"pcm",samples:e,sampleRate:r},[e.buffer])}))}return{started:!0}});p.handle("audio-viz-stop",()=>(M=Math.max(0,M-1),M===0&&(Z(),P&&(g.stop(),P=!1,S&&S.postMessage({type:"reset"}))),{stopped:!0}));c.on("before-quit",()=>{P&&g.stop(),S&&S.terminate()});let y={clientId:process.env.SPOTIFY_CLIENT_ID||"",clientSecret:process.env.SPOTIFY_CLIENT_SECRET||"",apiKey:process.env.SPOTIFY_API_KEY||""};function Q(){try{const n=require("fs"),t=require("path"),e=t.join(c.getPath("userData"),"spotify-config.json"),r=t.join(c.getAppPath(),"spotify-config.json");let s=null;if(n.existsSync(e)?s=e:n.existsSync(r)&&(s=r),s){const o=JSON.parse(n.readFileSync(s,"utf-8"));y.clientId=o.SPOTIFY_CLIENT_ID||y.clientId,y.clientSecret=o.SPOTIFY_CLIENT_SECRET||y.clientSecret,y.apiKey=o.SPOTIFY_API_KEY||y.apiKey}}catch{}}p.handle("get-spotify-config",()=>(Q(),y));p.handle("save-spotify-config",(n,t)=>{if(t){y={...y,...t};try{const e=require("fs"),s=require("path").join(c.getPath("userData"),"spotify-config.json");e.writeFileSync(s,JSON.stringify({SPOTIFY_CLIENT_ID:y.clientId,SPOTIFY_CLIENT_SECRET:y.clientSecret,SPOTIFY_API_KEY:y.apiKey,INSTRUCTIONS:"Spotify Web API Client ID & Client Secret"},null,2))}catch{}}return{success:!0}});
