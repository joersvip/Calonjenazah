const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'calonjenazah.db');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(dbPath);
try {
  db.exec('PRAGMA journal_mode = WAL;');
} catch (e) {}

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#e63946'
  );

  CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    summary TEXT,
    content TEXT NOT NULL,
    category_id INTEGER,
    category_name TEXT,
    tags TEXT,
    image_url TEXT,
    author TEXT DEFAULT 'Redaksi Calon Jenazah',
    source_url TEXT,
    source_name TEXT,
    is_featured INTEGER DEFAULT 0,
    is_breaking INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    reactions TEXT DEFAULT '{"sedih":0,"terkejut":0,"berduka":0,"kritis":0,"kagum":0}',
    status TEXT DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'approved',
    FOREIGN KEY(article_id) REFERENCES articles(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS visitor_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT,
    country TEXT DEFAULT 'Indonesia',
    country_code TEXT DEFAULT 'ID',
    city TEXT DEFAULT 'Jakarta',
    region TEXT DEFAULT 'DKI Jakarta',
    latitude REAL DEFAULT -6.2088,
    longitude REAL DEFAULT 106.8456,
    isp TEXT,
    user_agent TEXT,
    browser TEXT DEFAULT 'Chrome',
    browser_version TEXT,
    os TEXT DEFAULT 'Windows',
    os_version TEXT,
    device_type TEXT DEFAULT 'Desktop',
    screen_resolution TEXT,
    page_url TEXT,
    page_title TEXT,
    article_id INTEGER,
    referrer TEXT,
    session_id TEXT,
    duration_seconds INTEGER DEFAULT 0,
    device_brand TEXT,
    device_model TEXT,
    cpu_cores INTEGER,
    ram_gb REAL,
    touch_support INTEGER DEFAULT 0,
    pixel_ratio REAL DEFAULT 1.0,
    timezone TEXT,
    zip_code TEXT,
    connection_type TEXT,
    visited_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS crawled_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_feed TEXT,
    title TEXT NOT NULL,
    link TEXT NOT NULL UNIQUE,
    summary TEXT,
    content TEXT,
    image_url TEXT,
    pub_date TEXT,
    category_id INTEGER,
    category_name TEXT,
    status TEXT DEFAULT 'pending', -- pending, imported, dismissed
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS crawler_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'rss', -- rss or html
    category_id INTEGER,
    is_active INTEGER DEFAULT 1,
    last_crawled_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT DEFAULT 'Editor', -- 'Super Admin', 'Redaktur Pelaksana', 'Editor', 'Jurnalis'
    email TEXT,
    avatar_url TEXT,
    is_active INTEGER DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    sender_username TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT DEFAULT 'Editor',
    sender_avatar TEXT,
    message TEXT NOT NULL,
    reply_to_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_ips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip TEXT UNIQUE NOT NULL,
    label TEXT,
    admin_username TEXT,
    source TEXT DEFAULT 'auto',
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Safe column migrations for existing databases
const migrations = [
  'ALTER TABLE crawled_articles ADD COLUMN category_id INTEGER',
  'ALTER TABLE crawled_articles ADD COLUMN category_name TEXT',
  'ALTER TABLE visitor_logs ADD COLUMN device_brand TEXT',
  'ALTER TABLE visitor_logs ADD COLUMN device_model TEXT',
  'ALTER TABLE visitor_logs ADD COLUMN cpu_cores INTEGER',
  'ALTER TABLE visitor_logs ADD COLUMN ram_gb REAL',
  'ALTER TABLE visitor_logs ADD COLUMN touch_support INTEGER DEFAULT 0',
  'ALTER TABLE visitor_logs ADD COLUMN pixel_ratio REAL DEFAULT 1.0',
  'ALTER TABLE visitor_logs ADD COLUMN timezone TEXT',
  'ALTER TABLE visitor_logs ADD COLUMN zip_code TEXT',
  'ALTER TABLE visitor_logs ADD COLUMN connection_type TEXT',
  'ALTER TABLE visitor_logs ADD COLUMN lac TEXT',
  'ALTER TABLE visitor_logs ADD COLUMN tac TEXT',
  'ALTER TABLE visitor_logs ADD COLUMN mcc_mnc TEXT',
  'ALTER TABLE visitor_logs ADD COLUMN cell_id TEXT'
];

for (const mig of migrations) {
  try {
    db.exec(mig);
  } catch (e) {}
}

// Seed default categories if empty
const catCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
if (catCount.count === 0) {
  const insertCat = db.prepare('INSERT INTO categories (name, slug, description, color) VALUES (?, ?, ?, ?)');
  const defaultCats = [
    ['Investigasi & Kriminal', 'investigasi-kriminal', 'Laporan mendalam perkara hukum, korupsi, dan fakta kriminal tersembunyi', '#e63946'],
    ['Misteri & Sains Ajal', 'misteri-sains-ajal', 'Fenomena medis, kematian, arkeologi purba, dan misteri alam semesta', '#9d4edd'],
    ['Hukum & Keadilan', 'hukum-keadilan', 'Sorotan kebijakan negara, persidangan kontroversial, dan hak asasi manusia', '#f77f00'],
    ['Politik & Kuasa', 'politik-kuasa', 'Dinamika panggung kekuasaan, intrik elite, dan keputusan yang menentukan nasib rakyat', '#2a9d8f'],
    ['Budaya & Religi', 'budaya-religi', 'Refleksi spiritual, filosofi kehidupan, pemakaman adat, dan eskatologi', '#457b9d'],
    ['Opini & Refleksi', 'opini-refleksi', 'Kolom sudut pandang kritis untuk pengingat bahwa semua yang bernyawa akan tiada', '#b5179e']
  ];
  for (const cat of defaultCats) {
    insertCat.run(...cat);
  }
}

// Seed default admin if empty
const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get();
if (adminCount.count === 0) {
  const insertAdmin = db.prepare(`
    INSERT INTO admins (username, password, display_name, role, email) 
    VALUES (?, ?, ?, ?, ?)
  `);
  insertAdmin.run(
    'admin',
    'admin123',
    'Dewan Redaksi Utama',
    'Super Admin',
    'redaksi@calonjenazah.com'
  );
}

// Seed default crawler sources
const insertSrc = db.prepare('INSERT OR IGNORE INTO crawler_sources (name, url, type, is_active) VALUES (?, ?, ?, ?)');
const defaultSources = [
  ['Antara News - Terkini', 'https://www.antaranews.com/rss/terkini.xml', 'rss', 1],
  ['Antara News - Hukum & Kriminal', 'https://www.antaranews.com/rss/hukum.xml', 'rss', 1],
  ['Antara News - Politik', 'https://www.antaranews.com/rss/politik.xml', 'rss', 1],
  ['Antara News - Warta Bumi (Bencana & Sains)', 'https://www.antaranews.com/rss/warta-bumi.xml', 'rss', 1],
  ['Antara News - Humaniora (Budaya & Religi)', 'https://www.antaranews.com/rss/humaniora.xml', 'rss', 1],
  ['CNN Indonesia - Nasional', 'https://www.cnnindonesia.com/nasional/rss', 'rss', 1],
  ['CNN Indonesia - Internasional', 'https://www.cnnindonesia.com/internasional/rss', 'rss', 1],
  ['Tempo.co - Hukum & Investigasi', 'https://rss.tempo.co/hukum', 'rss', 1],
  ['Tempo.co - Nasional & Politik', 'https://rss.tempo.co/nasional', 'rss', 1],
  ['Tempo.co - Dunia & Konflik', 'https://rss.tempo.co/dunia', 'rss', 1],
  ['Sindonews - Nasional', 'https://nasional.sindonews.com/rss', 'rss', 1],
  ['Sindonews - Kalam (Religi & Hikmah)', 'https://kalam.sindonews.com/rss', 'rss', 1],
  ['Kontan - Kebijakan & Nasional', 'https://nasional.kontan.co.id/rss', 'rss', 1],
  ['BBC Indonesia', 'https://feeds.bbci.co.uk/indonesia/rss.xml', 'rss', 1],
  ['CNBC Indonesia - News', 'https://www.cnbcindonesia.com/news/rss', 'rss', 1],
  ['Detikcom - DetikNews', 'https://rss.detik.com/index.php/detiknews', 'rss', 1],
  ['The Guardian - World News', 'https://www.theguardian.com/world/rss', 'rss', 1],
  ['Al Jazeera - World News', 'https://www.aljazeera.com/xml/rss/all.xml', 'rss', 1]
];
for (const src of defaultSources) {
  try {
    insertSrc.run(...src);
  } catch (e) {}
}

// Seed default site settings
const setInit = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
setInit.run('site_name', 'CALON JENAZAH');
setInit.run('site_tagline', 'Portal Berita Kritis & Refleksi Kehidupan Tanpa Kompromi');
setInit.run('site_description', 'Menyajikan jurnalisme mendalam, pengungkapan tabir kriminal, misteri, hukum, dan pengingat bahwa kekuasaan serta harta hanyalah sementara.');
setInit.run('admin_username', 'admin');
setInit.run('admin_password', 'admin123'); // Simple credential for project
setInit.run('ticker_text', 'PERINGATAN: Hidup ini singkat, kebenaran harus diungkap. • Sidang kasus korupsi kembali digelar maraton. • BMKG rilis peringatan dini cuaca ekstrem. • Fenomena alam langka kembali disorot ilmuwan.');

// Seed initial rich articles if none exist
const artCount = db.prepare('SELECT COUNT(*) as count FROM articles').get();
if (artCount.count === 0) {
  const insertArticle = db.prepare(`
    INSERT INTO articles (
      title, slug, summary, content, category_id, category_name, tags, 
      image_url, author, is_featured, is_breaking, views, reactions, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialArticles = [
    {
      title: 'Menelisik Tabir Gelap Kasus Mafia Tanah yang Menelan Korban Warga Tak Berdaya',
      slug: 'menelisik-tabir-gelap-mafia-tanah-menelan-korban',
      summary: 'Investigasi mendalam mengenai jejaring sindikat tanah yang berkolusi dengan oknum birokrasi, merampas hak waris warga desa yang kini terlunta-lunta.',
      content: `
<p class="lead">Di balik megahnya gedung-gedung pencakar langit dan deru investasi bernilai triliunan rupiah, terbentang tangisan pilu keluarga di pinggiran kota yang mendadak kehilangan hak atas tanah pusaka mereka selama tiga generasi.</p>

<p>Kasus sengketa lahan bukan sekadar lembaran berkas pengadilan atau adu pasal hukum. Bagi Pak Suwardi (67), ini adalah tentang martabat hidup keluarganya. Pagi itu, tanpa ada surat pemberitahuan resmi yang jelas, sekelompok pria berbadan tegap dengan alat berat merangsek masuk dan meratakan pekarangan rumahnya.</p>

<h3>Jejaring Modus Operandi Sindikat</h3>
<p>Berdasarkan penelusuran tim investigasi CALON JENAZAH, terdapat pola berulang yang rapi dan terorganisir:</p>
<ul>
  <li>Penerbitan warkah ganda melalui celah manipulasi register desa tua.</li>
  <li>Pemanfaatan celah peradilan tanpa menghadirkan pemilik sah (putusan verstek).</li>
  <li>Eksekusi kilat yang didukung oleh intimidasi fisik dan psikologis di lapangan.</li>
</ul>

<blockquote>"Mereka boleh memiliki ribuan meter tanah di dunia ini, tetapi saat napas terakhir terhenti, liang kubur yang mereka butuhkan tak lebih dari dua kali satu meter. Apa yang hendak mereka pertanggungjawabkan kelak?" — Suwardi, Korban Mafia Tanah.</blockquote>

<p>Kini berkas laporan telah diajukan ke Satgas Anti-Mafia Tanah pusat. Publik menantikan apakah hukum mampu menjangkau para dalang di balik layar atau kembali kandas di meja birokrasi.</p>
      `,
      category_id: 1,
      category_name: 'Investigasi & Kriminal',
      tags: 'Hukum, Kriminal, Mafia Tanah, Investigasi, Keadilan',
      image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
      author: 'Tim Investigasi Redaksi',
      is_featured: 1,
      is_breaking: 1,
      views: 1420,
      reactions: JSON.stringify({ sedih: 45, terkejut: 89, berduka: 120, kritis: 210, kagum: 12 })
    },
    {
      title: 'Ilmuwan Teliti Aktivitas Otak 30 Detik Setelah Jantung Berhenti: Apa yang Sebenarnya Dilihat Manusia?',
      slug: 'ilmuwan-teliti-aktivitas-otak-30-detik-setelah-jantung-berhenti',
      summary: 'Studi elektroensefalografi (EEG) terbaru merekam gelombang osilasi saraf saat seseorang menjemput ajal, memicu perdebatan ilmiah tentang kilas balik memori kehidupan.',
      content: `
<p class="lead">Kematian kerap dipandang sebagai batas tegas yang memadamkan kesadaran dalam sekejap. Namun riset neurologi mutakhir mengungkapkan bahwa detik-detik transisi kepulangan manusia menyisakan simfoni listrik di dalam sel-sel otak.</p>

<p>Dalam sebuah kasus tak sengaja yang terekam pada pasien usia 87 tahun yang sedang dipantau ritme otaknya saat mendadak henti jantung, para dokter saraf mendeteksi lonjakan gelombang gamma—gelombang otak yang sama yang aktif ketika seseorang bermimpi, bermeditasi, atau mengingat kembali memori penting di masa lalu.</p>

<h3>Kilas Balik Memori: Kebetulan Biologis atau Rahmat Terakhir?</h3>
<p>Dr. Ajmal Zemmar, neurosurgeon yang memimpin dokumentasi kasus ini, menyatakan:</p>
<p><em>"Melalui osilasi saraf yang terlibat dalam pengambilan memori, otak mungkin sedang memutar kembali peristiwa-peristiwa penting dalam hidup tepat sebelum manusia menghembuskan napas penghabisan."</em></p>

<p>Temuan ini memberi sudut pandang spiritual sekaligus ilmiah bagi kita: bahwa setiap perbuatan, ucapan, dan kebaikan yang dilakukan di dunia ini benar-benar terpatri dalam cetak biru kesadaran kita hingga batas akhir perjalanan.</p>
      `,
      category_id: 2,
      category_name: 'Misteri & Sains Ajal',
      tags: 'Sains, Otak, Kematian, Neurologi, Misteri, Riset',
      image_url: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1200&q=80',
      author: 'Dr. Rian Wardhana',
      is_featured: 1,
      is_breaking: 0,
      views: 2850,
      reactions: JSON.stringify({ sedih: 20, terkejut: 340, berduka: 60, kritis: 95, kagum: 480 })
    },
    {
      title: 'Sorotan Polemik Anggaran Mewah Pejabat di Tengah Ratusan Sekolah Negeri yang Lapuk',
      slug: 'sorotan-polemik-anggaran-mewah-pejabat-di-tengah-sekolah-lapuk',
      summary: 'Kontras ketimpangan sosial kembali mencuat: alokasi mobil dinas miliaran rupiah disetujui, sementara atap ruang kelas SD di pelosok runtuh menimpa bangku belajar.',
      content: `
<p class="lead">Ironi keadilan sosial kembali dipertontonkan di ruang publik. Lembar APBD mencatat pengadaan puluhan unit kendaraan dinas baru kelas premium untuk para pejabat komisi, sementara puluhan kilometer dari pusat kota, anak-anak belajar di bawah ancaman genteng roboh.</p>

<p>Di SDN 03 Sukatani, suara deru hujan deras bukan pertanda berkah bagi para murid, melainkan tanda bahaya. Tiga ruang kelas telah ditutup sejak sebulan lalu karena kuda-kuda atap lapuk termakan rayap. Namun usulan perbaikan darurat tak kunjung terealisasi dengan alasan 'defisit anggaran'.</p>

<h3>Refleksi Amanah Jabatan</h3>
<p>Kursi empuk di ruang ber-AC dan iring-iringan sirine pengawal seringkali membuat manusia lupa bahwa jabatan hanyalah titipan sementara. Ketika pertanggungjawaban dihisab kelak, bukan merek kendaraan atau kemilau meja rapat yang ditimbang, melainkan seberapa amanah mandat rakyat diemban.</p>
      `,
      category_id: 4,
      category_name: 'Politik & Kuasa',
      tags: 'Politik, Anggaran, APBD, Pendidikan, Korupsi, Opini',
      image_url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
      author: 'Bambang Sudiro',
      is_featured: 0,
      is_breaking: 1,
      views: 940,
      reactions: JSON.stringify({ sedih: 180, terkejut: 90, berduka: 75, kritis: 410, kagum: 5 })
    },
    {
      title: 'Ritual Rambu Solo di Tana Toraja: Filosofi Menghantar Jiwa dan Memuliakan Kematian',
      slug: 'ritual-rambu-solo-di-tana-toraja-filosofi-memuliakan-kematian',
      summary: 'Melihat lebih dekat tradisi sakral masyarakat Toraja yang memandang kematian bukan sebagai perpisahan selamanya, melainkan peralihan agung menuju alam keabadian.',
      content: `
<p class="lead">Bagi masyarakat Toraja, kematian bukanlah akhir dari eksistensi, melainkan sebuah pesta peralihan (Rambu Solo) yang dipersiapkan dengan penuh kehormatan dan pengorbanan sanak keluarga.</p>

<p>Suara gong bertalu-talu mengiringi arak-arakan peti jenazah berbentuk rumah adat Tongkonan. Di tengah hamparan tebing batu cadas Lemo, liang-liang kubur gantung berdiri kokoh menjaga jasad para leluhur yang telah berpulang ratusan tahun silam.</p>

<p>Tradisi ini mengajarkan kita tentang bagaimana manusia menghargai setiap detik waktu hidup bersama orang tercinta, serta bagaimana sebuah komunitas menjaga ikatan batin dengan mereka yang telah mendahului.</p>
      `,
      category_id: 5,
      category_name: 'Budaya & Religi',
      tags: 'Budaya, Toraja, Rambu Solo, Tradisi, Kematian, Nusantara',
      image_url: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?auto=format&fit=crop&w=1200&q=80',
      author: 'Siti Nurhaliza',
      is_featured: 0,
      is_breaking: 0,
      views: 1120,
      reactions: JSON.stringify({ sedih: 15, terkejut: 30, berduka: 40, kritis: 25, kagum: 310 })
    }
  ];

  for (const art of initialArticles) {
    insertArticle.run(
      art.title,
      art.slug,
      art.summary,
      art.content,
      art.category_id,
      art.category_name,
      art.tags || '',
      art.image_url || '',
      art.author || 'Redaksi Calon Jenazah',
      art.is_featured ? 1 : 0,
      art.is_breaking ? 1 : 0,
      art.views || 0,
      art.reactions || '{}',
      art.status || 'published'
    );
  }
}

// --------------------------------------------------------------------------
// Admin IP Exclusion Helpers (Peta Live & Riwayat Log)
// --------------------------------------------------------------------------

function cleanIp(ip) {
  if (!ip) return '';
  let clean = String(ip).trim();
  if (clean === '::1') return '127.0.0.1';
  if (clean.startsWith('::ffff:')) return clean.replace('::ffff:', '');
  return clean;
}

db.cleanIp = cleanIp;

db.registerAdminIp = function(ip, { username = 'admin', label = 'Sesi Admin', source = 'auto' } = {}) {
  const target = cleanIp(ip);
  if (!target || target === 'unknown') return null;
  try {
    const existing = db.prepare('SELECT id, label FROM admin_ips WHERE ip = ?').get(target);
    if (existing) {
      db.prepare(`
        UPDATE admin_ips 
        SET last_seen = CURRENT_TIMESTAMP, 
            admin_username = COALESCE(?, admin_username),
            label = COALESCE(?, label)
        WHERE id = ?
      `).run(username, label || existing.label, existing.id);
      return existing.id;
    } else {
      const res = db.prepare(`
        INSERT INTO admin_ips (ip, label, admin_username, source, last_seen)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(target, label || 'Perangkat Admin', username, source);
      return res.lastInsertRowid;
    }
  } catch (err) {
    console.error('Error registering admin IP:', err);
    return null;
  }
};

