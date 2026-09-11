import { io } from 'socket.io-client';

let socket = null;
let currentSessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
let startTime = Date.now();
let activePage = '/';
let activeTitle = 'Calon Jenazah';
let activeArticleId = null;

// Cached client-side internet IP and Geolocation
let cachedClientGeo = null;
let isResolvingClientGeo = false;

/**
 * Collect detailed client hardware & display telemetry
 */
export function getClientDeviceSpecs() {
  const width = window.screen?.width || window.innerWidth || 1920;
  const height = window.screen?.height || window.innerHeight || 1080;
  const viewportW = window.innerWidth || width;
  const viewportH = window.innerHeight || height;
  const dpr = window.devicePixelRatio || 1;
  const touch = Boolean('ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
  const cores = navigator.hardwareConcurrency || 4;
  const memory = navigator.deviceMemory || (cores >= 8 ? 16 : 8);
  const conn = navigator.connection?.effectiveType || '4G/WiFi';
  const orientation = window.screen?.orientation?.type || (viewportW > viewportH ? 'landscape-primary' : 'portrait-primary');
  const lang = navigator.language || 'id-ID';
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';

  // Basic device type detection
  let deviceType = 'Desktop';
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet/i.test(ua) || (touch && width >= 600 && width <= 1024)) {
    deviceType = 'Tablet';
  } else if (/Android|iPhone|iPod|Mobile/i.test(ua) || (touch && width < 600)) {
    deviceType = 'Mobile';
  }

  // Model & Brand heuristic
  let deviceBrand = 'Workstation';
  let deviceModel = 'PC/Desktop';
  if (/iPhone/i.test(ua)) {
    deviceBrand = 'Apple';
    deviceModel = 'Apple iPhone';
  } else if (/iPad/i.test(ua)) {
    deviceBrand = 'Apple';
    deviceModel = 'Apple iPad';
  } else if (/Macintosh/i.test(ua)) {
    deviceBrand = 'Apple';
    deviceModel = 'Apple MacBook/Mac';
  } else if (/Samsung|SM-[A-Za-z0-9]+/i.test(ua)) {
    deviceBrand = 'Samsung';
    const m = ua.match(/SM-[A-Za-z0-9]+/i);
    deviceModel = m ? m[0] : 'Samsung Galaxy';
  } else if (/Xiaomi|Redmi|POCO/i.test(ua)) {
    deviceBrand = 'Xiaomi';
    deviceModel = 'Xiaomi / Redmi';
  } else if (/Windows/i.test(ua)) {
    deviceBrand = 'Microsoft / PC';
    deviceModel = 'Windows Workstation';
  } else if (/Linux/i.test(ua)) {
    deviceBrand = 'Linux System';
    deviceModel = 'Linux Desktop';
  }

  // Detect custom or bridge-provided device IMEI if running inside hybrid app/WebView
  let deviceImei = null;
  try {
    if (typeof window !== 'undefined') {
      deviceImei = window.__DEVICE_IMEI__ ||
                   window.AndroidBridge?.getImei?.() ||
                   window.webkit?.messageHandlers?.getImei?.() ||
                   localStorage.getItem('calonjenazah_device_imei') ||
                   null;
    }
  } catch (e) {}

  return {
    screenResolution: `${width}x${height}`,
    viewport: `${viewportW}x${viewportH}`,
    pixelRatio: Number(dpr.toFixed(2)),
    orientation,
    touchSupport: touch,
    cpuCores: cores,
    ramGb: memory,
    connectionType: conn,
    language: lang,
    timezone: tz,
    deviceType,
    deviceBrand,
    deviceModel,
    imei: deviceImei
  };
}

/**
 * Asynchronously fetch internet public IP & Geolocation from free open internet API
 */
