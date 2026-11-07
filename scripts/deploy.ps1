param(
    [string]$Message = "",
    [int]$MaxWaitSeconds = 90,
    [string]$VerifyUrl = ""
)

$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\.."
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# ---- Rate limit: cooldown 2 min between pushes ----
$lastPushFile = "$env:TEMP\altitude_last_push.txt"
if (Test-Path $lastPushFile) {
    $last = [DateTime]::Parse((Get-Content $lastPushFile -Raw).Trim())
    $elapsed = (Get-Date) - $last
    if ($elapsed.TotalSeconds -lt 120) {
        $wait = [Math]::Ceiling(120 - $elapsed.TotalSeconds)
        Write-Host "🕐 Cooldown: last push was $([Math]::Floor($elapsed.TotalSeconds))s ago. Waiting ${wait}s..."
        Start-Sleep -Seconds $wait
    }
}

# ---- Git status ----
Write-Host "=== Git Status ==="
$status = git status --short 2>&1
if (-not $status) {
    Write-Host "Nothing to commit."
    exit 0
}
$status | ForEach-Object { Write-Host "  $_" }

# ---- Auto message ----
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

# ---- Push ----
Write-Host ""
Write-Host "=== Push to GitHub ==="
# git push normally outputs to stderr — use cmd to properly capture exit code
$pushOutput = cmd.exe /c "git push 2>&1" 2>&1
$pushExit = $LASTEXITCODE
$pushOutput | ForEach-Object { Write-Host "  $_" }
if ($pushExit -ne 0) {
    Write-Host "❌ Push FAILED (exit $pushExit)" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Push OK" -ForegroundColor Green

# Record push timestamp for rate limit
Get-Date -Format o | Out-File -FilePath $lastPushFile -Encoding UTF8

# ---- Primary: pull directly on the Hostinger server over SSH ----
# (Most reliable path: no webhook queue involved)
$SSH_HOST = "195.35.62.134"
$SSH_USER = "u333302685"
$SSH_PORT = 65002
$REMOTE_DIR = "~/domains/dailychicwear.com/public_html"
$RemoteCmd = "mkdir -p ~/.ssh; grep -q 'github.com' ~/.ssh/known_hosts || ssh-keyscan -t ed25519,rsa github.com 2>/dev/null >> ~/.ssh/known_hosts; cd $REMOTE_DIR && git pull 2>&1 | tail -8"
Write-Host ""
Write-Host "=== SSH git pull on Hostinger ===" -ForegroundColor Cyan
$sshPulled = $false
$sshOut = & ssh -o BatchMode=yes -o StrictHostKeyChecking=no -o ConnectTimeout=15 -p $SSH_PORT "$SSH_USER@$SSH_HOST" $RemoteCmd 2>&1
$sshExit = $LASTEXITCODE
$sshOut | ForEach-Object { Write-Host "  $_" }
if ($sshExit -eq 0 -and (($sshOut -join " ") -notmatch "Permission denied") -and (($sshOut -join " ") -notmatch "Host key verification failed")) {
    Write-Host "✅ SSH pull OK" -ForegroundColor Green
    $sshPulled = $true
} else {
    Write-Host "⚠️  SSH pull unavailable (will fall back to webhook)" -ForegroundColor Yellow
}

# ---- Fallback: force trigger Hostinger deploy via direct webhook POST ----
$HOSTINGER_WEBHOOK = "https://webhooks.hostinger.com/deploy/56ca3a4a0608faedbcdcd38b750c667"
if ($sshPulled) { goto SkipWebhook }
Write-Host ""
Write-Host "=== Direct POST to Hostinger (force deploy) ===" -ForegroundColor Cyan
try {
    $whPayload = @{
        action = "pushed"
        ref = "refs/heads/main"
        repository = @{ full_name = "conniekurz201-pixel/dailychicwear" }
    } | ConvertTo-Json -Depth 5
    Invoke-RestMethod -Uri $HOSTINGER_WEBHOOK -Method Post -ContentType "application/json" -Body $whPayload -TimeoutSec 10 | Out-Null
    Write-Host "✅ Webhook POST sent (force trigger)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Webhook POST failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   GitHub webhook should still work as backup."
}

SkipWebhook:

# ---- Auto-deploy verification ----
Write-Host ""
Write-Host "=== Waiting for auto-deploy (up to $MaxWaitSeconds s) ==="
if ($VerifyUrl) {
    $deployed = $false
    $step = 15
    $waited = 0
    while ($waited -lt $MaxWaitSeconds) {
        Start-Sleep -Seconds $step
        $waited += $step
        try {
            $r = Invoke-WebRequest -Uri $VerifyUrl -UseBasicParsing -TimeoutSec 10
            if ($r.StatusCode -eq 200) {
                Write-Host "✅ Deployed after ${waited}s" -ForegroundColor Green
                $deployed = $true
                break
            }
        } catch {}
        Write-Host "  ... ${waited}s, still waiting"
    }
    if (-not $deployed) {
        Write-Host ""
        Write-Host "⚠️  Auto-deploy may have FAILED after ${MaxWaitSeconds}s" -ForegroundColor Yellow
        Write-Host "   Please manually trigger deploy in Hostinger hPanel:"
        Write-Host "   高级 → 分布式版本控制系统 → ... → 部署"
    }
} else {
    Write-Host "✅ Push done. Wait ~60s for auto-deploy."
    Write-Host "   (Tip: add -VerifyUrl 'https://dailychicwear.com/blog-article-XX.html' to auto-verify)"
}
