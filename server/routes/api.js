const express = require('express');
const router = express.Router();
const db = require('../db');
const { scrapeNewsFromUrl } = require('../services/scraper');
const { crawlFeed, importCrawledArticle } = require('../services/crawler');
const { extractClientIp, resolveGeo, parseUserAgent, logVisit, getVisitorAnalytics, activeVisitors } = require('../services/tracker');
const { getSeoStatus, auditAndOptimizeSeo } = require('../services/seo');
const { getAutoCrawlConfig, saveAutoCrawlConfig, runAutoCrawlJob } = require('../services/scheduler');
const { getChatHistory, getOnlineAdminsList } = require('../services/adminChat');

// ==========================================
// 1. PUBLIC ARTICLES & CONTENT ROUTES
// ==========================================

// Get articles list with filtering and search
router.get('/articles', (req, res) => {
  try {
    const { category, search, page = 1, limit = 10, featured } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = "WHERE status = 'published'";
    const params = [];

    if (category) {
      whereClause += " AND (category_id = ? OR category_name = ?)";
      params.push(category, category);
    }

    if (search) {
      whereClause += " AND (title LIKE ? OR summary LIKE ? OR content LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (featured !== undefined) {
      whereClause += " AND is_featured = ?";
      params.push(featured === 'true' ? 1 : 0);
    }

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM articles ${whereClause}`);
    const total = countStmt.get(...params).total;

    const queryStmt = db.prepare(`
      SELECT id, title, slug, summary, category_id, category_name, tags, 
             image_url, author, source_url, source_name, is_featured, is_breaking, 
             views, reactions, created_at 
      FROM articles 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `);

    const articles = queryStmt.all(...params, Number(limit), offset);

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      articles
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get breaking news ticker
router.get('/articles/breaking', (req, res) => {
  try {
    const articles = db.prepare(`
      SELECT id, title, slug, created_at, category_name 
      FROM articles 
      WHERE is_breaking = 1 AND status = 'published' 
      ORDER BY created_at DESC 
      LIMIT 6
    `).all();

    res.json({ success: true, articles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get trending articles (highest views)
router.get('/articles/trending', (req, res) => {
  try {
    const articles = db.prepare(`
      SELECT id, title, slug, image_url, category_name, views, created_at, author 
      FROM articles 
      WHERE status = 'published' 
      ORDER BY views DESC 
      LIMIT 5
    `).all();

    res.json({ success: true, articles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single article by slug
router.get('/articles/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const article = db.prepare('SELECT * FROM articles WHERE slug = ?').get(slug);

    if (!article) {
      return res.status(404).json({ success: false, error: 'Artikel tidak ditemukan' });
    }

    // Increment view count
    db.prepare('UPDATE articles SET views = views + 1 WHERE id = ?').run(article.id);
    article.views += 1;

    // Parse reactions JSON
    try {
      article.reactions = JSON.parse(article.reactions || '{}');
    } catch (e) {
      article.reactions = { sedih: 0, terkejut: 0, berduka: 0, kritis: 0, kagum: 0 };
    }

    // Get approved comments
    const comments = db.prepare(`
      SELECT id, author_name, comment, created_at 
      FROM comments 
      WHERE article_id = ? AND status = 'approved' 
      ORDER BY created_at DESC
    `).all(article.id);

    // Get related articles in same category
    const related = db.prepare(`
      SELECT id, title, slug, image_url, category_name, created_at 
      FROM articles 
      WHERE category_id = ? AND id != ? AND status = 'published' 
      ORDER BY created_at DESC 
      LIMIT 4
    `).all(article.category_id, article.id);

    res.json({
      success: true,
      article,
      comments,
      related
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add reaction to an article
router.post('/articles/:id/reactions', (req, res) => {
  try {
    const { id } = req.params;
    const { reactionType } = req.body; // 'sedih', 'terkejut', 'berduka', 'kritis', 'kagum'

    const article = db.prepare('SELECT reactions FROM articles WHERE id = ?').get(id);
    if (!article) {
      return res.status(404).json({ success: false, error: 'Artikel tidak ditemukan' });
    }

    let reactions = {};
    try {
      reactions = JSON.parse(article.reactions || '{}');
    } catch (e) {}

    reactions[reactionType] = (reactions[reactionType] || 0) + 1;

    db.prepare('UPDATE articles SET reactions = ? WHERE id = ?').run(JSON.stringify(reactions), id);

    res.json({ success: true, reactions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Post comment to an article
router.post('/articles/:id/comments', (req, res) => {
  try {
    const { id } = req.params;
    const { author_name, comment } = req.body;

    if (!author_name || !comment) {
      return res.status(400).json({ success: false, error: 'Nama dan komentar wajib diisi' });
    }

    const insertComment = db.prepare(`
      INSERT INTO comments (article_id, author_name, comment, status) 
      VALUES (?, ?, ?, 'approved')
    `);

    const result = insertComment.run(id, author_name.trim(), comment.trim());

    res.json({
      success: true,
      comment: {
        id: result.lastInsertRowid,
        author_name,
        comment,
        created_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY id ASC').all();
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 2. VISITOR TELEMETRY & TRACKER BEACON
// ==========================================

router.post('/analytics/track', (req, res) => {
  try {
    const clientIp = extractClientIp(req);
    const userAgent = req.headers['user-agent'] || '';
    const { pageUrl, pageTitle, articleId, referrer, sessionId, screenResolution, durationSeconds } = req.body;

    const logRecord = logVisit({
      ip: clientIp,
      userAgent,
      pageUrl,
      pageTitle,
      articleId,
      referrer,
      sessionId,
      screenResolution,
      durationSeconds
    });

    res.json({ success: true, data: logRecord });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 3. ADMIN AUTHENTICATION & MANAGEMENT
// ==========================================

router.post('/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username dan password wajib diisi' });
    }

    // 1. Check in admins table
    const admin = db.prepare("SELECT * FROM admins WHERE username = ? AND is_active = 1").get(username);
    if (admin && admin.password === password) {
      db.prepare("UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(admin.id);
      return res.json({
        success: true,
        token: 'auth_token_' + Buffer.from(`${admin.username}:${admin.id}:${Date.now()}`).toString('base64'),
        user: {
          id: admin.id,
          username: admin.username,
          display_name: admin.display_name,
          role: admin.role,
          email: admin.email,
          avatar_url: admin.avatar_url
        }
      });
    }

    // 2. Fallback to settings
    const savedUser = db.prepare("SELECT value FROM settings WHERE key = 'admin_username'").get();
    const savedPass = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get();
    const expectedUser = savedUser ? savedUser.value : 'admin';
    const expectedPass = savedPass ? savedPass.value : 'admin123';

    if (username === expectedUser && password === expectedPass) {
      return res.json({
        success: true,
        token: 'auth_token_' + Buffer.from(`${username}:1:${Date.now()}`).toString('base64'),
        user: {
          id: 1,
          username: 'admin',
          display_name: 'Dewan Redaksi Utama',
          role: 'Super Admin',
          email: 'redaksi@calonjenazah.com'
        }
      });
    }

    res.status(401).json({ success: false, error: 'Username atau password salah' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all admin users
router.get('/admin/users', (req, res) => {
  try {
    const admins = db.prepare(`
      SELECT id, username, display_name, role, email, avatar_url, is_active, last_login, created_at
      FROM admins
      ORDER BY id ASC
    `).all();

    res.json({ success: true, admins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new admin user
router.post('/admin/users', (req, res) => {
  try {
    const { username, password, display_name, role = 'Editor', email, avatar_url } = req.body;
    if (!username || !password || !display_name) {
      return res.status(400).json({ success: false, error: 'Username, password, dan nama lengkap wajib diisi' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    const existing = db.prepare("SELECT id FROM admins WHERE username = ?").get(cleanUsername);
    if (existing) {
      return res.status(400).json({ success: false, error: `Username "${cleanUsername}" sudah digunakan oleh admin lain` });
    }

    const insert = db.prepare(`
      INSERT INTO admins (username, password, display_name, role, email, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      cleanUsername,
      password.trim(),
      display_name.trim(),
      role || 'Editor',
      email || '',
      avatar_url || ''
    );

    res.json({
      success: true,
      message: `Akun admin "${display_name}" berhasil dibuat`,
      id: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update admin user
router.put('/admin/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, role, email, avatar_url, is_active, password } = req.body;

    const existing = db.prepare("SELECT * FROM admins WHERE id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Akun admin tidak ditemukan' });
    }

    let query = `
      UPDATE admins SET 
        display_name = ?, role = ?, email = ?, avatar_url = ?, is_active = ?
    `;
    const params = [
      display_name || existing.display_name,
      role || existing.role,
      email !== undefined ? email : existing.email,
      avatar_url !== undefined ? avatar_url : existing.avatar_url,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active
    ];

    if (password && password.trim()) {
      query += `, password = ?`;
      params.push(password.trim());
    }

    query += ` WHERE id = ?`;
    params.push(id);

    db.prepare(query).run(...params);
    res.json({ success: true, message: 'Data akun admin berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete admin user
router.delete('/admin/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const target = db.prepare("SELECT * FROM admins WHERE id = ?").get(id);
    if (!target) {
      return res.status(404).json({ success: false, error: 'Akun admin tidak ditemukan' });
    }

    // Safety check: Prevent deleting the last Super Admin
    if (target.role === 'Super Admin') {
      const superAdminCount = db.prepare("SELECT COUNT(*) as count FROM admins WHERE role = 'Super Admin'").get().count;
      if (superAdminCount <= 1) {
        return res.status(400).json({ success: false, error: 'Tidak dapat menghapus satu-satunya Super Admin dalam sistem' });
      }
    }

    db.prepare("DELETE FROM admins WHERE id = ?").run(id);
    res.json({ success: true, message: `Akun admin "${target.display_name}" berhasil dihapus` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ADMIN CHAT ENDPOINTS (REALTIME & HISTORY)
// ==========================================

// Get recent chat messages history
router.get('/admin/chat/messages', (req, res) => {
  try {
    const { limit = 80 } = req.query;
    const messages = getChatHistory(Number(limit));
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get online admins list
router.get('/admin/chat/online', (req, res) => {
  try {
    const online = getOnlineAdminsList();
    res.json({ success: true, online });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete single chat message
router.delete('/admin/chat/messages/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM admin_messages WHERE id = ?").run(id);
    res.json({ success: true, message: 'Pesan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 4. ADMIN ARTICLE MANAGEMENT (CRUD)
// ==========================================

router.get('/admin/articles', (req, res) => {
  try {
    const articles = db.prepare(`
      SELECT id, title, slug, summary, category_name, category_id, 
             image_url, author, is_featured, is_breaking, views, status, 
             source_name, source_url, created_at 
      FROM articles 
      ORDER BY created_at DESC
    `).all();

    res.json({ success: true, articles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/admin/articles', (req, res) => {
  try {
    const {
      title, summary, content, category_id, tags, image_url,
      author, is_featured, is_breaking, status, source_name, source_url
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Judul dan konten wajib diisi' });
    }

    const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(category_id || 1);
    const category_name = cat ? cat.name : 'Umum';

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 90) + '-' + Math.floor(1000 + Math.random() * 9000);

    const insert = db.prepare(`
      INSERT INTO articles (
        title, slug, summary, content, category_id, category_name, tags,
        image_url, author, source_url, source_name, is_featured, is_breaking, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      title,
      slug,
      summary || title,
      content,
      category_id || 1,
      category_name,
      tags || '',
      image_url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1000&q=80',
      author || 'Redaksi Calon Jenazah',
      source_url || '',
      source_name || '',
      is_featured ? 1 : 0,
      is_breaking ? 1 : 0,
      status || 'published'
    );

    res.json({ success: true, id: result.lastInsertRowid, slug });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/admin/articles/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, summary, content, category_id, tags, image_url,
      author, is_featured, is_breaking, status, source_name, source_url
    } = req.body;

    const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(category_id || 1);
    const category_name = cat ? cat.name : 'Umum';

    db.prepare(`
      UPDATE articles SET
        title = ?, summary = ?, content = ?, category_id = ?, category_name = ?,
        tags = ?, image_url = ?, author = ?, source_url = ?, source_name = ?,
        is_featured = ?, is_breaking = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title,
      summary,
      content,
      category_id,
      category_name,
      tags,
      image_url,
      author,
      source_url,
      source_name,
      is_featured ? 1 : 0,
      is_breaking ? 1 : 0,
      status,
      id
    );

    res.json({ success: true, message: 'Artikel berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/admin/articles/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM articles WHERE id = ?').run(id);
    db.prepare('DELETE FROM comments WHERE article_id = ?').run(id);
    res.json({ success: true, message: 'Artikel berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Batch delete multiple articles
router.post('/admin/articles/batch-delete', (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Daftar ID artikel tidak boleh kosong' });
    }
    const delArt = db.prepare('DELETE FROM articles WHERE id = ?');
    const delCom = db.prepare('DELETE FROM comments WHERE article_id = ?');
    for (const id of ids) {
      delArt.run(id);
      delCom.run(id);
    }
    res.json({ success: true, count: ids.length, message: `${ids.length} artikel berhasil dihapus` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Batch update category for multiple articles
router.put('/admin/articles/batch-category', (req, res) => {
  try {
    const { ids, category_id } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || !category_id) {
      return res.status(400).json({ success: false, error: 'Daftar ID dan kategori wajib diisi' });
    }
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(category_id);
    if (!cat) return res.status(400).json({ success: false, error: 'Kategori tidak valid' });

    const updateStmt = db.prepare('UPDATE articles SET category_id = ?, category_name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    for (const id of ids) {
      updateStmt.run(cat.id, cat.name, id);
    }

    res.json({
      success: true,
      count: ids.length,
      message: `${ids.length} berita berhasil dipindahkan ke kategori ${cat.name}`,
      category_id: cat.id,
      category_name: cat.name
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 5. FITUR RE-UPLOAD BERITA VIA LINK
// ==========================================

// Endpoint scrape URL berita luar
router.post('/reupload/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'Masukkan URL berita yang ingin diambil' });
    }

    const scrapedData = await scrapeNewsFromUrl(url);
    res.json({ success: true, article: scrapedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Gagal mengekstrak berita dari link tersebut' });
  }
});

// ==========================================
// 6. FITUR WEB CRAWLER & RSS HARVESTER
// ==========================================

// List crawler sources
router.get('/crawler/sources', (req, res) => {
  try {
    const sources = db.prepare('SELECT * FROM crawler_sources ORDER BY id ASC').all();
    res.json({ success: true, sources });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add new crawler source
router.post('/crawler/sources', (req, res) => {
  try {
    const { name, url, type = 'rss' } = req.body;
    if (!name || !url) {
      return res.status(400).json({ success: false, error: 'Nama sumber dan URL wajib diisi' });
    }

    const result = db.prepare('INSERT INTO crawler_sources (name, url, type) VALUES (?, ?, ?)')
      .run(name, url, type);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete crawler source
router.delete('/crawler/sources/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM crawler_sources WHERE id = ?').run(id);
    res.json({ success: true, message: 'Sumber crawler dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run crawl on a source URL
router.post('/crawler/fetch', async (req, res) => {
  try {
    const { url, name } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL sumber wajib diisi' });
    }

    const result = await crawlFeed(url, name);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get crawled articles
router.get('/crawler/articles', (req, res) => {
  try {
    const { status = 'all' } = req.query;
    let query = 'SELECT * FROM crawled_articles';
    const params = [];

    if (status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT 100';

    const articles = db.prepare(query).all(...params);
    res.json({ success: true, articles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import crawled article(s) into news database
router.post('/crawler/import', async (req, res) => {
  try {
    const { ids, category_id = 'auto', deepScrape = true } = req.body; // array of IDs or single ID
    const targetIds = Array.isArray(ids) ? ids : [ids];

    const results = [];
    for (const id of targetIds) {
      try {
        const imported = await importCrawledArticle(id, category_id, deepScrape);
        results.push({ id, status: 'success', ...imported });
      } catch (err) {
        results.push({ id, status: 'failed', error: err.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update category of a specific crawled article
router.put('/crawler/articles/:id/category', (req, res) => {
  try {
    const { id } = req.params;
    const { category_id } = req.body;
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(category_id);
    if (!cat) return res.status(400).json({ success: false, error: 'Kategori tidak valid' });

    db.prepare('UPDATE crawled_articles SET category_id = ?, category_name = ? WHERE id = ?')
      .run(cat.id, cat.name, id);

    res.json({ success: true, message: 'Kategori berhasil diperbarui', category_id: cat.id, category_name: cat.name });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Batch update category for multiple crawled articles
router.put('/crawler/articles/batch-category', (req, res) => {
  try {
    const { ids, category_id } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Daftar ID artikel tidak boleh kosong' });
    }
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(category_id);
    if (!cat) return res.status(400).json({ success: false, error: 'Kategori tidak valid' });

    const updateStmt = db.prepare('UPDATE crawled_articles SET category_id = ?, category_name = ? WHERE id = ?');
    for (const id of ids) {
      updateStmt.run(cat.id, cat.name, id);
    }

    res.json({
      success: true,
      message: `Kategori ${ids.length} artikel berhasil disinkronkan ke ${cat.name}`,
      category_id: cat.id,
      category_name: cat.name
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// AUTO CRAWL SCHEDULER ROUTES
// ==========================================

// Get auto-crawl scheduler config & live status
router.get('/crawler/scheduler', (req, res) => {
  try {
    const config = getAutoCrawlConfig();
    res.json({ success: true, config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save auto-crawl scheduler configuration
router.post('/crawler/scheduler', (req, res) => {
  try {
    saveAutoCrawlConfig(req.body);
    const updated = getAutoCrawlConfig();
    res.json({ success: true, message: 'Jadwal & pengaturan auto-crawl berhasil diperbarui', config: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger auto-crawl run immediately
router.post('/crawler/scheduler/run-now', async (req, res) => {
  try {
    const result = await runAutoCrawlJob(true);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// AUTOMATED PERIODIC SEO OPTIMIZATION ROUTES
// ==========================================

// Get SEO health status, score, and audit report
router.get('/seo/status', (req, res) => {
  try {
    const status = getSeoStatus();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger immediate SEO optimization
router.post('/seo/optimize-now', (req, res) => {
  try {
    const report = auditAndOptimizeSeo();
    res.json({ 
      success: true, 
      report, 
      message: `Optimasi SEO berhasil dieksekusi. Skor kesehatan SEO: ${report.score}/100, ${report.optimizedCount} artikel dioptimasi.` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update periodic SEO automation settings
router.post('/seo/settings', (req, res) => {
  try {
    const { enabled, intervalHours } = req.body;
    const save = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    if (enabled !== undefined) save.run('seo_auto_enabled', String(enabled));
    if (intervalHours !== undefined) save.run('seo_interval_hours', String(intervalHours));
    res.json({ success: true, message: 'Pengaturan optimasi SEO berkala berhasil disimpan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 7. LIVE & HISTORICAL VISITOR ANALYTICS
// ==========================================

// Get currently active online visitors (Live map data)
router.get('/analytics/live', (req, res) => {
  try {
    const visitors = Array.from(activeVisitors.values());
    res.json({
      success: true,
      activeCount: visitors.length,
      visitors
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get historical visitor logs with filter & pagination
router.get('/analytics/history', (req, res) => {
  try {
    const { search, country, device, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (ip LIKE ? OR city LIKE ? OR browser LIKE ? OR os LIKE ? OR page_title LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (country) {
      whereClause += ' AND country = ?';
      params.push(country);
    }

    if (device) {
      whereClause += ' AND device_type = ?';
      params.push(device);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM visitor_logs ${whereClause}`).get(...params).count;

    const logs = db.prepare(`
      SELECT * FROM visitor_logs 
      ${whereClause} 
      ORDER BY visited_at DESC 
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      logs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Summary analytics
router.get('/analytics/summary', (req, res) => {
  try {
    const summary = getVisitorAnalytics();
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export visitor logs as CSV
router.get('/analytics/export-csv', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT id, ip, country, city, region, latitude, longitude, isp,
             device_type, os, os_version, browser, browser_version,
             screen_resolution, page_title, page_url, referrer, duration_seconds, visited_at
      FROM visitor_logs 
      ORDER BY visited_at DESC
    `).all();

    const headers = [
      'ID', 'IP Address', 'Negara', 'Kota', 'Wilayah', 'Latitude', 'Longitude',
      'ISP', 'Perangkat', 'Sistem Operasi', 'OS Version', 'Browser', 'Browser Version',
      'Resolusi Layar', 'Halaman Berita', 'URL', 'Referrer', 'Durasi (Detik)', 'Waktu Kunjungan'
    ];

    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = [
        log.id,
        `"${log.ip || ''}"`,
        `"${log.country || ''}"`,
        `"${log.city || ''}"`,
        `"${log.region || ''}"`,
        log.latitude,
        log.longitude,
        `"${log.isp || ''}"`,
        `"${log.device_type || ''}"`,
        `"${log.os || ''}"`,
        `"${log.os_version || ''}"`,
        `"${log.browser || ''}"`,
        `"${log.browser_version || ''}"`,
        `"${log.screen_resolution || ''}"`,
        `"${(log.page_title || '').replace(/"/g, '""')}"`,
        `"${log.page_url || ''}"`,
        `"${log.referrer || ''}"`,
        log.duration_seconds || 0,
        `"${log.visited_at || ''}"`
      ];
      csvRows.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=calonjenazah_visitor_logs_${Date.now()}.csv`);
    res.send(csvRows.join('\r\n'));
  } catch (error) {
    res.status(500).send('Error generating CSV: ' + error.message);
  }
});

// ==========================================
// 8. SITE SETTINGS
// ==========================================

router.get('/settings', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => settings[r.key] = r.value);
    // Hide password for security
    delete settings.admin_password;
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/settings', (req, res) => {
  try {
    const updates = req.body;
    const updateStmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined && val !== null) {
        updateStmt.run(key, String(val));
      }
    }

    res.json({ success: true, message: 'Pengaturan berhasil disimpan' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
