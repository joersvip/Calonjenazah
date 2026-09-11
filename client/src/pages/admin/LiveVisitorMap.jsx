import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Radio, MapPin, Monitor, Smartphone, Tablet, 
  Globe, Shield, Clock, ExternalLink, RefreshCw, Users, Activity
} from 'lucide-react';

export default function LiveVisitorMap({ liveVisitors = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Centered on Indonesia by default [-2.5489, 118.0149]
      const map = L.map(mapContainerRef.current, {
        center: [-2.5489, 118.0149],
        zoom: 5,
        minZoom: 2,
        maxZoom: 18,
        attributionControl: false
      });

      // Dark Matter CartoDB tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(map);

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

  // Update Markers strictly based on genuine liveVisitors array (Production Mode)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    // Only real connected visitors
    if (liveVisitors.length === 0) return;

    liveVisitors.forEach((visitor) => {
      const lat = visitor.latitude || -6.2088;
      const lon = visitor.longitude || 106.8456;

      // Create Custom Animated Radar HTML Pin
      const customIcon = L.divIcon({
        className: 'radar-pin',
        html: '<div class="radar-circle"></div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([lat, lon], { icon: customIcon });

      const popupHtml = `
        <div style="padding: 6px; min-width: 220px; font-family: Inter, sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; margin-bottom: 8px;">
            <strong style="color: #e63946; font-size: 0.85rem;">🔴 PENGUNJUNG LIVE</strong>
            <span style="font-size: 0.72rem; color: #9aa5b8;">${visitor.device_type || 'Desktop'}</span>
          </div>

          <div style="font-size: 0.8rem; margin-bottom: 4px;">
            <strong>IP:</strong> <code style="color: #d4af37;">${visitor.ip}</code>
          </div>
          <div style="font-size: 0.8rem; margin-bottom: 4px;">
            <strong>Lokasi:</strong> ${visitor.city || 'Kota'}, ${visitor.country || 'Indonesia'}
          </div>
          <div style="font-size: 0.8rem; margin-bottom: 4px;">
            <strong>Perangkat:</strong> ${visitor.os || 'OS'} (${visitor.browser || 'Browser'})
          </div>
          <div style="font-size: 0.75rem; color: #cbd5e1; margin-top: 8px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 6px;">
            <strong>Halaman:</strong><br/>
            <span style="color: #93c5fd;">${visitor.page_title || visitor.page_url || '/'}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => setSelectedVisitor(visitor));
      markersGroupRef.current.addLayer(marker);
    });

  }, [liveVisitors]);

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
          <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '700' }}>
            Radar Pelacakan Pengunjung Berita Real-Time (Mode Produksi)
          </span>
          <span className="badge-category" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
            WebSocket Live Telemetry
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span className={liveVisitors.length > 0 ? "pulsing-dot-green" : "pulsing-dot-red"} style={{ width: '8px', height: '8px' }}></span>
            <span>
              {liveVisitors.length > 0 ? `${liveVisitors.length} Sesi Terhubung` : 'Menunggu Pengunjung Aktif'}
            </span>
          </div>
        </div>
      </div>

      {/* Map + Side Details Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', height: '620px' }}>
        
        {/* Leaflet Interactive Map Container */}
        <div style={{
          background: '#0d1117',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Map Legend Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            background: 'rgba(10,12,16,0.85)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '8px 14px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span className="pulsing-dot-red" style={{ width: '8px', height: '8px' }}></span>
            <span>Pin Berdenyut: Pengunjung Riil Membaca Berita</span>
          </div>
        </div>

        {/* Real-Time Live Visitors Stream Card */}
        <div style={{
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
            <h3 className="display-font" style={{ fontSize: '1rem', fontWeight: '800', color: '#fff' }}>
              Daftar Pengunjung Aktif ({liveVisitors.length})
            </h3>
            {liveVisitors.length > 0 && <span className="pulsing-dot-green"></span>}
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
                  Tidak ada pengunjung aktif saat ini. Begitu seseorang membuka portal berita, pin radar lokasi & info perangkat akan terpancar di sini secara real-time.
                </p>
              </div>
            ) : (
              liveVisitors.map((v, i) => (
                <div
                  key={v.socketId || i}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-crimson)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  onClick={() => setSelectedVisitor(v)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: '700' }}>
                      {v.ip}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      background: 'rgba(255,255,255,0.06)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: 'var(--text-muted)'
                    }}>
                      {v.device_type || 'Desktop'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', fontWeight: '600', marginBottom: '4px' }}>
                    <MapPin size={12} color="var(--accent-crimson)" />
                    <span>{v.city || 'Kota'}, {v.country || 'Indonesia'}</span>
                  </div>

                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '6px' }}>
                    {v.os} • {v.browser}
                  </div>

                  <div style={{
                    color: '#93c5fd',
                    fontSize: '0.72rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    borderTop: '1px dashed rgba(255,255,255,0.06)',
                    paddingTop: '6px'
                  }}>
                    📖 {v.page_title || v.page_url || '/'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
