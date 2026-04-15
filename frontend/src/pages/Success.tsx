import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { API_BASE } from '../config';

interface SuccessState {
  orderId?: string;
  package?: { followers: string; subtitle: string; price: string };
}

export const Success: React.FC = () => {
  const location = useLocation();
  const state = location.state as SuccessState | null;
  const searchParams = new URLSearchParams(location.search);
  const paramOrderId = searchParams.get('order_id');
  
  const finalOrderId = state?.orderId || paramOrderId;
  const [orderData, setOrderData] = useState<any>(null);
  const [pixelFired, setPixelFired] = useState(false);

  useEffect(() => {
    if (!finalOrderId) return;
    fetch(`${API_BASE}/api/orders/${finalOrderId}`)
      .then(res => res.json())
      .then(data => setOrderData(data))
      .catch(() => {});
  }, [finalOrderId]);

  useEffect(() => {
    if (orderData && !pixelFired) {
      if (typeof window !== 'undefined') {
        const priceVal = Number(orderData.price || 0);
        
        // Meta Pixel Purchase Event
        if ((window as any).fbq) {
          (window as any).fbq('track', 'Purchase', {
            value: priceVal,
            currency: 'BRL',
            content_name: `${orderData.followersCount} Seguidores`,
            content_type: 'product',
            order_id: finalOrderId
          });
        }
        
        // Google Ads Purchase Event (GTAG)
        if ((window as any).gtag) {
          (window as any).gtag('event', 'purchase', {
            transaction_id: finalOrderId,
            value: priceVal,
            currency: 'BRL',
            items: [{
              item_name: `${orderData.followersCount} Seguidores`,
              price: priceVal,
              quantity: 1
            }]
          });
        }
      }
      setPixelFired(true);
    }
  }, [orderData, pixelFired, finalOrderId]);

  const followers = orderData?.followersCount
    ? Number(orderData.followersCount).toLocaleString('pt-BR')
    : state?.package?.followers || '—';
  const username = orderData?.instagramUser || '—';
  const displayOrderId = finalOrderId ? finalOrderId.substring(0, 8).toUpperCase() : '—';
  const price = orderData?.price
    ? `R$ ${Number(orderData.price).toFixed(2).replace('.', ',')}`
    : state?.package?.price
      ? `R$ ${state.package.price}`
      : '';
  const profilePic = orderData?.profilePicUrl || null;
  const currentFollowers = orderData?.currentFollowers || null;

  return (
    <main className="flex-grow flex items-center justify-center px-4 pt-12 pb-12 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[80px]"></div>
        <div className="absolute top-1/2 -right-48 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-tertiary-container/20 rounded-full blur-[80px]"></div>
      </div>

      <div className="max-w-2xl w-full">
        <div className="bg-surface-container-lowest rounded-[2.5rem] p-8 md:p-14 text-center shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] relative overflow-hidden border border-white/50">
          
          <div className="relative mb-10 flex justify-center">
            <div className="relative">
              <div className="w-28 h-28 bg-gradient-to-tr from-primary to-secondary rounded-full flex items-center justify-center relative z-10 shadow-xl shadow-primary/20">
                <span className="material-symbols-outlined text-white text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <div className="absolute -top-4 -right-4 bg-white p-2.5 rounded-2xl shadow-lg z-20 animate-bounce">
                <span className="material-symbols-outlined text-secondary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <div className="absolute -bottom-2 -left-4 bg-white p-2 rounded-2xl shadow-lg z-20">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
              </div>
            </div>
          </div>

          <h1 className="font-headline font-black text-4xl md:text-5xl tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-br from-on-surface via-primary to-secondary">
            Pedido Realizado com Sucesso!
          </h1>
          <p className="text-on-surface-variant text-lg max-w-md mx-auto mb-10 font-medium">
            Prepare-se para crescer. Sua jornada começou e você notará os resultados em breve.
          </p>

          {/* Order Card with Profile */}
          <div className="bg-surface-container-low rounded-3xl p-6 mb-8 text-left border border-outline-variant/10 relative group">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Profile Avatar */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-surface-container-high flex items-center justify-center shadow-inner shrink-0">
                {profilePic ? (
                  <img src={profilePic} alt={username} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
                )}
              </div>

              <div className="flex-grow text-center sm:text-left">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary/70 mb-1">Confirmação de Item</p>
                <h2 className="text-2xl font-headline font-extrabold text-on-surface leading-none mb-2">{followers} Inscritos</h2>
                <div className="flex items-center gap-3 justify-center sm:justify-start flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-highest rounded-lg text-on-surface-variant">
                    <span className="material-symbols-outlined text-base">alternate_email</span>
                    <span className="font-bold text-sm">{username}</span>
                  </div>
                  {currentFollowers && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-lg text-primary">
                      <span className="material-symbols-outlined text-base">groups</span>
                      <span className="font-bold text-sm">{currentFollowers} alcance inicial</span>
                    </div>
                  )}
                </div>
              </div>

              {price && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-outline mb-1">Valor Pago</p>
                  <p className="text-2xl font-headline font-black text-primary">{price}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-outline-variant/5 flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant/60 uppercase tracking-widest">Pedido #{displayOrderId}</span>
              <div className="flex items-center gap-2 px-4 py-1.5 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                </span>
                Status: Em Fila de Entrega
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-2xl p-5 mb-10 flex gap-4 text-left border border-primary/10">
            <span className="material-symbols-outlined text-primary shrink-0">lightbulb</span>
            <p className="text-on-surface-variant text-sm leading-snug">
              <strong>Dica:</strong> Mantenha seu perfil <span className="text-primary font-bold">público</span> até a conclusão total para garantir a entrega de toda a sua nova audiência.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Link to="/track" className="w-full py-5 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-extrabold shadow-[0_12px_24px_-8px_rgba(0,83,220,0.4)] hover:shadow-[0_16px_32px_-8px_rgba(0,83,220,0.5)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 text-lg">
              <span className="material-symbols-outlined">analytics</span>
              Acompanhar Pedido
            </Link>
            <Link to="/" className="w-full py-5 bg-surface-container-high text-on-surface font-bold rounded-2xl hover:bg-surface-container-highest active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">home_app_logo</span>
              Voltar ao Início
            </Link>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 mt-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Pagamento Seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">lock</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">100% Privado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">bolt</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Entrega Turbo</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
