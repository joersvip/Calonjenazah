import React from 'react';
import { Eye, Clock, ExternalLink, Flame, ShieldAlert } from 'lucide-react';

export default function ArticleCard({ article, navigate, layout = 'grid' }) {
  if (!article) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isListLayout = layout === 'list';

  return (
    <article
      onClick={() => navigate(`/berita/${article.slug}`)}
      style={{
        display: 'flex',
        flexDirection: isListLayout ? 'row' : 'column',
        gap: '16px',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        height: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'rgba(230, 57, 70, 0.4)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
      }}
    >
      {/* Thumbnail Container */}
      <div style={{
        position: 'relative',
        width: isListLayout ? '240px' : '100%',
        minWidth: isListLayout ? '240px' : 'auto',
        height: isListLayout ? '160px' : '200px',
        overflow: 'hidden',
        backgroundColor: '#161922'
      }}>
        <img
          src={article.image_url || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80'}
          alt={article.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80';
          }}
        />

        {/* Category Badge */}
        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
          <span className="badge-category">
            {article.category_name || 'Berita'}
          </span>
        </div>

        {/* Breaking indicator */}
        {Boolean(article.is_breaking) && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'var(--accent-crimson)',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: '800',
            padding: '2px 8px',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Flame size={12} />
            BREAKING
          </div>
        )}
      </div>

      {/* Content Container */}
      <div style={{ padding: isListLayout ? '12px 16px 12px 0' : '14px 18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          {/* Source Attribution Badge if re-uploaded */}
          {article.source_name && (
            <div style={{ marginBottom: '6px' }}>
              <span className="badge-source">
                <ExternalLink size={10} />
                Sumber: {article.source_name}
              </span>
            </div>
          )}

          <h3 className="editorial-title" style={{
            fontSize: isListLayout ? '1.15rem' : '1.1rem',
            color: 'var(--text-primary)',
            marginBottom: '8px',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {article.title}
          </h3>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            marginBottom: '12px',
            display: '-webkit-box',
            WebkitLineClamp: isListLayout ? 2 : 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {article.summary}
          </p>
        </div>

        {/* Card Footer Metadata */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: '10px'
        }}>
          <span>{article.author || 'Redaksi Calon Jenazah'}</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={12} />
              {formatDate(article.created_at)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Eye size={12} />
              {article.views || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
