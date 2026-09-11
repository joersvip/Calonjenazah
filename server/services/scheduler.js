const db = require('../db');
const { crawlFeed, importCrawledArticle } = require('./crawler');
const { auditAndOptimizeSeo } = require('./seo');

let isCrawlRunning = false;
let isSeoRunning = false;
let timerHandle = null;

// Track minutes to prevent multiple runs within the same minute for daily mode
let lastRunDailyMinute = null;

/**
 * Get Auto Crawl configuration from database settings
 * @returns {object}
 */
function getAutoCrawlConfig() {
  const getSetting = (key, defaultVal) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : defaultVal;
  };

  const enabled = getSetting('auto_crawl_enabled', 'false') === 'true';
  const mode = getSetting('auto_crawl_mode', 'interval'); // 'interval' | 'daily'
  const intervalMinutes = Number(getSetting('auto_crawl_interval_minutes', '60')) || 60;
  const dailyTimes = getSetting('auto_crawl_daily_times', '06:00,12:00,18:00');
  const action = getSetting('auto_crawl_action', 'queue'); // 'queue' | 'auto_publish'
  const sources = getSetting('auto_crawl_sources', 'all'); // 'all' or specific IDs
  const maxPerSource = Number(getSetting('auto_crawl_max_per_source', '10')) || 10;
  const lastRun = getSetting('auto_crawl_last_run', null);
  const lastResult = getSetting('auto_crawl_last_result', 'Belum pernah dijalankan');

  // Compute Next Estimated Run
  let nextRun = null;
  const now = new Date();

  if (enabled) {
    if (mode === 'interval') {
      if (lastRun) {
        const lastDate = new Date(lastRun);
        const nextTime = new Date(lastDate.getTime() + intervalMinutes * 60 * 1000);
        nextRun = nextTime > now ? nextTime.toISOString() : new Date(now.getTime() + 60 * 1000).toISOString();
      } else {
        nextRun = new Date(now.getTime() + intervalMinutes * 60 * 1000).toISOString();
      }
    } else if (mode === 'daily') {
      const times = dailyTimes.split(',').map(t => t.trim()).filter(Boolean).sort();
      for (const t of times) {
        const [hh, mm] = t.split(':').map(Number);
        const targetToday = new Date(now);
        targetToday.setHours(hh, mm, 0, 0);
        if (targetToday > now) {
          nextRun = targetToday.toISOString();
          break;
        }
      }
      if (!nextRun && times.length > 0) {
        // Next run is first time tomorrow
        const [hh, mm] = times[0].split(':').map(Number);
        const targetTomorrow = new Date(now);
        targetTomorrow.setDate(targetTomorrow.getDate() + 1);
        targetTomorrow.setHours(hh, mm, 0, 0);
        nextRun = targetTomorrow.toISOString();
      }
    }
  }

  return {
    enabled,
    mode,
    intervalMinutes,
    dailyTimes,
    action,
    sources,
    maxPerSource,
    lastRun,
    lastResult,
    nextRun,
    isRunning: isCrawlRunning
  };
}

/**
 * Save Auto Crawl configuration to settings table
 * @param {object} config 
 */
function saveAutoCrawlConfig(config) {
  const save = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  if (config.enabled !== undefined) save.run('auto_crawl_enabled', String(config.enabled));
  if (config.mode !== undefined) save.run('auto_crawl_mode', String(config.mode));
  if (config.intervalMinutes !== undefined) save.run('auto_crawl_interval_minutes', String(config.intervalMinutes));
  if (config.dailyTimes !== undefined) save.run('auto_crawl_daily_times', String(config.dailyTimes));
  if (config.action !== undefined) save.run('auto_crawl_action', String(config.action));
  if (config.sources !== undefined) save.run('auto_crawl_sources', String(config.sources));
  if (config.maxPerSource !== undefined) save.run('auto_crawl_max_per_source', String(config.maxPerSource));
}

/**
 * Execute Auto Crawl job across sources
 * @param {boolean} isManual 
 * @returns {Promise<object>}
 */
