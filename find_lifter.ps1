$xml = [xml](Get-Content -Raw 'I:\Files\Mighty Mental Health\logo draft.svg')
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('svg', 'http://www.w3.org/2000/svg')

Write-Output '=== Search for Heart and Lifter Paths ==='
$paths = $xml.SelectNodes('//svg:path', $ns)
foreach ($p in $paths) {
    $style = $p.GetAttribute('style')
    $id = $p.id
    if ($style -match 'f96100|ff9e00|heart' -or $id -match 'heart') {
        Write-Output "Heart candidate: id=$id style=$style"
    }
}
