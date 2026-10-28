$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$url = 'file:///c:/Users/grkga/Documents/antigravity/beautiful-newton/shader-patterns-preview.html'
$proc = Start-Process $edge -ArgumentList '--headless=new', '--enable-logging', '--v=1', $url -PassThru
Start-Sleep -Seconds 2
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue

$logPath = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\chrome_debug.log"
if (Test-Path $logPath) {
    Get-Content $logPath -Tail 30
} else {
    Write-Output "No debug log at $logPath"
}
