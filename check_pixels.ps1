Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile('c:\Users\grkga\Documents\antigravity\beautiful-newton\renders\click_03b_debug.png')

# Sample points in canvas outside the mockup frame (e.g. left margin x=100, y=300, y=400, y=500, y=600)
for ($y = 200; $y -lt 700; $y += 50) {
    $p = $bmp.GetPixel(100, $y)
    Write-Output "Left margin (100, $y): R=$($p.R), G=$($p.G), B=$($p.B)"
}

# Right margin (x=1180)
for ($y = 200; $y -lt 700; $y += 50) {
    $p = $bmp.GetPixel(1180, $y)
    Write-Output "Right margin (1180, $y): R=$($p.R), G=$($p.G), B=$($p.B)"
}

$bmp.Dispose()
