require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const { setupSocketTracking } = require('./services/tracker');
const { setupAdminChatSocket } = require('./services/adminChat');
const { initScheduler } = require('./services/scheduler');
const { generateSitemapXml, generateRobotsTxt, generateRssFeed } = require('./services/seo');
const db = require('./db');

const app = express();
const server = http.createServer(app);

// Socket.io for Real-Time Visitor Tracking
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for accurate client IP tracking behind Nginx, Cloudflare, etc.
app.set('trust proxy', true);

// Initialize Socket.io tracking
setupSocketTracking(io);
setupAdminChatSocket(io);

// Initialize Background Automation Scheduler (Auto-Crawl & Periodic SEO)
initScheduler();

// Mount API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CALON JENAZAH News Portal API',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// PUBLIC SEARCH ENGINE & RSS FEEDS (SEO)
// ==========================================

// Dynamic XML Sitemap
app.get('/sitemap.xml', (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const baseUrl = `${protocol}://${host}`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateSitemapXml(baseUrl));
  } catch (err) {
    res.status(500).send('Error generating sitemap: ' + err.message);
  }
});

// Dynamic Robots.txt
app.get('/robots.txt', (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const baseUrl = `${protocol}://${host}`;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(generateRobotsTxt(baseUrl));
  } catch (err) {
    res.status(500).send('Error generating robots.txt: ' + err.message);
  }
});

// Dynamic RSS & Atom Feed for Google News
app.get(['/rss.xml', '/feed.xml'], (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const baseUrl = `${protocol}://${host}`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(generateRssFeed(baseUrl));
  } catch (err) {
    res.status(500).send('Error generating RSS feed: ' + err.message);
  }
});

// Serve frontend with optimal caching in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist, {
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    // Keep index.html fresh to pick up latest hashed assets
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

app.get('*', (req, res) => {
  const indexHtml = path.join(clientDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send('API CALON JENAZAH is running. Frontend dev server is on http://localhost:3000');
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🔥 CALON JENAZAH Portal Berita & Admin Server Active`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📡 Socket.io Live Tracking initialized`);
  console.log(`🚀 Mode: ${process.env.NODE_ENV || 'production'}`);
  console.log(`====================================================`);
});

// Graceful shutdown
const handleExit = () => {
  console.log('\nShutting down CALON JENAZAH server gracefully...');
  server.close(() => {
    try {
      db.close();
    } catch (e) {}
    console.log('Server and database closed. Bye!');
    process.exit(0);
  });
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
