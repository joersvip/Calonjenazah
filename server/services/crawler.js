const Parser = require('rss-parser');
const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../db');
const { scrapeNewsFromUrl } = require('./scraper');
const { classifyNewsCategory } = require('./classifier');

const rssParser = new Parser({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'contentEncoded'],
      ['category', 'category'],
      ['dc:subject', 'dcSubject']
    ]
  }
});

// One-time backfill for existing crawled articles without category
try {
  const uncatItems = db.prepare('SELECT id, title, summary, content, link, source_feed FROM crawled_articles WHERE category_id IS NULL OR category_name IS NULL').all();
  if (uncatItems.length > 0) {
    const updateStmt = db.prepare('UPDATE crawled_articles SET category_id = ?, category_name = ? WHERE id = ?');
    for (const item of uncatItems) {
      const detected = classifyNewsCategory({
        title: item.title,
        summary: item.summary,
        content: item.content,
        url: item.link,
        sourceFeed: item.source_feed
      });
      updateStmt.run(detected.category_id, detected.category_name, item.id);
    }
  }
} catch (e) {
  console.warn('Auto backfill crawled categories error:', e.message);
}

/**
 * Save an individual crawled item directly to the server's main news database (articles table).
 * Guarantees duplicate prevention and proper categorization.
 * 
 * @param {object} item - Crawled article item
 * @returns {object} { success: boolean, newlyInserted?: boolean, alreadyExists?: boolean, articleId?: number }
 */
