param(
    [Parameter(Mandatory=$true)]
    [string]$ArticleJson
)

$ErrorActionPreference = "Stop"
Set-Location "$PSScriptRoot\.."

if (-not (Test-Path $ArticleJson)) { Write-Error "File not found: $ArticleJson"; exit 1 }

$article = Get-Content $ArticleJson -Raw | ConvertFrom-Json
Write-Host "TITLE: $($article.title)"

$DATA_JS = "js\data.js"
$ARTICLES_DIR = "articles"

$content = [System.IO.File]::ReadAllText((Resolve-Path $DATA_JS))
if ($content.StartsWith([char]0xFEFF)) { $content = $content.Substring(1) }

# compute new id
$idMatches = [regex]::Matches($content, "id:\s*'(\d+)'")
$maxId = 0
foreach ($m in $idMatches) {
    $n = [int]$m.Groups[1].Value
    if ($n -gt $maxId) { $maxId = $n }
}
$newId = $maxId + 1
Write-Host "NEW_ID: $newId"

$title = ($article.title -replace '"', '\"')
$excerpt = ($article.excerpt -replace '"', '\"')
$slug = $article.slug
$category = $article.category
$publishDate = $article.publishDate
$readTime = if ($article.readTime) { $article.readTime } else { "5 min read" }
$contentText = $article.content
$imageUrl = "https://picsum.photos/seed/$slug/1200/600"

if ($article.products -and $article.products.Count -gt 0) {
    $prodJson = ($article.products | ConvertTo-Json -Depth 4)
} else {
    $prodJson = "[`n    ]"
}

# Build article object block without PowerShell here-string quoting issues
$indentedContent = ($contentText -split "`n" | ForEach-Object { "    $_" }) -join "`n"

$lines = @(
    "  {",
    "    id: '$newId',",
    "    slug: '$slug',",
    "    title: `"$title`",",
    "    excerpt: `"$excerpt`",",
    "    category: '$category',",
    "    image: '$imageUrl',",
    "    publishDate: '$publishDate',",
    "    readTime: '$readTime',",
    "    content: ``"
)
$lines += $contentText.Split("`n") | ForEach-Object { "    $_" }
$lines += @(
    "    ``,",
    "    products: $prodJson",
    "  }"
)
$newArticleBlock = $lines -join "`n"

# insert
$articlesStartIdx = $content.IndexOf("const articles = [")
if ($articlesStartIdx -lt 0) { Write-Error "articles array not found"; exit 1 }
$articlesEndIdx = $content.IndexOf("];", $articlesStartIdx)
if ($articlesEndIdx -lt 0) { Write-Error "articles end not found"; exit 1 }
$beforeEnd = $content.Substring(0, $articlesEndIdx)
$lastBraceIdx = $beforeEnd.LastIndexOf("}")
if ($lastBraceIdx -lt 0) { Write-Error "last article object not found"; exit 1 }

$content = $beforeEnd.Substring(0, $lastBraceIdx + 1) + ",`n" + $newArticleBlock + "`n" + $content.Substring($articlesEndIdx)

# update category count
$escCat = [regex]::Escape($category)
$catPattern = "id:\s*'$escCat',[\s\S]*?count:\s*(\d+)"
$catMatch = [regex]::Match($content, $catPattern)
if ($catMatch.Success) {
    $oldCount = [int]$catMatch.Groups[1].Value
    $newCount = $oldCount + 1
    $content = [regex]::Replace($content, "(id:\s*'$escCat',[\s\S]*?count:\s*)\d+", { param($m) $m.Groups[1].Value + $newCount }, 1)
    Write-Host "CATEGORY_COUNT: $oldCount -> $newCount ($category)"
} else {
    Write-Host "WARNING: category $category not found, skipping count update"
}

# save data.js
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText((Resolve-Path $DATA_JS), $content, $utf8NoBom)
Write-Host "SAVED: js/data.js"

# wrapper
$wrapper = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>$title | LifestyleHub</title>
  <meta name="description" content="$excerpt">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body data-page="article" data-article-id="$newId">
  <div id="site-header"></div>
  <div id="article-container"></div>
  <div id="site-footer"></div>
  <button id="backToTop" class="back-to-top" aria-label="Back to top">UP</button>
  <script src="../js/data.js"></script>
  <script src="../js/main.js"></script>
</body>
</html>
"@

$wrapperPath = Join-Path (Join-Path $PSScriptRoot "..\articles") "article-$newId.html"
$wrapperPath = [System.IO.Path]::GetFullPath($wrapperPath)
[System.IO.File]::WriteAllText($wrapperPath, $wrapper, $utf8NoBom)
Write-Host "SAVED: articles/article-$newId.html"

Write-Host ""
Write-Host "=== DONE ==="
Write-Host "Next: .\scripts\commit-and-push.ps1"
