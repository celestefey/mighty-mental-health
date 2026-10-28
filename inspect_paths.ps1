$xml = [xml](Get-Content -Raw 'I:\Files\Mighty Mental Health\logo draft.svg')
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('svg', 'http://www.w3.org/2000/svg')

function Inspect-Path($id) {
    $node = $xml.SelectSingleNode("//*[@id='$id']", $ns)
    if ($node) {
        Write-Output "=== PATH $id ==="
        Write-Output "Style: $($node.GetAttribute('style'))"
        Write-Output "Transform: $($node.GetAttribute('transform'))"
        $d = $node.GetAttribute('d')
        if ($d.Length -gt 100) { $d = $d.Substring(0, 100) + '...' }
        Write-Output "d: $d"
    } else {
        Write-Output "=== PATH $id NOT FOUND ==="
    }
}

Inspect-Path 'path691'
Inspect-Path 'path693'
Inspect-Path 'path695'
Inspect-Path 'path697'
Inspect-Path 'path699'
Inspect-Path 'path622'
Inspect-Path 'path623'
Inspect-Path 'path633'
Inspect-Path 'path624'
Inspect-Path 'path625'
