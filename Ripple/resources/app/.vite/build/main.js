"use strict";const{app:l,BrowserWindow:B,screen:_,ipcMain:f,shell:T,Tray:z,Menu:H,nativeImage:V}=require("electron"),u=require("node:path"),d=require("fs");process.platform==="linux"&&(l.commandLine.appendSwitch("enable-transparent-visuals"),l.commandLine.appendSwitch("disable-gpu-compositing"),l.disableHardwareAcceleration());let E=null,i=null;const{exec:p,spawn:M}=require("child_process");function Q(){return new Promise(n=>{const e=Buffer.from(`
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
`,"utf16le").toString("base64");p(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:5*1024*1024},(s,r)=>{if(s||!r)return n([]);try{const o=JSON.parse(r.trim());n(Array.isArray(o)?o:o?[o]:[])}catch{n([])}})})}function X(){return new Promise(n=>{const e=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");p(`powershell -NoProfile -EncodedCommand ${e}`,{maxBuffer:2*1024*1024},(s,r)=>{if(s||!r)return n([]);try{const o=JSON.parse(r.trim());n(Array.isArray(o)?o:o?[o]:[])}catch{n([])}})})}async function Z(){const n=await Q(),t=await X(),e=new Set,s=[];for(const r of[...n,...t]){if(!r.name||!(r.path||r.appId))continue;const o=r.type==="uwp"?`shell:AppsFolder\\${r.appId}`:r.path,a=o.toLowerCase();e.has(a)||(e.add(a),s.push({name:r.name,launch:o}))}return s.sort((r,o)=>r.name.localeCompare(o.name))}function j(n){const t=[];let e=0;for(;e<n.length;){for(;e<n.length&&/\s/.test(n[e]);)e++;if(e>=n.length)break;let s="";for(;e<n.length&&!/\s/.test(n[e]);)if(n[e]==='"'){for(e++;e<n.length&&n[e]!=='"';)s+=n[e++];e<n.length&&e++}else s+=n[e++];s&&t.push(s)}return t}function ee(n){const t=n.replace(/\//g,"\\").replace(/%([^%]+)%/g,(o,a)=>process.env[a]||`%${a}%`),e=t.match(/^"([^"]+)"(.*)/);if(e)return{exe:e[1],args:e[2].trim()?j(e[2].trim()):[]};const s=t.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(s)return{exe:s[1],args:s[2]?j(s[2]):[]};const r=t.search(/\s/);return r===-1?{exe:t,args:[]}:{exe:t.slice(0,r),args:j(t.slice(r+1).trim())}}function te(n){let t=n.trim();if(t.toLowerCase().includes("spotify")){T.openExternal("spotify:").catch(()=>{p('start "" spotify:')});return}if(!t.startsWith("shell:")&&t.includes("!")&&(t=`shell:AppsFolder\\${t}`),t.startsWith("shell:")){const e=t.replace(/'/g,"''");p(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`);return}if(/[\\\/]/.test(t)){const{exe:e,args:s}=ee(t);if(s.length===0){if(e.toLowerCase().endsWith(".url")){try{const c=d.readFileSync(e,"utf8").match(/^URL=(.+)$/im);c&&T.openExternal(c[1].trim())}catch{}return}T.openPath(e).then(a=>{a&&p(`start "" "${e}"`)});return}const r=/[\\/]/.test(e)&&!/\.[^\\.]+$/.test(e)?e+".exe":e;if(/\.(cmd|bat)$/i.test(r)){const a=M("cmd.exe",["/c",r,...s],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}if(/\.ps1$/i.test(r)){const a=M("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",r,...s],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}const o=M(r,s,{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(t.includes(" ")){const e=t.replace(/'/g,"''");p(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${e}'"`)}else p(`start "" ${t}`)}f.handle("set-ignore-mouse-events",(n,t,e)=>{i&&(process.platform!=="linux"?i.setIgnoreMouseEvents(t,{forward:e||!1}):i.setIgnoreMouseEvents(t))});f.handle("focus-window",()=>{i&&i.focus()});f.handle("open-external",async(n,t)=>{await T.openExternal(t)});f.handle("launch-app",async(n,t)=>{var r;const e=process.platform,s=(t||"").trim().toLowerCase();if(s.includes("spotify"))try{await T.openExternal("spotify:");return}catch{}if(e==="darwin")p(`open -a "${t}"`);else if(e==="win32"){let o=null;try{const a=u.join(l.getPath("userData"),"app-cache.json");if(d.existsSync(a)){const h=JSON.parse(d.readFileSync(a,"utf8")).filter(y=>y.name&&y.name.toLowerCase()===s);o=((r=h.find(y=>!y.launch.startsWith("shell:"))||h[0])==null?void 0:r.launch)||null}}catch{}te(o||t)}else p(t)});f.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const n=u.join(l.getPath("userData"),"app-cache.json");if(d.existsSync(n))try{if(d.statSync(n).size>100)return}catch{}setTimeout(async()=>{try{const t=await Z();d.writeFileSync(n,JSON.stringify(t))}catch{}},12e3)});f.handle("search-apps",async(n,t)=>{if(process.platform!=="win32"||!t)return[];const e=u.join(l.getPath("userData"),"app-cache.json");try{if(!d.existsSync(e))return[];const s=JSON.parse(d.readFileSync(e,"utf8")),r=t.toLowerCase();return s.filter(o=>o.name&&o.name.toLowerCase().includes(r)).slice(0,8)}catch{return[]}});f.handle("get-displays",()=>_.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));f.handle("set-display",(n,t)=>{if(i){const s=_.getAllDisplays().find(h=>h.id.toString()===t.toString())||_.getPrimaryDisplay(),{x:r,y:o,width:a,height:c}=s.bounds;process.platform,i.setBounds({x:r,y:o,width:a,height:c}),i.show()}});f.handle("update-window-position",(n,t,e)=>{});f.handle("set-auto-launch",(n,t)=>{if(process.platform==="linux"){const e=u.join(l.getPath("home"),".config","autostart"),s=u.join(e,"ripple.desktop");try{if(t){d.existsSync(e)||d.mkdirSync(e,{recursive:!0});const r=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${l.getPath("exe")}"
Icon=${F()}
Terminal=false
`;d.writeFileSync(s,r)}else d.existsSync(s)&&d.unlinkSync(s)}catch(r){console.error("Failed to set auto-launch on Linux:",r)}}else if(process.platform==="win32")try{l.setLoginItemSettings({openAtLogin:t,path:l.getPath("exe")})}catch(e){console.error("Failed to set login item settings on Windows:",e)}});const F=()=>{const n="png";if(l.isPackaged){const t=u.join(process.resourcesPath,`icon.${n}`),e=u.join(process.resourcesPath,`assets/icons/icon.${n}`);return d.existsSync(t)?t:d.existsSync(e)?e:t}return u.join(__dirname,`../../src/assets/icons/icon.${n}`)},G=()=>{const n=_.getPrimaryDisplay(),{x:t,y:e,width:s,height:r}=n.bounds,o=process.platform==="linux",a=process.platform==="win32",c=process.platform==="darwin",h=s,m=r,y=t,b=e,C=a?"toolbar":"panel";i=new B({width:h,height:m,x:y,y:b,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...a?{}:{thickFrame:!1},hasShadow:!1,skipTaskbar:!0,icon:F(),...c?{hiddenInMissionControl:!0}:{},type:C,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:u.join(__dirname,"preload.js"),devTools:!1,backgroundThrottling:!1},show:!0}),o?i.setIgnoreMouseEvents(!0):i.setIgnoreMouseEvents(!0,{forward:!0});const k=o?500:0;i.once("ready-to-show",()=>{setTimeout(()=>{i&&(i.show(),o?i.setAlwaysOnTop(!0,"screen-saver"):i.setAlwaysOnTop(!0,"pop-up-menu"),i.focus())},k)}),setTimeout(()=>{i&&!i.isVisible()&&(i.show(),i.focus())},5e3),i.on("closed",()=>{i=null});try{i.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!l.isPackaged||process.env.NODE_ENV==="development")i.loadURL("http://localhost:5173");else{const A=u.join(__dirname,"../renderer/main_window/index.html");i.loadFile(A)}};l.whenReady().then(()=>{process.platform==="darwin"&&l.dock.hide(),G(),l.on("activate",()=>{B.getAllWindows().length===0&&G()});try{const n=F(),e=V.createFromPath(n).resize({width:16,height:16});E=new z(e);const s=H.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{i&&(i.isVisible()?i.hide():i.show())}},{type:"separator"},{label:"Quit",click:()=>{l.quit()}}]);E.setToolTip("Ripple"),E.setContextMenu(s)}catch(n){console.error("Failed to create tray:",n)}});const W=new Map;let O=null;function ne(){if(O&&d.existsSync(O))return O;const n=u.join(l.getPath("userData"),"get_media.ps1"),t=`
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
`;try{(!d.existsSync(n)||d.readFileSync(n,"utf8")!==t)&&d.writeFileSync(n,"\uFEFF"+t,"utf8")}catch{}return O=n,n}function se(n,t){return new Promise(e=>{const s=require("https"),o=`https://www.youtube.com/results?search_query=${encodeURIComponent(`${t} ${n}`.trim())}`,a=s.get(o,{timeout:3500,headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}},c=>{let h="";c.on("data",m=>h+=m),c.on("end",()=>{const m=h.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);if(m&&m[1])return e(`https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`);e(null)})});a.on("error",()=>e(null)),a.on("timeout",()=>{a.destroy(),e(null)})})}async function re(n,t,e){if(n==="Unknown Artist"||t==="Unknown Title")return null;const s=`${n}-${t}-${e||""}`.toLowerCase();if(W.has(s))return W.get(s);let r=await new Promise(o=>{const c=`https://itunes.apple.com/search?term=${encodeURIComponent(`${n} ${t} ${e||""}`.trim())}&entity=song&limit=10`,m=require("https").get(c,{timeout:3500},y=>{let b="";y.on("data",C=>b+=C),y.on("end",()=>{try{const k=JSON.parse(b).results||[];if(k.length>0){let A=null,L=-999;const q=t.toLowerCase(),K=n.toLowerCase(),R=(e||"").toLowerCase();for(const x of k){let P=0;const N=(x.trackName||"").toLowerCase(),J=(x.artistName||"").toLowerCase(),D=(x.collectionName||"").toLowerCase();(/dj mix|mixtape|today's hits|compilation|various artists/i.test(D)||/dj mix|mixed|remix/i.test(N))&&(P-=50),J.includes(K)&&(P+=30),N===q?P+=40:N.includes(q)&&(P+=20),R&&D.includes(R)&&(P+=50),P>L&&(L=P,A=x)}const U=(A||k[0]).artworkUrl100,Y=U?U.replace("100x100bb","600x600bb"):null;return o(Y)}}catch{}o(null)})});m.on("error",()=>o(null)),m.on("timeout",()=>{m.destroy(),o(null)})});return r||(r=await se(n,t)),W.set(s,r),r}f.handle("control-system-media",async(n,t)=>{const e=process.platform;if(e==="darwin"){let s="";t==="playpause"?s=`tell application "System Events"
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
end tell`),p(`osascript -e '${s}'`)}else if(e==="win32"){let s=179;if(t==="previous"||t==="prev"?s=177:t==="next"&&(s=176),$&&typeof $.sendMediaKey=="function")$.sendMediaKey(s);else{const r=`(New-Object -ComObject WScript.Shell).SendKeys([char]${s})`;p(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${r}"`)}}else if(e==="linux"){let s="playerctl play-pause";t==="next"?s="playerctl next":t==="previous"&&(s="playerctl previous"),p(s)}});let v=!1;f.handle("get-system-media",async()=>v?null:(v=!0,new Promise(n=>{const t=s=>{v=!1,n(s)},e=process.platform;if(e==="darwin")p(`osascript -e '
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
            '`,(r,o)=>{if(r)return t(null);const a=o.trim();if(!a||a==="None"||a==="Error")return t(null);const c=a.split("||");c.length>=4?t({name:c[2],artist:c[3],album:c[4],artwork_url:c[5]||null,state:c[1]==="playing"?"playing":"paused",source:c[0]}):t(null)});else if(e==="win32"){const s=ne();p(`powershell -NoProfile -ExecutionPolicy Bypass -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; $OutputEncoding = [System.Text.Encoding]::UTF8; & '${s}'"`,{maxBuffer:10*1024*1024,encoding:"utf8"},async(r,o)=>{if(r||!o||o.trim()==="null"||o.trim()==="'null'")return t(null);try{const a=JSON.parse(o.trim()),c=a.Title||"Unknown Title",h=a.Artist||"Unknown Artist";let m=a.Artwork||null;const y=/chrome|msedge|firefox|brave|opera|edge/i.test(a.Source||"");if(!m||!y&&c!=="Unknown Title"){const b=await re(h,c,a.Album);b&&(!m||!y)&&(m=b)}t({name:c,artist:h,album:a.Album||"",artwork_url:m,state:a.Status==="playing"||a.Status==="opened"?"playing":"paused",source:a.Source||"Spotify"})}catch{t(null)}})}else e==="linux"?p('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(s,r)=>{var a;if(s||!r)return t(null);const o=r.trim().split("||");t({name:o[0],artist:o[1],album:o[2],artwork_url:null,state:((a=o[3])==null?void 0:a.toLowerCase())==="playing"?"playing":"paused",source:"playerctl"})}):t(null)})));f.handle("get-bluetooth-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?p("system_profiler SPBluetoothDataType -json",(e,s)=>{if(e)return n(!1);try{const o=JSON.parse(s).SPBluetoothDataType[0],a=o.device_connected&&o.device_connected.length>0;n(a)}catch{n(!1)}}):t==="win32"?p(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")}):t==="linux"?p("bluetoothctl devices Connected",(e,s)=>{if(e)return n(!1);n(s.trim().length>0)}):n(!1)}));f.handle("get-camera-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?p('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(e,s)=>{n(s?s.includes("= Yes"):!1)}):t==="win32"?p(`powershell -NoProfile -Command "
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
      "`,(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")}):t==="linux"?p("fuser /dev/video* 2>/dev/null",(e,s)=>{n(s.trim().length>0)}):n(!1)}));f.handle("get-microphone-status",async()=>new Promise(n=>{const t=process.platform;t==="darwin"?p('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(e,s)=>{n(s?s.trim().length>0:!1)}):t==="win32"?p('powershell -NoProfile -Command "@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0"',(s,r)=>{if(s)return n(!1);n(r.trim().toLowerCase()==="true")}):t==="linux"?p("pactl list source-outputs | grep -q 'Source #'",e=>{n(!e)}):n(!1)}));l.on("window-all-closed",()=>{process.platform==="linux"&&!E&&l.quit()});const{Worker:oe}=require("worker_threads");let $={available:!1,start:()=>!1,stop:()=>{}};try{if(process.platform==="win32"){const n=[u.join(process.resourcesPath||"","wasapi_loopback.node"),u.join(process.resourcesPath||"","wasapi-loopback.node"),u.join(l.getAppPath(),"resources","wasapi_loopback.node"),u.join(l.getAppPath(),"resources","wasapi-loopback.node"),u.join(__dirname,"../../resources/wasapi_loopback.node"),u.join(__dirname,"../../resources/wasapi-loopback.node"),u.join(__dirname,"../native/wasapi-loopback/build/Release/wasapi_loopback.node")];for(const t of n)try{if(d.existsSync(t)){const e=require(t);if(e&&typeof e.start=="function"){$=e,$.available=!0,console.log("[WASAPI] Loaded native loopback addon from:",t);break}}}catch(e){console.error("[WASAPI] Error loading candidate:",t,e)}}}catch(n){console.error("[WASAPI] Addon initialization error:",n)}let w=null,g=!1,I=0;function ae(){if(w)return w;try{const n=[u.join(process.resourcesPath||"","audioWorker.js"),u.join(l.getAppPath(),"resources","audioWorker.js"),u.join(__dirname,"../../resources/audioWorker.js")];let t=null;for(const e of n)if(d.existsSync(e)){t=e;break}return t?(w=new oe(t),w.on("message",e=>{if((e==null?void 0:e.type)==="analysis"&&i&&!i.isDestroyed()){const s={bands:e.bands,beat:e.beat,bass:e.bass};i.webContents.send("audio-analysis",s),i.webContents.send("audio-bands",e.bands)}}),w.on("error",e=>{console.error("[AudioWorker] error:",e)}),w.on("exit",()=>{w=null,g=!1}),w):null}catch(n){return console.error("[AudioWorker] failed to start:",n),null}}f.handle("audio-viz-start",()=>{if(!$||!$.available&&typeof $.start!="function")return{started:!1,reason:"unsupported-platform"};if(I++,g)return{started:!0};const n=ae();return n?(g=!!$.start((e,s)=>{n.postMessage({type:"pcm",samples:e,sampleRate:s},[e.buffer])}),console.log("[WASAPI] Native audio capture started successfully:",g),{started:g}):{started:!1,reason:"worker-unavailable"}});f.handle("audio-viz-stop",()=>(I=Math.max(0,I-1),I===0&&g&&($.stop(),g=!1,w&&w.postMessage({type:"reset"})),{stopped:!0}));l.on("before-quit",()=>{g&&$.stop(),w&&w.terminate()});let S={clientId:process.env.SPOTIFY_CLIENT_ID||"",clientSecret:process.env.SPOTIFY_CLIENT_SECRET||"",apiKey:process.env.SPOTIFY_API_KEY||""};function ie(){try{const n=require("fs"),t=require("path"),e=t.join(l.getPath("userData"),"spotify-config.json"),s=t.join(l.getAppPath(),"spotify-config.json");let r=null;if(n.existsSync(e)?r=e:n.existsSync(s)&&(r=s),r){const o=JSON.parse(n.readFileSync(r,"utf-8"));S.clientId=o.SPOTIFY_CLIENT_ID||S.clientId,S.clientSecret=o.SPOTIFY_CLIENT_SECRET||S.clientSecret,S.apiKey=o.SPOTIFY_API_KEY||S.apiKey}}catch{}}f.handle("get-spotify-config",()=>(ie(),S));f.handle("save-spotify-config",(n,t)=>{if(t){S={...S,...t};try{const e=require("fs"),r=require("path").join(l.getPath("userData"),"spotify-config.json");e.writeFileSync(r,JSON.stringify({SPOTIFY_CLIENT_ID:S.clientId,SPOTIFY_CLIENT_SECRET:S.clientSecret,SPOTIFY_API_KEY:S.apiKey,INSTRUCTIONS:"Spotify Web API Client ID & Client Secret"},null,2))}catch{}}return{success:!0}});
