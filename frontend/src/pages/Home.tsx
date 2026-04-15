import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const fallbackPackages = [
  { id: '1', followers: '100', subtitle: 'Volume Imediato', price: '9,90', icon: 'person', features: ['Sem senha', 'Entrega Rápida'], tag: null },
  { id: '2', followers: '1.000', subtitle: 'Público Nacional', price: '39,90', icon: 'group', features: ['Reposição 30 dias', 'Perfil Nacional'], tag: null },
  { id: '3', followers: '2.000', subtitle: 'Audiência Premium', price: '69,90', icon: 'person_add', features: ['Alta Qualidade', 'Sem queda'], tag: null },
  { id: '4', followers: '5.000', subtitle: 'Melhor Custo-Benefício', price: '89,90', icon: 'stars', features: ['Entrega Prioritária', 'Suporte VIP 24h'], tag: 'Mais Popular' },
  { id: '5', followers: '10.000', subtitle: 'Autoridade Máxima', price: '169,90', icon: 'rocket_launch', features: ['Bônus Engajamento', 'Sigilo Absoluto'], tag: null },
  { id: '6', followers: '25.000', subtitle: 'Plano Influenciador', price: '349,90', icon: 'diamond', features: ['Combo Engajamento', 'Garantia Vitalícia'], tag: null }
];

