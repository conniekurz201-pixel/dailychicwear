/**
 * publish.js - 向 LifestyleHub data.js 插入新文章
 * 
 * 用法: node scripts/publish.js article.json
 * 
 * article.json 格式见 scripts/article.template.json
 */

const fs = require('fs');
const path = require('path');

// ---------- 参数 ----------
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('用法: node scripts/publish.js <article.json>');
  process.exit(1);
}

const articleFile = path.resolve(args[0]);
if (!fs.existsSync(articleFile)) {
  console.error('文件不存在:', articleFile);
  process.exit(1);
}

const article = JSON.parse(fs.readFileSync(articleFile, 'utf8'));
console.log('📄 文章标题:', article.title);

// ---------- 路径 ----------
const ROOT = path.resolve(__dirname, '..');
const DATA_JS = path.join(ROOT, 'js', 'data.js');
const ARTICLES_DIR = path.join(ROOT, 'articles');

// ---------- 读取 data.js ----------
let content = fs.readFileSync(DATA_JS, 'utf8');
const encoding = content.charCodeAt(0) === 0xFEFF ? 'utf8-bom' : 'utf8';
if (encoding === 'utf8-bom') content = content.slice(1); // 去 BOM

// ---------- 计算新 id ----------
const idMatches = content.match(/id:\s*'(\d+)'/g) || [];
const maxId = idMatches.reduce((max, m) => {
  const id = parseInt(m.match(/'(\d+)'/)[1], 10);
  return id > max ? id : max;
}, 0);
const newId = String(maxId + 1);
console.log('🆕 新文章 ID:', newId);

// ---------- 构造新文章对象 ----------
// 把 content (JSON 里是纯文本) 包成 JS 模板字符串
const newArticleObj = `  {
    id: '${newId}',
    slug: '${article.slug}',
    title: ${JSON.stringify(article.title)},
    excerpt: ${JSON.stringify(article.excerpt)},
    category: '${article.category}',
    image: 'https://picsum.photos/seed/${article.slug}/1200/600',
    publishDate: '${article.publishDate}',
    readTime: '${article.readTime || '5 min read'}',
    content: \`
${article.content}
    \`,
    products: ${JSON.stringify(article.products || [], null, 4)}
  }`;

// ---------- 插入 articles 数组 ----------
// 找到 articles 数组的结尾 ]; （要小心不要匹配到 content 里的 ];）
// 策略: 找到 "const articles = [" 然后从那里找第一个 "];"
const articlesStartIdx = content.indexOf('const articles = [');
if (articlesStartIdx === -1) {
  console.error('❌ 找不到 articles 数组');
  process.exit(1);
}

// 从 articles 起点找 ];
let articlesEndIdx = content.indexOf('];', articlesStartIdx);
if (articlesEndIdx === -1) {
  console.error('❌ 找不到 articles 数组结尾');
  process.exit(1);
}

// 在结尾前插入，需要给旧的最后一项加逗号
const beforeEnd = content.slice(0, articlesEndIdx);
const afterEnd = content.slice(articlesEndIdx);

// 找 beforeEnd 的最后一个 } （最后一个文章对象的结束）
const lastBraceIdx = beforeEnd.lastIndexOf('}');
if (lastBraceIdx === -1) {
  console.error('❌ 找不到最后一个文章对象');
  process.exit(1);
}

// 在最后一个 } 后面加逗号，然后插入新文章
content = 
  beforeEnd.slice(0, lastBraceIdx + 1) + 
  ',\n' + 
  newArticleObj + 
  '\n' + 
  afterEnd;

// ---------- 更新 categories count ----------
// 找到目标分类的 count: N 并 +1
const catRegex = new RegExp(
  `(id:\\s*'${article.category}',[\\s\\S]*?count:\\s*)(\\d+)`,
  'm'
);
const catMatch = content.match(catRegex);
if (catMatch) {
  const oldCount = parseInt(catMatch[2], 10);
  const newCount = oldCount + 1;
  content = content.replace(catRegex, `$1${newCount}`);
  console.log(`📊 分类 ${article.category} count: ${oldCount} → ${newCount}`);
} else {
  console.warn(`⚠️ 没找到分类 ${article.category}，跳过 count 更新`);
}

// ---------- 写回 data.js ----------
fs.writeFileSync(DATA_JS, content, 'utf8');
console.log('✅ data.js 已更新');

// ---------- 生成 article wrapper ----------
const wrapperHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title} | LifestyleHub</title>
  <meta name="description" content="${article.excerpt}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body data-page="article" data-article-id="${newId}">
  <div id="site-header"></div>
  
  <div id="article-container"></div>

  <div id="site-footer"></div>
  
  <button id="backToTop" class="back-to-top" aria-label="Back to top">↑</button>
  
  <script src="../js/data.js"></script>
  <script src="../js/main.js"></script>
</body>
</html>
`;

const wrapperPath = path.join(ARTICLES_DIR, `article-${newId}.html`);
fs.writeFileSync(wrapperPath, wrapperHtml, 'utf8');
console.log(`✅ 生成 articles/article-${newId}.html`);

// ---------- 总结 ----------
console.log('\n🎉 文章发布准备完成！');
console.log(`   ID: ${newId}`);
console.log(`   标题: ${article.title}`);
console.log(`   分类: ${article.category}`);
console.log(`   slug: ${article.slug}`);
console.log(`\n下一步: 运行 scripts/commit-and-push.ps1 提交并推送到 GitHub`);
