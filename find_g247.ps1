$xml = [xml](Get-Content -Raw 'I:\Files\Mighty Mental Health\logo draft.svg')
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('svg', 'http://www.w3.org/2000/svg')

$g = $xml.SelectSingleNode("//*[@id='g247']", $ns)
if ($g) {
    Write-Output "g247 OuterXml preview:"
    $xmlStr = $g.OuterXml
    Write-Output "Length: $($xmlStr.Length)"
    foreach ($c in $g.ChildNodes) {
        Write-Output "  child: $($c.Name) id=$($c.id) style=$($c.GetAttribute('style'))"
    }
}