async function runAutoCrawlJob(isManual = false) {
  if (isCrawlRunning) {
    return { success: false, message: 'Proses crawl otomatis sedang berjalan' };
  }

  isCrawlRunning = true;
  const startTime = Date.now();
  const config = getAutoCrawlConfig();

  try {
    console.log(`[AutoCrawl Scheduler] Memulai auto-crawl pada ${new Date().toLocaleString('id-ID')}...`);

    // Get active crawler sources
    let sources = [];
    if (config.sources === 'all' || !config.sources) {
      sources = db.prepare('SELECT * FROM crawler_sources WHERE is_active = 1').all();
    } else {
      const sourceIds = String(config.sources).split(',').map(s => Number(s.trim())).filter(Boolean);
      if (sourceIds.length > 0) {
        const placeholders = sourceIds.map(() => '?').join(',');
        sources = db.prepare(`SELECT * FROM crawler_sources WHERE id IN (${placeholders})`).all(...sourceIds);
      }
    }

    if (sources.length === 0) {
      sources = db.prepare('SELECT * FROM crawler_sources LIMIT 10').all();
    }

    let totalFetched = 0;
    let totalImported = 0;
    const errors = [];

    for (const src of sources) {
      try {
        const result = await crawlFeed(src.url, src.name);
        totalFetched += result.savedCount || 0;

        // If configured to automatically publish, import pending items from this source
        if (config.action === 'auto_publish') {
          const pendingItems = db.prepare("SELECT id FROM crawled_articles WHERE status = 'pending' AND source_feed = ? LIMIT ?")
            .all(src.name, config.maxPerSource || 10);

          for (const item of pendingItems) {
            try {
              await importCrawledArticle(item.id, 'auto', false);
              totalImported++;
            } catch (impErr) {}
          }
        }

        // Update source last_crawled_at
        db.prepare('UPDATE crawler_sources SET last_crawled_at = CURRENT_TIMESTAMP WHERE id = ?').run(src.id);
      } catch (err) {
        errors.push(`${src.name}: ${err.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const nowIso = new Date().toISOString();
    let resultSummary = `Berhasil merayapi ${sources.length} sumber berita dalam ${duration} detik. Diperoleh ${totalFetched} berita baru`;
    if (config.action === 'auto_publish') {
      resultSummary += ` (${totalImported} langsung diterbitkan ke portal)`;
    }
    if (errors.length > 0) {
      resultSummary += ` [${errors.length} sumber dilewati]`;
    }

    // Save status
    const save = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
    save.run('auto_crawl_last_run', nowIso);
    save.run('auto_crawl_last_result', resultSummary);

    console.log(`[AutoCrawl Scheduler] Selesai: ${resultSummary}`);

    return {
      success: true,
      sourcesCount: sources.length,
      totalFetched,
      totalImported,
      duration,
      summary: resultSummary,
      timestamp: nowIso
    };
  } catch (error) {
    console.error('[AutoCrawl Scheduler] Error:', error.message);
    return { success: false, error: error.message };
  } finally {
    isCrawlRunning = false;
  }
}

/**
 * Execute periodic SEO audit & optimization job
 * @param {boolean} isManual 
 * @returns {object}
 */
function runPeriodicSeoJob(isManual = false) {
  if (isSeoRunning) {
    return { success: false, message: 'Optimasi SEO sedang berjalan' };
  }

  isSeoRunning = true;
  try {
    console.log(`[SEO Optimizer] Menjalankan optimasi SEO berkala pada ${new Date().toLocaleString('id-ID')}...`);
    const report = auditAndOptimizeSeo();
    console.log(`[SEO Optimizer] Sukses! Skor kesehatan SEO: ${report.score}/100, ${report.optimizedCount} artikel dioptimasi.`);
    return { success: true, ...report };
  } catch (err) {
    console.error('[SEO Optimizer] Error:', err.message);
    return { success: false, error: err.message };
  } finally {
    isSeoRunning = false;
  }
}

/**
 * Background loop checking schedule conditions every 30 seconds
 */
function checkSchedules() {
  const now = new Date();
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTimeStr = `${currentHours}:${currentMinutes}`;
  const currentMinuteId = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}_${currentTimeStr}`;

  // 1. Check Auto Crawl Schedule
  const crawlConfig = getAutoCrawlConfig();
  if (crawlConfig.enabled && !isCrawlRunning) {
    if (crawlConfig.mode === 'interval') {
      const lastRunTime = crawlConfig.lastRun ? new Date(crawlConfig.lastRun).getTime() : 0;
      const elapsedMinutes = (now.getTime() - lastRunTime) / (60 * 1000);
      if (elapsedMinutes >= crawlConfig.intervalMinutes) {
        console.log(`[AutoCrawl Scheduler] Trigger interval (${crawlConfig.intervalMinutes}m tercapai, elapsed: ${Math.round(elapsedMinutes)}m)`);
        runAutoCrawlJob();
      }
    } else if (crawlConfig.mode === 'daily') {
      // Check if current HH:mm is in dailyTimes and has not already run in this minute
      const times = crawlConfig.dailyTimes.split(',').map(t => t.trim());
      if (times.includes(currentTimeStr) && lastRunDailyMinute !== currentMinuteId) {
        lastRunDailyMinute = currentMinuteId;
        console.log(`[AutoCrawl Scheduler] Trigger jadwal harian waktu manual: ${currentTimeStr}`);
        runAutoCrawlJob();
      }
    }
  }

  // 2. Check Periodic SEO Schedule
  const seoEnabledRow = db.prepare("SELECT value FROM settings WHERE key = 'seo_auto_enabled'").get();
  const seoIntervalRow = db.prepare("SELECT value FROM settings WHERE key = 'seo_interval_hours'").get();
  const seoLastRunRow = db.prepare("SELECT value FROM settings WHERE key = 'seo_last_run'").get();

  const seoEnabled = seoEnabledRow ? seoEnabledRow.value === 'true' : true;
  const seoIntervalHours = Number(seoIntervalRow ? seoIntervalRow.value : '6') || 6;
  const lastSeoTime = seoLastRunRow ? new Date(seoLastRunRow.value).getTime() : 0;

  if (seoEnabled && !isSeoRunning) {
    const elapsedHours = (now.getTime() - lastSeoTime) / (60 * 60 * 1000);
    if (elapsedHours >= seoIntervalHours) {
      console.log(`[SEO Optimizer] Trigger interval berkala (${seoIntervalHours} jam tercapai)`);
      runPeriodicSeoJob();
    }
  }
}

/**
 * Initialize background scheduler
 */
function initScheduler() {
  if (timerHandle) {
    clearInterval(timerHandle);
  }

  console.log('⏰ Auto-Crawl & Periodic SEO Scheduler initialized.');
  // Run initial check after 10 seconds of server boot
  setTimeout(checkSchedules, 10000);

  // Then check every 30 seconds
  timerHandle = setInterval(checkSchedules, 30000);
}

module.exports = {
  initScheduler,
  getAutoCrawlConfig,
  saveAutoCrawlConfig,
  runAutoCrawlJob,
  runPeriodicSeoJob
};
