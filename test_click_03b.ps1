$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$url = 'file:///C:/Users/grkga/Documents/antigravity/beautiful-newton/shader-patterns-preview.html#pattern-4-light'
$target = 'c:\Users\grkga\Documents\antigravity\beautiful-newton\renders\click_03b_debug.png'

# Let's run edge with --dump-dom or take screenshot
Start-Process $edge -ArgumentList '--headless=new', '--disable-gpu', '--window-size=1280,800', ('--screenshot=' + $target), $url -Wait
Write-Output "Screenshot saved to $target"
