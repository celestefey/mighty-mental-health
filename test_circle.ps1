$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$svgMod = [System.IO.File]::ReadAllText('I:\Files\Mighty Mental Health\logo draft.svg') -replace 'viewBox="[^"]*"', 'viewBox="930 30 130 130"'
[System.IO.File]::WriteAllText('c:\Users\grkga\Documents\antigravity\beautiful-newton\assets\values-circle.svg', $svgMod)
Start-Process $edge -ArgumentList '--headless=new', '--disable-gpu', '--window-size=800,800', '--screenshot=c:\Users\grkga\Documents\antigravity\beautiful-newton\assets\test_circle.png', 'file:///C:/Users/grkga/Documents/antigravity/beautiful-newton/assets/values-circle.svg' -Wait
Write-Output "Done"
