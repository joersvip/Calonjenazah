import React, { useState, useEffect, useRef } from 'react';
import ArticleCard from '../../components/portal/ArticleCard';
import { 
  Clock, Eye, Share2, Volume2, VolumeX, MessageSquare, 
  ExternalLink, ChevronLeft, Send, Sparkles, AlertCircle, Copy, Check,
  X, BookOpen, Globe, Loader2, ArrowUpRight
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

  // Floating Full Article Pop-up States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalArticle, setModalArticle] = useState(null);
  const [modalViewMode, setModalViewMode] = useState('reader'); // 'reader' | 'web'
  const [modalError, setModalError] = useState(null);
  const [modalFontSize, setModalFontSize] = useState(17);
  const [modalIsSpeaking, setModalIsSpeaking] = useState(false);

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

  // Listen to Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isModalOpen) {
        closeFullArticleModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

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

  // Open Floating Pop-Up Modal for full news article
  const openFullArticleModal = (targetUrl, linkText) => {
    const urlToUse = targetUrl || article?.source_url;
    if (!urlToUse) return;

    setIsModalOpen(true);
    setModalUrl(urlToUse);
    const cleanTitle = linkText && !linkText.toLowerCase().includes('continue reading') && !linkText.toLowerCase().includes('baca selengkapnya') && !linkText.toLowerCase().includes('read more')
      ? linkText
      : article?.title || 'Naskah Berita Lengkap';
    setModalTitle(cleanTitle);
    setModalLoading(true);
    setModalError(null);
    setModalArticle(null);
    setModalViewMode('reader');

    // Cancel main page TTS
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setModalIsSpeaking(false);
    }

    fetch('/api/articles/external-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlToUse })
    })
      .then(res => res.json())
      .then(data => {
        setModalLoading(false);
        if (data.success && data.article && data.article.content) {
          setModalArticle(data.article);
        } else {
          setModalError(data.error || 'Naskah berita tidak dapat diekstrak otomatis. Anda dapat beralih ke tampilan web asli langsung.');
          setModalViewMode('web');
        }
      })
      .catch(err => {
        setModalLoading(false);
        setModalError('Gangguan jaringan saat mengambil naskah: ' + err.message);
        setModalViewMode('web');
      });
  };

  // Close Floating Pop-Up Modal
  const closeFullArticleModal = () => {
    setIsModalOpen(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setModalIsSpeaking(false);
    }
  };

  // Toggle Text-to-Speech in Modal
  const toggleModalSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (modalIsSpeaking) {
      window.speechSynthesis.cancel();
      setModalIsSpeaking(false);
    } else {
      const textToRead = `${modalArticle?.title || article?.title}. ${modalArticle?.summary || ''}. ${(modalArticle?.content || '').replace(/<[^>]*>/g, ' ')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'id-ID';
      utterance.rate = 1.0;
      utterance.pitch = 0.95;
      utterance.onend = () => setModalIsSpeaking(false);
      utterance.onerror = () => setModalIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setModalIsSpeaking(true);
    }
  };

  // Intercept click on any link inside article content (specifically "Continue reading", "Read more", or external sources)
  const handleContentClick = (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    const text = (link.textContent || '').trim().toLowerCase();

    const isContinueReading = 
      link.classList.contains('btn-popup-continue') ||
      Boolean(link.getAttribute('data-popup-url')) ||
      text.includes('continue reading') || 
      text.includes('baca selengkapnya') || 
      text.includes('read more') || 
      text.includes('lanjut membaca') || 
      text.includes('selengkapnya');

    const isExternal = href && (href.startsWith('http://') || href.startsWith('https://')) && !href.includes(window.location.host);

    if (isContinueReading || isExternal) {
      e.preventDefault();
      e.stopPropagation();
      const targetUrl = link.getAttribute('data-popup-url') || href || article?.source_url;
      openFullArticleModal(targetUrl, link.textContent);
    }
  };

  // Enhance article content: transform any "Continue reading" link into an attractive, interactive CTA card
  const getRenderedContent = () => {
    if (!article?.content) return '';
    let html = article.content;

    // Replace Continue reading / Read more / Baca selengkapnya link with custom interactive pop-up card
    const continueRegex = /<a\s+([^>]*?)href=(["'])(http[s]?:\/\/[^"']+)\2([^>]*)>((?:(?!<\/?a\b)[^<])*?(?:continue reading|read more|baca selengkapnya|lanjut membaca)[^<]*?)<\/a>/gi;

    return html.replace(continueRegex, (match, before, quote, href, after, text) => {
      return `
        <div class="continue-reading-card" style="margin: 32px 0 24px 0; padding: 20px 24px; background: linear-gradient(135deg, rgba(230,57,70,0.18) 0%, rgba(18,22,34,0.95) 100%); border: 1px solid rgba(230,57,70,0.45); border-radius: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(230,57,70,0.25); border: 1px solid rgba(230,57,70,0.5); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;">
              📖
            </div>
            <div>
              <div style="font-weight: 800; color: #ffffff; font-size: 1rem; font-family: var(--font-sans); margin-bottom: 3px;">
                Lanjutkan Membaca Berita Lengkap
              </div>
              <div style="font-size: 0.8rem; color: #94a3b8; font-family: var(--font-sans);">
                Klik untuk membuka naskah penuh di pop-up melayang tanpa dialihkan ke situs luar
              </div>
            </div>
          </div>
          <a href="${href}" class="btn-popup-continue" data-popup-url="${href}" style="display: inline-flex; align-items: center; gap: 8px; background: var(--accent-crimson); color: #ffffff; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 0.88rem; text-decoration: none; cursor: pointer; box-shadow: 0 4px 16px rgba(230,57,70,0.5); font-family: var(--font-sans);">
            <span>Buka Berita Full (Pop-Up) ↗</span>
          </a>
        </div>
      `;
    });
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
            <button
              type="button"
              onClick={() => openFullArticleModal(article.source_url, article.source_name)}
              className="badge-source"
              style={{
                fontSize: '0.8rem',
                padding: '5px 12px',
                cursor: article.source_url ? 'pointer' : 'default',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title={article.source_url ? 'Klik untuk membaca naskah penuh di pop-up melayang' : ''}
            >
              <BookOpen size={12} color="var(--accent-gold)" />
              <span>Sumber: {article.source_name}</span>
              {article.source_url && <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)' }}>(Pop-up Full)</span>}
            </button>
          )}
        </div>

        {/* Main Title */}
        <h1 className="editorial-title article-headline" style={{
          lineHeight: 1.25,
          color: '#ffffff',
          marginBottom: '16px',
          letterSpacing: '-0.5px'
        }}>
          {article.title}
        </h1>

        {/* Excerpt Lead */}
        <p className="article-lead" style={{
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
              <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                <span>Sumber Asli:</span>
                <button
                  type="button"
                  onClick={() => openFullArticleModal(article.source_url, article.source_name || 'Berita Asli')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'rgba(212,175,55,0.15)',
                    border: '1px solid rgba(212,175,55,0.4)',
                    color: 'var(--accent-gold)',
                    padding: '3px 10px',
                    borderRadius: '5px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  title="Buka berita penuh di pop-up melayang tanpa dialihkan keluar situs"
                >
                  <BookOpen size={12} />
                  <span>{article.source_name || 'Lihat Berita Penuh di Pop-Up'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Article Body Content */}
        <div
          onClick={handleContentClick}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.8,
            color: '#e2e8f0',
            fontFamily: 'var(--font-serif)',
            marginBottom: '40px'
          }}
          dangerouslySetInnerHTML={{ __html: getRenderedContent() }}
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
          flexWrap: 'wrap',
          gap: '10px',
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

      {/* Floating Pop-Up Modal for Full News Article (Tanpa Alihkan Situs) */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3, 5, 9, 0.88)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={closeFullArticleModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0e121a',
              border: '1px solid rgba(230, 57, 70, 0.4)',
              borderRadius: '14px',
              maxWidth: '920px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(230, 57, 70, 0.15)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '14px 20px',
              background: '#080a0f',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              {/* Left: Source Tag & Headline */}
              <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    color: 'var(--accent-gold)',
                    background: 'rgba(212,175,55,0.15)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(212,175,55,0.3)'
                  }}>
                    <BookOpen size={11} />
                    {modalArticle?.source_name || article?.source_name || 'Sumber Berita Asli'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Check size={11} /> Pop-up Melayang (Tetap di Portal)
                  </span>
                </div>
                <h4 style={{
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  color: '#fff',
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {modalArticle?.title || modalTitle}
                </h4>
              </div>

              {/* Right Tools & Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* View Mode Switcher */}
                <div style={{
                  display: 'flex',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '6px',
                  padding: '2px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <button
                    type="button"
                    onClick={() => setModalViewMode('reader')}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: modalViewMode === 'reader' ? 'var(--accent-crimson)' : 'transparent',
                      color: modalViewMode === 'reader' ? '#fff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Tampilan naskah bersih tanpa iklan dan tanpa pengalihan situs"
                  >
                    <BookOpen size={12} />
                    <span>Naskah Bersih</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalViewMode('web')}
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      fontWeight: '700',
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: modalViewMode === 'web' ? 'var(--accent-crimson)' : 'transparent',
                      color: modalViewMode === 'web' ? '#fff' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Tampilan web asli langsung di dalam frame pop-up"
                  >
                    <Globe size={12} />
                    <span>Web Asli</span>
                  </button>
                </div>

                {/* TTS in Modal */}
                {modalViewMode === 'reader' && modalArticle && (
                  <button
                    type="button"
                    onClick={toggleModalSpeech}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 10px',
                      background: modalIsSpeaking ? 'var(--accent-crimson)' : 'rgba(255,255,255,0.06)',
                      color: '#fff',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                    title="Dengarkan pembacaan naskah ini"
                  >
                    {modalIsSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                )}

                {/* Font Scaler in Modal */}
                {modalViewMode === 'reader' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <button
                      type="button"
                      onClick={() => setModalFontSize(Math.max(14, modalFontSize - 2))}
                      style={{ padding: '4px 8px', color: 'var(--text-secondary)', fontSize: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalFontSize(Math.min(22, modalFontSize + 2))}
                      style={{ padding: '4px 8px', color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', background: 'transparent', cursor: 'pointer' }}
                    >
                      A+
                    </button>
                  </div>
                )}

                {/* External tab fallback button */}
                {modalUrl && (
                  <a
                    href={modalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '5px 8px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)'
                    }}
                    title="Buka tautan asli di tab baru jika diperlukan"
                  >
                    <ArrowUpRight size={14} />
                  </a>
                )}

                {/* Close Modal Button */}
                <button
                  type="button"
                  onClick={closeFullArticleModal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    background: 'rgba(230,57,70,0.15)',
                    border: '1px solid rgba(230,57,70,0.4)',
                    color: '#ff858d',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  title="Tutup pop-up (Esc)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: modalViewMode === 'reader' ? '28px 32px' : '0',
              background: '#0a0d14'
            }}>
              {modalLoading ? (
                <div style={{ padding: '70px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    border: '3px solid rgba(230,57,70,0.2)',
                    borderTopColor: 'var(--accent-crimson)',
                    borderRadius: '50%',
                    margin: '0 auto 18px auto',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: '700', marginBottom: '6px' }}>
                    Mengambil Naskah Berita Penuh...
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.5 }}>
                    Sistem sedang mengekstrak teks berita lengkap langsung dari sumber agar Anda dapat membaca dengan nyaman tanpa dialihkan ke situs luar.
                  </p>
                </div>
              ) : modalViewMode === 'reader' && modalArticle ? (
                <div>
                  {/* Article Title */}
                  <h2 className="editorial-title" style={{
                    fontSize: '1.45rem',
                    lineHeight: 1.35,
                    color: '#ffffff',
                    marginBottom: '14px'
                  }}>
                    {modalArticle.title || modalTitle}
                  </h2>

                  {/* Metadata Byline */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    flexWrap: 'wrap',
                    paddingBottom: '16px',
                    marginBottom: '22px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                  }}>
                    <span>Penulis: <strong style={{ color: '#fff' }}>{modalArticle.author || 'Redaksi Sumber'}</strong></span>
                    {modalArticle.pubDate && (
                      <span>Terbit: {new Date(modalArticle.pubDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    )}
                    <span>Penerbit: <strong style={{ color: 'var(--accent-gold)' }}>{modalArticle.source_name || 'Portal Asli'}</strong></span>
                  </div>

                  {/* Modal Hero Image */}
                  {modalArticle.image_url && (
                    <div style={{ marginBottom: '24px' }}>
                      <img
                        src={modalArticle.image_url}
                        alt={modalArticle.title}
                        style={{
                          width: '100%',
                          maxHeight: '420px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)'
                        }}
                      />
                    </div>
                  )}

                  {/* Full Text Content */}
                  <div
                    style={{
                      fontSize: `${modalFontSize}px`,
                      lineHeight: 1.85,
                      color: '#e2e8f0',
                      fontFamily: 'var(--font-serif)'
                    }}
                    dangerouslySetInnerHTML={{ __html: modalArticle.content }}
                  />

                  {/* Footnote Notice */}
                  <div style={{
                    marginTop: '36px',
                    padding: '16px 20px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <span>
                      ℹ️ Naskah ini ditampilkan melalui <strong>Pop-Up Melayang CALON JENAZAH</strong> untuk kenyamanan membaca tanpa dialihkan keluar situs. Hak cipta tetap milik penerbit asli.
                    </span>
                    {modalUrl && (
                      <a
                        href={modalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}
                      >
                        Buka di Halaman Web Asli ↗
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                /* Web Mode (Iframe Viewer) */
                <div style={{ height: '70vh', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    padding: '8px 16px',
                    background: 'rgba(0,0,0,0.6)',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>🌐 Memuat situs web langsung di dalam pop-up melayang...</span>
                    {modalUrl && (
                      <a href={modalUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>
                        Buka di Tab Baru ↗
                      </a>
                    )}
                  </div>
                  <iframe
                    src={modalUrl}
                    title="Full Article Web View"
                    style={{
                      flex: 1,
                      width: '100%',
                      border: 'none',
                      background: '#fff'
                    }}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
