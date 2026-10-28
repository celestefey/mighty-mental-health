$canvasDir = 'c:\Users\grkga\Documents\antigravity\beautiful-newton'
$dLifter = Get-Content (Join-Path $canvasDir 'assets\path40_d.txt')
$dHeart = Get-Content (Join-Path $canvasDir 'assets\heart_d.txt')

$canvasSvg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1600" width="2400" height="3200">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAFBFD" />
      <stop offset="100%" stop-color="#F2F5F9" />
    </linearGradient>

    <!-- Deep Navy Gradient -->
    <linearGradient id="navyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#130C76" />
      <stop offset="100%" stop-color="#0038A8" />
    </linearGradient>

    <!-- Radiant Orange Gradient -->
    <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFAC24" />
      <stop offset="50%" stop-color="#FF9E00" />
      <stop offset="100%" stop-color="#F96100" />
    </linearGradient>

    <!-- Seigaiha Wave Pattern -->
    <pattern id="seigaihaTile" width="116.5" height="116.5" patternUnits="userSpaceOnUse">
      <path fill="none" stroke="#130C76" stroke-width="1.2" stroke-opacity="0.12" 
            d="M 0,58.24 C 0,42.16 13.03,29.12 29.12,29.12 C 45.2,29.12 58.24,42.16 58.24,58.24 Z M 116.5,0 C 100.4,0 87.36,13.03 87.36,29.12 C 87.36,45.2 100.4,58.24 116.5,58.24 Z M 0,58.24 C 16.08,58.24 29.12,71.28 29.12,87.36 C 29.12,103.45 16.08,116.5 0,116.5 Z M 58.24,58.24 C 58.24,74.33 71.28,87.36 87.36,87.36 C 103.45,87.36 116.5,74.33 116.5,58.24 Z M 0,0 C 0,16.08 13.03,29.12 29.12,29.12 C 45.2,29.12 58.24,16.08 58.24,0 Z M 58.24,0 C 58.24,16.08 71.28,29.12 87.36,29.12 C 103.45,29.12 116.5,16.08 116.5,0 Z" />
    </pattern>

    <!-- Isometric Cube Grid Pattern -->
    <pattern id="isoGrid" width="30" height="51.96" patternUnits="userSpaceOnUse">
      <g stroke="#ffffff" stroke-width="0.3" stroke-opacity="0.4">
        <polygon points="15,0 30,8.66 15,17.32 0,8.66" fill="#0038A8" fill-opacity="0.1" />
        <polygon points="0,8.66 15,17.32 15,34.64 0,25.98" fill="#130C76" fill-opacity="0.12" />
        <polygon points="15,17.32 30,8.66 30,25.98 15,34.64" fill="#F96100" fill-opacity="0.08" />
        <polygon points="0,25.98 15,34.64 0,43.3 -15,34.64" fill="#0038A8" fill-opacity="0.1" />
        <polygon points="-15,34.64 0,43.3 0,60.62 -15,51.96" fill="#130C76" fill-opacity="0.12" />
        <polygon points="0,43.3 15,34.64 15,51.96 0,60.62" fill="#FFAC24" fill-opacity="0.08" />
        <polygon points="30,25.98 45,34.64 30,43.3 15,34.64" fill="#0038A8" fill-opacity="0.1" />
        <polygon points="15,34.64 30,43.3 30,60.62 15,51.96" fill="#130C76" fill-opacity="0.12" />
        <polygon points="30,43.3 45,34.64 45,51.96 30,60.62" fill="#F96100" fill-opacity="0.08" />
      </g>
    </pattern>
  </defs>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400;600;700;900&amp;family=Space+Mono:wght@400;700&amp;display=swap');
    .mono { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 1.5px; fill: #130C76; fill-opacity: 0.6; }
    .mono-bold { font-family: 'Space Mono', monospace; font-weight: 700; font-size: 9px; letter-spacing: 2px; fill: #130C76; }
    .display { font-family: 'Noto Sans', sans-serif; font-weight: 900; letter-spacing: -1px; fill: #130C76; }
    .label { font-family: 'Noto Sans', sans-serif; font-weight: 600; font-size: 11px; letter-spacing: 2px; fill: #130C76; }
    .thin-line { stroke: #130C76; stroke-width: 0.6; stroke-opacity: 0.25; }
    .grid-axis { stroke: #130C76; stroke-width: 0.8; stroke-dasharray: 4,4; stroke-opacity: 0.35; }
  </style>

  <!-- Canvas Background -->
  <rect width="100%" height="100%" fill="url(#bgGrad)" />

  <!-- Outer Architectural Framing & Registration Marks -->
  <rect x="50" y="50" width="1100" height="1500" fill="none" stroke="#130C76" stroke-width="1.2" stroke-opacity="0.4" />
  <rect x="62" y="62" width="1076" height="1476" fill="none" stroke="#130C76" stroke-width="0.5" stroke-opacity="0.2" />

  <!-- Corner Registration Crosshairs -->
  <g stroke="#130C76" stroke-width="0.8" stroke-opacity="0.5">
    <line x1="40" y1="50" x2="60" y2="50" /><line x1="50" y1="40" x2="50" y2="60" />
    <line x1="1140" y1="50" x2="1160" y2="50" /><line x1="1150" y1="40" x2="1150" y2="60" />
    <line x1="40" y1="1550" x2="60" y2="1550" /><line x1="50" y1="1540" x2="50" y2="1560" />
    <line x1="1140" y1="1550" x2="1160" y2="1550" /><line x1="1150" y1="1540" x2="1150" y2="1560" />
  </g>

  <!-- Scientific Reference Top Bar -->
  <g transform="translate(80, 95)">
    <text class="mono-bold" x="0" y="0">FIG. 01 — THE SOMATIC-PSYCHOLOGICAL EQUILIBRIUM</text>
    <text class="mono" x="0" y="15">SPECIFICATION: DUAL-TRACK INTERVENTION MAP // SYSTEM ATLAS v4.2</text>
    <text class="mono" x="720" y="0">JURISDICTION: LOGAN [27.6392° S, 153.1094° E]</text>
    <text class="mono" x="720" y="15">STANDARD: PACFA CODE OF ETHICS § 4.1-8.3</text>
    <line x1="0" y1="28" x2="1040" y2="28" class="thin-line" />
  </g>

  <!-- Background Texture Quadrants -->
  <!-- Left Lower: Seigaiha Waves (Emotional Tides / Breath Cadence) -->
  <rect x="80" y="880" width="460" height="480" fill="url(#seigaihaTile)" rx="8" />
  <rect x="80" y="880" width="460" height="480" fill="none" stroke="#130C76" stroke-width="0.5" stroke-opacity="0.3" rx="8" />
  <text class="mono" x="95" y="905">SUB-SYSTEM A: RESPIRATORY CADENCE [SEIGAIHA WAVE HARMONIC]</text>
  
  <!-- Right Lower: Isometric 3D Stepped Grid (Progressive Overload / Somatic Structure) -->
  <rect x="660" y="880" width="460" height="480" fill="url(#isoGrid)" rx="8" />
  <rect x="660" y="880" width="460" height="480" fill="none" stroke="#130C76" stroke-width="0.5" stroke-opacity="0.3" rx="8" />
  <text class="mono" x="675" y="905">SUB-SYSTEM B: STRUCTURAL RESILIENCE [ISOMETRIC LATTICE]</text>

  <!-- Central Great Orbital System (Values Circle & Geometry) -->
  <g transform="translate(600, 520)">
    <!-- Concentric Celestial / Clinical Coordinate Rings -->
    <circle r="360" fill="none" stroke="#130C76" stroke-width="0.6" stroke-opacity="0.15" stroke-dasharray="3,6" />
    <circle r="300" fill="none" stroke="#0038A8" stroke-width="0.8" stroke-opacity="0.25" />
    <circle r="220" fill="none" stroke="#130C76" stroke-width="1.2" stroke-opacity="0.3" />
    <circle r="140" fill="none" stroke="#FF9E00" stroke-width="1.5" stroke-opacity="0.4" />
    <circle r="90" fill="#FFFFFF" stroke="#130C76" stroke-width="2" />

    <!-- 5 Radial Value Rays & Nodes at 72 degree intervals (Golden Pentagon) -->
    <!-- Node 1: Human Dignity (-90 deg / Top) -->
    <line x1="0" y1="-90" x2="0" y2="-300" stroke="#0038A8" stroke-width="1.5" />
    <circle cx="0" cy="-300" r="18" fill="#0038A8" />
    <circle cx="0" cy="-300" r="24" fill="none" stroke="#0038A8" stroke-width="0.8" stroke-dasharray="2,3" />
    <text class="label" x="35" y="-295" text-anchor="start">I. HUMAN DIGNITY</text>
    <text class="mono" x="35" y="-280" text-anchor="start">INHERENT WORTH &amp; SACRED RESPECT</text>

    <!-- Node 2: Acceptance (-18 deg / Top Right) -->
    <line x1="85" y1="-27" x2="285" y2="-92" stroke="#130C76" stroke-width="1.5" />
    <circle cx="285" cy="-92" r="18" fill="#130C76" />
    <circle cx="285" cy="-92" r="24" fill="none" stroke="#130C76" stroke-width="0.8" stroke-dasharray="2,3" />
    <text class="label" x="320" y="-87" text-anchor="start">II. ACCEPTANCE</text>
    <text class="mono" x="320" y="-72" text-anchor="start">NON-JUDGEMENTAL OF THE PAST</text>

    <!-- Node 3: Person-Centred Care (54 deg / Bottom Right) -->
    <line x1="53" y1="72" x2="176" y2="242" stroke="#FF9E00" stroke-width="1.5" />
    <circle cx="176" cy="242" r="18" fill="#FF9E00" />
    <circle cx="176" cy="242" r="24" fill="none" stroke="#FF9E00" stroke-width="0.8" stroke-dasharray="2,3" />
    <text class="label" x="210" y="247" text-anchor="start">III. PERSON-CENTRED CARE</text>
    <text class="mono" x="210" y="262" text-anchor="start">MEETING AT THE SAME EYE-LEVEL</text>

    <!-- Node 4: Self-Determination (126 deg / Bottom Left) -->
    <line x1="-53" y1="72" x2="-176" y2="242" stroke="#FFAC24" stroke-width="1.5" />
    <circle cx="-176" cy="242" r="18" fill="#FFAC24" />
    <circle cx="-176" cy="242" r="24" fill="none" stroke="#FFAC24" stroke-width="0.8" stroke-dasharray="2,3" />
    <text class="label" x="-210" y="247" text-anchor="end">IV. SELF-DETERMINATION</text>
    <text class="mono" x="-210" y="262" text-anchor="end">AUTONOMY, AGENCY &amp; ACTIVE TOOLS</text>

    <!-- Node 5: Holistic Perspective (198 deg / Top Left) -->
    <line x1="-85" y1="-27" x2="-285" y2="-92" stroke="#F96100" stroke-width="1.5" />
    <circle cx="-285" cy="-92" r="18" fill="#F96100" />
    <circle cx="-285" cy="-92" r="24" fill="none" stroke="#F96100" stroke-width="0.8" stroke-dasharray="2,3" />
    <text class="label" x="-320" y="-87" text-anchor="end">V. HOLISTIC PERSPECTIVE</text>
    <text class="mono" x="-320" y="-72" text-anchor="end">WHOLE PERSON: PSYCHE &amp; SOMA</text>

    <!-- Center Hub: The Monumental Weightlifter with Heart -->
    <g transform="translate(-76, -170) scale(2.0)">
      <path d="$dLifter" fill="#130C76" />
      <path d="$dHeart" fill="#F96100" />
    </g>
  </g>

  <!-- Chromatic Calibration Bar (Josef Albers meets ISO Standard) -->
  <g transform="translate(80, 1390)">
    <line x1="0" y1="0" x2="1040" y2="0" class="thin-line" />
    
    <!-- Color Chip 1: Bold Navy -->
    <rect x="0" y="20" width="180" height="45" fill="#130C76" rx="4" />
    <text class="mono" x="8" y="80">BOLD NAVY</text>
    <text class="mono-bold" x="8" y="94">#130C76</text>
    <text class="mono" x="8" y="106">PSYCH DEPTH / AAA</text>

    <!-- Color Chip 2: Philippine Blue -->
    <rect x="215" y="20" width="180" height="45" fill="#0038A8" rx="4" />
    <text class="mono" x="223" y="80">PHILIPPINE BLUE</text>
    <text class="mono-bold" x="223" y="94">#0038A8</text>
    <text class="mono" x="223" y="106">CLINICAL INTEGRITY / AA</text>

    <!-- Color Chip 3: Cadmium Orange -->
    <rect x="430" y="20" width="180" height="45" fill="#F96100" rx="4" />
    <text class="mono" x="438" y="80">CADMIUM ORANGE</text>
    <text class="mono-bold" x="438" y="94">#F96100</text>
    <text class="mono" x="438" y="106">SOMATIC VITALITY / CORE</text>

    <!-- Color Chip 4: Orange Peel -->
    <rect x="645" y="20" width="180" height="45" fill="#FF9E00" rx="4" />
    <text class="mono" x="653" y="80">ORANGE PEEL</text>
    <text class="mono-bold" x="653" y="94">#FF9E00</text>
    <text class="mono" x="653" y="106">WARMTH &amp; AGENCY</text>

    <!-- Color Chip 5: Aureoline Yellow -->
    <rect x="860" y="20" width="180" height="45" fill="#FFAC24" rx="4" />
    <text class="mono" x="868" y="80">AUREOLINE YELLOW</text>
    <text class="mono-bold" x="868" y="94">#FFAC24</text>
    <text class="mono" x="868" y="106">COGNITIVE CLARITY</text>
  </g>

  <!-- Master Typographic Inscription & Footer Metadata -->
  <g transform="translate(80, 1470)">
    <text class="display" font-size="28" x="0" y="50">MIGHTY MENTAL HEALTH</text>
    <text class="mono" x="0" y="68">PSYCHOTHERAPY &amp; PHYSICAL MOVEMENT // INTEGRATED ALLIED HEALTH ARCHITECTURE</text>
    <text class="mono" x="1040" y="50" text-anchor="end">CONCURRENT INTERVENTION: SOMA ↔ PSYCHE</text>
    <text class="mono" x="1040" y="68" text-anchor="end">MASTER BRAND CANVASES // PLATE 01 // ED. 2026</text>
  </g>
</svg>
"@

$svgPath = Join-Path $canvasDir 'brand-canvas.svg'
$pngPath = Join-Path $canvasDir 'brand-canvas.png'
[System.IO.File]::WriteAllText($svgPath, $canvasSvg)

$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$args = @(
    '--headless=new',
    '--disable-gpu',
    '--window-size=2400,3200',
    '--screenshot=' + $pngPath,
    ('file:///' + ($svgPath -replace '\\', '/'))
)

Start-Process -FilePath $edge -ArgumentList $args -Wait
Write-Output "Rendered brand-canvas.png: $(Test-Path $pngPath)"
