"use strict";const{app:c,BrowserWindow:E,screen:v,ipcMain:p,shell:A,Tray:F,Menu:W,nativeImage:j}=require("electron"),h=require("node:path"),d=require("fs");process.platform==="linux"&&(c.commandLine.appendSwitch("enable-transparent-visuals"),c.commandLine.appendSwitch("disable-gpu-compositing"),c.disableHardwareAcceleration());let C=null,a=null;const{exec:l,spawn:x}=require("child_process");function D(){return new Promise(n=>{const e=Buffer.from(`
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
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:5*1024*1024},(s,r)=>{if(s||!r)return n([]);try{const o=JSON.parse(r.trim());n(Array.isArray(o)?o:o?[o]:[])}catch{n([])}})})}function R(){return new Promise(n=>{const e=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:2*1024*1024},(s,r)=>{if(s||!r)return n([]);try{const o=JSON.parse(r.trim());n(Array.isArray(o)?o:o?[o]:[])}catch{n([])}})})}async function U(){const[n,t]=await Promise.all([D(),R()]),e=new Set,s=[];for(const r of[...n,...t]){if(!r.name||!(r.path||r.appId))continue;const o=r.type==="uwp"?`shell:AppsFolder\\${r.appId}`:r.path,i=o.toLowerCase();e.has(i)||(e.add(i),s.push({name:r.name,launch:o}))}return s.sort((r,o)=>r.name.localeCompare(o.name))}function I(n){const t=[];let e=0;for(;e<n.length;){for(;e<n.length&&/\s/.test(n[e]);)e++;if(e>=n.length)break;let s="";for(;e<n.length&&!/\s/.test(n[e]);)if(n[e]==='"'){for(e++;e<n.length&&n[e]!=='"';)s+=n[e++];e<n.length&&e++}else s+=n[e++];s&&t.push(s)}return t}function L(n){const t=n.replace(/\//g,"\\").replace(/%([^%]+)%/g,(o,i)=>process.env[i]||`%${i}%`),e=t.match(/^"([^"]+)"(.*)/);if(e)return{exe:e[1],args:e[2].trim()?I(e[2].trim()):[]};const s=t.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(s)return{exe:s[1],args:s[2]?I(s[2]):[]};const r=t.search(/\s/);return r===-1?{exe:t,args:[]}:{exe:t.slice(0,r),args:I(t.slice(r+1).trim())}}function q(n){const t=n.trim();if(t.startsWith("shell:")){const e=t.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`);return}if(/[\\\/]/.test(t)){const{exe:e,args:s}=L(t);if(s.length===0){if(e.toLowerCase().endsWith(".url")){try{const u=d.readFileSync(e,"utf8").match(/^URL=(.+)$/im);u&&A.openExternal(u[1].trim())}catch{}return}A.openPath(e).then(i=>{i&&l(`start "" "${e}"`)});return}const r=/[\\/]/.test(e)&&!/\.[^\\.]+$/.test(e)?e+".exe":e;if(/\.(cmd|bat)$/i.test(r)){const i=x("cmd.exe",["/c",r,...s],{shell:!1,detached:!0,stdio:"ignore"});i.on("error",()=>{}),i.unref();return}if(/\.ps1$/i.test(r)){const i=x("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",r,...s],{shell:!1,detached:!0,stdio:"ignore"});i.on("error",()=>{}),i.unref();return}const o=x(r,s,{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(t.includes(" ")){const e=t.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`)}else l(`start "" ${t}`)}p.handle("set-ignore-mouse-events",(n,t,e)=>{a&&(process.platform!=="linux"?a.setIgnoreMouseEvents(t,{forward:e||!1}):a.setIgnoreMouseEvents(t))});p.handle("focus-window",()=>{a&&a.focus()});p.handle("open-external",async(n,t)=>{await A.openExternal(t)});p.handle("launch-app",async(n,t)=>{var s;const e=process.platform;if(e==="darwin")l(`open -a "${t}"`);else if(e==="win32"){let r=null;try{const o=h.join(c.getPath("userData"),"app-cache.json");if(d.existsSync(o)){const i=JSON.parse(d.readFileSync(o,"utf8")),u=t.trim().toLowerCase(),f=i.filter(m=>m.name&&m.name.toLowerCase()===u);r=((s=f.find(m=>!m.launch.startsWith("shell:"))||f[0])==null?void 0:s.launch)||null}}catch{}q(r||t)}else l(t)});p.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const n=h.join(c.getPath("userData"),"app-cache.json");try{const t=await U();d.writeFileSync(n,JSON.stringify(t))}catch{}});p.handle("search-apps",async(n,t)=>{if(process.platform!=="win32"||!t)return[];const e=h.join(c.getPath("userData"),"app-cache.json");try{if(!d.existsSync(e))return[];const s=JSON.parse(d.readFileSync(e,"utf8")),r=t.toLowerCase();return s.filter(o=>o.name&&o.name.toLowerCase().includes(r)).slice(0,8)}catch{return[]}});p.handle("get-displays",()=>v.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));p.handle("set-display",(n,t)=>{if(a){const s=v.getAllDisplays().find(f=>f.id.toString()===t.toString())||v.getPrimaryDisplay(),{x:r,y:o,width:i,height:u}=s.bounds;process.platform,a.setBounds({x:r,y:o,width:i,height:u}),a.show()}});p.handle("update-window-position",(n,t,e)=>{});p.handle("set-auto-launch",(n,t)=>{if(process.platform==="linux"){const e=h.join(c.getPath("home"),".config","autostart"),s=h.join(e,"ripple.desktop");try{if(t){d.existsSync(e)||d.mkdirSync(e,{recursive:!0});const r=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${c.getPath("exe")}"
Icon=${O()}
Terminal=false
`;d.writeFileSync(s,r)}else d.existsSync(s)&&d.unlinkSync(s)}catch(r){console.error("Failed to set auto-launch on Linux:",r)}}else if(process.platform==="win32")try{c.setLoginItemSettings({openAtLogin:t,path:c.getPath("exe")})}catch(e){console.error("Failed to set login item settings on Windows:",e)}});const O=()=>{const n="png";if(c.isPackaged){const t=h.join(process.resourcesPath,`icon.${n}`),e=h.join(process.resourcesPath,`assets/icons/icon.${n}`);return d.existsSync(t)?t:d.existsSync(e)?e:t}return h.join(__dirname,`../../src/assets/icons/icon.${n}`)},M=()=>{const n=v.getPrimaryDisplay(),{x:t,y:e,width:s,height:r}=n.bounds,o=process.platform==="linux",i=process.platform==="win32",u=process.platform==="darwin",f=s,g=r,m=t,P=e,k=i?"toolbar":"panel";a=new E({width:f,height:g,x:m,y:P,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...i?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:O(),...u?{hiddenInMissionControl:!0}:{},type:k,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:h.join(__dirname,"preload.js"),devTools:!1},show:!0}),o?a.setIgnoreMouseEvents(!0):a.setIgnoreMouseEvents(!0,{forward:!0});const N=o?500:0;a.once("ready-to-show",()=>{setTimeout(()=>{a&&(a.show(),o?a.setAlwaysOnTop(!0,"screen-saver"):a.setAlwaysOnTop(!0,"pop-up-menu"),a.focus())},N)}),setTimeout(()=>{a&&!a.isVisible()&&(a.show(),a.focus())},5e3),a.on("closed",()=>{a=null});try{a.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!c.isPackaged||process.env.NODE_ENV==="development")a.loadURL("http://localhost:5173");else{const _=h.join(__dirname,"../renderer/main_window/index.html");a.loadFile(_)}};c.whenReady().then(()=>{process.platform==="darwin"&&c.dock.hide(),M(),c.on("activate",()=>{E.getAllWindows().length===0&&M()});try{const n=O(),e=j.createFromPath(n).resize({width:16,height:16});C=new F(e);const s=W.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{a&&(a.isVisible()?a.hide():a.show())}},{type:"separator"},{label:"Quit",click:()=>{c.quit()}}]);C.setToolTip("Ripple"),C.setContextMenu(s)}catch(n){console.error("Failed to create tray:",n)}});const $=new Map;function B(){const n=require("fs"),e=require("path").join(c.getPath("userData"),"get_media.ps1"),s=`
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
        $sessions = @($manager.GetSessions())
        $session = $sessions | Where-Object {
            $_.SourceAppUserModelId -like '*Spotify*' -and
            $_.GetPlaybackInfo().PlaybackStatus.ToString() -eq 'Playing'
        } | Select-Object -First 1
        if (-not $session) {
            $session = $sessions | Where-Object { $_.SourceAppUserModelId -like '*Spotify*' } | Select-Object -First 1
        }
        if (-not $session) {
            $session = $manager.GetCurrentSession()
        }
        if (-not $session) {
            $session = $sessions | Where-Object {
                $_.GetPlaybackInfo().PlaybackStatus.ToString() -eq 'Playing'
            } | Select-Object -First 1
        }
        if (-not $session) { $session = $sessions | Select-Object -First 1 }
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
`;try{(!n.existsSync(e)||n.readFileSync(e,"utf8")!==s)&&n.writeFileSync(e,s,"utf8")}catch{}return e}async function G(n,t){if(n==="Unknown Artist"||t==="Unknown Title")return null;const e=`${n}-${t}`.toLowerCase();return $.has(e)?$.get(e):new Promise(s=>{const o=`https://itunes.apple.com/search?term=${encodeURIComponent(`${n} ${t}`)}&entity=song&limit=1`,u=require("https").get(o,{timeout:2500},f=>{let g="";f.on("data",m=>g+=m),f.on("end",()=>{try{const m=JSON.parse(g);if(m.results&&m.results.length>0){const P=m.results[0].artworkUrl100,k=P?P.replace("100x100bb","600x600bb"):null;return $.set(e,k),s(k)}}catch{}$.set(e,null),s(null)})});u.on("error",()=>{$.set(e,null),s(null)}),u.on("timeout",()=>{u.destroy(),$.set(e,null),s(null)})})}p.handle("get-system-media",async()=>new Promise(n=>{const t=process.platform;if(t==="darwin")l(`osascript -e '
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
            '`,(s,r)=>{if(s)return n(null);const o=r.trim();if(!o||o==="None"||o==="Error")return n(null);const i=o.split("||");i.length>=4?n({name:i[2],artist:i[3],album:i[4],artwork_url:i[5]||null,state:i[1]==="playing"?"playing":"paused",source:i[0]}):n(null)});else if(t==="win32"){const e=B();l(`powershell -NoProfile -ExecutionPolicy Bypass -File "${e}"`,{maxBuffer:10*1024*1024,encoding:"utf8"},async(s,r)=>{if(s||!r||r.trim()==="null"||r.trim()==="'null'")return n(null);try{const o=JSON.parse(r.trim()),i=o.Title||"Unknown Title",u=o.Artist||"Unknown Artist";let f=o.Artwork||null;!f&&i!=="Unknown Title"&&(f=await G(u,i)),n({name:i,artist:u,album:o.Album||"",artwork_url:f,state:o.Status==="playing"||o.Status==="opened"?"playing":"paused",source:o.Source||"Spotify"})}catch{n(null)}})}else if(t==="win32"){let e=179;command==="previous"||command==="prev"?e=177:command==="next"&&(e=176);const s=`$code = @'
using System;
using System.Runtime.InteropServices;
public class MediaKeys {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    public static void Send(byte vk) {
        keybd_event(vk, 0, 0, UIntPtr.Zero);
        keybd_event(vk, 0, 2, UIntPtr.Zero);
    }
}
'@
Add-Type -TypeDefinition $code
[MediaKeys]::Send(${e})`;l(`powershell -NoProfile -Command "${s.replace(/\n/g," ")}"`)}else t==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(e,s)=>{if(e||!s)return n(null);const r=s.trim().split("||");n({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):n(null)}));p.handle("get-bluetooth-status",async()=>new Promise(n=>{const t=process.platform;if(t==="darwin")l("system_profiler SPBluetoothDataType -json",(e,s)=>{if(e)return n(!1);try{const o=JSON.parse(s).SPBluetoothDataType[0],i=o.device_connected&&o.device_connected.length>0;n(i)}catch{n(!1)}});else if(t==="win32")l(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")});else if(t==="win32"){let e=179;command==="previous"||command==="prev"?e=177:command==="next"&&(e=176);const s=`$code = @'
using System;
using System.Runtime.InteropServices;
public class MediaKeys {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    public static void Send(byte vk) {
        keybd_event(vk, 0, 0, UIntPtr.Zero);
        keybd_event(vk, 0, 2, UIntPtr.Zero);
    }
}
'@
Add-Type -TypeDefinition $code
[MediaKeys]::Send(${e})`;l(`powershell -NoProfile -Command "${s.replace(/\n/g," ")}"`)}else t==="linux"?l("bluetoothctl devices Connected",(e,s)=>{if(e)return n(!1);n(s.trim().length>0)}):n(!1)}));p.handle("get-camera-status",async()=>new Promise(n=>{const t=process.platform;if(t==="darwin")l('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(e,s)=>{n(s?s.includes("= Yes"):!1)});else if(t==="win32")l(`powershell -NoProfile -Command "
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
      "`,(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")});else if(t==="win32"){let e=179;command==="previous"||command==="prev"?e=177:command==="next"&&(e=176);const s=`$code = @'
using System;
using System.Runtime.InteropServices;
public class MediaKeys {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    public static void Send(byte vk) {
        keybd_event(vk, 0, 0, UIntPtr.Zero);
        keybd_event(vk, 0, 2, UIntPtr.Zero);
    }
}
'@
Add-Type -TypeDefinition $code
[MediaKeys]::Send(${e})`;l(`powershell -NoProfile -Command "${s.replace(/\n/g," ")}"`)}else t==="linux"?l("fuser /dev/video* 2>/dev/null",(e,s)=>{n(s.trim().length>0)}):n(!1)}));p.handle("get-microphone-status",async()=>new Promise(n=>{const t=process.platform;if(t==="darwin")l('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(e,s)=>{n(s?s.trim().length>0:!1)});else if(t==="win32")l('powershell -NoProfile -Command "@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0"',(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")});else if(t==="win32"){let e=179;command==="previous"||command==="prev"?e=177:command==="next"&&(e=176);const s=`$code = @'
using System;
using System.Runtime.InteropServices;
public class MediaKeys {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    public static void Send(byte vk) {
        keybd_event(vk, 0, 0, UIntPtr.Zero);
        keybd_event(vk, 0, 2, UIntPtr.Zero);
    }
}
'@
Add-Type -TypeDefinition $code
[MediaKeys]::Send(${e})`;l(`powershell -NoProfile -Command "${s.replace(/\n/g," ")}"`)}else t==="linux"?l("pactl list source-outputs | grep -q 'Source #'",e=>{n(!e)}):n(!1)}));c.on("window-all-closed",()=>{process.platform==="linux"&&!C&&c.quit()});p.handle("control-system-media",async(n,t)=>{const e=process.platform;if(e==="darwin"){const s=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${t} track
        else if musicRunning then
            tell application "Music" to ${t} track
        end if
        `;l(`osascript -e '${s}'`)}else if(e==="win32"){let s=179;t==="previous"||t==="prev"?s=177:t==="next"&&(s=176);const r=`$code = @'
using System;
using System.Runtime.InteropServices;
public class MediaKeys {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    public static void Send(byte vk) {
        keybd_event(vk, 0, 0, UIntPtr.Zero);
        keybd_event(vk, 0, 2, UIntPtr.Zero);
    }
}
'@
Add-Type -TypeDefinition $code
[MediaKeys]::Send(${s})`;l(`powershell -NoProfile -Command "${r.replace(/\n/g," ")}"`)}else if(e==="linux"){let s=t;t==="playpause"&&(s="play-pause"),l(`playerctl ${s}`)}});const{Worker:K}=require("worker_threads");let w=null;try{w=require("wasapi-loopback")}catch(n){console.error("[wasapi-loopback] module failed to resolve — has it been built? Reason:",n.message),w={available:!1,start:()=>!1,stop:()=>!1}}let S=null,b=!1,T=0;function Y(){return c.isPackaged?h.join(process.resourcesPath,"audioWorker.js"):h.join(c.getAppPath(),"src","audio","audioWorker.js")}function J(){if(S)return S;const n=Y();return d.existsSync(n)?(S=new K(n),S.on("message",t=>{((t==null?void 0:t.type)==="analysis"||(t==null?void 0:t.type)==="bands")&&a&&!a.isDestroyed()&&a.webContents.send("audio-analysis",{bands:t.bands,beat:t.beat||0,bass:t.bass||0})}),S.on("error",t=>{console.error("[audio-worker] error:",t)}),S):(console.error(`[audio-worker] script not found at ${n}`),null)}p.handle("audio-viz-start",()=>{if(!w.available)return{started:!1,reason:"unsupported-platform"};if(T++,b)return{started:!0};const n=J();if(!n)return{started:!1,reason:"worker-unavailable"};const t=w.start((e,s)=>{n.postMessage({type:"pcm",samples:e,sampleRate:s},[e.buffer])});return b=t,{started:t}});p.handle("audio-viz-stop",()=>(T=Math.max(0,T-1),T===0&&b&&(w.stop(),b=!1,S&&S.postMessage({type:"reset"})),{stopped:!0}));c.on("before-quit",()=>{b&&w.stop(),S&&S.terminate()});let y={clientId:process.env.SPOTIFY_CLIENT_ID||"",clientSecret:process.env.SPOTIFY_CLIENT_SECRET||"",apiKey:process.env.SPOTIFY_API_KEY||""};function V(){try{const n=require("fs"),t=require("path"),e=t.join(c.getPath("userData"),"spotify-config.json"),s=t.join(c.getAppPath(),"spotify-config.json");let r=null;if(n.existsSync(e)?r=e:n.existsSync(s)&&(r=s),r){const o=JSON.parse(n.readFileSync(r,"utf-8"));y.clientId=o.SPOTIFY_CLIENT_ID||y.clientId,y.clientSecret=o.SPOTIFY_CLIENT_SECRET||y.clientSecret,y.apiKey=o.SPOTIFY_API_KEY||y.apiKey}}catch{}}p.handle("get-spotify-config",()=>(V(),y));p.handle("save-spotify-config",(n,t)=>{if(t){y={...y,...t};try{const e=require("fs"),r=require("path").join(c.getPath("userData"),"spotify-config.json");e.writeFileSync(r,JSON.stringify({SPOTIFY_CLIENT_ID:y.clientId,SPOTIFY_CLIENT_SECRET:y.clientSecret,SPOTIFY_API_KEY:y.apiKey,INSTRUCTIONS:"Spotify Web API Client ID & Client Secret"},null,2))}catch{}}return{success:!0}});
