"use strict";const{app:c,BrowserWindow:v,screen:x,ipcMain:u,shell:M,Tray:G,Menu:L,nativeImage:R}=require("electron"),h=require("node:path"),f=require("fs");process.platform==="linux"&&(c.commandLine.appendSwitch("enable-transparent-visuals"),c.commandLine.appendSwitch("disable-gpu-compositing"),c.disableHardwareAcceleration());let T=null,i=null;const{exec:l,spawn:E}=require("child_process");function U(){return new Promise(n=>{const e=Buffer.from(`
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
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:5*1024*1024},(r,s)=>{if(r||!s)return n([]);try{const o=JSON.parse(s.trim());n(Array.isArray(o)?o:o?[o]:[])}catch{n([])}})})}function q(){return new Promise(n=>{const e=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:2*1024*1024},(r,s)=>{if(r||!s)return n([]);try{const o=JSON.parse(s.trim());n(Array.isArray(o)?o:o?[o]:[])}catch{n([])}})})}async function B(){const[n,t]=await Promise.all([U(),q()]),e=new Set,r=[];for(const s of[...n,...t]){if(!s.name||!(s.path||s.appId))continue;const o=s.type==="uwp"?`shell:AppsFolder\\${s.appId}`:s.path,a=o.toLowerCase();e.has(a)||(e.add(a),r.push({name:s.name,launch:o}))}return r.sort((s,o)=>s.name.localeCompare(o.name))}function D(n){const t=[];let e=0;for(;e<n.length;){for(;e<n.length&&/\s/.test(n[e]);)e++;if(e>=n.length)break;let r="";for(;e<n.length&&!/\s/.test(n[e]);)if(n[e]==='"'){for(e++;e<n.length&&n[e]!=='"';)r+=n[e++];e<n.length&&e++}else r+=n[e++];r&&t.push(r)}return t}function J(n){const t=n.replace(/\//g,"\\").replace(/%([^%]+)%/g,(o,a)=>process.env[a]||`%${a}%`),e=t.match(/^"([^"]+)"(.*)/);if(e)return{exe:e[1],args:e[2].trim()?D(e[2].trim()):[]};const r=t.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(r)return{exe:r[1],args:r[2]?D(r[2]):[]};const s=t.search(/\s/);return s===-1?{exe:t,args:[]}:{exe:t.slice(0,s),args:D(t.slice(s+1).trim())}}function Y(n){const t=n.trim();try{const e=h.join(c.getPath("userData"),"app-cache.json");if(f.existsSync(e)){const s=JSON.parse(f.readFileSync(e,"utf8")).find(o=>o.name&&o.name.toLowerCase()===t.toLowerCase()&&o.path&&!o.path.startsWith("shell:"));if(s&&s.path){M.openPath(s.path).then(o=>{o&&l(`start "" "${s.path}"`)});return}}}catch{}if(t.startsWith("shell:")||t.includes("!")||t.endsWith(":")||t.toLowerCase().includes("spotify")){let e=t;t.toLowerCase().includes("spotify")&&!t.includes("!")?e="spotify:":t.includes("!")&&!t.startsWith("shell:")&&(e=`shell:AppsFolder\\${t}`);const r=e.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${r}'"`);return}if(/[\\\/]/.test(t)){const{exe:e,args:r}=J(t);if(r.length===0){if(e.toLowerCase().endsWith(".url")){try{const p=f.readFileSync(e,"utf8").match(/^URL=(.+)$/im);p&&M.openExternal(p[1].trim())}catch{}return}M.openPath(e).then(a=>{a&&l(`start "" "${e}"`)});return}const s=/[\\/]/.test(e)&&!/\.[^\\.]+$/.test(e)?e+".exe":e;if(/\.(cmd|bat)$/i.test(s)){const a=E("cmd.exe",["/c",s,...r],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}if(/\.ps1$/i.test(s)){const a=E("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",s,...r],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}const o=E(s,r,{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(t.includes(" ")){const e=t.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`)}else l(`start "" ${t}`)}u.handle("set-ignore-mouse-events",(n,t,e)=>{i&&(process.platform!=="linux"?i.setIgnoreMouseEvents(t,{forward:e||!1}):i.setIgnoreMouseEvents(t))});u.handle("focus-window",()=>{i&&i.focus()});u.handle("open-external",async(n,t)=>{await M.openExternal(t)});u.handle("launch-app",async(n,t)=>{var r;const e=process.platform;if(e==="darwin")l(`open -a "${t}"`);else if(e==="win32"){let s=null;try{const o=h.join(c.getPath("userData"),"app-cache.json");if(f.existsSync(o)){const a=JSON.parse(f.readFileSync(o,"utf8")),p=t.trim().toLowerCase(),m=a.filter(d=>d.name&&d.name.toLowerCase()===p);s=((r=m.find(d=>!d.launch.startsWith("shell:"))||m[0])==null?void 0:r.launch)||null}}catch{}Y(s||t)}else l(t)});u.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const n=h.join(c.getPath("userData"),"app-cache.json");try{const t=await B();f.writeFileSync(n,JSON.stringify(t))}catch{}});u.handle("search-apps",async(n,t)=>{if(process.platform!=="win32"||!t)return[];const e=h.join(c.getPath("userData"),"app-cache.json");try{if(!f.existsSync(e))return[];const r=JSON.parse(f.readFileSync(e,"utf8")),s=t.toLowerCase();return r.filter(o=>o.name&&o.name.toLowerCase().includes(s)).slice(0,8)}catch{return[]}});u.handle("get-displays",()=>x.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));u.handle("set-display",(n,t)=>{if(i){const r=x.getAllDisplays().find(m=>m.id.toString()===t.toString())||x.getPrimaryDisplay(),{x:s,y:o,width:a,height:p}=r.bounds;process.platform,i.setBounds({x:s,y:o,width:a,height:p}),i.show()}});u.handle("update-window-position",(n,t,e)=>{});u.handle("set-auto-launch",(n,t)=>{if(process.platform==="linux"){const e=h.join(c.getPath("home"),".config","autostart"),r=h.join(e,"ripple.desktop");try{if(t){f.existsSync(e)||f.mkdirSync(e,{recursive:!0});const s=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${c.getPath("exe")}"
Icon=${N()}
Terminal=false
`;f.writeFileSync(r,s)}else f.existsSync(r)&&f.unlinkSync(r)}catch(s){console.error("Failed to set auto-launch on Linux:",s)}}else if(process.platform==="win32")try{c.setLoginItemSettings({openAtLogin:t,path:c.getPath("exe")})}catch(e){console.error("Failed to set login item settings on Windows:",e)}});const N=()=>{const n="png";if(c.isPackaged){const t=h.join(process.resourcesPath,`icon.${n}`),e=h.join(process.resourcesPath,`assets/icons/icon.${n}`);return f.existsSync(t)?t:f.existsSync(e)?e:t}return h.join(__dirname,`../../src/assets/icons/icon.${n}`)},_=()=>{const n=x.getPrimaryDisplay(),{x:t,y:e,width:r,height:s}=n.bounds,o=process.platform==="linux",a=process.platform==="win32",p=process.platform==="darwin",m=r,$=s,d=t,w=e,g=a?"toolbar":"panel";i=new v({width:m,height:$,x:d,y:w,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...a?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:N(),...p?{hiddenInMissionControl:!0}:{},type:g,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:h.join(__dirname,"preload.js"),devTools:!1},show:!0}),o?i.setIgnoreMouseEvents(!0):i.setIgnoreMouseEvents(!0,{forward:!0});const j=o?500:0;i.once("ready-to-show",()=>{setTimeout(()=>{i&&(i.show(),o?i.setAlwaysOnTop(!0,"screen-saver"):i.setAlwaysOnTop(!0,"pop-up-menu"),i.focus())},j)}),setTimeout(()=>{i&&!i.isVisible()&&(i.show(),i.focus())},5e3),i.on("closed",()=>{i=null});try{i.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!c.isPackaged||process.env.NODE_ENV==="development")i.loadURL("http://localhost:5173");else{const W=h.join(__dirname,"../renderer/main_window/index.html");i.loadFile(W)}};c.whenReady().then(()=>{process.platform==="darwin"&&c.dock.hide(),_(),c.on("activate",()=>{v.getAllWindows().length===0&&_()});try{const n=N(),e=R.createFromPath(n).resize({width:16,height:16});T=new G(e);const r=L.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{i&&(i.isVisible()?i.hide():i.show())}},{type:"separator"},{label:"Quit",click:()=>{c.quit()}}]);T.setToolTip("Ripple"),T.setContextMenu(r)}catch(n){console.error("Failed to create tray:",n)}});const P=new Map;function K(){const n=require("fs"),e=require("path").join(c.getPath("userData"),"get_media.ps1"),r=`
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
`;try{(!n.existsSync(e)||n.readFileSync(e,"utf8")!==r)&&n.writeFileSync(e,r,"utf8")}catch{}return e}async function V(n,t){if(n==="Unknown Artist"||t==="Unknown Title")return null;const e=`${n}-${t}`.toLowerCase();return P.has(e)?P.get(e):new Promise(r=>{const o=`https://itunes.apple.com/search?term=${encodeURIComponent(`${n} ${t}`)}&entity=song&limit=1`,p=require("https").get(o,{timeout:2500},m=>{let $="";m.on("data",d=>$+=d),m.on("end",()=>{try{const d=JSON.parse($);if(d.results&&d.results.length>0){const w=d.results[0].artworkUrl100,g=w?w.replace("100x100bb","600x600bb"):null;return P.set(e,g),r(g)}}catch{}P.set(e,null),r(null)})});p.on("error",()=>{P.set(e,null),r(null)}),p.on("timeout",()=>{p.destroy(),P.set(e,null),r(null)})})}u.handle("get-system-media",async()=>new Promise(n=>{const t=process.platform;if(t==="darwin")l(`osascript -e '
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
            '`,(r,s)=>{if(r)return n(null);const o=s.trim();if(!o||o==="None"||o==="Error")return n(null);const a=o.split("||");a.length>=4?n({name:a[2],artist:a[3],album:a[4],artwork_url:a[5]||null,state:a[1]==="playing"?"playing":"paused",source:a[0]}):n(null)});else if(t==="win32"){const e=K();l(`powershell -NoProfile -ExecutionPolicy Bypass -File "${e}"`,{maxBuffer:10*1024*1024,encoding:"utf8"},async(r,s)=>{if(r||!s||s.trim()==="null"||s.trim()==="'null'")return n(null);try{const o=JSON.parse(s.trim()),a=o.Title||"Unknown Title",p=o.Artist||"Unknown Artist";let m=o.Artwork||null;!m&&a!=="Unknown Title"&&(m=await V(p,a)),n({name:a,artist:p,album:o.Album||"",artwork_url:m,state:o.Status==="playing"||o.Status==="opened"?"playing":"paused",source:o.Source||"Spotify"})}catch{n(null)}})}else t==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(e,r)=>{if(e||!r)return n(null);const s=r.trim().split("||");n({name:s[0],artist:s[1],album:s[2],state:s[3].toLowerCase(),source:"System"})}):n(null)}));u.handle("get-bluetooth-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?l("system_profiler SPBluetoothDataType -json",(e,r)=>{if(e)return n(!1);try{const o=JSON.parse(r).SPBluetoothDataType[0],a=o.device_connected&&o.device_connected.length>0;n(a)}catch{n(!1)}}):t==="win32"?l(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(r,s)=>{if(r)return n(!1);n(s.trim().toLowerCase()==="true")}):t==="linux"?l("bluetoothctl devices Connected",(e,r)=>{if(e)return n(!1);n(r.trim().length>0)}):n(!1)}));u.handle("get-camera-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?l('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(e,r)=>{n(r?r.includes("= Yes"):!1)}):t==="win32"?l(`powershell -NoProfile -Command "
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
      "`,(r,s)=>{if(r)return n(!1);n(s.trim().toLowerCase()==="true")}):t==="linux"?l("fuser /dev/video* 2>/dev/null",(e,r)=>{n(r.trim().length>0)}):n(!1)}));u.handle("get-microphone-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?l('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(e,r)=>{n(r?r.trim().length>0:!1)}):t==="win32"?l('powershell -NoProfile -Command "@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0"',(r,s)=>{if(r)return n(!1);n(s.trim().toLowerCase()==="true")}):t==="linux"?l("pactl list source-outputs | grep -q 'Source #'",e=>{n(!e)}):n(!1)}));c.on("window-all-closed",()=>{process.platform==="linux"&&!T&&c.quit()});u.handle("control-system-media",async(n,t)=>{const e=process.platform;if(e==="darwin"){const r=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${t} track
        else if musicRunning then
            tell application "Music" to ${t} track
        end if
        `;l(`osascript -e '${r}'`)}else if(e==="linux"){let r=t;t==="playpause"&&(r="play-pause"),l(`playerctl ${r}`)}});const{Worker:H}=require("worker_threads");let C=null;try{C=require("wasapi-loopback")}catch(n){console.error("[wasapi-loopback] module failed to resolve — has it been built? Reason:",n.message),C={available:!1,start:()=>!1,stop:()=>!1}}let S=null,k=!1,O=0;function z(){return c.isPackaged?h.join(process.resourcesPath,"audioWorker.js"):h.join(c.getAppPath(),"src","audio","audioWorker.js")}function Z(){if(S)return S;const n=z();return f.existsSync(n)?(S=new H(n),S.on("message",t=>{(t==null?void 0:t.type)==="bands"&&i&&!i.isDestroyed()&&i.webContents.send("audio-bands",t.bands)}),S.on("error",t=>{console.error("[audio-worker] error:",t)}),S):(console.error(`[audio-worker] script not found at ${n}`),null)}let b=null,I=.1,A=0;global.startWasapiSampler=function(){};function F(){if(b||process.platform!=="win32")return;const n=`
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
  `;try{const t=E("powershell",["-NoProfile","-Command",n],{shell:!1,detached:!1,stdio:["ignore","pipe","ignore"]});t.stdout.on("data",e=>{const s=e.toString().trim().split(`
`),o=s[s.length-1],a=parseFloat(o);if(!isNaN(a)){A=a,A>I?I=A:I=Math.max(.08,I*.995);const p=Math.min(5,.85/I),m=Math.min(1,A*p),$=new Array(24),d=Date.now()/1e3;for(let w=0;w<24;w++){const g=.55+Math.sin(w*.42+d*2.2)*.35+Math.cos(w*.75-d*3.1)*.25;$[w]=Math.max(.08,Math.min(1,m*g))}i&&!i.isDestroyed()&&i.webContents.send("audio-bands",$)}}),t.on("error",()=>{}),b=t}catch(t){console.error("[wasapi-sampler] Error starting sampler:",t)}}function Q(){if(b){try{b.kill()}catch{}b=null}}u.handle("audio-viz-start",()=>{if(typeof F=="function"&&F(),O++,F(),C.available&&!k){const n=Z();n&&(k=C.start((e,r)=>{n.postMessage({type:"pcm",samples:e,sampleRate:r},[e.buffer])}))}return{started:!0}});u.handle("audio-viz-stop",()=>(O=Math.max(0,O-1),O===0&&(Q(),k&&(C.stop(),k=!1,S&&S.postMessage({type:"reset"}))),{stopped:!0}));c.on("before-quit",()=>{k&&C.stop(),S&&S.terminate()});let y={clientId:process.env.SPOTIFY_CLIENT_ID||"",clientSecret:process.env.SPOTIFY_CLIENT_SECRET||"",apiKey:process.env.SPOTIFY_API_KEY||""};function X(){try{const n=require("fs"),t=require("path"),e=t.join(c.getPath("userData"),"spotify-config.json"),r=t.join(c.getAppPath(),"spotify-config.json");let s=null;if(n.existsSync(e)?s=e:n.existsSync(r)&&(s=r),s){const o=JSON.parse(n.readFileSync(s,"utf-8"));y.clientId=o.SPOTIFY_CLIENT_ID||y.clientId,y.clientSecret=o.SPOTIFY_CLIENT_SECRET||y.clientSecret,y.apiKey=o.SPOTIFY_API_KEY||y.apiKey}}catch{}}u.handle("get-spotify-config",()=>(X(),y));u.handle("save-spotify-config",(n,t)=>{if(t){y={...y,...t};try{const e=require("fs"),s=require("path").join(c.getPath("userData"),"spotify-config.json");e.writeFileSync(s,JSON.stringify({SPOTIFY_CLIENT_ID:y.clientId,SPOTIFY_CLIENT_SECRET:y.clientSecret,SPOTIFY_API_KEY:y.apiKey,INSTRUCTIONS:"Spotify Web API Client ID & Client Secret"},null,2))}catch{}}return{success:!0}});
