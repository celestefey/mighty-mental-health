$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$url = 'file:///C:/Users/grkga/Documents/antigravity/beautiful-newton/shader-patterns-preview.html#pattern-4-light'

# Run edge and capture stdout/stderr with verbose logging
$proc = Start-Process $edge -ArgumentList '--headless=new', '--enable-logging=stderr', '--v=1', $url -RedirectStandardError 'c:\Users\grkga\Documents\antigravity\beautiful-newton\edge_error.log' -PassThru
Start-Sleep -Seconds 3
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue

Get-Content 'c:\Users\grkga\Documents\antigravity\beautiful-newton\edge_error.log' | Select-String -Pattern 'CONSOLE|Error|Uncaught'