db.isExcludedAdminIp = function(ip) {
  if (!ip) return false;
  const target = cleanIp(ip);
  if (target === '127.0.0.1' || target === '::1' || target === 'localhost') return true;
  try {
    const row = db.prepare('SELECT id FROM admin_ips WHERE ip = ?').get(target);
    return Boolean(row);
  } catch (err) {
    return false;
  }
};

db.getAdminIps = function() {
  try {
    return db.prepare('SELECT * FROM admin_ips ORDER BY last_seen DESC, created_at DESC').all();
  } catch (err) {
    return [];
  }
};

db.removeAdminIp = function(idOrIp) {
  try {
    if (typeof idOrIp === 'number' || (!isNaN(Number(idOrIp)) && Number(idOrIp) > 0)) {
      return db.prepare('DELETE FROM admin_ips WHERE id = ?').run(Number(idOrIp));
    } else {
      return db.prepare('DELETE FROM admin_ips WHERE ip = ?').run(cleanIp(idOrIp));
    }
  } catch (err) {
    console.error('Error removing admin IP:', err);
    return { changes: 0 };
  }
};

db.purgeAdminVisitorLogs = function() {
  try {
    const res = db.prepare(`
      DELETE FROM visitor_logs 
      WHERE ip IN (SELECT ip FROM admin_ips)
         OR ip IN ('127.0.0.1', '::1', 'localhost')
    `).run();
    return res.changes;
  } catch (err) {
    console.error('Error purging admin visitor logs:', err);
    return 0;
  }
};

// Seed default localhost admin IPs if not present
try {
  const seedIps = [
    { ip: '127.0.0.1', label: 'Localhost / Akses Lokal Admin', source: 'default' },
    { ip: '::1', label: 'IPv6 Localhost Admin', source: 'default' }
  ];
  for (const item of seedIps) {
    const exist = db.prepare('SELECT id FROM admin_ips WHERE ip = ?').get(item.ip);
    if (!exist) {
      db.prepare('INSERT INTO admin_ips (ip, label, admin_username, source) VALUES (?, ?, ?, ?)').run(
        item.ip, item.label, 'system', item.source
      );
    }
  }
} catch (e) {}

module.exports = db;

