import React from 'react';
import { Link } from 'react-router-dom';
import { BlogCarousel } from '../components/BlogCarousel';
import { ReviewCarousel } from '../components/ReviewCarousel';

export const Growth: React.FC = () => {
  return (
    <main className="pt-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-8 py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container mb-6">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              <span className="text-xs font-bold uppercase tracking-widest font-label">A REVOLUÇÃO DA PROVA SOCIAL</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold font-headline text-on-surface tracking-tight leading-[1.1] mb-8">
              Domine as Redes Sociais. <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Construa Autoridade.</span>
            </h1>
            <p className="text-xl text-on-surface-variant max-w-2xl mb-10 leading-relaxed">
              Estrategista Digital e Influenciadora
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/precos" className="text-center bg-gradient-to-r from-primary to-secondary text-on-primary text-lg font-bold px-8 py-4 rounded-full shadow-[0px_12px_32px_rgba(0,83,220,0.2)] hover:opacity-90 transition-opacity">
                Aumentar Minha Autoridade Agora
              </Link>
              <Link to="/precos" className="text-center bg-surface-container-highest text-primary text-lg font-bold px-8 py-4 rounded-full hover:bg-surface-variant transition-colors">
                Ver Preços
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-[0px_20px_40px_rgba(0,0,0,0.1)] rotate-3 hover:rotate-0 transition-all duration-500 bg-gradient-to-br from-[#f8f9ff] to-[#e4e9f7] border-4 border-white h-[450px] md:h-[500px] flex items-center justify-center group">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent opacity-50"></div>
              <img alt="FastGram Rocket" className="w-1/2 h-1/2 object-contain drop-shadow-[0_20px_30px_rgba(126,20,255,0.4)] group-hover:scale-110 group-hover:-translate-y-4 transition-transform duration-700 ease-out relative z-10" src="/rocket.png" />
              <div className="absolute bottom-6 left-6 right-6 bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">trending_up</span>
                  </div>
                  <div>
                    <p className="text-on-surface font-bold text-lg leading-none">+12.4k Follows</p>
                    <p className="text-on-surface-variant text-sm">Cliente FastGram</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Authority Section */}
      <section className="bg-surface-container-low py-24 rounded-[3rem] mx-4 md:mx-8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold font-headline text-on-surface mb-6">Autoridade é a <span className="text-primary">Moeda</span> da Era Digital</h2>
            <p className="text-lg text-on-surface-variant max-w-2xl">Números não apenas contam; eles comunicam. Um alto número de pessoas no seu perfil é o sinal instantâneo de um líder corporativo.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] hover:shadow-xl transition-shadow border-none">
              <div className="w-14 h-14 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-on-primary-container text-3xl">verified</span>
              </div>
              <h3 className="text-2xl font-bold font-headline mb-4">Credibilidade Instantânea</h3>
              <p className="text-on-surface-variant leading-relaxed">Pare de lutar para provar seu valor. Deixe seu perfil falar por você desde o primeiro segundo em que um cliente em potencial acessa sua página.</p>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] hover:shadow-xl transition-shadow border-none">
              <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-on-secondary-container text-3xl">psychology</span>
              </div>
              <h3 className="text-2xl font-bold font-headline mb-4">Psicologia Social</h3>
              <p className="text-on-surface-variant leading-relaxed">Os seres humanos são programados para seguir a multidão. Quando as pessoas veem outros seguindo você, elas instintivamente querem saber o porquê — e participar.</p>
            </div>
            <div className="bg-surface-container-lowest p-8 rounded-[2rem] hover:shadow-xl transition-shadow border-none">
              <div className="w-14 h-14 rounded-2xl bg-tertiary-container flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-on-tertiary-container text-3xl">rocket_launch</span>
              </div>
              <h3 className="text-2xl font-bold font-headline mb-4">Liderança de Mercado</h3>
              <p className="text-on-surface-variant leading-relaxed">A competição é feroz. Destaque-se como a autoridade em seu nicho mantendo os números que refletem o domínio do mercado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Carousel */}
      <BlogCarousel />

      {/* Review Carousel */}
      <ReviewCarousel />

      {/* CTA Section */}
      <section className="py-16 px-8 max-w-7xl mx-auto text-center" id="cta">
        <div className="bg-inverse-surface text-surface rounded-[4rem] p-16 md:p-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <span className="material-symbols-outlined text-[15rem]">auto_graph</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold font-headline mb-8 relative z-10 leading-tight">
            Pronto para Parar de Ser <br/><span className="text-primary-fixed">Invisível?</span>
          </h2>
          <p className="text-xl text-surface-variant max-w-2xl mx-auto mb-12 relative z-10">
            Junte-se a mais de 5.000 criadores e marcas que garantiram sua autoridade com o FastGram.
          </p>
          <div className="relative z-10">
            <Link to="/precos" className="inline-block bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all px-8 py-4 text-xl">
              Começar Agora
            </Link>
            <p className="mt-6 text-sm text-surface-variant font-medium opacity-70">100% Confidencial • Perfis de Alta Qualidade • Resultados Rápidos</p>
          </div>
        </div>
      </section>
    </main>
  );
};
