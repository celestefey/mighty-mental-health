$xml = [xml](Get-Content -Raw 'I:\Files\Mighty Mental Health\logo draft.svg')
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('svg', 'http://www.w3.org/2000/svg')

$t = $xml.SelectSingleNode("//*[@id='text12-6-7']", $ns)
if ($t) {
    Write-Output "text12-6-7 style: $($t.GetAttribute('style'))"
    foreach ($ts in $t.ChildNodes) {
        Write-Output "  tspan: $($ts.InnerText) style: $($ts.GetAttribute('style'))"
    }
}
