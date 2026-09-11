import React, { useState, useEffect } from 'react';
import HeroHeadline from '../../components/portal/HeroHeadline';
import ArticleCard from '../../components/portal/ArticleCard';
import { Flame, Compass, ArrowRight, ShieldCheck, BookOpen, Volume2 } from 'lucide-react';

export default function Home({ navigate }) {
  const [articles, setArticles] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState(null);
  const [trendingArticles, setTrendingArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // Fetch articles
    fetch('/api/articles?limit=12')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.articles.length > 0) {
          setArticles(data.articles);
          const feat = data.articles.find(a => a.is_featured) || data.articles[0];
          setFeaturedArticle(feat);
        }
      })
      .catch(() => {});

    // Fetch trending
    fetch('/api/articles/trending')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTrendingArticles(data.articles);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredArticles = activeTab === 'all'
    ? articles
    : articles.filter(a => a.category_name?.toLowerCase().includes(activeTab.toLowerCase()));

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      {/* Hero Headline Section */}
      <HeroHeadline
        featuredArticle={featuredArticle}
        secondaryArticles={trendingArticles}
        navigate={navigate}
      />

      {/* Editorial Banner Notice */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(230,57,70,0.12) 0%, rgba(18,22,31,0.8) 100%)',
        border: '1px solid rgba(230,57,70,0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 24px',
        marginBottom: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'var(--accent-crimson)',
            color: '#fff',
            padding: '8px',
            borderRadius: '6px',
            display: 'flex'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>
              Jurnalisme Terbuka & Bebas Sensor
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Setiap berita diuji melalui cek fakta dan data lapangan independen sebelum ditayangkan ke ruang sidang publik.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/cari?q=investigasi')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--accent-crimson)',
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: '700',
            padding: '8px 16px',
            borderRadius: '6px',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <span>Eksplor Investigasi</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Main News Feed */}
      <section style={{ marginBottom: '50px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid var(--border-subtle)',
          paddingBottom: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={22} color="var(--accent-crimson)" />
            <h2 className="display-font" style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '0.5px' }}>
              BERITA & INVESTIGASI TERKINI
            </h2>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
            {[
              { id: 'all', label: 'Semua Rubrik' },
              { id: 'investigasi', label: 'Investigasi' },
              { id: 'misteri', label: 'Misteri & Ajal' },
              { id: 'politik', label: 'Politik' },
              { id: 'budaya', label: 'Budaya & Religi' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: activeTab === tab.id ? '700' : '500',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  background: activeTab === tab.id ? 'var(--accent-crimson)' : 'rgba(255,255,255,0.06)',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid',
                  borderColor: activeTab === tab.id ? 'var(--accent-crimson)' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Memuat warta terbaru...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            Belum ada berita dalam rubrik ini.
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '24px'
          }}>
            {filteredArticles.map(article => (
              <ArticleCard
                key={article.id}
                article={article}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
