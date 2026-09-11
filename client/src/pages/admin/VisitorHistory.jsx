import React, { useState, useEffect } from 'react';
import { 
  History, Search, Download, Filter, MapPin, 
  Monitor, Smartphone, Tablet, Clock, RefreshCw, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function VisitorHistory() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = (p = 1) => {
    setLoading(true);
    let url = `/api/analytics/history?page=${p}&limit=20`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (deviceFilter) url += `&device=${encodeURIComponent(deviceFilter)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLogs(data.logs);
          setTotal(data.total);
          setTotalPages(data.totalPages);
          setPage(data.page);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs(1);
  }, [deviceFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleExportCsv = () => {
    window.location.href = '/api/analytics/export-csv';
  };

  return (
    <div>
      {/* Top Filter & Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px'
      }}>
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '380px', width: '100%' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#0d1017',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            padding: '8px 14px',
            width: '100%'
          }}>
            <Search size={15} color="var(--text-muted)" style={{ marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Cari IP, Kota, Browser, OS, Halaman..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.85rem'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              background: 'var(--accent-crimson)',
              color: '#fff',
              fontSize: '0.8rem',
              fontWeight: '700',
              padding: '8px 14px',
              borderRadius: '6px'
            }}
          >
            Cari
          </button>
        </form>

        {/* Filters and CSV Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Device filter dropdown */}
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            style={{
              background: '#0d1017',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '0.82rem',
              color: '#fff',
              outline: 'none'
            }}
          >
            <option value="">Semua Perangkat</option>
            <option value="Desktop">Desktop / Laptop</option>
            <option value="Mobile">Smartphone (Mobile)</option>
            <option value="Tablet">Tablet</option>
          </select>

          {/* Export to CSV Button */}
          <button
            onClick={handleExportCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(212,175,55,0.15)',
              border: '1px solid var(--accent-gold)',
              color: 'var(--accent-gold)',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: '700',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.25)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.15)'}
          >
            <Download size={14} />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Visitor Logs Data Table */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#0c0f16', borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Waktu Akses</th>
                <th style={{ padding: '12px 16px' }}>Alamat IP</th>
                <th style={{ padding: '12px 16px' }}>Lokasi & Koordinat</th>
                <th style={{ padding: '12px 16px' }}>Perangkat & OS</th>
                <th style={{ padding: '12px 16px' }}>Browser</th>
                <th style={{ padding: '12px 16px' }}>Halaman Berita Dikunjungi</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Durasi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Memuat data audit riwayat...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Tidak ada catatan kunjungan yang cocok.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {/* Timestamp */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.visited_at).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>

                    {/* IP Address */}
                    <td style={{ padding: '12px 16px' }}>
                      <code style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>
                        {log.ip}
                      </code>
                    </td>

                    {/* Geolocation */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fff', fontWeight: '600' }}>
                        <MapPin size={12} color="var(--accent-crimson)" />
                        <span>{log.city || 'Kota'}, {log.country || 'Indonesia'}</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        ({Number(log.latitude || 0).toFixed(4)}, {Number(log.longitude || 0).toFixed(4)})
                      </div>
                    </td>

                    {/* Device & OS */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        background: log.device_type === 'Mobile' ? 'rgba(59,130,246,0.15)' : 'rgba(230,57,70,0.15)',
                        color: log.device_type === 'Mobile' ? '#60a5fa' : '#ff858d',
                        marginBottom: '3px'
                      }}>
                        {log.device_type}
                      </span>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {log.os} {log.os_version}
                      </div>
                    </td>

                    {/* Browser */}
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                      <div>{log.browser}</div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {log.screen_resolution}
                      </span>
                    </td>

                    {/* Visited Page */}
                    <td style={{ padding: '12px 16px', maxWidth: '280px' }}>
                      <div style={{
                        color: '#fff',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {log.page_title}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {log.page_url}
                      </div>
                    </td>

                    {/* Duration */}
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      {log.duration_seconds || 0}s
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            Menampilkan halaman <strong>{page}</strong> dari <strong>{totalPages || 1}</strong> (Total <strong>{total}</strong> entri)
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => page > 1 && fetchLogs(page - 1)}
              disabled={page <= 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
                color: page <= 1 ? 'var(--text-muted)' : '#fff',
                cursor: page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={14} />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={() => page < totalPages && fetchLogs(page + 1)}
              disabled={page >= totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '4px',
                color: page >= totalPages ? 'var(--text-muted)' : '#fff',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <span>Berikutnya</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
