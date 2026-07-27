"use strict";const{app:c,BrowserWindow:N,screen:A,ipcMain:p,shell:v,Tray:F,Menu:W,nativeImage:j}=require("electron"),h=require("node:path"),f=require("fs");process.platform==="linux"&&(c.commandLine.appendSwitch("enable-transparent-visuals"),c.commandLine.appendSwitch("disable-gpu-compositing"),c.disableHardwareAcceleration());let C=null,a=null;const{exec:l,spawn:x}=require("child_process");function R(){return new Promise(n=>{const t=Buffer.from(`
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
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${t}`,{maxBuffer:5*1024*1024},(s,r)=>{if(s||!r)return n([]);try{const i=JSON.parse(r.trim());n(Array.isArray(i)?i:i?[i]:[])}catch{n([])}})})}function D(){return new Promise(n=>{const t=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${t}`,{maxBuffer:2*1024*1024},(s,r)=>{if(s||!r)return n([]);try{const i=JSON.parse(r.trim());n(Array.isArray(i)?i:i?[i]:[])}catch{n([])}})})}async function U(){const[n,e]=await Promise.all([R(),D()]),t=new Set,s=[];for(const r of[...n,...e]){if(!r.name||!(r.path||r.appId))continue;const i=r.type==="uwp"?`shell:AppsFolder\\${r.appId}`:r.path,o=i.toLowerCase();t.has(o)||(t.add(o),s.push({name:r.name,launch:i}))}return s.sort((r,i)=>r.name.localeCompare(i.name))}function I(n){const e=[];let t=0;for(;t<n.length;){for(;t<n.length&&/\s/.test(n[t]);)t++;if(t>=n.length)break;let s="";for(;t<n.length&&!/\s/.test(n[t]);)if(n[t]==='"'){for(t++;t<n.length&&n[t]!=='"';)s+=n[t++];t<n.length&&t++}else s+=n[t++];s&&e.push(s)}return e}function L(n){const e=n.replace(/\//g,"\\").replace(/%([^%]+)%/g,(i,o)=>process.env[o]||`%${o}%`),t=e.match(/^"([^"]+)"(.*)/);if(t)return{exe:t[1],args:t[2].trim()?I(t[2].trim()):[]};const s=e.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(s)return{exe:s[1],args:s[2]?I(s[2]):[]};const r=e.search(/\s/);return r===-1?{exe:e,args:[]}:{exe:e.slice(0,r),args:I(e.slice(r+1).trim())}}function q(n){const e=n.trim();if(e.startsWith("shell:")){const t=e.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${t}'"`);return}if(/[\\\/]/.test(e)){const{exe:t,args:s}=L(e);if(s.length===0){if(t.toLowerCase().endsWith(".url")){try{const u=f.readFileSync(t,"utf8").match(/^URL=(.+)$/im);u&&v.openExternal(u[1].trim())}catch{}return}v.openPath(t).then(o=>{o&&l(`start "" "${t}"`)});return}const r=/[\\/]/.test(t)&&!/\.[^\\.]+$/.test(t)?t+".exe":t;if(/\.(cmd|bat)$/i.test(r)){const o=x("cmd.exe",["/c",r,...s],{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(/\.ps1$/i.test(r)){const o=x("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",r,...s],{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}const i=x(r,s,{shell:!1,detached:!0,stdio:"ignore"});i.on("error",()=>{}),i.unref();return}if(e.includes(" ")){const t=e.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${t}'"`)}else l(`start "" ${e}`)}p.handle("set-ignore-mouse-events",(n,e,t)=>{a&&(process.platform!=="linux"?a.setIgnoreMouseEvents(e,{forward:t||!1}):a.setIgnoreMouseEvents(e))});p.handle("focus-window",()=>{a&&a.focus()});p.handle("open-external",async(n,e)=>{await v.openExternal(e)});p.handle("launch-app",async(n,e)=>{var s;const t=process.platform;if(t==="darwin")l(`open -a "${e}"`);else if(t==="win32"){let r=null;try{const i=h.join(c.getPath("userData"),"app-cache.json");if(f.existsSync(i)){const o=JSON.parse(f.readFileSync(i,"utf8")),u=e.trim().toLowerCase(),d=o.filter(y=>y.name&&y.name.toLowerCase()===u);r=((s=d.find(y=>!y.launch.startsWith("shell:"))||d[0])==null?void 0:s.launch)||null}}catch{}q(r||e)}else l(e)});p.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const n=h.join(c.getPath("userData"),"app-cache.json");try{const e=await U();f.writeFileSync(n,JSON.stringify(e))}catch{}});p.handle("search-apps",async(n,e)=>{if(process.platform!=="win32"||!e)return[];const t=h.join(c.getPath("userData"),"app-cache.json");try{if(!f.existsSync(t))return[];const s=JSON.parse(f.readFileSync(t,"utf8")),r=e.toLowerCase();return s.filter(i=>i.name&&i.name.toLowerCase().includes(r)).slice(0,8)}catch{return[]}});p.handle("get-displays",()=>A.getAllDisplays().map(e=>({id:e.id,label:e.label||`Display ${e.id}`,bounds:e.bounds})));p.handle("set-display",(n,e)=>{if(a){const s=A.getAllDisplays().find(d=>d.id.toString()===e.toString())||A.getPrimaryDisplay(),{x:r,y:i,width:o,height:u}=s.bounds;process.platform,a.setBounds({x:r,y:i,width:o,height:u}),a.show()}});p.handle("update-window-position",(n,e,t)=>{});p.handle("set-auto-launch",(n,e)=>{if(process.platform==="linux"){const t=h.join(c.getPath("home"),".config","autostart"),s=h.join(t,"ripple.desktop");try{if(e){f.existsSync(t)||f.mkdirSync(t,{recursive:!0});const r=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${c.getPath("exe")}"
Icon=${O()}
Terminal=false
`;f.writeFileSync(s,r)}else f.existsSync(s)&&f.unlinkSync(s)}catch(r){console.error("Failed to set auto-launch on Linux:",r)}}else if(process.platform==="win32")try{c.setLoginItemSettings({openAtLogin:e,path:c.getPath("exe")})}catch(t){console.error("Failed to set login item settings on Windows:",t)}});const O=()=>{const n="png";if(c.isPackaged){const e=h.join(process.resourcesPath,`icon.${n}`),t=h.join(process.resourcesPath,`assets/icons/icon.${n}`);return f.existsSync(e)?e:f.existsSync(t)?t:e}return h.join(__dirname,`../../src/assets/icons/icon.${n}`)},E=()=>{const n=A.getPrimaryDisplay(),{x:e,y:t,width:s,height:r}=n.bounds,i=process.platform==="linux",o=process.platform==="win32",u=process.platform==="darwin",d=s,g=r,y=e,P=t,k=o?"toolbar":"panel";a=new N({width:d,height:g,x:y,y:P,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...o?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:O(),...u?{hiddenInMissionControl:!0}:{},type:k,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:h.join(__dirname,"preload.js"),devTools:!1},show:!0}),i?a.setIgnoreMouseEvents(!0):a.setIgnoreMouseEvents(!0,{forward:!0});const _=i?500:0;a.once("ready-to-show",()=>{setTimeout(()=>{a&&(a.show(),i?a.setAlwaysOnTop(!0,"screen-saver"):a.setAlwaysOnTop(!0,"pop-up-menu"),a.focus())},_)}),setTimeout(()=>{a&&!a.isVisible()&&(a.show(),a.focus())},5e3),a.on("closed",()=>{a=null});try{a.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!c.isPackaged||process.env.NODE_ENV==="development")a.loadURL("http://localhost:5173");else{const M=h.join(__dirname,"../renderer/main_window/index.html");a.loadFile(M)}};c.whenReady().then(()=>{process.platform==="darwin"&&c.dock.hide(),E(),c.on("activate",()=>{N.getAllWindows().length===0&&E()});try{const n=O(),t=j.createFromPath(n).resize({width:16,height:16});C=new F(t);const s=W.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{a&&(a.isVisible()?a.hide():a.show())}},{type:"separator"},{label:"Quit",click:()=>{c.quit()}}]);C.setToolTip("Ripple"),C.setContextMenu(s)}catch(n){console.error("Failed to create tray:",n)}});const w=new Map;function G(){const n=require("fs"),t=require("path").join(c.getPath("userData"),"get_media.ps1"),s=`
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
`;try{(!n.existsSync(t)||n.readFileSync(t,"utf8")!==s)&&n.writeFileSync(t,s,"utf8")}catch{}return t}async function B(n,e){if(n==="Unknown Artist"||e==="Unknown Title")return null;const t=`${n}-${e}`.toLowerCase();return w.has(t)?w.get(t):new Promise(s=>{const i=`https://itunes.apple.com/search?term=${encodeURIComponent(`${n} ${e}`)}&entity=song&limit=1`,u=require("https").get(i,{timeout:2500},d=>{let g="";d.on("data",y=>g+=y),d.on("end",()=>{try{const y=JSON.parse(g);if(y.results&&y.results.length>0){const P=y.results[0].artworkUrl100,k=P?P.replace("100x100bb","600x600bb"):null;return w.set(t,k),s(k)}}catch{}w.set(t,null),s(null)})});u.on("error",()=>{w.set(t,null),s(null)}),u.on("timeout",()=>{u.destroy(),w.set(t,null),s(null)})})}p.handle("control-system-media",async(n,e)=>{const t=process.platform;if(t==="darwin"){let s="";e==="playpause"?s=`tell application "System Events"
if (name of every process) contains "Spotify" then
tell application "Spotify" to playpause
else if (name of every process) contains "Music" then
tell application "Music" to playpause
end if
end tell`:e==="next"?s=`tell application "System Events"
if (name of every process) contains "Spotify" then
tell application "Spotify" to next track
else if (name of every process) contains "Music" then
tell application "Music" to next track
end if
end tell`:e==="previous"&&(s=`tell application "System Events"
if (name of every process) contains "Spotify" then
tell application "Spotify" to previous track
else if (name of every process) contains "Music" then
tell application "Music" to previous track
end if
end tell`),l(`osascript -e '${s}'`)}else if(t==="win32"){let s="0xB3";e==="previous"||e==="prev"?s="0xB1":e==="next"&&(s="0xB0");const r=`Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class MediaKeys { [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo); public static void Send(byte vk) { keybd_event(vk, 0, 0, UIntPtr.Zero); keybd_event(vk, 0, 2, UIntPtr.Zero); } }'; [MediaKeys]::Send(${s})`;l(`powershell -NoProfile -Command "${r}"`)}else if(t==="linux"){let s="playerctl play-pause";e==="next"?s="playerctl next":e==="previous"&&(s="playerctl previous"),l(s)}});p.handle("get-system-media",async()=>new Promise(n=>{const e=process.platform;if(e==="darwin")l(`osascript -e '
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
            '`,(s,r)=>{if(s)return n(null);const i=r.trim();if(!i||i==="None"||i==="Error")return n(null);const o=i.split("||");o.length>=4?n({name:o[2],artist:o[3],album:o[4],artwork_url:o[5]||null,state:o[1]==="playing"?"playing":"paused",source:o[0]}):n(null)});else if(e==="win32"){const t=G();l(`powershell -NoProfile -ExecutionPolicy Bypass -File "${t}"`,{maxBuffer:10*1024*1024,encoding:"utf8"},async(s,r)=>{if(s||!r||r.trim()==="null"||r.trim()==="'null'")return n(null);try{const i=JSON.parse(r.trim()),o=i.Title||"Unknown Title",u=i.Artist||"Unknown Artist";let d=i.Artwork||null;!d&&o!=="Unknown Title"&&(d=await B(u,o)),n({name:o,artist:u,album:i.Album||"",artwork_url:d,state:i.Status==="playing"||i.Status==="opened"?"playing":"paused",source:i.Source||"Spotify"})}catch{n(null)}})}else e==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(t,s)=>{if(t||!s)return n(null);const r=s.trim().split("||");n({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):n(null)}));p.handle("get-bluetooth-status",async()=>new Promise(n=>{const e=process.platform;e==="darwin"?l("system_profiler SPBluetoothDataType -json",(t,s)=>{if(t)return n(!1);try{const i=JSON.parse(s).SPBluetoothDataType[0],o=i.device_connected&&i.device_connected.length>0;n(o)}catch{n(!1)}}):e==="win32"?l(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")}):e==="linux"?l("bluetoothctl devices Connected",(t,s)=>{if(t)return n(!1);n(s.trim().length>0)}):n(!1)}));p.handle("get-camera-status",async()=>new Promise(n=>{const e=process.platform;e==="darwin"?l('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(t,s)=>{n(s?s.includes("= Yes"):!1)}):e==="win32"?l(`powershell -NoProfile -Command "
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
      "`,(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")}):e==="linux"?l("fuser /dev/video* 2>/dev/null",(t,s)=>{n(s.trim().length>0)}):n(!1)}));p.handle("get-microphone-status",async()=>new Promise(n=>{const e=process.platform;e==="darwin"?l('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(t,s)=>{n(s?s.trim().length>0:!1)}):e==="win32"?l('powershell -NoProfile -Command "@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0"',(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")}):e==="linux"?l("pactl list source-outputs | grep -q 'Source #'",t=>{n(!t)}):n(!1)}));c.on("window-all-closed",()=>{process.platform==="linux"&&!C&&c.quit()});p.handle("control-system-media",async(n,e)=>{const t=process.platform;if(t==="darwin"){const s=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${e} track
        else if musicRunning then
            tell application "Music" to ${e} track
        end if
        `;l(`osascript -e '${s}'`)}else if(t==="win32"){let s=179;e==="previous"||e==="prev"?s=177:e==="next"&&(s=176);const r=`$code = @'
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
[MediaKeys]::Send(${s})`;l(`powershell -NoProfile -Command "${r.replace(/\n/g," ")}"`)}else if(t==="linux"){let s=e;e==="playpause"&&(s="play-pause"),l(`playerctl ${s}`)}});const{Worker:K}=require("worker_threads");let $=null;try{$=require("wasapi-loopback")}catch(n){console.error("[wasapi-loopback] module failed to resolve — has it been built? Reason:",n.message),$={available:!1,start:()=>!1,stop:()=>!1}}let S=null,b=!1,T=0;function Y(){return c.isPackaged?h.join(process.resourcesPath,"audioWorker.js"):h.join(c.getAppPath(),"src","audio","audioWorker.js")}function J(){if(S)return S;const n=Y();return f.existsSync(n)?(S=new K(n),S.on("message",e=>{((e==null?void 0:e.type)==="analysis"||(e==null?void 0:e.type)==="bands")&&a&&!a.isDestroyed()&&a.webContents.send("audio-analysis",{bands:e.bands,beat:e.beat||0,bass:e.bass||0})}),S.on("error",e=>{console.error("[audio-worker] error:",e)}),S):(console.error(`[audio-worker] script not found at ${n}`),null)}p.handle("audio-viz-start",()=>{if(!$.available)return{started:!1,reason:"unsupported-platform"};if(T++,b)return{started:!0};const n=J();if(!n)return{started:!1,reason:"worker-unavailable"};const e=$.start((t,s)=>{n.postMessage({type:"pcm",samples:t,sampleRate:s},[t.buffer])});return b=e,{started:e}});p.handle("audio-viz-stop",()=>(T=Math.max(0,T-1),T===0&&b&&($.stop(),b=!1,S&&S.postMessage({type:"reset"})),{stopped:!0}));c.on("before-quit",()=>{b&&$.stop(),S&&S.terminate()});let m={clientId:process.env.SPOTIFY_CLIENT_ID||"",clientSecret:process.env.SPOTIFY_CLIENT_SECRET||"",apiKey:process.env.SPOTIFY_API_KEY||""};function V(){try{const n=require("fs"),e=require("path"),t=e.join(c.getPath("userData"),"spotify-config.json"),s=e.join(c.getAppPath(),"spotify-config.json");let r=null;if(n.existsSync(t)?r=t:n.existsSync(s)&&(r=s),r){const i=JSON.parse(n.readFileSync(r,"utf-8"));m.clientId=i.SPOTIFY_CLIENT_ID||m.clientId,m.clientSecret=i.SPOTIFY_CLIENT_SECRET||m.clientSecret,m.apiKey=i.SPOTIFY_API_KEY||m.apiKey}}catch{}}p.handle("get-spotify-config",()=>(V(),m));p.handle("save-spotify-config",(n,e)=>{if(e){m={...m,...e};try{const t=require("fs"),r=require("path").join(c.getPath("userData"),"spotify-config.json");t.writeFileSync(r,JSON.stringify({SPOTIFY_CLIENT_ID:m.clientId,SPOTIFY_CLIENT_SECRET:m.clientSecret,SPOTIFY_API_KEY:m.apiKey,INSTRUCTIONS:"Spotify Web API Client ID & Client Secret"},null,2))}catch{}}return{success:!0}});
