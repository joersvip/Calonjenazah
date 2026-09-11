import React, { useState, useEffect } from 'react';
import { 
  Cpu, Play, Download, CheckCircle2, Clock, 
  ExternalLink, Eye, AlertCircle, Sparkles, Filter, CheckSquare, Square,
  RefreshCw, Layers, Zap, Check, Calendar, Sliders, Search, ShieldCheck
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  { id: 1, name: 'Investigasi & Kriminal' },
  { id: 2, name: 'Misteri & Sains Ajal' },
  { id: 3, name: 'Hukum & Keadilan' },
  { id: 4, name: 'Politik & Kuasa' },
  { id: 5, name: 'Budaya & Religi' },
  { id: 6, name: 'Opini & Refleksi' }
];

export default function CrawlerStudio({ navigate }) {
  const [sources, setSources] = useState([]);
  const [selectedSourceUrl, setSelectedSourceUrl] = useState('');
  const [selectedSourceName, setSelectedSourceName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState(null);

  // Sub-tab: manual crawl vs automated scheduler
  const [activeSubTab, setActiveSubTab] = useState('manual'); // 'manual' | 'scheduler'
  const [autoCrawlConfig, setAutoCrawlConfig] = useState({
    enabled: false,
    mode: 'interval',
    intervalMinutes: 60,
    dailyTimes: '06:00,12:00,18:00',
    action: 'queue',
    sources: 'all',
    maxPerSource: 10,
    lastRun: null,
    lastResult: 'Belum pernah dijalankan',
    nextRun: null,
    isRunning: false
  });
  const [savingScheduler, setSavingScheduler] = useState(false);
  const [schedulerSaveSuccess, setSchedulerSaveSuccess] = useState(false);
  const [triggeringAutoCrawl, setTriggeringAutoCrawl] = useState(false);
  const [autoCrawlMessage, setAutoCrawlMessage] = useState('');

  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceFilterTag, setSourceFilterTag] = useState('all');
  const [crawledArticles, setCrawledArticles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetCategory, setTargetCategory] = useState('auto');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'imported'
  const [queueSearch, setQueueSearch] = useState('');
  const [isSyncingWithArticles, setIsSyncingWithArticles] = useState(false);
  const [syncArticlesMsg, setSyncArticlesMsg] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [importing, setImporting] = useState(false);
  const [isSavingAllPending, setIsSavingAllPending] = useState(false);
  const [autoSaveToServer, setAutoSaveToServer] = useState(true);
  const [importResultMsg, setImportResultMsg] = useState('');
  const [previewItem, setPreviewItem] = useState(null);

  // Fetch presets and crawled history
  const loadData = () => {
    fetch('/api/crawler/sources')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.sources.length > 0) {
          setSources(data.sources);
          setSelectedSourceUrl(data.sources[0].url);
          setSelectedSourceName(data.sources[0].name);
        }
      })
      .catch(() => {});

    fetch('/api/crawler/articles')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCrawledArticles(data.articles);
        }
      })
      .catch(() => {});

    fetch('/api/crawler/scheduler')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setAutoCrawlConfig(data.config);
        }
      })
      .catch(() => {});
  };

  const handleSaveScheduler = (e) => {
    e.preventDefault();
    setSavingScheduler(true);
    fetch('/api/crawler/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(autoCrawlConfig)
    })
      .then(res => res.json())
      .then(data => {
        setSavingScheduler(false);
        if (data.success) {
          setSchedulerSaveSuccess(true);
          if (data.config) setAutoCrawlConfig(data.config);
          setTimeout(() => setSchedulerSaveSuccess(false), 3500);
        } else {
          alert('Gagal menyimpan jadwal: ' + data.error);
        }
      })
      .catch(() => {
        setSavingScheduler(false);
        alert('Terjadi kesalahan jaringan saat menyimpan jadwal');
      });
  };

  const handleRunAutoCrawlNow = () => {
    setTriggeringAutoCrawl(true);
    setAutoCrawlMessage('');
    fetch('/api/crawler/scheduler/run-now', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setTriggeringAutoCrawl(false);
        if (data.success) {
          setAutoCrawlMessage(data.summary || `Berhasil merayapi ${data.totalFetched} berita baru.`);
          loadData();
        } else {
          alert('Auto crawl gagal: ' + (data.error || data.message));
        }
      })
      .catch(() => {
        setTriggeringAutoCrawl(false);
        alert('Terjadi kesalahan jaringan saat memicu auto-crawl');
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Run Crawl
  const handleRunCrawl = (urlToUse, nameToUse) => {
    const targetUrl = urlToUse || customUrl || selectedSourceUrl;
    const targetName = nameToUse || customName || selectedSourceName || 'Web Feed';

    if (!targetUrl) return;

    setIsCrawling(true);
    setCrawlResult(null);
    setImportResultMsg('');

    fetch('/api/crawler/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl, name: targetName, autoSave: autoSaveToServer })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCrawlResult(data);
          loadData(); // refresh list
        } else {
          alert('Crawl gagal: ' + data.error);
        }
        setIsCrawling(false);
      })
      .catch(err => {
        alert('Crawl error: ' + err.message);
        setIsCrawling(false);
      });
  };

  // Synchronize category for an individual item in the queue table
  const handleItemCategoryChange = (itemId, newCatId) => {
    const selectedCat = CATEGORY_OPTIONS.find(c => c.id === Number(newCatId));
    if (!selectedCat) return;

    // Optimistic UI update
    setCrawledArticles(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, category_id: selectedCat.id, category_name: selectedCat.name };
      }
      return item;
    }));

    fetch(`/api/crawler/articles/${itemId}/category`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category_id: selectedCat.id })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSyncMsg(`Kategori artikel berhasil disinkronkan ke "${selectedCat.name}"`);
          setTimeout(() => setSyncMsg(''), 3000);
        }
      })
      .catch(() => {});
  };

  // Synchronize category in batch for all selected items
  const handleBatchSyncCategory = () => {
    if (selectedIds.length === 0 || targetCategory === 'auto') return;

    const selectedCat = CATEGORY_OPTIONS.find(c => c.id === Number(targetCategory));
    if (!selectedCat) return;

    setSyncing(true);
    fetch('/api/crawler/articles/batch-category', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: selectedIds,
        category_id: selectedCat.id
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCrawledArticles(prev => prev.map(item => {
            if (selectedIds.includes(item.id)) {
              return { ...item, category_id: selectedCat.id, category_name: selectedCat.name };
            }
            return item;
          }));
          setSyncMsg(`Berhasil menyinkronkan ${selectedIds.length} artikel ke kategori "${selectedCat.name}"!`);
          setTimeout(() => setSyncMsg(''), 4000);
        }
        setSyncing(false);
      })
      .catch(() => setSyncing(false));
  };

  // Trigger synchronization between Manajemen Berita and Crawled Articles
  const handleSyncWithArticles = () => {
    setIsSyncingWithArticles(true);
    setSyncArticlesMsg('');
    fetch('/api/crawler/sync-articles', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setIsSyncingWithArticles(false);
        if (data.success) {
          setSyncArticlesMsg(`Sinkronisasi selesai: ${data.matchedCount} berita terverifikasi terbit di portal, ${data.unmatchedCount} belum diupload.`);
          loadData();
          setTimeout(() => setSyncArticlesMsg(''), 4500);
        } else {
          alert('Gagal menyinkronkan berita: ' + (data.error || data.message));
        }
      })
      .catch(err => {
        setIsSyncingWithArticles(false);
        alert('Kesalahan jaringan: ' + err.message);
      });
  };

  // Bulk save all pending crawled news directly into server database
  const handleSaveAllPending = () => {
    setIsSavingAllPending(true);
    fetch('/api/crawler/save-all-pending', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setIsSavingAllPending(false);
        if (data.success) {
          alert(data.message);
          loadData();
        } else {
          alert('Gagal menyimpan berita: ' + (data.error || data.message));
        }
      })
      .catch(err => {
        setIsSavingAllPending(false);
        alert('Kesalahan jaringan: ' + err.message);
      });
  };

  // Filtered queue items based on categoryFilter, statusFilter, and queueSearch
  const filteredArticles = crawledArticles.filter(item => {
    if (categoryFilter !== 'all' && String(item.category_id) !== String(categoryFilter)) {
      return false;
    }
    const isImported = item.status === 'imported' || Boolean(item.uploaded_article_id);
    if (statusFilter === 'pending' && isImported) {
      return false;
    }
    if (statusFilter === 'imported' && !isImported) {
      return false;
    }
    if (queueSearch.trim()) {
      const q = queueSearch.toLowerCase().trim();
      const titleMatch = (item.title || '').toLowerCase().includes(q);
      const sourceMatch = (item.source_feed || '').toLowerCase().includes(q);
      if (!titleMatch && !sourceMatch) return false;
    }
    return true;
  });

  // Calculate category counts for tabs
  const categoryCounts = {
    all: crawledArticles.length,
    1: crawledArticles.filter(a => String(a.category_id) === '1').length,
    2: crawledArticles.filter(a => String(a.category_id) === '2').length,
    3: crawledArticles.filter(a => String(a.category_id) === '3').length,
    4: crawledArticles.filter(a => String(a.category_id) === '4').length,
    5: crawledArticles.filter(a => String(a.category_id) === '5').length,
    6: crawledArticles.filter(a => String(a.category_id) === '6').length,
  };

  // Total counts for upload status
  const totalUploadedCount = crawledArticles.filter(a => a.status === 'imported' || Boolean(a.uploaded_article_id)).length;
  const totalPendingCount = crawledArticles.length - totalUploadedCount;

  // Selectable items in current filtered view: only items NOT yet imported/uploaded
  const selectableIds = filteredArticles
    .filter(a => a.status !== 'imported' && !a.uploaded_article_id)
    .map(a => a.id);

  const isAllSelectableSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.includes(id));
  const isSomeSelectableSelected = selectableIds.some(id => selectedIds.includes(id)) && !isAllSelectableSelected;

  // Toggle single item selection
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Toggle master select all for currently visible selectable items
  const toggleSelectAll = () => {
    if (isAllSelectableSelected) {
      setSelectedIds(selectedIds.filter(id => !selectableIds.includes(id)));
    } else {
      setSelectedIds(Array.from(new Set([...selectedIds, ...selectableIds])));
    }
  };

  const selectAll = () => {
    toggleSelectAll();
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  // Import Selected Articles
  const handleImport = () => {
    if (selectedIds.length === 0) return;

    setImporting(true);
    setImportResultMsg('');

    fetch('/api/crawler/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: selectedIds,
        category_id: targetCategory,
        deepScrape: true
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const successCount = data.results.filter(r => r.status === 'success').length;
          const dupCount = data.duplicatePreventedCount || 0;
          let msg = `Berhasil mengimpor ${successCount} berita langsung ke portal CALON JENAZAH!`;
          if (dupCount > 0) {
            msg += ` (${dupCount} artikel telah terbit sebelumnya dan duplikasi berhasil dicegah).`;
          }
          setImportResultMsg(msg);
          setSelectedIds([]);
          loadData();
        } else {
          alert('Import gagal: ' + data.error);
        }
        setImporting(false);
      })
      .catch(err => {
        alert('Import error: ' + err.message);
        setImporting(false);
      });
  };

  return (
    <div>
      {/* Intro Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(157,78,221,0.12) 0%, rgba(20,24,34,0.8) 100%)',
        border: '1px solid rgba(157,78,221,0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        marginBottom: '26px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Cpu size={22} color="#c77dff" />
          <h2 className="display-font" style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
            Mesin Web Crawler & RSS Harvester Otomatis
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Tarik puluhan artikel berita terbaru sekaligus dari feed sindikasi media nasional terkemuka di Indonesia. Anda dapat memilih berita yang relevan dan mengimpornya langsung ke portal CALON JENAZAH dengan 1 kali klik.
        </p>
      </div>

      {/* Sub-tab Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveSubTab('manual')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '6px',
            fontSize: '0.86rem',
            fontWeight: '700',
            background: activeSubTab === 'manual' ? 'var(--accent-crimson)' : 'var(--bg-surface)',
            color: '#fff',
            border: '1px solid',
            borderColor: activeSubTab === 'manual' ? 'var(--accent-crimson)' : 'var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <Cpu size={16} />
          <span>Manual Crawl &amp; Koleksi Sumber Berita Indonesia ({sources.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('scheduler')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '6px',
            fontSize: '0.86rem',
            fontWeight: '700',
            background: activeSubTab === 'scheduler' ? 'linear-gradient(135deg, #7b2cbf, #5a189a)' : 'var(--bg-surface)',
            color: '#fff',
            border: '1px solid',
            borderColor: activeSubTab === 'scheduler' ? '#9d4edd' : 'var(--border-subtle)',
            cursor: 'pointer'
          }}
        >
          <Clock size={16} />
          <span>Jadwal Auto-Crawl (Setting Waktu Manual)</span>
          {autoCrawlConfig.enabled ? (
            <span style={{ fontSize: '0.68rem', padding: '2px 8px', background: '#10b981', color: '#fff', borderRadius: '10px', fontWeight: '800' }}>
              ● AKTIF
            </span>
          ) : (
            <span style={{ fontSize: '0.68rem', padding: '2px 8px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', borderRadius: '10px' }}>
              OFF
            </span>
          )}
        </button>
      </div>

      {autoCrawlMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#34d399',
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{autoCrawlMessage}</span>
        </div>
      )}

      {/* TAB 2: AUTOMATED CRAWLER SCHEDULER PANEL */}
      {activeSubTab === 'scheduler' && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid rgba(157,78,221,0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '26px',
          marginBottom: '30px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
        }}>
          {/* Header & Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#c77dff" />
                <h3 className="display-font" style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
                  Pengaturan Jadwal Auto-Crawl
                </h3>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Atur waktu manual (interval menit/jam atau jam tertentu setiap hari) agar server merayapi 18 sumber berita secara otomatis di latar belakang.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                type="button"
                onClick={handleRunAutoCrawlNow}
                disabled={triggeringAutoCrawl}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(157,78,221,0.2)',
                  color: '#c77dff',
                  border: '1px solid #9d4edd',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: triggeringAutoCrawl ? 'not-allowed' : 'pointer'
                }}
              >
                <Zap size={15} className={triggeringAutoCrawl ? 'spin' : ''} />
                <span>{triggeringAutoCrawl ? 'Sedang Merayapi...' : 'Jalankan Auto-Crawl Sekarang'}</span>
              </button>
            </div>
          </div>

          {/* Real-time Status Card */}
          <div style={{
            background: '#090b10',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status Auto-Crawl</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: autoCrawlConfig.enabled ? '#10b981' : 'var(--text-muted)', marginTop: '3px' }}>
                {autoCrawlConfig.enabled ? '● AKTIF TERJADWAL' : '○ NONAKTIF'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Mode Waktu Saat Ini</div>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff', marginTop: '3px' }}>
                {autoCrawlConfig.mode === 'interval' 
                  ? `Setiap ${autoCrawlConfig.intervalMinutes} Menit` 
                  : `Jam Harian (${autoCrawlConfig.dailyTimes})`}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Terakhir Dijalankan</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                {autoCrawlConfig.lastRun ? new Date(autoCrawlConfig.lastRun).toLocaleString('id-ID') : 'Belum pernah'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Jadwal Eksekusi Berikutnya</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: '700', marginTop: '3px' }}>
                {autoCrawlConfig.enabled 
                  ? (autoCrawlConfig.nextRun ? new Date(autoCrawlConfig.nextRun).toLocaleString('id-ID') : 'Segera berjalan')
                  : 'Aktifkan untuk menjadwalkan'}
              </div>
            </div>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSaveScheduler} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* 1. Toggle Switch Active */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              background: '#0e121b',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>
                  Aktifkan Auto-Crawl Otomatis
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Server akan otomatis mengeksekusi crawl pada waktu yang Anda tentukan di bawah
                </div>
              </div>

              <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoCrawlConfig.enabled}
                  onChange={(e) => setAutoCrawlConfig({ ...autoCrawlConfig, enabled: e.target.checked })}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: autoCrawlConfig.enabled ? '#9d4edd' : '#334155',
                  transition: '.3s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: autoCrawlConfig.enabled ? '26px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '.3s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>

            {/* 2. Manual Time Mode Selector */}
            <div style={{
              background: '#0e121b',
              borderRadius: '8px',
              padding: '18px',
              border: '1px solid var(--border-subtle)'
            }}>
              <label style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '700', display: 'block', marginBottom: '12px' }}>
                Pilih Mode Pengaturan Waktu Manual:
              </label>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: autoCrawlConfig.mode === 'interval' ? 'rgba(157,78,221,0.2)' : 'var(--bg-surface)',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: autoCrawlConfig.mode === 'interval' ? '#9d4edd' : 'var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#fff'
                }}>
                  <input
                    type="radio"
                    name="crawlMode"
                    value="interval"
                    checked={autoCrawlConfig.mode === 'interval'}
                    onChange={() => setAutoCrawlConfig({ ...autoCrawlConfig, mode: 'interval' })}
                  />
                  <span>Mode 1: Berdasarkan Interval Waktu (Setiap X Menit / Jam)</span>
                </label>

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: autoCrawlConfig.mode === 'daily' ? 'rgba(157,78,221,0.2)' : 'var(--bg-surface)',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: autoCrawlConfig.mode === 'daily' ? '#9d4edd' : 'var(--border-subtle)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: '#fff'
                }}>
                  <input
                    type="radio"
                    name="crawlMode"
                    value="daily"
                    checked={autoCrawlConfig.mode === 'daily'}
                    onChange={() => setAutoCrawlConfig({ ...autoCrawlConfig, mode: 'daily' })}
                  />
                  <span>Mode 2: Jam Tertentu Setiap Hari (Setting Waktu Manual)</span>
                </label>
              </div>

              {/* Sub-setting for Mode 1: Interval */}
              {autoCrawlConfig.mode === 'interval' && (
                <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: '600' }}>
                    Pilih Frekuensi Interval Crawl:
                  </div>

                  {/* Preset quick buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {[
                      { min: 15, label: '15 Menit' },
                      { min: 30, label: '30 Menit' },
                      { min: 60, label: '1 Jam' },
                      { min: 120, label: '2 Jam' },
                      { min: 240, label: '4 Jam' },
                      { min: 360, label: '6 Jam' },
                      { min: 720, label: '12 Jam' },
                      { min: 1440, label: '24 Jam (1 Hari)' }
                    ].map(p => (
                      <button
                        type="button"
                        key={p.min}
                        onClick={() => setAutoCrawlConfig({ ...autoCrawlConfig, intervalMinutes: p.min })}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '0.78rem',
                          fontWeight: autoCrawlConfig.intervalMinutes === p.min ? '700' : '500',
                          background: autoCrawlConfig.intervalMinutes === p.min ? '#9d4edd' : 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Atau isi menit manual:</span>
                    <input
                      type="number"
                      min="5"
                      max="10080"
                      value={autoCrawlConfig.intervalMinutes}
                      onChange={(e) => setAutoCrawlConfig({ ...autoCrawlConfig, intervalMinutes: Number(e.target.value) })}
                      style={{
                        background: '#0a0d14',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '4px',
                        padding: '6px 10px',
                        fontSize: '0.85rem',
                        color: '#fff',
                        width: '100px'
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Menit</span>
                  </div>
                </div>
              )}

              {/* Sub-setting for Mode 2: Daily Specific Times */}
              {autoCrawlConfig.mode === 'daily' && (
                <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '600' }}>
                    Tentukan Jam Crawl Harian (Pisahkan dengan koma, format 24 jam JJ:MM):
                  </div>
                  <input
                    type="text"
                    value={autoCrawlConfig.dailyTimes}
                    onChange={(e) => setAutoCrawlConfig({ ...autoCrawlConfig, dailyTimes: e.target.value })}
                    placeholder="Contoh: 06:00, 12:00, 18:00, 21:00"
                    style={{
                      width: '100%',
                      background: '#0a0d14',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '10px 14px',
                      fontSize: '0.9rem',
                      color: 'var(--accent-gold)',
                      fontWeight: '700',
                      marginBottom: '10px'
                    }}
                  />

                  {/* Preset daily times buttons */}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Pilih preset waktu cepat:</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { label: 'Pagi & Sore (06:00, 18:00)', val: '06:00, 18:00' },
                      { label: 'Pagi, Siang & Malam (06:00, 12:00, 18:00)', val: '06:00, 12:00, 18:00' },
                      { label: '4x Sehari (06:00, 12:00, 18:00, 22:00)', val: '06:00, 12:00, 18:00, 22:00' },
                      { label: 'Setiap 4 Jam (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)', val: '00:00, 04:00, 08:00, 12:00, 16:00, 20:00' }
                    ].map(preset => (
                      <button
                        type="button"
                        key={preset.val}
                        onClick={() => setAutoCrawlConfig({ ...autoCrawlConfig, dailyTimes: preset.val })}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          background: autoCrawlConfig.dailyTimes === preset.val ? '#9d4edd' : 'rgba(255,255,255,0.05)',
                          color: '#fff',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Action Mode & Max Per Source */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {/* Action Mode */}
              <div style={{ background: '#0e121b', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <label style={{ fontSize: '0.82rem', color: '#fff', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                  Tindakan Setelah Berita Terambil:
                </label>
                <select
                  value={autoCrawlConfig.action}
                  onChange={(e) => setAutoCrawlConfig({ ...autoCrawlConfig, action: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#0a0d14',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '9px 12px',
                    fontSize: '0.85rem',
                    color: '#fff'
                  }}
                >
                  <option value="queue">📥 Simpan ke Antrian (Tinjau &amp; Moderasi Dulu)</option>
                  <option value="auto_publish">⚡ Langsung Terbitkan ke Portal (Auto-Publish)</option>
                </select>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  {autoCrawlConfig.action === 'auto_publish' 
                    ? 'Berita baru langsung tampil di portal dengan kategori otomatis.' 
                    : 'Berita baru disimpan di antrian tabel bawah untuk disetujui redaksi.'}
                </div>
              </div>

              {/* Max Per Source */}
              <div style={{ background: '#0e121b', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <label style={{ fontSize: '0.82rem', color: '#fff', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                  Maksimal Berita per Sumber per Siklus:
                </label>
                <select
                  value={autoCrawlConfig.maxPerSource}
                  onChange={(e) => setAutoCrawlConfig({ ...autoCrawlConfig, maxPerSource: Number(e.target.value) })}
                  style={{
                    width: '100%',
                    background: '#0a0d14',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '9px 12px',
                    fontSize: '0.85rem',
                    color: '#fff'
                  }}
                >
                  <option value={5}>5 Berita Terbaru per Sumber</option>
                  <option value={10}>10 Berita Terbaru per Sumber (Rekomendasi)</option>
                  <option value={20}>20 Berita Terbaru per Sumber</option>
                  <option value={50}>50 Berita Terbaru per Sumber</option>
                </select>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Mencegah lonjakan trafik berlebih ke server media eksternal.
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div>
                {schedulerSaveSuccess && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.85rem', fontWeight: '700' }}>
                    <Check size={16} /> Pengaturan jadwal auto-crawl berhasil disimpan!
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={savingScheduler}
                style={{
                  background: 'linear-gradient(135deg, #7b2cbf, #5a189a)',
                  color: '#fff',
                  padding: '11px 24px',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  border: 'none',
                  cursor: savingScheduler ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(123, 44, 191, 0.4)'
                }}
              >
                {savingScheduler ? 'Menyimpan...' : 'Simpan Pengaturan Jadwal Auto-Crawl'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 1: Crawl Control Center (Manual Crawl) */}
      {activeSubTab === 'manual' && (
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        marginBottom: '30px'
      }}>
        {/* Source Header & Search Filter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h3 className="display-font" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
              Pilih Sumber Berita Indonesia untuk Dicrawl ({sources.length} Sumber Tersedia)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Fokus 100% pada media nasional Indonesia: Antara, CNN Indonesia, Tempo, Detikcom, Sindonews, Republika, Suara, Liputan6, Kontan, dsb.
            </p>
          </div>

          <div>
            <input
              type="text"
              placeholder="Cari sumber Indonesia (Antara, CNN, Tempo, Detik...)"
              value={sourceSearch}
              onChange={(e) => setSourceSearch(e.target.value)}
              style={{
                background: '#0a0d14',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '7px 12px',
                fontSize: '0.8rem',
                color: '#fff',
                width: '240px'
              }}
            />
          </div>
        </div>

        {/* Quick Filter Source Tags */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '8px' }}>
          {[
            { id: 'all', label: `Semua Sumber Indonesia (${sources.length})` },
            { id: 'hukum', label: '⚖️ Hukum & Kriminal' },
            { id: 'politik', label: '🏛️ Politik & Kebijakan' },
            { id: 'daerah', label: '📰 Daerah & Peristiwa' },
            { id: 'religi', label: '✨ Religi & Humaniora' },
            { id: 'sains', label: '🌋 Bencana & Sains' }
          ].map(tag => (
            <button
              key={tag.id}
              onClick={() => setSourceFilterTag(tag.id)}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '0.72rem',
                fontWeight: sourceFilterTag === tag.id ? '700' : '500',
                background: sourceFilterTag === tag.id ? 'rgba(230,57,70,0.2)' : 'rgba(255,255,255,0.04)',
                color: sourceFilterTag === tag.id ? '#ff858d' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: sourceFilterTag === tag.id ? 'var(--accent-crimson)' : 'rgba(255,255,255,0.06)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Source preset buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          {sources
            .filter(src => {
              const q = sourceSearch.toLowerCase().trim();
              const matchSearch = !q || src.name.toLowerCase().includes(q) || src.url.toLowerCase().includes(q);
              if (!matchSearch) return false;

              if (sourceFilterTag === 'all') return true;
              const lower = (src.name + ' ' + src.url).toLowerCase();
              if (sourceFilterTag === 'hukum') return lower.includes('hukum') || lower.includes('kriminal') || lower.includes('investigasi') || lower.includes('kasus');
              if (sourceFilterTag === 'politik') return lower.includes('politik') || lower.includes('kebijakan') || lower.includes('nasional') || lower.includes('kontan') || lower.includes('cnbc');
              if (sourceFilterTag === 'daerah') return lower.includes('daerah') || lower.includes('metro') || lower.includes('peristiwa') || lower.includes('terkini') || lower.includes('suara') || lower.includes('liputan6') || lower.includes('merdeka') || lower.includes('detiknews');
              if (sourceFilterTag === 'religi') return lower.includes('religi') || lower.includes('kalam') || lower.includes('humaniora') || lower.includes('khazanah') || lower.includes('hikmah') || lower.includes('gaya-hidup');
              if (sourceFilterTag === 'sains') return lower.includes('warta bumi') || lower.includes('bencana') || lower.includes('sains');
              return true;
            })
            .map((src) => (
            <button
              key={src.id}
              onClick={() => {
                setSelectedSourceUrl(src.url);
                setSelectedSourceName(src.name);
                handleRunCrawl(src.url, src.name);
              }}
              disabled={isCrawling}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: selectedSourceUrl === src.url ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.04)',
                border: '1px solid',
                borderColor: selectedSourceUrl === src.url ? 'var(--accent-crimson)' : 'var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: '600',
                textAlign: 'left',
                transition: 'all 0.15s'
              }}
            >
              <div>
                <span style={{ display: 'block', color: '#fff' }}>{src.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Klik untuk Crawl</span>
              </div>
              <Play size={14} color="var(--accent-crimson)" />
            </button>
          ))}
        </div>

        {/* Custom Source Input */}
        <div style={{ borderTop: '1px dashed var(--border-subtle)', paddingTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Nama Sumber (misal: Tempo Nasional)..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            style={{
              flex: '1 1 200px',
              background: '#0a0d14',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '0.85rem'
            }}
          />
          <input
            type="url"
            placeholder="URL RSS Feed atau Halaman Berita..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            style={{
              flex: '2 1 300px',
              background: '#0a0d14',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '10px 14px',
              fontSize: '0.85rem'
            }}
          />
          <button
            onClick={() => handleRunCrawl(customUrl, customName)}
            disabled={isCrawling || !customUrl}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--accent-crimson)',
              color: '#fff',
              padding: '0 20px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '0.85rem',
              opacity: isCrawling || !customUrl ? 0.6 : 1
            }}
          >
            <Play size={14} />
            <span>{isCrawling ? 'Sedang Crawl...' : 'Crawl URL Ini'}</span>
          </button>
        </div>

        {/* Crawl Result Status Notification */}
        {crawlResult && (
          <div style={{
            marginTop: '16px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid #10b981',
            borderRadius: '6px',
            padding: '12px 16px',
            color: '#34d399',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>
              ✅ Crawl dari <strong>{crawlResult.source}</strong> selesai: Ditemukan {crawlResult.totalFound} berita. Sebanyak <strong>{crawlResult.savedToArticles !== undefined ? crawlResult.savedToArticles : crawlResult.newItemsAdded} berita baru</strong> otomatis tersimpan permanen di database server portal!
            </span>
          </div>
        )}
      </div>
      )}

      {/* Crawled Articles Queue */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }}>
        {/* Bulk Action Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          background: '#0c0f16'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h3 className="display-font" style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>
              Antrian Berita Hasil Crawl ({crawledArticles.length})
            </h3>

            {/* Server Auto-Save Active Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '0.74rem',
              fontWeight: '700'
            }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#34d399' }}></span>
              Server Auto-Save: AKTIF
            </div>

            {/* Save All Pending to Server Button */}
            {totalPendingCount > 0 && (
              <button
                type="button"
                onClick={handleSaveAllPending}
                disabled={isSavingAllPending}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: '1px solid #10b981',
                  color: '#fff',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: isSavingAllPending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s'
                }}
                title="Simpan seluruh berita antrian pending langsung ke database server portal"
              >
                <CheckCircle2 size={13} />
                <span>{isSavingAllPending ? 'Menyimpan...' : `⚡ Simpan Semua Pending (${totalPendingCount}) ke Server`}</span>
              </button>
            )}
            
            {/* Master Toggle Button */}
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={selectableIds.length === 0}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                color: isAllSelectableSelected ? '#fff' : 'var(--accent-gold)',
                background: isAllSelectableSelected ? 'var(--accent-crimson)' : 'rgba(212,175,55,0.12)',
                border: isAllSelectableSelected ? '1px solid var(--accent-crimson)' : '1px solid rgba(212,175,55,0.35)',
                padding: '5px 12px',
                borderRadius: '6px',
                cursor: selectableIds.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                opacity: selectableIds.length === 0 ? 0.5 : 1,
                transition: 'all 0.15s'
              }}
              title="Pilih atau batalkan semua berita di antrian yang belum diupload"
            >
              {isAllSelectableSelected ? (
                <>
                  <CheckSquare size={14} />
                  <span>Batalkan Pilihan Semua</span>
                </>
              ) : (
                <>
                  <Square size={14} />
                  <span>Pilih Semua Pending ({selectableIds.length})</span>
                </>
              )}
            </button>

            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={deselectAll}
                style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Reset Pilihan ({selectedIds.length})
              </button>
            )}

            {/* Sync with Manajemen Berita Button */}
            <button
              type="button"
              onClick={handleSyncWithArticles}
              disabled={isSyncingWithArticles}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                color: '#60a5fa',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700',
                cursor: isSyncingWithArticles ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s'
              }}
              title="Singkronkan status antrian crawler dengan Manajemen Berita untuk menghindari duplikasi berita yang diupload"
            >
              <RefreshCw size={13} className={isSyncingWithArticles ? 'spinning' : ''} />
              <span>{isSyncingWithArticles ? 'Menyinkronkan...' : '🔄 Sinkronkan dgn Manajemen Berita'}</span>
            </button>
          </div>

          {/* Import Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Kategori Masuk:</span>
            <select
              value={targetCategory}
              onChange={(e) => {
                setTargetCategory(e.target.value);
                if (e.target.value !== 'auto') {
                  setCategoryFilter(e.target.value);
                }
              }}
              style={{
                background: '#0a0d14',
                border: targetCategory === 'auto' ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                color: targetCategory === 'auto' ? 'var(--accent-gold)' : '#fff',
                fontWeight: targetCategory === 'auto' ? '700' : 'normal',
                outline: 'none'
              }}
            >
              <option value="auto">🎯 Otomatis dari Sumber Berita (Rekomendasi)</option>
              <option value="1">Investigasi & Kriminal</option>
              <option value="2">Misteri & Sains Ajal</option>
              <option value="3">Hukum & Keadilan</option>
              <option value="4">Politik & Kuasa</option>
              <option value="5">Budaya & Religi</option>
              <option value="6">Opini & Refleksi</option>
            </select>

            {/* Batch Category Sync Button */}
            {selectedIds.length > 0 && targetCategory !== 'auto' && (
              <button
                type="button"
                onClick={handleBatchSyncCategory}
                disabled={syncing}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(212,175,55,0.15)',
                  border: '1px solid var(--accent-gold)',
                  color: 'var(--accent-gold)',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
                title="Sinkronkan kategori berita yang dipilih di antrian ke kategori ini"
              >
                <RefreshCw size={13} className={syncing ? 'spinning' : ''} />
                <span>Sinkronkan ({selectedIds.length}) Kategori</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleImport}
              disabled={selectedIds.length === 0 || importing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--accent-crimson)',
                color: '#fff',
                padding: '7px 18px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: '700',
                border: 'none',
                cursor: selectedIds.length === 0 || importing ? 'not-allowed' : 'pointer',
                opacity: selectedIds.length === 0 || importing ? 0.5 : 1
              }}
            >
              <Download size={14} />
              <span>{importing ? 'Mengimpor...' : `Import (${selectedIds.length}) ke Portal`}</span>
            </button>
          </div>
        </div>

        {/* Sync with Manajemen Berita Feedback Message */}
        {syncArticlesMsg && (
          <div style={{ padding: '11px 20px', background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', fontSize: '0.82rem', borderBottom: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="#60a5fa" />
            <span>{syncArticlesMsg}</span>
          </div>
        )}

        {/* Sync Feedback Message */}
        {syncMsg && (
          <div style={{ padding: '10px 20px', background: 'rgba(212,175,55,0.15)', color: 'var(--accent-gold)', fontSize: '0.82rem', borderBottom: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} />
            <span>{syncMsg}</span>
          </div>
        )}

        {importResultMsg && (
          <div style={{ padding: '12px 20px', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span>{importResultMsg}</span>
          </div>
        )}

        {/* Status Filter & Search Queue Bar */}
        <div style={{
          padding: '10px 18px',
          background: '#07090e',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status Berita:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={{
                padding: '4px 11px',
                borderRadius: '14px',
                fontSize: '0.72rem',
                fontWeight: statusFilter === 'all' ? '700' : '500',
                background: statusFilter === 'all' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                color: statusFilter === 'all' ? '#fff' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: statusFilter === 'all' ? 'rgba(255,255,255,0.3)' : 'transparent',
                cursor: 'pointer'
              }}
            >
              Semua ({crawledArticles.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              style={{
                padding: '4px 11px',
                borderRadius: '14px',
                fontSize: '0.72rem',
                fontWeight: statusFilter === 'pending' ? '700' : '500',
                background: statusFilter === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.04)',
                color: statusFilter === 'pending' ? '#fbbf24' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: statusFilter === 'pending' ? '#fbbf24' : 'transparent',
                cursor: 'pointer'
              }}
            >
              ⏳ Belum Diupload ({totalPendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('imported')}
              style={{
                padding: '4px 11px',
                borderRadius: '14px',
                fontSize: '0.72rem',
                fontWeight: statusFilter === 'imported' ? '700' : '500',
                background: statusFilter === 'imported' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.04)',
                color: statusFilter === 'imported' ? '#34d399' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: statusFilter === 'imported' ? '#10b981' : 'transparent',
                cursor: 'pointer'
              }}
            >
              ✅ Terbit di Portal ({totalUploadedCount})
            </button>
          </div>

          {/* Search input for queue */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '4px 10px' }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Cari antrian berita..."
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '0.76rem', outline: 'none', width: '180px' }}
            />
            {queueSearch && (
              <button onClick={() => setQueueSearch('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}>×</button>
            )}
          </div>
        </div>

        {/* Category Synchronization & Filter Tabs Bar */}
        <div style={{
          padding: '10px 18px',
          background: '#090b10',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '6px' }}>
            <Filter size={13} />
            Singkronkan Filter Kategori:
          </span>

          <button
            onClick={() => { setCategoryFilter('all'); }}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '0.74rem',
              fontWeight: '700',
              background: categoryFilter === 'all' ? 'var(--accent-crimson)' : 'rgba(255,255,255,0.06)',
              color: categoryFilter === 'all' ? '#fff' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: categoryFilter === 'all' ? 'var(--accent-crimson)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            Semua Antrian ({categoryCounts.all})
          </button>

          {CATEGORY_OPTIONS.map(cat => {
            const isActive = categoryFilter === String(cat.id);
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setCategoryFilter(String(cat.id));
                  setTargetCategory(String(cat.id));
                }}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.74rem',
                  fontWeight: isActive ? '700' : '500',
                  background: isActive ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Crawled List Table */}
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                {/* Master checkbox in column header */}
                <th style={{ padding: '10px 14px', width: '48px' }}>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={selectableIds.length === 0}
                    title={isAllSelectableSelected ? 'Batalkan pilihan semua' : `Pilih semua berita (${selectableIds.length})`}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: selectableIds.length === 0 ? 'not-allowed' : 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isAllSelectableSelected ? 'var(--accent-crimson)' : 'var(--text-muted)',
                      opacity: selectableIds.length === 0 ? 0.3 : 1
                    }}
                  >
                    {isAllSelectableSelected ? (
                      <CheckSquare size={17} color="var(--accent-crimson)" />
                    ) : isSomeSelectableSelected ? (
                      <div style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '3px',
                        border: '2px solid var(--accent-crimson)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(230,57,70,0.2)'
                      }}>
                        <div style={{ width: '8px', height: '2px', background: 'var(--accent-crimson)', borderRadius: '1px' }} />
                      </div>
                    ) : (
                      <Square size={17} />
                    )}
                  </button>
                </th>
                <th style={{ padding: '10px 14px' }}>Judul Berita</th>
                <th style={{ padding: '10px 14px' }}>Sumber Feed</th>
                <th style={{ padding: '10px 14px' }}>Kategori Berita</th>
                <th style={{ padding: '10px 14px' }}>Waktu Terbit</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {categoryFilter === 'all' && statusFilter === 'all' && !queueSearch
                      ? 'Belum ada artikel hasil crawl. Pilih salah satu sumber di atas untuk memulai crawling!'
                      : 'Tidak ada berita di antrian yang cocok dengan filter yang aktif saat ini.'}
                  </td>
                </tr>
              ) : (
                filteredArticles.map((item) => {
                  const isUploaded = item.status === 'imported' || Boolean(item.uploaded_article_id);
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isSelected ? 'rgba(230,57,70,0.08)' : isUploaded ? 'rgba(16,185,129,0.03)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--accent-crimson)' : isUploaded ? '3px solid #10b981' : '3px solid transparent',
                        opacity: isUploaded ? 0.8 : 1,
                        transition: 'all 0.15s'
                      }}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        {isUploaded ? (
                          <span title="Berita ini sudah terbit di Manajemen Berita (terhindar dari duplikasi)" style={{ display: 'inline-flex', alignItems: 'center', color: '#10b981' }}>
                            <CheckCircle2 size={16} />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleSelect(item.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                            title={isSelected ? 'Batalkan pilihan' : 'Pilih berita untuk diupload/import'}
                          >
                            {isSelected ? <CheckSquare size={16} color="var(--accent-crimson)" /> : <Square size={16} color="var(--text-muted)" />}
                          </button>
                        )}
                      </td>

                      <td style={{ padding: '10px 14px', color: '#fff', fontWeight: '600', maxWidth: '360px' }}>
                        <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.title}
                        </div>
                        {isUploaded && (
                          <div style={{ marginTop: '3px' }}>
                            <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <ShieldCheck size={11} /> Terverifikasi ada di Manajemen Berita
                            </span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        {item.source_feed}
                      </td>

                      {/* Interactive Inline Category Selector */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <select
                          value={item.category_id || 1}
                          disabled={isUploaded}
                          onChange={(e) => handleItemCategoryChange(item.id, e.target.value)}
                          style={{
                            background: '#0a0d14',
                            border: '1px solid rgba(212, 175, 55, 0.35)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: 'var(--accent-gold)',
                            cursor: isUploaded ? 'not-allowed' : 'pointer',
                            outline: 'none',
                            opacity: isUploaded ? 0.6 : 1
                          }}
                          title={isUploaded ? 'Berita sudah terbit' : 'Klik untuk mengubah & menyinkronkan kategori berita ini'}
                        >
                          {CATEGORY_OPTIONS.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {new Date(item.pub_date || item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        {isUploaded ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              background: 'rgba(16,185,129,0.15)',
                              color: '#34d399',
                              width: 'fit-content'
                            }}>
                              <CheckCircle2 size={11} /> Terbit di Portal
                            </span>
                            {item.uploaded_article_slug && (
                              <a
                                href={`#/berita/${item.uploaded_article_slug}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '0.68rem', color: 'var(--accent-gold)', textDecoration: 'underline' }}
                              >
                                Lihat Berita ↗
                              </a>
                            )}
                          </div>
                        ) : (
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            background: 'rgba(245,158,11,0.15)',
                            color: '#fbbf24'
                          }}>
                            ⏳ Antrian Baru
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem', border: 'none', cursor: 'pointer' }}
                            title="Pratinjau artikel"
                          >
                            <Eye size={13} />
                          </button>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}
                            title="Buka tautan asli di tab baru"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }} onClick={() => setPreviewItem(null)}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span className="badge-source">{previewItem.source_feed}</span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.74rem',
                fontWeight: '700',
                background: 'rgba(212, 175, 55, 0.15)',
                color: 'var(--accent-gold)',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}>
                <Sparkles size={11} />
                Kategori Terdeteksi: {previewItem.category_name || 'Investigasi & Kriminal'}
              </span>
            </div>
            <h3 className="editorial-title" style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '14px' }}>{previewItem.title}</h3>
            {previewItem.image_url && (
              <img src={previewItem.image_url} alt="" style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '6px', marginBottom: '16px' }} />
            )}
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '20px' }}>{previewItem.summary}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setPreviewItem(null)}
                style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setSelectedIds([previewItem.id]);
                  setPreviewItem(null);
                  handleImport();
                }}
                style={{ padding: '8px 18px', background: 'var(--accent-crimson)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', fontWeight: '700' }}
              >
                Import Artikel Ini Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
