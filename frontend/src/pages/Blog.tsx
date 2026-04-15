import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';

export const Blog: React.FC = () => {
  useEffect(() => {
    document.title = 'Blog FastGram | Otimização Estratégica e Growth';
    const tag = document.querySelector('meta[name="description"]');
    if (tag) {
      tag.setAttribute('content', 'Descubra os principais segredos do algoritmo, dicas de engajamento acelerado e alavancagem de autoridade. FastGram Blog Education.');
    }
  }, []);

  return (
    <main className="pt-24 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-on-surface mb-6">
          Nossa Central de <span className="text-primary">Estratégias</span>
        </h1>
        <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
          Crescimento, Autoridade e o Efeito Manada. Descubra como profissionais hackeiam o reconhecimento nas redes sociais.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.map((post) => (
          <Link to={`/blog/${post.slug}`} key={post.id} className="group bg-surface-container-lowest rounded-3xl overflow-hidden border border-surface-variant/20 hover:shadow-xl transition-all hover:-translate-y-1">
            <div className="h-48 overflow-hidden relative">
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-4 left-4 bg-primary/90 text-on-primary text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                Marketing
              </div>
            </div>
            <div className="p-6">
              <p className="text-xs text-on-surface-variant font-medium mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">calendar_month</span>
                {post.date} • {post.readTime}
              </p>
              <h2 className="text-xl font-bold font-headline text-on-surface mb-3 line-clamp-3 group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-on-surface-variant line-clamp-3 mb-6">
                {post.excerpt}
              </p>
              <div className="flex items-center text-primary font-bold text-sm">
                Ler Artigo
                <span className="material-symbols-outlined text-base ml-1 transition-transform group-hover:translate-x-1">arrow_forward</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
};
