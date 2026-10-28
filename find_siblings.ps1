$xml = [xml](Get-Content -Raw 'I:\Files\Mighty Mental Health\logo draft.svg')
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('svg', 'http://www.w3.org/2000/svg')

$p = $xml.SelectSingleNode("//*[@id='path36-7']", $ns)
if ($p) {
    Write-Output "Parent: $($p.ParentNode.Name) id=$($p.ParentNode.id)"
    foreach ($sib in $p.ParentNode.ChildNodes) {
        Write-Output "  Sibling: $($sib.Name) id=$($sib.id) style=$($sib.GetAttribute('style'))"
    }
}
