$xml = [xml](Get-Content -Raw 'I:\Files\Mighty Mental Health\logo draft.svg')
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('svg', 'http://www.w3.org/2000/svg')

function Inspect-Group($id) {
    $node = $xml.SelectSingleNode("//*[@id='$id']", $ns)
    if ($node) {
        Write-Output "=== GROUP $id ($($node.Name)) ==="
        Write-Output "Outer XML preview:"
        $str = $node.OuterXml
        if ($str.Length -gt 200) { $str = $str.Substring(0, 200) + '...' }
        Write-Output $str
        Write-Output "Child nodes:"
        foreach ($c in $node.ChildNodes) {
            Write-Output "  $($c.Name) id=$($c.id)"
        }
    } else {
        Write-Output "=== GROUP $id NOT FOUND ==="
    }
}

Inspect-Group 'g243'
Inspect-Group 'g244'
Inspect-Group 'g245'
Inspect-Group 'g64'
Inspect-Group 'g491'
Inspect-Group 'g491-5'
Inspect-Group 'g665'
Inspect-Group 'g666'
Inspect-Group 'g668'
Inspect-Group 'g669'
Inspect-Group 'g667'
