import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Home } from './pages/Home';
import { Analyze } from './pages/Analyze';
import { Results } from './pages/Results';
import { FairnessLab } from './pages/FairnessLab';
import { About } from './pages/About';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        {/* WCAG 2.2 Level A Skip Navigation Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-navy-900 focus:text-white focus:rounded-xl focus:shadow-lg focus:ring-2 focus:ring-teal-500 focus:text-xs focus:font-bold focus:outline-none transition-all"
        >
          Skip to main content
        </a>

        {/* Global Non-Clinical Research Disclaimer */}
        <DisclaimerBanner />

        <Navbar />
        <main
          id="main-content"
          tabIndex={-1}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full focus:outline-none"
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/analyze" element={<Analyze />} />
            <Route path="/results" element={<Results />} />
            <Route path="/fairness" element={<FairnessLab />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
