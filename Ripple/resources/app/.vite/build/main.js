"use strict";const{app:c,BrowserWindow:q,screen:I,ipcMain:u,shell:M,Tray:Y,Menu:J,nativeImage:K}=require("electron"),p=require("node:path"),d=require("fs");process.platform==="linux"&&(c.commandLine.appendSwitch("enable-transparent-visuals"),c.commandLine.appendSwitch("disable-gpu-compositing"),c.disableHardwareAcceleration());let O=null,i=null;const{exec:l,spawn:_}=require("child_process");function z(){return new Promise(t=>{const e=Buffer.from(`
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
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:5*1024*1024},(s,r)=>{if(s||!r)return t([]);try{const o=JSON.parse(r.trim());t(Array.isArray(o)?o:o?[o]:[])}catch{t([])}})})}function H(){return new Promise(t=>{const e=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:2*1024*1024},(s,r)=>{if(s||!r)return t([]);try{const o=JSON.parse(r.trim());t(Array.isArray(o)?o:o?[o]:[])}catch{t([])}})})}async function V(){const[t,n]=await Promise.all([z(),H()]),e=new Set,s=[];for(const r of[...t,...n]){if(!r.name||!(r.path||r.appId))continue;const o=r.type==="uwp"?`shell:AppsFolder\\${r.appId}`:r.path,a=o.toLowerCase();e.has(a)||(e.add(a),s.push({name:r.name,launch:o}))}return s.sort((r,o)=>r.name.localeCompare(o.name))}function j(t){const n=[];let e=0;for(;e<t.length;){for(;e<t.length&&/\s/.test(t[e]);)e++;if(e>=t.length)break;let s="";for(;e<t.length&&!/\s/.test(t[e]);)if(t[e]==='"'){for(e++;e<t.length&&t[e]!=='"';)s+=t[e++];e<t.length&&e++}else s+=t[e++];s&&n.push(s)}return n}function Q(t){const n=t.replace(/\//g,"\\").replace(/%([^%]+)%/g,(o,a)=>process.env[a]||`%${a}%`),e=n.match(/^"([^"]+)"(.*)/);if(e)return{exe:e[1],args:e[2].trim()?j(e[2].trim()):[]};const s=n.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(s)return{exe:s[1],args:s[2]?j(s[2]):[]};const r=n.search(/\s/);return r===-1?{exe:n,args:[]}:{exe:n.slice(0,r),args:j(n.slice(r+1).trim())}}function X(t){const n=t.trim();if(n.startsWith("shell:")){const e=n.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`);return}if(/[\\\/]/.test(n)){const{exe:e,args:s}=Q(n);if(s.length===0){if(e.toLowerCase().endsWith(".url")){try{const f=d.readFileSync(e,"utf8").match(/^URL=(.+)$/im);f&&M.openExternal(f[1].trim())}catch{}return}M.openPath(e).then(a=>{a&&l(`start "" "${e}"`)});return}const r=/[\\/]/.test(e)&&!/\.[^\\.]+$/.test(e)?e+".exe":e;if(/\.(cmd|bat)$/i.test(r)){const a=_("cmd.exe",["/c",r,...s],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}if(/\.ps1$/i.test(r)){const a=_("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",r,...s],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}const o=_(r,s,{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(n.includes(" ")){const e=n.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`)}else l(`start "" ${n}`)}u.handle("set-ignore-mouse-events",(t,n,e)=>{i&&(process.platform!=="linux"?i.setIgnoreMouseEvents(n,{forward:e||!1}):i.setIgnoreMouseEvents(n))});u.handle("focus-window",()=>{i&&i.focus()});u.handle("open-external",async(t,n)=>{await M.openExternal(n)});u.handle("launch-app",async(t,n)=>{var s;const e=process.platform;if(e==="darwin")l(`open -a "${n}"`);else if(e==="win32"){let r=null;try{const o=p.join(c.getPath("userData"),"app-cache.json");if(d.existsSync(o)){const a=JSON.parse(d.readFileSync(o,"utf8")),f=n.trim().toLowerCase(),m=a.filter(w=>w.name&&w.name.toLowerCase()===f);r=((s=m.find(w=>!w.launch.startsWith("shell:"))||m[0])==null?void 0:s.launch)||null}}catch{}X(r||n)}else l(n)});u.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const t=p.join(c.getPath("userData"),"app-cache.json");try{const n=await V();d.writeFileSync(t,JSON.stringify(n))}catch{}});u.handle("search-apps",async(t,n)=>{if(process.platform!=="win32"||!n)return[];const e=p.join(c.getPath("userData"),"app-cache.json");try{if(!d.existsSync(e))return[];const s=JSON.parse(d.readFileSync(e,"utf8")),r=n.toLowerCase();return s.filter(o=>o.name&&o.name.toLowerCase().includes(r)).slice(0,8)}catch{return[]}});u.handle("get-displays",()=>I.getAllDisplays().map(n=>({id:n.id,label:n.label||`Display ${n.id}`,bounds:n.bounds})));u.handle("set-display",(t,n)=>{if(i){const s=I.getAllDisplays().find(m=>m.id.toString()===n.toString())||I.getPrimaryDisplay(),{x:r,y:o,width:a,height:f}=s.bounds;process.platform,i.setBounds({x:r,y:o,width:a,height:f}),i.show()}});u.handle("update-window-position",(t,n,e)=>{});u.handle("set-auto-launch",(t,n)=>{if(process.platform==="linux"){const e=p.join(c.getPath("home"),".config","autostart"),s=p.join(e,"ripple.desktop");try{if(n){d.existsSync(e)||d.mkdirSync(e,{recursive:!0});const r=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${c.getPath("exe")}"
Icon=${W()}
Terminal=false
`;d.writeFileSync(s,r)}else d.existsSync(s)&&d.unlinkSync(s)}catch(r){console.error("Failed to set auto-launch on Linux:",r)}}else if(process.platform==="win32")try{c.setLoginItemSettings({openAtLogin:n,path:c.getPath("exe")})}catch(e){console.error("Failed to set login item settings on Windows:",e)}});const W=()=>{const t="png";if(c.isPackaged){const n=p.join(process.resourcesPath,`icon.${t}`),e=p.join(process.resourcesPath,`assets/icons/icon.${t}`);return d.existsSync(n)?n:d.existsSync(e)?e:n}return p.join(__dirname,`../../src/assets/icons/icon.${t}`)},U=()=>{const t=I.getPrimaryDisplay(),{x:n,y:e,width:s,height:r}=t.bounds,o=process.platform==="linux",a=process.platform==="win32",f=process.platform==="darwin",m=s,$=r,w=n,C=e,k=a?"toolbar":"panel";i=new q({width:m,height:$,x:w,y:C,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...a?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:W(),...f?{hiddenInMissionControl:!0}:{},type:k,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:p.join(__dirname,"preload.js"),devTools:!1,backgroundThrottling:!1},show:!0}),o?i.setIgnoreMouseEvents(!0):i.setIgnoreMouseEvents(!0,{forward:!0});const T=o?500:0;i.once("ready-to-show",()=>{setTimeout(()=>{i&&(i.show(),o?i.setAlwaysOnTop(!0,"screen-saver"):i.setAlwaysOnTop(!0,"pop-up-menu"),i.focus())},T)}),setTimeout(()=>{i&&!i.isVisible()&&(i.show(),i.focus())},5e3),i.on("closed",()=>{i=null});try{i.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!c.isPackaged||process.env.NODE_ENV==="development")i.loadURL("http://localhost:5173");else{const A=p.join(__dirname,"../renderer/main_window/index.html");i.loadFile(A)}};c.whenReady().then(()=>{process.platform==="darwin"&&c.dock.hide(),U(),c.on("activate",()=>{q.getAllWindows().length===0&&U()});try{const t=W(),e=K.createFromPath(t).resize({width:16,height:16});O=new Y(e);const s=J.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{i&&(i.isVisible()?i.hide():i.show())}},{type:"separator"},{label:"Quit",click:()=>{c.quit()}}]);O.setToolTip("Ripple"),O.setContextMenu(s)}catch(t){console.error("Failed to create tray:",t)}});const P=new Map;function Z(){const t=require("fs"),e=require("path").join(c.getPath("userData"),"get_media.ps1"),s=`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
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
`;try{(!t.existsSync(e)||t.readFileSync(e,"utf8")!==s)&&t.writeFileSync(e,"\uFEFF"+s,"utf8")}catch{}return e}async function ee(t,n,e){if(t==="Unknown Artist"||n==="Unknown Title")return null;const s=`${t}-${n}-${e||""}`.toLowerCase();return P.has(s)?P.get(s):new Promise(r=>{const a=`https://itunes.apple.com/search?term=${encodeURIComponent(`${t} ${n} ${e||""}`.trim())}&entity=song&limit=10`,m=require("https").get(a,{timeout:3500},$=>{let w="";$.on("data",C=>w+=C),$.on("end",()=>{try{const k=JSON.parse(w).results||[];if(k.length>0){let T=null,A=-999;const F=n.toLowerCase(),G=t.toLowerCase(),v=(e||"").toLowerCase();for(const x of k){let b=0;const N=(x.trackName||"").toLowerCase(),B=(x.artistName||"").toLowerCase(),D=(x.collectionName||"").toLowerCase();(/dj mix|mixtape|today's hits|compilation|various artists/i.test(D)||/dj mix|mixed|remix/i.test(N))&&(b-=50),B.includes(G)&&(b+=30),N===F?b+=40:N.includes(F)&&(b+=20),v&&D.includes(v)&&(b+=50),b>A&&(A=b,T=x)}const L=(T||k[0]).artworkUrl100,R=L?L.replace("100x100bb","600x600bb"):null;return P.set(s,R),r(R)}}catch{}P.set(s,null),r(null)})});m.on("error",()=>{P.set(s,null),r(null)}),m.on("timeout",()=>{m.destroy(),P.set(s,null),r(null)})})}u.handle("control-system-media",async(t,n)=>{const e=process.platform;if(e==="darwin"){let s="";n==="playpause"?s=`tell application "System Events"
if (name of every process) contains "Spotify" then
tell application "Spotify" to playpause
else if (name of every process) contains "Music" then
tell application "Music" to playpause
end if
end tell`:n==="next"?s=`tell application "System Events"
if (name of every process) contains "Spotify" then
tell application "Spotify" to next track
else if (name of every process) contains "Music" then
tell application "Music" to next track
end if
end tell`:n==="previous"&&(s=`tell application "System Events"
if (name of every process) contains "Spotify" then
tell application "Spotify" to previous track
else if (name of every process) contains "Music" then
tell application "Music" to previous track
end if
end tell`),l(`osascript -e '${s}'`)}else if(e==="win32"){let s=179;if(n==="previous"||n==="prev"?s=177:n==="next"&&(s=176),S&&typeof S.sendMediaKey=="function")S.sendMediaKey(s);else{const r=`(New-Object -ComObject WScript.Shell).SendKeys([char]${s})`;l(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${r}"`)}}else if(e==="linux"){let s="playerctl play-pause";n==="next"?s="playerctl next":n==="previous"&&(s="playerctl previous"),l(s)}});u.handle("get-system-media",async()=>new Promise(t=>{const n=process.platform;if(n==="darwin")l(`osascript -e '
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
            '`,(s,r)=>{if(s)return t(null);const o=r.trim();if(!o||o==="None"||o==="Error")return t(null);const a=o.split("||");a.length>=4?t({name:a[2],artist:a[3],album:a[4],artwork_url:a[5]||null,state:a[1]==="playing"?"playing":"paused",source:a[0]}):t(null)});else if(n==="win32"){const e=Z();l(`powershell -NoProfile -ExecutionPolicy Bypass -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8; & '${e}'"`,{maxBuffer:10*1024*1024,encoding:"utf8"},async(s,r)=>{if(s||!r||r.trim()==="null"||r.trim()==="'null'")return t(null);try{const o=JSON.parse(r.trim()),a=o.Title||"Unknown Title",f=o.Artist||"Unknown Artist";let m=o.Artwork||null;if(a!=="Unknown Title"){const $=await ee(f,a,o.Album);$&&(m=$)}t({name:a,artist:f,album:o.Album||"",artwork_url:m,state:o.Status==="playing"||o.Status==="opened"?"playing":"paused",source:o.Source||"Spotify"})}catch{t(null)}})}else n==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(e,s)=>{if(e||!s)return t(null);const r=s.trim().split("||");t({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):t(null)}));u.handle("get-bluetooth-status",async()=>new Promise(t=>{const n=process.platform;n==="darwin"?l("system_profiler SPBluetoothDataType -json",(e,s)=>{if(e)return t(!1);try{const o=JSON.parse(s).SPBluetoothDataType[0],a=o.device_connected&&o.device_connected.length>0;t(a)}catch{t(!1)}}):n==="win32"?l(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(s,r)=>{if(s)return t(!1);t(r.trim().toLowerCase()==="true")}):n==="linux"?l("bluetoothctl devices Connected",(e,s)=>{if(e)return t(!1);t(s.trim().length>0)}):t(!1)}));u.handle("get-camera-status",async()=>new Promise(t=>{const n=process.platform;n==="darwin"?l('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(e,s)=>{t(s?s.includes("= Yes"):!1)}):n==="win32"?l(`powershell -NoProfile -Command "
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
      "`,(s,r)=>{if(s)return t(!1);t(r.trim().toLowerCase()==="true")}):n==="linux"?l("fuser /dev/video* 2>/dev/null",(e,s)=>{t(s.trim().length>0)}):t(!1)}));u.handle("get-microphone-status",async()=>new Promise(t=>{const n=process.platform;n==="darwin"?l('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(e,s)=>{t(s?s.trim().length>0:!1)}):n==="win32"?l('powershell -NoProfile -Command "@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0"',(s,r)=>{if(s)return t(!1);t(r.trim().toLowerCase()==="true")}):n==="linux"?l("pactl list source-outputs | grep -q 'Source #'",e=>{t(!e)}):t(!1)}));c.on("window-all-closed",()=>{process.platform==="linux"&&!O&&c.quit()});const{Worker:te}=require("worker_threads");let S={available:!1,start:()=>!1,stop:()=>{}};try{if(process.platform==="win32"){const t=[p.join(process.resourcesPath||"","wasapi_loopback.node"),p.join(process.resourcesPath||"","wasapi-loopback.node"),p.join(c.getAppPath(),"resources","wasapi_loopback.node"),p.join(c.getAppPath(),"resources","wasapi-loopback.node"),p.join(__dirname,"../../resources/wasapi_loopback.node"),p.join(__dirname,"../../resources/wasapi-loopback.node"),p.join(__dirname,"../native/wasapi-loopback/build/Release/wasapi_loopback.node")];for(const n of t)try{if(d.existsSync(n)){const e=require(n);if(e&&typeof e.start=="function"){S=e,S.available=!0,console.log("[WASAPI] Loaded native loopback addon from:",n);break}}}catch(e){console.error("[WASAPI] Error loading candidate:",n,e)}}}catch(t){console.error("[WASAPI] Addon initialization error:",t)}let h=null,g=!1,E=0;function ne(){if(h)return h;try{const t=[p.join(process.resourcesPath||"","audioWorker.js"),p.join(c.getAppPath(),"resources","audioWorker.js"),p.join(__dirname,"../../resources/audioWorker.js")];let n=null;for(const e of t)if(d.existsSync(e)){n=e;break}return n?(h=new te(n),h.on("message",e=>{if((e==null?void 0:e.type)==="analysis"&&i&&!i.isDestroyed()){const s={bands:e.bands,beat:e.beat,bass:e.bass};i.webContents.send("audio-analysis",s),i.webContents.send("audio-bands",e.bands)}}),h.on("error",e=>{console.error("[AudioWorker] error:",e)}),h.on("exit",()=>{h=null,g=!1}),h):null}catch(t){return console.error("[AudioWorker] failed to start:",t),null}}u.handle("audio-viz-start",()=>{if(!S||!S.available&&typeof S.start!="function")return{started:!1,reason:"unsupported-platform"};if(E++,g)return{started:!0};const t=ne();return t?(g=!!S.start((e,s)=>{t.postMessage({type:"pcm",samples:e,sampleRate:s},[e.buffer])}),console.log("[WASAPI] Native audio capture started successfully:",g),{started:g}):{started:!1,reason:"worker-unavailable"}});u.handle("audio-viz-stop",()=>(E=Math.max(0,E-1),E===0&&g&&(S.stop(),g=!1,h&&h.postMessage({type:"reset"})),{stopped:!0}));c.on("before-quit",()=>{g&&S.stop(),h&&h.terminate()});let y={clientId:process.env.SPOTIFY_CLIENT_ID||"",clientSecret:process.env.SPOTIFY_CLIENT_SECRET||"",apiKey:process.env.SPOTIFY_API_KEY||""};function se(){try{const t=require("fs"),n=require("path"),e=n.join(c.getPath("userData"),"spotify-config.json"),s=n.join(c.getAppPath(),"spotify-config.json");let r=null;if(t.existsSync(e)?r=e:t.existsSync(s)&&(r=s),r){const o=JSON.parse(t.readFileSync(r,"utf-8"));y.clientId=o.SPOTIFY_CLIENT_ID||y.clientId,y.clientSecret=o.SPOTIFY_CLIENT_SECRET||y.clientSecret,y.apiKey=o.SPOTIFY_API_KEY||y.apiKey}}catch{}}u.handle("get-spotify-config",()=>(se(),y));u.handle("save-spotify-config",(t,n)=>{if(n){y={...y,...n};try{const e=require("fs"),r=require("path").join(c.getPath("userData"),"spotify-config.json");e.writeFileSync(r,JSON.stringify({SPOTIFY_CLIENT_ID:y.clientId,SPOTIFY_CLIENT_SECRET:y.clientSecret,SPOTIFY_API_KEY:y.apiKey,INSTRUCTIONS:"Spotify Web API Client ID & Client Secret"},null,2))}catch{}}return{success:!0}});
