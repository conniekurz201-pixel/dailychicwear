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

# auto message
if (-not $Message) {
    $articleFile = $status | Where-Object { $_ -match "article-\d+\.html" } | Select-Object -First 1
    if ($articleFile) {
        $m = [regex]::Match($articleFile, "article-(\d+)")
        if ($m.Success) { $Message = "Add article $($m.Groups[1].Value)" }
    }
    if (-not $Message) { $Message = "Update site content" }
}

Write-Host ""
Write-Host "=== Commit: $Message ==="
git add -A 2>&1 | Out-Null
git commit -m $Message 2>&1 | ForEach-Object { Write-Host "  $_" }

Write-Host ""
Write-Host "=== Push ==="
git push 2>&1 | ForEach-Object { Write-Host "  $_" }

Write-Host ""
Write-Host "=== DONE ==="
Write-Host "Wait 1-2 min then check https://dailychicwear.com/"
