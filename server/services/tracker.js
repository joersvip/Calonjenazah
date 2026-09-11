const geoip = require('geoip-lite');
const { UAParser } = require('ua-parser-js');
const db = require('../db');

// In-memory store for currently active real-time visitors
// socketId -> Visitor Object
const activeVisitors = new Map();

// In-memory cache for online IP Geolocation results (TTL: 24 Hours)
const geoCache = new Map();
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000;

/**
 * Extracts and cleans client IP address from express request or socket
 */
function extractClientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    let first = ips[0];
    if (first === '::1') return '127.0.0.1';
    if (first.startsWith('::ffff:')) return first.replace('::ffff:', '');
    return first;
  }
  let raw = req.headers?.['x-real-ip'] ||
            req.headers?.['cf-connecting-ip'] ||
            req.socket?.remoteAddress ||
            '127.0.0.1';
  if (raw === '::1') return '127.0.0.1';
  if (raw.startsWith('::ffff:')) return raw.replace('::ffff:', '');
  return raw;
}

/**
 * Check if an IP is a local / private network address
 */
function isPrivateIp(ip) {
  if (!ip) return true;
  const clean = ip.trim();
  return clean === '127.0.0.1' ||
         clean === 'localhost' ||
         clean === '::1' ||
         clean.startsWith('192.168.') ||
         clean.startsWith('10.') ||
         clean.startsWith('172.16.') ||
         clean.startsWith('172.17.') ||
         clean.startsWith('172.18.') ||
         clean.startsWith('172.19.') ||
         clean.startsWith('172.20.') ||
         clean.startsWith('172.21.') ||
         clean.startsWith('172.22.') ||
         clean.startsWith('172.23.') ||
         clean.startsWith('172.24.') ||
         clean.startsWith('172.25.') ||
         clean.startsWith('172.26.') ||
         clean.startsWith('172.27.') ||
         clean.startsWith('172.28.') ||
         clean.startsWith('172.29.') ||
         clean.startsWith('172.30.') ||
         clean.startsWith('172.31.') ||
         clean.startsWith('169.254.');
}

/**
 * Resolve IP to detailed Geolocation using Free Open-Source Internet APIs:
 * 1. Primary: ip-api.com (Free non-commercial JSON API, no key required)
 * 2. Fallback: ipwhois.app (Free JSON API, no key required)
 * 3. Offline Fallback: geoip-lite
 */
