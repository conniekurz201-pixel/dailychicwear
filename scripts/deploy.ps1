param(
    [string]$Message = ""
)

$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\.."
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "=== Git Status ==="
$status = git status --short 2>&1
if (-not $status) {
    Write-Host "Nothing to commit."
    exit 0
}
$status | ForEach-Object { Write-Host "  $_" }

if (-not $Message) {
    $newArticle = $status | Where-Object { $_ -match "blog-article-\d+\.html" -and $_ -match "^\?\?" } | Select-Object -First 1
    if ($newArticle) {
        $m = [regex]::Match($newArticle, "blog-article-(\d+)")
        if ($m.Success) { $Message = "Add blog-article-$($m.Groups[1].Value)" }
    }
    if (-not $Message) { $Message = "Update site content" }
}

Write-Host ""
Write-Host "=== Commit: $Message ==="
git add -A 2>&1 | Out-Null
git commit -m "$Message" 2>&1 | ForEach-Object { Write-Host "  $_" }

Write-Host ""
Write-Host "=== Push ==="
$pushOutput = git push 2>&1
$pushOutput | ForEach-Object { Write-Host "  $_" }
if ($pushOutput -match "main -> main") {
    Write-Host ""
    Write-Host "=== PUSH OK ===" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=== PUSH MAY HAVE FAILED - check output above ===" -ForegroundColor Red
    exit 1
}
