$assetDir = 'c:\Users\grkga\Documents\antigravity\beautiful-newton\assets'
$d1 = Get-Content (Join-Path $assetDir 'path40_d.txt')
$d2 = Get-Content (Join-Path $assetDir 'heart_d.txt')

# 1. Clean Vector Primary Lockup (Orange Heart)
$svgPrimary = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="46 142 135 56" width="1350" height="560">
  <!-- Lifter Figure -->
  <g id="lifter-figure">
    <path id="body-barbell" d="$d1" fill="#130C76" />
    <path id="heart-core" d="$d2" fill="#F96100" />
  </g>
  <!-- Wordmark in Chunky Rounded Display Style -->
  <g id="wordmark" transform="scale(1.0041767,0.99584068)">
    <text x="107.88" y="158.58" style="font-family:'Noto Sans', 'Segoe UI Black', Arial, sans-serif;font-weight:900;font-size:16.5px;letter-spacing:-0.2px;fill:#130C76;stroke:#130C76;stroke-width:1.85;stroke-linecap:round;stroke-linejoin:round;paint-order:markers fill stroke;">
      <tspan x="107.88" y="158.58">MIGHTY</tspan>
      <tspan x="107.88" y="173.85">MENTAL</tspan>
      <tspan x="107.88" y="189.52" letter-spacing="0.45px">HEALTH</tspan>
    </text>
  </g>
</svg>
"@
[System.IO.File]::WriteAllText((Join-Path $assetDir 'logo-primary.svg'), $svgPrimary)

# 2. Clean Vector Primary Lockup (White Heart Cutout)
$svgWhiteHeart = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="46 142 135 56" width="1350" height="560">
  <!-- Lifter Figure -->
  <g id="lifter-figure">
    <path id="body-barbell" d="$d1" fill="#130C76" />
    <path id="heart-core-cutout" d="$d2" fill="#FFFFFF" />
  </g>
  <!-- Wordmark in Chunky Rounded Display Style -->
  <g id="wordmark" transform="scale(1.0041767,0.99584068)">
    <text x="107.88" y="158.58" style="font-family:'Noto Sans', 'Segoe UI Black', Arial, sans-serif;font-weight:900;font-size:16.5px;letter-spacing:-0.2px;fill:#130C76;stroke:#130C76;stroke-width:1.85;stroke-linecap:round;stroke-linejoin:round;paint-order:markers fill stroke;">
      <tspan x="107.88" y="158.58">MIGHTY</tspan>
      <tspan x="107.88" y="173.85">MENTAL</tspan>
      <tspan x="107.88" y="189.52" letter-spacing="0.45px">HEALTH</tspan>
    </text>
  </g>
</svg>
"@
[System.IO.File]::WriteAllText((Join-Path $assetDir 'logo-primary-white-heart.svg'), $svgWhiteHeart)

Write-Output "Generated clean SVG primary logos."
