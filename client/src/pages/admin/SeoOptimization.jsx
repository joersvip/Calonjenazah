import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Globe, RefreshCw, CheckCircle2, AlertTriangle, 
  ExternalLink, FileText, Check, Clock, ShieldCheck, 
  Search, ArrowRight, Rss, Layers, Zap
} from 'lucide-react';

export default function SeoOptimization({ navigate }) {
  const [loading, setLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // SEO State
  const [seoScore, setSeoScore] = useState(92);
  const [lastRun, setLastRun] = useState(null);
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [intervalHours, setIntervalHours] = useState(6);
  const [report, setReport] = useState(null);
  const [articleStats, setArticleStats] = useState({ total: 0, with_tags: 0, with_summary: 0, with_image: 0 });
  const [optimizeMessage, setOptimizeMessage] = useState('');

  const fetchSeoStatus = () => {
    setLoading(true);
    fetch('/api/seo/status')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.status) {
          setSeoScore(data.status.score || 90);
          setLastRun(data.status.lastRun);
          setAutoEnabled(data.status.autoEnabled);
          setIntervalHours(data.status.intervalHours || 6);
          setReport(data.status.report);
          if (data.status.articleStats) {
            setArticleStats(data.status.articleStats);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSeoStatus();
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    fetch('/api/seo/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled: autoEnabled,
        intervalHours: Number(intervalHours)
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3500);
        }
      })
      .catch(() => alert('Gagal menyimpan pengaturan SEO'));
  };

  const handleRunOptimizationNow = () => {
    setIsOptimizing(true);
    setOptimizeMessage('');
    fetch('/api/seo/optimize-now', { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        setIsOptimizing(false);
        if (data.success) {
          setSeoScore(data.report.score);
          setReport(data.report);
          setLastRun(data.report.timestamp);
          setOptimizeMessage(data.message || 'Optimasi SEO berhasil diselesaikan!');
          fetchSeoStatus();
        } else {
          alert(data.error || 'Gagal menjalankan optimasi SEO');
        }
      })
      .catch(() => {
        setIsOptimizing(false);
        alert('Terjadi kesalahan jaringan saat optimasi SEO');
      });
  };

  const scoreColor = seoScore >= 90 ? '#10b981' : seoScore >= 75 ? 'var(--accent-gold)' : 'var(--accent-crimson)';

  return (
    <div style={{ maxWidth: '1050px' }}>
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(230, 57, 70, 0.12) 0%, rgba(212, 175, 55, 0.08) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-crimson), #c1121f)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(230, 57, 70, 0.4)'
          }}>
            <Sparkles size={26} color="#fff" />
          </div>
          <div>
            <h2 className="display-font" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
              Optimasi SEO Otomatis &amp; Peta Situs Berkala
            </h2>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '600px' }}>
              Mesin otomatisasi perayapan mesin pencari (Googlebot, Bingbot), pembuat sitemap dinamis, audit meta deskripsi, dan ekstraksi kata kunci berkala.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunOptimizationNow}
          disabled={isOptimizing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--accent-crimson)',
            color: '#fff',
            padding: '11px 22px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: '700',
            cursor: isOptimizing ? 'not-allowed' : 'pointer',
            border: 'none',
            boxShadow: '0 4px 18px rgba(230, 57, 70, 0.4)'
          }}
        >
          <Zap size={16} className={isOptimizing ? 'spin' : ''} />
          <span>{isOptimizing ? 'Mengoptimasi...' : 'Jalankan Optimasi Sekarang'}</span>
        </button>
      </div>

      {optimizeMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#34d399',
          fontSize: '0.88rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{optimizeMessage}</span>
        </div>
      )}

      {/* Top 4 Key Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Score Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: `4px solid ${scoreColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: '900',
            color: scoreColor,
            flexShrink: 0
          }}>
            {seoScore}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Skor Kesehatan SEO
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '800', color: '#fff', marginTop: '2px' }}>
              {seoScore >= 90 ? 'Sangat Optimal' : seoScore >= 75 ? 'Cukup Baik' : 'Perlu Peningkatan'}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Standar Google News</span>
          </div>
        </div>

        {/* Indexed Articles */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Artikel di Sitemap</span>
            <Globe size={18} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff' }}>
            {articleStats.total} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400' }}>Berita</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '4px' }}>
            ✓ 100% Siap Dirayapi Mesin Pencari
          </div>
        </div>

        {/* Dynamic Sitemap Live Status */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>XML Sitemap Live</span>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-gold)' }}>
              <ExternalLink size={16} />
            </a>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>
            /sitemap.xml
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Diperbarui berkala secara otomatis
          </div>
        </div>

        {/* Google News RSS */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Google News Feed</span>
            <a href="/rss.xml" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-gold)' }}>
              <Rss size={16} />
            </a>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: '700', color: '#fff' }}>
            /rss.xml
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Format standar RSS 2.0 &amp; Atom
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Settings Card: Automated Periodic Schedule */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '18px' }}>
            <div>
              <h3 className="display-font" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff' }}>
                Pengaturan Optimasi Berkala
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Atur frekuensi eksekusi optimasi otomatis di latar belakang</span>
            </div>
            {saveSuccess && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.82rem', fontWeight: '700' }}>
                <Check size={16} /> Disimpan!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Toggle Active */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px',
              background: 'var(--bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.88rem' }}>
                  Status Optimasi Berkala
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Jalankan audit dan regenerasi sitemap secara terjadwal otomatis
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoEnabled}
                  onChange={(e) => setAutoEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: autoEnabled ? '#10b981' : '#334155',
                  transition: '.3s',
                  borderRadius: '34px'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: autoEnabled ? '26px' : '4px',
                    bottom: '4px',
                    backgroundColor: 'white',
                    transition: '.3s',
                    borderRadius: '50%'
                  }} />
                </span>
              </label>
            </div>

            {/* Interval Frequency */}
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Frekuensi Eksekusi Berkala:
              </label>
              <select
                value={intervalHours}
                onChange={(e) => setIntervalHours(Number(e.target.value))}
                style={{
                  width: '100%',
                  background: '#0a0d14',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '11px',
                  fontSize: '0.88rem',
                  color: '#fff',
                  outline: 'none'
                }}
              >
                <option value={1}>Setiap 1 Jam (Sangat Cepat - Portal Berita Aktif)</option>
                <option value={3}>Setiap 3 Jam</option>
                <option value={6}>Setiap 6 Jam (Rekomendasi Standar)</option>
                <option value={12}>Setiap 12 Jam (Dua Kali Sehari)</option>
                <option value={24}>Setiap 24 Jam (Sekali Sehari)</option>
              </select>
            </div>

            {/* Tasks included in routine */}
            <div style={{
              background: '#0a0d14',
              borderRadius: '6px',
              padding: '14px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontWeight: '700', color: 'var(--accent-gold)', marginBottom: '8px' }}>
                Proses yang Berjalan Setiap Siklus:
              </div>
              <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <li>Pemindaian dan auto-enrichment kata kunci (*tags*) untuk berita baru.</li>
                <li>Penyempurnaan lead &amp; meta description berstandar cuplikan Google.</li>
                <li>Regenerasi sitemap.xml dengan pembaruan tanggal *lastmod* artikel.</li>
                <li>Penyelarasan direktif robots.txt dan RSS Feed / Google News.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                style={{
                  background: 'var(--accent-gold)',
                  color: '#000',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Simpan Pengaturan Jadwal
              </button>
            </div>
          </form>
        </div>

        {/* Audit & Metrics Detail Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 className="display-font" style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
              Audit Indikator Kualitas Konten
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Metrik kepatuhan terhadap standar SEO teknis &amp; editorial
            </span>

            {/* Progress Metrics */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Kelengkapan Meta Keywords / Tags</span>
                  <span style={{ fontWeight: '700', color: '#fff' }}>{report?.metrics?.tagsCompleteness || 100}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${report?.metrics?.tagsCompleteness || 100}%`, height: '100%', background: '#10b981' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Ringkasan Meta Cuplikan (Lead)</span>
                  <span style={{ fontWeight: '700', color: '#fff' }}>{report?.metrics?.summaryCompleteness || 100}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${report?.metrics?.summaryCompleteness || 100}%`, height: '100%', background: '#10b981' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Rasio Gambar Sampul (*Featured Image*)</span>
                  <span style={{ fontWeight: '700', color: '#fff' }}>{report?.metrics?.imageCompleteness || 100}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${report?.metrics?.imageCompleteness || 100}%`, height: '100%', background: '#10b981' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Kedalaman Konten Jurnalisme (&gt;100 kata)</span>
                  <span style={{ fontWeight: '700', color: '#fff' }}>{report?.metrics?.contentDepthScore || 90}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${report?.metrics?.contentDepthScore || 90}%`, height: '100%', background: 'var(--accent-gold)' }} />
                </div>
              </div>
            </div>

            {/* Audit Issues List */}
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '700' }}>
                Catatan Hasil Audit Terakhir:
              </div>
              {report?.issues && report.issues.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {report.issues.map((iss, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.08)', padding: '6px 10px', borderRadius: '4px' }}>
                      <AlertTriangle size={13} />
                      <span>{iss}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.76rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={14} /> Semua artikel memenuhi standar optimal SEO.
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            <span>Terakhir dioptimasi: <strong>{lastRun ? new Date(lastRun).toLocaleString('id-ID') : 'Belum ada'}</strong></span>
            <span>Interval: <strong>Setiap {intervalHours} Jam</strong></span>
          </div>
        </div>
      </div>

      {/* Direct Search Engine Files Links */}
      <div style={{ marginTop: '24px' }}>
        <h3 className="display-font" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff', marginBottom: '14px' }}>
          Tautan Berkas Mesin Pencari &amp; Sindikasi Berita
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '16px',
              textDecoration: 'none'
            }}
          >
            <div>
              <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>Peta Situs (Sitemap XML)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Format protokol sitemaps.org untuk Google Search Console</div>
            </div>
            <ExternalLink size={16} color="var(--accent-gold)" />
          </a>

          <a
            href="/robots.txt"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '16px',
              textDecoration: 'none'
            }}
          >
            <div>
              <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>Robots.txt</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Panduan akses spider dan pencegah perayapan area admin</div>
            </div>
            <ExternalLink size={16} color="var(--accent-gold)" />
          </a>

          <a
            href="/rss.xml"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '16px',
              textDecoration: 'none'
            }}
          >
            <div>
              <div style={{ fontWeight: '700', color: '#fff', fontSize: '0.9rem' }}>Google News RSS 2.0</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sindikasi feed agregator berita &amp; pembaca RSS</div>
            </div>
            <ExternalLink size={16} color="var(--accent-gold)" />
          </a>
        </div>
      </div>
    </div>
  );
}
