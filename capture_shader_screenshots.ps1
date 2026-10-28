$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$base = 'file:///C:/Users/grkga/Documents/antigravity/beautiful-newton/shader-patterns-preview.html'

$shots = @(
  @{ name = 'shader-pattern-05-geometric-champion-light.png'; hash = '#pattern-5a-light' },
  @{ name = 'shader-pattern-05-geometric-champion-dark.png'; hash = '#pattern-5a-dark' }
)

foreach ($s in $shots) {
  $target = "c:\Users\grkga\Documents\antigravity\beautiful-newton\renders\" + $s.name
  $url = $base + $s.hash
  Write-Output "Capturing $($s.name) from $url..."
  Start-Process $edge -ArgumentList '--headless=new', '--disable-gpu', '--window-size=1280,800', ('--screenshot=' + $target), $url -Wait
}

Write-Output "Completed all captures."
