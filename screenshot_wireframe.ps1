$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$htmlPath = 'file:///C:/Users/grkga/Documents/antigravity/beautiful-newton/brand-portal.html#tab-wireframe'
$pngPath = 'c:\Users\grkga\Documents\antigravity\beautiful-newton\wireframe-calendar-preview-full.png'
Start-Process $edge -ArgumentList '--headless=new', '--disable-gpu', '--window-size=1200,1650', ('--screenshot=' + $pngPath), $htmlPath -Wait
Test-Path $pngPath
