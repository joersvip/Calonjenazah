import React, { useState, useEffect } from 'react';
import ArticleCard from '../../components/portal/ArticleCard';
import { Compass, Filter } from 'lucide-react';

export default function CategoryPage({ categorySlug, navigate }) {
  const [articles, setArticles] = useState([]);
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Get category info & articles
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const match = data.categories.find(c => c.slug === categorySlug);
          if (match) {
            setCategoryName(match.name);
            document.title = `${match.name} - CALON JENAZAH`;
            return fetch(`/api/articles?category=${match.id}&limit=20`);
          }
        }
        return fetch(`/api/articles?limit=20`);
      })
      .then(res => res ? res.json() : null)
      .then(data => {
        if (data && data.success) {
          setArticles(data.articles);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [categorySlug]);

  return (
    <div className="container" style={{ padding: '30px 20px', minHeight: '70vh' }}>
      <div style={{
        borderBottom: '2px solid var(--accent-crimson)',
        paddingBottom: '16px',
        marginBottom: '30px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Compass size={28} color="var(--accent-crimson)" />
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Kategori Arsip Berita
          </span>
          <h1 className="display-font" style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff' }}>
            {categoryName || 'Rubrik Khusus'}
          </h1>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Memuat berita kategori...
        </div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Belum ada artikel yang diterbitkan dalam kategori ini.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: '24px'
        }}>
          {articles.map(art => (
            <ArticleCard key={art.id} article={art} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}
