$xml = [xml](Get-Content -Raw 'I:\Files\Mighty Mental Health\logo draft.svg')
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('svg', 'http://www.w3.org/2000/svg')

$g248 = $xml.SelectSingleNode("//*[@id='g248']", $ns)
Write-Output "g248 transform: $($g248.GetAttribute('transform'))"
$text = $xml.SelectSingleNode("//*[@id='text12-6-7']", $ns)
Write-Output "text12-6-7 xml:"
Write-Output $text.OuterXml
Write-Output "path40 xml preview:"
Write-Output $xml.SelectSingleNode("//*[@id='path40']", $ns).OuterXml.Substring(0, 200)
Write-Output "path36-7 xml:"
Write-Output $xml.SelectSingleNode("//*[@id='path36-7']", $ns).OuterXml
