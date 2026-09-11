import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, Edit3, Flame, 
  ExternalLink, Eye, Check, X, Search,
  CheckSquare, Square, MinusSquare, FolderEdit,
  Filter, CheckCircle2, RefreshCw
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Investigasi & Kriminal' },
  { id: 2, name: 'Misteri & Sains Ajal' },
  { id: 3, name: 'Hukum & Keadilan' },
  { id: 4, name: 'Politik & Kuasa' },
  { id: 5, name: 'Budaya & Religi' },
  { id: 6, name: 'Opini & Refleksi' }
];

export default function ArticleManagement({ navigate }) {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Multi-Selection State
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchCategory, setBatchCategory] = useState('');

  // New Article Form
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('1');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newAuthor, setNewAuthor] = useState('Redaksi Calon Jenazah');
  const [newFeatured, setNewFeatured] = useState(false);
  const [newBreaking, setNewBreaking] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchArticles = () => {
    setLoading(true);
    fetch('/api/admin/articles')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setArticles(data.articles);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchCategories = () => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.categories?.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  // Filtered Articles based on search & category
  const filtered = articles.filter(a => {
    const matchesSearch = !search.trim() || 
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.category_name && a.category_name.toLowerCase().includes(search.toLowerCase())) ||
      (a.author && a.author.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || String(a.category_id) === String(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  // Selection Logic
  const filteredIds = filtered.map(a => a.id);
  const isAllFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));
  const isSomeFilteredSelected = filteredIds.some(id => selectedIds.includes(id)) && !isAllFilteredSelected;

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      // Unselect all currently filtered
      const filterSet = new Set(filteredIds);
      setSelectedIds(prev => prev.filter(id => !filterSet.has(id)));
    } else {
      // Select all currently filtered
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSelectEntireDatabase = () => {
    setSelectedIds(articles.map(a => a.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Hapus artikel: "${title}"? Tindakan ini tidak dapat dibatalkan.`)) {
      fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setArticles(articles.filter(a => a.id !== id));
            setSelectedIds(prev => prev.filter(itemId => itemId !== id));
          }
        })
        .catch(() => {});
    }
  };

  // Bulk Delete
  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`YAKIN HAPUS ${selectedIds.length} BERITA TERPILIH?\n\nTindakan ini permanen dan akan menghapus semua berita terpilih beserta komentar terkait dari database.`)) {
      return;
    }

    setIsBatchProcessing(true);
    fetch('/api/admin/articles/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds })
    })
      .then(res => res.json())
      .then(data => {
        setIsBatchProcessing(false);
        if (data.success) {
          const removedSet = new Set(selectedIds);
          setArticles(prev => prev.filter(a => !removedSet.has(a.id)));
          setSelectedIds([]);
        } else {
          alert(data.error || 'Gagal menghapus berita terpilih');
        }
      })
      .catch(err => {
        setIsBatchProcessing(false);
        alert('Terjadi kesalahan jaringan saat menghapus berita.');
      });
  };

  // Bulk Change Category
  const handleBatchCategoryChange = () => {
    if (!batchCategory || selectedIds.length === 0) return;
    const cat = categories.find(c => c.id === Number(batchCategory));
    const catName = cat ? cat.name : 'Kategori Terpilih';

    if (!window.confirm(`Pindahkan ${selectedIds.length} berita terpilih ke kategori "${catName}"?`)) {
      return;
    }

    setIsBatchProcessing(true);
    fetch('/api/admin/articles/batch-category', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, category_id: Number(batchCategory) })
    })
      .then(res => res.json())
      .then(data => {
        setIsBatchProcessing(false);
        if (data.success) {
          const selectedSet = new Set(selectedIds);
          setArticles(prev => prev.map(a => 
            selectedSet.has(a.id) 
              ? { ...a, category_id: Number(batchCategory), category_name: catName } 
              : a
          ));
          setBatchCategory('');
        } else {
          alert(data.error || 'Gagal memindahkan kategori');
        }
      })
      .catch(() => {
        setIsBatchProcessing(false);
        alert('Terjadi kesalahan jaringan.');
      });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setSaving(true);
    fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        summary: newSummary || newTitle,
        content: newContent,
        category_id: Number(newCategory),
        image_url: newImageUrl || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1000&q=80',
        author: newAuthor,
        is_featured: newFeatured,
        is_breaking: newBreaking,
        status: 'published'
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setShowCreateModal(false);
          setNewTitle('');
          setNewSummary('');
          setNewContent('');
          fetchArticles();
        }
        setSaving(false);
      })
      .catch(() => setSaving(false));
  };

  return (
    <div>
      {/* Top Controls Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {/* Left Side: Search & Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          {/* Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '8px 12px',
            minWidth: '240px',
            maxWidth: '340px',
            flex: 1
          }}>
            <Search size={15} color="var(--text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Cari judul, rubrik, penulis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.85rem',
                color: '#fff'
              }}
            />
            {search && (
              <button 
                onClick={() => setSearch('')} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0 10px' }}>
            <Filter size={14} color="var(--text-muted)" style={{ marginRight: '6px' }} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '0.82rem',
                padding: '8px 0',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all" style={{ background: '#10141e' }}>Semua Rubrik ({articles.length})</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id} style={{ background: '#10141e' }}>
                  {cat.name} ({articles.filter(a => a.category_id === cat.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* Explicit "PILIH SEMUA" button */}
          <button
            onClick={handleToggleSelectAllFiltered}
            disabled={filtered.length === 0}
            title={isAllFilteredSelected ? 'Batalkan pilihan semua berita' : `Pilih semua ${filtered.length} berita yang tampil`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: '600',
              cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
              border: isAllFilteredSelected 
                ? '1px solid var(--accent-gold)' 
                : '1px solid var(--border-subtle)',
              background: isAllFilteredSelected 
                ? 'rgba(212, 175, 55, 0.15)' 
                : 'var(--bg-surface)',
              color: isAllFilteredSelected ? 'var(--accent-gold)' : '#fff',
              transition: 'all 0.2s ease'
            }}
          >
            {isAllFilteredSelected ? (
              <CheckSquare size={15} color="var(--accent-gold)" />
            ) : isSomeFilteredSelected ? (
              <MinusSquare size={15} color="var(--accent-gold)" />
            ) : (
              <Square size={15} color="var(--text-muted)" />
            )}
            <span>
              {isAllFilteredSelected 
                ? `Batal Pilih (${filtered.length})` 
                : `PILIH SEMUA (${filtered.length})`}
            </span>
          </button>
        </div>

        {/* Right Side: Refresh & Add Article Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={fetchArticles}
            title="Muat Ulang Berita"
            style={{
              padding: '9px 12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--accent-crimson)',
              color: '#fff',
              padding: '9px 18px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(230,57,70,0.3)',
              border: 'none'
            }}
          >
            <Plus size={16} />
            <span>Tulis Artikel Baru</span>
          </button>
        </div>
      </div>

      {/* Floating / Sticky Batch Action Bar when items are selected */}
      {selectedIds.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(20, 24, 34, 0.98), rgba(12, 15, 22, 0.98))',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 0 15px rgba(212,175,55,0.1)',
          animation: 'fadeIn 0.2s ease-in'
        }}>
          {/* Status info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(212, 175, 55, 0.15)',
              color: 'var(--accent-gold)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '0.85rem'
            }}>
              <CheckSquare size={16} />
              <span>{selectedIds.length} Berita Dipilih</span>
            </div>

            {selectedIds.length < articles.length && (
              <button
                onClick={handleSelectEntireDatabase}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  textDecoration: 'underline',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Pilih seluruh {articles.length} berita di database
              </button>
            )}

            <button
              onClick={handleDeselectAll}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Batalkan Pilihan
            </button>
          </div>

          {/* Batch Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Batch Category Move */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-surface)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <FolderEdit size={14} color="var(--accent-gold)" />
              <select
                value={batchCategory}
                onChange={(e) => setBatchCategory(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '170px'
                }}
              >
                <option value="" style={{ background: '#10141e' }}>-- Ubah Kategori --</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#10141e' }}>{c.name}</option>
                ))}
              </select>
              <button
                onClick={handleBatchCategoryChange}
                disabled={!batchCategory || isBatchProcessing}
                style={{
                  background: batchCategory ? 'var(--accent-gold)' : 'rgba(255,255,255,0.08)',
                  color: batchCategory ? '#000' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  cursor: batchCategory ? 'pointer' : 'not-allowed'
                }}
              >
                Terapkan
              </button>
            </div>

            {/* Batch Delete */}
            <button
              onClick={handleBatchDelete}
              disabled={isBatchProcessing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--accent-crimson)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 14px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: isBatchProcessing ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 10px rgba(230,57,70,0.4)'
              }}
            >
              <Trash2 size={14} />
              <span>{isBatchProcessing ? 'Menghapus...' : `Hapus Terpilih (${selectedIds.length})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Articles Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#0c0f16', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                {/* Master Checkbox Header */}
                <th style={{ padding: '12px 14px', width: '48px', textAlign: 'center' }}>
                  <div
                    onClick={handleToggleSelectAllFiltered}
                    title={isAllFilteredSelected ? 'Batalkan pilihan semua' : 'PILIH SEMUA berita'}
                    style={{
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px'
                    }}
                  >
                    {isAllFilteredSelected ? (
                      <CheckSquare size={17} color="var(--accent-gold)" />
                    ) : isSomeFilteredSelected ? (
                      <MinusSquare size={17} color="var(--accent-gold)" />
                    ) : (
                      <Square size={17} color="var(--text-muted)" />
                    )}
                  </div>
                </th>
                <th style={{ padding: '12px 14px' }}>Berita</th>
                <th style={{ padding: '12px 14px' }}>Kategori Rubrik</th>
                <th style={{ padding: '12px 14px' }}>Penulis</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>Tayangan</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Memuat daftar berita...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Tidak ada berita ditemukan {search && `untuk pencarian "${search}"`}.
                  </td>
                </tr>
              ) : (
                filtered.map((art) => {
                  const isSelected = selectedIds.includes(art.id);
                  return (
                    <tr 
                      key={art.id} 
                      style={{ 
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: isSelected ? 'rgba(230, 57, 70, 0.08)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Row Checkbox */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div
                          onClick={() => handleToggleSelect(art.id)}
                          style={{
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px'
                          }}
                        >
                          {isSelected ? (
                            <CheckSquare size={17} color="var(--accent-crimson)" />
                          ) : (
                            <Square size={17} color="rgba(255,255,255,0.25)" />
                          )}
                        </div>
                      </td>

                      {/* Title & Thumbnail */}
                      <td style={{ padding: '12px 14px', maxWidth: '360px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {art.image_url && (
                            <img 
                              src={art.image_url} 
                              alt="" 
                              style={{ 
                                width: '48px', 
                                height: '36px', 
                                objectFit: 'cover', 
                                borderRadius: '4px',
                                flexShrink: 0
                              }} 
                            />
                          )}
                          <div>
                            <div 
                              onClick={() => handleToggleSelect(art.id)}
                              style={{ 
                                color: isSelected ? '#fff' : '#e2e8f0', 
                                fontWeight: '600', 
                                display: '-webkit-box', 
                                WebkitLineClamp: 2, 
                                WebkitBoxOrient: 'vertical', 
                                overflow: 'hidden',
                                cursor: 'pointer'
                              }}
                            >
                              {art.title}
                            </div>
                            {art.source_name && (
                              <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)' }}>
                                Sumber: {art.source_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          background: 'rgba(255,255,255,0.05)',
                          borderRadius: '4px',
                          fontSize: '0.78rem'
                        }}>
                          {art.category_name || 'Umum'}
                        </span>
                      </td>

                      {/* Author */}
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                        {art.author}
                      </td>

                      {/* Status Badges */}
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
                          {Boolean(art.is_featured) && (
                            <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: 'rgba(230,57,70,0.2)', color: '#ff858d', borderRadius: '3px', fontWeight: '700' }}>
                              HEADLINE
                            </span>
                          )}
                          {Boolean(art.is_breaking) && (
                            <span style={{ fontSize: '0.68rem', padding: '1px 6px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', borderRadius: '3px', fontWeight: '700' }}>
                              BREAKING
                            </span>
                          )}
                          {!art.is_featured && !art.is_breaking && (
                            <span style={{ fontSize: '0.72rem', color: '#10b981' }}>Terbit</span>
                          )}
                        </div>
                      </td>

                      {/* Views */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', color: 'var(--accent-crimson)', fontWeight: '700' }}>
                        {art.views}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button
                            onClick={() => navigate(`/berita/${art.slug}`)}
                            style={{ 
                              padding: '6px', 
                              background: 'rgba(255,255,255,0.06)', 
                              border: 'none',
                              borderRadius: '4px', 
                              color: 'var(--text-secondary)',
                              cursor: 'pointer'
                            }}
                            title="Buka di portal"
                          >
                            <ExternalLink size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(art.id, art.title)}
                            style={{ 
                              padding: '6px', 
                              background: 'rgba(230,57,70,0.15)', 
                              border: 'none',
                              borderRadius: '4px', 
                              color: '#ff858d',
                              cursor: 'pointer'
                            }}
                            title="Hapus berita ini"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div style={{
          padding: '12px 18px',
          background: '#090b10',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            Menampilkan <strong>{filtered.length}</strong> dari <strong>{articles.length}</strong> total artikel
            {selectedIds.length > 0 && (
              <span style={{ color: 'var(--accent-gold)', marginLeft: '10px' }}>
                ({selectedIds.length} dipilih)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleToggleSelectAllFiltered}
              style={{
                background: 'transparent',
                border: 'none',
                color: isAllFilteredSelected ? 'var(--accent-gold)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                textDecoration: 'underline'
              }}
            >
              {isAllFilteredSelected ? 'Batalkan Semua Pilihan' : 'Pilih Semua Berita'}
            </button>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }}>
          <form onSubmit={handleCreate} style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            maxWidth: '750px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <h3 className="display-font" style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
                Tulis Artikel Berita Baru
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Judul Berita</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.9rem', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Kategori Rubrik</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem', color: '#fff' }}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Penulis / Wartawan</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem', color: '#fff' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>URL Gambar Sampul</label>
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Ringkasan Cuplikan (Lead)</label>
              <textarea
                rows={2}
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Isi Konten Berita (HTML / Paragraf)</label>
              <textarea
                rows={8}
                required
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="<p>Paragraf berita pertama...</p>"
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem', fontFamily: 'monospace', color: '#fff' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={newFeatured} onChange={(e) => setNewFeatured(e.target.checked)} />
                <span>Headline Utama</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={newBreaking} onChange={(e) => setNewBreaking(e.target.checked)} />
                <span>Breaking News</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ padding: '8px 24px', background: 'var(--accent-crimson)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', fontWeight: '700', cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Menyimpan...' : 'Simpan & Publikasikan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
