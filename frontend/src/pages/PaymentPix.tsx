import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../config';

export const PaymentPix: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentState = location.state as { 
    orderId?: string; 
    qrCode?: string; 
    qrCodeUrl?: string; 
    package?: { followers: string, subtitle: string, price: string };
  };

  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(14 * 60 + 59);

  // Usa string bruta de PIX, base64 ou mock como fallback puro
  const pixCode = paymentState?.qrCode || '00020101021126580014br.gov.bcb.pix0136e7890abc-1234-5678-90ab-cdef12345678520400005303986540587.005802BR5915FastGram6009Sao Paulo62070503***6304D1B2';
  const rawQrImage = paymentState?.qrCodeUrl || "";
  // PoloPag retorna base64 puro — adicionar prefixo data URI para o browser renderizar
  const qrImage = rawQrImage.startsWith('http') 
    ? rawQrImage 
    : rawQrImage 
      ? `data:image/png;base64,${rawQrImage}` 
      : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling: verifica a cada 3s se o pagamento foi confirmado
  useEffect(() => {
    if (!paymentState?.orderId) return;
    
    const poller = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/${paymentState.orderId}`);
        const data = await res.json();
        if (data.paymentStatus === 'PAID') {
          clearInterval(poller);
          navigate('/success', { state: { orderId: paymentState.orderId, package: paymentState.package } });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(poller);
  }, [paymentState?.orderId, navigate]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressWidth = (timeLeft / (15 * 60)) * 100;

  return (
    <main className="max-w-md mx-auto px-6 py-10 space-y-6">
      <header className="flex items-center mb-8">
        <button onClick={() => navigate(-1)} className="p-2 text-[#2563EB] hover:bg-slate-200/50 transition-colors active:scale-95 duration-200 rounded-full">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="ml-2 font-headline font-bold tracking-tight text-on-surface text-xl">Pagamento PIX</h1>
      </header>

      {/* Order Summary & Timer */}
      <section className="grid grid-cols-1 gap-4">
        <div className="bg-surface-container-low p-6 rounded-3xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-6xl">receipt_long</span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Resumo do Pedido {paymentState?.orderId ? `#${paymentState.orderId.substring(0,8)}` : ''}</p>
          <h2 className="font-headline text-2xl font-extrabold mt-1">{paymentState?.package?.followers || '2.500'} {paymentState?.package?.subtitle || 'Pessoas'}</h2>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-primary font-headline text-3xl font-black">R$ {paymentState?.package?.price || '87,00'}</span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="bg-secondary-container p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-secondary-container">timer</span>
            <span className="font-headline font-bold text-on-secondary-container">
              Expira em {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>
          <div className="h-1.5 w-24 bg-surface/30 rounded-full overflow-hidden">
            <div className="h-full bg-secondary rounded-full" style={{ width: `${progressWidth}%` }}></div>
          </div>
        </div>
      </section>

      <section className="flex flex-col items-center">
        <div className="bg-surface-container-lowest p-4 rounded-3xl shadow-[0px_12px_32px_rgba(36,49,86,0.06)] border border-[#a4b1de]/15 relative">
          <div className="w-72 h-72 bg-surface-container-high rounded-2xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-4 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #243156 1px, transparent 0)', backgroundSize: '8px 8px' }}></div>
            <div className="z-10 bg-white p-2 rounded-xl shadow-sm">
              <img alt="PIX QR Code" className="w-64 h-64 object-contain mix-blend-multiply" src={qrImage} />
            </div>
          </div>
          <div className="mt-4 flex flex-col items-center gap-2">
            <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">Aponte a câmera</span>
          </div>
        </div>
      </section>

      {/* Copy/Paste Section */}
      <section className="space-y-3">
        <div className="bg-surface-container-high p-4 rounded-2xl flex flex-col gap-3">
          <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider ml-1">Código PIX Copia e Cola</label>
          <div className="bg-surface-container-lowest p-4 rounded-xl text-xs font-mono text-on-surface-variant break-all leading-relaxed select-all">
            {pixCode}
          </div>
        </div>
        <button onClick={handleCopy} className={`w-full ${copied ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-secondary'} text-on-primary font-headline font-bold py-4 rounded-full flex items-center justify-center gap-2 shadow-[0px_12px_32px_rgba(0,83,220,0.2)] active:scale-95 transition-all`}>
          <span className="material-symbols-outlined">{copied ? 'check_circle' : 'content_copy'}</span>
          {copied ? 'Código Copiado!' : 'Copiar Código PIX'}
        </button>
      </section>

      {/* Action to advance to next step logic (simulated for dev) */}
      <button onClick={() => navigate('/success')} className="w-full text-center text-primary text-sm font-semibold hover:underline block pt-2">
        (Dev) Simular Pagamento Aprovado
      </button>

      {/* Instructions */}
      <section className="bg-surface-container-low p-6 rounded-3xl space-y-6">
        <h3 className="font-headline font-extrabold text-lg text-on-surface">Como pagar?</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary">1</div>
            <p className="text-sm text-on-surface-variant leading-relaxed pt-1">Abra o app do seu banco e escolha a opção <span className="font-bold text-on-surface">PIX</span>.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary">2</div>
            <p className="text-sm text-on-surface-variant leading-relaxed pt-1">Escolha <span className="font-bold text-on-surface">Ler QR Code</span> ou <span className="font-bold text-on-surface">PIX Copia e Cola</span>.</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary">3</div>
            <p className="text-sm text-on-surface-variant leading-relaxed pt-1">Revise os dados de pagamento da <span className="font-bold text-on-surface">FastGram</span> e confirme a transação.</p>
          </div>
        </div>
      </section>

      <section className="flex justify-center pb-8">
        <div className="flex items-center gap-2 bg-tertiary-container/30 px-4 py-2 rounded-full">
          <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
          <span className="text-xs font-bold text-on-tertiary-container">Pagamento 100% Seguro</span>
        </div>
      </section>
    </main>
  );
};
