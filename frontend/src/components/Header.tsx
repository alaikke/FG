import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_BASE } from '../config';

export const Header: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const getLinkClass = (path: string) => {
    const base = "font-medium transition-colors duration-300 ";
    return isActive(path)
      ? base + "text-blue-600 font-bold border-b-2 border-blue-600 py-1"
      : base + "text-slate-600 hover:text-purple-600";
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/public`)
      .then(r => r.json())
      .then(d => { if (d.logoUrl) setLogoUrl(d.logoUrl); })
      .catch(() => {});
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-[0px_12px_32px_rgba(36,49,86,0.06)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="FastGram" className="h-9 object-contain" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-blue-600 text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                  <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-headline tracking-tight">FastGram</span>
                </>
              )}
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={getLinkClass('/')}>Início</Link>
            <Link to="/precos" className={getLinkClass('/precos')}>Preços</Link>
            <Link to="/blog" className={getLinkClass('/blog')}>Blog</Link>
            <Link to="/track" className={getLinkClass('/track')}>Acompanhar Pedido</Link>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://wa.me/5548988332790" target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-5 py-2 font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/30" style={{ borderRadius: '100px' }}>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
              Suporte
            </a>
            
            {/* Animated Hamburger Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative w-12 h-12 flex flex-col items-center justify-center gap-2 focus:outline-none z-50 hover:bg-blue-50/50 rounded-xl transition-colors"
              aria-label="Toggle mobile menu"
            >
              <span className={`block w-7 h-[3px] bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ease-out origin-center ${isMobileMenuOpen ? 'rotate-45 translate-y-[11px]' : ''}`} />
              <span className={`block w-7 h-[3px] bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ease-out origin-center ${isMobileMenuOpen ? 'opacity-0 translate-x-4' : ''}`} />
              <span className={`block w-7 h-[3px] bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ease-out origin-center ${isMobileMenuOpen ? '-rotate-45 -translate-y-[11px]' : ''}`} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`md:hidden fixed inset-0 top-20 z-40 bg-white/95 backdrop-blur-3xl transition-all duration-500 ease-in-out flex flex-col ${isMobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'}`}>
        <div className="flex flex-col px-6 py-10 gap-6 overflow-y-auto">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800 hover:text-blue-600 transition-colors py-3 border-b border-slate-100">Início</Link>
          <Link to="/precos" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800 hover:text-blue-600 transition-colors py-3 border-b border-slate-100">Preços</Link>
          <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800 hover:text-blue-600 transition-colors py-3 border-b border-slate-100">Blog</Link>
          <Link to="/track" onClick={() => setIsMobileMenuOpen(false)} className="text-2xl font-bold text-slate-800 hover:text-blue-600 transition-colors py-3 border-b border-slate-100">Acompanhar Pedido</Link>
          
          <div className="pt-8">
            <a href="https://wa.me/5548988332790" target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-5 font-bold text-xl hover:opacity-90 transition-opacity shadow-2xl shadow-blue-600/30 active:scale-95" style={{ borderRadius: '100px' }}>
              <span className="w-3.5 h-3.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_12px_rgba(74,222,128,0.8)] border-2 border-white"></span>
              Falar com o Suporte
            </a>
          </div>
        </div>
      </div>
    </>
  );
};
