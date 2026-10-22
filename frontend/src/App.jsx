import React, { useState, useEffect, Suspense, lazy } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProblemSolution from './components/ProblemSolution';
import Features from './components/Features';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import { navigateTo, replaceTo } from './utils/navigation';
import './App.css';

const AuthPage = lazy(() => import('./components/AuthPage'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const PublicBioPage = lazy(() => import('./components/PublicBioPage'));

function RouteFallback() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
      <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500">
        <span className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
        <span>Memuat halaman...</span>
      </div>
    </div>
  );
}

const VALID_OWNER_TABS = [
  'dashboard',
  'links',
  'analytics',
  'domain',
  'leads',
  'billing',
  'page-settings',
  'notifications',
  'support',
  'settings',
];

const TAB_ALIASES = {
  editor: 'links',
  'editor-bio': 'links',
};

const RESERVED_PATHS = ['login', 'register', 'owner', 'admin', 'api', 'assets', 'p', 'favicon.ico'];

function parseCurrentRoute() {
  const path = window.location.pathname;
  const lowerPath = path.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  // 1. Backwards-compatibility redirect: convert legacy hash (e.g. #settings, #billing) to clean HTML5 URL
  if (hash.startsWith('#p/')) {
    const slug = hash.slice(3) || 'kopiseduh';
    return { view: 'public_page', slug, tab: 'dashboard', legacyRedirect: `/p/${slug}` };
  }
  if (hash === '#login') {
    return { view: 'login', slug: '', tab: 'dashboard', legacyRedirect: '/login' };
  }
  if (hash === '#register') {
    return { view: 'register', slug: '', tab: 'dashboard', legacyRedirect: '/register' };
  }

  const cleanHash = hash.replace(/^#/, '');
  if (VALID_OWNER_TABS.includes(cleanHash) || TAB_ALIASES[cleanHash]) {
    const resolvedTab = TAB_ALIASES[cleanHash] || cleanHash;
    return { view: 'dashboard', slug: '', tab: resolvedTab, legacyRedirect: `/owner/${resolvedTab}` };
  }

  // 2. Parse HTML5 path
  if (lowerPath === '/login') {
    return { view: 'login', slug: '', tab: 'dashboard', legacyRedirect: null };
  }
  if (lowerPath === '/register') {
    return { view: 'register', slug: '', tab: 'dashboard', legacyRedirect: null };
  }
  if (lowerPath.startsWith('/p/')) {
    const slug = lowerPath.slice(3).replace(/^\/+|\/+$/g, '') || 'kopiseduh';
    return { view: 'public_page', slug, tab: 'dashboard', legacyRedirect: null };
  }
  if (lowerPath === '/owner' || lowerPath === '/owner/') {
    return { view: 'dashboard', slug: '', tab: 'dashboard', legacyRedirect: '/owner/dashboard' };
  }
  if (lowerPath.startsWith('/owner/')) {
    const rawTab = lowerPath.replace(/^\/owner\/?/, '').split('/')[0];
    const resolvedTab = TAB_ALIASES[rawTab] || (VALID_OWNER_TABS.includes(rawTab) ? rawTab : 'dashboard');
    return { view: 'dashboard', slug: '', tab: resolvedTab, legacyRedirect: null };
  }
  if (lowerPath === '/admin' || lowerPath === '/admin/') {
    return { view: 'dashboard', slug: '', tab: 'overview', legacyRedirect: '/admin/overview' };
  }
  if (lowerPath.startsWith('/admin/')) {
    const rawTab = lowerPath.replace(/^\/admin\/?/, '').split('/')[0] || 'overview';
    const resolvedTab = (rawTab === 'dashboard' || rawTab === 'index') ? 'overview' : rawTab;
    return { view: 'dashboard', slug: '', tab: resolvedTab, legacyRedirect: null };
  }

  // 3. Single-segment public bio slug (e.g. /kopiseduh)
  const singleSegmentMatch = lowerPath.match(/^\/([a-z0-9_-]+)\/?$/);
  if (singleSegmentMatch && !RESERVED_PATHS.includes(singleSegmentMatch[1])) {
    return { view: 'public_page', slug: singleSegmentMatch[1], tab: 'dashboard', legacyRedirect: null };
  }

  return { view: 'landing', slug: '', tab: 'dashboard', legacyRedirect: null };
}

export default function App() {
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('klikin_token') || null);
  const [authUser, setAuthUser] = useState(() => {
    try {
      const saved = localStorage.getItem('klikin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [route, setRoute] = useState(parseCurrentRoute);

  // If initial load hit a legacy hash (like /#settings), clean it up in the address bar
  useEffect(() => {
    if (route.legacyRedirect) {
      replaceTo(route.legacyRedirect);
    }
  }, [route.legacyRedirect]);

  useEffect(() => {
    const handleLocationChange = () => {
      const parsed = parseCurrentRoute();
      if (parsed.legacyRedirect) {
        replaceTo(parsed.legacyRedirect);
      }
      setRoute(parsed);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleNavigateToAuth = (mode) => {
    const target = mode === 'register' ? '/register' : '/login';
    navigateTo(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    navigateTo('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToDashboard = () => {
    if (authUser?.role === 'SUPER_ADMIN') {
      navigateTo('/admin/overview');
    } else {
      navigateTo('/owner/dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (user, token) => {
    setAuthUser(user);
    setAuthToken(token);
    localStorage.setItem('klikin_user', JSON.stringify(user));
    localStorage.setItem('klikin_token', token);

    // Check if user was trying to access a specific owner or admin tab before auth
    const savedRedirect = sessionStorage.getItem('klikin_redirect_url');
    sessionStorage.removeItem('klikin_redirect_url');

    let destination = '/owner/dashboard';
    if (user?.role === 'SUPER_ADMIN') {
      destination = savedRedirect && savedRedirect.startsWith('/admin') ? savedRedirect : '/admin/overview';
    } else {
      destination = savedRedirect && savedRedirect.startsWith('/owner') ? savedRedirect : '/owner/dashboard';
    }

    navigateTo(destination);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setAuthUser(null);
    setAuthToken(null);
    localStorage.removeItem('klikin_user');
    localStorage.removeItem('klikin_token');
    sessionStorage.removeItem('klikin_redirect_url');
    navigateTo('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 1. Public Bio Page route (/p/:slug or /:slug)
  if (route.view === 'public_page') {
    return (
      <Suspense fallback={<RouteFallback />}>
        <PublicBioPage
          slug={route.slug || 'kopiseduh'}
          onBackToHome={handleBackToHome}
        />
      </Suspense>
    );
  }

  // 2. Owner / Admin Dashboard route (/owner/* or /admin/*)
  if (route.view === 'dashboard') {
    // Auth gate for dashboard: if token not present, redirect to login and preserve destination
    if (!authToken || !authUser) {
      sessionStorage.setItem('klikin_redirect_url', window.location.pathname);
      return (
        <Suspense fallback={<RouteFallback />}>
          <AuthPage
            initialMode="login"
            onBackToHome={handleBackToHome}
            onAuthSuccess={handleAuthSuccess}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={<RouteFallback />}>
        <Dashboard
          user={authUser}
          token={authToken}
          onLogout={handleLogout}
          onBackToHome={handleBackToHome}
          initialTab={route.tab}
        />
      </Suspense>
    );
  }

  // 3. Auth pages (/login or /register)
  if (route.view === 'login' || route.view === 'register') {
    return (
      <Suspense fallback={<RouteFallback />}>
        <AuthPage
          initialMode={route.view}
          onBackToHome={handleBackToHome}
          onAuthSuccess={handleAuthSuccess}
        />
      </Suspense>
    );
  }

  // 4. Default: Landing page (/)
  return (
    <div className="main-wrapper">
      <Navbar
        user={authUser}
        onNavigateToAuth={handleNavigateToAuth}
        onNavigateToDashboard={handleNavigateToDashboard}
      />
      <main>
        <Hero
          onNavigateToLogin={() => handleNavigateToAuth('login')}
          onNavigateToRegister={() => handleNavigateToAuth('register')}
        />
        <ProblemSolution />
        <Features />
        <Pricing onNavigateToRegister={() => handleNavigateToAuth('register')} />
        <FAQ />
      </main>
      <Footer onNavigateToAuth={handleNavigateToAuth} />
    </div>
  );
}
