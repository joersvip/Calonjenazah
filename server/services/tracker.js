const geoip = require('geoip-lite');
const { UAParser } = require('ua-parser-js');
const db = require('../db');

// In-memory store for currently active real-time visitors
// socketId -> Visitor Object
const activeVisitors = new Map();

// Realistic Indonesian city coordinates fallback for local dev / loopback IP
const LOCAL_FALLBACK_CITIES = [
  { city: 'Jakarta Pusat', region: 'DKI Jakarta', country: 'Indonesia', country_code: 'ID', lat: -6.1754, lon: 106.8272, isp: 'Telkom Indonesia' },
  { city: 'Surabaya', region: 'Jawa Timur', country: 'Indonesia', country_code: 'ID', lat: -7.2575, lon: 112.7521, isp: 'Indosat Ooredoo' },
  { city: 'Bandung', region: 'Jawa Barat', country: 'Indonesia', country_code: 'ID', lat: -6.9175, lon: 107.6191, isp: 'Biznet Networks' },
  { city: 'Medan', region: 'Sumatera Utara', country: 'Indonesia', country_code: 'ID', lat: 3.5952, lon: 98.6722, isp: 'XL Axiata' },
  { city: 'Yogyakarta', region: 'DI Yogyakarta', country: 'Indonesia', country_code: 'ID', lat: -7.7956, lon: 110.3695, isp: 'MyRepublic' },
  { city: 'Makassar', region: 'Sulawesi Selatan', country: 'Indonesia', country_code: 'ID', lat: -5.1477, lon: 119.4327, isp: 'Telkomsel' }
];

let fallbackIndex = 0;

/**
 * Extracts and cleans client IP address from express request
 */
function extractClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0];
  }
  return req.headers['x-real-ip'] ||
         req.headers['cf-connecting-ip'] ||
         req.socket?.remoteAddress ||
         '127.0.0.1';
}

/**
 * Resolve geolocation details from IP address
 */
function resolveGeo(ip) {
  const cleanIp = ip.replace(/^.*:/, ''); // strip IPv6 mapped IPv4 like ::ffff:
  const isLocal = !cleanIp || cleanIp === '127.0.0.1' || cleanIp === 'localhost' || cleanIp.startsWith('192.168.') || cleanIp.startsWith('10.');

  if (isLocal) {
    // For localhost testing, return realistic active location with cycle
    const sample = LOCAL_FALLBACK_CITIES[fallbackIndex % LOCAL_FALLBACK_CITIES.length];
    return {
      ip: cleanIp === '127.0.0.1' ? '180.252.164.12 (Local Dev)' : cleanIp,
      city: sample.city,
      region: sample.region,
      country: sample.country,
      country_code: sample.country_code,
      latitude: sample.lat,
      longitude: sample.lon,
      isp: sample.isp,
      is_simulated: true
    };
  }

  const geo = geoip.lookup(cleanIp);
  if (geo) {
    return {
      ip: cleanIp,
      city: geo.city || 'Kota Tidak Diketahui',
      region: geo.region || '',
      country: geo.country === 'ID' ? 'Indonesia' : geo.country,
      country_code: geo.country || 'ID',
      latitude: geo.ll ? geo.ll[0] : -6.2088,
      longitude: geo.ll ? geo.ll[1] : 106.8456,
      isp: 'ISP Publik',
      is_simulated: false
    };
  }

  // Generic fallback if GeoIP lookup yields null
  const sample = LOCAL_FALLBACK_CITIES[0];
  return {
    ip: cleanIp,
    city: sample.city,
    region: sample.region,
    country: sample.country,
    country_code: sample.country_code,
    latitude: sample.lat,
    longitude: sample.lon,
    isp: 'Internet Provider',
    is_simulated: true
  };
}

/**
 * Parse User Agent string into device, OS, and browser details
 */
function parseUserAgent(uaString) {
  const parser = new UAParser(uaString || '');
  const result = parser.getResult();

  let deviceType = 'Desktop';
  if (result.device && result.device.type) {
    const t = result.device.type.toLowerCase();
    if (t === 'mobile') deviceType = 'Mobile';
    else if (t === 'tablet') deviceType = 'Tablet';
    else if (t === 'smarttv') deviceType = 'SmartTV';
    else deviceType = t;
  } else if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(uaString)) {
    deviceType = 'Mobile';
  } else if (/iPad|Tablet/i.test(uaString)) {
    deviceType = 'Tablet';
  }

  const browserName = result.browser.name || 'Browser Umum';
  const browserVersion = result.browser.version || '';
  const osName = result.os.name || 'OS Lainnya';
  const osVersion = result.os.version || '';

  return {
    device_type: deviceType,
    browser: browserName,
    browser_version: browserVersion,
    os: osName,
    os_version: osVersion,
    raw_ua: uaString
  };
}

/**
 * Record a visit in visitor_logs table
 */
