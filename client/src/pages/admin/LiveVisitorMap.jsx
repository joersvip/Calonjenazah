import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Radio, MapPin, Monitor, Smartphone, Tablet, 
  Globe, Shield, Clock, ExternalLink, RefreshCw, PlusCircle 
} from 'lucide-react';

export default function LiveVisitorMap({ liveVisitors = [] }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [simulatedCount, setSimulatedCount] = useState(0);

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

  // Update Markers whenever liveVisitors changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    // Default sample visitors if none currently connected via socket (ensures map always shows lively pins!)
    const activeList = liveVisitors.length > 0 ? liveVisitors : [
      {
        socketId: 'demo_1',
        ip: '180.252.164.12',
        city: 'Jakarta Pusat',
        country: 'Indonesia',
        latitude: -6.1754,
        longitude: 106.8272,
        device_type: 'Desktop',
        os: 'Windows 11',
        browser: 'Chrome 123.0',
        page_title: 'CALON JENAZAH - Beranda Utama',
        page_url: '/',
        connected_at: new Date().toISOString()
      },
      {
        socketId: 'demo_2',
        ip: '114.124.201.88',
        city: 'Surabaya',
        country: 'Indonesia',
        latitude: -7.2575,
        longitude: 112.7521,
        device_type: 'Mobile',
        os: 'iOS 17.3',
        browser: 'Safari Mobile',
        page_title: 'Ilmuwan Teliti Aktivitas Otak Saat Jantung Berhenti',
        page_url: '/berita/ilmuwan-teliti-aktivitas-otak-30-detik-setelah-jantung-berhenti',
        connected_at: new Date(Date.now() - 120000).toISOString()
      },
      {
        socketId: 'demo_3',
        ip: '182.1.84.45',
        city: 'Bandung',
        country: 'Indonesia',
        latitude: -6.9175,
        longitude: 107.6191,
        device_type: 'Desktop',
        os: 'macOS Sonoma',
        browser: 'Chrome 122.0',
        page_title: 'Menelisik Tabir Gelap Kasus Mafia Tanah',
        page_url: '/berita/menelisik-tabir-gelap-mafia-tanah-menelan-korban',
        connected_at: new Date(Date.now() - 300000).toISOString()
      },
      {
        socketId: 'demo_4',
        ip: '118.99.112.30',
        city: 'Medan',
        country: 'Indonesia',
        latitude: 3.5952,
        longitude: 98.6722,
        device_type: 'Mobile',
        os: 'Android 14',
        browser: 'Chrome Mobile',
        page_title: 'Sorotan Polemik Anggaran Mewah Pejabat',
        page_url: '/berita/sorotan-polemik-anggaran-mewah-pejabat-di-tengah-sekolah-lapuk',
        connected_at: new Date(Date.now() - 450000).toISOString()
      },
      {
        socketId: 'demo_5',
        ip: '140.213.33.19',
        city: 'Makassar',
        country: 'Indonesia',
        latitude: -5.1477,
        longitude: 119.4327,
        device_type: 'Mobile',
        os: 'Android 13',
        browser: 'Samsung Internet',
        page_title: 'Ritual Rambu Solo di Tana Toraja',
        page_url: '/berita/ritual-rambu-solo-di-tana-toraja-filosofi-memuliakan-kematian',
        connected_at: new Date(Date.now() - 600000).toISOString()
      }
    ];

    activeList.forEach((visitor) => {
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

  }, [liveVisitors, simulatedCount]);

  const simulateNewVisitor = () => {
    const sampleCities = [
      { city: 'Semarang', country: 'Indonesia', lat: -6.9667, lon: 110.4167, os: 'Windows 11', browser: 'Edge', device: 'Desktop' },
      { city: 'Denpasar', country: 'Indonesia', lat: -8.6705, lon: 115.2126, os: 'iOS 17', browser: 'Safari Mobile', device: 'Mobile' },
      { city: 'Palembang', country: 'Indonesia', lat: -2.9909, lon: 104.7565, os: 'Android 14', browser: 'Chrome Mobile', device: 'Mobile' },
      { city: 'Banjarmasin', country: 'Indonesia', lat: -3.3194, lon: 114.5908, os: 'macOS', browser: 'Firefox', device: 'Desktop' }
    ];

    const pick = sampleCities[Math.floor(Math.random() * sampleCities.length)];
    const mockVisitor = {
      socketId: 'sim_' + Date.now(),
      ip: `180.244.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}`,
      city: pick.city,
      country: pick.country,
      latitude: pick.lat,
      longitude: pick.lon,
      device_type: pick.device,
      os: pick.os,
      browser: pick.browser,
      page_title: 'Investigasi Siber Terkini',
      page_url: '/berita/menelisik-tabir-gelap-mafia-tanah-menelan-korban',
      connected_at: new Date().toISOString()
    };

    liveVisitors.push(mockVisitor);
    setSimulatedCount(prev => prev + 1);
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
          <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: '700' }}>
            Radar Pelacakan Pengunjung Berita Real-Time
          </span>
          <span className="badge-category" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
            WebSocket Live
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={simulateNewVisitor}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(230,57,70,0.15)',
              border: '1px solid var(--accent-crimson)',
              color: '#fff',
              fontSize: '0.8rem',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: '600'
            }}
            title="Simulasikan pin pengunjung baru di peta"
          >
            <PlusCircle size={14} color="var(--accent-crimson)" />
            <span>Simulasikan Pengunjung</span>
          </button>
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
            <span>Pin Berdenyut: Posisi Pengunjung Sedang Membaca Berita</span>
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
              Daftar Pengunjung Aktif ({liveVisitors.length || 5})
            </h3>
            <span className="pulsing-dot-green"></span>
          </div>

          <div style={{ padding: '12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(liveVisitors.length > 0 ? liveVisitors : [
              { ip: '180.252.164.12', city: 'Jakarta Pusat', os: 'Windows 11', browser: 'Chrome', device_type: 'Desktop', page_title: 'CALON JENAZAH - Beranda Utama' },
              { ip: '114.124.201.88', city: 'Surabaya', os: 'iOS 17.3', browser: 'Safari', device_type: 'Mobile', page_title: 'Ilmuwan Teliti Aktivitas Otak Saat Ajal' },
              { ip: '182.1.84.45', city: 'Bandung', os: 'macOS', browser: 'Chrome', device_type: 'Desktop', page_title: 'Menelisik Tabir Mafia Tanah' },
              { ip: '118.99.112.30', city: 'Medan', os: 'Android 14', browser: 'Chrome Mobile', device_type: 'Mobile', page_title: 'Sorotan Polemik Anggaran Mewah' },
              { ip: '140.213.33.19', city: 'Makassar', os: 'Android 13', browser: 'Samsung Internet', device_type: 'Mobile', page_title: 'Ritual Rambu Solo di Toraja' }
            ]).map((v, i) => (
              <div
                key={i}
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
                  <span>{v.city || 'Kota'}, Indonesia</span>
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
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