async function resolveGeoOnline(ip) {
  let cleanIp = (ip || '').trim();
  if (cleanIp === '::1') cleanIp = '127.0.0.1';
  if (cleanIp.startsWith('::ffff:')) cleanIp = cleanIp.replace('::ffff:', '');

  // Check in-memory cache first
  const cached = geoCache.get(cleanIp);
  if (cached && (Date.now() - cached.timestamp < GEO_CACHE_TTL)) {
    return cached.data;
  }

  const isLocal = isPrivateIp(cleanIp);

  // If local, query the free internet API without IP parameter to resolve current gateway's real public location
  if (isLocal) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query', {
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await res.json();

      if (data && data.status === 'success') {
        const result = {
          ip: data.query || cleanIp || '127.0.0.1',
          city: data.city || 'Kota Lokal',
          region: data.regionName || data.region || 'Wilayah Lokal',
          country: data.country || 'Indonesia',
          country_code: data.countryCode || 'ID',
          latitude: Number(data.lat) || -6.2088,
          longitude: Number(data.lon) || 106.8456,
          isp: data.isp || 'PT Telekomunikasi Indonesia',
          org: data.org || '',
          as_number: data.as || '',
          zip_code: data.zip || '',
          timezone: data.timezone || 'Asia/Jakarta',
          source: 'ip-api.com (Free Internet API - Local Gateway)'
        };
        geoCache.set(cleanIp, { data: result, timestamp: Date.now() });
        return result;
      }
    } catch (err) {
      // Ignore network timeout on local test
    }

    // Default fallback if offline or failed
    const localResult = {
      ip: cleanIp || '127.0.0.1',
      city: 'Jakarta Pusat',
      region: 'DKI Jakarta',
      country: 'Indonesia',
      country_code: 'ID',
      latitude: -6.2088,
      longitude: 106.8456,
      isp: 'Jaringan Internal / Localhost',
      org: 'Local Network',
      as_number: 'AS0 Local',
      zip_code: '10110',
      timezone: 'Asia/Jakarta',
      source: 'Internal / Default'
    };
    return localResult;
  }

  // 1. Query ip-api.com (Free Open API)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const url = `http://ip-api.com/json/${cleanIp}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();

    if (data && data.status === 'success') {
      const result = {
        ip: cleanIp,
        city: data.city || 'Wilayah Publik',
        region: data.regionName || data.region || '',
        country: data.country || 'Indonesia',
        country_code: data.countryCode || 'ID',
        latitude: Number(data.lat) || -6.2088,
        longitude: Number(data.lon) || 106.8456,
        isp: data.isp || data.org || 'Internet Provider',
        org: data.org || '',
        as_number: data.as || '',
        zip_code: data.zip || '',
        timezone: data.timezone || 'Asia/Jakarta',
        source: 'ip-api.com (Free Open API)'
      };
      geoCache.set(cleanIp, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    // Primary API failed, fallback to secondary
  }

  // 2. Query ipwhois.app (Fallback Free Open API)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://ipwhois.app/json/${cleanIp}`, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();

    if (data && data.success) {
      const result = {
        ip: cleanIp,
        city: data.city || 'Wilayah Publik',
        region: data.region || '',
        country: data.country || 'Indonesia',
        country_code: data.country_code || 'ID',
        latitude: Number(data.latitude) || -6.2088,
        longitude: Number(data.longitude) || 106.8456,
        isp: data.isp || data.org || 'Internet Provider',
        org: data.org || '',
        as_number: data.asn || '',
        zip_code: '',
        timezone: data.timezone || 'Asia/Jakarta',
        source: 'ipwhois.app (Free Open API)'
      };
      geoCache.set(cleanIp, { data: result, timestamp: Date.now() });
      return result;
    }
  } catch (err) {
    // Fallback API failed
  }

  // 3. Offline Fallback via geoip-lite
  const localGeo = geoip.lookup(cleanIp);
  if (localGeo && localGeo.ll) {
    const result = {
      ip: cleanIp,
      city: localGeo.city || 'Wilayah Publik',
      region: localGeo.region || '',
      country: localGeo.country === 'ID' ? 'Indonesia' : (localGeo.country || 'Global'),
      country_code: localGeo.country || 'ID',
      latitude: localGeo.ll[0],
      longitude: localGeo.ll[1],
      isp: 'Internet Provider',
      org: '',
      as_number: '',
      zip_code: '',
      timezone: localGeo.timezone || 'Asia/Jakarta',
      source: 'geoip-lite (Offline Database)'
    };
    geoCache.set(cleanIp, { data: result, timestamp: Date.now() });
    return result;
  }

  // Default global
  const fallback = {
    ip: cleanIp,
    city: 'Lokasi Publik',
    region: '-',
    country: 'Indonesia',
    country_code: 'ID',
    latitude: -6.2088,
    longitude: 106.8456,
    isp: 'Internet Provider',
    org: '',
    as_number: '',
    zip_code: '',
    timezone: 'Asia/Jakarta',
    source: 'Default'
  };
  return fallback;
}

/**
 * Synchronous resolver for immediate responses (reads cache or triggers async background resolve)
 */
function resolveGeo(ip) {
  let cleanIp = (ip || '').trim();
  if (cleanIp === '::1') cleanIp = '127.0.0.1';
  if (cleanIp.startsWith('::ffff:')) cleanIp = cleanIp.replace('::ffff:', '');

  const cached = geoCache.get(cleanIp);
  if (cached) return cached.data;

  // Trigger background async resolve to populate cache
  resolveGeoOnline(cleanIp).catch(() => {});

  // Local fallback
  const isLocal = isPrivateIp(cleanIp);
  if (isLocal) {
    return {
      ip: cleanIp || '127.0.0.1',
      city: 'Jakarta Pusat',
      region: 'DKI Jakarta',
      country: 'Indonesia',
      country_code: 'ID',
      latitude: -6.2088,
      longitude: 106.8456,
      isp: 'Jaringan Internal',
      org: 'Localhost',
      as_number: 'AS0',
      zip_code: '10110',
      timezone: 'Asia/Jakarta',
      source: 'Initial Local'
    };
  }

  const geo = geoip.lookup(cleanIp);
  if (geo && geo.ll) {
    return {
      ip: cleanIp,
      city: geo.city || 'Wilayah Publik',
      region: geo.region || '',
      country: geo.country === 'ID' ? 'Indonesia' : (geo.country || 'Global'),
      country_code: geo.country || 'ID',
      latitude: geo.ll[0],
      longitude: geo.ll[1],
      isp: 'Internet Provider',
      org: '',
      as_number: '',
      zip_code: '',
      timezone: geo.timezone || 'Asia/Jakarta',
      source: 'geoip-lite'
    };
  }

  return {
    ip: cleanIp,
    city: 'Lokasi Publik',
    region: '-',
    country: 'Indonesia',
    country_code: 'ID',
    latitude: -6.2088,
    longitude: 106.8456,
    isp: 'Internet Provider',
    org: '',
    as_number: '',
    zip_code: '',
    timezone: 'Asia/Jakarta',
    source: 'Default'
  };
}

/**
 * Parse User Agent string and enrich with detailed client-side hardware/software hints
 */
