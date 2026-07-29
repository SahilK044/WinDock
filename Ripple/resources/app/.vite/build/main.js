"use strict";const{app:c,BrowserWindow:q,screen:N,ipcMain:u,shell:T,Tray:Y,Menu:J,nativeImage:K}=require("electron"),p=require("node:path"),f=require("fs");process.platform==="linux"&&(c.commandLine.appendSwitch("enable-transparent-visuals"),c.commandLine.appendSwitch("disable-gpu-compositing"),c.disableHardwareAcceleration());let E=null,i=null;const{exec:l,spawn:j}=require("child_process");function z(){return new Promise(n=>{const e=Buffer.from(`
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
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:5*1024*1024},(s,r)=>{if(s||!r)return n([]);try{const o=JSON.parse(r.trim());n(Array.isArray(o)?o:o?[o]:[])}catch{n([])}})})}function H(){return new Promise(n=>{const e=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:2*1024*1024},(s,r)=>{if(s||!r)return n([]);try{const o=JSON.parse(r.trim());n(Array.isArray(o)?o:o?[o]:[])}catch{n([])}})})}async function V(){const[n,t]=await Promise.all([z(),H()]),e=new Set,s=[];for(const r of[...n,...t]){if(!r.name||!(r.path||r.appId))continue;const o=r.type==="uwp"?`shell:AppsFolder\\${r.appId}`:r.path,a=o.toLowerCase();e.has(a)||(e.add(a),s.push({name:r.name,launch:o}))}return s.sort((r,o)=>r.name.localeCompare(o.name))}function M(n){const t=[];let e=0;for(;e<n.length;){for(;e<n.length&&/\s/.test(n[e]);)e++;if(e>=n.length)break;let s="";for(;e<n.length&&!/\s/.test(n[e]);)if(n[e]==='"'){for(e++;e<n.length&&n[e]!=='"';)s+=n[e++];e<n.length&&e++}else s+=n[e++];s&&t.push(s)}return t}function Q(n){const t=n.replace(/\//g,"\\").replace(/%([^%]+)%/g,(o,a)=>process.env[a]||`%${a}%`),e=t.match(/^"([^"]+)"(.*)/);if(e)return{exe:e[1],args:e[2].trim()?M(e[2].trim()):[]};const s=t.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(s)return{exe:s[1],args:s[2]?M(s[2]):[]};const r=t.search(/\s/);return r===-1?{exe:t,args:[]}:{exe:t.slice(0,r),args:M(t.slice(r+1).trim())}}function X(n){let t=n.trim();if(t.toLowerCase().includes("spotify")){T.openExternal("spotify:").catch(()=>{l('start "" spotify:')});return}if(!t.startsWith("shell:")&&t.includes("!")&&(t=`shell:AppsFolder\\${t}`),t.startsWith("shell:")){const e=t.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`);return}if(/[\\\/]/.test(t)){const{exe:e,args:s}=Q(t);if(s.length===0){if(e.toLowerCase().endsWith(".url")){try{const m=f.readFileSync(e,"utf8").match(/^URL=(.+)$/im);m&&T.openExternal(m[1].trim())}catch{}return}T.openPath(e).then(a=>{a&&l(`start "" "${e}"`)});return}const r=/[\\/]/.test(e)&&!/\.[^\\.]+$/.test(e)?e+".exe":e;if(/\.(cmd|bat)$/i.test(r)){const a=j("cmd.exe",["/c",r,...s],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}if(/\.ps1$/i.test(r)){const a=j("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",r,...s],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}const o=j(r,s,{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(t.includes(" ")){const e=t.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`)}else l(`start "" ${t}`)}u.handle("set-ignore-mouse-events",(n,t,e)=>{i&&(process.platform!=="linux"?i.setIgnoreMouseEvents(t,{forward:e||!1}):i.setIgnoreMouseEvents(t))});u.handle("focus-window",()=>{i&&i.focus()});u.handle("open-external",async(n,t)=>{await T.openExternal(t)});u.handle("launch-app",async(n,t)=>{var r;const e=process.platform,s=(t||"").trim().toLowerCase();if(s.includes("spotify"))try{await T.openExternal("spotify:");return}catch{}if(e==="darwin")l(`open -a "${t}"`);else if(e==="win32"){let o=null;try{const a=p.join(c.getPath("userData"),"app-cache.json");if(f.existsSync(a)){const d=JSON.parse(f.readFileSync(a,"utf8")).filter(h=>h.name&&h.name.toLowerCase()===s);o=((r=d.find(h=>!h.launch.startsWith("shell:"))||d[0])==null?void 0:r.launch)||null}}catch{}X(o||t)}else l(t)});u.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const n=p.join(c.getPath("userData"),"app-cache.json");try{const t=await V();f.writeFileSync(n,JSON.stringify(t))}catch{}});u.handle("search-apps",async(n,t)=>{if(process.platform!=="win32"||!t)return[];const e=p.join(c.getPath("userData"),"app-cache.json");try{if(!f.existsSync(e))return[];const s=JSON.parse(f.readFileSync(e,"utf8")),r=t.toLowerCase();return s.filter(o=>o.name&&o.name.toLowerCase().includes(r)).slice(0,8)}catch{return[]}});u.handle("get-displays",()=>N.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));u.handle("set-display",(n,t)=>{if(i){const s=N.getAllDisplays().find(d=>d.id.toString()===t.toString())||N.getPrimaryDisplay(),{x:r,y:o,width:a,height:m}=s.bounds;process.platform,i.setBounds({x:r,y:o,width:a,height:m}),i.show()}});u.handle("update-window-position",(n,t,e)=>{});u.handle("set-auto-launch",(n,t)=>{if(process.platform==="linux"){const e=p.join(c.getPath("home"),".config","autostart"),s=p.join(e,"ripple.desktop");try{if(t){f.existsSync(e)||f.mkdirSync(e,{recursive:!0});const r=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${c.getPath("exe")}"
Icon=${W()}
Terminal=false
`;f.writeFileSync(s,r)}else f.existsSync(s)&&f.unlinkSync(s)}catch(r){console.error("Failed to set auto-launch on Linux:",r)}}else if(process.platform==="win32")try{c.setLoginItemSettings({openAtLogin:t,path:c.getPath("exe")})}catch(e){console.error("Failed to set login item settings on Windows:",e)}});const W=()=>{const n="png";if(c.isPackaged){const t=p.join(process.resourcesPath,`icon.${n}`),e=p.join(process.resourcesPath,`assets/icons/icon.${n}`);return f.existsSync(t)?t:f.existsSync(e)?e:t}return p.join(__dirname,`../../src/assets/icons/icon.${n}`)},U=()=>{const n=N.getPrimaryDisplay(),{x:t,y:e,width:s,height:r}=n.bounds,o=process.platform==="linux",a=process.platform==="win32",m=process.platform==="darwin",d=s,$=r,h=t,C=e,k=a?"toolbar":"panel";i=new q({width:d,height:$,x:h,y:C,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...a?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:W(),...m?{hiddenInMissionControl:!0}:{},type:k,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:p.join(__dirname,"preload.js"),devTools:!1,backgroundThrottling:!1},show:!0}),o?i.setIgnoreMouseEvents(!0):i.setIgnoreMouseEvents(!0,{forward:!0});const x=o?500:0;i.once("ready-to-show",()=>{setTimeout(()=>{i&&(i.show(),o?i.setAlwaysOnTop(!0,"screen-saver"):i.setAlwaysOnTop(!0,"pop-up-menu"),i.focus())},x)}),setTimeout(()=>{i&&!i.isVisible()&&(i.show(),i.focus())},5e3),i.on("closed",()=>{i=null});try{i.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!c.isPackaged||process.env.NODE_ENV==="development")i.loadURL("http://localhost:5173");else{const A=p.join(__dirname,"../renderer/main_window/index.html");i.loadFile(A)}};c.whenReady().then(()=>{process.platform==="darwin"&&c.dock.hide(),U(),c.on("activate",()=>{q.getAllWindows().length===0&&U()});try{const n=W(),e=K.createFromPath(n).resize({width:16,height:16});E=new Y(e);const s=J.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{i&&(i.isVisible()?i.hide():i.show())}},{type:"separator"},{label:"Quit",click:()=>{c.quit()}}]);E.setToolTip("Ripple"),E.setContextMenu(s)}catch(n){console.error("Failed to create tray:",n)}});const P=new Map;function Z(){const n=require("fs"),e=require("path").join(c.getPath("userData"),"get_media.ps1"),s=`
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
`;try{(!n.existsSync(e)||n.readFileSync(e,"utf8")!==s)&&n.writeFileSync(e,"\uFEFF"+s,"utf8")}catch{}return e}async function ee(n,t,e){if(n==="Unknown Artist"||t==="Unknown Title")return null;const s=`${n}-${t}-${e||""}`.toLowerCase();return P.has(s)?P.get(s):new Promise(r=>{const a=`https://itunes.apple.com/search?term=${encodeURIComponent(`${n} ${t} ${e||""}`.trim())}&entity=song&limit=10`,d=require("https").get(a,{timeout:3500},$=>{let h="";$.on("data",C=>h+=C),$.on("end",()=>{try{const k=JSON.parse(h).results||[];if(k.length>0){let x=null,A=-999;const F=t.toLowerCase(),G=n.toLowerCase(),v=(e||"").toLowerCase();for(const O of k){let b=0;const _=(O.trackName||"").toLowerCase(),B=(O.artistName||"").toLowerCase(),D=(O.collectionName||"").toLowerCase();(/dj mix|mixtape|today's hits|compilation|various artists/i.test(D)||/dj mix|mixed|remix/i.test(_))&&(b-=50),B.includes(G)&&(b+=30),_===F?b+=40:_.includes(F)&&(b+=20),v&&D.includes(v)&&(b+=50),b>A&&(A=b,x=O)}const L=(x||k[0]).artworkUrl100,R=L?L.replace("100x100bb","600x600bb"):null;return P.set(s,R),r(R)}}catch{}P.set(s,null),r(null)})});d.on("error",()=>{P.set(s,null),r(null)}),d.on("timeout",()=>{d.destroy(),P.set(s,null),r(null)})})}u.handle("control-system-media",async(n,t)=>{const e=process.platform;if(e==="darwin"){let s="";t==="playpause"?s=`tell application "System Events"
if (name of every process) contains "Spotify" then
tell application "Spotify" to playpause
else if (name of every process) contains "Music" then
tell application "Music" to playpause
end if
end tell`:t==="next"?s=`tell application "System Events"
if (name of every process) contains "Spotify" then
tell application "Spotify" to next track
else if (name of every process) contains "Music" then
tell application "Music" to next track
end if
end tell`:t==="previous"&&(s=`tell application "System Events"
if (name of every process) contains "Spotify" then
tell application "Spotify" to previous track
else if (name of every process) contains "Music" then
tell application "Music" to previous track
end if
end tell`),l(`osascript -e '${s}'`)}else if(e==="win32"){let s=179;if(t==="previous"||t==="prev"?s=177:t==="next"&&(s=176),w&&typeof w.sendMediaKey=="function")w.sendMediaKey(s);else{const r=`(New-Object -ComObject WScript.Shell).SendKeys([char]${s})`;l(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${r}"`)}}else if(e==="linux"){let s="playerctl play-pause";t==="next"?s="playerctl next":t==="previous"&&(s="playerctl previous"),l(s)}});u.handle("get-system-media",async()=>new Promise(n=>{const t=process.platform;if(t==="darwin")l(`osascript -e '
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
            '`,(s,r)=>{if(s)return n(null);const o=r.trim();if(!o||o==="None"||o==="Error")return n(null);const a=o.split("||");a.length>=4?n({name:a[2],artist:a[3],album:a[4],artwork_url:a[5]||null,state:a[1]==="playing"?"playing":"paused",source:a[0]}):n(null)});else if(t==="win32"){const e=Z();l(`powershell -NoProfile -ExecutionPolicy Bypass -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8; & '${e}'"`,{maxBuffer:10*1024*1024,encoding:"utf8"},async(s,r)=>{if(s||!r||r.trim()==="null"||r.trim()==="'null'")return n(null);try{const o=JSON.parse(r.trim()),a=o.Title||"Unknown Title",m=o.Artist||"Unknown Artist";let d=o.Artwork||null;const $=/chrome|msedge|firefox|brave|opera|edge/i.test(o.Source||"");if(!d||!$&&a!=="Unknown Title"){const h=await ee(m,a,o.Album);h&&(!d||!$)&&(d=h)}n({name:a,artist:m,album:o.Album||"",artwork_url:d,state:o.Status==="playing"||o.Status==="opened"?"playing":"paused",source:o.Source||"Spotify"})}catch{n(null)}})}else t==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(e,s)=>{if(e||!s)return n(null);const r=s.trim().split("||");n({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):n(null)}));u.handle("get-bluetooth-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?l("system_profiler SPBluetoothDataType -json",(e,s)=>{if(e)return n(!1);try{const o=JSON.parse(s).SPBluetoothDataType[0],a=o.device_connected&&o.device_connected.length>0;n(a)}catch{n(!1)}}):t==="win32"?l(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")}):t==="linux"?l("bluetoothctl devices Connected",(e,s)=>{if(e)return n(!1);n(s.trim().length>0)}):n(!1)}));u.handle("get-camera-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?l('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(e,s)=>{n(s?s.includes("= Yes"):!1)}):t==="win32"?l(`powershell -NoProfile -Command "
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
      "`,(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")}):t==="linux"?l("fuser /dev/video* 2>/dev/null",(e,s)=>{n(s.trim().length>0)}):n(!1)}));u.handle("get-microphone-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?l('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(e,s)=>{n(s?s.trim().length>0:!1)}):t==="win32"?l('powershell -NoProfile -Command "@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0"',(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")}):t==="linux"?l("pactl list source-outputs | grep -q 'Source #'",e=>{n(!e)}):n(!1)}));c.on("window-all-closed",()=>{process.platform==="linux"&&!E&&c.quit()});const{Worker:te}=require("worker_threads");let w={available:!1,start:()=>!1,stop:()=>{}};try{if(process.platform==="win32"){const n=[p.join(process.resourcesPath||"","wasapi_loopback.node"),p.join(process.resourcesPath||"","wasapi-loopback.node"),p.join(c.getAppPath(),"resources","wasapi_loopback.node"),p.join(c.getAppPath(),"resources","wasapi-loopback.node"),p.join(__dirname,"../../resources/wasapi_loopback.node"),p.join(__dirname,"../../resources/wasapi-loopback.node"),p.join(__dirname,"../native/wasapi-loopback/build/Release/wasapi_loopback.node")];for(const t of n)try{if(f.existsSync(t)){const e=require(t);if(e&&typeof e.start=="function"){w=e,w.available=!0,console.log("[WASAPI] Loaded native loopback addon from:",t);break}}}catch(e){console.error("[WASAPI] Error loading candidate:",t,e)}}}catch(n){console.error("[WASAPI] Addon initialization error:",n)}let y=null,g=!1,I=0;function ne(){if(y)return y;try{const n=[p.join(process.resourcesPath||"","audioWorker.js"),p.join(c.getAppPath(),"resources","audioWorker.js"),p.join(__dirname,"../../resources/audioWorker.js")];let t=null;for(const e of n)if(f.existsSync(e)){t=e;break}return t?(y=new te(t),y.on("message",e=>{if((e==null?void 0:e.type)==="analysis"&&i&&!i.isDestroyed()){const s={bands:e.bands,beat:e.beat,bass:e.bass};i.webContents.send("audio-analysis",s),i.webContents.send("audio-bands",e.bands)}}),y.on("error",e=>{console.error("[AudioWorker] error:",e)}),y.on("exit",()=>{y=null,g=!1}),y):null}catch(n){return console.error("[AudioWorker] failed to start:",n),null}}u.handle("audio-viz-start",()=>{if(!w||!w.available&&typeof w.start!="function")return{started:!1,reason:"unsupported-platform"};if(I++,g)return{started:!0};const n=ne();return n?(g=!!w.start((e,s)=>{n.postMessage({type:"pcm",samples:e,sampleRate:s},[e.buffer])}),console.log("[WASAPI] Native audio capture started successfully:",g),{started:g}):{started:!1,reason:"worker-unavailable"}});u.handle("audio-viz-stop",()=>(I=Math.max(0,I-1),I===0&&g&&(w.stop(),g=!1,y&&y.postMessage({type:"reset"})),{stopped:!0}));c.on("before-quit",()=>{g&&w.stop(),y&&y.terminate()});let S={clientId:process.env.SPOTIFY_CLIENT_ID||"",clientSecret:process.env.SPOTIFY_CLIENT_SECRET||"",apiKey:process.env.SPOTIFY_API_KEY||""};function se(){try{const n=require("fs"),t=require("path"),e=t.join(c.getPath("userData"),"spotify-config.json"),s=t.join(c.getAppPath(),"spotify-config.json");let r=null;if(n.existsSync(e)?r=e:n.existsSync(s)&&(r=s),r){const o=JSON.parse(n.readFileSync(r,"utf-8"));S.clientId=o.SPOTIFY_CLIENT_ID||S.clientId,S.clientSecret=o.SPOTIFY_CLIENT_SECRET||S.clientSecret,S.apiKey=o.SPOTIFY_API_KEY||S.apiKey}}catch{}}u.handle("get-spotify-config",()=>(se(),S));u.handle("save-spotify-config",(n,t)=>{if(t){S={...S,...t};try{const e=require("fs"),r=require("path").join(c.getPath("userData"),"spotify-config.json");e.writeFileSync(r,JSON.stringify({SPOTIFY_CLIENT_ID:S.clientId,SPOTIFY_CLIENT_SECRET:S.clientSecret,SPOTIFY_API_KEY:S.apiKey,INSTRUCTIONS:"Spotify Web API Client ID & Client Secret"},null,2))}catch{}}return{success:!0}});
