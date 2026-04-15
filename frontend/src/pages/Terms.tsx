import React from 'react';

export const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 mt-20">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 font-headline">Termos de Serviço</h1>
      <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
        <p>Bem-vindo à FastGram. Estes termos de serviço regem o uso do nosso site e serviços.</p>
        <h2 className="text-xl font-bold text-slate-800 mt-6">1. Aceitação dos Termos</h2>
        <p>Ao acessar e usar nossos serviços, você concorda em cumprir e estar vinculado a estes termos de forma integral e incondicional. Se você não concorda com qualquer parte destes termos, você não poderá acessar nosso serviço ou a plataforma.</p>
        
        <h2 className="text-xl font-bold text-slate-800 mt-6">2. Uso do Serviço</h2>
        <p>Nossos serviços devem ser usados de acordo com as diretrizes e leis aplicáveis para fins legítimos, não devendo ferir as normas das plataformas parceiras. É estritamente proibido utilizar nosso serviço para contas que promovam atividades maliciosas, ódio ou violência.</p>
        
        <h2 className="text-xl font-bold text-slate-800 mt-6">3. Garantias e Responsabilidades</h2>
        <p>Fornecemos nosso serviço "no estado em que se encontra", sem quaisquer garantias expressas ou implícitas de adequação a um determinado fim, de não violação ou garantias advindas de negociação. Não garantimos a manutenção perpétua do engajamento de provedores de terceiros.</p>

        <h2 className="text-xl font-bold text-slate-800 mt-6">4. Modificações dos Termos</h2>
        <p>Reservamo-nos o direito de modificar ou substituir estes termos a qualquer momento, a nosso critério, com ou sem aviso prévio. É de responsabilidade do usuário verificar regularmente possíveis atualizações na plataforma.</p>
        <p className="mt-8 text-sm text-slate-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  );
};
