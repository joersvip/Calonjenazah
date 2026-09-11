const db = require('../db');

/**
 * Extract clean keywords from news text for SEO tags
 * @param {string} text - Title or article content
 * @returns {string[]} Array of keywords
 */
function extractKeywords(text) {
  if (!text) return [];
  // Indonesian stop words to ignore
  const stopWords = new Set([
    'yang', 'untuk', 'pada', 'ke', 'para', 'namun', 'menurut', 'antara', 'dia', 'dua',
    'ia', 'seperti', 'jika', 'sehingga', 'kembali', 'dan', 'ini', 'karena', 'kepada',
    'oleh', 'saat', 'harus', 'sementara', 'setelah', 'belum', 'kami', 'sekitar', 'bisa',
    'dari', 'telah', 'ada', 'mereka', 'sudah', 'saya', 'akan', 'atau', 'dalam', 'tentang',
    'dapat', 'oleh', 'juga', 'lebih', 'dengan', 'satu', 'bukan', 'bagi', 'sampai', 'pula'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w) && !/^\d+$/.test(w));

  const counts = {};
  for (const w of words) {
    counts[w] = (counts[w] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(entry => entry[0]);
}

/**
 * Generate dynamic XML Sitemap compliant with sitemaps.org & Google News
 * @param {string} baseUrl - Current host base URL
 * @returns {string} XML string
 */
function generateSitemapXml(baseUrl = 'http://localhost:5000') {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const now = new Date().toISOString();

  const articles = db.prepare(`
    SELECT slug, title, image_url, updated_at, created_at, category_name 
    FROM articles 
    WHERE status = 'published' 
    ORDER BY created_at DESC
  `).all();

  const categories = db.prepare('SELECT slug FROM categories').all();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">\n`;

  // 1. Homepage
  xml += `  <url>\n`;
  xml += `    <loc>${cleanBase}/</loc>\n`;
  xml += `    <lastmod>${now}</lastmod>\n`;
  xml += `    <changefreq>hourly</changefreq>\n`;
  xml += `    <priority>1.0</priority>\n`;
  xml += `  </url>\n`;

  // 2. Category Rubrics
  for (const cat of categories) {
    xml += `  <url>\n`;
    xml += `    <loc>${cleanBase}/#/kategori/${cat.slug}</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>hourly</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;
  }

  // 3. Published Articles
  for (const art of articles) {
    const lastmod = (art.updated_at || art.created_at || now).replace(' ', 'T') + 'Z';
    xml += `  <url>\n`;
    xml += `    <loc>${cleanBase}/#/berita/${art.slug}</loc>\n`;
    xml += `    <lastmod>${lastmod}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;

    if (art.image_url) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(art.image_url)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(art.title)}</image:title>\n`;
      xml += `    </image:image>\n`;
    }

    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * Generate robots.txt
 * @param {string} baseUrl 
 * @returns {string}
 */
function generateRobotsTxt(baseUrl = 'http://localhost:5000') {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return [
    '# Robots.txt for CALON JENAZAH Portal Berita',
    'User-agent: *',
    'Allow: /',
    'Disallow: /#/admin',
    'Disallow: /admin',
    'Disallow: /api/',
    '',
    `Sitemap: ${cleanBase}/sitemap.xml`,
    `Sitemap: ${cleanBase}/rss.xml`
  ].join('\n');
}

/**
 * Generate RSS 2.0 XML Feed for Google News & Aggregators
 * @param {string} baseUrl 
 * @returns {string}
 */
function generateRssFeed(baseUrl = 'http://localhost:5000') {
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const now = new Date().toUTCString();

  const articles = db.prepare(`
    SELECT id, title, slug, summary, category_name, author, image_url, created_at
    FROM articles 
    WHERE status = 'published' 
    ORDER BY created_at DESC 
    LIMIT 50
  `).all();

  let rss = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  rss += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">\n`;
  rss += `  <channel>\n`;
  rss += `    <title>CALON JENAZAH - Portal Berita Kritis &amp; Refleksi Kehidupan</title>\n`;
  rss += `    <link>${cleanBase}/</link>\n`;
  rss += `    <description>Jurnalisme investigasi, fakta kriminal tersembunyi, sains ajal, dan opini independen.</description>\n`;
  rss += `    <language>id-ID</language>\n`;
  rss += `    <lastBuildDate>${now}</lastBuildDate>\n`;
  rss += `    <atom:link href="${cleanBase}/rss.xml" rel="self" type="application/rss+xml"/>\n`;

  for (const art of articles) {
    const pubDate = new Date(art.created_at).toUTCString();
    rss += `    <item>\n`;
    rss += `      <title>${escapeXml(art.title)}</title>\n`;
    rss += `      <link>${cleanBase}/#/berita/${art.slug}</link>\n`;
    rss += `      <guid isPermaLink="true">${cleanBase}/#/berita/${art.slug}</guid>\n`;
    rss += `      <category>${escapeXml(art.category_name || 'Umum')}</category>\n`;
    rss += `      <author>${escapeXml(art.author || 'Redaksi Calon Jenazah')}</author>\n`;
    rss += `      <pubDate>${pubDate}</pubDate>\n`;
    rss += `      <description>${escapeXml(art.summary || art.title)}</description>\n`;
    if (art.image_url) {
      rss += `      <media:content url="${escapeXml(art.image_url)}" medium="image"/>\n`;
    }
    rss += `    </item>\n`;
  }

  rss += `  </channel>\n`;
  rss += `</rss>`;
  return rss;
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Automated Periodic SEO Audit and Auto-Optimization Engine
 * Scans articles, fixes missing meta tags/keywords, calculates health score
 * @returns {object} Audit & Optimization Report
 */
function auditAndOptimizeSeo() {
  const articles = db.prepare("SELECT * FROM articles WHERE status = 'published'").all();
  const updateArticleStmt = db.prepare('UPDATE articles SET tags = ?, summary = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');

  let optimizedCount = 0;
  let missingTagsCount = 0;
  let missingSummaryCount = 0;
  let shortContentCount = 0;
  let missingImageCount = 0;

  for (const art of articles) {
    let needsUpdate = false;
    let newTags = art.tags || '';
    let newSummary = art.summary || '';

    // 1. Check and auto-generate meta keywords/tags if empty
    if (!newTags.trim()) {
      missingTagsCount++;
      const extracted = extractKeywords(`${art.title} ${art.content || ''}`);
      if (extracted.length > 0) {
        newTags = extracted.join(', ');
        needsUpdate = true;
      }
    }

    // 2. Check and optimize meta summary if missing or too short (< 20 chars)
    if (!newSummary.trim() || newSummary.length < 20) {
      missingSummaryCount++;
      const cleanContent = (art.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (cleanContent.length > 0) {
        newSummary = cleanContent.substring(0, 160).trim() + '...';
        needsUpdate = true;
      }
    }

    // Quality checks
    if (!art.image_url) missingImageCount++;
    const wordCount = (art.content || '').split(/\s+/).length;
    if (wordCount < 100) shortContentCount++;

    if (needsUpdate) {
      updateArticleStmt.run(newTags, newSummary, art.id);
      optimizedCount++;
    }
  }

  // Compute SEO Health Score (0 - 100)
  const total = articles.length || 1;
  const tagPenalty = Math.min(25, (missingTagsCount / total) * 25);
  const summaryPenalty = Math.min(25, (missingSummaryCount / total) * 25);
  const imagePenalty = Math.min(20, (missingImageCount / total) * 20);
  const contentPenalty = Math.min(15, (shortContentCount / total) * 15);

  const rawScore = 100 - (tagPenalty + summaryPenalty + imagePenalty + contentPenalty);
  const score = Math.max(50, Math.min(100, Math.round(rawScore)));

  const nowIso = new Date().toISOString();
  const report = {
    score,
    totalArticles: articles.length,
    optimizedCount,
    metrics: {
      tagsCompleteness: Math.round(((total - missingTagsCount) / total) * 100),
      summaryCompleteness: Math.round(((total - missingSummaryCount) / total) * 100),
      imageCompleteness: Math.round(((total - missingImageCount) / total) * 100),
      contentDepthScore: Math.round(((total - shortContentCount) / total) * 100)
    },
    issues: [
      missingTagsCount > 0 ? `${missingTagsCount} artikel kata kunci dioptimasi otomatis` : null,
      missingSummaryCount > 0 ? `${missingSummaryCount} meta deskripsi diperbarui` : null,
      missingImageCount > 0 ? `${missingImageCount} artikel belum memiliki gambar sampul` : null,
      shortContentCount > 0 ? `${shortContentCount} artikel konten di bawah 100 kata` : null
    ].filter(Boolean),
    timestamp: nowIso
  };

  // Save in settings table
  const saveSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  saveSetting.run('seo_health_score', String(score));
  saveSetting.run('seo_last_run', nowIso);
  saveSetting.run('seo_last_report', JSON.stringify(report));

  return report;
}

/**
 * Get current SEO status from settings
 * @returns {object}
 */
function getSeoStatus() {
  const scoreRow = db.prepare("SELECT value FROM settings WHERE key = 'seo_health_score'").get();
  const lastRunRow = db.prepare("SELECT value FROM settings WHERE key = 'seo_last_run'").get();
  const reportRow = db.prepare("SELECT value FROM settings WHERE key = 'seo_last_report'").get();
  const enabledRow = db.prepare("SELECT value FROM settings WHERE key = 'seo_auto_enabled'").get();
  const intervalRow = db.prepare("SELECT value FROM settings WHERE key = 'seo_interval_hours'").get();

  let report = null;
  if (reportRow && reportRow.value) {
    try {
      report = JSON.parse(reportRow.value);
    } catch (e) {}
  }

  // Count articles
  const articleStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN tags IS NOT NULL AND length(tags) > 0 THEN 1 ELSE 0 END) as with_tags,
      SUM(CASE WHEN summary IS NOT NULL AND length(summary) > 20 THEN 1 ELSE 0 END) as with_summary,
      SUM(CASE WHEN image_url IS NOT NULL AND length(image_url) > 0 THEN 1 ELSE 0 END) as with_image
    FROM articles WHERE status = 'published'
  `).get();

  return {
    score: scoreRow ? Number(scoreRow.value) : (report?.score || 92),
    lastRun: lastRunRow ? lastRunRow.value : null,
    autoEnabled: enabledRow ? enabledRow.value === 'true' : true,
    intervalHours: intervalRow ? Number(intervalRow.value) : 6,
    report: report || {
      metrics: {
        tagsCompleteness: 100,
        summaryCompleteness: 100,
        imageCompleteness: 100,
        contentDepthScore: 95
      }
    },
    articleStats
  };
}

module.exports = {
  generateSitemapXml,
  generateRobotsTxt,
  generateRssFeed,
  auditAndOptimizeSeo,
  getSeoStatus
};
