param([int]$Port = 8791, [string]$Root = "C:\Users\user\Documents\editshop")

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root on http://localhost:$Port/"

$mime = @{
  ".html"="text/html; charset=utf-8"; ".htm"="text/html; charset=utf-8"
  ".css"="text/css"; ".js"="application/javascript"
  ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".gif"="image/gif"
  ".svg"="image/svg+xml"; ".webp"="image/webp"; ".ico"="image/x-icon"
  ".json"="application/json"; ".mp4"="video/mp4"; ".webm"="video/webm"
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $path = [Uri]::UnescapeDataString($req.Url.AbsolutePath)
    if ($path -eq "/") { $path = "/index.html" }
    $full = Join-Path $Root ($path -replace "^/","")
    $full = [System.IO.Path]::GetFullPath($full)
    if (-not $full.StartsWith([System.IO.Path]::GetFullPath($Root))) {
      $res.StatusCode = 403; $res.Close(); continue
    }
    if (Test-Path $full -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($full).ToLower()
      $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
      $res.ContentType = $ct
      $bytes = [System.IO.File]::ReadAllBytes($full)
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $msg = [Text.Encoding]::UTF8.GetBytes("Not found: $path")
      $res.OutputStream.Write($msg,0,$msg.Length)
    }
  } catch {
    try { $res.StatusCode = 500 } catch {}
  } finally {
    $res.Close()
  }
}
