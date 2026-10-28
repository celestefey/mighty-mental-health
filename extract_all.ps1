$xml = [xml](Get-Content -Raw 'I:\Files\Mighty Mental Health\logo draft.svg')
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('svg', 'http://www.w3.org/2000/svg')
$ns.AddNamespace('xlink', 'http://www.w3.org/1999/xlink')

$assetDir = 'c:\Users\grkga\Documents\antigravity\beautiful-newton\assets'

# 1. logo-mark.svg
$p40 = $xml.SelectSingleNode("//*[@id='path40']", $ns).GetAttribute('d')
$pHeart = $xml.SelectSingleNode("//*[@id='path36-7']", $ns).GetAttribute('d')

$svgMark = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 144 54 52" width="540" height="520">
  <g id="lifter-figure">
    <path id="body-barbell" d="$p40" fill="#130C76" />
    <path id="heart-core" d="$pHeart" fill="#F96100" />
  </g>
</svg>
"@
[System.IO.File]::WriteAllText((Join-Path $assetDir 'logo-mark.svg'), $svgMark)

# 2. logo-mark-inverted.svg (for dark navy backgrounds)
$svgMarkInv = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="50 144 54 52" width="540" height="520">
  <g id="lifter-figure-inverted">
    <path id="body-barbell" d="$p40" fill="#FFFFFF" />
    <path id="heart-core" d="$pHeart" fill="#F96100" />
  </g>
</svg>
"@
[System.IO.File]::WriteAllText((Join-Path $assetDir 'logo-mark-inverted.svg'), $svgMarkInv)

# 3. Extract the 5 values icons from path691, path693, path695, path697, path699
# Let's create clean individual SVG icon files

function Save-Icon($id, $fileName, $title, $vb, $fill) {
    $node = $xml.SelectSingleNode("//*[@id='$id']", $ns)
    if ($node) {
        $d = $node.GetAttribute('d')
        $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="$vb" width="200" height="200">
  <title>$title</title>
  <path d="$d" fill="$fill" />
</svg>
"@
        [System.IO.File]::WriteAllText((Join-Path $assetDir $fileName), $svg)
        Write-Output "Saved $fileName"
    }
}

# Icon 1: Human Dignity (clasping hands heart)
Save-Icon 'path691' 'icon-human-dignity.svg' 'Human Dignity' '696 46 22 22' '#0038A8'

# Icon 2: Acceptance (open book)
Save-Icon 'path693' 'icon-acceptance.svg' 'Acceptance' '686 86 24 22' '#130C76'

# Icon 3: Holistic Perspective (6-petal flower)
Save-Icon 'path699' 'icon-holistic-perspective.svg' 'Holistic Perspective' '690 134 22 22' '#F96100'

# Icon 4: Person-Centred Care (meeting figures)
Save-Icon 'path695' 'icon-person-centred-care.svg' 'Person-Centred Care' '690 174 24 22' '#FF9E00'

# Icon 5: Self-Determination (flame/sprout)
Save-Icon 'path697' 'icon-self-determination.svg' 'Self-Determination' '688 220 22 22' '#FFAC24'

Write-Output "Icons extraction complete."
