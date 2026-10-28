$xml = [xml](Get-Content -Raw 'I:\Files\Mighty Mental Health\logo draft.svg')
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('svg', 'http://www.w3.org/2000/svg')

$p40 = $xml.SelectSingleNode("//*[@id='path40']", $ns)
[System.IO.File]::WriteAllText('c:\Users\grkga\Documents\antigravity\beautiful-newton\assets\path40_d.txt', $p40.GetAttribute('d'))

$pHeart = $xml.SelectSingleNode("//*[@id='path36-7']", $ns)
[System.IO.File]::WriteAllText('c:\Users\grkga\Documents\antigravity\beautiful-newton\assets\heart_d.txt', $pHeart.GetAttribute('d'))

Write-Output "Saved path40_d.txt and heart_d.txt"
