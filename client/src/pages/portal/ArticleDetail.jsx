import React, { useState, useEffect, useRef } from 'react';
import ArticleCard from '../../components/portal/ArticleCard';
import { 
  Clock, Eye, Share2, Volume2, VolumeX, MessageSquare, 
  ExternalLink, ChevronLeft, Send, Sparkles, AlertCircle, Copy, Check
} from 'lucide-react';

export default function ArticleDetail({ slug, navigate }) {
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fontSize, setFontSize] = useState(18); // default font size in px
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reactions, setReactions] = useState({});
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch article
  useEffect(() => {
    setLoading(true);
    window.scrollTo(0, 0);

    fetch(`/api/articles/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setArticle(data.article);
          setComments(data.comments || []);
          setRelated(data.related || []);
          setReactions(data.article.reactions || {});
          document.title = `${data.article.title} - CALON JENAZAH`;
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Cancel TTS when switching articles
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [slug]);

  // Handle Text-to-Speech (TTS)
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window) || !article) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Clean HTML tags for speech
      const textToRead = `${article.title}. ${article.summary}. ${article.content.replace(/<[^>]*>/g, ' ')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 0.95;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Handle Reactions
  const handleReaction = (type) => {
    if (!article) return;
    fetch(`/api/articles/${article.id}/reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reactionType: type })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setReactions(data.reactions);
        }
      })
      .catch(() => {});
  };

  // Submit Comment
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;

    setCommentSubmitting(true);
    fetch(`/api/articles/${article.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_name: commentName, comment: commentText })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setComments([data.comment, ...comments]);
          setCommentText('');
        }
        setCommentSubmitting(false);
      })
      .catch(() => setCommentSubmitting(false));
  };

  // Share Handlers
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWA = () => {
    const text = encodeURIComponent(`${article?.title}\n${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${article?.title}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Memuat artikel jurnalisme...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '15px' }}>Artikel Tidak Ditemukan</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Artikel yang Anda cari mungkin telah dihapus atau dipindahkan.</p>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'var(--accent-crimson)', color: '#fff', padding: '8px 20px', borderRadius: '6px' }}
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Top Reading Progress Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${scrollProgress}%`,
        height: '4px',
        backgroundColor: 'var(--accent-crimson)',
        boxShadow: '0 0 10px var(--accent-crimson)',
        zIndex: 9999,
        transition: 'width 0.1s ease-out'
      }} />

      <div className="container" style={{ padding: '30px 20px', maxWidth: '960px' }}>
        
        {/* Back navigation */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            marginBottom: '20px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-crimson)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <ChevronLeft size={16} />
          <span>Kembali ke Beranda</span>
        </button>

        {/* Article Meta Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <span className="badge-category" style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
            {article.category_name}
          </span>

          {article.source_name && (
            <span className="badge-source" style={{ fontSize: '0.8rem', padding: '5px 12px' }}>
              <ExternalLink size={12} />
              Sumber Asli: {article.source_name}
            </span>
          )}
        </div>

        {/* Main Title */}
        <h1 className="editorial-title" style={{
          fontSize: '2.4rem',
          lineHeight: 1.25,
          color: '#ffffff',
          marginBottom: '16px',
          letterSpacing: '-0.5px'
        }}>
          {article.title}
        </h1>

        {/* Excerpt Lead */}
        <p style={{
          fontSize: '1.15rem',
          lineHeight: 1.6,
          color: 'var(--text-secondary)',
          borderLeft: '3px solid var(--accent-crimson)',
          paddingLeft: '16px',
          marginBottom: '24px',
          fontStyle: 'italic'
        }}>
          {article.summary}
        </p>

        {/* Author, Date, TTS, and Font Tool Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px',
          padding: '14px 0',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '28px',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            <strong style={{ color: 'var(--text-primary)', display: 'block' }}>
              {article.author || 'Redaksi Calon Jenazah'}
            </strong>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} />
                {new Date(article.created_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={13} />
                {article.views} tayangan
              </span>
            </span>
          </div>

          {/* Interactive Tools: TTS & Font Size Adjuster */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Audio Narrator TTS Button */}
            <button
              onClick={toggleSpeech}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isSpeaking ? 'var(--accent-crimson)' : 'rgba(255,255,255,0.08)',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: '600',
                transition: 'background 0.2s'
              }}
              title="Dengarkan pembacaan berita ini secara audio"
            >
              {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
              <span>{isSpeaking ? 'Hentikan Suara' : 'Dengarkan Berita'}</span>
            </button>

            {/* Font scaling buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden'
            }}>
              <button
                onClick={() => setFontSize(Math.max(15, fontSize - 2))}
                style={{ padding: '6px 10px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}
                title="Perkecil huruf"
              >
                A-
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 4px' }}>|</span>
              <button
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                style={{ padding: '6px 10px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}
                title="Perbesar huruf"
              >
                A+
              </button>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {article.image_url && (
          <div style={{ marginBottom: '32px' }}>
            <img
              src={article.image_url}
              alt={article.title}
              style={{
                width: '100%',
                maxHeight: '520px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                border: '1px solid var(--border-subtle)'
              }}
            />
            {article.source_url && (
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                Sumber asli: <a href={article.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>{article.source_name || 'Tautan Asli'}</a>
              </div>
            )}
          </div>
        )}

        {/* Article Body Content */}
        <div
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.8,
            color: '#e2e8f0',
            fontFamily: 'var(--font-serif)',
            marginBottom: '40px'
          }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '30px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Topik Terkait:</span>
            {article.tags.split(',').map((tag, i) => (
              <span
                key={i}
                onClick={() => navigate(`/cari?q=${encodeURIComponent(tag.trim())}`)}
                style={{
                  fontSize: '0.75rem',
                  padding: '4px 10px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '4px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Reader Reactions Bar */}
        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          marginBottom: '40px'
        }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px', color: '#fff' }}>
            Bagaimana reaksi Anda terhadap liputan ini?
          </h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[
              { type: 'kritis', emoji: '⚖️', label: 'Kritis' },
              { type: 'terkejut', emoji: '😲', label: 'Terkejut' },
              { type: 'berduka', emoji: '🖤', label: 'Berduka' },
              { type: 'sedih', emoji: '😢', label: 'Prihatin' },
              { type: 'kagum', emoji: '✨', label: 'Inspiratif' }
            ].map(rx => (
              <button
                key={rx.type}
                onClick={() => handleReaction(rx.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-crimson)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{rx.emoji}</span>
                <span>{rx.label}</span>
                <span style={{
                  background: 'var(--accent-crimson)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: '700'
                }}>
                  {reactions[rx.type] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Social Share Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 0',
          borderTop: '1px solid var(--border-subtle)',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: '50px'
        }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Share2 size={16} />
            Bagikan Berita:
          </span>

          <button
            onClick={handleShareWA}
            style={{
              background: '#25D366',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '700'
            }}
          >
            WhatsApp
          </button>

          <button
            onClick={handleShareTwitter}
            style={{
              background: '#1DA1F2',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '700'
            }}
          >
            Twitter / X
          </button>

          <button
            onClick={handleCopyLink}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Tersalin!' : 'Salin Tautan'}</span>
          </button>
        </div>

        {/* Comments Section */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <MessageSquare size={20} color="var(--accent-crimson)" />
            <h3 className="display-font" style={{ fontSize: '1.3rem', fontWeight: '800' }}>
              SUARA PEMBACA ({comments.length})
            </h3>
          </div>

          {/* Comment Form */}
          <form
            onSubmit={handleCommentSubmit}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              marginBottom: '30px'
            }}
          >
            <div style={{ marginBottom: '14px' }}>
              <input
                type="text"
                placeholder="Nama Anda atau Inisial..."
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: '#0d1017',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <textarea
                placeholder="Sampaikan refleksi atau pandangan kritis Anda dengan santun dan bertanggung jawab..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
                rows={3}
                style={{
                  width: '100%',
                  background: '#0d1017',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontSize: '0.88rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={commentSubmitting}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--accent-crimson)',
                  color: '#fff',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  opacity: commentSubmitting ? 0.7 : 1
                }}
              >
                <Send size={14} />
                <span>{commentSubmitting ? 'Mengirim...' : 'Kirim Tanggapan'}</span>
              </button>
            </div>
          </form>

          {/* Comments List */}
          {comments.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              Belum ada komentar. Jadilah yang pertama memberikan sudut pandang!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {comments.map((cmt) => (
                <div
                  key={cmt.id}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '14px 18px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {cmt.author_name}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(cmt.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
                    {cmt.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Related Articles Section */}
        {related.length > 0 && (
          <section>
            <h3 className="display-font" style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '20px', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '10px' }}>
              LIPUTAN TERKAIT
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '20px'
            }}>
              {related.map(art => (
                <ArticleCard
                  key={art.id}
                  article={art}
                  navigate={navigate}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
