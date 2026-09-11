import React, { useState, useEffect } from 'react';
import Navbar from './components/portal/Navbar';
import Footer from './components/portal/Footer';
import Home from './pages/portal/Home';
import ArticleDetail from './pages/portal/ArticleDetail';
import CategoryPage from './pages/portal/CategoryPage';
import SearchPage from './pages/portal/SearchPage';

import AdminLayout from './pages/admin/AdminLayout';
import DashboardOverview from './pages/admin/DashboardOverview';
import LiveVisitorMap from './pages/admin/LiveVisitorMap';
import VisitorHistory from './pages/admin/VisitorHistory';
import ReuploadNews from './pages/admin/ReuploadNews';
import CrawlerStudio from './pages/admin/CrawlerStudio';
import ArticleManagement from './pages/admin/ArticleManagement';
import SiteSettings from './pages/admin/SiteSettings';
import SeoOptimization from './pages/admin/SeoOptimization';
import AdminManagement from './pages/admin/AdminManagement';
import AdminChat from './pages/admin/AdminChat';

import { reportNavigation } from './services/telemetry';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash.replace(/^#/, '') || '/');
  const [adminTab, setAdminTab] = useState('overview');
  const [breakingNews, setBreakingNews] = useState([]);

  // Fetch breaking news ticker once
  useEffect(() => {
    fetch('/api/articles/breaking')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBreakingNews(data.articles);
        }
      })
      .catch(() => {});
  }, []);

  // Hash change routing
  useEffect(() => {
    const syncRouteAndTab = (hash) => {
      setCurrentRoute(hash);

      if (hash === '/admin' || hash === '/admin/' || hash === '/admin/overview') {
        setAdminTab('overview');
      } else if (hash.startsWith('/admin/')) {
        const sub = hash.replace('/admin/', '').split('?')[0];
        const tabMap = {
          'overview': 'overview',
          'chat': 'admin-chat',
          'admin-chat': 'admin-chat',
          'users': 'admin-users',
          'admin-users': 'admin-users',
          'live-map': 'live-tracking',
          'live-tracking': 'live-tracking',
          'history': 'history',
          'visitor-history': 'history',
          'reupload': 'reupload',
          'crawler': 'crawler',
          'articles': 'articles',
          'seo': 'seo',
          'settings': 'settings'
        };
        if (tabMap[sub]) {
          setAdminTab(tabMap[sub]);
        }
      }

      // Report telemetry on page change
      setTimeout(() => {
        reportNavigation(hash, document.title);
      }, 100);
    };

    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '') || '/';
      syncRouteAndTab(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial sync
    const initialHash = window.location.hash.replace(/^#/, '') || '/';
    syncRouteAndTab(initialHash);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
  };

  // Check if admin route
  const isAdmin = currentRoute.startsWith('/admin');

  // Render Admin View
  if (isAdmin) {
    const renderAdminTab = () => {
      switch (adminTab) {
        case 'overview': return <DashboardOverview />;
        case 'live-tracking': return <LiveVisitorMap />;
        case 'history': return <VisitorHistory />;
        case 'reupload': return <ReuploadNews />;
        case 'crawler': return <CrawlerStudio />;
        case 'articles': return <ArticleManagement />;
        case 'seo': return <SeoOptimization navigate={navigate} />;
        case 'admin-users': return <AdminManagement />;
        case 'admin-chat': return <AdminChat />;
        case 'settings': return <SiteSettings />;
        default: return <DashboardOverview />;
      }
    };

    return (
      <AdminLayout activeTab={adminTab} setActiveTab={setAdminTab} navigate={navigate}>
        {renderAdminTab()}
      </AdminLayout>
    );
  }

  // Render Public Portal Views
  const renderPortalPage = () => {
    if (currentRoute === '/' || currentRoute === '') {
      return <Home navigate={navigate} />;
    }

    if (currentRoute.startsWith('/berita/')) {
      const slug = currentRoute.replace('/berita/', '').split('?')[0];
      return <ArticleDetail slug={slug} navigate={navigate} />;
    }

    if (currentRoute.startsWith('/kategori/')) {
      const catSlug = currentRoute.replace('/kategori/', '').split('?')[0];
      return <CategoryPage categorySlug={catSlug} navigate={navigate} />;
    }

    if (currentRoute.startsWith('/cari')) {
      const searchParams = new URLSearchParams(currentRoute.split('?')[1] || '');
      const q = searchParams.get('q') || '';
      return <SearchPage initialQuery={q} navigate={navigate} />;
    }

    return <Home navigate={navigate} />;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
      <Navbar currentRoute={currentRoute} navigate={navigate} breakingNews={breakingNews} />
      <main style={{ flex: 1 }}>
        {renderPortalPage()}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}
