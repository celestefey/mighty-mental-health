Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile('c:\Users\grkga\Documents\antigravity\beautiful-newton\renders\shader-pattern-03b-neuro-morph-light.png')
$c1 = $bmp.GetPixel(100, 100)
$c2 = $bmp.GetPixel(640, 400)
$c3 = $bmp.GetPixel(50, 500)
Write-Output "Pixel 100,100: $($c1.R),$($c1.G),$($c1.B)"
Write-Output "Pixel 640,400: $($c2.R),$($c2.G),$($c2.B)"
Write-Output "Pixel 50,500: $($c3.R),$($c3.G),$($c3.B)"

# Check if there are ANY non-background pixels in the canvas area (e.g. y=500 to 700)
$bgR = 220
$bgG = 229
$bgB = 242
$diffCount = 0
for ($x = 0; $x -lt $bmp.Width; $x += 10) {
    for ($y = 200; $y -lt $bmp.Height; $y += 10) {
        $p = $bmp.GetPixel($x, $y)
        if ([Math]::Abs($p.R - $bgR) -gt 15 -or [Math]::Abs($p.G - $bgG) -gt 15 -or [Math]::Abs($p.B - $bgB) -gt 15) {
            $diffCount++
        }
    }
}
Write-Output "Diff pixels found: $diffCount"
$bmp.Dispose()
