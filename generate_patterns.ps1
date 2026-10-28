$assetDir = 'c:\Users\grkga\Documents\antigravity\beautiful-newton\assets'

# 1. Seigaiha Pattern SVG
$seigaihaSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 232.98 232.98">
  <defs>
    <pattern id="seigaiha" width="232.98" height="232.98" patternUnits="userSpaceOnUse">
      <path fill="#130C76" fill-opacity="0.08" stroke="#130C76" stroke-width="3" stroke-linecap="round" d="M 0,116.49 C 0,84.32 26.07,58.24 58.24,58.24 C 90.41,58.24 116.49,84.32 116.49,116.49 Z M 232.98,0 C 200.81,0 174.73,26.07 174.73,58.24 C 174.73,90.41 200.81,116.49 232.98,116.49 Z M 0,116.49 C 32.16,116.49 58.24,142.57 58.24,174.74 C 58.24,206.9 32.16,232.98 0,232.98 Z M 116.49,116.49 C 116.49,148.66 142.57,174.74 174.74,174.74 C 206.91,174.74 232.98,148.66 232.98,116.49 Z M 0,0 C 0,32.16 26.07,58.24 58.24,58.24 C 90.41,58.24 116.49,32.16 116.49,0 Z M 116.49,0 C 116.49,32.16 142.57,58.24 174.74,58.24 C 206.91,58.24 232.98,32.16 232.98,0 Z" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#seigaiha)" />
</svg>
'@
[System.IO.File]::WriteAllText((Join-Path $assetDir 'pattern-seigaiha.svg'), $seigaihaSvg)

# 2. 3D Isometric Stepped Grid SVG
$cubesSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 100 100">
  <defs>
    <pattern id="isometric-cubes" width="40" height="69.28" patternUnits="userSpaceOnUse">
      <g stroke="#ffffff" stroke-width="0.5">
        <!-- Top face -->
        <polygon points="20,0 40,11.55 20,23.09 0,11.55" fill="#0038A8" />
        <!-- Left face -->
        <polygon points="0,11.55 20,23.09 20,46.19 0,34.64" fill="#130C76" />
        <!-- Right face -->
        <polygon points="20,23.09 40,11.55 40,34.64 20,46.19" fill="#F96100" />
        
        <!-- Second cube offset -->
        <polygon points="0,34.64 20,46.19 0,57.74 -20,46.19" fill="#0038A8" />
        <polygon points="-20,46.19 0,57.74 0,80.83 -20,69.28" fill="#130C76" />
        <polygon points="0,57.74 20,46.19 20,69.28 0,80.83" fill="#FFAC24" />

        <polygon points="40,34.64 60,46.19 40,57.74 20,46.19" fill="#0038A8" />
        <polygon points="20,46.19 40,57.74 40,80.83 20,69.28" fill="#130C76" />
        <polygon points="40,57.74 60,46.19 60,69.28 40,80.83" fill="#F96100" />
      </g>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#isometric-cubes)" />
</svg>
'@
[System.IO.File]::WriteAllText((Join-Path $assetDir 'pattern-cubes.svg'), $cubesSvg)

# 3. Interlocking Geometric Loops SVG
$loopsSvg = @'
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 120 120">
  <defs>
    <pattern id="interlocking-loops" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="16" fill="none" stroke="#0038A8" stroke-width="4" stroke-opacity="0.15" />
      <circle cx="0" cy="0" r="16" fill="none" stroke="#F96100" stroke-width="4" stroke-opacity="0.2" />
      <circle cx="40" cy="0" r="16" fill="none" stroke="#F96100" stroke-width="4" stroke-opacity="0.2" />
      <circle cx="0" cy="40" r="16" fill="none" stroke="#F96100" stroke-width="4" stroke-opacity="0.2" />
      <circle cx="40" cy="40" r="16" fill="none" stroke="#F96100" stroke-width="4" stroke-opacity="0.2" />
      <circle cx="20" cy="20" r="6" fill="#130C76" fill-opacity="0.25" />
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#interlocking-loops)" />
</svg>
'@
[System.IO.File]::WriteAllText((Join-Path $assetDir 'pattern-interlocking.svg'), $loopsSvg)

Write-Output "Patterns generated successfully."
