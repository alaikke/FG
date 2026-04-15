import React from 'react';
import { Link } from 'react-router-dom';

export const HelpCenter: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 mt-20">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 font-headline text-center">Central de Ajuda</h1>
      <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">Encontre respostas rápidas para as dúvidas mais frequentes da nossa plataforma, e entenda como funciona os nossos processos de entrega.</p>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">shopping_cart</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Como fazer um pedido?</h2>
          <p className="text-slate-600">Basta escolher um pacote na página inicial, inserir seu @usuário ou link no momento da compra e realizar o pagamento seguro.</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">timer</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Qual o prazo de entrega?</h2>
          <p className="text-slate-600">A maioria dos nossos serviços processam seu pagamento de maneira instantânea, e a rede parceira inicia seu pedido em poucos minutos.</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">É seguro utilizar os serviços?</h2>
          <p className="text-slate-600">Sim, não precisamos e nunca solicitaremos sua senha. Nossos processos seguem protocolos de discricionariedade compatíveis com a rede.</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">headset_mic</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Precisa de suporte avulso?</h2>
          <p className="text-slate-600">Entre em contato através do nosso WhatsApp para acionar nossa equipe de suporte para questões técnicas que não consiga resolver na plataforma.</p>
        </div>
      </div>

      <div className="mt-16 text-center">
        <Link to="/whatsapp" className="inline-flex items-center gap-2 bg-slate-900 border border-slate-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors">
          Falar com um de nossos Agentes
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
};