export const Home: React.FC = () => {
  const [packages, setPackages] = useState(fallbackPackages);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(''); // Will default to popular
  const [username, setUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundProfile, setFoundProfile] = useState<{name: string, followers: string, avatar: string} | null>(null);
  const navigate = useNavigate();
  
  const selectedPlan = packages.find(p => p.id === selectedPlanId);

  // Fetch products from API
  useEffect(() => {
    fetch('http://localhost:3333/api/products')
      .then(r => r.json())
      .then(data => {
        if (data.products?.length) {
          setPackages(data.products);
          const popular = data.products.find((p: any) => p.tag) || data.products[3] || data.products[0];
          setSelectedPlanId(popular.id);
        } else {
          setSelectedPlanId(fallbackPackages[3].id);
        }
      })
      .catch(() => setSelectedPlanId(fallbackPackages[3].id));
  }, []);

  useEffect(() => {
    if (username.length > 2) {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          let realName = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
          const randomStr = (Math.random() * (50 - 2) + 2).toFixed(1).replace('.', ',');
          let realFollowers = `${randomStr}k`;
          let realAvatar = `https://ui-avatars.com/api/?name=${username}&background=random&color=fff&size=128&bold=true`;

          const apifyToken = import.meta.env.VITE_APIFY_TOKEN;

          if (apifyToken) {
            // Chamada Oficial via Apify API
            const response = await fetch(`https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apifyToken}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ usernames: [username] })
            });
            
            const data = await response.json();
            
            if (data && data.length > 0) {
              const profile = data[0];
              if (profile.fullName) realName = profile.fullName;
              if (profile.followersCount !== undefined) {
                realFollowers = profile.followersCount.toLocaleString('pt-BR');
              }
              if (profile.profilePicUrlHD || profile.profilePicUrl) {
                const rawUrl = profile.profilePicUrlHD || profile.profilePicUrl;
                // Proxy reverso em tempo real para anular a trava "Cross-Origin-Resource-Policy: same-origin" do Instagram!
                realAvatar = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}`;
              }
            }
          }

          setFoundProfile({
            name: realName.trim(),
            followers: realFollowers,
            avatar: realAvatar
          });

        } catch (e) {
          console.error("Falha na chamada da API, ativando fallback resiliente.", e);
          const randomStrFb = (Math.random() * (50 - 2) + 2).toFixed(1).replace('.', ',');
          setFoundProfile({
            name: username.charAt(0).toUpperCase() + username.slice(1).toLowerCase(),
            followers: `${randomStrFb}k`,
            avatar: `https://ui-avatars.com/api/?name=${username}&background=random&color=fff&size=128&bold=true`
          });
        } finally {
          setIsSearching(false);
        }
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setFoundProfile(null);
      setIsSearching(false);
    }
  }, [username]);

  const handleCheckout = () => {
    // Navigate to checkout passing the selected plan, username and foundProfile
    navigate('/checkout', { state: { package: selectedPlan, username, foundProfile } });
  };

  return (
    <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="z-10">
            <div className="inline-flex items-center gap-2 bg-secondary-container px-4 py-2 rounded-full mb-6">
              <span className="material-symbols-outlined text-on-secondary-container text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              <span className="text-on-secondary-container text-sm font-semibold tracking-wide">LÍDER EM CRESCIMENTO SOCIAL</span>
            </div>
            <h1 className="font-headline text-5xl md:text-7xl font-extrabold tracking-tight text-on-background leading-tight mb-6">
              Impulsione seu <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Instagram</span> hoje.
            </h1>
            <p className="text-lg text-on-surface-variant max-w-xl mb-10 leading-relaxed">
              Aumente sua autoridade e alcance com alta aprovação pública e entrega imediata. A solução mais segura e rápida para alavancar seu perfil profissional.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">security</span>
                <span className="text-sm font-medium">Entrega Segura</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">bolt</span>
                <span className="text-sm font-medium">Início Imediato</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">support_agent</span>
                <span className="text-sm font-medium">Suporte 24/7</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform lg:rotate-3 hover:rotate-0 transition-transform duration-700">
              <img alt="Jovem influenciador feliz e sorridente segurando um smartphone" className="w-full h-[450px] object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkqlFzKGpCNHFXdC24CcGM8szS2IxUNGJRmDq45buHGSr_Ts6n1lzFyCQcm_4aUczczIbxZOQi0TuCV4PqRHtlv6F9WKpqugeqkrlIwxvL1UC-koORt3QMHYF7RvMnslpdYmN-GzYopTL2INSOslIYgScyLpXwEPAaoVYDpfQaBGZGr8nhX7By_CgTJvoDgQLSrolWfRUhogyPrJ4afXcYf3jaxa3TetqqZFNFqkSZL9TnkzoRvlKlYe73GlX4tppa9eKDNGA9DBgk" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 w-full border border-white/20">
                  <div className="flex justify-between items-center text-white">
                    <div>
                      <p className="text-xs uppercase tracking-widest opacity-80">Nova Audiência</p>
                      <p className="text-2xl font-bold">+12,480</p>
                    </div>
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>trending_up</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content: Package Selector */}
      <section className="bg-surface-container-low py-24 px-6" id="packages">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">Escolha seu pacote de impacto</h2>
            <p className="text-on-surface-variant">Clique no plano desejado para iniciar sua jornada.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {packages.map((pkg) => {
              const isSelected = pkg.id === selectedPlanId;
              return (
                <div 
                  key={pkg.id}
                  onClick={() => setSelectedPlanId(pkg.id)}
                  className={`package-card group relative bg-surface-container-lowest p-8 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer flex flex-col items-center text-center ${isSelected ? 'border-primary shadow-2xl -translate-y-1' : 'border-transparent hover:border-primary/20'}`}
                >
                  {pkg.tag && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg z-10 whitespace-nowrap">
                      {pkg.tag}
                    </div>
                  )}
                  
                  <div className={`check-badge ${isSelected ? 'flex' : 'hidden'} absolute top-6 right-6 w-8 h-8 rounded-full bg-primary items-center justify-center text-white`}>
                    <span className="material-symbols-outlined text-lg">check</span>
                  </div>
                  
                  <div className={`icon-container w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-colors ${isSelected ? 'bg-gradient-to-br from-primary to-secondary text-white' : 'bg-primary/5 text-primary'}`}>
                    <span className={`material-symbols-outlined text-3xl ${isSelected && pkg.tag ? 'text-white' : ''}`} style={isSelected ? { fontVariationSettings: "'FILL' 1" } : {}}>{pkg.icon}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-2">{pkg.followers}</h3>
                  <p className="text-slate-500 mb-6 uppercase text-xs tracking-widest font-bold">{pkg.subtitle}</p>
                  <div className="text-4xl font-black mb-6">R$ {pkg.price.split(',')[0]}<span className="text-lg font-medium">,{pkg.price.split(',')[1]}</span></div>
                  
                  <ul className="space-y-3 text-sm text-on-surface-variant w-full">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 justify-center">
                        <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> 
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="max-w-2xl mx-auto bg-white border-2 border-primary/10 p-8 rounded-[2.5rem] shadow-xl shadow-primary/5">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">shopping_cart</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Plano Selecionado</p>
                    <p className="text-lg font-black text-primary">{selectedPlan?.followers} Pessoas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Total</p>
                  <p className="text-xl font-black text-on-background">R$ {selectedPlan?.price}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-3 uppercase tracking-wider">Qual o seu @Instagram?</label>
                <div className="relative group">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-bold text-xl">@</span>
                  <input 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace('@', ''))}
                    className="w-full pl-12 pr-6 py-5 bg-surface-container-low rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all outline-none text-on-background font-medium placeholder:text-slate-400 text-lg shadow-inner" 
                    placeholder="nomedeusuario" 
                    required 
                    type="text" 
                  />
                  {isSearching && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {foundProfile && !isSearching && (
                  <div className="mt-4 bg-surface-container-lowest rounded-2xl p-4 flex items-center justify-between border border-primary/20 shadow-lg shadow-primary/5 animate-fade-in">
                    <div className="flex items-center gap-4">
                      <img src={foundProfile.avatar} alt="Profile" referrerPolicy="no-referrer" className="w-12 h-12 rounded-full border-2 border-surface-variant object-cover" />
                      <div>
                        <p className="font-bold text-on-background text-sm leading-tight">@{username.toLowerCase()}</p>
                        <p className="text-xs text-on-surface-variant font-medium mt-0.5">{foundProfile.name}</p>
                      </div>
                    </div>
                    <div className="text-right bg-surface-container-low px-3 py-1.5 rounded-xl">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-extrabold mb-0.5">Público</p>
                      <p className="font-bold text-primary text-sm leading-none">{foundProfile.followers}</p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-500 mt-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  Sua conta deve estar em modo **Público**. Nunca pedimos sua senha.
                </p>
              </div>

              <button onClick={handleCheckout} className="w-full py-5 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white text-lg font-black shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 active:scale-95">
                Finalizar Pedido Agora
              </button>

              <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    <img alt="User 1" className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8J57WS-DDZRGCvEFegKxlgX3fFEZhcvg7cIt2M1c6z35qNKFnvAJ_YTJvYNRhtagAeuDTTbcT_kTZq3zRi-UspNDcypdc9P9dp85YVKowE3rHdCDbQcy3jvMKaCbxiveTg8yhErMp1o-eiNcQVSAWqmiMi_kruC4OFblWKVEiJ5TGP-diSQWTiegrnLtGTYeXKTBkI9GrKefUqwWkbSW5jjzAwQQ4sEh2AxuWt8-MBDxLc7B7SooLdPg-sz-agSXtrUugnOzyF4Qn" />
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-tertiary-container flex items-center justify-center text-[8px] font-bold text-on-tertiary-container">+50k</div>
                  </div>
                  <span className="text-xs font-semibold">Clientes satisfeitos</span>
                </div>
                <div className="flex items-center gap-2 text-primary/70">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Pagamento Criptografado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="text-center md:text-left">
              <span className="material-symbols-outlined text-4xl text-primary mb-4">shield</span>
              <h4 className="font-bold text-lg mb-2">100% Seguro</h4>
              <p className="text-sm text-slate-500 leading-relaxed">Métodos orgânicos que respeitam os termos do Instagram.</p>
            </div>
            <div className="text-center md:text-left">
              <span className="material-symbols-outlined text-4xl text-primary mb-4">bolt</span>
              <h4 className="font-bold text-lg mb-2">Início em Minutos</h4>
              <p className="text-sm text-slate-500 leading-relaxed">O sistema processa seu pedido automaticamente após o pagamento.</p>
            </div>
            <div className="text-center md:text-left">
              <span className="material-symbols-outlined text-4xl text-primary mb-4">published_with_changes</span>
              <h4 className="font-bold text-lg mb-2">Reposição Grátis</h4>
              <p className="text-sm text-slate-500 leading-relaxed">Garantia de 30 dias para repor qualquer queda de volume.</p>
            </div>
            <div className="text-center md:text-left">
              <span className="material-symbols-outlined text-4xl text-primary mb-4">contact_support</span>
              <h4 className="font-bold text-lg mb-2">Atendimento Humano</h4>
              <p className="text-sm text-slate-500 leading-relaxed">Nossa equipe brasileira está pronta para te ajudar via WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
