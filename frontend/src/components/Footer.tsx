import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200/15 py-12 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="space-y-4">
          <div className="text-lg font-bold text-slate-900">FastGram</div>
          <p className="text-slate-500 text-sm leading-relaxed">
            A maior plataforma de marketing social do Brasil. Elevando sua presença digital com tecnologia e segurança.
          </p>
        </div>
        <div>
          <h5 className="font-bold mb-4 text-slate-900">Links Rápidos</h5>
          <ul className="space-y-2">
            <li><Link to="/termos" className="text-slate-500 hover:text-blue-500 text-sm transition-transform hover:translate-x-1 inline-block">Termos de Serviço</Link></li>
            <li><Link to="/privacidade" className="text-slate-500 hover:text-blue-500 text-sm transition-transform hover:translate-x-1 inline-block">Política de Privacidade</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold mb-4 text-slate-900">Ajuda</h5>
          <ul className="space-y-2">
            <li><Link to="/whatsapp" className="text-slate-500 hover:text-blue-500 text-sm transition-transform hover:translate-x-1 inline-block">Suporte via WhatsApp</Link></li>
            <li><Link to="/ajuda" className="text-slate-500 hover:text-blue-500 text-sm transition-transform hover:translate-x-1 inline-block">Central de Ajuda</Link></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold mb-4 text-slate-900">Newsletter</h5>
          <p className="text-sm text-slate-500 mb-4">Receba dicas de crescimento.</p>
          <div className="flex gap-2">
            <input className="bg-white border-none rounded-lg px-4 py-2 text-sm w-full outline-none focus:ring-2 focus:ring-primary/20" placeholder="Seu e-mail" type="email" />
            <button className="bg-primary text-white p-2 rounded-lg material-symbols-outlined">send</button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-200/50 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-slate-500">© 2026 FastGram Media. Todos os direitos reservados.</p>
        <div className="flex gap-4">
          <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-primary transition-colors">brand_awareness</span>
          <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-primary transition-colors">diversity_3</span>
          <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-primary transition-colors">public</span>
        </div>
      </div>
    </footer>
  );
};
