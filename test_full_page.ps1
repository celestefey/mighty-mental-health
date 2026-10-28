$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$url = 'file:///C:/Users/grkga/Documents/antigravity/beautiful-newton/shader-patterns-preview.html'
$target = 'c:\Users\grkga\Documents\antigravity\beautiful-newton\renders\full_page_03b.png'

# In Edge, we can pass URL with hash #pattern-4-light
Start-Process $edge -ArgumentList '--headless=new', '--disable-gpu', '--window-size=1400,900', ('--screenshot=' + $target), "$url#pattern-4-light" -Wait
Write-Output "Captured $target"
