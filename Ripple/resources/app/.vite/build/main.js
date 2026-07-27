"use strict";const{app:l,BrowserWindow:_,screen:A,ipcMain:u,shell:I,Tray:F,Menu:j,nativeImage:R}=require("electron"),y=require("node:path"),d=require("fs");process.platform==="linux"&&(l.commandLine.appendSwitch("enable-transparent-visuals"),l.commandLine.appendSwitch("disable-gpu-compositing"),l.disableHardwareAcceleration());let k=null,i=null;const{exec:c,spawn:O}=require("child_process");function v(){return new Promise(t=>{const e=Buffer.from(`
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
`,"utf16le").toString("base64");c(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:5*1024*1024},(s,r)=>{if(s||!r)return t([]);try{const o=JSON.parse(r.trim());t(Array.isArray(o)?o:o?[o]:[])}catch{t([])}})})}function D(){return new Promise(t=>{const e=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");c(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:2*1024*1024},(s,r)=>{if(s||!r)return t([]);try{const o=JSON.parse(r.trim());t(Array.isArray(o)?o:o?[o]:[])}catch{t([])}})})}async function L(){const[t,n]=await Promise.all([v(),D()]),e=new Set,s=[];for(const r of[...t,...n]){if(!r.name||!(r.path||r.appId))continue;const o=r.type==="uwp"?`shell:AppsFolder\\${r.appId}`:r.path,a=o.toLowerCase();e.has(a)||(e.add(a),s.push({name:r.name,launch:o}))}return s.sort((r,o)=>r.name.localeCompare(o.name))}function x(t){const n=[];let e=0;for(;e<t.length;){for(;e<t.length&&/\s/.test(t[e]);)e++;if(e>=t.length)break;let s="";for(;e<t.length&&!/\s/.test(t[e]);)if(t[e]==='"'){for(e++;e<t.length&&t[e]!=='"';)s+=t[e++];e<t.length&&e++}else s+=t[e++];s&&n.push(s)}return n}function q(t){const n=t.replace(/\//g,"\\").replace(/%([^%]+)%/g,(o,a)=>process.env[a]||`%${a}%`),e=n.match(/^"([^"]+)"(.*)/);if(e)return{exe:e[1],args:e[2].trim()?x(e[2].trim()):[]};const s=n.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(s)return{exe:s[1],args:s[2]?x(s[2]):[]};const r=n.search(/\s/);return r===-1?{exe:n,args:[]}:{exe:n.slice(0,r),args:x(n.slice(r+1).trim())}}function U(t){const n=t.trim();if(n.startsWith("shell:")){const e=n.replace(/'/g,"''");c(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`);return}if(/[\\\/]/.test(n)){const{exe:e,args:s}=q(n);if(s.length===0){if(e.toLowerCase().endsWith(".url")){try{const p=d.readFileSync(e,"utf8").match(/^URL=(.+)$/im);p&&I.openExternal(p[1].trim())}catch{}return}I.openPath(e).then(a=>{a&&c(`start "" "${e}"`)});return}const r=/[\\/]/.test(e)&&!/\.[^\\.]+$/.test(e)?e+".exe":e;if(/\.(cmd|bat)$/i.test(r)){const a=O("cmd.exe",["/c",r,...s],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}if(/\.ps1$/i.test(r)){const a=O("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",r,...s],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}const o=O(r,s,{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(n.includes(" ")){const e=n.replace(/'/g,"''");c(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`)}else c(`start "" ${n}`)}u.handle("set-ignore-mouse-events",(t,n,e)=>{i&&(process.platform!=="linux"?i.setIgnoreMouseEvents(n,{forward:e||!1}):i.setIgnoreMouseEvents(n))});u.handle("focus-window",()=>{i&&i.focus()});u.handle("open-external",async(t,n)=>{await I.openExternal(n)});u.handle("launch-app",async(t,n)=>{var s;const e=process.platform;if(e==="darwin")c(`open -a "${n}"`);else if(e==="win32"){let r=null;try{const o=y.join(l.getPath("userData"),"app-cache.json");if(d.existsSync(o)){const a=JSON.parse(d.readFileSync(o,"utf8")),p=n.trim().toLowerCase(),f=a.filter(m=>m.name&&m.name.toLowerCase()===p);r=((s=f.find(m=>!m.launch.startsWith("shell:"))||f[0])==null?void 0:s.launch)||null}}catch{}U(r||n)}else c(n)});u.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const t=y.join(l.getPath("userData"),"app-cache.json");try{const n=await L();d.writeFileSync(t,JSON.stringify(n))}catch{}});u.handle("search-apps",async(t,n)=>{if(process.platform!=="win32"||!n)return[];const e=y.join(l.getPath("userData"),"app-cache.json");try{if(!d.existsSync(e))return[];const s=JSON.parse(d.readFileSync(e,"utf8")),r=n.toLowerCase();return s.filter(o=>o.name&&o.name.toLowerCase().includes(r)).slice(0,8)}catch{return[]}});u.handle("get-displays",()=>A.getAllDisplays().map(n=>({id:n.id,label:n.label||`Display ${n.id}`,bounds:n.bounds})));u.handle("set-display",(t,n)=>{if(i){const s=A.getAllDisplays().find(f=>f.id.toString()===n.toString())||A.getPrimaryDisplay(),{x:r,y:o,width:a,height:p}=s.bounds;process.platform,i.setBounds({x:r,y:o,width:a,height:p}),i.show()}});u.handle("update-window-position",(t,n,e)=>{});u.handle("set-auto-launch",(t,n)=>{if(process.platform==="linux"){const e=y.join(l.getPath("home"),".config","autostart"),s=y.join(e,"ripple.desktop");try{if(n){d.existsSync(e)||d.mkdirSync(e,{recursive:!0});const r=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${l.getPath("exe")}"
Icon=${E()}
Terminal=false
`;d.writeFileSync(s,r)}else d.existsSync(s)&&d.unlinkSync(s)}catch(r){console.error("Failed to set auto-launch on Linux:",r)}}else if(process.platform==="win32")try{l.setLoginItemSettings({openAtLogin:n,path:l.getPath("exe")})}catch(e){console.error("Failed to set login item settings on Windows:",e)}});const E=()=>{const t="png";if(l.isPackaged){const n=y.join(process.resourcesPath,`icon.${t}`),e=y.join(process.resourcesPath,`assets/icons/icon.${t}`);return d.existsSync(n)?n:d.existsSync(e)?e:n}return y.join(__dirname,`../../src/assets/icons/icon.${t}`)},M=()=>{const t=A.getPrimaryDisplay(),{x:n,y:e,width:s,height:r}=t.bounds,o=process.platform==="linux",a=process.platform==="win32",p=process.platform==="darwin",f=s,g=r,m=n,P=e,C=a?"toolbar":"panel";i=new _({width:f,height:g,x:m,y:P,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...a?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:E(),...p?{hiddenInMissionControl:!0}:{},type:C,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:y.join(__dirname,"preload.js"),devTools:!1},show:!0}),o?i.setIgnoreMouseEvents(!0):i.setIgnoreMouseEvents(!0,{forward:!0});const W=o?500:0;i.once("ready-to-show",()=>{setTimeout(()=>{i&&(i.show(),o?i.setAlwaysOnTop(!0,"screen-saver"):i.setAlwaysOnTop(!0,"pop-up-menu"),i.focus())},W)}),setTimeout(()=>{i&&!i.isVisible()&&(i.show(),i.focus())},5e3),i.on("closed",()=>{i=null});try{i.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!l.isPackaged||process.env.NODE_ENV==="development")i.loadURL("http://localhost:5173");else{const N=y.join(__dirname,"../renderer/main_window/index.html");i.loadFile(N)}};l.whenReady().then(()=>{process.platform==="darwin"&&l.dock.hide(),M(),l.on("activate",()=>{_.getAllWindows().length===0&&M()});try{const t=E(),e=R.createFromPath(t).resize({width:16,height:16});k=new F(e);const s=j.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{i&&(i.isVisible()?i.hide():i.show())}},{type:"separator"},{label:"Quit",click:()=>{l.quit()}}]);k.setToolTip("Ripple"),k.setContextMenu(s)}catch(t){console.error("Failed to create tray:",t)}});const $=new Map;function G(){const t=require("fs"),e=require("path").join(l.getPath("userData"),"get_media.ps1"),s=`
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
`;try{(!t.existsSync(e)||t.readFileSync(e,"utf8")!==s)&&t.writeFileSync(e,s,"utf8")}catch{}return e}async function B(t,n){if(t==="Unknown Artist"||n==="Unknown Title")return null;const e=`${t}-${n}`.toLowerCase();return $.has(e)?$.get(e):new Promise(s=>{const o=`https://itunes.apple.com/search?term=${encodeURIComponent(`${t} ${n}`)}&entity=song&limit=1`,p=require("https").get(o,{timeout:2500},f=>{let g="";f.on("data",m=>g+=m),f.on("end",()=>{try{const m=JSON.parse(g);if(m.results&&m.results.length>0){const P=m.results[0].artworkUrl100,C=P?P.replace("100x100bb","600x600bb"):null;return $.set(e,C),s(C)}}catch{}$.set(e,null),s(null)})});p.on("error",()=>{$.set(e,null),s(null)}),p.on("timeout",()=>{p.destroy(),$.set(e,null),s(null)})})}u.handle("get-system-media",async()=>new Promise(t=>{const n=process.platform;if(n==="darwin")c(`osascript -e '
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
            '`,(s,r)=>{if(s)return t(null);const o=r.trim();if(!o||o==="None"||o==="Error")return t(null);const a=o.split("||");a.length>=4?t({name:a[2],artist:a[3],album:a[4],artwork_url:a[5]||null,state:a[1]==="playing"?"playing":"paused",source:a[0]}):t(null)});else if(n==="win32"){const e=G();c(`powershell -NoProfile -ExecutionPolicy Bypass -File "${e}"`,{maxBuffer:10*1024*1024,encoding:"utf8"},async(s,r)=>{if(s||!r||r.trim()==="null"||r.trim()==="'null'")return t(null);try{const o=JSON.parse(r.trim()),a=o.Title||"Unknown Title",p=o.Artist||"Unknown Artist";let f=o.Artwork||null;!f&&a!=="Unknown Title"&&(f=await B(p,a)),t({name:a,artist:p,album:o.Album||"",artwork_url:f,state:o.Status==="playing"||o.Status==="opened"?"playing":"paused",source:o.Source||"Spotify"})}catch{t(null)}})}else n==="linux"?c('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(e,s)=>{if(e||!s)return t(null);const r=s.trim().split("||");t({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):t(null)}));u.handle("get-bluetooth-status",async()=>new Promise(t=>{const n=process.platform;n==="darwin"?c("system_profiler SPBluetoothDataType -json",(e,s)=>{if(e)return t(!1);try{const o=JSON.parse(s).SPBluetoothDataType[0],a=o.device_connected&&o.device_connected.length>0;t(a)}catch{t(!1)}}):n==="win32"?c(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(s,r)=>{if(s)return t(!1);t(r.trim().toLowerCase()==="true")}):n==="linux"?c("bluetoothctl devices Connected",(e,s)=>{if(e)return t(!1);t(s.trim().length>0)}):t(!1)}));u.handle("get-camera-status",async()=>new Promise(t=>{const n=process.platform;n==="darwin"?c('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(e,s)=>{t(s?s.includes("= Yes"):!1)}):n==="win32"?c(`powershell -NoProfile -Command "
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
      "`,(s,r)=>{if(s)return t(!1);t(r.trim().toLowerCase()==="true")}):n==="linux"?c("fuser /dev/video* 2>/dev/null",(e,s)=>{t(s.trim().length>0)}):t(!1)}));u.handle("get-microphone-status",async()=>new Promise(t=>{const n=process.platform;n==="darwin"?c('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(e,s)=>{t(s?s.trim().length>0:!1)}):n==="win32"?c('powershell -NoProfile -Command "@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0"',(s,r)=>{if(s)return t(!1);t(r.trim().toLowerCase()==="true")}):n==="linux"?c("pactl list source-outputs | grep -q 'Source #'",e=>{t(!e)}):t(!1)}));l.on("window-all-closed",()=>{process.platform==="linux"&&!k&&l.quit()});u.handle("control-system-media",async(t,n)=>{const e=process.platform;if(e==="darwin"){const s=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${n} track
        else if musicRunning then
            tell application "Music" to ${n} track
        end if
        `;c(`osascript -e '${s}'`)}else if(e==="linux"){let s=n;n==="playpause"&&(s="play-pause"),c(`playerctl ${s}`)}});const{Worker:Y}=require("worker_threads");let w=null;try{w=require("wasapi-loopback")}catch(t){console.error("[wasapi-loopback] module failed to resolve — has it been built? Reason:",t.message),w={available:!1,start:()=>!1,stop:()=>!1}}let S=null,b=!1,T=0;function J(){return l.isPackaged?y.join(process.resourcesPath,"audioWorker.js"):y.join(l.getAppPath(),"src","audio","audioWorker.js")}function K(){if(S)return S;const t=J();return d.existsSync(t)?(S=new Y(t),S.on("message",n=>{((n==null?void 0:n.type)==="analysis"||(n==null?void 0:n.type)==="bands")&&i&&!i.isDestroyed()&&i.webContents.send("audio-analysis",{bands:n.bands,beat:n.beat||0,bass:n.bass||0})}),S.on("error",n=>{console.error("[audio-worker] error:",n)}),S):(console.error(`[audio-worker] script not found at ${t}`),null)}u.handle("audio-viz-start",()=>{if(!w.available)return{started:!1,reason:"unsupported-platform"};if(T++,b)return{started:!0};const t=K();if(!t)return{started:!1,reason:"worker-unavailable"};const n=w.start((e,s)=>{t.postMessage({type:"pcm",samples:e,sampleRate:s},[e.buffer])});return b=n,{started:n}});u.handle("audio-viz-stop",()=>(T=Math.max(0,T-1),T===0&&b&&(w.stop(),b=!1,S&&S.postMessage({type:"reset"})),{stopped:!0}));l.on("before-quit",()=>{b&&w.stop(),S&&S.terminate()});let h={clientId:process.env.SPOTIFY_CLIENT_ID||"",clientSecret:process.env.SPOTIFY_CLIENT_SECRET||"",apiKey:process.env.SPOTIFY_API_KEY||""};function H(){try{const t=require("fs"),n=require("path"),e=n.join(l.getPath("userData"),"spotify-config.json"),s=n.join(l.getAppPath(),"spotify-config.json");let r=null;if(t.existsSync(e)?r=e:t.existsSync(s)&&(r=s),r){const o=JSON.parse(t.readFileSync(r,"utf-8"));h.clientId=o.SPOTIFY_CLIENT_ID||h.clientId,h.clientSecret=o.SPOTIFY_CLIENT_SECRET||h.clientSecret,h.apiKey=o.SPOTIFY_API_KEY||h.apiKey}}catch{}}u.handle("get-spotify-config",()=>(H(),h));u.handle("save-spotify-config",(t,n)=>{if(n){h={...h,...n};try{const e=require("fs"),r=require("path").join(l.getPath("userData"),"spotify-config.json");e.writeFileSync(r,JSON.stringify({SPOTIFY_CLIENT_ID:h.clientId,SPOTIFY_CLIENT_SECRET:h.clientSecret,SPOTIFY_API_KEY:h.apiKey,INSTRUCTIONS:"Spotify Web API Client ID & Client Secret"},null,2))}catch{}}return{success:!0}});
