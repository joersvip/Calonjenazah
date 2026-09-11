import React from 'react';
import { ShieldAlert, Heart, Lock, Compass, Rss, Mail, Send } from 'lucide-react';

export default function Footer({ navigate }) {
  return (
    <footer style={{
      background: '#07090c',
      borderTop: '1px solid var(--border-subtle)',
      marginTop: '60px',
      padding: '50px 0 30px'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
          marginBottom: '40px'
        }}>
          {/* Brand & Manifesto */}
          <div style={{ maxWidth: '350px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'var(--accent-crimson)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldAlert size={20} color="#fff" />
              </div>
              <h2 className="brand-font" style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '2px', color: '#fff' }}>
                CALON <span style={{ color: 'var(--accent-crimson)' }}>JENAZAH</span>
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
              Portal media independen yang mendedikasikan jurnalisme untuk membongkar kebenaran, menuntut keadilan, dan mengingatkan insan manusia akan batas akhir kehidupan duniawi.
            </p>
            <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontStyle: 'italic', borderLeft: '2px solid var(--accent-gold)', paddingLeft: '10px' }}>
              "Kullu nafsin dza'iqatul maut — Tiap-tiap yang bernyawa akan merasakan mati." (QS. Ali Imran: 185)
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="display-font" style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '16px', color: '#fff', letterSpacing: '0.5px' }}>
              RUBRIK UTAMA
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li><a href="#/kategori/investigasi-kriminal" style={{ transition: 'color 0.2s' }}>• Investigasi & Kriminal</a></li>
              <li><a href="#/kategori/misteri-sains-ajal" style={{ transition: 'color 0.2s' }}>• Misteri & Sains Ajal</a></li>
              <li><a href="#/kategori/hukum-keadilan" style={{ transition: 'color 0.2s' }}>• Hukum & Peradilan</a></li>
              <li><a href="#/kategori/politik-kuasa" style={{ transition: 'color 0.2s' }}>• Politik & Kuasa</a></li>
              <li><a href="#/kategori/budaya-religi" style={{ transition: 'color 0.2s' }}>• Budaya & Religi</a></li>
              <li><a href="#/kategori/opini-refleksi" style={{ transition: 'color 0.2s' }}>• Opini & Refleksi</a></li>
            </ul>
          </div>

          {/* Pedoman Siber & Redaksi */}
          <div>
            <h4 className="display-font" style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '16px', color: '#fff', letterSpacing: '0.5px' }}>
              REDAKSI & REGULASI
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li>Pedoman Pemberitaan Media Siber</li>
              <li>Kode Etik Jurnalistik (KEJ)</li>
              <li>Ketentuan Hak Jawab & Koreksi</li>
              <li>Kebijakan Privasi & Data Pribadi</li>
              <li>
                <button
                  onClick={() => navigate('/admin')}
                  style={{
                    color: 'var(--accent-crimson)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.85rem',
                    fontWeight: '600'
                  }}
                >
                  <Lock size={13} />
                  Login Redaksi & Admin
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div>
            <h4 className="display-font" style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '14px', color: '#fff', letterSpacing: '0.5px' }}>
              WARTA PEKANAN
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              Dapatkan rangkuman laporan investigasi dan renungan langsung ke surel Anda setiap Jumat sore.
            </p>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="email"
                placeholder="Alamat email Anda..."
                style={{
                  background: '#12161f',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '0.8rem',
                  color: '#fff',
                  width: '100%'
                }}
              />
              <button style={{
                background: 'var(--accent-crimson)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            © {new Date().getFullYear()} <strong>CALON JENAZAH MEDIA GROUP</strong>. Hak Cipta Dilindungi Undang-Undang.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Verifikasi Dewan Pers ID-9981</span>
            <span>Server Waktu: GMT+7 (WIB)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