function saveArticleToServer(item) {
  if (!item || !item.title || !item.link) {
    return { success: false, reason: 'Judul atau link tidak valid' };
  }

  // 1. Guard against duplicates: Check if already exists in published articles
  const existing = db.prepare(`
    SELECT id, title, slug, category_name FROM articles 
    WHERE (source_url IS NOT NULL AND source_url != '' AND source_url = ?)
       OR LOWER(TRIM(title)) = LOWER(TRIM(?))
    LIMIT 1
  `).get(item.link, item.title);

  if (existing) {
    try {
      db.prepare("UPDATE crawled_articles SET status = 'imported' WHERE link = ?").run(item.link);
    } catch (e) {}
    return { success: true, alreadyExists: true, articleId: existing.id };
  }

  // 2. Resolve official category row
  let targetCatId = item.category_id || 1;
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(targetCatId)) || {
    id: 1,
    name: item.category_name || 'Investigasi & Kriminal'
  };

  // 3. Generate URL slug
  const baseSlug = item.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 90);
  const slug = (baseSlug || 'berita') + '-' + Math.floor(1000 + Math.random() * 9000);

  // 4. Clean content formatting
  let cleanContent = item.content || item.summary || item.title;
  if (!cleanContent.includes('<p>')) {
    cleanContent = `<p>${cleanContent.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
  }

  const insertArticle = db.prepare(`
    INSERT INTO articles (
      title, slug, summary, content, category_id, category_name, tags,
      image_url, author, source_url, source_name, is_featured, is_breaking, views, reactions, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, '{"sedih":0,"terkejut":0,"berduka":0,"kritis":0,"kagum":0}', 'published')
  `);

  const result = insertArticle.run(
    item.title.trim(),
    slug,
    (item.summary || item.title).trim().substring(0, 300),
    cleanContent,
    category.id,
    category.name,
    'Siber, Sindikasi, Terkini',
    item.image_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80',
    item.source_feed || 'Redaksi Sindikasi',
    item.link,
    item.source_feed || 'Sindikasi Media'
  );

  try {
    db.prepare("UPDATE crawled_articles SET status = 'imported' WHERE link = ?").run(item.link);
  } catch (e) {}

  return {
    success: true,
    newlyInserted: true,
    articleId: result.lastInsertRowid,
    slug,
    category_name: category.name
  };
}

/**
 * Fetch and crawl news items from an RSS feed or URL, automatically saving directly to server database
 * @param {string} sourceUrl - RSS feed URL or website
 * @param {string} sourceName - Source display name
 * @param {object} options - Options { autoSaveToArticles: boolean }
 * @returns {Promise<object>} Crawl and save summary
 */
async function crawlFeed(sourceUrl, sourceName = 'RSS Feed', options = {}) {
  const autoSaveToArticles = options.autoSaveToArticles !== false; // Default true: save to server articles
  const crawledItems = [];

  try {
    // Attempt RSS parsing first
    const feed = await rssParser.parseURL(sourceUrl);
    const sourceTitle = sourceName || feed.title || 'Feed Berita';

    for (const item of feed.items) {
      // Determine image
      let imageUrl = '';
      if (item.enclosure && item.enclosure.url && item.enclosure.url.match(/\.(jpg|jpeg|png|webp)/i)) {
        imageUrl = item.enclosure.url;
      } else if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
        imageUrl = item.mediaContent.$.url;
      } else if (item.content || item.contentEncoded) {
        const $ = cheerio.load(item.contentEncoded || item.content || '');
        imageUrl = $('img').first().attr('src') || '';
      }

      const summary = item.contentSnippet || item.summary || item.title;
      const cleanSummary = summary ? summary.replace(/<[^>]*>/g, '').trim().substring(0, 280) : '';

      // Collect raw categories from RSS item
      let rawCategories = [];
      if (Array.isArray(item.categories)) {
        rawCategories = item.categories;
      } else if (item.category) {
        rawCategories = [item.category];
      } else if (item.dcSubject) {
        rawCategories = [item.dcSubject];
      }

      // Automatically classify category from news source, tags, URL and content
      const detected = classifyNewsCategory({
        title: item.title ? item.title.trim() : '',
        summary: cleanSummary,
        content: item.contentEncoded || item.content || cleanSummary,
        url: item.link ? item.link.trim() : '',
        sourceFeed: sourceTitle,
        rawCategories
      });

      crawledItems.push({
        source_feed: sourceTitle,
        title: item.title ? item.title.trim() : 'Berita Tanpa Judul',
        link: item.link ? item.link.trim() : '',
        summary: cleanSummary,
        content: item.contentEncoded || item.content || cleanSummary,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80',
        pub_date: item.pubDate || item.isoDate || new Date().toISOString(),
        category_id: detected.category_id,
        category_name: detected.category_name
      });
    }
  } catch (rssError) {
    // Fallback: If not standard RSS, try HTML news list crawling
    try {
      const response = await axios.get(sourceUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const origin = new URL(sourceUrl).origin;

      $('article, .article, .news-item, .media, .card').slice(0, 15).each((i, el) => {
        const linkEl = $(el).find('a[href]').first();
        let href = linkEl.attr('href');
        if (!href) return;
        if (href.startsWith('/')) href = origin + href;

        const title = $(el).find('h1, h2, h3, h4, .title').first().text().trim() || linkEl.text().trim();
        const snippet = $(el).find('p, .summary, .description').first().text().trim();
        let img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';
        if (img && img.startsWith('/')) img = origin + img;

        if (title && href && href.startsWith('http')) {
          const detected = classifyNewsCategory({
            title,
            summary: snippet,
            content: snippet,
            url: href,
            sourceFeed: sourceName || 'Web Scraper'
          });

          crawledItems.push({
            source_feed: sourceName || 'Web Scraper',
            title,
            link: href,
            summary: snippet.substring(0, 200),
            content: snippet,
            image_url: img || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80',
            pub_date: new Date().toISOString(),
            category_id: detected.category_id,
            category_name: detected.category_name
          });
        }
      });
    } catch (htmlErr) {
      throw new Error(`Gagal melakukan crawling: ${rssError.message}`);
    }
  }

  // 1. Save unique crawled articles to crawled_articles staging table
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO crawled_articles (
      source_feed, title, link, summary, content, image_url, pub_date, category_id, category_name, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateCatStmt = db.prepare(`
    UPDATE crawled_articles 
    SET category_id = ?, category_name = ? 
    WHERE link = ? AND (category_id IS NULL OR category_name IS NULL)
  `);

  let insertedCount = 0;
  let savedToArticlesCount = 0;
  let alreadyExistingCount = 0;

  for (const item of crawledItems) {
    if (item.title && item.link) {
      const res = insertStmt.run(
        item.source_feed,
        item.title,
        item.link,
        item.summary || '',
        item.content || '',
        item.image_url || '',
        item.pub_date || new Date().toISOString(),
        item.category_id,
        item.category_name,
        'pending'
      );
      if (res.changes > 0) {
        insertedCount++;
      } else {
        updateCatStmt.run(item.category_id, item.category_name, item.link);
      }

      // 2. Automatically save directly to server articles table (Manajemen Berita / Portal)
      if (autoSaveToArticles) {
        const saveRes = saveArticleToServer(item);
        if (saveRes.newlyInserted) {
          savedToArticlesCount++;
        } else if (saveRes.alreadyExists) {
          alreadyExistingCount++;
        }
      }
    }
  }

  // Run full bidirectional sync
  syncCrawledWithArticles();

  return {
    source: sourceName,
    totalFound: crawledItems.length,
    newItemsAdded: insertedCount,
    savedToArticles: savedToArticlesCount,
    alreadyExisting: alreadyExistingCount,
    items: crawledItems
  };
}

/**
 * Bulk save all pending items in crawled_articles directly to the server articles table
 * @param {number} limit - Maximum items to process in one batch
 * @returns {object} Summary of bulk save operation
 */
function saveAllPendingCrawledArticles(limit = 1000) {
  const pending = db.prepare(`
    SELECT * FROM crawled_articles 
    WHERE status != 'imported'
    ORDER BY id DESC 
    LIMIT ?
  `).all(limit);

  let savedCount = 0;
  let alreadyCount = 0;

  for (const item of pending) {
    const res = saveArticleToServer(item);
    if (res.newlyInserted) {
      savedCount++;
    } else if (res.alreadyExists) {
      alreadyCount++;
    }
  }

  syncCrawledWithArticles();

  return {
    totalProcessed: pending.length,
    savedCount,
    alreadyCount
  };
}

/**
 * Synchronize crawled articles with published articles in Manajemen Berita.
 * 1. Marks crawled articles as 'imported' if their link or title matches an article in articles table.
 * 2. If an article was deleted from articles table, resets matching crawled item to 'pending' so it can be re-crawled/imported.
 */
function syncCrawledWithArticles() {
  try {
    // 1. Mark crawled as 'imported' if exists in articles
    const syncToImported = db.prepare(`
      UPDATE crawled_articles 
      SET status = 'imported' 
      WHERE status != 'imported'
        AND (
          link IN (SELECT source_url FROM articles WHERE source_url IS NOT NULL AND source_url != '')
          OR LOWER(TRIM(title)) IN (SELECT LOWER(TRIM(title)) FROM articles)
        )
    `).run();

    // 2. If a crawled article was marked 'imported' but the article was deleted from articles table, reset to 'pending'
    const syncToPending = db.prepare(`
      UPDATE crawled_articles
      SET status = 'pending'
      WHERE status = 'imported'
        AND link NOT IN (SELECT source_url FROM articles WHERE source_url IS NOT NULL AND source_url != '')
        AND LOWER(TRIM(title)) NOT IN (SELECT LOWER(TRIM(title)) FROM articles)
    `).run();

    const counts = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'imported' THEN 1 ELSE 0 END) as importedCount,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingCount,
        COUNT(*) as totalCount
      FROM crawled_articles
    `).get();

    return {
      syncedToImported: syncToImported.changes,
      resetToPending: syncToPending.changes,
      totalImported: counts.importedCount || 0,
      totalPending: counts.pendingCount || 0,
      totalCount: counts.totalCount || 0
    };
  } catch (err) {
    console.error('Error in syncCrawledWithArticles:', err);
    return { syncedToImported: 0, resetToPending: 0 };
  }
}

