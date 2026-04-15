import React from 'react';
import { Link } from 'react-router-dom';

export const WhatsApp: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 mt-20 text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-green-500 text-5xl">support_agent</span>
      </div>
      <h1 className="text-4xl font-bold text-slate-900 mb-4 font-headline">Suporte Humanizado</h1>
      <p className="text-slate-600 mb-10 max-w-lg text-lg leading-relaxed">
        Nós oferecemos <strong>suporte direto via WhatsApp</strong>! Nossa equipe está a postos para te ajudar com qualquer dúvida sobre serviços, pagamentos ou andamento do seu pedido.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-xl">
        <a 
          href="https://wa.me/5511999999999" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 flex justify-center items-center gap-3 bg-green-500 text-white px-8 py-4 font-bold text-lg rounded-xl hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30 font-headline active:scale-95"
        >
          <span className="material-symbols-outlined">forum</span>
          Chamar no WhatsApp
        </a>
        
        <Link 
          to="/track"
          className="flex-1 flex justify-center items-center gap-3 bg-slate-900 text-white px-8 py-4 font-bold text-lg rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 font-headline active:scale-95 border border-slate-700"
        >
          <span className="material-symbols-outlined">search</span>
          Acompanhar Pedido
        </Link>
      </div>
    </div>
  );
};
