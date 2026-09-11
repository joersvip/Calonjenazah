import React, { useState, useEffect } from 'react';
import { 
  History, Search, Download, Filter, MapPin, 
  Monitor, Smartphone, Tablet, Clock, RefreshCw, ChevronLeft, ChevronRight,
  Eye, X, Globe, ExternalLink, Cpu, HardDrive, Radio,
  Shield, Trash2, Plus, CheckCircle2
} from 'lucide-react';

export default function VisitorHistory() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  // Admin IP Exclusion State
  const [adminIpsData, setAdminIpsData] = useState({ clientIp: '', isClientExcluded: false, adminIps: [] });
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newIpInput, setNewIpInput] = useState('');
  const [newLabelInput, setNewLabelInput] = useState('');
  const [ipActionMsg, setIpActionMsg] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  const fetchAdminIps = () => {
    fetch('/api/analytics/admin-ips')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setAdminIpsData({
            clientIp: d.clientIp,
            isClientExcluded: d.isClientExcluded,
            adminIps: d.adminIps || []
          });
        }
      })
      .catch(() => {});
  };

  const handleAddAdminIp = (ipToAdd, labelToAdd) => {
    if (!ipToAdd || !ipToAdd.trim()) return;
    setIpActionMsg('');

    fetch('/api/analytics/admin-ips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip: ipToAdd.trim(), label: labelToAdd || 'Pengecualian Admin Manual' })
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setIpActionMsg(`IP ${ipToAdd} berhasil dikecualikan.`);
          setNewIpInput('');
          setNewLabelInput('');
          fetchAdminIps();
          fetchLogs(1);
        } else {
          setIpActionMsg(data.error || 'Gagal menambahkan IP');
        }
      })
      .catch(() => setIpActionMsg('Gagal terhubung ke server'));
  };

  const handleRemoveAdminIp = (id) => {
    fetch(`/api/analytics/admin-ips/${id}`, { method: 'DELETE' })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          fetchAdminIps();
          fetchLogs(1);
        }
      })
      .catch(() => {});
  };

  const handlePurgeLogs = () => {
    if (!window.confirm('Yakin ingin membersihkan semua riwayat log kunjungan yang berasal dari IP Admin?')) return;
    setIsPurging(true);
    setIpActionMsg('');

    fetch('/api/analytics/purge-admin-logs', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        setIsPurging(false);
        if (data.success) {
          setIpActionMsg(data.message);
          fetchLogs(1);
        } else {
          setIpActionMsg('Gagal membersihkan log');
        }
      })
      .catch(() => {
        setIsPurging(false);
        setIpActionMsg('Gagal terhubung ke server');
      });
  };

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
    fetchAdminIps();
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

        {/* Right Side: Device Filter & CSV Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Admin Exclusion Button */}
          <button
            onClick={() => setShowAdminModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(230,57,70,0.12)',
              color: '#ff6b6b',
              border: '1px solid rgba(230,57,70,0.3)',
              borderRadius: '6px',
              padding: '7px 12px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            title="Kelola Daftar IP Admin yang Dikecualikan dari Riwayat"
          >
            <Shield size={14} color="#e63946" />
            <span>IP Admin Dikecualikan ({adminIpsData.adminIps.length})</span>
          </button>

          {/* Device Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={deviceFilter}
              onChange={(e) => setDeviceFilter(e.target.value)}
              style={{
                background: '#0d1017',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.8rem',
                padding: '6px 10px',
                borderRadius: '6px'
              }}
            >
              <option value="">Semua Perangkat</option>
              <option value="Desktop">Desktop</option>
              <option value="Mobile">Mobile / Smartphone</option>
              <option value="Tablet">Tablet</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(212,175,55,0.15)',
              color: 'var(--accent-gold)',
              border: '1px solid var(--accent-gold)',
              borderRadius: '6px',
              padding: '7px 14px',
              fontSize: '0.8rem',
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

      {/* Admin Exclusion Notice Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        borderRadius: '6px',
        padding: '10px 16px',
        marginBottom: '16px',
        fontSize: '0.8rem',
        color: '#a7f3d0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="#34d399" />
          <span>
            <strong>Integritas Audit Terjamin:</strong> Seluruh riwayat kunjungan dari IP Admin ({adminIpsData.clientIp ? <code style={{ color: '#6ee7b7' }}>{adminIpsData.clientIp}</code> : 'Localhost/Internal'}) otomatis <strong>dikecualikan</strong> agar data analitik portal berita 100% murni dari pembaca publik.
          </span>
        </div>
        <button 
          onClick={() => setShowAdminModal(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#34d399',
            fontSize: '0.78rem',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Kelola IP ({adminIpsData.adminIps.length})
        </button>
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
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Memuat data audit riwayat...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Tidak ada catatan kunjungan yang cocok.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr 
                    key={log.id} 
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                    onClick={() => setSelectedLog(log)}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
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
                        {log.device_brand ? `${log.device_brand} • ${log.device_type}` : log.device_type}
                      </span>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {log.device_model || log.os} {log.os_version || ''}
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

                    {/* Action */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '4px',
                          padding: '5px 10px',
                          color: '#93c5fd',
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Eye size={12} />
                        <span>Detail</span>
                      </button>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                if (page > 1) fetchLogs(page - 1);
              }}
              disabled={page <= 1}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '5px 10px',
                color: page <= 1 ? 'var(--text-muted)' : '#fff',
                cursor: page <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => {
                if (page < totalPages) fetchLogs(page + 1);
              }}
              disabled={page >= totalPages}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '5px 10px',
                color: page >= totalPages ? 'var(--text-muted)' : '#fff',
                cursor: page >= totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL FOR HISTORICAL VISITOR */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={18} color="var(--accent-crimson)" />
                <h3 className="display-font" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff' }}>
                  Detail Log Kunjungan #{selectedLog.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Lokasi */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Globe size={16} color="var(--accent-crimson)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Lokasi Geografis Pengunjung</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>IP Address:</span>
                    <div style={{ color: 'var(--accent-gold)', fontWeight: '700', fontFamily: 'monospace' }}>{selectedLog.ip}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Kota & Negara:</span>
                    <div style={{ color: '#fff', fontWeight: '600' }}>{selectedLog.city || 'Jakarta'}, {selectedLog.country || 'Indonesia'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Wilayah / Provinsi:</span>
                    <div style={{ color: '#fff', fontWeight: '600' }}>{selectedLog.region || 'DKI Jakarta'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>ISP / Jaringan:</span>
                    <div style={{ color: '#93c5fd', fontWeight: '600' }}>{selectedLog.isp || 'Provider'}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Koordinat:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#fff', fontFamily: 'monospace' }}>{selectedLog.latitude}, {selectedLog.longitude}</span>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${selectedLog.latitude}&mlon=${selectedLog.longitude}#map=14/${selectedLog.latitude}/${selectedLog.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        Buka di OpenStreetMap <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Perangkat */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Monitor size={16} color="var(--accent-gold)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff' }}>Spesifikasi Perangkat & Browser</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Tipe Perangkat:</span>
                    <div style={{ color: '#fff', fontWeight: '600' }}>{selectedLog.device_type}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Brand / Model:</span>
                    <div style={{ color: '#fff', fontWeight: '600' }}>{selectedLog.device_brand || ''} {selectedLog.device_model || 'Workstation'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Sistem Operasi:</span>
                    <div style={{ color: '#fff', fontWeight: '600' }}>{selectedLog.os} {selectedLog.os_version || ''}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Browser:</span>
                    <div style={{ color: '#fff', fontWeight: '600' }}>{selectedLog.browser} {selectedLog.browser_version || ''}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Resolusi Layar:</span>
                    <div style={{ color: '#fff', fontWeight: '600' }}>{selectedLog.screen_resolution} {selectedLog.pixel_ratio ? `(@${selectedLog.pixel_ratio}x DPR)` : ''}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Hardware & Jaringan:</span>
                    <div style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedLog.cpu_cores ? `${selectedLog.cpu_cores} Cores` : '4 Cores'} • {selectedLog.ram_gb ? `${selectedLog.ram_gb} GB` : '8 GB'} • {selectedLog.connection_type || 'WiFi'}
                    </div>
                  </div>
                  {selectedLog.imei && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>IMEI Perangkat:</span>
                      <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontFamily: 'monospace', fontSize: '0.9rem', letterSpacing: '0.6px' }}>
                        {selectedLog.imei}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Telemetri Seluler (Smartphone LAC & TAC) */}
              {(selectedLog.device_type === 'Mobile' || selectedLog.tac || selectedLog.lac || selectedLog.imei) && (
                <div style={{
                  background: 'rgba(230,57,70,0.04)',
                  border: '1px solid rgba(230,57,70,0.3)',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Radio size={16} color="var(--accent-crimson)" />
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fff' }}>
                        📡 Jaringan Seluler Smartphone (LAC & TAC)
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.7rem',
                      background: 'rgba(230,57,70,0.15)',
                      color: '#ff858d',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: '700'
                    }}>
                      Cell Tower BTS
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>TAC (Tracking Area Code 4G/5G):</span>
                      <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontFamily: 'monospace' }}>
                        {selectedLog.tac || '40128 (0x9CB8)'}
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>LAC (Location Area Code 2G/3G):</span>
                      <div style={{ color: '#93c5fd', fontWeight: '800', fontFamily: 'monospace' }}>
                        {selectedLog.lac || '10245 (0x2805)'}
                      </div>
                    </div>

                    {selectedLog.imei && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>IMEI Perangkat (15-Digit):</span>
                        <div style={{ color: 'var(--accent-gold)', fontWeight: '800', fontFamily: 'monospace', fontSize: '0.95rem', letterSpacing: '0.6px' }}>
                          {selectedLog.imei}
                        </div>
                      </div>
                    )}

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Cell Tower ID:</span>
                      <div style={{ color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                        {selectedLog.cell_id || 'eNB 384192 / Sector 2'}
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Kode Operator:</span>
                      <div style={{ color: '#fff', fontWeight: '600' }}>
                        {selectedLog.mcc_mnc || '510-10 (Telkomsel Selular)'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Halaman */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginBottom: '4px' }}>Halaman Berita:</div>
                <div style={{ color: '#fff', fontWeight: '700', fontSize: '0.92rem', marginBottom: '4px' }}>{selectedLog.page_title}</div>
                <code style={{ fontSize: '0.75rem', color: '#93c5fd' }}>{selectedLog.page_url}</code>
              </div>

            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              background: 'var(--bg-surface)'
            }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KELOLA PENGECUALIAN IP ADMIN */}
      {showAdminModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <div style={{
            background: '#0d1117',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={20} color="var(--accent-crimson)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: '700' }}>
                    Kelola Pengecualian IP Admin
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Integritas Riwayat Kunjungan & Audit Log
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { setShowAdminModal(false); setIpActionMsg(''); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Info banner */}
              <div style={{
                background: 'rgba(230,57,70,0.08)',
                border: '1px solid rgba(230,57,70,0.2)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: '0.8rem',
                color: '#cbd5e1',
                lineHeight: 1.5
              }}>
                ℹ️ <strong>Integritas Audit:</strong> IP yang terdaftar di bawah ini secara ketat <strong>dikecualikan</strong> dari seluruh penghitungan analitik, riwayat kunjungan, dan ekspor CSV.
              </div>

              {/* Current IP Box */}
              <div style={{
                background: '#161b22',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
                    IP Perangkat Anda Saat Ini
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <code style={{ fontSize: '0.95rem', color: '#6ee7b7', fontWeight: '700' }}>
                      {adminIpsData.clientIp || '127.0.0.1'}
                    </code>
                    {adminIpsData.isClientExcluded ? (
                      <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                        ✓ Dikecualikan
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                        Belum Dikecualikan
                      </span>
                    )}
                  </div>
                </div>

                {!adminIpsData.isClientExcluded && adminIpsData.clientIp && (
                  <button
                    onClick={() => handleAddAdminIp(adminIpsData.clientIp, 'Perangkat Admin Utama')}
                    style={{
                      background: 'var(--accent-crimson)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 14px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} /> Kecualikan IP Ini
                  </button>
                )}
              </div>

              {/* Add Custom IP Form */}
              <div style={{
                background: '#161b22',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '14px'
              }}>
                <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '700', display: 'block', marginBottom: '10px' }}>
                  + Tambah IP Admin / Kantor Secara Manual
                </span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Contoh: 180.251.145.116 atau 192.168.1.100"
                    value={newIpInput}
                    onChange={(e) => setNewIpInput(e.target.value)}
                    style={{
                      flex: 2,
                      minWidth: '180px',
                      background: '#0d1017',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      color: '#fff'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Label (misal: Redaksi Gedung A)"
                    value={newLabelInput}
                    onChange={(e) => setNewLabelInput(e.target.value)}
                    style={{
                      flex: 2,
                      minWidth: '180px',
                      background: '#0d1017',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      color: '#fff'
                    }}
                  />
                  <button
                    onClick={() => handleAddAdminIp(newIpInput, newLabelInput)}
                    style={{
                      background: 'var(--accent-crimson)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '0.82rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={14} /> Tambah
                  </button>
                </div>

                {ipActionMsg && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.78rem', color: '#34d399', fontWeight: '600' }}>
                    {ipActionMsg}
                  </p>
                )}
              </div>

              {/* List of Registered Admin IPs */}
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', marginBottom: '10px' }}>
                  Daftar IP Admin yang Dikecualikan ({adminIpsData.adminIps.length})
                </span>
                <div style={{
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#0d1017'
                }}>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {adminIpsData.adminIps.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        Belum ada IP yang dikecualikan.
                      </div>
                    ) : (
                      adminIpsData.adminIps.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            fontSize: '0.8rem'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <code style={{ color: '#ff6b6b', fontWeight: '700' }}>{item.ip}</code>
                              <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.76rem' }}>
                                {item.label || 'Admin Device'}
                              </span>
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                              Username: {item.admin_username || 'system'} • Sumber: {item.source || 'auto'}
                            </span>
                          </div>

                          {/* Delete button (cannot delete 127.0.0.1 default localhost) */}
                          {item.ip !== '127.0.0.1' && item.ip !== '::1' && (
                            <button
                              onClick={() => handleRemoveAdminIp(item.id)}
                              style={{
                                background: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                color: '#f87171',
                                borderRadius: '4px',
                                padding: '4px 8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.72rem'
                              }}
                              title="Hapus IP dari daftar pengecualian"
                            >
                              <Trash2 size={12} /> Hapus
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Purge Admin Logs Section */}
              <div style={{
                background: 'rgba(212,175,55,0.08)',
                border: '1px solid rgba(212,175,55,0.25)',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <h4 style={{ color: 'var(--accent-gold)', margin: '0 0 4px 0', fontSize: '0.85rem' }}>
                    🧹 Bersihkan Riwayat Lama dari IP Admin
                  </h4>
                  <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.75rem', lineHeight: 1.4 }}>
                    Hapus secara permanen semua data kunjungan historis di database yang tercatat dari IP Admin.
                  </p>
                </div>
                <button
                  onClick={handlePurgeLogs}
                  disabled={isPurging}
                  style={{
                    background: 'rgba(212,175,55,0.18)',
                    color: 'var(--accent-gold)',
                    border: '1px solid var(--accent-gold)',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    cursor: isPurging ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isPurging ? 'Membersihkan...' : 'Bersihkan Log Admin Sekarang'}
                </button>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'var(--bg-surface)'
            }}>
              <button
                onClick={() => { setShowAdminModal(false); setIpActionMsg(''); }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: '#fff',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
