import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, ShieldAlert } from 'lucide-react';

export default function SiteSettings() {
  const [settings, setSettings] = useState({
    site_name: 'CALON JENAZAH',
    site_tagline: 'Portal Berita Kritis & Refleksi Kehidupan Tanpa Kompromi',
    site_description: 'Menyajikan jurnalisme investigasi, pengungkapan tabir kriminal, misteri, hukum, dan pengingat hakiki batas usia manusia.',
    ticker_text: 'PERINGATAN: Hidup ini singkat, kebenaran harus diungkap. • Sidang kasus korupsi kembali digelar maraton. • BMKG rilis peringatan dini cuaca ekstrem.',
    admin_username: 'admin'
  });
  const [newPassword, setNewPassword] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const payload = { ...settings };
    if (newPassword.trim()) {
      payload.admin_password = newPassword.trim();
    }

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSaved(true);
          setNewPassword('');
          setTimeout(() => setSaved(false), 3000);
        }
      })
      .catch(() => {});
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <form onSubmit={handleSave} style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div>
            <h2 className="display-font" style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
              Pengaturan Identitas Portal & Redaksi
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Konfigurasi branding dan kredensial admin</span>
          </div>
          {saved && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.85rem' }}>
              <CheckCircle size={16} /> Tersimpan!
            </span>
          )}
        </div>

        <div>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
            Nama Portal Media
          </label>
          <input
            type="text"
            value={settings.site_name}
            onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
            style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.9rem', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
            Slogan / Tagline
          </label>
          <input
            type="text"
            value={settings.site_tagline}
            onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
            style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.9rem', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
            Deskripsi Redaksi & Manifesto Portal
          </label>
          <textarea
            rows={3}
            value={settings.site_description}
            onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
            style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.9rem', color: '#fff' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
            Teks Ticker Berita Berjalan (Running Text)
          </label>
          <textarea
            rows={2}
            value={settings.ticker_text}
            onChange={(e) => setSettings({ ...settings, ticker_text: e.target.value })}
            style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.9rem', color: '#fff' }}
          />
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>
            Kredensial Akun Administrator
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Username Admin</label>
              <input
                type="text"
                value={settings.admin_username}
                onChange={(e) => setSettings({ ...settings, admin_username: e.target.value })}
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Ubah Password Baru</label>
              <input
                type="password"
                placeholder="Kosongkan jika tidak diubah"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '10px', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--accent-crimson)',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '0.9rem'
            }}
          >
            <Save size={16} />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
}
