/**
 * Intelligent News Category Auto-Classifier for CALON JENAZAH
 * Classifies articles automatically from news sources, RSS feeds, URLs, tags, and content.
 */

const CATEGORIES = [
  { id: 1, name: 'Investigasi & Kriminal', slug: 'investigasi-kriminal' },
  { id: 2, name: 'Misteri & Sains Ajal', slug: 'misteri-sains-ajal' },
  { id: 3, name: 'Hukum & Keadilan', slug: 'hukum-keadilan' },
  { id: 4, name: 'Politik & Kuasa', slug: 'politik-kuasa' },
  { id: 5, name: 'Budaya & Religi', slug: 'budaya-religi' },
  { id: 6, name: 'Opini & Refleksi', slug: 'opini-refleksi' }
];

const CATEGORY_RULES = {
  // Category 4: Politik & Kuasa
  4: {
    sourceKeywords: ['politik', 'parlemen', 'pemilu', 'pilkada', 'pilpres'],
    urlPatterns: [/\/politik/i, /\/pemilu/i, /\/pilkada/i, /\/pilpres/i, /\/nasional\/politik/i, /\/governance/i],
    categoryTags: ['politik', 'politics', 'pemerintahan', 'pemilu', 'pilkada', 'pilpres', 'dpr', 'kpu', 'parpol'],
    strongKeywords: [
      'presiden', 'wapres', 'wakil presiden', 'prabowo', 'jokowi', 'gibran', 'menteri', 'kemenko', 'kabinet',
      'istana negara', 'istana kepresidenan', 'dpr', 'mpr', 'dprd', 'senayan', 'parlemen', 'pemilu', 'pilkada',
      'pilpres', 'pileg', 'kpu', 'bawaslu', 'partai politik', 'parpol', 'gerindra', 'pdi perjuangan', 'pdip',
      'golkar', 'nasdem', 'pkb', 'pks', 'pan', 'demokrat', 'ppp', 'koalisi', 'oposisi', 'kampanye', 'calon bupati',
      'calon gubernur', 'calon walikota', 'debat pilpres', 'survei elektabilitas', 'hak angket', 'reshuffle'
    ],
    generalKeywords: [
      'politik', 'kebijakan', 'pemerintah', 'pejabat', 'birokrasi', 'diplomasi', 'gubernur', 'bupati', 'walikota',
      'pemda', 'anggaran', 'apbn', 'apbd', 'negara', 'otonomi', 'kekuasaan', 'politikus', 'politisi'
    ]
  },

  // Category 1: Investigasi & Kriminal
  1: {
    sourceKeywords: ['kriminal', 'crime', 'investigasi', 'kasus'],
    urlPatterns: [/\/kriminal/i, /\/hukum-kriminal/i, /\/crime/i, /\/investigasi/i, /\/kasus/i, /\/peristiwa/i],
    categoryTags: ['kriminal', 'crime', 'kejahatan', 'polisi', 'kasus', 'narkoba', 'korupsi', 'investigasi'],
    strongKeywords: [
      'korupsi', 'kpk', 'tersangka', 'buronan', 'dpo', 'polri', 'polisi', 'polda', 'polres', 'polsek',
      'bareskrim', 'kapolri', 'kapolda', 'narkoba', 'sabu', 'ekstasi', 'ganja', 'mutilasi', 'pembunuhan berencana',
      'pembunuhan', 'pencurian', 'perampokan', 'begal', 'penodongan', 'penganiayaan', 'pengeroyokan',
      'pemerkosaan', 'pelecehan seksual', 'judi online', 'judol', 'penipuan online', 'penipuan', 'penggelapan',
      'gratifikasi', 'suap', 'pungli', 'terorisme', 'teroris', 'densus 88', 'densus', 'sindikasi', 'penyelundupan',
      'operasi tangkap tangan', 'ott', 'olah tkp', 'barang bukti'
    ],
    generalKeywords: [
      'kriminal', 'kejahatan', 'pidana', 'penyidikan', 'penyelidikan', 'ditangkap', 'menangkap', 'amankan',
      'ringkus', 'grebek', 'penggerebekan', 'sita', 'disita', 'razia', 'pelaku', 'korban', 'modus', 'motif',
      'buron', 'komplotan', 'ciduk'
    ]
  },

  // Category 3: Hukum & Keadilan
  3: {
    sourceKeywords: ['hukum', 'justice', 'peradilan'],
    urlPatterns: [/\/hukum/i, /\/peradilan/i, /\/justice/i, /\/law/i, /\/mahkamah/i, /\/sidang/i],
    categoryTags: ['hukum', 'law', 'justice', 'pengadilan', 'mahkamah', 'peradilan', 'hakim', 'jaksa'],
    strongKeywords: [
      'mahkamah konstitusi', 'mk', 'mahkamah agung', 'ma', 'komisi yudisial', 'pengadilan negeri', 'pengadilan tinggi',
      'pengadilan', 'kejaksaan agung', 'kejagung', 'kejaksaan', 'jaksa agung', 'jaksa penuntut umum', 'jpu',
      'hakim', 'vonis', 'putusan hakim', 'putusan peradilan', 'dakwaan', 'tuntutan jaksa', 'praperadilan', 'kasasi',
      'peninjauan kembali', 'banding', 'gugatan perdata', 'gugatan', 'sengketa pemilu', 'sengketa', 'advokat',
      'pengacara', 'lpsk', 'komnas ham', 'hak asasi manusia', 'uu', 'undang-undang', 'perppu', 'peraturan pemerintah',
      'pasal', 'konstitusi', 'yurisprudensi', 'sidang perkara', 'meja hijau'
    ],
    generalKeywords: [
      'hukum', 'keadilan', 'sidang', 'perdata', 'tergugat', 'penggugat', 'legal', 'norma', 'peraturan',
      'regulasi', 'saksi', 'keterangan saksi', 'yudisial'
    ]
  },

  // Category 2: Misteri & Sains Ajal
  2: {
    sourceKeywords: ['sains', 'misteri', 'kesehatan', 'bencana', 'tekno', 'arkeologi'],
    urlPatterns: [/\/sains/i, /\/tekno/i, /\/kesehatan/i, /\/bencana/i, /\/misteri/i, /\/arkeologi/i, /\/health/i],
    categoryTags: ['sains', 'science', 'kesehatan', 'health', 'bencana', 'misteri', 'arkeologi', 'kematian', 'jenazah'],
    strongKeywords: [
      'jenazah', 'jasad', 'kerangka', 'tengkorak', 'mayat', 'makam', 'pemakaman', 'kuburan', 'kubur',
      'kain kafan', 'nisan', 'liang lahat', 'autopsi', 'forensik', 'visum', 'kematian', 'meninggal dunia',
      'wafat', 'tewas', 'gugur', 'korban tewas', 'korban jiwa', 'sakaratul maut', 'sains', 'ilmuwan',
      'arkeologi', 'fosil', 'penelitian ilmiah', 'astronomi', 'luar angkasa', 'komet', 'asteroid', 'gerhana',
      'meteor', 'bencana alam', 'gempa bumi', 'tsunami', 'letusan gunung', 'gunung meletus', 'erupsi',
      'lahar dingin', 'tanah longsor', 'banjir bandang', 'tim sar', 'evakuasi jasad', 'penyakit langka',
      'wabah', 'virus', 'pandemi', 'gagal jantung'
    ],
    generalKeywords: [
      'misteri', 'alam semesta', 'kesehatan', 'medis', 'rumah sakit', 'ruang jenazah', 'ambulans', 'dokter forensik',
      'dna', 'purba', 'arkeolog', 'supranatural', 'tenggelam', 'kecelakaan maut', 'tabrakan maut', 'fenomena alam'
    ]
  },

  // Category 5: Budaya & Religi
  5: {
    sourceKeywords: ['religi', 'khazanah', 'budaya', 'agama', 'islam'],
    urlPatterns: [/\/religi/i, /\/khazanah/i, /\/budaya/i, /\/islam/i, /\/ramadan/i, /\/ramadhan/i, /\/khatulistiwa/i],
    categoryTags: ['religi', 'agama', 'religion', 'budaya', 'culture', 'islam', 'kristen', 'pesantren', 'tradisi'],
    strongKeywords: [
      'agama', 'religi', 'spiritual', 'islam', 'muslim', 'al-qur\'an', 'alquran', 'hadits', 'ulama', 'kiai',
      'ustadz', 'ustadzah', 'mui', 'pesantren', 'santri', 'haji', 'umrah', 'tanah suci', 'mekkah', 'madinah',
      'masjid', 'musholla', 'shalat', 'puasa', 'ramadhan', 'idul fitri', 'idul adha', 'kurban', 'zakat',
      'fatwa', 'kristen', 'katolik', 'protestan', 'gereja', 'paus fransiskus', 'vatikan', 'pendeta', 'pastur',
      'misa', 'alkitab', 'hindu', 'pura', 'nyepi', 'buddha', 'waisak', 'vihara', 'konghucu', 'kelenteng',
      'adat istiadat', 'upacara adat', 'ritual adat', 'pemakaman adat', 'toraja', 'ngaben', 'kebudayaan',
      'cagar budaya', 'eskatologi', 'akhir zaman', 'kiamat', 'surga', 'neraka'
    ],
    generalKeywords: [
      'budaya', 'tradisi', 'warisan', 'ibadah', 'doa', 'keimanan', 'spiritualitas', 'khutbah', 'ceramah',
      'etika', 'moral', 'kearifan lokal', 'kitab suci', 'keagamaan', 'toleransi'
    ]
  },

  // Category 6: Opini & Refleksi
  6: {
    sourceKeywords: ['opini', 'kolom', 'editorial', 'refleksi', 'tajuk'],
    urlPatterns: [/\/opini/i, /\/kolom/i, /\/editorial/i, /\/refleksi/i, /\/tajuk/i, /\/sudut-pandang/i],
    categoryTags: ['opini', 'opinion', 'kolom', 'editorial', 'refleksi', 'esai', 'analisis'],
    strongKeywords: [
      'tajuk rencana', 'editorial', 'opini', 'kolom opini', 'refleksi', 'perenungan', 'catatan redaksi',
      'sudut pandang', 'esai', 'analisis kritis', 'hikmah', 'pelajaran berharga', 'muhasabah', 'introspeksi',
      'filsafat', 'filosofis', 'catatan pinggir'
    ],
    generalKeywords: [
      'pandangan', 'gagasan', 'tulisan', 'perspektif', 'ulasan', 'renungan', 'makna hidup', 'pengingat'
    ]
  }
};