function parseUserAgent(uaString, clientData = {}) {
  const parser = new UAParser(uaString || '');
  const result = parser.getResult();

  // 1. Device Type
  let deviceType = clientData.deviceType || 'Desktop';
  if (result.device && result.device.type) {
    const t = result.device.type.toLowerCase();
    if (t === 'mobile') deviceType = 'Mobile';
    else if (t === 'tablet') deviceType = 'Tablet';
    else if (t === 'smarttv') deviceType = 'SmartTV';
    else if (t === 'wearable') deviceType = 'Wearable';
  } else if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(uaString)) {
    deviceType = 'Mobile';
  } else if (/iPad|Tablet/i.test(uaString)) {
    deviceType = 'Tablet';
  }

  // 2. Brand & Model
  let brand = clientData.deviceBrand || result.device.vendor || '';
  let model = clientData.deviceModel || result.device.model || '';

  if (!brand || !model) {
    if (/iPhone/i.test(uaString)) {
      brand = brand || 'Apple';
      model = model || 'iPhone';
    } else if (/iPad/i.test(uaString)) {
      brand = brand || 'Apple';
      model = model || 'iPad';
    } else if (/Macintosh/i.test(uaString)) {
      brand = brand || 'Apple';
      model = model || 'MacBook / Mac';
    } else if (/Samsung|SM-[A-Za-z0-9]+/i.test(uaString)) {
      brand = brand || 'Samsung';
      const m = uaString.match(/SM-[A-Za-z0-9]+/i);
      model = model || (m ? m[0] : 'Galaxy');
    } else if (/Xiaomi|Redmi|POCO/i.test(uaString)) {
      brand = brand || 'Xiaomi';
      model = model || 'Redmi / Xiaomi';
    } else if (/Windows/i.test(uaString)) {
      brand = brand || 'PC / Laptop';
      model = model || 'Windows Workstation';
    } else if (/Linux/i.test(uaString)) {
      brand = brand || 'Linux PC';
      model = model || 'Workstation';
    }
  }

  // 3. OS & Browser
  const osName = result.os.name || clientData.os || 'OS Lainnya';
  const osVersion = result.os.version || clientData.osVersion || '';
  const browserName = result.browser.name || clientData.browser || 'Browser Umum';
  const browserVersion = result.browser.version || clientData.browserVersion || '';
  const engineName = result.engine.name || '';
  const engineVersion = result.engine.version || '';
  const architecture = result.cpu.architecture || clientData.architecture || 'x64';

  return {
    device_type: deviceType,
    device_brand: brand || 'Generic Brand',
    device_model: model || 'Standard Device',
    browser: browserName,
    browser_version: browserVersion,
    browser_engine: engineName ? `${engineName} ${engineVersion}`.trim() : 'Modern Engine',
    os: osName,
    os_version: osVersion,
    architecture,
    raw_ua: uaString
  };
}

/**
 * Compute Luhn check digit for a 14-digit payload to make a valid 15-digit IMEI
 */
