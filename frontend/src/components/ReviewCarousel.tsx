import React, { useRef } from 'react';

const mockReviews = [
  {
    id: 1,
    name: "Aline Cardoso",
    role: "Influenciadora Fashion",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    text: "O FastGram dividiu minha carreira em um antes e depois. O engajamento imediato chamou a atenção de marcas famosas em semanas. É totalmente real e não pede a senha!",
    rating: 5
  },
  {
    id: 2,
    name: "Dr. Marcos Lima",
    role: "Dentista Especialista",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "Autoridade vende, e números no perfil constroem isso. Desde que iniciei os pacotes a conversão de pacientes pelo insta triplicou porque sentem confiança na clínica.",
    rating: 5
  },
  {
    id: 3,
    name: "Juliana Mendes",
    role: "Proprietária E-commerce",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    text: "A entrega é quase instantânea. Fiquei chocada na primeira compra! Bati meus sonhados 10k e logo começou o arrasta pra cima (os links nos stories fluindo).",
    rating: 5
  },
  {
    id: 4,
    name: "Felipe Gomes",
    role: "Criador de Conteúdo",
    image: "https://randomuser.me/api/portraits/men/46.jpg",
    text: "Tinha muito receio de ser banido ou algo do tipo. Estudei a plataforma deles e vi o quão seguro é. Efeito manada ativado no meu perfil, só crescendo agora.",
    rating: 5
  },
  {
    id: 5,
    name: "Luiza Ferreira",
    role: "Trainee Marketing",
    image: "https://randomuser.me/api/portraits/women/22.jpg",
    text: "Indiquei pra vários clientes da agência pra usarmos como impulsionamento inicial nas contas. Custo-benefício de longe o melhor do mercado atual.",
    rating: 5
  }
];

export const ReviewCarousel: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span 
        key={i} 
        className={`material-symbols-outlined text-lg ${i < rating ? 'text-amber-400' : 'text-slate-200'}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
    ));
  };

  return (
    <section className="py-24 bg-slate-50 mx-4 md:mx-8 rounded-[3rem] my-10 overflow-hidden relative">
      {/* Decorative Blob */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <span className="material-symbols-outlined text-[20rem]">format_quote</span>
      </div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-xs font-bold uppercase tracking-widest font-label">Aprovações</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold font-headline text-slate-900 mb-4">
              A Voz de Quem <span className="text-primary">Tem Resultados</span>
            </h2>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={scrollLeft}
              className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-primary transition-all shadow-sm active:scale-95"
              aria-label="Voltar depoimentos"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button 
              onClick={scrollRight}
              className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:text-primary transition-all shadow-sm active:scale-95"
              aria-label="Avançar depoimentos"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef} 
          className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-12 pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-8 px-8"
        >
          {mockReviews.map((review) => (
            <div 
              key={review.id} 
              className="min-w-[85vw] md:min-w-[400px] snap-center bg-white rounded-[2rem] p-8 shadow-[0_12px_32px_rgba(0,0,0,0.03)] border border-slate-100 hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-1">
                  {renderStars(review.rating)}
                </div>
                <span className="material-symbols-outlined text-slate-200 text-5xl rotate-180" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
              </div>
              
              <p className="text-slate-600 text-lg leading-relaxed mb-8 italic">
                "{review.text}"
              </p>
              
              <div className="flex items-center gap-4 mt-auto">
                <img 
                  src={review.image} 
                  alt={review.name} 
                  className="w-14 h-14 rounded-full object-cover shadow-md border-2 border-white"
                />
                <div>
                  <h4 className="font-bold font-headline text-slate-900">{review.name}</h4>
                  <p className="text-sm text-slate-500">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