export async function fetchInternetLocation() {
  if (cachedClientGeo) return cachedClientGeo;
  if (isResolvingClientGeo) return null;
  isResolvingClientGeo = true;

  try {
    // Try primary: ip-api.com
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query', {
      signal: controller.signal
    });
    clearTimeout(timeout);
    const data = await res.json();

    if (data && data.status === 'success') {
      cachedClientGeo = {
        ip: data.query,
        country: data.country,
        country_code: data.countryCode,
        region: data.regionName || data.region,
        city: data.city,
        zip_code: data.zip,
        latitude: data.lat,
        longitude: data.lon,
        isp: data.isp,
        org: data.org,
        as_number: data.as,
        timezone: data.timezone
      };
      isResolvingClientGeo = false;
      return cachedClientGeo;
    }
  } catch (e) {
    // Primary failed, try fallback
  }

  try {
    // Fallback: ipwhois.app
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipwhois.app/json/', { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();

    if (data && data.success) {
      cachedClientGeo = {
        ip: data.ip,
        country: data.country,
        country_code: data.country_code,
        region: data.region,
        city: data.city,
        zip_code: data.postal || '',
        latitude: data.latitude,
        longitude: data.longitude,
        isp: data.isp,
        org: data.org,
        as_number: data.asn,
        timezone: data.timezone
      };
      isResolvingClientGeo = false;
      return cachedClientGeo;
    }
  } catch (e) {
    // Fallback failed
  }

  isResolvingClientGeo = false;
  return null;
}

export function getSocket() {
  if (!socket) {
    const socketUrl = window.location.port === '3000' ? 'http://localhost:5000' : '/';
    socket = io(socketUrl, {
      query: {
        pageUrl: window.location.hash || '/',
        pageTitle: document.title
      },
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}

export function reportNavigation(pageUrl, pageTitle, articleId = null) {
  activePage = pageUrl;
  activeTitle = pageTitle;
  activeArticleId = articleId;

  const sock = getSocket();
  const specs = getClientDeviceSpecs();

  const token = localStorage.getItem('calonjenazah_token');
  const isAdmin = Boolean(token || window.location.hash.startsWith('#/admin'));
  let adminUsername = 'admin';
  try {
    const adminUser = JSON.parse(localStorage.getItem('calonjenazah_admin_user') || '{}');
    if (adminUser.username) adminUsername = adminUser.username;
  } catch (e) {}

  const emitTelemetry = (clientGeo = null) => {
    const payload = {
      pageUrl,
      pageTitle,
      articleId,
      referrer: document.referrer || 'Direct',
      sessionId: currentSessionId,
      durationSeconds: Math.floor((Date.now() - startTime) / 1000),
      isAdmin,
      adminUsername,
      ...specs
    };

    if (clientGeo) {
      payload.clientGeo = clientGeo;
      payload.publicIp = clientGeo.ip;
    }

    // Emit real-time telemetry via WebSocket
    sock.emit('visitor_telemetry', payload);

    // Also send HTTP beacon for persistent database logging
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/analytics/track', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    }).catch(() => {});
  };

  // Immediate emit with device specs
  emitTelemetry(cachedClientGeo);

  // If client internet location not yet resolved, resolve in background and re-emit
  if (!cachedClientGeo) {
    fetchInternetLocation().then((geo) => {
      if (geo) {
        emitTelemetry(geo);
      }
    });
  }
}

// Subscribe to Live Visitors on Admin (Exclude Admin IP from live monitor)
export function subscribeAdminLive(callback) {
  const sock = getSocket();
  const token = localStorage.getItem('calonjenazah_token');
  let adminUsername = 'admin';
  try {
    const adminUser = JSON.parse(localStorage.getItem('calonjenazah_admin_user') || '{}');
    if (adminUser.username) adminUsername = adminUser.username;
  } catch (e) {}

  const joinPayload = {
    token,
    username: adminUsername,
    publicIp: cachedClientGeo?.ip || null
  };

  sock.emit('join_admin_monitor', joinPayload);
  sock.on('live_visitors_update', callback);

  // If public IP resolves later, re-notify monitor room to ensure IP exclusion
  if (!cachedClientGeo) {
    fetchInternetLocation().then((geo) => {
      if (geo && geo.ip) {
        sock.emit('join_admin_monitor', {
          token,
          username: adminUsername,
          publicIp: geo.ip
        });
      }
    });
  }

  return () => {
    sock.off('live_visitors_update', callback);
  };
}