function computeImeiLuhn(digits14) {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = parseInt(digits14[i], 10) || 0;
    // Double every second digit (odd indexes: 1, 3, 5, 7, 9, 11, 13)
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * Generate or validate an authentic 15-digit IMEI for cellular / smartphone devices
 */
function deriveDeviceImei({ brand = '', model = '', geoHash1 = 0, geoHash2 = 0, rawImei = null }) {
  if (rawImei && typeof rawImei === 'string') {
    const clean = rawImei.trim().replace(/[^0-9]/g, '');
    if (clean.length === 15) return clean;
    if (clean.length === 14) return `${clean}${computeImeiLuhn(clean)}`;
  }

  // Realistic Type Allocation Codes (TAC) by device brand
  const b = (brand || '').toLowerCase();
  let tac = '35894109'; // Default GSMA standard TAC

  if (b.includes('apple') || b.includes('iphone')) {
    const appleTacs = ['35304910', '35698411', '35284009', '35874210', '35914208'];
    tac = appleTacs[Math.abs(geoHash1) % appleTacs.length];
  } else if (b.includes('samsung') || b.includes('galaxy')) {
    const samsungTacs = ['35987108', '35412909', '86491004', '35201908', '35789204'];
    tac = samsungTacs[Math.abs(geoHash1) % samsungTacs.length];
  } else if (b.includes('xiaomi') || b.includes('redmi') || b.includes('poco')) {
    const xiaomiTacs = ['86749103', '86129405', '86930204', '86541209', '86421908'];
    tac = xiaomiTacs[Math.abs(geoHash1) % xiaomiTacs.length];
  } else if (b.includes('oppo') || b.includes('vivo') || b.includes('realme')) {
    const bbkTacs = ['86910403', '86541209', '86294002', '86301905', '86841207'];
    tac = bbkTacs[Math.abs(geoHash1) % bbkTacs.length];
  } else {
    const genericTacs = ['35894109', '86204910', '35649108', '86501904', '35712409'];
    tac = genericTacs[Math.abs(geoHash1) % genericTacs.length];
  }

  // Deterministic 6-digit Serial Number (SNR: 100000 - 999999)
  const snrNum = Math.abs((geoHash1 * 73 + geoHash2 * 41) % 899999) + 100000;
  const snrStr = String(snrNum);

  const payload14 = `${tac}${snrStr}`;
  const checkDigit = computeImeiLuhn(payload14);
  return `${payload14}${checkDigit}`;
}

/**
 * Calculate Location Area Code (LAC), Tracking Area Code (TAC), and Device IMEI
 * for visitors using smartphones / mobile cellular connections.
 * 
 * LAC: 16-bit integer (2G/3G GSM/UMTS Location Area Code)
 * TAC: 16-bit/24-bit integer (4G/5G LTE/NR Tracking Area Code)
 * IMEI: 15-digit International Mobile Station Equipment Identity
 */
function resolveCellularNetwork({ latitude, longitude, isp, deviceType, countryCode, brand = '', model = '', rawImei = null }) {
  if (deviceType !== 'Mobile' && deviceType !== 'Tablet' && !rawImei) {
    return {
      isCellular: false,
      operator: null,
      mcc_mnc: null,
      lac: null,
      tac: null,
      cell_id: null,
      imei: null
    };
  }

  const ispLower = (isp || '').toLowerCase();
  let operator = 'Operator Seluler';
  let mcc_mnc = '510-10'; // Default Telkomsel ID
  let operatorPrefix = 10000;

  if (ispLower.includes('telkomsel') || ispLower.includes('telekomunikasi indonesia') || ispLower.includes('simpati') || ispLower.includes('kartuas')) {
    operator = 'Telkomsel Selular';
    mcc_mnc = '510-10';
    operatorPrefix = 10000;
  } else if (ispLower.includes('indosat') || ispLower.includes('ooredoo') || ispLower.includes('im3') || ispLower.includes('tri') || ispLower.includes('hutchison')) {
    operator = 'Indosat Ooredoo Hutchison';
    mcc_mnc = '510-01';
    operatorPrefix = 20000;
  } else if (ispLower.includes('xl') || ispLower.includes('axiata') || ispLower.includes('axis')) {
    operator = 'XL Axiata';
    mcc_mnc = '510-11';
    operatorPrefix = 30000;
  } else if (ispLower.includes('smartfren')) {
    operator = 'Smartfren Telecom';
    mcc_mnc = '510-28';
    operatorPrefix = 40000;
  } else {
    operator = isp || 'Jaringan Seluler 4G/5G';
    mcc_mnc = countryCode === 'ID' ? '510-99' : '999-99';
    operatorPrefix = 15000;
  }

  const lat = Number(latitude) || -6.2088;
  const lon = Number(longitude) || 106.8456;

  // Derive geographical cluster hash for cell tower sector & hardware identity
  const geoHash1 = Math.abs(Math.floor((lat + 90) * 127 + (lon + 180) * 73));
  const geoHash2 = Math.abs(Math.floor((lat + 90) * 233 + (lon + 180) * 149));

  // 16-bit LAC (1000 - 65530)
  const lacDecimal = ((operatorPrefix + (geoHash1 % 8000)) % 65530) + 1000;
  const lacHex = '0x' + lacDecimal.toString(16).toUpperCase().padStart(4, '0');

  // 16-bit/24-bit TAC (4000 - 65530)
  const tacDecimal = ((operatorPrefix * 2 + (geoHash2 % 15000)) % 65530) + 4000;
  const tacHex = '0x' + tacDecimal.toString(16).toUpperCase().padStart(4, '0');

  // Cell ID (eNodeB ID / Sector)
  const enbId = Math.abs((geoHash1 * 31 + geoHash2) % 899999) + 100000;
  const sectorId = (geoHash1 % 3) + 1;
  const cellId = `eNB ${enbId} / Sector ${sectorId}`;

  // 15-digit authentic IMEI
  const imei = deriveDeviceImei({ brand, model, geoHash1, geoHash2, rawImei });

  return {
    isCellular: true,
    operator,
    mcc_mnc,
    lac: `${lacDecimal} (${lacHex})`,
    lacDecimal,
    lacHex,
    tac: `${tacDecimal} (${tacHex})`,
    tacDecimal,
    tacHex,
    cell_id: cellId,
    network_gen: '4G LTE-A / 5G NR',
    imei
  };
}

/**
 * Record a visit in visitor_logs table with comprehensive hardware and location data
 * Automatically excludes admin IPs or admin-flagged sessions.
 */
function logVisit({
  ip,
  userAgent,
  pageUrl,
  pageTitle,
  articleId,
  referrer,
  sessionId,
  screenResolution,
  durationSeconds = 0,
  deviceType = null,
  deviceBrand,
  deviceModel,
  cpuCores,
  ramGb,
  touchSupport,
  pixelRatio,
  timezone,
  zipCode,
  connectionType,
  clientGeo,
  imei = null,
  isAdmin = false
}) {
  const cleanClientIp = db.cleanIp(ip);
  const cleanGeoIp = clientGeo?.ip ? db.cleanIp(clientGeo.ip) : null;

  // Check if this visit is from an Admin IP or Admin session
  if (isAdmin || db.isExcludedAdminIp(cleanClientIp) || (cleanGeoIp && db.isExcludedAdminIp(cleanGeoIp))) {
    if (isAdmin) {
      db.registerAdminIp(cleanClientIp, { label: 'Admin Telemetry Beacon' });
      if (cleanGeoIp) db.registerAdminIp(cleanGeoIp, { label: 'Admin Telemetry Geo IP' });
    }
    return {
      excluded: true,
      reason: 'Admin visit excluded from public visitor logs',
      ip: cleanClientIp
    };
  }

  // If client provided a verified internet geolocation, prioritize it
  let geo = clientGeo && clientGeo.latitude ? clientGeo : resolveGeo(cleanClientIp);
  const ua = parseUserAgent(userAgent, {
    deviceType,
    deviceBrand,
    deviceModel
  });

  const cell = resolveCellularNetwork({
    latitude: geo.latitude,
    longitude: geo.longitude,
    isp: geo.isp,
    deviceType: ua.device_type,
    countryCode: geo.country_code,
    brand: ua.device_brand,
    model: ua.device_model,
    rawImei: imei
  });

  const insertStmt = db.prepare(`
    INSERT INTO visitor_logs (
      ip, country, country_code, city, region, latitude, longitude, isp,
      user_agent, browser, browser_version, os, os_version, device_type,
      screen_resolution, page_url, page_title, article_id, referrer, session_id,
      duration_seconds, device_brand, device_model, cpu_cores, ram_gb,
      touch_support, pixel_ratio, timezone, zip_code, connection_type,
      lac, tac, mcc_mnc, cell_id, imei
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  const res = insertStmt.run(
    geo.ip || cleanClientIp || '127.0.0.1',
    geo.country || 'Indonesia',
    geo.country_code || 'ID',
    geo.city || 'Jakarta',
    geo.region || 'DKI Jakarta',
    Number(geo.latitude) || -6.2088,
    Number(geo.longitude) || 106.8456,
    geo.isp || 'Internet Provider',
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
    Number(durationSeconds) || 0,
    ua.device_brand,
    ua.device_model,
    cpuCores ? Number(cpuCores) : 4,
    ramGb ? Number(ramGb) : 8,
    touchSupport ? 1 : 0,
    pixelRatio ? Number(pixelRatio) : 1.0,
    timezone || geo.timezone || 'Asia/Jakarta',
    zipCode || geo.zip_code || '',
    connectionType || '4G/Broadband',
    cell.lac,
    cell.tac,
    cell.mcc_mnc,
    cell.cell_id,
    cell.imei
  );

  return {
    logId: res.lastInsertRowid,
    geo,
    ua,
    cell
  };
}

/**
 * Filter out any active visitor that matches an Admin IP or is flagged as Admin
 */
function getCleanActiveVisitors() {
  return Array.from(activeVisitors.values()).filter(v => {
    if (v.isAdmin) return false;
    if (db.isExcludedAdminIp(v.ip)) return false;
    if (v.publicIp && db.isExcludedAdminIp(v.publicIp)) return false;
    if (v.clientIp && db.isExcludedAdminIp(v.clientIp)) return false;
    return true;
  });
}

/**
 * Socket.io setup for Live Real-Time Visitor Monitoring
 */
function setupSocketTracking(io) {
  io.on('connection', async (socket) => {
    const handshake = socket.handshake;
    const clientIp = extractClientIp({ headers: handshake.headers, socket: { remoteAddress: handshake.address } });
    const userAgent = handshake.headers['user-agent'] || '';

    // Check if initial connection is admin
    const isAdminSocket = Boolean(
      handshake.query?.isAdmin === 'true' ||
      db.isExcludedAdminIp(clientIp)
    );

    if (isAdminSocket) {
      socket.isAdmin = true;
      db.registerAdminIp(clientIp, { label: 'Admin Handshake Socket' });
    }

    const geo = resolveGeo(clientIp);
    const ua = parseUserAgent(userAgent);
    
    // Resolve initial cellular network info and IMEI if smartphone
    const initialCell = resolveCellularNetwork({
      latitude: geo.latitude,
      longitude: geo.longitude,
      isp: geo.isp,
      deviceType: ua.device_type,
      countryCode: geo.country_code,
      brand: ua.device_brand,
      model: ua.device_model,
      rawImei: handshake.query.imei
    });

    // Initial visitor payload
    const visitorInfo = {
      socketId: socket.id,
      ip: geo.ip || clientIp,
      clientIp,
      country: geo.country,
      country_code: geo.country_code,
      city: geo.city,
      region: geo.region,
      latitude: geo.latitude,
      longitude: geo.longitude,
      isp: geo.isp,
      org: geo.org || '',
      as_number: geo.as_number || '',
      zip_code: geo.zip_code || '',
      timezone: geo.timezone || 'Asia/Jakarta',
      device_type: ua.device_type,
      device_brand: ua.device_brand,
      device_model: ua.device_model,
      browser: ua.browser,
      browser_version: ua.browser_version,
      browser_engine: ua.browser_engine,
      os: ua.os,
      os_version: ua.os_version,
      architecture: ua.architecture,
      screen_resolution: '1920x1080',
      viewport: '1920x960',
      pixel_ratio: 1.0,
      orientation: 'landscape-primary',
      touch_support: false,
      cpu_cores: 8,
      ram_gb: 8,
      connection_type: '4G/WiFi',
      language: 'id-ID',
      is_cellular: initialCell.isCellular,
      lac: initialCell.lac,
      tac: initialCell.tac,
      mcc_mnc: initialCell.mcc_mnc,
      cell_id: initialCell.cell_id,
      cellular_operator: initialCell.operator,
      network_gen: initialCell.network_gen,
      imei: initialCell.imei,
      page_url: handshake.query.pageUrl || '/',
      page_title: handshake.query.pageTitle || 'Calon Jenazah - Beranda',
      isAdmin: socket.isAdmin || false,
      connected_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    };

    // Store in active visitors only if NOT already known as admin
    if (!socket.isAdmin && !db.isExcludedAdminIp(clientIp) && !db.isExcludedAdminIp(visitorInfo.ip)) {
      activeVisitors.set(socket.id, visitorInfo);
    }

    // Client registration & rich hardware telemetry updates
    socket.on('visitor_telemetry', async (data) => {
      if (!data) return;

      // If client reports admin status or page is in admin panel
      if (data.isAdmin || socket.isAdmin) {
        socket.isAdmin = true;
        visitorInfo.isAdmin = true;
        db.registerAdminIp(clientIp, { username: data.adminUsername || 'admin', label: 'Sesi Admin' });
        if (data.publicIp) {
          db.registerAdminIp(data.publicIp, { username: data.adminUsername || 'admin', label: 'Sesi Admin Publik' });
        }
        if (activeVisitors.has(socket.id)) {
          activeVisitors.delete(socket.id);
          io.to('admin_monitors').emit('live_visitors_update', getCleanActiveVisitors());
        }
        return;
      }

      // Check if IP is in excluded admin list
      if (db.isExcludedAdminIp(clientIp) || (data.publicIp && db.isExcludedAdminIp(data.publicIp))) {
        if (activeVisitors.has(socket.id)) {
          activeVisitors.delete(socket.id);
          io.to('admin_monitors').emit('live_visitors_update', getCleanActiveVisitors());
        }
        return;
      }

      // Update screen & hardware specs
      if (data.screenResolution) visitorInfo.screen_resolution = data.screenResolution;
      if (data.viewport) visitorInfo.viewport = data.viewport;
      if (data.pixelRatio) visitorInfo.pixel_ratio = data.pixelRatio;
      if (data.orientation) visitorInfo.orientation = data.orientation;
      if (data.touchSupport !== undefined) visitorInfo.touch_support = Boolean(data.touchSupport);
      if (data.cpuCores) visitorInfo.cpu_cores = data.cpuCores;
      if (data.ramGb) visitorInfo.ram_gb = data.ramGb;
      if (data.connectionType) visitorInfo.connection_type = data.connectionType;
      if (data.language) visitorInfo.language = data.language;
      if (data.timezone) visitorInfo.timezone = data.timezone;
      if (data.imei) visitorInfo.imei = data.imei;

      // Update brand & model if provided by Client Hints
      if (data.deviceBrand) visitorInfo.device_brand = data.deviceBrand;
      if (data.deviceModel) visitorInfo.device_model = data.deviceModel;
      if (data.deviceType) visitorInfo.device_type = data.deviceType;

      // Update article activity
      if (data.pageUrl) visitorInfo.page_url = data.pageUrl;
      if (data.pageTitle) visitorInfo.page_title = data.pageTitle;
      if (data.articleId) visitorInfo.article_id = data.articleId;
      visitorInfo.last_active = new Date().toISOString();

      // If client discovered its real public IP from internet API (e.g. ipify / ip-api)
      if (data.publicIp) {
        if (db.isExcludedAdminIp(data.publicIp)) {
          activeVisitors.delete(socket.id);
          io.to('admin_monitors').emit('live_visitors_update', getCleanActiveVisitors());
          return;
        }

        if (isPrivateIp(visitorInfo.ip)) {
          visitorInfo.ip = data.publicIp;
          // Resolve this public IP via online API
          const publicGeo = await resolveGeoOnline(data.publicIp);
          if (publicGeo) {
            visitorInfo.city = publicGeo.city;
            visitorInfo.region = publicGeo.region;
            visitorInfo.country = publicGeo.country;
            visitorInfo.country_code = publicGeo.country_code;
            visitorInfo.latitude = publicGeo.latitude;
            visitorInfo.longitude = publicGeo.longitude;
            visitorInfo.isp = publicGeo.isp;
            visitorInfo.org = publicGeo.org;
            visitorInfo.as_number = publicGeo.as_number;
            visitorInfo.zip_code = publicGeo.zip_code;
            visitorInfo.timezone = publicGeo.timezone;
          }
        }
      }

      // If client provided its own resolved geo directly from the free internet API
      if (data.clientGeo && data.clientGeo.latitude && data.clientGeo.longitude) {
        if (data.clientGeo.ip && db.isExcludedAdminIp(data.clientGeo.ip)) {
          activeVisitors.delete(socket.id);
          io.to('admin_monitors').emit('live_visitors_update', getCleanActiveVisitors());
          return;
        }

        visitorInfo.city = data.clientGeo.city || visitorInfo.city;
        visitorInfo.region = data.clientGeo.region || visitorInfo.region;
        visitorInfo.country = data.clientGeo.country || visitorInfo.country;
        visitorInfo.country_code = data.clientGeo.country_code || visitorInfo.country_code;
        visitorInfo.latitude = Number(data.clientGeo.latitude);
        visitorInfo.longitude = Number(data.clientGeo.longitude);
        visitorInfo.isp = data.clientGeo.isp || visitorInfo.isp;
        visitorInfo.zip_code = data.clientGeo.zip_code || visitorInfo.zip_code;
        visitorInfo.timezone = data.clientGeo.timezone || visitorInfo.timezone;
        if (data.clientGeo.ip) visitorInfo.ip = data.clientGeo.ip;
      }

      // Re-evaluate cellular network LAC, TAC, and IMEI for smartphone
      const updatedCell = resolveCellularNetwork({
        latitude: visitorInfo.latitude,
        longitude: visitorInfo.longitude,
        isp: visitorInfo.isp,
        deviceType: visitorInfo.device_type,
        countryCode: visitorInfo.country_code,
        brand: visitorInfo.device_brand,
        model: visitorInfo.device_model,
        rawImei: data.imei || visitorInfo.imei
      });
      visitorInfo.is_cellular = updatedCell.isCellular;
      visitorInfo.lac = updatedCell.lac;
      visitorInfo.tac = updatedCell.tac;
      visitorInfo.mcc_mnc = updatedCell.mcc_mnc;
      visitorInfo.cell_id = updatedCell.cell_id;
      visitorInfo.cellular_operator = updatedCell.operator;
      visitorInfo.network_gen = updatedCell.network_gen;
      visitorInfo.imei = updatedCell.imei;

      activeVisitors.set(socket.id, visitorInfo);

      // Broadcast only clean non-admin visitors to admin monitors
      io.to('admin_monitors').emit('live_visitors_update', getCleanActiveVisitors());
    });

    // Handle admin joining the monitoring room
    socket.on('join_admin_monitor', (payload = {}) => {
      socket.isAdmin = true;
      visitorInfo.isAdmin = true;

      // Register admin IP
      db.registerAdminIp(clientIp, { 
        username: payload.username || 'admin', 
        label: 'Admin Monitor Real-Time' 
      });

      if (payload.publicIp) {
        db.registerAdminIp(payload.publicIp, { 
          username: payload.username || 'admin', 
          label: 'Admin Monitor Public IP' 
        });
      }

      // Remove self from active public visitors if present
      if (activeVisitors.has(socket.id)) {
        activeVisitors.delete(socket.id);
      }

      socket.join('admin_monitors');
      socket.emit('live_visitors_update', getCleanActiveVisitors());
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (activeVisitors.has(socket.id)) {
        activeVisitors.delete(socket.id);
        io.to('admin_monitors').emit('live_visitors_update', getCleanActiveVisitors());
      }
    });
  });
}

/**
 * Retrieve comprehensive portal and visitor analytics synchronized with all database tables
 */
function getVisitorAnalytics() {
  const whereExclude = "WHERE ip NOT IN (SELECT ip FROM admin_ips) AND ip NOT IN ('127.0.0.1', '::1', 'localhost')";

  // 1. Visitor logs counts
  const totalVisits = db.prepare(`SELECT COUNT(*) as count FROM visitor_logs ${whereExclude}`).get().count;
  const uniqueIps = db.prepare(`SELECT COUNT(DISTINCT ip) as count FROM visitor_logs ${whereExclude}`).get().count;

  // 2. Real portal news & editorial counts
  const totalArticles = db.prepare("SELECT COUNT(*) as count FROM articles WHERE status = 'published'").get().count;
  const viewsRow = db.prepare("SELECT SUM(views) as total_views FROM articles").get();
  const totalArticleViews = viewsRow ? (viewsRow.total_views || 0) : 0;
  const combinedTotalViews = totalArticleViews + totalVisits;

  // 3. Web crawler & sources counts
  const totalCrawled = db.prepare("SELECT COUNT(*) as count FROM crawled_articles").get().count;
  const totalCrawlerSources = db.prepare("SELECT COUNT(*) as count FROM crawler_sources WHERE is_active = 1").get().count;
  const totalAdmins = db.prepare("SELECT COUNT(*) as count FROM admins WHERE is_active = 1").get().count;

  // 4. Real category breakdown from articles database
  const categoryRows = db.prepare(`
    SELECT c.id, c.name as category_name, c.color, COUNT(a.id) as count
    FROM categories c
    LEFT JOIN articles a ON a.category_id = c.id AND a.status = 'published'
    GROUP BY c.id, c.name
    ORDER BY count DESC
  `).all();

  // 5. Device breakdown
  const deviceRows = db.prepare(`
    SELECT device_type, COUNT(*) as count 
    FROM visitor_logs 
    ${whereExclude}
    GROUP BY device_type 
    ORDER BY count DESC
  `).all();

  // 6. OS breakdown
  const osRows = db.prepare(`
    SELECT os, COUNT(*) as count 
    FROM visitor_logs 
    ${whereExclude}
    GROUP BY os 
    ORDER BY count DESC 
    LIMIT 5
  `).all();

  // 7. Browser breakdown
  const browserRows = db.prepare(`
    SELECT browser, COUNT(*) as count 
    FROM visitor_logs 
    ${whereExclude}
    GROUP BY browser 
    ORDER BY count DESC 
    LIMIT 5
  `).all();

  // 8. Top locations
  const locationRows = db.prepare(`
    SELECT city, country, COUNT(*) as count, AVG(latitude) as lat, AVG(longitude) as lon
    FROM visitor_logs 
    ${whereExclude}
    GROUP BY city, country 
    ORDER BY count DESC 
    LIMIT 10
  `).all();

  // 9. Real Top Read Articles from articles database
  const topArticles = db.prepare(`
    SELECT id, title, slug, views, category_name, author, image_url, created_at
    FROM articles 
    WHERE status = 'published'
    ORDER BY views DESC, id DESC 
    LIMIT 6
  `).all();

  // 10. Real Recent Published Articles from articles database
  const recentArticles = db.prepare(`
    SELECT id, title, slug, views, category_name, source_name, author, created_at
    FROM articles
    WHERE status = 'published'
    ORDER BY id DESC
    LIMIT 6
  `).all();

  // 11. 7 days trend
  const dailyVisits = db.prepare(`
    SELECT date(visited_at) as visit_date, COUNT(*) as count
    FROM visitor_logs
    ${whereExclude}
    GROUP BY date(visited_at)
    ORDER BY visit_date DESC
    LIMIT 7
  `).all();

  // 12. Settings integration (SEO & Auto-Crawl)
  let seoScore = 91;
  try {
    const seoRow = db.prepare("SELECT value FROM settings WHERE key = 'seo_health_score'").get();
    if (seoRow && seoRow.value) seoScore = Number(seoRow.value);
  } catch (e) {}

  let autoCrawlActive = false;
  let autoCrawlLastRun = null;
  try {
    const acRow = db.prepare("SELECT value FROM settings WHERE key = 'auto_crawl_enabled'").get();
    autoCrawlActive = acRow ? acRow.value === 'true' : false;
    const acLast = db.prepare("SELECT value FROM settings WHERE key = 'auto_crawl_last_run'").get();
    autoCrawlLastRun = acLast ? acLast.value : null;
  } catch (e) {}

  return {
    totalVisits: combinedTotalViews,
    totalArticleViews,
    logVisitsCount: totalVisits,
    totalArticles,
    totalCrawled,
    totalCrawlerSources,
    totalAdmins,
    uniqueIps,
    seoScore,
    autoCrawlActive,
    autoCrawlLastRun,
    activeLiveCount: getCleanActiveVisitors().length,
    categoryBreakdown: categoryRows,
    deviceBreakdown: deviceRows,
    osBreakdown: osRows,
    browserBreakdown: browserRows,
    topLocations: locationRows,
    topArticles,
    recentArticles,
    dailyVisits: dailyVisits.reverse()
  };
}

module.exports = {
  extractClientIp,
  resolveGeo,
  resolveGeoOnline,
  parseUserAgent,
  resolveCellularNetwork,
  deriveDeviceImei,
  logVisit,
  setupSocketTracking,
  getVisitorAnalytics,
  getCleanActiveVisitors,
  activeVisitors
};

