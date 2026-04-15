import React from 'react';
import { Link } from 'react-router-dom';

export const WhatsApp: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 mt-10">
      
      <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-[0px_20px_40px_rgba(0,0,0,0.06)] border border-slate-100 max-w-2xl w-full text-center relative overflow-hidden group">
        
        {/* Subtle Background Glow Dynamics */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/20 rounded-full blur-[80px] opacity-40 group-hover:opacity-60 transition-opacity duration-700"></div>

        <div className="relative z-10 flex flex-col items-center">
          
          {/* Aesthetic Center Icon */}
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-[2rem] flex items-center justify-center shadow-[0_12px_24px_rgba(0,83,220,0.3)] mb-8 -rotate-3 hover:rotate-0 transition-transform duration-500">
            <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 font-headline tracking-tight">
            Suporte <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Humanizado</span>
          </h1>
          
          <p className="text-slate-500 mb-10 text-lg md:text-xl leading-relaxed max-w-lg">
            Nós oferecemos <strong className="text-slate-800">suporte direto via WhatsApp</strong>! Nossa equipe está a postos para te ajudar com qualquer dúvida sobre serviços, pagamentos ou andamento do seu pedido.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {/* Primary Action */}
            <a 
              href="https://wa.me/5511999999999" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-4 font-bold text-lg rounded-full hover:shadow-[0_12px_32px_rgba(0,83,220,0.3)] hover:-translate-y-1 transition-all duration-300 font-headline"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
              Chamar no WhatsApp
            </a>
            
            {/* Secondary Action */}
            <Link 
              to="/track"
              className="flex-1 flex justify-center items-center gap-2 bg-surface-container-lowest text-slate-700 border-2 border-slate-100 px-6 py-4 font-bold text-lg rounded-full hover:bg-slate-50 hover:border-slate-200 transition-all duration-300 font-headline shadow-sm"
            >
              <span className="material-symbols-outlined text-slate-400">search</span>
              Acompanhar Pedido
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
