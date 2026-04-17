import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';

export const BlogCarousel: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const posts = blogPosts.slice(0, 9); // Mostrar até 9 matérias como solicitado

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 max-w-7xl mx-auto px-8 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-extrabold font-headline text-slate-900 mb-4">
            Últimas do <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Blog</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            Tudo o que você precisa saber sobre o algoritmo, estratégias de crescimento e engajamento.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={scrollLeft}
            className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-primary transition-all shadow-sm active:scale-95"
            aria-label="Voltar posts"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button 
            onClick={scrollRight}
            className="w-12 h-12 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-primary transition-all shadow-sm active:scale-95"
            aria-label="Avançar posts"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef} 
        className="flex gap-8 overflow-x-auto snap-x snap-mandatory pb-8 pt-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-8 px-8"
      >
        {posts.map((post) => (
          <Link 
            to={`/blog/${post.slug}`} 
            key={post.id} 
            className="min-w-[85vw] md:min-w-[calc(33.333%-22px)] lg:min-w-[calc(33.333%-22px)] snap-start group bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 flex flex-col"
          >
            <div className="h-56 overflow-hidden relative">
              <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors z-10 w-full h-full"></div>
              <img 
                src={post.coverImage} 
                alt={post.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="absolute top-4 left-4 bg-white/95 text-primary text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-md z-20 shadow-sm">
                Atualidade
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <p className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">schedule</span>
                {post.readTime}
              </p>
              <h3 className="text-xl font-bold font-headline text-slate-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                {post.title}
              </h3>
              <p className="text-sm text-slate-600 line-clamp-3 mb-6 flex-1">
                {post.excerpt}
              </p>
              <div className="flex items-center text-primary font-bold text-sm mt-auto">
                Ler Artigo
                <span className="material-symbols-outlined text-base ml-1 group-hover:translate-x-2 transition-transform">arrow_right_alt</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};
