import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, Edit3, Flame, 
  ExternalLink, Eye, Check, X, Search 
} from 'lucide-react';

export default function ArticleManagement({ navigate }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleDelete = (id, title) => {
    if (window.confirm(`Hapus artikel: "${title}"? Tindakan ini tidak dapat dibatalkan.`)) {
      fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setArticles(articles.filter(a => a.id !== id));
          }
        })
        .catch(() => {});
    }
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

  const filtered = articles.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Top Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '6px',
          padding: '8px 14px',
          maxWidth: '360px',
          width: '100%'
        }}>
          <Search size={15} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Cari judul berita..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.85rem'
            }}
          />
        </div>

        {/* Add Article Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--accent-crimson)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: '700',
            boxShadow: '0 4px 15px rgba(230,57,70,0.3)'
          }}
        >
          <Plus size={16} />
          <span>Tulis Artikel Baru</span>
        </button>
      </div>

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
                <th style={{ padding: '12px 16px' }}>Berita</th>
                <th style={{ padding: '12px 16px' }}>Kategori</th>
                <th style={{ padding: '12px 16px' }}>Penulis</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Tayangan</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Memuat daftar berita...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Tidak ada berita ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((art) => (
                  <tr key={art.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', maxWidth: '380px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {art.image_url && (
                          <img src={art.image_url} alt="" style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                        )}
                        <div>
                          <div style={{ color: '#fff', fontWeight: '600', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
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

                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {art.category_name}
                    </td>

                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>
                      {art.author}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
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

                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--accent-crimson)', fontWeight: '700' }}>
                      {art.views}
                    </td>

                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => navigate(`/berita/${art.slug}`)}
                          style={{ padding: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', color: 'var(--text-secondary)' }}
                          title="Buka di portal"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(art.id, art.title)}
                          style={{ padding: '6px', background: 'rgba(230,57,70,0.15)', borderRadius: '4px', color: '#ff858d' }}
                          title="Hapus berita"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              <button type="button" onClick={() => setShowCreateModal(false)} style={{ color: 'var(--text-muted)' }}>
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
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.9rem' }}
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
                  <option value="1">Investigasi & Kriminal</option>
                  <option value="2">Misteri & Sains Ajal</option>
                  <option value="3">Hukum & Keadilan</option>
                  <option value="4">Politik & Kuasa</option>
                  <option value="5">Budaya & Religi</option>
                  <option value="6">Opini & Refleksi</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Penulis / Wartawan</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem' }}
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
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Ringkasan Cuplikan (Lead)</label>
              <textarea
                rows={2}
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem' }}
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
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem', fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                <input type="checkbox" checked={newFeatured} onChange={(e) => setNewFeatured(e.target.checked)} />
                <span>Headline Utama</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                <input type="checkbox" checked={newBreaking} onChange={(e) => setNewBreaking(e.target.checked)} />
                <span>Breaking News</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem' }}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{ padding: '8px 24px', background: 'var(--accent-crimson)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', fontWeight: '700' }}
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
