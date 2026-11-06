param([Parameter(Mandatory=$true)][string]$AssetRoot)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$destination = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\images'))
New-Item -ItemType Directory -Path $destination -Force | Out-Null
$manifest = Get-Content -LiteralPath (Join-Path $AssetRoot 'manifest.json') -Raw | ConvertFrom-Json
$mapping = @(@{Number=15;Name='contact'},@{Number=4;Name='history'},@{Number=11;Name='document'},@{Number=12;Name='book'})
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
foreach ($entry in $mapping) {
  $record = $manifest | Where-Object number -eq $entry.Number
  $source = Join-Path $AssetRoot $record.path
  if ((Get-FileHash -LiteralPath $source -Algorithm SHA256).Hash.ToLowerInvariant() -ne $record.sha256) { throw "Source hash mismatch: $($record.filename)" }
  $original = [System.Drawing.Image]::FromFile($source)
  try {
    foreach ($size in @(720,1280,1920)) {
      $height = [int][Math]::Round($original.Height * $size / $original.Width)
      $bitmap = [System.Drawing.Bitmap]::new($size,$height)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $parameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
      try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.DrawImage($original,0,0,$size,$height)
        $parameters.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality,[long]88)
        $target = Join-Path $destination "$($entry.Name)-$size.jpg"
        $bitmap.Save($target,$codec,$parameters)
        [pscustomobject]@{File=[System.IO.Path]::GetFileName($target);Width=$size;Height=$height;Bytes=(Get-Item -LiteralPath $target).Length}
      } finally { $parameters.Dispose(); $graphics.Dispose(); $bitmap.Dispose() }
    }
  } finally { $original.Dispose() }
}
