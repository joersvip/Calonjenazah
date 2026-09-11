import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldAlert, Radio, Flame, Bookmark, Clock, 
  Menu, X, Lock, ExternalLink, Moon, Compass
} from 'lucide-react';

export default function Navbar({ currentRoute, navigate, breakingNews = [] }) {
  const [categories, setCategories] = useState([]);
  const [currentDate, setCurrentDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Format date in Indonesian
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('id-ID', options);
    setCurrentDate(dateStr);

    // Fetch categories
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCategories(data.categories);
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/cari?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
      {/* Top Bar: Date, Live Ticker & Admin Shortcut */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: '#07090c',
        padding: '6px 0',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} color="var(--accent-gold)" />
              <strong style={{ color: 'var(--text-secondary)' }}>{currentDate}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-crimson)' }}>
              <span className="pulsing-dot-red"></span>
              <strong style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>LIVE EDISI NASIONAL</strong>
            </span>
          </div>

          {/* Breaking News Marquee */}
          {breakingNews.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              maxWidth: '650px',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}>
              <span style={{
                background: 'var(--accent-crimson)',
                color: '#fff',
                fontSize: '0.68rem',
                fontWeight: '800',
                padding: '2px 7px',
                borderRadius: '3px',
                letterSpacing: '0.5px'
              }}>
                KILAS:
              </span>
              <div style={{ overflow: 'hidden', width: '100%' }}>
                <span 
                  onClick={() => navigate(`/berita/${breakingNews[0].slug}`)}
                  style={{ color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.78rem' }}
                >
                  {breakingNews[0].title}
                </span>
              </div>
            </div>
          )}

          {/* Admin shortcut */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.75rem',
                padding: '3px 9px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
              title="Dashboard Redaksi & Admin"
            >
              <Lock size={12} />
              <span>Admin Redaksi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Brand Header */}
      <div className="container" style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}
        >
          <div style={{
            width: '46px',
            height: '46px',
            background: 'radial-gradient(circle, #e63946 0%, #1f0b0d 90%)',
            border: '2px solid rgba(230, 57, 70, 0.6)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(230, 57, 70, 0.4)'
          }}>
            <ShieldAlert size={26} color="#ffffff" />
          </div>

          <div>
            <h1 className="brand-font" style={{
              fontSize: '2rem',
              fontWeight: '900',
              lineHeight: '1',
              color: '#ffffff',
              letterSpacing: '3px',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)'
            }}>
              CALON <span style={{ color: 'var(--accent-crimson)' }}>JENAZAH</span>
            </h1>
            <p style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontWeight: '600',
              marginTop: '4px'
            }}>
              Jurnalisme Kritis, Investigatif & Pengingat Hakiki
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form 
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#0d1017',
            border: '1px solid var(--border-subtle)',
            borderRadius: '50px',
            padding: '7px 16px',
            maxWidth: '380px',
            width: '100%'
          }}
        >
          <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input 
            type="text"
            placeholder="Cari investigasi, perkara, misteri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.85rem'
            }}
          />
          <button 
            type="submit"
            style={{
              background: 'var(--accent-crimson)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '20px',
              marginLeft: '5px'
            }}
          >
            Cari
          </button>
        </form>

        {/* Mobile menu trigger */}
        <div style={{ display: 'none' }}>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div style={{
        background: '#0e1219',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 0', whiteSpace: 'nowrap' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: currentRoute === '/' ? '700' : '500',
                color: currentRoute === '/' ? 'var(--accent-crimson)' : 'var(--text-secondary)',
                borderBottom: currentRoute === '/' ? '2px solid var(--accent-crimson)' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              <Compass size={15} />
              <span>BERANDA</span>
            </button>

            {categories.map((cat) => {
              const active = currentRoute === `/kategori/${cat.slug}`;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/kategori/${cat.slug}`)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.85rem',
                    fontWeight: active ? '700' : '500',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    borderBottom: active ? `2px solid ${cat.color || 'var(--accent-crimson)'}` : '2px solid transparent',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {cat.name.toUpperCase()}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
