$files = Get-ChildItem -Path "D:\WEB TERAL" -Recurse -Filter "*.html"
foreach ($f in $files) {
    $c = [System.IO.File]::ReadAllText($f.FullName)
    $c = $c.Replace('styles.css"', 'styles.css?v=2"')
    $c = $c.Replace("styles.css'", "styles.css?v=2'")
    $c = $c.Replace('main.js"', 'main.js?v=2"')
    $c = $c.Replace("main.js'", "main.js?v=2'")
    $c = $c.Replace('particles.js"', 'particles.js?v=2"')
    [System.IO.File]::WriteAllText($f.FullName, $c)
    Write-Host "Updated: $($f.Name)"
}
Write-Host "All done!"
