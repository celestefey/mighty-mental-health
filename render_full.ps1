$baseDir = 'c:\Users\grkga\Documents\antigravity\beautiful-newton'
$svgRaw = [System.IO.File]::ReadAllText('I:\Files\Mighty Mental Health\logo draft.svg')

function Render-FullPage($name, $vb) {
    # Replace viewBox in root svg
    $svgMod = $svgRaw -replace 'viewBox="[^"]*"', ('viewBox="' + $vb + '"')
    
    $svgPath = Join-Path $baseDir ($name + '_full.svg')
    $pngPath = Join-Path $baseDir ($name + '_full.png')
    [System.IO.File]::WriteAllText($svgPath, $svgMod)

    $fileUrl = 'file:///' + ($svgPath -replace '\\', '/')
    $edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    
    $args = @(
        '--headless=new',
        '--disable-gpu',
        '--window-size=1200,1700',
        ('--screenshot=' + $pngPath),
        $fileUrl
    )
    
    Start-Process -FilePath $edge -ArgumentList $args -Wait
    Write-Output "[$name] Exists: $(Test-Path $pngPath)"
}

Render-FullPage 'page1' '0 0 210 297'
Render-FullPage 'page2' '220 0 210 297'
Render-FullPage 'page3' '440 0 210 297'
Render-FullPage 'page4' '660 0 210 297'
Render-FullPage 'page5' '880 0 210 297'
