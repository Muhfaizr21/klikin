import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProblemSolution from './components/ProblemSolution';
import Features from './components/Features';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import PublicBioPage from './components/PublicBioPage';
import './App.css';

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

  const [publicSlug, setPublicSlug] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash.startsWith('#p/')) {
      return hash.slice(3) || 'kopiseduh';
    }
    return '';
  });

  const isOwnerRoute = (hash) => {
    const clean = hash.replace(/^#/, '');
    return [
      'dashboard',
      'editor',
      'editor-bio',
      'links',
      'analytics',
      'domain',
      'leads',
      'billing',
      'settings',
    ].includes(clean);
  };

  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    const token = localStorage.getItem('klikin_token');
    if (hash.startsWith('#p/')) return 'public_page';
    if (isOwnerRoute(hash)) {
      return token ? 'dashboard' : 'login';
    }
    if (hash === '#login') return 'login';
    if (hash === '#register') return 'register';
    return 'landing';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash.startsWith('#p/')) {
        setPublicSlug(hash.slice(3) || 'kopiseduh');
        setCurrentView('public_page');
      } else if (isOwnerRoute(hash)) {
        if (authToken) {
          setCurrentView('dashboard');
        } else {
          setCurrentView('login');
        }
      } else if (hash === '#login') {
        setCurrentView('login');
      } else if (hash === '#register') {
        setCurrentView('register');
      } else if (!hash || hash === '#') {
        setCurrentView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [authToken]);

  const handleNavigateToAuth = (mode) => {
    window.location.hash = `#${mode}`;
    setCurrentView(mode);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    window.location.hash = '';
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToDashboard = () => {
    window.location.hash = '#dashboard';
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (user, token) => {
    setAuthUser(user);
    setAuthToken(token);
    localStorage.setItem('klikin_user', JSON.stringify(user));
    localStorage.setItem('klikin_token', token);
    window.location.hash = '#dashboard';
    setCurrentView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setAuthUser(null);
    setAuthToken(null);
    localStorage.removeItem('klikin_user');
    localStorage.removeItem('klikin_token');
    window.location.hash = '';
    setCurrentView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (currentView === 'public_page') {
    return (
      <PublicBioPage
        slug={publicSlug || 'kopiseduh'}
        onBackToHome={handleBackToHome}
      />
    );
  }

  if (currentView === 'dashboard' && authUser && authToken) {
    return (
      <Dashboard
        user={authUser}
        token={authToken}
        onLogout={handleLogout}
        onBackToHome={handleBackToHome}
      />
    );
  }

  if (currentView === 'login' || currentView === 'register') {
    return (
      <AuthPage
        initialMode={currentView}
        onBackToHome={handleBackToHome}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return (
    <div className="main-wrapper">
      <Navbar
        user={authUser}
        onNavigateToAuth={handleNavigateToAuth}
        onNavigateToDashboard={handleNavigateToDashboard}
      />
      <main>
        <Hero onNavigateToRegister={() => handleNavigateToAuth('register')} />
        <ProblemSolution />
        <Features />
        <Pricing onNavigateToRegister={() => handleNavigateToAuth('register')} />
        <FAQ />
      </main>
      <Footer onNavigateToAuth={handleNavigateToAuth} />
    </div>
  );
}

