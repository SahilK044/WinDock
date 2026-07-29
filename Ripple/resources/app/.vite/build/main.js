"use strict";const{app:c,BrowserWindow:D,screen:I,ipcMain:u,shell:A,Tray:Y,Menu:J,nativeImage:z}=require("electron"),p=require("node:path"),h=require("fs");process.platform==="linux"&&(c.commandLine.appendSwitch("enable-transparent-visuals"),c.commandLine.appendSwitch("disable-gpu-compositing"),c.disableHardwareAcceleration());let O=null,i=null;const{exec:l,spawn:_}=require("child_process");function H(){return new Promise(n=>{const e=Buffer.from(`
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
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:5*1024*1024},(s,r)=>{if(s||!r)return n([]);try{const o=JSON.parse(r.trim());n(Array.isArray(o)?o:o?[o]:[])}catch{n([])}})})}function V(){return new Promise(n=>{const e=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:2*1024*1024},(s,r)=>{if(s||!r)return n([]);try{const o=JSON.parse(r.trim());n(Array.isArray(o)?o:o?[o]:[])}catch{n([])}})})}async function Q(){const[n,t]=await Promise.all([H(),V()]),e=new Set,s=[];for(const r of[...n,...t]){if(!r.name||!(r.path||r.appId))continue;const o=r.type==="uwp"?`shell:AppsFolder\\${r.appId}`:r.path,a=o.toLowerCase();e.has(a)||(e.add(a),s.push({name:r.name,launch:o}))}return s.sort((r,o)=>r.name.localeCompare(o.name))}function j(n){const t=[];let e=0;for(;e<n.length;){for(;e<n.length&&/\s/.test(n[e]);)e++;if(e>=n.length)break;let s="";for(;e<n.length&&!/\s/.test(n[e]);)if(n[e]==='"'){for(e++;e<n.length&&n[e]!=='"';)s+=n[e++];e<n.length&&e++}else s+=n[e++];s&&t.push(s)}return t}function X(n){const t=n.replace(/\//g,"\\").replace(/%([^%]+)%/g,(o,a)=>process.env[a]||`%${a}%`),e=t.match(/^"([^"]+)"(.*)/);if(e)return{exe:e[1],args:e[2].trim()?j(e[2].trim()):[]};const s=t.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(s)return{exe:s[1],args:s[2]?j(s[2]):[]};const r=t.search(/\s/);return r===-1?{exe:t,args:[]}:{exe:t.slice(0,r),args:j(t.slice(r+1).trim())}}function Z(n){let t=n.trim();if(t.toLowerCase().includes("spotify")){A.openExternal("spotify:").catch(()=>{l('start "" spotify:')});return}if(!t.startsWith("shell:")&&t.includes("!")&&(t=`shell:AppsFolder\\${t}`),t.startsWith("shell:")){const e=t.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`);return}if(/[\\\/]/.test(t)){const{exe:e,args:s}=X(t);if(s.length===0){if(e.toLowerCase().endsWith(".url")){try{const d=h.readFileSync(e,"utf8").match(/^URL=(.+)$/im);d&&A.openExternal(d[1].trim())}catch{}return}A.openPath(e).then(a=>{a&&l(`start "" "${e}"`)});return}const r=/[\\/]/.test(e)&&!/\.[^\\.]+$/.test(e)?e+".exe":e;if(/\.(cmd|bat)$/i.test(r)){const a=_("cmd.exe",["/c",r,...s],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}if(/\.ps1$/i.test(r)){const a=_("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",r,...s],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}const o=_(r,s,{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(t.includes(" ")){const e=t.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`)}else l(`start "" ${t}`)}u.handle("set-ignore-mouse-events",(n,t,e)=>{i&&(process.platform!=="linux"?i.setIgnoreMouseEvents(t,{forward:e||!1}):i.setIgnoreMouseEvents(t))});u.handle("focus-window",()=>{i&&i.focus()});u.handle("open-external",async(n,t)=>{await A.openExternal(t)});u.handle("launch-app",async(n,t)=>{var r;const e=process.platform,s=(t||"").trim().toLowerCase();if(s.includes("spotify"))try{await A.openExternal("spotify:");return}catch{}if(e==="darwin")l(`open -a "${t}"`);else if(e==="win32"){let o=null;try{const a=p.join(c.getPath("userData"),"app-cache.json");if(h.existsSync(a)){const f=JSON.parse(h.readFileSync(a,"utf8")).filter(y=>y.name&&y.name.toLowerCase()===s);o=((r=f.find(y=>!y.launch.startsWith("shell:"))||f[0])==null?void 0:r.launch)||null}}catch{}Z(o||t)}else l(t)});u.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const n=p.join(c.getPath("userData"),"app-cache.json");try{const t=await Q();h.writeFileSync(n,JSON.stringify(t))}catch{}});u.handle("search-apps",async(n,t)=>{if(process.platform!=="win32"||!t)return[];const e=p.join(c.getPath("userData"),"app-cache.json");try{if(!h.existsSync(e))return[];const s=JSON.parse(h.readFileSync(e,"utf8")),r=t.toLowerCase();return s.filter(o=>o.name&&o.name.toLowerCase().includes(r)).slice(0,8)}catch{return[]}});u.handle("get-displays",()=>I.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));u.handle("set-display",(n,t)=>{if(i){const s=I.getAllDisplays().find(f=>f.id.toString()===t.toString())||I.getPrimaryDisplay(),{x:r,y:o,width:a,height:d}=s.bounds;process.platform,i.setBounds({x:r,y:o,width:a,height:d}),i.show()}});u.handle("update-window-position",(n,t,e)=>{});u.handle("set-auto-launch",(n,t)=>{if(process.platform==="linux"){const e=p.join(c.getPath("home"),".config","autostart"),s=p.join(e,"ripple.desktop");try{if(t){h.existsSync(e)||h.mkdirSync(e,{recursive:!0});const r=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${c.getPath("exe")}"
Icon=${W()}
Terminal=false
`;h.writeFileSync(s,r)}else h.existsSync(s)&&h.unlinkSync(s)}catch(r){console.error("Failed to set auto-launch on Linux:",r)}}else if(process.platform==="win32")try{c.setLoginItemSettings({openAtLogin:t,path:c.getPath("exe")})}catch(e){console.error("Failed to set login item settings on Windows:",e)}});const W=()=>{const n="png";if(c.isPackaged){const t=p.join(process.resourcesPath,`icon.${n}`),e=p.join(process.resourcesPath,`assets/icons/icon.${n}`);return h.existsSync(t)?t:h.existsSync(e)?e:t}return p.join(__dirname,`../../src/assets/icons/icon.${n}`)},U=()=>{const n=I.getPrimaryDisplay(),{x:t,y:e,width:s,height:r}=n.bounds,o=process.platform==="linux",a=process.platform==="win32",d=process.platform==="darwin",f=s,m=r,y=t,T=e,P=a?"toolbar":"panel";i=new D({width:f,height:m,x:y,y:T,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...a?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:W(),...d?{hiddenInMissionControl:!0}:{},type:P,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:p.join(__dirname,"preload.js"),devTools:!1,backgroundThrottling:!1},show:!0}),o?i.setIgnoreMouseEvents(!0):i.setIgnoreMouseEvents(!0,{forward:!0});const C=o?500:0;i.once("ready-to-show",()=>{setTimeout(()=>{i&&(i.show(),o?i.setAlwaysOnTop(!0,"screen-saver"):i.setAlwaysOnTop(!0,"pop-up-menu"),i.focus())},C)}),setTimeout(()=>{i&&!i.isVisible()&&(i.show(),i.focus())},5e3),i.on("closed",()=>{i=null});try{i.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!c.isPackaged||process.env.NODE_ENV==="development")i.loadURL("http://localhost:5173");else{const k=p.join(__dirname,"../renderer/main_window/index.html");i.loadFile(k)}};c.whenReady().then(()=>{process.platform==="darwin"&&c.dock.hide(),U(),c.on("activate",()=>{D.getAllWindows().length===0&&U()});try{const n=W(),e=z.createFromPath(n).resize({width:16,height:16});O=new Y(e);const s=J.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{i&&(i.isVisible()?i.hide():i.show())}},{type:"separator"},{label:"Quit",click:()=>{c.quit()}}]);O.setToolTip("Ripple"),O.setContextMenu(s)}catch(n){console.error("Failed to create tray:",n)}});const M=new Map;function ee(){const n=require("fs"),e=require("path").join(c.getPath("userData"),"get_media.ps1"),s=`
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
`;try{(!n.existsSync(e)||n.readFileSync(e,"utf8")!==s)&&n.writeFileSync(e,"\uFEFF"+s,"utf8")}catch{}return e}function te(n,t){return new Promise(e=>{const s=require("https"),o=`https://www.youtube.com/results?search_query=${encodeURIComponent(`${t} ${n}`.trim())}`,a=s.get(o,{timeout:3500,headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}},d=>{let f="";d.on("data",m=>f+=m),d.on("end",()=>{const m=f.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);if(m&&m[1])return e(`https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`);e(null)})});a.on("error",()=>e(null)),a.on("timeout",()=>{a.destroy(),e(null)})})}async function ne(n,t,e){if(n==="Unknown Artist"||t==="Unknown Title")return null;const s=`${n}-${t}-${e||""}`.toLowerCase();if(M.has(s))return M.get(s);let r=await new Promise(o=>{const d=`https://itunes.apple.com/search?term=${encodeURIComponent(`${n} ${t} ${e||""}`.trim())}&entity=song&limit=10`,m=require("https").get(d,{timeout:3500},y=>{let T="";y.on("data",P=>T+=P),y.on("end",()=>{try{const C=JSON.parse(T).results||[];if(C.length>0){let k=null,F=-999;const v=t.toLowerCase(),G=n.toLowerCase(),L=(e||"").toLowerCase();for(const x of C){let b=0;const N=(x.trackName||"").toLowerCase(),K=(x.artistName||"").toLowerCase(),R=(x.collectionName||"").toLowerCase();(/dj mix|mixtape|today's hits|compilation|various artists/i.test(R)||/dj mix|mixed|remix/i.test(N))&&(b-=50),K.includes(G)&&(b+=30),N===v?b+=40:N.includes(v)&&(b+=20),L&&R.includes(L)&&(b+=50),b>F&&(F=b,k=x)}const q=(k||C[0]).artworkUrl100,B=q?q.replace("100x100bb","600x600bb"):null;return o(B)}}catch{}o(null)})});m.on("error",()=>o(null)),m.on("timeout",()=>{m.destroy(),o(null)})});return r||(r=await te(n,t)),M.set(s,r),r}u.handle("control-system-media",async(n,t)=>{const e=process.platform;if(e==="darwin"){let s="";t==="playpause"?s=`tell application "System Events"
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
end tell`),l(`osascript -e '${s}'`)}else if(e==="win32"){let s=179;if(t==="previous"||t==="prev"?s=177:t==="next"&&(s=176),$&&typeof $.sendMediaKey=="function")$.sendMediaKey(s);else{const r=`(New-Object -ComObject WScript.Shell).SendKeys([char]${s})`;l(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${r}"`)}}else if(e==="linux"){let s="playerctl play-pause";t==="next"?s="playerctl next":t==="previous"&&(s="playerctl previous"),l(s)}});u.handle("get-system-media",async()=>new Promise(n=>{const t=process.platform;if(t==="darwin")l(`osascript -e '
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
            '`,(s,r)=>{if(s)return n(null);const o=r.trim();if(!o||o==="None"||o==="Error")return n(null);const a=o.split("||");a.length>=4?n({name:a[2],artist:a[3],album:a[4],artwork_url:a[5]||null,state:a[1]==="playing"?"playing":"paused",source:a[0]}):n(null)});else if(t==="win32"){const e=ee();l(`powershell -NoProfile -ExecutionPolicy Bypass -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8; & '${e}'"`,{maxBuffer:10*1024*1024,encoding:"utf8"},async(s,r)=>{if(s||!r||r.trim()==="null"||r.trim()==="'null'")return n(null);try{const o=JSON.parse(r.trim()),a=o.Title||"Unknown Title",d=o.Artist||"Unknown Artist";let f=o.Artwork||null;const m=/chrome|msedge|firefox|brave|opera|edge/i.test(o.Source||"");if(!f||!m&&a!=="Unknown Title"){const y=await ne(d,a,o.Album);y&&(!f||!m)&&(f=y)}n({name:a,artist:d,album:o.Album||"",artwork_url:f,state:o.Status==="playing"||o.Status==="opened"?"playing":"paused",source:o.Source||"Spotify"})}catch{n(null)}})}else t==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(e,s)=>{if(e||!s)return n(null);const r=s.trim().split("||");n({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):n(null)}));u.handle("get-bluetooth-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?l("system_profiler SPBluetoothDataType -json",(e,s)=>{if(e)return n(!1);try{const o=JSON.parse(s).SPBluetoothDataType[0],a=o.device_connected&&o.device_connected.length>0;n(a)}catch{n(!1)}}):t==="win32"?l(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")}):t==="linux"?l("bluetoothctl devices Connected",(e,s)=>{if(e)return n(!1);n(s.trim().length>0)}):n(!1)}));u.handle("get-camera-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?l('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(e,s)=>{n(s?s.includes("= Yes"):!1)}):t==="win32"?l(`powershell -NoProfile -Command "
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
      "`,(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")}):t==="linux"?l("fuser /dev/video* 2>/dev/null",(e,s)=>{n(s.trim().length>0)}):n(!1)}));u.handle("get-microphone-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?l('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(e,s)=>{n(s?s.trim().length>0:!1)}):t==="win32"?l('powershell -NoProfile -Command "@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0"',(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")}):t==="linux"?l("pactl list source-outputs | grep -q 'Source #'",e=>{n(!e)}):n(!1)}));c.on("window-all-closed",()=>{process.platform==="linux"&&!O&&c.quit()});const{Worker:se}=require("worker_threads");let $={available:!1,start:()=>!1,stop:()=>{}};try{if(process.platform==="win32"){const n=[p.join(process.resourcesPath||"","wasapi_loopback.node"),p.join(process.resourcesPath||"","wasapi-loopback.node"),p.join(c.getAppPath(),"resources","wasapi_loopback.node"),p.join(c.getAppPath(),"resources","wasapi-loopback.node"),p.join(__dirname,"../../resources/wasapi_loopback.node"),p.join(__dirname,"../../resources/wasapi-loopback.node"),p.join(__dirname,"../native/wasapi-loopback/build/Release/wasapi_loopback.node")];for(const t of n)try{if(h.existsSync(t)){const e=require(t);if(e&&typeof e.start=="function"){$=e,$.available=!0,console.log("[WASAPI] Loaded native loopback addon from:",t);break}}}catch(e){console.error("[WASAPI] Error loading candidate:",t,e)}}}catch(n){console.error("[WASAPI] Addon initialization error:",n)}let w=null,g=!1,E=0;function re(){if(w)return w;try{const n=[p.join(process.resourcesPath||"","audioWorker.js"),p.join(c.getAppPath(),"resources","audioWorker.js"),p.join(__dirname,"../../resources/audioWorker.js")];let t=null;for(const e of n)if(h.existsSync(e)){t=e;break}return t?(w=new se(t),w.on("message",e=>{if((e==null?void 0:e.type)==="analysis"&&i&&!i.isDestroyed()){const s={bands:e.bands,beat:e.beat,bass:e.bass};i.webContents.send("audio-analysis",s),i.webContents.send("audio-bands",e.bands)}}),w.on("error",e=>{console.error("[AudioWorker] error:",e)}),w.on("exit",()=>{w=null,g=!1}),w):null}catch(n){return console.error("[AudioWorker] failed to start:",n),null}}u.handle("audio-viz-start",()=>{if(!$||!$.available&&typeof $.start!="function")return{started:!1,reason:"unsupported-platform"};if(E++,g)return{started:!0};const n=re();return n?(g=!!$.start((e,s)=>{n.postMessage({type:"pcm",samples:e,sampleRate:s},[e.buffer])}),console.log("[WASAPI] Native audio capture started successfully:",g),{started:g}):{started:!1,reason:"worker-unavailable"}});u.handle("audio-viz-stop",()=>(E=Math.max(0,E-1),E===0&&g&&($.stop(),g=!1,w&&w.postMessage({type:"reset"})),{stopped:!0}));c.on("before-quit",()=>{g&&$.stop(),w&&w.terminate()});let S={clientId:process.env.SPOTIFY_CLIENT_ID||"",clientSecret:process.env.SPOTIFY_CLIENT_SECRET||"",apiKey:process.env.SPOTIFY_API_KEY||""};function oe(){try{const n=require("fs"),t=require("path"),e=t.join(c.getPath("userData"),"spotify-config.json"),s=t.join(c.getAppPath(),"spotify-config.json");let r=null;if(n.existsSync(e)?r=e:n.existsSync(s)&&(r=s),r){const o=JSON.parse(n.readFileSync(r,"utf-8"));S.clientId=o.SPOTIFY_CLIENT_ID||S.clientId,S.clientSecret=o.SPOTIFY_CLIENT_SECRET||S.clientSecret,S.apiKey=o.SPOTIFY_API_KEY||S.apiKey}}catch{}}u.handle("get-spotify-config",()=>(oe(),S));u.handle("save-spotify-config",(n,t)=>{if(t){S={...S,...t};try{const e=require("fs"),r=require("path").join(c.getPath("userData"),"spotify-config.json");e.writeFileSync(r,JSON.stringify({SPOTIFY_CLIENT_ID:S.clientId,SPOTIFY_CLIENT_SECRET:S.clientSecret,SPOTIFY_API_KEY:S.apiKey,INSTRUCTIONS:"Spotify Web API Client ID & Client Secret"},null,2))}catch{}}return{success:!0}});
