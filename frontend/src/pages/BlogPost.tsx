import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';

export const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);

  useEffect(() => {
    if (post) {
      document.title = `${post.title} | FastGram Blog`;
      const tag = document.querySelector('meta[name="description"]');
      if (tag) tag.setAttribute('content', post.excerpt);
    }
  }, [post]);

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <main className="pt-24 pb-20 px-6 max-w-4xl mx-auto min-h-screen">
      <article className="bg-surface-container-lowest rounded-[3rem] p-8 md:p-16 shadow-2xl border border-surface-variant/20">
        
        <Link to="/blog" className="inline-flex items-center text-primary font-bold hover:underline mb-8">
          <span className="material-symbols-outlined text-sm mr-2">arrow_back</span>
          Voltar para o Blog
        </Link>

        <div className="mb-10 text-center">
          <p className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Estratégia de Marketing</p>
          <h1 className="text-3xl md:text-5xl font-extrabold font-headline text-on-surface leading-tight mb-6">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-on-surface-variant font-medium">
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">person</span> {post.author}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">calendar_month</span> {post.date}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base">schedule</span> {post.readTime}</span>
          </div>
        </div>

        <div className="w-full h-[300px] md:h-[400px] rounded-3xl overflow-hidden mb-12 shadow-inner">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>

        {/* Prose Content */}
        <div 
          className="prose prose-xl md:prose-2xl prose-slate max-w-none 
                    prose-h2:font-headline prose-h2:font-extrabold prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:text-on-surface prose-h2:tracking-tight
                    prose-p:text-on-surface-variant prose-p:leading-[1.8] md:prose-p:leading-loose prose-p:mb-8 md:prose-p:text-xl prose-p:font-medium
                    prose-strong:text-on-surface prose-strong:font-extrabold prose-strong:bg-primary/5 prose-strong:px-1 prose-strong:rounded
                    prose-em:text-primary prose-em:font-bold prose-em:not-italic
                    prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-2xl prose-blockquote:text-on-surface-variant prose-blockquote:font-medium prose-blockquote:my-10"
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />

        {/* CTA Banner Fim de Artigo */}
        <div className="mt-16 bg-primary/10 rounded-3xl p-8 md:p-12 text-center border border-primary/20">
          <h3 className="text-2xl font-bold font-headline text-on-surface mb-4">Pronto para ativar o seu Crescimento Acelerado?</h3>
          <p className="text-on-surface-variant mb-8 max-w-xl mx-auto">
            Não espere o algoritmo decidir o seu futuro. Ative pacotes de audiência testados e aprovados e atinja a autoridade corporativa no Instagram de forma segura em 24h.
          </p>
          <Link to="/precos" className="inline-block bg-primary text-on-primary font-bold px-8 py-4 rounded-full hover:bg-primary/90 transition-colors shadow-lg hover:outline-none hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-surface-container-lowest">
            Ver Pacotes de Autoridade
          </Link>
        </div>

      </article>
    </main>
  );
};
