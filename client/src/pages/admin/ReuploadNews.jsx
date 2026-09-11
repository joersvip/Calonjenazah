import React, { useState } from 'react';
import { 
  Link, DownloadCloud, CheckCircle, AlertCircle, 
  ExternalLink, Sparkles, Image, Tag, User, Globe, Eye 
} from 'lucide-react';

export default function ReuploadNews({ navigate }) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [publishedSlug, setPublishedSlug] = useState('');

  // Scraped / Editable Form States
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const [tags, setTags] = useState('');
  const [author, setAuthor] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBreaking, setIsBreaking] = useState(false);

  // Quick Preset Test Links
  const presetLinks = [
    { label: 'Antara News', url: 'https://www.antaranews.com/berita/4488313/polri-bongkar-jaringan-narkoba-internasional' },
    { label: 'Detikcom', url: 'https://news.detik.com/berita/d-7654321/kpk-tahan-tersangka-korupsi-proyek-infrastruktur' },
    { label: 'CNN Indonesia', url: 'https://www.cnnindonesia.com/nasional/20241201-20-112345/sidang-kasus-suap-pejabat-kembali-digelar' }
  ];

  // Perform Scrape
  const handleScrape = (e) => {
    e?.preventDefault();
    if (!sourceUrl.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    fetch('/api/reupload/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: sourceUrl.trim() })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.article) {
          const a = data.article;
          setTitle(a.title || '');
          setSummary(a.summary || '');
          setContent(a.content || '');
          setImageUrl(a.image_url || '');
          setAuthor(a.author || 'Redaksi Sumber');
          setSourceName(a.source_name || '');
          setTags('Sindikasi, Terkini, Nasional');
        } else {
          setErrorMsg(data.error || 'Gagal mengekstrak berita dari tautan tersebut.');
        }
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg('Terjadi kesalahan jaringan atau tautan diblokir: ' + err.message);
        setLoading(false);
      });
  };

  // Publish Scraped Article
  const handlePublish = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Judul dan konten berita wajib terisi.');
      return;
    }

    setPublishing(true);
    setErrorMsg('');

    const payload = {
      title,
      summary: summary || title,
      content,
      image_url: imageUrl,
      category_id: Number(categoryId),
      tags,
      author: author || 'Redaksi Calon Jenazah',
      source_name: sourceName,
      source_url: sourceUrl,
      is_featured: isFeatured,
      is_breaking: isBreaking,
      status: 'published'
    };

    fetch('/api/admin/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSuccessMsg('Berita berhasil dipublikasikan ke Portal CALON JENAZAH!');
          setPublishedSlug(data.slug);
        } else {
          setErrorMsg(data.error || 'Gagal menyimpan berita.');
        }
        setPublishing(false);
      })
      .catch(err => {
        setErrorMsg('Gagal mempublikasikan: ' + err.message);
        setPublishing(false);
      });
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Intro Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(230,57,70,0.1) 0%, rgba(20,24,34,0.8) 100%)',
        border: '1px solid rgba(230,57,70,0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        marginBottom: '26px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Sparkles size={20} color="var(--accent-crimson)" />
          <h2 className="display-font" style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff' }}>
            Re-Upload Berita Cepat via Link Eksternal
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Masukkan alamat web (URL) berita dari portal manapun (Kompas, Detik, CNN, Antara, BBC, dll). Mesin cerdas kami akan mengekstrak judul, gambar, isi lengkap artikel, penulis, dan mencantumkan sumber asli secara otomatis.
        </p>
      </div>

      {/* URL Input Form */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        marginBottom: '30px'
      }}>
        <form onSubmit={handleScrape} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Link size={16} color="var(--accent-crimson)" />
            <span>Tempel Tautan Berita Target (URL)</span>
          </label>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="url"
              placeholder="Contoh: https://news.detik.com/berita/d-12345/judul-berita..."
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              required
              style={{
                flex: '1 1 260px',
                background: '#0a0d14',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '12px 16px',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: 'var(--accent-crimson)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '0.9rem',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 15px rgba(230,57,70,0.3)',
                flex: '1 1 200px'
              }}
            >
              <DownloadCloud size={18} />
              <span>{loading ? 'Mengekstrak...' : 'Tarik Berita Otomatis'}</span>
            </button>
          </div>

          {/* Quick preset links for demonstration */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>Uji Cepat Sumber:</span>
            {presetLinks.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSourceUrl(p.url)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--text-secondary)',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </form>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(230,57,70,0.15)',
            border: '1px solid var(--accent-crimson)',
            color: '#ff858d',
            padding: '12px 16px',
            borderRadius: '6px',
            marginTop: '16px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid #10b981',
            color: '#34d399',
            padding: '14px 20px',
            borderRadius: '6px',
            marginTop: '16px',
            fontSize: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} />
              <span>{successMsg}</span>
            </div>

            {publishedSlug && (
              <button
                onClick={() => navigate(`/berita/${publishedSlug}`)}
                style={{
                  background: '#10b981',
                  color: '#fff',
                  fontWeight: '700',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.8rem'
                }}
              >
                <Eye size={14} />
                <span>Lihat Hasil Terbitan</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Extracted Data Editor Form (Appears when title is loaded) */}
      {title && (
        <form onSubmit={handlePublish} style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '28px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h3 className="display-font" style={{ fontSize: '1.2rem', fontWeight: '800', color: '#fff', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            Draf Hasil Ekstraksi (Dapat Disesuaikan Sebelum Diterbitkan)
          </h3>

          {/* Title */}
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Judul Berita
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                background: '#0d1017',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '1rem',
                color: '#fff',
                fontWeight: '700'
              }}
            />
          </div>

          {/* Image & Preview */}
          <div className="responsive-grid-preview">
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                URL Gambar Sampul (Featured Image)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0d1017',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '0.85rem'
                }}
              />

              <div className="responsive-grid-2" style={{ marginTop: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    Kategori Berita
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0d1017',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '10px',
                      fontSize: '0.85rem',
                      color: '#fff'
                    }}
                  >
                    <option value="1">Investigasi & Kriminal</option>
                    <option value="2">Misteri & Sains Ajal</option>
                    <option value="3">Hukum & Keadilan</option>
                    <option value="4">Politik & Kuasa</option>
                    <option value="5">Budaya & Religi</option>
                    <option value="6">Opini & Refleksi</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                    Sumber Asli (Domain)
                  </label>
                  <input
                    type="text"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#0d1017',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      padding: '10px',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Thumbnail Preview */}
            <div style={{
              background: '#0a0d14',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Cover Preview"
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '4px' }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tidak ada gambar</span>
              )}
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>Pratinjau Sampul</span>
            </div>
          </div>

          {/* Lead Summary */}
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Ringkasan Cuplikan (Lead Excerpt)
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                background: '#0d1017',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '10px',
                fontSize: '0.88rem',
                color: '#fff'
              }}
            />
          </div>

          {/* Full Article Content */}
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
              Isi Konten Berita Lengkap (HTML / Paragraf)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              required
              style={{
                width: '100%',
                background: '#0d1017',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '0.9rem',
                color: '#e2e8f0',
                fontFamily: 'monospace',
                lineHeight: 1.6
              }}
            />
          </div>

          {/* Tags & Author */}
          <div className="responsive-grid-2">
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                Tagar Berita (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Hukum, Siber, Kriminal..."
                style={{
                  width: '100%',
                  background: '#0d1017',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                Nama Penulis / Editor Redaksi
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0d1017',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '10px',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', padding: '10px 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span>Jadikan Berita Utama (Hero Headline)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={isBreaking}
                onChange={(e) => setIsBreaking(e.target.checked)}
              />
              <span>Pasang di Running Ticker (Breaking News)</span>
            </label>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <button
              type="submit"
              disabled={publishing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--accent-crimson)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '0.95rem',
                boxShadow: '0 4px 20px rgba(230,57,70,0.4)',
                opacity: publishing ? 0.7 : 1
              }}
            >
              <CheckCircle size={18} />
              <span>{publishing ? 'Menerbitkan...' : 'Terbitkan ke Portal CALON JENAZAH'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
