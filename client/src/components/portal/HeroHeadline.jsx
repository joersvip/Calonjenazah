import React from 'react';
import { Flame, Clock, Eye, ChevronRight, Bookmark } from 'lucide-react';

export default function HeroHeadline({ featuredArticle, secondaryArticles = [], navigate }) {
  if (!featuredArticle) return null;

  return (
    <section style={{ marginBottom: '40px' }}>
      <div className="hero-grid">
        {/* Main Hero Card (Large) */}
        <div
          onClick={() => navigate(`/berita/${featuredArticle.slug}`)}
          className="hero-main-card"
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            cursor: 'pointer',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}
        >
          {/* Background Image with Dark Vignette Gradient */}
          <img
            src={featuredArticle.image_url}
            alt={featuredArticle.title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1,
              transition: 'transform 0.6s ease'
            }}
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(10,12,16,0.1) 0%, rgba(10,12,16,0.7) 50%, rgba(10,12,16,0.96) 100%)',
            zIndex: 2
          }} />

          {/* Foreground Info */}
          <div style={{ position: 'relative', zIndex: 3, maxWidth: '820px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <span style={{
                background: 'var(--accent-crimson)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '4px 12px',
                borderRadius: '4px',
                letterSpacing: '1px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <Flame size={14} />
                SOROTAN UTAMA
              </span>
              <span className="badge-category" style={{ background: 'rgba(0,0,0,0.5)', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                {featuredArticle.category_name}
              </span>
            </div>

            <h2 className="editorial-title hero-title-text" style={{
              color: '#ffffff',
              lineHeight: 1.25,
              marginBottom: '14px',
              textShadow: '0 2px 10px rgba(0,0,0,0.9)'
            }}>
              {featuredArticle.title}
            </h2>

            <p style={{
              color: '#d1d5db',
              fontSize: '1rem',
              lineHeight: 1.6,
              marginBottom: '20px',
              maxWidth: '750px',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {featuredArticle.summary}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>
                Oleh: {featuredArticle.author}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={14} />
                {new Date(featuredArticle.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Eye size={14} />
                {featuredArticle.views || 0} dibaca
              </span>
            </div>
          </div>
        </div>

        {/* Side Trending / Secondary Headlines */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--accent-crimson)',
            paddingBottom: '8px'
          }}>
            <h3 className="display-font" style={{ fontSize: '1.1rem', fontWeight: '800', letterSpacing: '0.5px' }}>
              TERPOPULER HARI INI
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent-crimson)', fontWeight: '700' }}>
              REKOMENDASI REDAKSI
            </span>
          </div>

          {secondaryArticles.slice(0, 3).map((art, idx) => (
            <div
              key={art.id}
              onClick={() => navigate(`/berita/${art.slug}`)}
              style={{
                display: 'flex',
                gap: '14px',
                padding: '12px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(230, 57, 70, 0.4)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <span className="brand-font" style={{
                fontSize: '1.8rem',
                fontWeight: '900',
                color: 'var(--accent-crimson)',
                lineHeight: 1,
                minWidth: '28px'
              }}>
                0{idx + 1}
              </span>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', textTransform: 'uppercase', fontWeight: '700' }}>
                  {art.category_name}
                </span>
                <h4 className="editorial-title" style={{
                  fontSize: '0.95rem',
                  lineHeight: 1.35,
                  margin: '4px 0',
                  color: 'var(--text-primary)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {art.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>{art.views || 0} pembaca</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
