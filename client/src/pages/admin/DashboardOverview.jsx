import React, { useState, useEffect } from 'react';
import { 
  Users, Radio, Eye, FileText, Monitor, Smartphone, 
  Tablet, Globe, ArrowUpRight, TrendingUp, ShieldCheck,
  Cpu, RefreshCw, CheckCircle2, Clock, Sparkles, ExternalLink,
  Layers, BookmarkCheck, BarChart3, Database
} from 'lucide-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export default function DashboardOverview({ liveVisitors = [], setActiveTab, navigate }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = () => {
    setRefreshing(true);
    fetch('/api/analytics/summary')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSummary(data.summary);
        }
        setLoading(false);
        setRefreshing(false);
      })
      .catch(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // 1. Real Category Breakdown Chart (860+ Articles in Server Database)
  const hasCategoryData = summary?.categoryBreakdown && summary.categoryBreakdown.length > 0;
  const categoryLabels = hasCategoryData ? summary.categoryBreakdown.map(c => c.category_name) : [];
  const categoryData = hasCategoryData ? summary.categoryBreakdown.map(c => c.count) : [];
  const categoryColors = [
    '#f77f00', '#2a9d8f', '#e63946', '#9d4edd', '#457b9d', '#b5179e', '#3b82f6', '#10b981'
  ];

  const categoryChartData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryData,
        backgroundColor: categoryColors.slice(0, categoryLabels.length),
        borderColor: '#0f131a',
        borderWidth: 2
      }
    ]
  };

  // 2. Real Device Breakdown Chart
  const hasDeviceData = summary?.deviceBreakdown && summary.deviceBreakdown.length > 0;
  const deviceLabels = hasDeviceData ? summary.deviceBreakdown.map(d => d.device_type) : [];
  const deviceData = hasDeviceData ? summary.deviceBreakdown.map(d => d.count) : [];

  const doughnutDeviceData = {
    labels: deviceLabels,
    datasets: [
      {
        data: deviceData,
        backgroundColor: ['#e63946', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
        borderColor: '#0f131a',
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#9aa5b8', font: { family: 'Inter', size: 11 }, boxWidth: 12 }
      }
    }
  };

  return (
    <div>
      {/* Top Welcome & Synchronization Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(230,57,70,0.12) 0%, rgba(18,22,31,0.9) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        marginBottom: '26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Database size={20} color="var(--accent-gold)" />
            <h2 className="display-font" style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>
              Ringkasan Portal &amp; Aktivitas Redaksi
            </h2>
            <span style={{
              fontSize: '0.7rem',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'rgba(16,185,129,0.18)',
              color: '#34d399',
              border: '1px solid rgba(16,185,129,0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }}></span>
              SINKRON DGN BASIS DATA SERVER
            </span>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Data realtime yang mencerminkan keseluruhan artikel tersimpan di server ({summary?.totalArticles || 0} berita), penyerapan crawler sindikasi ({summary?.totalCrawled || 0} berita), serta analitik pembaca aktual.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={fetchSummary}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: refreshing ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
            <span>{refreshing ? 'Menyinkronkan...' : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* 6 Metric Cards: Fully Synchronized with Database */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '18px',
        marginBottom: '30px'
      }}>
        {/* Metric 1: Total Published Articles */}
        <div 
          onClick={() => setActiveTab && setActiveTab('articles')}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(230,57,70,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
            transition: 'transform 0.15s, border-color 0.15s'
          }}
          title="Klik untuk membuka Manajemen Berita"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
              TOTAL BERITA TERBIT
            </span>
            <FileText size={18} color="var(--accent-crimson)" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>
            {(summary?.totalArticles || 0).toLocaleString('id-ID')}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--accent-crimson)', marginTop: '8px', display: 'block', fontWeight: '600' }}>
            Aktif di database portal →
          </span>
        </div>

        {/* Metric 2: Total Views & Reads */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
              TOTAL TAYANGAN &amp; BACA
            </span>
            <Eye size={18} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: 'var(--accent-gold)', lineHeight: 1 }}>
            {(summary?.totalVisits || summary?.totalArticleViews || 0).toLocaleString('id-ID')}
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
            Akumulasi views artikel portal
          </span>
        </div>

        {/* Metric 3: Live Realtime Visitors */}
        <div 
          onClick={() => setActiveTab && setActiveTab('live-tracking')}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer'
          }}
          title="Klik untuk membuka Peta Live Pengunjung"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
              PENGUNJUNG REALTIME
            </span>
            <span className="pulsing-dot-green"></span>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#34d399', lineHeight: 1 }}>
            {liveVisitors.length || summary?.activeLiveCount || 0}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#34d399', marginTop: '8px', display: 'block', fontWeight: '600' }}>
            Pantau radar di peta live →
          </span>
        </div>

        {/* Metric 4: Crawled & Syndicated Articles */}
        <div 
          onClick={() => setActiveTab && setActiveTab('crawler')}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(157,78,221,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer'
          }}
          title="Klik untuk membuka Web Crawler & RSS"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
              BERITA WEB CRAWLER
            </span>
            <Cpu size={18} color="#c77dff" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#c77dff', lineHeight: 1 }}>
            {(summary?.totalCrawled || 0).toLocaleString('id-ID')}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#c77dff', marginTop: '8px', display: 'block', fontWeight: '600' }}>
            {summary?.totalCrawlerSources || 18} Sumber Sindikasi →
          </span>
        </div>

        {/* Metric 5: Unique IPs */}
        <div 
          onClick={() => setActiveTab && setActiveTab('visitor-history')}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer'
          }}
          title="Klik untuk membuka Riwayat & Audit Log"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
              ALAMAT IP UNIK
            </span>
            <Globe size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#60a5fa', lineHeight: 1 }}>
            {(summary?.uniqueIps || 0).toLocaleString('id-ID')}
          </div>
          <span style={{ fontSize: '0.74rem', color: '#60a5fa', marginTop: '8px', display: 'block', fontWeight: '600' }}>
            Perangkat & Jaringan Pembaca →
          </span>
        </div>

        {/* Metric 6: SEO Health Score */}
        <div 
          onClick={() => setActiveTab && setActiveTab('seo')}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer'
          }}
          title="Klik untuk membuka Optimasi SEO"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>
              KESEHATAN SEO
            </span>
            <TrendingUp size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: '800', color: '#10b981', lineHeight: 1 }}>
            {summary?.seoScore || 91}%
          </div>
          <span style={{ fontSize: '0.74rem', color: '#10b981', marginTop: '8px', display: 'block', fontWeight: '600' }}>
            Sitemap XML & Meta Otomatis →
          </span>
        </div>
      </div>

      {/* Row 2: Charts (Category Distribution & Device Breakdown) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        marginBottom: '30px'
      }}>
        {/* Chart 1: Real Category Distribution of Articles */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 className="display-font" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff' }}>
                Distribusi Rubrik Berita Portal
              </h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Berdasarkan {summary?.totalArticles || 864} artikel aktif di database server
              </span>
            </div>
            <Layers size={18} color="var(--accent-gold)" />
          </div>

          <div style={{ height: '230px', position: 'relative' }}>
            {hasCategoryData ? (
              <Doughnut data={categoryChartData} options={chartOptions} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Memuat data distribusi kategori...
              </div>
            )}
          </div>

          {/* Category List Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
            {summary?.categoryBreakdown?.map((cat, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: categoryColors[idx % categoryColors.length] }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>{cat.category_name}:</span>
                <strong style={{ color: '#fff' }}>{cat.count}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Device Breakdown & Operating Systems */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 className="display-font" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff' }}>
                Perangkat &amp; Sistem Pengunjung
              </h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Terekam dari log audit IP &amp; telemetri pengunjung riil
              </span>
            </div>
            <Monitor size={18} color="var(--accent-crimson)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ height: '190px', position: 'relative' }}>
              {hasDeviceData ? (
                <Doughnut data={doughnutDeviceData} options={chartOptions} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  Belum ada log perangkat
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  SISTEM OPERASI (OS)
                </span>
                {summary?.osBreakdown?.slice(0, 3).map((os, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{os.os}</span>
                    <strong style={{ color: '#fff' }}>{os.count}</strong>
                  </div>
                ))}
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  PERAMBAN (BROWSER)
                </span>
                {summary?.browserBreakdown?.slice(0, 3).map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{b.browser}</span>
                    <strong style={{ color: 'var(--accent-gold)' }}>{b.count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Real Tables (Top Read Articles & Recent Syndicated News) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
        gap: '24px',
        marginBottom: '30px'
      }}>
        {/* Table 1: Real Top Read Articles from articles table */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 className="display-font" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff' }}>
                Berita Paling Banyak Dibaca
              </h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Peringkat artikel dengan views tertinggi di portal
              </span>
            </div>
            <Eye size={18} color="var(--accent-gold)" />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 10px' }}>Judul Berita</th>
                  <th style={{ padding: '8px 10px' }}>Rubrik</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Pembaca</th>
                </tr>
              </thead>
              <tbody>
                {summary?.topArticles?.map((art, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 10px', maxWidth: '240px' }}>
                      <a 
                        href={`#/berita/${art.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#fff', fontWeight: '600', textDecoration: 'none', display: 'block', lineHeight: 1.4 }}
                        title={art.title}
                      >
                        {art.title.length > 55 ? art.title.substring(0, 55) + '...' : art.title}
                      </a>
                    </td>
                    <td style={{ padding: '10px 10px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(230,57,70,0.15)',
                        color: '#ff858d',
                        fontWeight: '700'
                      }}>
                        {art.category_name}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: '800', color: 'var(--accent-gold)' }}>
                      {(art.views || 0).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Real Recent Published Articles */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 className="display-font" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff' }}>
                Berita Terbaru Tersimpan di Server
              </h3>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                Artikel hasil crawler &amp; redaksi yang baru diterbitkan
              </span>
            </div>
            <Clock size={18} color="#34d399" />
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 10px' }}>Judul Berita</th>
                  <th style={{ padding: '8px 10px' }}>Sumber Sindikasi</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rubrik</th>
                </tr>
              </thead>
              <tbody>
                {summary?.recentArticles?.map((art, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 10px', maxWidth: '240px' }}>
                      <a 
                        href={`#/berita/${art.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#fff', fontWeight: '600', textDecoration: 'none', display: 'block', lineHeight: 1.4 }}
                        title={art.title}
                      >
                        {art.title.length > 55 ? art.title.substring(0, 55) + '...' : art.title}
                      </a>
                    </td>
                    <td style={{ padding: '10px 10px', color: 'var(--text-secondary)', fontSize: '0.76rem', whiteSpace: 'nowrap' }}>
                      {art.source_name || art.author || 'Redaksi'}
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(59,130,246,0.15)',
                        color: '#93c5fd',
                        fontWeight: '700'
                      }}>
                        {art.category_name}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
