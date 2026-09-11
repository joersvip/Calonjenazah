import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Radio, History, Link, Cpu, 
  FileText, Settings, ExternalLink, LogOut, ShieldAlert,
  Users, MapPin, Menu, X, Lock, Sparkles, MessageSquare
} from 'lucide-react';
import { subscribeAdminLive } from '../../services/telemetry';

export default function AdminLayout({ activeTab, setActiveTab, navigate, children }) {
  const [token, setToken] = useState(localStorage.getItem('calonjenazah_token'));
  const [liveVisitors, setLiveVisitors] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Subscribe to live visitors WebSocket when logged in
  useEffect(() => {
    if (token) {
      const unsubscribe = subscribeAdminLive((visitors) => {
        setLiveVisitors(visitors || []);
      });
      return () => unsubscribe();
    }
  }, [token]);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.token) {
          localStorage.setItem('calonjenazah_token', data.token);
          if (data.user) {
            localStorage.setItem('calonjenazah_admin_user', JSON.stringify(data.user));
          }
          setToken(data.token);
          if (setActiveTab) setActiveTab('overview');
          // Directly redirect to Admin Dashboard
          if (navigate) {
            navigate('/admin');
          } else {
            window.location.hash = '/admin';
          }
        } else {
          setLoginError(data.error || 'Login gagal');
        }
        setIsLoggingIn(false);
      })
      .catch(() => {
        setLoginError('Koneksi ke server gagal');
        setIsLoggingIn(false);
      });
  };

  const handleLogout = () => {
    localStorage.removeItem('calonjenazah_token');
    localStorage.removeItem('calonjenazah_admin_user');
    setToken(null);
    // Directly redirect to Public News Portal
    if (navigate) {
      navigate('/');
    } else {
      window.location.hash = '/';
    }
  };

  // Login Modal / Screen if not authenticated
  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #161b26 0%, #080a0e 100%)',
        padding: '20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'var(--accent-crimson)',
            borderRadius: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 0 20px var(--accent-crimson-glow)'
          }}>
            <Lock size={28} color="#fff" />
          </div>

          <h2 className="brand-font" style={{ fontSize: '1.6rem', color: '#fff', letterSpacing: '2px', marginBottom: '6px' }}>
            CALON <span style={{ color: 'var(--accent-crimson)' }}>JENAZAH</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '26px' }}>
            Akses Panel Khusus Dewan Redaksi & Administrator
          </p>

          {loginError && (
            <div style={{
              background: 'rgba(230, 57, 70, 0.15)',
              border: '1px solid var(--accent-crimson)',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ff858d',
              fontSize: '0.85rem'
            }}>
              <ShieldAlert size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                autoComplete="off"
                style={{
                  width: '100%',
                  background: '#0a0d14',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                autoComplete="new-password"
                style={{
                  width: '100%',
                  background: '#0a0d14',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              style={{
                background: 'var(--accent-crimson)',
                color: '#fff',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: '700',
                marginTop: '10px',
                boxShadow: '0 4px 15px rgba(230,57,70,0.4)',
                opacity: isLoggingIn ? 0.7 : 1
              }}
            >
              {isLoggingIn ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
            </button>
          </form>

          <div style={{ marginTop: '24px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <button
              onClick={() => navigate('/')}
              style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}
            >
              ← Kembali ke Beranda Publik
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Ringkasan Portal', icon: LayoutDashboard },
    { id: 'admin-chat', label: 'Chat Antar Admin', icon: MessageSquare, highlight: true },
    { id: 'live-tracking', label: 'Peta Live Pengunjung', icon: Radio, badge: liveVisitors.length || '0' },
    { id: 'history', label: 'Riwayat & Audit Log IP', icon: History },
    { id: 'reupload', label: 'Re-Upload via Link', icon: Link },
    { id: 'crawler', label: 'Web Crawler & RSS', icon: Cpu },
    { id: 'articles', label: 'Manajemen Berita', icon: FileText },
    { id: 'seo', label: 'Optimasi SEO Otomatis', icon: Sparkles },
    { id: 'admin-users', label: 'Manajemen Admin', icon: Users },
    { id: 'settings', label: 'Pengaturan Web', icon: Settings }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Mobile Top Header (Shown on screens <= 992px) */}
      <header className="admin-mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '6px',
              color: '#fff',
              border: '1px solid var(--border-subtle)'
            }}
            aria-label="Menu Admin"
          >
            {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--accent-crimson)" />
            <span className="brand-font" style={{ fontSize: '1rem', fontWeight: '900', color: '#fff' }}>
              ADMIN <span style={{ color: 'var(--accent-crimson)' }}>PANEL</span>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16,185,129,0.15)',
            color: '#34d399',
            border: '1px solid rgba(16,185,129,0.3)',
            fontSize: '0.72rem',
            fontWeight: '800',
            padding: '3px 10px',
            borderRadius: '12px'
          }}>
            <span className="pulsing-dot-green" style={{ width: '6px', height: '6px' }}></span>
            <span>{liveVisitors.length} Live</span>
          </div>

          <button
            onClick={handleLogout}
            title="Keluar dari Admin dan Langsung ke Portal Berita"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              borderRadius: '6px',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <LogOut size={13} />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* Main Wrapper with Sidebar and Content */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Mobile Backdrop Overlay */}
        {isMobileNavOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 9000
            }}
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}

        {/* Admin Sidebar */}
        <aside className={`admin-sidebar-desktop ${isMobileNavOpen ? 'open' : ''}`} style={{
          background: '#0c0f16',
          borderRight: '1px solid var(--border-subtle)',
          justifyContent: 'space-between'
        }}>
          <div>
            {/* Logo Brand Header */}
            <div style={{
              padding: '24px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  background: 'var(--accent-crimson)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldAlert size={22} color="#fff" />
                </div>
                <div>
                  <h2 className="brand-font" style={{ fontSize: '1.15rem', color: '#fff', letterSpacing: '1px', lineHeight: 1 }}>
                    CALON <span style={{ color: 'var(--accent-crimson)' }}>JENAZAH</span>
                  </h2>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Redaksi Administrator
                  </span>
                </div>
              </div>

              {/* Close button on mobile */}
              <button
                onClick={() => setIsMobileNavOpen(false)}
                style={{ color: 'var(--text-muted)', display: 'none' }}
                className="nav-mobile-toggle"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileNavOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? '700' : '500',
                      background: isActive ? 'rgba(230,57,70,0.15)' : 'transparent',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid',
                      borderColor: isActive ? 'rgba(230,57,70,0.3)' : 'transparent',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.color = '#fff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Icon size={18} color={isActive ? 'var(--accent-crimson)' : 'currentColor'} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(16,185,129,0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16,185,129,0.3)',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        padding: '2px 8px',
                        borderRadius: '12px'
                      }}>
                        <span className="pulsing-dot-green" style={{ width: '6px', height: '6px' }}></span>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer */}
          <div style={{ padding: '16px 14px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}
            >
              <ExternalLink size={15} />
              <span>Lihat Portal Berita</span>
            </button>

            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                color: '#ef4444'
              }}
            >
              <LogOut size={15} />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </aside>

        {/* Main Admin Content View */}
        <main className="admin-content-area">
          {/* Top bar with live status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '14px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h1 className="display-font" style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: '800', color: '#fff' }}>
                {navItems.find(n => n.id === activeTab)?.label || 'Dashboard Redaksi'}
              </h1>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Panel Kontrol Pusat CALON JENAZAH
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Live Visitor Indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                padding: '6px 14px',
                borderRadius: '50px'
              }}>
                <span className="pulsing-dot-green"></span>
                <span style={{ fontSize: '0.78rem', color: '#fff' }}>
                  <strong>{liveVisitors.length}</strong> Pengunjung Aktif
                </span>
                <button
                  onClick={() => setActiveTab('live-tracking')}
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--accent-crimson)',
                    fontWeight: '700',
                    borderLeft: '1px solid rgba(255,255,255,0.1)',
                    paddingLeft: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Peta →
                </button>
              </div>

              {/* Quick View Portal Button */}
              <button
                onClick={() => navigate('/')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="Buka Portal Berita"
              >
                <ExternalLink size={13} />
                <span>Lihat Portal</span>
              </button>

              {/* Quick Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '6px',
                  padding: '7px 12px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: '#ef4444',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                title="Keluar dari Admin dan Langsung Kembali ke Portal Berita"
              >
                <LogOut size={13} />
                <span>Keluar</span>
              </button>
            </div>
          </div>

          {/* Injected Tab Content */}
          {React.cloneElement(children, { liveVisitors, setActiveTab, navigate })}
        </main>
      </div>
    </div>
  );
}