function logVisit({ ip, userAgent, pageUrl, pageTitle, articleId, referrer, sessionId, screenResolution, durationSeconds = 0 }) {
  const geo = resolveGeo(ip);
  const ua = parseUserAgent(userAgent);

  const insertStmt = db.prepare(`
    INSERT INTO visitor_logs (
      ip, country, country_code, city, region, latitude, longitude, isp,
      user_agent, browser, browser_version, os, os_version, device_type,
      screen_resolution, page_url, page_title, article_id, referrer, session_id, duration_seconds
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const res = insertStmt.run(
    geo.ip,
    geo.country,
    geo.country_code,
    geo.city,
    geo.region,
    geo.latitude,
    geo.longitude,
    geo.isp,
    userAgent || '',
    ua.browser,
    ua.browser_version,
    ua.os,
    ua.os_version,
    ua.device_type,
    screenResolution || '1920x1080',
    pageUrl || '/',
    pageTitle || 'Beranda Portal',
    articleId ? Number(articleId) : null,
    referrer || 'Direct',
    sessionId || ('sess_' + Date.now()),
    durationSeconds || 0
  );

  return {
    logId: res.lastInsertRowid,
    geo,
    ua
  };
}

/**
 * Socket.io setup for Live Real-Time Visitor Monitoring
 */
function setupSocketTracking(io) {
  io.on('connection', (socket) => {
    // Check handshake data
    const handshake = socket.handshake;
    const clientIp = extractClientIp({ headers: handshake.headers, socket: { remoteAddress: handshake.address } });
    const userAgent = handshake.headers['user-agent'] || '';
    const geo = resolveGeo(clientIp);
    const ua = parseUserAgent(userAgent);

    // Initial visitor payload
    const visitorInfo = {
      socketId: socket.id,
      ip: geo.ip,
      country: geo.country,
      country_code: geo.country_code,
      city: geo.city,
      region: geo.region,
      latitude: geo.latitude,
      longitude: geo.longitude,
      isp: geo.isp,
      device_type: ua.device_type,
      browser: ua.browser,
      os: ua.os,
      page_url: handshake.query.pageUrl || '/',
      page_title: handshake.query.pageTitle || 'Calon Jenazah - Beranda',
      connected_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    };

    // Client registration (when visitor navigates or updates telemetry)
    socket.on('visitor_telemetry', (data) => {
      // If client provided public IP or client-side screen resolution
      if (data.screenResolution) visitorInfo.screen_resolution = data.screenResolution;
      if (data.pageUrl) visitorInfo.page_url = data.pageUrl;
      if (data.pageTitle) visitorInfo.page_title = data.pageTitle;
      if (data.articleId) visitorInfo.article_id = data.articleId;
      visitorInfo.last_active = new Date().toISOString();

      activeVisitors.set(socket.id, visitorInfo);

      // Broadcast to admin monitors
      io.to('admin_monitors').emit('live_visitors_update', Array.from(activeVisitors.values()));
    });

    // Handle admin joining the monitoring room
    socket.on('join_admin_monitor', () => {
      socket.join('admin_monitors');
      // Send current live visitors immediately
      socket.emit('live_visitors_update', Array.from(activeVisitors.values()));
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (activeVisitors.has(socket.id)) {
        activeVisitors.delete(socket.id);
        io.to('admin_monitors').emit('live_visitors_update', Array.from(activeVisitors.values()));
      }
    });
  });
}

/**
 * Retrieve visitor analytics and statistics
 */
function getVisitorAnalytics() {
  const totalVisits = db.prepare('SELECT COUNT(*) as count FROM visitor_logs').get().count;
  const uniqueIps = db.prepare('SELECT COUNT(DISTINCT ip) as count FROM visitor_logs').get().count;

  // Device breakdown
  const deviceRows = db.prepare(`
    SELECT device_type, COUNT(*) as count 
    FROM visitor_logs 
    GROUP BY device_type 
    ORDER BY count DESC
  `).all();

  // OS breakdown
  const osRows = db.prepare(`
    SELECT os, COUNT(*) as count 
    FROM visitor_logs 
    GROUP BY os 
    ORDER BY count DESC 
    LIMIT 5
  `).all();

  // Browser breakdown
  const browserRows = db.prepare(`
    SELECT browser, COUNT(*) as count 
    FROM visitor_logs 
    GROUP BY browser 
    ORDER BY count DESC 
    LIMIT 5
  `).all();

  // Top locations
  const locationRows = db.prepare(`
    SELECT city, country, COUNT(*) as count, AVG(latitude) as lat, AVG(longitude) as lon
    FROM visitor_logs 
    GROUP BY city, country 
    ORDER BY count DESC 
    LIMIT 10
  `).all();

  // Top read articles
  const topArticles = db.prepare(`
    SELECT page_title, page_url, COUNT(*) as views 
    FROM visitor_logs 
    WHERE page_url LIKE '/berita/%' 
    GROUP BY page_url 
    ORDER BY views DESC 
    LIMIT 5
  `).all();

  // 7 days trend
  const dailyVisits = db.prepare(`
    SELECT date(visited_at) as visit_date, COUNT(*) as count
    FROM visitor_logs
    GROUP BY date(visited_at)
    ORDER BY visit_date DESC
    LIMIT 7
  `).all();

  return {
    totalVisits,
    uniqueIps,
    activeLiveCount: activeVisitors.size,
    deviceBreakdown: deviceRows,
    osBreakdown: osRows,
    browserBreakdown: browserRows,
    topLocations: locationRows,
    topArticles,
    dailyVisits: dailyVisits.reverse()
  };
}

module.exports = {
  extractClientIp,
  resolveGeo,
  parseUserAgent,
  logVisit,
  setupSocketTracking,
  getVisitorAnalytics,
  activeVisitors
};
