$xml = [xml](Get-Content -Raw 'I:\Files\Mighty Mental Health\logo draft.svg')
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('svg', 'http://www.w3.org/2000/svg')
$ns.AddNamespace('inkscape', 'http://www.inkscape.org/namespaces/inkscape')

# The values circle on page 5 is around x=880 to 1090, y=0 to 200
# In page 5, viewBox was "880 0 210 297"
# The circle center is around x=995, y=110

$svgValuesCircle = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="900 10 190 190" width="800" height="800">
  <defs>
    $($xml.SelectSingleNode('//svg:defs', $ns).InnerXml)
  </defs>
  $($xml.SelectSingleNode("//*[@id='g491']", $ns).OuterXml)
  $($xml.SelectSingleNode("//*[@id='g362']", $ns).OuterXml)
  $($xml.SelectSingleNode("//*[@id='g361']", $ns).OuterXml)
  $($xml.SelectSingleNode("//*[@id='path40-8']", $ns).OuterXml)
  $($xml.SelectSingleNode("//*[@id='path36-7-1']", $ns).OuterXml)
</svg>
"@

[System.IO.File]::WriteAllText('c:\Users\grkga\Documents\antigravity\beautiful-newton\assets\values-circle.svg', $svgValuesCircle)
Write-Output "Wrote values-circle.svg"
