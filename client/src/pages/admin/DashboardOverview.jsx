import React, { useState, useEffect } from 'react';
import { 
  Users, Radio, Eye, FileText, Monitor, Smartphone, 
  Tablet, Globe, ArrowUpRight, TrendingUp, ShieldCheck 
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

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSummary(data.summary);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Device Breakdown Chart Data (Real data only)
  const hasDeviceData = summary?.deviceBreakdown && summary.deviceBreakdown.length > 0;
  const deviceLabels = hasDeviceData ? summary.deviceBreakdown.map(d => d.device_type) : [];
  const deviceData = hasDeviceData ? summary.deviceBreakdown.map(d => d.count) : [];

  const doughnutData = {
    labels: deviceLabels,
    datasets: [
      {
        data: deviceData,
        backgroundColor: ['#e63946', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'],
        borderColor: '#12161f',
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
        labels: { color: '#9aa5b8', font: { family: 'Inter', size: 12 } }
      }
    }
  };

  return (
    <div>
      {/* 4 Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Metric 1: Live Visitors */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          boxShadow: 'var(--shadow-card)',
          cursor: 'pointer'
        }} onClick={() => setActiveTab('live-tracking')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              PENGUNJUNG REALTIME
            </span>
            <span className="pulsing-dot-green"></span>
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#34d399', lineHeight: 1 }}>
            {liveVisitors.length || summary?.activeLiveCount || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
            Terdeteksi aktif di peta live →
          </span>
        </div>

        {/* Metric 2: Total Visits */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              TOTAL TAYANGAN
            </span>
            <Eye size={18} color="var(--accent-crimson)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>
            {summary?.totalVisits || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
            Akumulasi log audit pengunjung
          </span>
        </div>

        {/* Metric 3: Unique IPs */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          boxShadow: 'var(--shadow-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>
              ALAMAT IP UNIK
            </span>
            <Globe size={18} color="var(--accent-gold)" />
          </div>
          <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--accent-gold)', lineHeight: 1 }}>
            {summary?.uniqueIps || 0}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
            Perangkat & Jaringan berbeda
          </span>
        </div>

        {/* Metric 4: Shortcut Re-Upload */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(230,57,70,0.15) 0%, rgba(18,22,31,0.9) 100%)',
          border: '1px solid var(--accent-crimson)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-card)'
        }} onClick={() => setActiveTab('reupload')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-crimson)', textTransform: 'uppercase', fontWeight: '700' }}>
              RE-UPLOAD LINK
            </span>
            <ArrowUpRight size={18} color="var(--accent-crimson)" />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', lineHeight: 1.3 }}>
            Tarik Berita Instan
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', display: 'block' }}>
            Cukup tempel tautan media lain →
          </span>
        </div>
      </div>

      {/* Grid: Charts & Analytics Breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        marginBottom: '30px'
      }}>
        {/* Device Breakdown Card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '24px'
        }}>
          <h3 className="display-font" style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>
            Distribusi Perangkat Pengakses
          </h3>
          <div style={{ height: '240px', position: 'relative' }}>
            {hasDeviceData ? (
              <Doughnut data={doughnutData} options={chartOptions} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                Belum ada data kunjungan yang tercatat.
              </div>
            )}
          </div>
        </div>

        {/* Operating Systems & Browsers */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '24px'
        }}>
          <h3 className="display-font" style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>
            Sistem Operasi & Browser Terbanyak
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              SISTEM OPERASI (OS):
            </span>
            {summary?.osBreakdown && summary.osBreakdown.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summary.osBreakdown.map((os, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{os.os}</span>
                    <span style={{ fontWeight: '700', color: 'var(--accent-crimson)' }}>{os.count} kunjungan</span>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada data OS</span>
            )}
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
              BROWSER:
            </span>
            {summary?.browserBreakdown && summary.browserBreakdown.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summary.browserBreakdown.map((b, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-primary)' }}>{b.browser}</span>
                    <span style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>{b.count} kunjungan</span>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Belum ada data browser</span>
            )}
          </div>
        </div>
      </div>

      {/* Top Read Articles Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '24px'
      }}>
        <h3 className="display-font" style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>
          Berita Paling Banyak Dibaca (Audit Log)
        </h3>

        {summary?.topArticles?.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Belum ada catatan pembaca artikel.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px' }}>Judul Halaman Berita</th>
                  <th style={{ padding: '10px 14px' }}>URL Path</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total Akses</th>
                </tr>
              </thead>
              <tbody>
                {summary?.topArticles?.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 14px', color: '#fff', fontWeight: '600' }}>
                      {item.page_title}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {item.page_url}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', color: 'var(--accent-crimson)' }}>
                      {item.views} views
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
