import React, { useState, useEffect } from 'react';
import { 
  Cpu, Play, Download, CheckCircle2, Clock, 
  ExternalLink, Eye, AlertCircle, Sparkles, Filter, CheckSquare, Square,
  RefreshCw, Layers
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

  const [crawledArticles, setCrawledArticles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetCategory, setTargetCategory] = useState('auto');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [importing, setImporting] = useState(false);
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
      body: JSON.stringify({ url: targetUrl, name: targetName })
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

  // Filtered queue items based on categoryFilter
  const filteredArticles = crawledArticles.filter(item => {
    if (categoryFilter === 'all') return true;
    return String(item.category_id) === String(categoryFilter);
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

  // Toggle selection
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    const pendingIds = filteredArticles.filter(a => a.status === 'pending').map(a => a.id);
    setSelectedIds(pendingIds);
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
          setImportResultMsg(`Berhasil mengimpor ${successCount} berita langsung ke portal CALON JENAZAH!`);
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
          Tarik puluhan artikel berita terbaru sekaligus dari feed sindikasi media nasional dan global. Anda dapat memilih berita yang relevan dan mengimpornya langsung ke portal CALON JENAZAH dengan 1 kali klik.
        </p>
      </div>

      {/* Crawl Control Center */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        marginBottom: '30px'
      }}>
        <h3 className="display-font" style={{ fontSize: '1.05rem', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>
          Pilih Sumber Berita untuk Dicrawl
        </h3>

        {/* Source preset buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          {sources.map((src) => (
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
              ✅ Crawl dari <strong>{crawlResult.source}</strong> selesai: Ditemukan {crawlResult.totalFound} berita ({crawlResult.newItemsAdded} baru ditambahkan ke antrian).
            </span>
          </div>
        )}
      </div>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <h3 className="display-font" style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>
              Antrian Berita Hasil Crawl ({crawledArticles.length})
            </h3>
            <button
              onClick={selectAll}
              style={{ fontSize: '0.75rem', color: 'var(--accent-crimson)', textDecoration: 'underline' }}
            >
              Pilih Semua Pending
            </button>
            <button
              onClick={deselectAll}
              style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
            >
              Batal Pilih
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
                opacity: selectedIds.length === 0 || importing ? 0.5 : 1
              }}
            >
              <Download size={14} />
              <span>{importing ? 'Mengimpor...' : `Import (${selectedIds.length}) ke Portal`}</span>
            </button>
          </div>
        </div>

        {/* Sync Feedback Message */}
        {syncMsg && (
          <div style={{ padding: '10px 20px', background: 'rgba(212,175,55,0.15)', color: 'var(--accent-gold)', fontSize: '0.82rem', borderBottom: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} />
            <span>{syncMsg}</span>
          </div>
        )}

        {importResultMsg && (
          <div style={{ padding: '12px 20px', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: '0.85rem' }}>
            {importResultMsg}
          </div>
        )}

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
                <th style={{ padding: '10px 14px', width: '40px' }}>Pilih</th>
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
                    {categoryFilter === 'all' 
                      ? 'Belum ada artikel hasil crawl. Pilih salah satu sumber di atas untuk memulai crawling!'
                      : 'Tidak ada berita di antrian dengan kategori ini. Ubah filter kategori untuk melihat berita lainnya.'}
                  </td>
                </tr>
              ) : (
                filteredArticles.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isImported = item.status === 'imported';
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: isImported ? 0.6 : 1 }}>
                      <td style={{ padding: '10px 14px' }}>
                        {!isImported && (
                          <button onClick={() => toggleSelect(item.id)}>
                            {isSelected ? <CheckSquare size={16} color="var(--accent-crimson)" /> : <Square size={16} color="var(--text-muted)" />}
                          </button>
                        )}
                      </td>

                      <td style={{ padding: '10px 14px', color: '#fff', fontWeight: '600', maxWidth: '360px' }}>
                        <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.title}
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                        {item.source_feed}
                      </td>

                      {/* Interactive Inline Category Selector */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <select
                          value={item.category_id || 1}
                          disabled={isImported}
                          onChange={(e) => handleItemCategoryChange(item.id, e.target.value)}
                          style={{
                            background: '#0a0d14',
                            border: '1px solid rgba(212, 175, 55, 0.35)',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            color: 'var(--accent-gold)',
                            cursor: isImported ? 'not-allowed' : 'pointer',
                            outline: 'none'
                          }}
                          title="Klik untuk mengubah & menyinkronkan kategori berita ini"
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
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          background: isImported ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                          color: isImported ? '#34d399' : '#fbbf24'
                        }}>
                          {isImported ? 'Terbit di Portal' : 'Antrian'}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => setPreviewItem(item)}
                            style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', color: '#fff', fontSize: '0.75rem' }}
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
