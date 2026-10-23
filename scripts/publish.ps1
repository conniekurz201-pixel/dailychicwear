param(
    [Parameter(Mandatory=$true)]
    [string]$ArticleJson
)

$ErrorActionPreference = "Stop"
$root = "$PSScriptRoot\.."
Set-Location $root

if (-not (Test-Path $ArticleJson)) { Write-Error "File not found: $ArticleJson"; exit 1 }
$article = Get-Content $ArticleJson -Raw | ConvertFrom-Json
Write-Host "TITLE: $($article.title)"

# ---- find next article number ----
$maxNum = 0
Get-ChildItem "$root\blog-article-*.html" | ForEach-Object {
    $m = [regex]::Match($_.Name, "blog-article-(\d+)\.html")
    if ($m.Success) {
        $n = [int]$m.Groups[1].Value
        if ($n -gt $maxNum) { $maxNum = $n }
    }
}
$newNum = $maxNum + 1
$newFile = "blog-article-$newNum.html"
Write-Host "NEW FILE: $newFile"

# ---- read template & fill placeholders ----
$tpl = [System.IO.File]::ReadAllText("$PSScriptRoot\article-template.html")

# content: convert \n (literal backslash-n from JSON) into real newlines with indent
$contentText = $article.content -replace '\\n', "`n"
$contentLines = $contentText -split "`n" | ForEach-Object { "            $_" }
$contentBlock = $contentLines -join "`n"

$tpl = $tpl.Replace("{{TITLE}}", $article.title)
$tpl = $tpl.Replace("{{EXCERPT}}", $article.excerpt)
$tpl = $tpl.Replace("{{DATE}}", $article.date)
$tpl = $tpl.Replace("{{READ_TIME}}", $(if ($article.readTime) { $article.readTime } else { "5 min read" }))
$tpl = $tpl.Replace("{{CATEGORY}}", $article.category)
$tpl = $tpl.Replace("{{IMAGE_ALT}}", $(if ($article.imageAlt) { $article.imageAlt } else { $article.title }))
$tpl = $tpl.Replace("{{IMAGE}}", $article.image)
$tpl = $tpl.Replace("{{CONTENT}}", $contentBlock)

# ---- write new article page ----
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText("$root\$newFile", $tpl, $utf8)
Write-Host "SAVED: $newFile"

# ---- insert card into index.html blog-grid (at the TOP, newest first) ----
$indexPath = "$root\index.html"
$index = [System.IO.File]::ReadAllText($indexPath)

$cardLines = @(
    '                <article class="blog-card">',
    ('                    <img src="' + $article.image + '" alt="' + $article.imageAlt + '">'),
    '                    <div class="blog-content">',
    ('                        <span class="blog-date">' + $article.date + '</span>'),
    ('                        <h3>' + $article.title + '</h3>'),
    ('                        <p>' + $article.excerpt + '</p>'),
    ('                        <a href="' + $newFile + '" class="read-more">Read More</a>'),
    '                    </div>',
    '                </article>'
)
$card = ($cardLines -join "`n") + "`n"

$gridMarker = '<div class="blog-grid">'
$idx = $index.IndexOf($gridMarker)
if ($idx -lt 0) { Write-Error "blog-grid not found in index.html"; exit 1 }
$insertPos = $idx + $gridMarker.Length

$index = $index.Substring(0, $insertPos) + "`n" + $card + $index.Substring($insertPos)
[System.IO.File]::WriteAllText($indexPath, $index, $utf8)
Write-Host "UPDATED: index.html (card inserted at top of blog-grid)"

Write-Host ""
Write-Host "=== DONE ==="
Write-Host "Next: .\scripts\deploy.ps1 -Message 'Add blog-article-$newNum'"
