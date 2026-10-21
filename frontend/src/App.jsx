import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProblemSolution from './components/ProblemSolution';
import Features from './components/Features';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#login') return 'login';
    if (hash === '#register') return 'register';
    return 'landing';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#login') {
        setCurrentView('login');
      } else if (hash === '#register') {
        setCurrentView('register');
      } else if (!hash || hash === '#') {
        setCurrentView('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

  if (currentView === 'login' || currentView === 'register') {
    return (
      <AuthPage
        initialMode={currentView}
        onBackToHome={handleBackToHome}
      />
    );
  }

  return (
    <div className="main-wrapper">
      <Navbar onNavigateToAuth={handleNavigateToAuth} />
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