/**
 * Automatically classify news into one of the 6 CALON JENAZAH categories.
 * 
 * @param {Object} item
 * @param {string} item.title - Article title
 * @param {string} [item.summary] - Article summary/excerpt
 * @param {string} [item.content] - Full or partial content
 * @param {string} [item.url] - Target news URL
 * @param {string} [item.sourceFeed] - RSS feed name or source label
 * @param {string|string[]} [item.rawCategories] - Raw category tags from RSS feed or HTML meta
 * @returns {Object} { category_id: number, category_name: string, confidence: number }
 */
function classifyNewsCategory({ title = '', summary = '', content = '', url = '', sourceFeed = '', rawCategories = [] }) {
  const scores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const combinedText = `${title} ${summary} ${content}`.toLowerCase();
  const lowerUrl = (url || '').toLowerCase();
  const lowerSource = (sourceFeed || '').toLowerCase();

  // Normalize raw categories from RSS or meta tags
  let tagList = [];
  if (Array.isArray(rawCategories)) {
    tagList = rawCategories.map(c => (typeof c === 'string' ? c : c._ || c.name || '')).filter(Boolean);
  } else if (typeof rawCategories === 'string') {
    tagList = rawCategories.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
  }
  const lowerTags = tagList.map(t => t.toLowerCase());

  // Evaluate each category rules
  for (const [catIdStr, rules] of Object.entries(CATEGORY_RULES)) {
    const catId = Number(catIdStr);

    // 1. Check Source Feed name keywords (Strong bias +10)
    for (const srcKey of rules.sourceKeywords) {
      if (lowerSource.includes(srcKey)) {
        scores[catId] += 10;
        break;
      }
    }

    // 2. Check Raw RSS/HTML Category Tags (+8 each)
    for (const tag of lowerTags) {
      for (const catTag of rules.categoryTags) {
        if (tag.includes(catTag) || catTag.includes(tag)) {
          scores[catId] += 8;
        }
      }
    }

    // 3. Check Target Article URL Patterns (+6 each)
    for (const pattern of rules.urlPatterns) {
      if (pattern.test(lowerUrl)) {
        scores[catId] += 6;
      }
    }

    // 4. Check Strong Keywords in Title (weight 4) and Body (weight 2)
    const lowerTitle = (title || '').toLowerCase();
    for (const word of rules.strongKeywords) {
      // Regex word boundary or plain include for Indonesian phrases
      if (lowerTitle.includes(word)) {
        scores[catId] += 4;
      } else if (combinedText.includes(word)) {
        scores[catId] += 2;
      }
    }

    // 5. Check General Keywords in Title (weight 2) and Body (weight 1)
    for (const word of rules.generalKeywords) {
      if (lowerTitle.includes(word)) {
        scores[catId] += 2;
      } else if (combinedText.includes(word)) {
        scores[catId] += 1;
      }
    }
  }

  // Find category with highest score
  let bestCatId = 1;
  let maxScore = -1;

  for (const [catIdStr, score] of Object.entries(scores)) {
    const catId = Number(catIdStr);
    if (score > maxScore) {
      maxScore = score;
      bestCatId = catId;
    }
  }

  // Fallback defaults if score is 0
  if (maxScore <= 0) {
    // If source feed is Antara Hukum -> 1
    if (lowerSource.includes('hukum')) bestCatId = 1;
    // If source feed is Antara Politik -> 4
    else if (lowerSource.includes('politik')) bestCatId = 4;
    else bestCatId = 1; // Default to Investigasi & Kriminal for Calon Jenazah
  }

  const categoryObj = CATEGORIES.find(c => c.id === bestCatId) || CATEGORIES[0];

  return {
    category_id: categoryObj.id,
    category_name: categoryObj.name,
    category_slug: categoryObj.slug,
    confidenceScore: maxScore
  };
}

module.exports = {
  CATEGORIES,
  classifyNewsCategory
};
