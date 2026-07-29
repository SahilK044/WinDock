"use strict";const{app:c,BrowserWindow:U,screen:N,ipcMain:u,shell:M,Tray:Y,Menu:J,nativeImage:K}=require("electron"),p=require("node:path"),d=require("fs");process.platform==="linux"&&(c.commandLine.appendSwitch("enable-transparent-visuals"),c.commandLine.appendSwitch("disable-gpu-compositing"),c.disableHardwareAcceleration());let O=null,i=null;const{exec:l,spawn:j}=require("child_process");function H(){return new Promise(t=>{const e=Buffer.from(`
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
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:5*1024*1024},(n,r)=>{if(n||!r)return t([]);try{const o=JSON.parse(r.trim());t(Array.isArray(o)?o:o?[o]:[])}catch{t([])}})})}function z(){return new Promise(t=>{const e=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:2*1024*1024},(n,r)=>{if(n||!r)return t([]);try{const o=JSON.parse(r.trim());t(Array.isArray(o)?o:o?[o]:[])}catch{t([])}})})}async function V(){const[t,s]=await Promise.all([H(),z()]),e=new Set,n=[];for(const r of[...t,...s]){if(!r.name||!(r.path||r.appId))continue;const o=r.type==="uwp"?`shell:AppsFolder\\${r.appId}`:r.path,a=o.toLowerCase();e.has(a)||(e.add(a),n.push({name:r.name,launch:o}))}return n.sort((r,o)=>r.name.localeCompare(o.name))}function E(t){const s=[];let e=0;for(;e<t.length;){for(;e<t.length&&/\s/.test(t[e]);)e++;if(e>=t.length)break;let n="";for(;e<t.length&&!/\s/.test(t[e]);)if(t[e]==='"'){for(e++;e<t.length&&t[e]!=='"';)n+=t[e++];e<t.length&&e++}else n+=t[e++];n&&s.push(n)}return s}function Q(t){const s=t.replace(/\//g,"\\").replace(/%([^%]+)%/g,(o,a)=>process.env[a]||`%${a}%`),e=s.match(/^"([^"]+)"(.*)/);if(e)return{exe:e[1],args:e[2].trim()?E(e[2].trim()):[]};const n=s.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(n)return{exe:n[1],args:n[2]?E(n[2]):[]};const r=s.search(/\s/);return r===-1?{exe:s,args:[]}:{exe:s.slice(0,r),args:E(s.slice(r+1).trim())}}function X(t){const s=t.trim();if(s.startsWith("shell:")){const e=s.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`);return}if(/[\\\/]/.test(s)){const{exe:e,args:n}=Q(s);if(n.length===0){if(e.toLowerCase().endsWith(".url")){try{const f=d.readFileSync(e,"utf8").match(/^URL=(.+)$/im);f&&M.openExternal(f[1].trim())}catch{}return}M.openPath(e).then(a=>{a&&l(`start "" "${e}"`)});return}const r=/[\\/]/.test(e)&&!/\.[^\\.]+$/.test(e)?e+".exe":e;if(/\.(cmd|bat)$/i.test(r)){const a=j("cmd.exe",["/c",r,...n],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}if(/\.ps1$/i.test(r)){const a=j("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",r,...n],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}const o=j(r,n,{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(s.includes(" ")){const e=s.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`)}else l(`start "" ${s}`)}u.handle("set-ignore-mouse-events",(t,s,e)=>{i&&(process.platform!=="linux"?i.setIgnoreMouseEvents(s,{forward:e||!1}):i.setIgnoreMouseEvents(s))});u.handle("focus-window",()=>{i&&i.focus()});u.handle("open-external",async(t,s)=>{await M.openExternal(s)});u.handle("launch-app",async(t,s)=>{var n;const e=process.platform;if(e==="darwin")l(`open -a "${s}"`);else if(e==="win32"){let r=null;try{const o=p.join(c.getPath("userData"),"app-cache.json");if(d.existsSync(o)){const a=JSON.parse(d.readFileSync(o,"utf8")),f=s.trim().toLowerCase(),m=a.filter(w=>w.name&&w.name.toLowerCase()===f);r=((n=m.find(w=>!w.launch.startsWith("shell:"))||m[0])==null?void 0:n.launch)||null}}catch{}X(r||s)}else l(s)});u.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const t=p.join(c.getPath("userData"),"app-cache.json");try{const s=await V();d.writeFileSync(t,JSON.stringify(s))}catch{}});u.handle("search-apps",async(t,s)=>{if(process.platform!=="win32"||!s)return[];const e=p.join(c.getPath("userData"),"app-cache.json");try{if(!d.existsSync(e))return[];const n=JSON.parse(d.readFileSync(e,"utf8")),r=s.toLowerCase();return n.filter(o=>o.name&&o.name.toLowerCase().includes(r)).slice(0,8)}catch{return[]}});u.handle("get-displays",()=>N.getAllDisplays().map(s=>({id:s.id,label:s.label||`Display ${s.id}`,bounds:s.bounds})));u.handle("set-display",(t,s)=>{if(i){const n=N.getAllDisplays().find(m=>m.id.toString()===s.toString())||N.getPrimaryDisplay(),{x:r,y:o,width:a,height:f}=n.bounds;process.platform,i.setBounds({x:r,y:o,width:a,height:f}),i.show()}});u.handle("update-window-position",(t,s,e)=>{});u.handle("set-auto-launch",(t,s)=>{if(process.platform==="linux"){const e=p.join(c.getPath("home"),".config","autostart"),n=p.join(e,"ripple.desktop");try{if(s){d.existsSync(e)||d.mkdirSync(e,{recursive:!0});const r=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${c.getPath("exe")}"
Icon=${W()}
Terminal=false
`;d.writeFileSync(n,r)}else d.existsSync(n)&&d.unlinkSync(n)}catch(r){console.error("Failed to set auto-launch on Linux:",r)}}else if(process.platform==="win32")try{c.setLoginItemSettings({openAtLogin:s,path:c.getPath("exe")})}catch(e){console.error("Failed to set login item settings on Windows:",e)}});const W=()=>{const t="png";if(c.isPackaged){const s=p.join(process.resourcesPath,`icon.${t}`),e=p.join(process.resourcesPath,`assets/icons/icon.${t}`);return d.existsSync(s)?s:d.existsSync(e)?e:s}return p.join(__dirname,`../../src/assets/icons/icon.${t}`)},q=()=>{const t=N.getPrimaryDisplay(),{x:s,y:e,width:n,height:r}=t.bounds,o=process.platform==="linux",a=process.platform==="win32",f=process.platform==="darwin",m=n,S=r,w=s,P=e,C=a?"toolbar":"panel";i=new U({width:m,height:S,x:w,y:P,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...a?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:W(),...f?{hiddenInMissionControl:!0}:{},type:C,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:p.join(__dirname,"preload.js"),devTools:!1,backgroundThrottling:!1},show:!0}),o?i.setIgnoreMouseEvents(!0):i.setIgnoreMouseEvents(!0,{forward:!0});const T=o?500:0;i.once("ready-to-show",()=>{setTimeout(()=>{i&&(i.show(),o?i.setAlwaysOnTop(!0,"screen-saver"):i.setAlwaysOnTop(!0,"pop-up-menu"),i.focus())},T)}),setTimeout(()=>{i&&!i.isVisible()&&(i.show(),i.focus())},5e3),i.on("closed",()=>{i=null});try{i.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!c.isPackaged||process.env.NODE_ENV==="development")i.loadURL("http://localhost:5173");else{const k=p.join(__dirname,"../renderer/main_window/index.html");i.loadFile(k)}};c.whenReady().then(()=>{process.platform==="darwin"&&c.dock.hide(),q(),c.on("activate",()=>{U.getAllWindows().length===0&&q()});try{const t=W(),e=K.createFromPath(t).resize({width:16,height:16});O=new Y(e);const n=J.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{i&&(i.isVisible()?i.hide():i.show())}},{type:"separator"},{label:"Quit",click:()=>{c.quit()}}]);O.setToolTip("Ripple"),O.setContextMenu(n)}catch(t){console.error("Failed to create tray:",t)}});const g=new Map;function Z(){const t=require("fs"),e=require("path").join(c.getPath("userData"),"get_media.ps1"),n=`
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
`;try{(!t.existsSync(e)||t.readFileSync(e,"utf8")!==n)&&t.writeFileSync(e,n,"utf8")}catch{}return e}async function ee(t,s,e){if(t==="Unknown Artist"||s==="Unknown Title")return null;const n=`${t}-${s}-${e||""}`.toLowerCase();return g.has(n)?g.get(n):new Promise(r=>{const a=`https://itunes.apple.com/search?term=${encodeURIComponent(`${t} ${s} ${e||""}`.trim())}&entity=song&limit=10`,m=require("https").get(a,{timeout:3500},S=>{let w="";S.on("data",P=>w+=P),S.on("end",()=>{try{const C=JSON.parse(w).results||[];if(C.length>0){let T=null,k=-999;const F=s.toLowerCase(),G=t.toLowerCase(),v=(e||"").toLowerCase();for(const x of C){let $=0;const _=(x.trackName||"").toLowerCase(),B=(x.artistName||"").toLowerCase(),D=(x.collectionName||"").toLowerCase();(/dj mix|mixtape|today's hits|compilation|various artists/i.test(D)||/dj mix|mixed|remix/i.test(_))&&($-=50),B.includes(G)&&($+=30),_===F?$+=40:_.includes(F)&&($+=20),v&&D.includes(v)&&($+=50),$>k&&(k=$,T=x)}const L=(T||C[0]).artworkUrl100,R=L?L.replace("100x100bb","600x600bb"):null;return g.set(n,R),r(R)}}catch{}g.set(n,null),r(null)})});m.on("error",()=>{g.set(n,null),r(null)}),m.on("timeout",()=>{m.destroy(),g.set(n,null),r(null)})})}u.handle("control-system-media",async(t,s)=>{const e=process.platform;if(e==="darwin"){let n="";s==="playpause"?n=`tell application "System Events"
if (name of every process) contains "Spotify" then
tell application "Spotify" to playpause
else if (name of every process) contains "Music" then
tell application "Music" to playpause
end if
end tell`:s==="next"?n=`tell application "System Events"
if (name of every process) contains "Spotify" then
tell application "Spotify" to next track
else if (name of every process) contains "Music" then
tell application "Music" to next track
end if
end tell`:s==="previous"&&(n=`tell application "System Events"
if (name of every process) contains "Spotify" then
tell application "Spotify" to previous track
else if (name of every process) contains "Music" then
tell application "Music" to previous track
end if
end tell`),l(`osascript -e '${n}'`)}else if(e==="win32"){let n=179;s==="previous"||s==="prev"?n=177:s==="next"&&(n=176);const r=`(New-Object -ComObject WScript.Shell).SendKeys([char]${n})`;l(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${r}"`)}else if(e==="linux"){let n="playerctl play-pause";s==="next"?n="playerctl next":s==="previous"&&(n="playerctl previous"),l(n)}});u.handle("get-system-media",async()=>new Promise(t=>{const s=process.platform;if(s==="darwin")l(`osascript -e '
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
            '`,(n,r)=>{if(n)return t(null);const o=r.trim();if(!o||o==="None"||o==="Error")return t(null);const a=o.split("||");a.length>=4?t({name:a[2],artist:a[3],album:a[4],artwork_url:a[5]||null,state:a[1]==="playing"?"playing":"paused",source:a[0]}):t(null)});else if(s==="win32"){const e=Z();l(`powershell -NoProfile -ExecutionPolicy Bypass -File "${e}"`,{maxBuffer:10*1024*1024,encoding:"utf8"},async(n,r)=>{if(n||!r||r.trim()==="null"||r.trim()==="'null'")return t(null);try{const o=JSON.parse(r.trim()),a=o.Title||"Unknown Title",f=o.Artist||"Unknown Artist";let m=o.Artwork||null;if(a!=="Unknown Title"){const S=await ee(f,a,o.Album);S&&(m=S)}t({name:a,artist:f,album:o.Album||"",artwork_url:m,state:o.Status==="playing"||o.Status==="opened"?"playing":"paused",source:o.Source||"Spotify"})}catch{t(null)}})}else s==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(e,n)=>{if(e||!n)return t(null);const r=n.trim().split("||");t({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):t(null)}));u.handle("get-bluetooth-status",async()=>new Promise(t=>{const s=process.platform;s==="darwin"?l("system_profiler SPBluetoothDataType -json",(e,n)=>{if(e)return t(!1);try{const o=JSON.parse(n).SPBluetoothDataType[0],a=o.device_connected&&o.device_connected.length>0;t(a)}catch{t(!1)}}):s==="win32"?l(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(n,r)=>{if(n)return t(!1);t(r.trim().toLowerCase()==="true")}):s==="linux"?l("bluetoothctl devices Connected",(e,n)=>{if(e)return t(!1);t(n.trim().length>0)}):t(!1)}));u.handle("get-camera-status",async()=>new Promise(t=>{const s=process.platform;s==="darwin"?l('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(e,n)=>{t(n?n.includes("= Yes"):!1)}):s==="win32"?l(`powershell -NoProfile -Command "
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
      "`,(n,r)=>{if(n)return t(!1);t(r.trim().toLowerCase()==="true")}):s==="linux"?l("fuser /dev/video* 2>/dev/null",(e,n)=>{t(n.trim().length>0)}):t(!1)}));u.handle("get-microphone-status",async()=>new Promise(t=>{const s=process.platform;s==="darwin"?l('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(e,n)=>{t(n?n.trim().length>0:!1)}):s==="win32"?l('powershell -NoProfile -Command "@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0"',(n,r)=>{if(n)return t(!1);t(r.trim().toLowerCase()==="true")}):s==="linux"?l("pactl list source-outputs | grep -q 'Source #'",e=>{t(!e)}):t(!1)}));c.on("window-all-closed",()=>{process.platform==="linux"&&!O&&c.quit()});const{Worker:te}=require("worker_threads");let A={available:!1,start:()=>!1,stop:()=>{}};try{if(process.platform==="win32"){const t=[p.join(process.resourcesPath||"","wasapi_loopback.node"),p.join(process.resourcesPath||"","wasapi-loopback.node"),p.join(c.getAppPath(),"resources","wasapi_loopback.node"),p.join(c.getAppPath(),"resources","wasapi-loopback.node"),p.join(__dirname,"../../resources/wasapi_loopback.node"),p.join(__dirname,"../../resources/wasapi-loopback.node"),p.join(__dirname,"../native/wasapi-loopback/build/Release/wasapi_loopback.node")];for(const s of t)try{if(d.existsSync(s)){A=require(s);break}}catch{}}}catch{}let h=null,b=!1,I=0;function se(){if(h)return h;try{const t=[p.join(process.resourcesPath||"","audioWorker.js"),p.join(c.getAppPath(),"resources","audioWorker.js"),p.join(__dirname,"../../resources/audioWorker.js")];let s=null;for(const e of t)if(d.existsSync(e)){s=e;break}return s?(h=new te(s),h.on("message",e=>{(e==null?void 0:e.type)==="analysis"&&i&&!i.isDestroyed()&&i.webContents.send("audio-bands",e.bands)}),h.on("error",e=>{console.error("[AudioWorker] error:",e)}),h.on("exit",()=>{h=null,b=!1}),h):null}catch(t){return console.error("[AudioWorker] failed to start:",t),null}}u.handle("audio-viz-start",()=>{if(!A.available)return{started:!1,reason:"unsupported-platform"};if(I++,b)return{started:!0};const t=se();if(!t)return{started:!1,reason:"worker-unavailable"};const s=A.start((e,n)=>{t.postMessage({type:"pcm",samples:e,sampleRate:n},[e.buffer])});return b=s,{started:s}});u.handle("audio-viz-stop",()=>(I=Math.max(0,I-1),I===0&&b&&(A.stop(),b=!1,h&&h.postMessage({type:"reset"})),{stopped:!0}));c.on("before-quit",()=>{b&&A.stop(),h&&h.terminate()});let y={clientId:process.env.SPOTIFY_CLIENT_ID||"",clientSecret:process.env.SPOTIFY_CLIENT_SECRET||"",apiKey:process.env.SPOTIFY_API_KEY||""};function ne(){try{const t=require("fs"),s=require("path"),e=s.join(c.getPath("userData"),"spotify-config.json"),n=s.join(c.getAppPath(),"spotify-config.json");let r=null;if(t.existsSync(e)?r=e:t.existsSync(n)&&(r=n),r){const o=JSON.parse(t.readFileSync(r,"utf-8"));y.clientId=o.SPOTIFY_CLIENT_ID||y.clientId,y.clientSecret=o.SPOTIFY_CLIENT_SECRET||y.clientSecret,y.apiKey=o.SPOTIFY_API_KEY||y.apiKey}}catch{}}u.handle("get-spotify-config",()=>(ne(),y));u.handle("save-spotify-config",(t,s)=>{if(s){y={...y,...s};try{const e=require("fs"),r=require("path").join(c.getPath("userData"),"spotify-config.json");e.writeFileSync(r,JSON.stringify({SPOTIFY_CLIENT_ID:y.clientId,SPOTIFY_CLIENT_SECRET:y.clientSecret,SPOTIFY_API_KEY:y.apiKey,INSTRUCTIONS:"Spotify Web API Client ID & Client Secret"},null,2))}catch{}}return{success:!0}});
