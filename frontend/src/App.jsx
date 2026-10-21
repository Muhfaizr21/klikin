import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProblemSolution from './components/ProblemSolution';
import Features from './components/Features';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import './App.css';

export default function App() {
  return (
    <div className="main-wrapper">
      <Navbar />
      <main>
        <Hero />
        <ProblemSolution />
        <Features />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