/**
 * Import a crawled article directly into the main articles table.
 * If categoryId is 'auto', undefined, or <= 0, the auto-detected category from source will be used.
 * Guarantees NO duplicate articles are created in Manajemen Berita.
 * 
 * @param {number} crawledId - ID of crawled_articles
 * @param {number|string} categoryId - Category ID to assign, or 'auto'
 * @param {boolean} deepScrape - Whether to fetch full article text from target website
 */
async function importCrawledArticle(crawledId, categoryId = 'auto', deepScrape = true) {
  const crawled = db.prepare('SELECT * FROM crawled_articles WHERE id = ?').get(crawledId);
  if (!crawled) throw new Error('Artikel crawled tidak ditemukan.');

  // Guard against duplicate upload: Check if already exists in published articles
  const existingArticle = db.prepare(`
    SELECT id, title, slug, category_name FROM articles 
    WHERE (source_url IS NOT NULL AND source_url != '' AND source_url = ?)
       OR LOWER(TRIM(title)) = LOWER(TRIM(?))
    LIMIT 1
  `).get(crawled.link, crawled.title);

  if (existingArticle) {
    // Synchronize crawled status to imported immediately
    db.prepare("UPDATE crawled_articles SET status = 'imported' WHERE id = ?").run(crawledId);
    return {
      success: true,
      alreadyExists: true,
      duplicatePrevented: true,
      articleId: existingArticle.id,
      slug: existingArticle.slug,
      title: existingArticle.title,
      category_name: existingArticle.category_name,
      message: `Berita "${existingArticle.title}" sudah terbit di Manajemen Berita. Duplikasi berhasil dicegah.`
    };
  }

  let targetCatId = categoryId;
  let targetCatName = crawled.category_name || '';

  // If auto or unspecified, use the source-detected category
  if (targetCatId === 'auto' || !targetCatId || targetCatId === '' || Number(targetCatId) <= 0) {
    targetCatId = crawled.category_id || 1;
  }

  let title = crawled.title;
  let content = crawled.content || `<p>${crawled.summary}</p>`;
  let imageUrl = crawled.image_url;
  let author = 'Redaksi Sindikasi';
  let sourceName = crawled.source_feed;
  let sourceUrl = crawled.link;

  if (deepScrape && crawled.link) {
    try {
      const fullArticle = await scrapeNewsFromUrl(crawled.link);
      if (fullArticle.title) title = fullArticle.title;
      if (fullArticle.content) content = fullArticle.content;
      if (fullArticle.image_url) imageUrl = fullArticle.image_url;
      if (fullArticle.author) author = fullArticle.author;
      if (fullArticle.source_name) sourceName = fullArticle.source_name;

      // Re-check duplicate with deep scraped title if changed
      const secondCheck = db.prepare(`
        SELECT id, title, slug, category_name FROM articles 
        WHERE (source_url IS NOT NULL AND source_url != '' AND source_url = ?)
           OR LOWER(TRIM(title)) = LOWER(TRIM(?))
        LIMIT 1
      `).get(crawled.link, title);

      if (secondCheck) {
        db.prepare("UPDATE crawled_articles SET status = 'imported' WHERE id = ?").run(crawledId);
        return {
          success: true,
          alreadyExists: true,
          duplicatePrevented: true,
          articleId: secondCheck.id,
          slug: secondCheck.slug,
          title: secondCheck.title,
          category_name: secondCheck.category_name,
          message: `Berita "${secondCheck.title}" sudah terbit di Manajemen Berita. Duplikasi berhasil dicegah.`
        };
      }

      // If auto-category was chosen, refine with full article content
      if (categoryId === 'auto' || !categoryId || targetCatId === 'auto' || Number(categoryId) <= 0) {
        if (fullArticle.category_id) {
          targetCatId = fullArticle.category_id;
          targetCatName = fullArticle.category_name;
        }
      }
    } catch (e) {
      console.warn(`Deep scrape failed for ${crawled.link}, using RSS summary content instead.`);
    }
  }

  // Lookup official category row
  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(Number(targetCatId)) || {
    id: 1,
    name: targetCatName || 'Investigasi & Kriminal'
  };

  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 90) + '-' + Math.floor(1000 + Math.random() * 9000);

  const insertArticle = db.prepare(`
    INSERT INTO articles (
      title, slug, summary, content, category_id, category_name, tags,
      image_url, author, source_url, source_name, is_featured, is_breaking, views, reactions, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, '{"sedih":0,"terkejut":0,"berduka":0,"kritis":0,"kagum":0}', 'published')
  `);

  const result = insertArticle.run(
    title,
    slug,
    crawled.summary || title,
    content,
    category.id,
    category.name,
    'Siber, Sindikasi, Terkini',
    imageUrl,
    author,
    sourceUrl,
    sourceName
  );

  // Mark crawled article as imported
  db.prepare("UPDATE crawled_articles SET status = 'imported' WHERE id = ?").run(crawledId);

  return {
    success: true,
    articleId: result.lastInsertRowid,
    slug,
    category_id: category.id,
    category_name: category.name
  };
}

module.exports = {
  crawlFeed,
  importCrawledArticle,
  saveArticleToServer,
  saveAllPendingCrawledArticles,
  syncCrawledWithArticles
};

