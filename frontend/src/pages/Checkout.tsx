import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { API_BASE } from '../config';

const stripePromise = loadStripe('pk_live_51TLx34LHQ2vDRNS385gwTBunqLPyWwN8cSBy42XbJFMYirFPy05a6FSleZ73zPjCajoPxmwhAJtKPnq07Ty9Eo9b00Ct7UbMCV');

const CheckoutInner: React.FC<{ checkoutState: any, orderId: string }> = ({ checkoutState, orderId }) => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'pix' | 'crypto'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isProcessing) return;
    setIsProcessing(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      document: formData.get('document') || "00000000000",
    };

    try {
      if (paymentMethod === 'stripe') {
        if (!stripe || !elements) {
          setIsProcessing(false);
          return;
        }

        // 1. Update order with client details
        await fetch(`${API_BASE}/api/orders/${orderId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        // 2. Confirm Payment via Stripe
        const { error } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/success`,
            receipt_email: data.email as string,
          },
        });

        if (error) {
          alert(error.message);
          setIsProcessing(false);
        }
        // If successful, Stripe automatically redirects to return_url
      } else if (paymentMethod === 'pix') {
        // PIX FLOW
        const pixData = {
          ...data,
          username: checkoutState?.username,
          followersCount: parseInt((checkoutState?.package?.followers || '2500').replace('.', '')),
          price: parseFloat((checkoutState?.package?.price || '87.00').replace(',', '.')),
          profilePicUrl: checkoutState?.foundProfile?.avatar || null,
          currentFollowers: checkoutState?.foundProfile?.followers || null,
        };

        const response = await fetch(`${API_BASE}/api/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pixData)
        });

        const result = await response.json();
        if (response.ok) {
          navigate('/payment/pix', { 
            state: { 
              orderId: result.orderId, 
              qrCode: result.qrCode, 
              qrCodeUrl: result.qrCodeUrl,
              package: checkoutState?.package
            } 
          });
        } else {
          alert(result.error);
        }
        setIsProcessing(false);
      } else {
         // Cripto FLOW
         alert("Pagamento via Criptomoedas estará disponível em breve!");
         setIsProcessing(false);
      }
    } catch (err: any) {
      console.error(err);
      alert("Erro ao processar pagamento.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-8">
      {/* Information Form */}
      <section className="space-y-4">
        <h2 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">Dados Pessoais</h2>
        <div className="bg-surface-container-lowest rounded-3xl p-6 space-y-4 shadow-[0px_12px_32px_rgba(36,49,86,0.06)]">
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface-variant ml-1">Nome completo</label>
            <input name="name" required className="w-full bg-surface-container-high border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/40 font-medium placeholder:text-outline text-on-surface outline-none" placeholder="Seu nome completo" type="text" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">E-mail</label>
              <input name="email" required className="w-full bg-surface-container-high border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/40 font-medium placeholder:text-outline text-on-surface outline-none" placeholder="exemplo@email.com" type="email" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">WhatsApp / Telefone</label>
              <input name="phone" required className="w-full bg-surface-container-high border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/40 font-medium placeholder:text-outline text-on-surface outline-none" placeholder="(00) 00000-0000" type="tel" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-on-surface-variant ml-1">CPF (Obrigatório para PIX)</label>
              <input name="document" required={paymentMethod === 'pix'} className="w-full bg-surface-container-high border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/40 font-medium placeholder:text-outline text-on-surface outline-none" placeholder="000.000.000-00" type="text" />
            </div>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-extrabold text-2xl tracking-tight text-on-surface">Pagamento</h2>
          <span className="bg-secondary-container text-on-secondary-container text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Criptografado</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button type="button" onClick={() => setPaymentMethod('pix')} className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-colors duration-200 ${paymentMethod === 'pix' ? 'bg-surface-container-high border-primary/20 text-primary' : 'bg-surface-container-lowest border-transparent text-on-surface-variant hover:bg-surface-container-high'}`}>
            <span className="material-symbols-outlined mb-1 text-2xl">qr_code_2</span>
            <span className="text-[11px] font-bold">PIX</span>
            {paymentMethod === 'pix' && <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-on-primary"><span className="material-symbols-outlined text-[10px] font-bold">check</span></span>}
          </button>

          <button type="button" onClick={() => setPaymentMethod('stripe')} className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-colors duration-200 ${paymentMethod === 'stripe' ? 'bg-surface-container-high border-primary/20 text-primary' : 'bg-surface-container-lowest border-transparent text-on-surface-variant hover:bg-surface-container-high'}`}>
            <div className="flex items-center gap-1 mb-1">
              <span className="material-symbols-outlined text-lg">credit_card</span>
              <span className="material-symbols-outlined text-lg">devices</span>
            </div>
            <span className="text-[10px] font-bold text-center leading-tight">Cartão, Apple,<br/>GPay</span>
            {paymentMethod === 'stripe' && <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-on-primary"><span className="material-symbols-outlined text-[10px] font-bold">check</span></span>}
          </button>
          
          <button type="button" onClick={() => setPaymentMethod('crypto')} className={`relative overflow-hidden flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-colors duration-200 ${paymentMethod === 'crypto' ? 'bg-surface-container-high border-primary/20 text-primary' : 'bg-surface-container-lowest border-transparent text-on-surface-variant hover:bg-surface-container-high'}`}>
            <span className="material-symbols-outlined mb-1 text-2xl">currency_bitcoin</span>
            <span className="text-[11px] font-bold">Cripto</span>
            <span className="absolute top-0 right-0 bg-yellow-500 text-yellow-950 text-[8px] font-black px-1.5 py-[2px] rounded-bl-lg tracking-wider">EM BREVE</span>
            {paymentMethod === 'crypto' && <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-on-primary"><span className="material-symbols-outlined text-[10px] font-bold">check</span></span>}
          </button>
        </div>

        {/* Stripe Elements */}
        {paymentMethod === 'stripe' ? (
          <div className="bg-surface-container-lowest rounded-3xl p-6 space-y-6 shadow-[0px_12px_32px_rgba(36,49,86,0.06)] animate-fade-in">
             <PaymentElement options={{ 
               layout: 'tabs',
               paymentMethodOrder: ['card', 'apple_pay', 'google_pay']
              }} />
          </div>
        ) : paymentMethod === 'pix' ? (
          <div className="bg-[#E8F3FF] border-2 border-primary/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in relative overflow-hidden">
            <img src="/logo-pix.png" alt="PIX Logo" className="h-12 object-contain mix-blend-multiply opacity-80 mb-2" />
            <div>
              <h3 className="font-headline font-extrabold text-on-surface text-lg mb-1">Aprovação Imediata</h3>
              <p className="text-sm font-medium text-on-surface-variant">O pagamento via PIX é identificado em segundos e sua audiência começa a cair em seguida.</p>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <span className="material-symbols-outlined text-outline text-5xl">rocket</span>
            <div>
              <h3 className="font-headline font-extrabold text-on-surface text-lg mb-1">Em Desenvolvimento</h3>
              <p className="text-sm font-medium text-on-surface-variant">Estamos integrando USDT/USDC e outras criptos para transações anônimas e seguras. Fique ligado!</p>
            </div>
          </div>
        )}
      </section>

      {/* Trust Banner */}
      <div className="relative p-8 rounded-3xl bg-tertiary-container overflow-hidden group">
        <div className="relative z-10 space-y-2 max-w-[70%]">
          <h4 className="font-headline font-extrabold text-on-tertiary-container text-lg">Pagamento 100% Seguro</h4>
          <p className="text-on-tertiary-container/80 text-sm leading-relaxed">Sua transação é protegida diretamente pelo Stripe, com criptografia de ponta a ponta e PCI DSS.</p>
          <div className="flex gap-4 pt-2">
            <span className="material-symbols-outlined text-on-tertiary-container text-3xl">verified_user</span>
            <span className="material-symbols-outlined text-on-tertiary-container text-3xl">security</span>
          </div>
        </div>
        <div className="absolute -right-4 -bottom-4 w-40 h-40 bg-on-tertiary-container/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
        <span className="material-symbols-outlined absolute top-4 right-6 text-on-tertiary-container/20 text-7xl">shield</span>
      </div>

      {/* Submit Button */}
      <div className="space-y-4 pt-4">
        <button disabled={isProcessing || !stripe} type="submit" className={`w-full h-16 ${isProcessing || !stripe ? 'bg-surface-variant text-on-surface-variant' : 'bg-gradient-to-r from-primary to-secondary text-on-primary'} rounded-full font-headline font-extrabold text-lg shadow-[0px_12px_32px_rgba(0,83,220,0.2)] active:scale-95 transition-transform duration-200 flex items-center justify-center gap-2`}>
          {isProcessing ? 'Processando Pagamento...' : 'Confirmar e Pagar'}
          {!isProcessing && <span className="material-symbols-outlined">arrow_forward</span>}
        </button>
        <p className="text-center text-xs text-on-surface-variant px-8">
          Ao finalizar a compra, você concorda com nossos <a className="text-primary font-bold" href="#">Termos de Serviço</a> e <a className="text-primary font-bold" href="#">Política de Privacidade</a>.
        </p>
      </div>
    </form>
  );
};

export const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutState = location.state as any;

  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');

  useEffect(() => {
    if (!checkoutState?.package) return;

    fetch(`${API_BASE}/api/stripe/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: checkoutState?.username || 'username',
        followersCount: parseInt((checkoutState?.package?.followers || '2500').replace('.', '')),
        price: parseFloat((checkoutState?.package?.price || '87.00').replace(',', '.')),
        profilePicUrl: checkoutState?.foundProfile?.avatar || null,
        currentFollowers: checkoutState?.foundProfile?.followers || null,
      })
    })
    .then(r => r.json())
    .then(d => {
      if (d.clientSecret) {
        setClientSecret(d.clientSecret);
        setOrderId(d.orderId);
      }
    });
  }, [checkoutState]);

  return (
    <main className="px-6 max-w-2xl mx-auto space-y-8 py-10">
      <header className="flex items-center justify-between mb-8">
        <button type="button" onClick={() => navigate(-1)} className="text-blue-600 active:scale-95 transition-transform duration-200 flex items-center justify-center p-2 rounded-full hover:bg-blue-50/50">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-headline font-bold tracking-tight text-on-surface text-lg">Checkout Premium</h1>
        <div className="text-blue-600 flex items-center justify-center p-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>lock_person</span>
        </div>
      </header>

      {/* Order Summary & Profile */}
      <section className="space-y-4">
        <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0px_12px_32px_rgba(36,49,86,0.04)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
            </div>
            <div>
              <h3 className="font-headline font-bold text-on-surface">{checkoutState?.package?.followers || '2.500'} {checkoutState?.package?.subtitle || 'Público Premium'}</h3>
              <p className="text-on-surface-variant text-sm font-medium">FastGram Premium Tier</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-primary font-headline font-extrabold text-xl">R$ {checkoutState?.package?.price || '87,00'}</span>
          </div>
        </div>
        
        {checkoutState?.foundProfile ? (
          <div className="bg-surface-container-low rounded-2xl px-4 py-4 flex items-center justify-between border border-primary/10">
            <div className="flex items-center gap-4">
              <img src={checkoutState.foundProfile.avatar} referrerPolicy="no-referrer" alt="Profile" className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
              <div>
                <p className="font-bold text-on-background text-sm leading-tight">@{checkoutState.username?.toLowerCase()}</p>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">{checkoutState.foundProfile.name}</p>
              </div>
            </div>
            <div className="text-right flex items-center gap-4">
              <div className="bg-surface-container-lowest px-3 py-1.5 rounded-xl hidden sm:block">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-extrabold mb-0.5">Público</p>
                <p className="font-bold text-primary text-sm leading-none">{checkoutState.foundProfile.followers}</p>
              </div>
              <button onClick={() => navigate(-1)} type="button" className="text-primary text-sm font-bold hover:underline outline-none">Alterar</button>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-secondary-container">person</span>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">Perfil Destino</p>
                <p className="font-headline font-bold text-on-surface">@{checkoutState?.username || 'username'}</p>
              </div>
            </div>
            <button onClick={() => navigate(-1)} type="button" className="text-primary text-sm font-bold hover:underline outline-none">Alterar</button>
          </div>
        )}
      </section>

      {/* Only load Elements when we have the client_secret from backend */}
      {clientSecret ? (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
          <CheckoutInner checkoutState={checkoutState} orderId={orderId} />
        </Elements>
      ) : (
        <div className="py-20 flex flex-col items-center justify-center gap-4 text-primary">
          <span className="material-symbols-outlined animate-spin text-4xl">autorenew</span>
          <p className="font-bold">Gerando sessão segura...</p>
        </div>
      )}
    </main>
  );
};
