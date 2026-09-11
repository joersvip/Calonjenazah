import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Radio, MapPin, Monitor, Smartphone, Tablet, 
  Globe, Shield, Clock, ExternalLink, RefreshCw, Users, Activity,
  Layers, Maximize2, Minimize2, Cpu, HardDrive, Wifi, Eye, X,
  Compass, Info, CheckCircle2, ChevronRight
} from 'lucide-react';

// Free Open-Source Map Tile Providers
const MAP_LAYERS = {
  carto_dark: {
    name: 'CARTO Dark (OpenStreetMap)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  },
  osm_standard: {
    name: 'OpenStreetMap Resmi (Standard)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors (Free & Open Source)',
    subdomains: 'abc',
    maxZoom: 19
  },
  osm_hot: {
    name: 'OpenStreetMap Humanitarian (HOT)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors, Tiles style by Humanitarian OpenStreetMap Team',
    subdomains: 'abc',
    maxZoom: 19
  },
  carto_light: {
    name: 'CARTO Positron Light (OpenStreetMap)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }
};

export default function LiveVisitorMap({ liveVisitors = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const currentTileLayerRef = useRef(null);
  const markersGroupRef = useRef(null);

  const [activeLayerKey, setActiveLayerKey] = useState('carto_dark');
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Leaflet Map with Open-Source Tile Layer
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered on Indonesia by default [-2.5489, 118.0149]
      const map = L.map(mapContainerRef.current, {
        center: [-2.5489, 118.0149],
        zoom: 5,
        minZoom: 2,
        maxZoom: 18,
        attributionControl: true
      });

      const config = MAP_LAYERS[activeLayerKey];
      const tileLayer = L.tileLayer(config.url, {
        subdomains: config.subdomains,
        maxZoom: config.maxZoom,
        attribution: config.attribution
      }).addTo(map);

      currentTileLayerRef.current = tileLayer;
      markersGroupRef.current = L.featureGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Handle Layer Switch
  const switchMapLayer = (layerKey) => {
    setActiveLayerKey(layerKey);
    if (!mapInstanceRef.current) return;

    if (currentTileLayerRef.current) {
      mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
    }

    const config = MAP_LAYERS[layerKey];
    const newLayer = L.tileLayer(config.url, {
      subdomains: config.subdomains,
      maxZoom: config.maxZoom,
      attribution: config.attribution
    }).addTo(mapInstanceRef.current);

    currentTileLayerRef.current = newLayer;
  };

  // Reset Center to Indonesia
  const handleResetIndonesia = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([-2.5489, 118.0149], 5, { animate: true });
    }
  };

  // Focus on a specific visitor
  const handleFocusVisitor = (v) => {
    setSelectedVisitor(v);
    if (mapInstanceRef.current && v.latitude && v.longitude) {
      mapInstanceRef.current.setView([v.latitude, v.longitude], 13, { animate: true });
    }
  };

  // Update Markers based on genuine liveVisitors array
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    if (liveVisitors.length === 0) return;

    liveVisitors.forEach((visitor) => {
      const lat = visitor.latitude || -6.2088;
      const lon = visitor.longitude || 106.8456;

      // Custom pulsing radar HTML pin
      const customIcon = L.divIcon({
        className: 'radar-pin',
        html: '<div class="radar-circle"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      const popupHtml = `
        <div style="padding: 6px; min-width: 240px; font-family: Inter, sans-serif; color: #1e293b;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
            <strong style="color: #e63946; font-size: 0.85rem;">🔴 PENGUNJUNG AKTIF</strong>
            <span style="font-size: 0.72rem; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #475569;">
              ${visitor.device_type || 'Desktop'}
            </span>
          </div>

          <div style="font-size: 0.8rem; margin-bottom: 4px;">
            <strong>IP Publik:</strong> <code style="color: #b91c1c; font-weight: 700;">${visitor.ip}</code>
          </div>
          <div style="font-size: 0.8rem; margin-bottom: 4px;">
            <strong>Lokasi:</strong> ${visitor.city || 'Kota'}, ${visitor.region ? visitor.region + ', ' : ''}${visitor.country || 'Indonesia'}
          </div>
          <div style="font-size: 0.8rem; margin-bottom: 4px;">
            <strong>ISP:</strong> ${visitor.isp || 'Penyedia Internet'}
          </div>
          <div style="font-size: 0.8rem; margin-bottom: 4px;">
            <strong>Perangkat:</strong> ${visitor.device_brand || ''} ${visitor.device_model || visitor.os} (${visitor.browser || 'Browser'})
          </div>
          <div style="font-size: 0.75rem; color: #64748b; margin-top: 8px; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
            <strong>Sedang Membaca:</strong><br/>
            <span style="color: #2563eb; font-weight: 600;">${visitor.page_title || visitor.page_url || '/'}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => setSelectedVisitor(visitor));
      markersGroupRef.current.addLayer(marker);
    });

  }, [liveVisitors]);

  // Toggle fullscreen mode on map container
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
  };

  return (
    <div>
      {/* Top Banner Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px 20px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Radio size={20} color="var(--accent-crimson)" />
          <span style={{ fontSize: '0.92rem', color: '#fff', fontWeight: '700' }}>
            Radar Pelacakan Pengunjung Real-Time (Open-Source Map & Live Geolocation API)
          </span>
          <span className="badge-category" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
            OpenStreetMap & ip-api.com
          </span>
        </div>

        {/* Action Controls Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Layer Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} color="var(--text-muted)" />
            <select
              value={activeLayerKey}
              onChange={(e) => switchMapLayer(e.target.value)}
              style={{
                background: '#0d1017',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.78rem',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <option value="carto_dark">🌙 CARTO Dark (OpenStreetMap)</option>
              <option value="osm_standard">🗺️ OpenStreetMap Standard</option>
              <option value="osm_hot">🌍 OSM Humanitarian (HOT)</option>
              <option value="carto_light">☀️ CARTO Positron Light</option>
            </select>
          </div>

          {/* Reset View Button */}
          <button
            onClick={handleResetIndonesia}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.78rem',
              padding: '6px 12px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
            title="Pusatkan Peta ke Seluruh Wilayah Indonesia"
          >
            <Compass size={13} color="var(--accent-gold)" />
            <span>Pusatkan Indonesia</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              fontSize: '0.78rem',
              padding: '6px 10px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
            title={isFullscreen ? "Keluar Layar Penuh" : "Tampilan Layar Penuh"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Live indicator count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
            <span className={liveVisitors.length > 0 ? "pulsing-dot-green" : "pulsing-dot-red"} style={{ width: '8px', height: '8px' }}></span>
            <span style={{ fontWeight: '600', color: liveVisitors.length > 0 ? '#4ade80' : 'var(--text-muted)' }}>
              {liveVisitors.length > 0 ? `${liveVisitors.length} Pengunjung Riil` : 'Menunggu Pengunjung'}
            </span>
          </div>
        </div>
      </div>

      {/* Map + Side Stream Grid */}
      <div 
        className="live-map-grid"
        style={isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 99999,
          background: '#0a0c10',
          padding: '16px',
          height: '100vh'
        } : {}}
      >
        
        {/* Leaflet Interactive Map Container */}
        <div className="live-map-container" style={{
          background: '#0d1117',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Open-Source Attribution & Provider Indicator Badge */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(10,12,16,0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulsing-dot-red" style={{ width: '8px', height: '8px' }}></span>
              <span style={{ color: '#fff', fontWeight: '600' }}>Peta Open-Source:</span>
              <span style={{ color: 'var(--accent-gold)' }}>{MAP_LAYERS[activeLayerKey].name}</span>
            </div>
          </div>
        </div>

        {/* Real-Time Live Visitors Stream Card */}
        <div className="live-map-sidebar" style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 className="display-font" style={{ fontSize: '0.98rem', fontWeight: '800', color: '#fff' }}>
              Pengunjung Terkoneksi ({liveVisitors.length})
            </h3>
            {liveVisitors.length > 0 && (
              <span className="badge-category" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                🟢 Live Tracking
              </span>
            )}
          </div>

          <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {liveVisitors.length === 0 ? (
              <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '30px 20px',
                color: 'var(--text-muted)'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}>
                  <Activity size={22} color="var(--accent-crimson)" />
                </div>
                <h4 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '6px' }}>
                  Menunggu Pengunjung
                </h4>
                <p style={{ fontSize: '0.78rem', lineHeight: 1.5, maxWidth: '240px' }}>
                  Tidak ada pembaca aktif saat ini. Begitu seseorang membuka portal berita dari internet, pin radar open-source & rincian perangkat hardware mereka akan muncul di sini.
                </p>
              </div>
            ) : (
              liveVisitors.map((v, i) => (
                <div
                  key={v.socketId || i}
                  style={{
                    background: selectedVisitor?.socketId === v.socketId ? 'rgba(230,57,70,0.12)' : 'rgba(255,255,255,0.03)',
                    border: selectedVisitor?.socketId === v.socketId ? '1px solid var(--accent-crimson)' : '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedVisitor?.socketId !== v.socketId) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    if (selectedVisitor?.socketId !== v.socketId) e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  }}
                  onClick={() => handleFocusVisitor(v)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="pulsing-dot-green" style={{ width: '6px', height: '6px' }}></span>
                      <span style={{ color: 'var(--accent-gold)', fontWeight: '700', fontFamily: 'monospace' }}>
                        {v.ip}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      color: '#cbd5e1',
                      fontWeight: '600'
                    }}>
                      {v.device_brand ? `${v.device_brand} • ${v.device_type}` : v.device_type || 'Desktop'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', fontWeight: '600', marginBottom: '4px' }}>
                    <MapPin size={12} color="var(--accent-crimson)" />
                    <span>{v.city || 'Kota'}, {v.region ? v.region + ', ' : ''}{v.country || 'Indonesia'}</span>
                  </div>

                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>{v.device_model || v.os}</span>
                    <span>•</span>
                    <span>{v.browser}</span>
                    <span>•</span>
                    <span style={{ color: '#94a3b8' }}>{v.isp || 'ISP'}</span>
                  </div>

                  <div style={{
                    color: '#93c5fd',
                    fontSize: '0.72rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    borderTop: '1px dashed rgba(255,255,255,0.06)',
                    paddingTop: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📖 {v.page_title || v.page_url || '/'}
                    </span>
                    <ChevronRight size={13} color="var(--text-muted)" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* DETAILED VISITOR & DEVICE INSPECTOR MODAL */}
      {selectedVisitor && (
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
            maxWidth: '720px',
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
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(230,57,70,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Activity size={18} color="var(--accent-crimson)" />
                </div>
                <div>
                  <h3 className="display-font" style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fff' }}>
                    Detail Lokasi & Spesifikasi Perangkat Pengunjung
                  </h3>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Data langsung via API Geolocation Terbuka & Browser Hardware Telemetry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVisitor(null)}
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

              {/* 1. SEKSI LOKASI DETAIL (FREE INTERNET API) */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <Globe size={16} color="var(--accent-crimson)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    1. Rincian Lokasi Geografis (Internet API)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Alamat IP Publik:</span>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: '700', fontFamily: 'monospace' }}>
                      {selectedVisitor.ip}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Negara:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.country || 'Indonesia'} ({selectedVisitor.country_code || 'ID'})
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Provinsi / Wilayah:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.region || 'DKI Jakarta'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Kota:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.city || 'Jakarta'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Kode Pos (ZIP):</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.zip_code || '-'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Zona Waktu:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.timezone || 'Asia/Jakarta'}
                    </span>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>ISP & Jaringan Operator:</span>
                    <span style={{ color: '#93c5fd', fontWeight: '600' }}>
                      {selectedVisitor.isp || 'PT Telekomunikasi Indonesia'} {selectedVisitor.as_number ? `(${selectedVisitor.as_number})` : ''}
                    </span>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Koordinat Presisi GPS:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span style={{ color: '#fff', fontFamily: 'monospace' }}>
                        {selectedVisitor.latitude}, {selectedVisitor.longitude}
                      </span>
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${selectedVisitor.latitude}&mlon=${selectedVisitor.longitude}#map=14/${selectedVisitor.latitude}/${selectedVisitor.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: '0.72rem',
                          color: 'var(--accent-gold)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'underline'
                        }}
                      >
                        Buka di OpenStreetMap <ExternalLink size={11} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SEKSI PERANGKAT & HARDWARE DETAIL */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                  <Monitor size={16} color="var(--accent-gold)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    2. Spesifikasi Perangkat & Hardware Pengunjung
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Tipe Perangkat:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.device_type || 'Desktop'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Brand & Model:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.device_brand ? `${selectedVisitor.device_brand} - ` : ''}{selectedVisitor.device_model || 'Workstation'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Sistem Operasi:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.os} {selectedVisitor.os_version || ''} {selectedVisitor.architecture ? `(${selectedVisitor.architecture})` : ''}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Browser & Mesin:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.browser} {selectedVisitor.browser_version || ''}
                      {selectedVisitor.browser_engine ? ` (${selectedVisitor.browser_engine})` : ''}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Resolusi Layar Fisik:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.screen_resolution || '1920x1080'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Ukuran Viewport Jendela:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.viewport || '1920x960'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Pixel Ratio (DPR Retina):</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.pixel_ratio ? `${selectedVisitor.pixel_ratio}x` : '1.0x'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Layar Sentuh (Touchscreen):</span>
                    <span style={{ color: selectedVisitor.touch_support ? '#4ade80' : 'var(--text-muted)', fontWeight: '600' }}>
                      {selectedVisitor.touch_support ? '✓ Didukung (Touchscreen)' : '✕ Tidak Ada'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Jumlah Core Processor:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.cpu_cores ? `${selectedVisitor.cpu_cores} CPU Cores` : '4 Cores'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Estimasi Memori RAM:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.ram_gb ? `${selectedVisitor.ram_gb} GB RAM` : '8 GB'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Tipe Konektivitas:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.connection_type || '4G / Broadband'}
                    </span>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>Bahasa Browser:</span>
                    <span style={{ color: '#fff', fontWeight: '600' }}>
                      {selectedVisitor.language || 'id-ID'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. SEKSI AKTIVITAS BERITA REAL-TIME */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Eye size={16} color="#93c5fd" />
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    3. Berita Yang Sedang Dibaca Saat Ini
                  </span>
                </div>

                <div style={{ background: '#0d1017', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '12px' }}>
                  <h4 style={{ color: '#fff', fontSize: '0.92rem', marginBottom: '6px' }}>
                    {selectedVisitor.page_title || 'Beranda Portal Calon Jenazah'}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <code style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {selectedVisitor.page_url || '/'}
                    </code>
                    <a
                      href={`#${selectedVisitor.page_url}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: 'var(--accent-crimson)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      Buka Halaman <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 24px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              background: 'var(--bg-surface)'
            }}>
              <button
                onClick={() => setSelectedVisitor(null)}
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
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
