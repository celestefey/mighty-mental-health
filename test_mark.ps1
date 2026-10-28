$d1 = Get-Content 'c:\Users\grkga\Documents\antigravity\beautiful-newton\assets\path40_d.txt'
$d2 = Get-Content 'c:\Users\grkga\Documents\antigravity\beautiful-newton\assets\heart_d.txt'

# Let's create an SVG file containing just path40 and heart, and use a test script
$svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 145 55 50" width="550" height="500">
  <path d="$d1" fill="#130c76" />
  <path d="$d2" fill="#f96100" />
</svg>
"@
[System.IO.File]::WriteAllText('c:\Users\grkga\Documents\antigravity\beautiful-newton\assets\logo-mark-test.svg', $svg)
Write-Output "Wrote logo-mark-test.svg"
