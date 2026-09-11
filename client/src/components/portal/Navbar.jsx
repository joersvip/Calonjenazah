import React, { useState, useEffect } from 'react';
import { 
  Search, ShieldAlert, Radio, Flame, Bookmark, Clock, 
  Menu, X, Lock, ExternalLink, Moon, Compass, ChevronRight 
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
    <header style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', position: 'relative', zIndex: 1000 }}>
      {/* Top Bar: Date, Live Ticker & Admin Shortcut */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: '#07090c',
        padding: '6px 0',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={13} color="var(--accent-gold)" />
              <strong style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{currentDate}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--accent-crimson)' }}>
              <span className="pulsing-dot-red" style={{ width: '7px', height: '7px' }}></span>
              <strong style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>LIVE PORTAL</strong>
            </span>
          </div>

          {/* Breaking News Marquee */}
          {breakingNews.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              maxWidth: '520px',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}>
              <span style={{
                background: 'var(--accent-crimson)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: '800',
                padding: '2px 6px',
                borderRadius: '3px',
                letterSpacing: '0.5px'
              }}>
                KILAS:
              </span>
              <div style={{ overflow: 'hidden', width: '100%', textOverflow: 'ellipsis' }}>
                <span 
                  onClick={() => navigate(`/berita/${breakingNews[0].slug}`)}
                  style={{ color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.76rem' }}
                >
                  {breakingNews[0].title}
                </span>
              </div>
            </div>
          )}

          {/* Admin shortcut */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => navigate('/admin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.72rem',
                padding: '3px 8px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
              title="Dashboard Redaksi & Admin"
            >
              <Lock size={12} />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Brand Header */}
      <div className="container" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            background: 'radial-gradient(circle, #e63946 0%, #1f0b0d 90%)',
            border: '2px solid rgba(230, 57, 70, 0.6)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(230, 57, 70, 0.4)',
            flexShrink: 0
          }}>
            <ShieldAlert size={24} color="#ffffff" />
          </div>

          <div>
            <h1 className="brand-font" style={{
              fontSize: 'clamp(1.4rem, 4vw, 1.9rem)',
              fontWeight: '900',
              lineHeight: '1',
              color: '#ffffff',
              letterSpacing: '2px',
              textShadow: '0 2px 10px rgba(0,0,0,0.8)'
            }}>
              CALON <span style={{ color: 'var(--accent-crimson)' }}>JENAZAH</span>
            </h1>
            <p style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              fontWeight: '600',
              marginTop: '3px',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              Jurnalisme Kritis, Investigatif & Pengingat Hakiki
            </p>
          </div>
        </div>

        {/* Search Bar Desktop */}
        <form 
          onSubmit={handleSearchSubmit}
          className="nav-search-desktop"
          style={{
            alignItems: 'center',
            background: '#0d1017',
            border: '1px solid var(--border-subtle)',
            borderRadius: '50px',
            padding: '6px 14px',
            maxWidth: '340px',
            width: '100%'
          }}
        >
          <Search size={15} color="var(--text-muted)" style={{ marginRight: '8px' }} />
          <input 
            type="text"
            placeholder="Cari investigasi, perkara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '0.82rem'
            }}
          />
          <button 
            type="submit"
            style={{
              background: 'var(--accent-crimson)',
              color: '#fff',
              fontSize: '0.7rem',
              fontWeight: '700',
              padding: '4px 10px',
              borderRadius: '20px',
              marginLeft: '4px'
            }}
          >
            Cari
          </button>
        </form>

        {/* Mobile menu trigger */}
        <button 
          className="nav-mobile-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu Navigasi"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Category Navigation Bar (Horizontal Scrollable for Touch Devices) */}
      <div style={{
        background: '#0e1219',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div className="container">
          <nav className="nav-categories-bar" style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', whiteSpace: 'nowrap', padding: '4px 0' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 12px',
                fontSize: '0.82rem',
                fontWeight: currentRoute === '/' ? '700' : '500',
                color: currentRoute === '/' ? 'var(--accent-crimson)' : 'var(--text-secondary)',
                borderBottom: currentRoute === '/' ? '2px solid var(--accent-crimson)' : '2px solid transparent',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              <Compass size={14} />
              <span>BERANDA</span>
            </button>

            {categories.map((cat) => {
              const active = currentRoute === `/kategori/${cat.slug}`;
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/kategori/${cat.slug}`)}
                  style={{
                    padding: '7px 12px',
                    fontSize: '0.82rem',
                    fontWeight: active ? '700' : '500',
                    color: active ? '#ffffff' : 'var(--text-secondary)',
                    borderBottom: active ? `2px solid ${cat.color || 'var(--accent-crimson)'}` : '2px solid transparent',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                  {cat.name.toUpperCase()}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer Menu (Visible when hamburger is opened) */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column'
        }} onClick={() => setIsMobileMenuOpen(false)}>
          
          <div style={{
            width: '85%',
            maxWidth: '340px',
            height: '100%',
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-subtle)',
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '10px 0 30px rgba(0,0,0,0.8)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <div>
              {/* Drawer Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldAlert size={22} color="var(--accent-crimson)" />
                  <span className="brand-font" style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff' }}>
                    CALON <span style={{ color: 'var(--accent-crimson)' }}>JENAZAH</span>
                  </span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ color: 'var(--text-muted)', padding: '6px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Mobile Search Form */}
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0d1017',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  width: '100%'
                }}>
                  <Search size={15} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                  <input
                    type="text"
                    placeholder="Cari berita..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                  />
                  <button type="submit" style={{ background: 'var(--accent-crimson)', color: '#fff', fontSize: '0.72rem', fontWeight: '700', padding: '4px 8px', borderRadius: '4px' }}>
                    Cari
                  </button>
                </div>
              </form>

              {/* Navigation Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                  Rubrik & Halaman
                </span>

                <button
                  onClick={() => { navigate('/'); setIsMobileMenuOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '0.88rem',
                    fontWeight: currentRoute === '/' ? '700' : '500',
                    background: currentRoute === '/' ? 'rgba(230,57,70,0.15)' : 'transparent',
                    color: currentRoute === '/' ? '#fff' : 'var(--text-secondary)',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Compass size={16} color="var(--accent-crimson)" />
                    <span>Beranda Utama</span>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </button>

                {categories.map((cat) => {
                  const active = currentRoute === `/kategori/${cat.slug}`;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { navigate(`/kategori/${cat.slug}`); setIsMobileMenuOpen(false); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: '6px',
                        fontSize: '0.88rem',
                        fontWeight: active ? '700' : '500',
                        background: active ? 'rgba(230,57,70,0.15)' : 'transparent',
                        color: active ? '#fff' : 'var(--text-secondary)',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color || 'var(--accent-crimson)' }}></span>
                        <span>{cat.name}</span>
                      </div>
                      <ChevronRight size={14} color="var(--text-muted)" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Admin Button */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <button
                onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '11px',
                  background: 'rgba(230,57,70,0.15)',
                  border: '1px solid var(--accent-crimson)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: '700'
                }}
              >
                <Lock size={15} />
                <span>Masuk Admin Redaksi</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  );
}
