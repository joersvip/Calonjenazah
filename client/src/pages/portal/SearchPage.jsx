import React, { useState, useEffect } from 'react';
import ArticleCard from '../../components/portal/ArticleCard';
import { Search, FileText } from 'lucide-react';

export default function SearchPage({ initialQuery = '', navigate }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const performSearch = (q) => {
    if (!q || !q.trim()) return;
    setLoading(true);
    setSearched(true);

    fetch(`/api/articles?search=${encodeURIComponent(q.trim())}&limit=30`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setResults(data.articles);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
    <div className="container" style={{ padding: '30px 20px', minHeight: '70vh' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto 40px auto' }}>
        <h1 className="display-font" style={{ fontSize: '1.8rem', fontWeight: '800', textAlign: 'center', marginBottom: '20px' }}>
          Pencarian Arsip Investigasi
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '10px 16px',
            flex: 1
          }}>
            <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px' }} />
            <input
              type="text"
              placeholder="Ketik kata kunci artikel atau nama perkara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.95rem'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: 'var(--accent-crimson)',
              color: '#fff',
              padding: '0 24px',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.9rem'
            }}
          >
            Cari
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Mencari arsip berita...
        </div>
      ) : searched && results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ opacity: 0.3, marginBottom: '10px' }} />
          <p>Tidak ditemukan artikel dengan kata kunci "{query}".</p>
        </div>
      ) : results.length > 0 ? (
        <div>
          <div style={{ marginBottom: '20px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Ditemukan <strong>{results.length}</strong> berita terkait:
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '24px'
          }}>
            {results.map(art => (
              <ArticleCard key={art.id} article={art} navigate={navigate} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
