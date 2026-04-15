import React from 'react';

export const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16 mt-20">
      <h1 className="text-3xl font-bold text-slate-900 mb-8 font-headline">Política de Privacidade</h1>
      <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
        <p>A FastGram preza pela transparência e privacidade dos seus dados. Esta política dita como efetuamos a manipulação de informações confidenciais.</p>
        
        <h2 className="text-xl font-bold text-slate-800 mt-6">1. Coleta de Informações</h2>
        <p>Coletamos minimamente as informações cruciais para processarmos suas solicitações, como nome de usuário público (@arroba), que será alvo do nosso marketing. Não iremos sob qualquer pretexto solicitar sua senha.</p>
        
        <h2 className="text-xl font-bold text-slate-800 mt-6">2. Uso e Tratamento</h2>
        <p>Os dados processados na aplicação serão conduzidos apenas para efetuar o impulsionamento digital escolhido pelo cliente e realizar o atendimento primário do suporte via canais externos.</p>
        
        <h2 className="text-xl font-bold text-slate-800 mt-6">3. Segurança dos Dados</h2>
        <p>Preservamos suas informações de pagamento delegando inteiramente o processamento e retenção das mesmas a um gateway sólido e regulamentado. Não gravamos dados de cartões de crédito em nossa infraestrutura.</p>

        <h2 className="text-xl font-bold text-slate-800 mt-6">4. Contato</h2>
        <p>Mediante dúvidas sobre manipulação de dados ou remoção do seu histórico de aquisições do nosso banco, favor acionar o Suporte a qualquer momento.</p>

        <p className="mt-8 text-sm text-slate-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  );
};
