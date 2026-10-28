$d1 = Get-Content 'c:\Users\grkga\Documents\antigravity\beautiful-newton\assets\path40_d.txt'
$d2 = Get-Content 'c:\Users\grkga\Documents\antigravity\beautiful-newton\assets\heart_d.txt'

# Primary lockup
$svgPrimary = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 144 145 52" width="1450" height="520">
  <g id="logo-mark">
    <path d="$d1" fill="#130c76" />
    <path d="$d2" fill="#f96100" />
  </g>
  <text transform="scale(1.0041767,0.99584068)" x="106" y="158.58496" style="font-family:'Noto Sans', 'Segoe UI', Impact, 'Arial Black', sans-serif;font-weight:900;font-size:16.5px;fill:#130c76;letter-spacing:-0.2px;">
    <tspan x="106" y="158.58496">MIGHTY</tspan>
    <tspan x="106" y="173.84534">MENTAL</tspan>
    <tspan x="106" y="189.51814" letter-spacing="0.45px">HEALTH</tspan>
  </text>
</svg>
"@

[System.IO.File]::WriteAllText('c:\Users\grkga\Documents\antigravity\beautiful-newton\assets\logo-primary.svg', $svgPrimary)
Write-Output "Wrote logo-primary.svg"
