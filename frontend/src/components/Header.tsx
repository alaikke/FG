import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_BASE } from '../config';

export const Header: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState('');
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

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-[0px_12px_32px_rgba(36,49,86,0.06)]">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
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
          <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-5 py-2 font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/30" style={{ borderRadius: '100px' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
            Suporte
          </a>
          <button className="md:hidden p-2 text-slate-600 hover:text-blue-600 transition-transform active:scale-90 flex items-center justify-center">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
