import { io } from 'socket.io-client';

let socket = null;
let currentSessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
let startTime = Date.now();
let activePage = '/';
let activeTitle = 'Calon Jenazah';
let activeArticleId = null;

export function getSocket() {
  if (!socket) {
    // Determine socket target
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
  const screenResolution = `${window.screen.width}x${window.screen.height}`;

  // Emit real-time telemetry via WebSocket
  sock.emit('visitor_telemetry', {
    pageUrl,
    pageTitle,
    articleId,
    screenResolution,
    sessionId: currentSessionId
  });

  // Also send HTTP beacon for persistent database logging
  const payload = {
    pageUrl,
    pageTitle,
    articleId,
    referrer: document.referrer || 'Direct',
    sessionId: currentSessionId,
    screenResolution,
    durationSeconds: Math.floor((Date.now() - startTime) / 1000)
  };

  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});
}

// Subscribe to Live Visitors on Admin
export function subscribeAdminLive(callback) {
  const sock = getSocket();
  sock.emit('join_admin_monitor');
  sock.on('live_visitors_update', callback);

  return () => {
    sock.off('live_visitors_update', callback);
  };
}
