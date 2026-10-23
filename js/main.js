// Main JavaScript for the affiliate website
(function() {
  'use strict';

  // ============ Path Resolution ============
  const pageType = document.body ? document.body.dataset.page : 'home';
  const pathPrefix = (pageType === 'article' || pageType === 'category') ? '../' : '';

  function p(relativePath) {
    return pathPrefix + relativePath;
  }

  // Category links are same-dir on category pages, cross-dir otherwise
  function pCat(slug) {
    return (pageType === 'category') ? (slug + '.html') : p('pages/' + slug + '.html');
  }

  // Article links are same-dir on article pages, cross-dir otherwise
  function pArticle(id) {
    return (pageType === 'article') ? ('article-' + id + '.html') : p('articles/article-' + id + '.html');
  }

  // ============ Canvas Image Generator ============
  const categoryThemes = {
    fashion:   { colors: ['#ff6b6b', '#c44569', '#f8b500'], icons: ['👗', '👚', '👠', '👜', '🧵'] },
    beauty:    { colors: ['#f8bbd0', '#ec407a', '#ab47bc'], icons: ['💄', '💅', '🌸', '✨', '🪞'] },
    style:     { colors: ['#9fa8da', '#7986cb', '#3f51b5'], icons: ['🏠', '🛋️', '🌿', '🕯️', '🧘'] },
    general:   { colors: ['#81c784', '#66bb6a', '#43a047'], icons: ['🛒', '📦', '🔧', '🧰', '🎁'] },
    electronics:{ colors: ['#64b5f6', '#1e88e5', '#1565c0'], icons: ['📱', '💻', '🎧', '⌚', '🖥️'] },
    food:      { colors: ['#ffb74d', '#ff8a65', '#f4511e'], icons: ['🍕', '🍰', '🥘', '☕', '🍎'] }
  };

  const allIcons = {
    fashion: ['👗', '👔', '👚', '👖', '👜', '👟', '👠', '🧢', '🕶️', '💍'],
    beauty: ['💄', '💅', '🌸', '✨', '🪞', '🧴', '💋', '🖌️', '🧖‍♀️', '🧼'],
    style: ['🏠', '🛋️', '🌿', '🕯️', '🧘', '🛏️', '🪴', '📚', '🎨', '🧹'],
    general: ['🛒', '📦', '🔧', '🧰', '🎁', '🧺', '🪑', '🪟', '💡', '🔑'],
    electronics: ['📱', '💻', '🎧', '⌚', '🖥️', '📷', '⌨️', '🖱️', '🔌', '💾'],
    food: ['🍕', '🍰', '🥘', '☕', '🍎', '🍔', '🍟', '🌮', '🥗', '🍪']
  };

  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function generateImage(canvasId, category, label, width, height) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    const seed = hashString(canvasId + label);
    const theme = categoryThemes[category] || categoryThemes.style;
    const icons = allIcons[category] || allIcons.style;
    
    // Generate gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    const c1 = theme.colors[seed % theme.colors.length];
    const c2 = theme.colors[(seed + 1) % theme.colors.length];
    gradient.addColorStop(0, c1);
    gradient.addColorStop(1, c2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add decorative circles
    ctx.globalAlpha = 0.15;
    const circleCount = 3 + (seed % 3);
    for (let i = 0; i < circleCount; i++) {
      const x = ((seed + i * 50) % width);
      const y = ((seed + i * 37) % height);
      const r = 30 + ((seed + i * 23) % 60);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Add main icon
    const mainIcon = icons[seed % icons.length];
    const iconSize = Math.min(width, height) * 0.25;
    ctx.font = `${iconSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mainIcon, width / 2, height / 2 - iconSize * 0.1);
    
    // Add label
    ctx.font = `bold ${Math.max(14, Math.min(width / 12, 28))}px "Inter", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText(label, width / 2, height / 2 + iconSize * 0.6);
    ctx.shadowBlur = 0;
    
    return canvas.toDataURL('image/png');
  }

  function generateProductImage(canvasId, category, productName, width, height) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    const seed = hashString(canvasId + productName);
    const theme = categoryThemes[category] || categoryThemes.style;
    const icons = allIcons[category] || allIcons.style;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Border
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);
    
    // Colored accent area at top
    const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.5);
    gradient.addColorStop(0, theme.colors[0] + '40');
    gradient.addColorStop(1, theme.colors[1] + '20');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height * 0.5);
    
    // Icon
    const icon = icons[seed % icons.length];
    const iconSize = width * 0.35;
    ctx.font = `${iconSize}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, width / 2, height * 0.35);
    
    // Product name
    ctx.font = `bold ${Math.max(11, Math.min(width / 10, 18))}px "Inter", sans-serif`;
    ctx.fillStyle = '#333333';
    const nameLines = wrapText(ctx, productName, width - 20);
    nameLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, height * 0.7 + i * 22);
    });
    
    return canvas.toDataURL('image/png');
  }

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines.slice(0, 2);
  }

  // Make available globally
  window.generateImage = generateImage;
  window.generateProductImage = generateProductImage;

  // ============ Navigation ============
  function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const mainNav = document.querySelector('.main-nav');
    
    if (hamburger && mainNav) {
      hamburger.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        hamburger.classList.toggle('active');
      });
    }
    
    document.querySelectorAll('.nav-menu a').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('active');
        hamburger.classList.remove('active');
      });
    });
  }

  // ============ Back to Top Button ============
  function initBackToTop() {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    });
    
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ============ Render Components ============
  function renderHeader() {
    const headerHTML = `
      <header class="site-header">
        <div class="header-inner">
          <a href="${p('index.html')}" class="logo">Lifestyle<span>Hub</span></a>
          <nav class="main-nav">
            <ul class="nav-menu">
              <li><a href="${p('index.html')}">Home</a></li>
              <li><a href="${pCat('fashion')}">Fashion</a></li>
              <li><a href="${pCat('beauty')}">Beauty</a></li>
              <li><a href="${pCat('style')}">Style</a></li>
              <li><a href="${pCat('general')}">General</a></li>
              <li><a href="${pCat('electronics')}">Electronics</a></li>
              <li><a href="${pCat('food')}">Food</a></li>
            </ul>
            <div class="header-search">
              <input type="text" placeholder="Search articles..." aria-label="Search">
            </div>
          </nav>
          <button class="hamburger" aria-label="Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>
    `;
    
    const headerContainer = document.getElementById('site-header');
    if (headerContainer) {
      headerContainer.innerHTML = headerHTML;
    }
  }

  function renderFooter() {
    const footerHTML = `
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="${p('index.html')}">Home</a></li>
              <li><a href="${p('index.html')}#latest">Latest Articles</a></li>
              <li><a href="${p('index.html')}#categories">Categories</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Categories</h4>
            <ul>
              <li><a href="${pCat('fashion')}">Fashion</a></li>
              <li><a href="${pCat('beauty')}">Beauty</a></li>
              <li><a href="${pCat('style')}">Style</a></li>
              <li><a href="${pCat('general')}">General Merchandise</a></li>
              <li><a href="${pCat('electronics')}">3C Electronics</a></li>
              <li><a href="${pCat('food')}">Food & Beverage</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>About</h4>
            <p style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">
              LifestyleHub is your trusted source for product recommendations and reviews across fashion, beauty, electronics, and more.
            </p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2025 LifestyleHub. All rights reserved. As an Amazon Associate we earn from qualifying purchases.</p>
        </div>
      </footer>
    `;
    
    const footerContainer = document.getElementById('site-footer');
    if (footerContainer) {
      footerContainer.innerHTML = footerHTML;
    }
  }

  function renderCategoryGrid(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const categories = (window.SiteData && window.SiteData.categories) || [];
    
    let html = '';
    categories.forEach(cat => {
      const canvasId = `canvas-cat-${cat.id}`;
      html += `
        <a href="${pCat(cat.id)}" class="category-card fade-in">
          <canvas id="${canvasId}" width="800" height="500" style="display:none"></canvas>
          <img id="img-cat-${cat.id}" src="" alt="${cat.name} category" loading="lazy">
          <div class="category-overlay">
            <h3>${cat.name}</h3>
            <span class="count">${cat.count} Articles</span>
          </div>
        </a>
      `;
    });
    container.innerHTML = html;
    
    // Generate images after DOM insertion
    setTimeout(() => {
      categories.forEach(cat => {
        const dataUrl = generateImage(`canvas-cat-${cat.id}`, cat.id, cat.name.toUpperCase(), 800, 500);
        const img = document.getElementById(`img-cat-${cat.id}`);
        if (img && dataUrl) {
          img.src = dataUrl;
        }
      });
    }, 10);
  }

  function renderArticleGrid(containerId, articles, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const limit = options.limit || articles.length;
    const displayArticles = options.random 
      ? articles.sort(() => 0.5 - Math.random()).slice(0, limit)
      : articles.slice(0, limit);
    
    let html = '';
    displayArticles.forEach(article => {
      const canvasId = `canvas-article-${article.id}`;
      html += `
        <a href="${pArticle(article.id)}" class="article-card fade-in">
          <div class="article-card-image">
            <canvas id="${canvasId}" width="600" height="400" style="display:none"></canvas>
            <img id="img-article-${article.id}" src="" alt="${article.title}" loading="lazy">
            <span class="article-category-badge">${getCategoryName(article.category)}</span>
          </div>
          <div class="article-card-content">
            <span class="article-card-date">${formatDate(article.publishDate)}</span>
            <h3>${article.title}</h3>
            <p>${article.excerpt}</p>
            <span class="read-more">Read More →</span>
          </div>
        </a>
      `;
    });
    container.innerHTML = html;
    
    // Generate images
    setTimeout(() => {
      displayArticles.forEach(article => {
        const dataUrl = generateImage(`canvas-article-${article.id}`, article.category, getCategoryName(article.category), 600, 400);
        const img = document.getElementById(`img-article-${article.id}`);
        if (img && dataUrl) {
          img.src = dataUrl;
        }
      });
    }, 10);
  }

  function renderArticlePage(articleId) {
    if (!window.SiteData || !window.SiteData.articles) return;
    const article = window.SiteData.articles.find(a => a.id === articleId);
    const container = document.getElementById('article-container');
    if (!article || !container) return;
    
    const category = window.SiteData.getCategoryBySlug(article.category);
    
    const related = window.SiteData.articles.filter(a => 
      a.category === article.category && a.id !== article.id
    ).slice(0, 3);
    
    let html = `
      <article class="article-detail fade-in">
        <div class="article-wrapper">
          <div class="breadcrumb">
            <a href="${p('index.html')}">Home</a>
            <span>›</span>
            <a href="${pCat(article.category)}">${category ? category.name : ''}</a>
            <span>›</span>
            <span>${article.title}</span>
          </div>
          
          <header class="article-header">
            <div class="meta">
              <span class="article-category-badge" style="position: static; display: inline-block;">${category ? category.name : ''}</span>
              <span>${formatDate(article.publishDate)}</span>
              <span>${article.readTime}</span>
            </div>
            <h1>${article.title}</h1>
          </header>
          
          <canvas id="canvas-featured-${article.id}" width="1200" height="600" style="display:none"></canvas>
          <img id="img-featured-${article.id}" src="" alt="${article.title}" class="article-featured-image">
          
          <div class="article-body">
            ${article.content}
            
            ${article.products.map((product, idx) => `
              <div class="product-card">
                <canvas id="canvas-product-${article.id}-${idx}" width="200" height="200" style="display:none"></canvas>
                <img id="img-product-${article.id}-${idx}" src="" alt="${product.name}" class="product-card-image">
                <div class="product-card-info">
                  <span class="affiliate-badge">${product.badge}</span>
                  <h3>${product.name}</h3>
                  <span class="price">${product.price}</span>
                  <p>${product.description}</p>
                  <a href="${product.url}" class="buy-button" target="_blank" rel="sponsored nofollow">
                    Buy Now →
                  </a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </article>
    `;
    
    if (related.length > 0) {
      html += `
        <section class="related-section">
          <div class="container">
            <div class="section-header">
              <h2>Related Articles</h2>
              <div class="section-title-accent"></div>
            </div>
            <div class="related-grid">
              ${related.map(rel => `
                <a href="${pArticle(rel.id)}" class="article-card fade-in">
                  <div class="article-card-image">
                    <canvas id="canvas-related-${rel.id}" width="600" height="400" style="display:none"></canvas>
                    <img id="img-related-${rel.id}" src="" alt="${rel.title}" loading="lazy">
                    <span class="article-category-badge">${getCategoryName(rel.category)}</span>
                  </div>
                  <div class="article-card-content">
                    <span class="article-card-date">${formatDate(rel.publishDate)}</span>
                    <h3>${rel.title}</h3>
                    <p>${rel.excerpt}</p>
                    <span class="read-more">Read More →</span>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>
        </section>
      `;
    }
    
    container.innerHTML = html;
    
    // Generate all images
    setTimeout(() => {
      // Featured image
      const featuredUrl = generateImage(`canvas-featured-${article.id}`, article.category, getCategoryName(article.category), 1200, 600);
      const featuredImg = document.getElementById(`img-featured-${article.id}`);
      if (featuredImg && featuredUrl) featuredImg.src = featuredUrl;
      
      // Product images
      article.products.forEach((product, idx) => {
        const productUrl = generateProductImage(`canvas-product-${article.id}-${idx}`, article.category, product.name, 200, 200);
        const productImg = document.getElementById(`img-product-${article.id}-${idx}`);
        if (productImg && productUrl) productImg.src = productUrl;
      });
      
      // Related article images
      related.forEach(rel => {
        const relUrl = generateImage(`canvas-related-${rel.id}`, rel.category, getCategoryName(rel.category), 600, 400);
        const relImg = document.getElementById(`img-related-${rel.id}`);
        if (relImg && relUrl) relImg.src = relUrl;
      });
    }, 10);
  }

  // ============ Helper Functions ============
  function getCategoryName(slug) {
    if (!window.SiteData || !window.SiteData.getCategoryBySlug) return slug;
    const category = window.SiteData.getCategoryBySlug(slug);
    return category ? category.name : slug;
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  // ============ Initialize ============
  document.addEventListener('DOMContentLoaded', function() {
    renderHeader();
    renderFooter();
    initNavigation();
    initBackToTop();
    
    const pageType = document.body.dataset.page;
    const data = window.SiteData;
    
    if (!data || !data.categories || !data.articles) {
      console.error('Site data failed to load. Please check js/data.js for errors.');
      return;
    }
    
    if (pageType === 'home') {
      renderCategoryGrid('categoryGrid');
      renderArticleGrid('latestArticles', data.articles, { limit: 9 });
    } else if (pageType === 'category') {
      const categorySlug = document.body.dataset.category;
      const articles = data.getArticlesByCategory(categorySlug);
      renderArticleGrid('categoryArticles', articles);
      
      const category = data.getCategoryBySlug(categorySlug);
      if (category) {
        document.getElementById('categoryHero').innerHTML = `
          <h1>${category.name}</h1>
          <p>${category.description}</p>
          <span class="article-count">${category.count} Articles</span>
        `;
        document.title = `${category.name} | LifestyleHub`;
      }
    } else if (pageType === 'article') {
      const articleId = document.body.dataset.articleId;
      renderArticlePage(articleId);
      
      const article = data.articles.find(a => a.id === articleId);
      if (article) {
        document.title = `${article.title} | LifestyleHub`;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
          metaDesc.setAttribute('content', article.excerpt);
        }
      }
    }
  });

})();