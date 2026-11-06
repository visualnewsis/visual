param(
  [int]$W = 1440, [int]$H = 900, [double]$Scale = 1, [switch]$Mobile,
  [string]$Prefix = "d", [string]$Shots = "hero:0",
  [string]$Out = "C:\Users\user\AppData\Local\Temp\claude\C--Users-user-Documents-editshop\00b67af4-2206-45e3-99c6-19c68432445e\scratchpad\review",
  [int]$Port = 9333
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $Out | Out-Null
$udd = Join-Path $env:TEMP ("cdp-" + [guid]::NewGuid().ToString('N'))
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$proc = Start-Process $chrome -ArgumentList @("--headless=new","--remote-debugging-port=$Port","--user-data-dir=$udd","--use-angle=swiftshader","--enable-unsafe-swiftshader","--hide-scrollbars","--window-size=$W,$H","about:blank") -PassThru
try {
  $tab = $null
  for ($i = 0; $i -lt 40 -and -not $tab; $i++) {
    Start-Sleep -Milliseconds 250
    try { $tab = (Invoke-RestMethod "http://127.0.0.1:$Port/json/list") | Where-Object { $_.type -eq 'page' } | Select-Object -First 1 } catch {}
  }
  $ws = New-Object System.Net.WebSockets.ClientWebSocket
  $ws.Options.KeepAliveInterval = [TimeSpan]::FromSeconds(30)
  $ws.ConnectAsync([Uri]$tab.webSocketDebuggerUrl, [Threading.CancellationToken]::None).Wait()
  $script:id = 0
  function Send($method, $params) {
    $script:id++
    $msg = @{ id = $script:id; method = $method; params = $params } | ConvertTo-Json -Depth 8 -Compress
    $buf = [Text.Encoding]::UTF8.GetBytes($msg)
    $ws.SendAsync([ArraySegment[byte]]$buf, 'Text', $true, [Threading.CancellationToken]::None).Wait()
    while ($true) {
      $sb = New-Object System.Text.StringBuilder
      do {
        $chunk = New-Object byte[] 1048576
        $r = $ws.ReceiveAsync([ArraySegment[byte]]$chunk, [Threading.CancellationToken]::None).Result
        [void]$sb.Append([Text.Encoding]::UTF8.GetString($chunk, 0, $r.Count))
      } while (-not $r.EndOfMessage)
      $obj = $sb.ToString() | ConvertFrom-Json
      if ($obj.id -eq $script:id) { return $obj }
    }
  }
  [void](Send "Page.enable" @{})
  $dsf = if ($Mobile) { 2 } else { 1 }
  [void](Send "Emulation.setDeviceMetricsOverride" @{ width = $W; height = $H; deviceScaleFactor = $dsf; mobile = [bool]$Mobile })
  if ($Mobile) { [void](Send "Emulation.setTouchEmulationEnabled" @{ enabled = $true; maxTouchPoints = 5 }) }
  [void](Send "Page.navigate" @{ url = "http://localhost:8920/dmz/index.html" })
  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Milliseconds 500
    $r = Send "Runtime.evaluate" @{ expression = "!!(window.__dmz && window.__dmzReady && document.fonts.status==='loaded')"; returnByValue = $true }
    if ($r.result.result.value) { break }
  }
  Start-Sleep -Milliseconds 1500
  # 형식: key:f:name:T  (T = 폭발 후 경과 초, none = 먼지 없음). 실제 폭발 먼지가 끝난 뒤(6.5s) T 시점 먼지를 고정해 렌더·캡처한다.
  foreach ($s in $Shots.Split(',')) {
    $parts = $s.Split(':'); $key = $parts[0]; $f = $parts[1]; $name = $parts[2]; $T = $parts[3]
    [void](Send "Runtime.evaluate" @{ expression = "__dmz.go('$key',$f); 1"; returnByValue = $true })
    Start-Sleep -Milliseconds 6500
    $dustExpr = if ($T -eq 'none') { "__dmz.world.dust.update(null);" } else { "__dmz.world.dust.update($T);" }
    $r = Send "Runtime.evaluate" @{ expression = "__dmz.go('$key',$f); $dustExpr __dmz.world.render(); new Promise(r=>requestAnimationFrame(()=>r(JSON.stringify({vw:innerWidth,vh:innerHeight,oy:__dmz.world.camera.view?__dmz.world.camera.view.offsetY:0}))))"; awaitPromise = $true; returnByValue = $true }
    $img = Send "Page.captureScreenshot" @{ format = "png" }
    $file = Join-Path $Out "$Prefix-$name.png"
    [IO.File]::WriteAllBytes($file, [Convert]::FromBase64String($img.result.data))
    "saved $file " + $r.result.result.value
  }
} finally {
  try { $ws.Dispose() } catch {}
  Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like "*$udd*" } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}
