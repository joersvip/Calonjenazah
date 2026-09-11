const axios = require('axios');
const cheerio = require('cheerio');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

/**
 * Scrapes and extracts structured news article from an external URL
 * @param {string} url - Target news article URL
 * @returns {Promise<Object>} Extracted article data
 */
async function scrapeNewsFromUrl(url) {
  if (!url || !url.startsWith('http')) {
    throw new Error('URL tidak valid. Harap masukkan URL lengkap dengan http/https.');
  }

  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
  ];

  const headers = {
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'id,en-US;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'Upgrade-Insecure-Requests': '1'
  };

  const response = await axios.get(url, {
    headers,
    timeout: 15000,
    maxRedirects: 5
  });

  const html = response.data;
  const $ = cheerio.load(html);

  // Clean noise elements before extracting
  $('script, style, iframe, noscript, nav, footer, header, .ads, .advertisement, .banner, .social-share, .komentar, .baca-juga').remove();

  // Extract Metadata via Meta Tags
  let title = $('meta[property="og:title"]').attr('content') ||
              $('meta[name="twitter:title"]').attr('content') ||
              $('h1').first().text().trim() ||
              $('title').text().trim();

  // Clean up title suffixes like " - Kompas.com", " | detikNews", etc.
  title = title.replace(/\s*[-|–—]\s*(detikNews|detikcom|Kompas\.com|CNN Indonesia|Antaranews|Tempo\.co|Liputan6|Kumparan|Tribunnews).*$/i, '').trim();

  let summary = $('meta[property="og:description"]').attr('content') ||
                $('meta[name="description"]').attr('content') ||
                $('meta[name="twitter:description"]').attr('content') || '';

  let imageUrl = $('meta[property="og:image"]').attr('content') ||
                 $('meta[name="twitter:image"]').attr('content') ||
                 $('meta[name="twitter:image:src"]').attr('content') || '';

  if (imageUrl && !imageUrl.startsWith('http')) {
    try {
      const parsedUrl = new URL(url);
      imageUrl = new URL(imageUrl, parsedUrl.origin).href;
    } catch (e) {}
  }

  let author = $('meta[name="author"]').attr('content') ||
               $('meta[property="article:author"]').attr('content') ||
               $('.author, .penulis, .byline, [itemprop="author"]').first().text().trim() ||
               'Redaksi Sumber Asli';

  // Format author name
  author = author.replace(/^Oleh\s*:\s*/i, '').trim();

  let pubDate = $('meta[property="article:published_time"]').attr('content') ||
                $('meta[name="pubdate"]').attr('content') ||
                $('time').first().attr('datetime') ||
                $('time').first().text().trim() ||
                new Date().toISOString();

  // Extract domain as source name
  let domain = '';
  try {
    const parsedUrl = new URL(url);
    domain = parsedUrl.hostname.replace(/^www\./, '');
  } catch (e) {
    domain = 'Portal Berita Luar';
  }

  // Extract content using Readability
  let content = '';
  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const parsedArticle = reader.parse();
    if (parsedArticle && parsedArticle.content && parsedArticle.content.length > 150) {
      content = parsedArticle.content;
    }
  } catch (e) {
    // Fallback to cheerio selector
  }

  // Fallback content extraction if Readability was too strict
  if (!content || content.length < 150) {
    const paragraphs = [];
    $('article p, .detail-text p, .read__content p, .article-content p, .entry-content p, .post-content p, main p').each((i, el) => {
      const text = $(el).text().trim();
      // Skip empty or trivial links
      if (text.length > 25 && !text.toLowerCase().includes('baca juga:') && !text.toLowerCase().includes('simak video')) {
        paragraphs.push(`<p>${text}</p>`);
      }
    });

    if (paragraphs.length > 0) {
      content = paragraphs.join('\n');
    }
  }

  // If still empty, grab raw body paragraphs
  if (!content || content.length < 50) {
    const pArr = [];
    $('p').each((i, el) => {
      const t = $(el).text().trim();
      if (t.length > 30) pArr.push(`<p>${t}</p>`);
    });
    content = pArr.slice(0, 15).join('\n');
  }

  // Ensure summary exists if meta was missing
  if (!summary && content) {
    const $c = cheerio.load(content);
    summary = $c('p').first().text().trim().substring(0, 200) + '...';
  }

  // Extract category metadata from page
  const rawSection = $('meta[property="article:section"]').attr('content') ||
                     $('meta[name="keywords"]').attr('content') ||
                     $('meta[property="og:article:section"]').attr('content') ||
                     $('.breadcrumb, [itemprop="itemListElement"]').text().trim() || '';

  const { classifyNewsCategory } = require('./classifier');
  const detectedCategory = classifyNewsCategory({
    title,
    summary,
    content,
    url,
    sourceFeed: domain,
    rawCategories: rawSection
  });

  // Generate URL slug
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 90) + '-' + Math.floor(1000 + Math.random() * 9000);

  return {
    title,
    slug,
    summary,
    content,
    image_url: imageUrl,
    author,
    source_name: domain,
    source_url: url,
    pub_date: pubDate,
    category_id: detectedCategory.category_id,
    category_name: detectedCategory.category_name
  };
}

module.exports = {
  scrapeNewsFromUrl
};
