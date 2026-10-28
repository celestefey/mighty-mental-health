$baseDir = 'c:\Users\grkga\Documents\antigravity\beautiful-newton'
$svgRaw = [System.IO.File]::ReadAllText('I:\Files\Mighty Mental Health\logo draft.svg')

function Render-Page($name, $vb) {
    $svgMod = $svgRaw -replace 'viewBox="[^"]*"', ('viewBox="' + $vb + '"')
    
    $svgPath = Join-Path $baseDir ($name + '.svg')
    $pngPath = Join-Path $baseDir ($name + '.png')
    [System.IO.File]::WriteAllText($svgPath, $svgMod)

    $fileUrl = 'file:///' + ($svgPath -replace '\\', '/')
    $edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
    
    $args = @(
        '--headless=new',
        '--disable-gpu',
        ('--screenshot=' + $pngPath),
        $fileUrl
    )
    
    Start-Process -FilePath $edge -ArgumentList $args -Wait
    Start-Sleep -Milliseconds 500
    Write-Output "[$name] Exists: $(Test-Path $pngPath)"
}

Render-Page 'overview' '0 0 1100 310'
Render-Page 'page1' '0 0 210 297'
Render-Page 'page2' '220 0 210 297'
Render-Page 'page3' '440 0 210 297'
Render-Page 'page4' '660 0 210 297'
Render-Page 'page5' '880 0 210 297'
