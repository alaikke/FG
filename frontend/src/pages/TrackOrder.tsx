import React, { useState } from 'react';

interface OrderData {
  id: string;
  instagramUser: string;
  followersCount: number;
  price: number;
  paymentStatus: string;
  deliveryStatus: string;
  startCount: number | null;
  currentCount: number | null;
  remains: number | null;
  createdAt: string;
}

export const TrackOrder: React.FC = () => {
  const [username, setUsername] = useState('');
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [profilePic, setProfilePic] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = username.trim().toLowerCase();
    if (!cleanEmail) return;

    setLoading(true);
    setError('');
    setSearched(false);

    try {
      const res = await fetch(`http://localhost:3333/api/track/${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Nenhum pedido encontrado.');
        setOrders([]);
      } else {
        setOrders(data.orders);
        setSearched(true);
        // Usar foto do perfil cacheada no primeiro pedido (vem do DB)
        const cachedPic = data.orders.find((o: any) => o.profilePicUrl)?.profilePicUrl;
        setProfilePic(cachedPic || '');
      }
    } catch {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'completed' || s === 'COMPLETED') return { label: 'Concluído', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', icon: 'check_circle' };
    if (s.includes('progress') || s === 'in_progress' || s === 'processing' || s === 'pending') return { label: 'Entregando', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', icon: 'sync' };
    if (s === 'partial') return { label: 'Parcial', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', icon: 'warning' };
    if (s === 'waiting_payment') return { label: 'Aguardando Pagamento', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50', icon: 'hourglass_top' };
    if (s === 'paid' || s === 'PAID') return { label: 'Pago — Processando', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', icon: 'payments' };
    if (s.includes('cancel') || s.includes('refund')) return { label: 'Cancelado', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', icon: 'cancel' };
    return { label: status || 'Desconhecido', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50', icon: 'help' };
  };

  const getProgressPercent = (order: OrderData) => {
    if (!order.startCount || !order.currentCount) {
      if (order.deliveryStatus === 'COMPLETED' || order.deliveryStatus?.toLowerCase() === 'completed') return 100;
      if (order.paymentStatus === 'PENDING') return 0;
      return null; // can't calculate
    }
    const delivered = order.currentCount - order.startCount;
    const total = order.followersCount;
    return Math.min(100, Math.max(0, Math.round((delivered / total) * 100)));
  };

  const formatNumber = (n: number) => n.toLocaleString('pt-BR');

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main className="px-6 max-w-2xl mx-auto space-y-10 py-10">
      {/* Search Section */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-background">Acompanhar Pedido</h2>
          <p className="text-on-surface-variant max-w-sm mx-auto">Insira o e-mail usado na compra para verificar o status em tempo real.</p>
        </div>
        <div className="bg-surface-container-low p-1 rounded-xl">
          <form onSubmit={handleSearch} className="bg-surface-container-lowest p-6 rounded-lg space-y-6">
            <div className="relative">
              <label className="block text-sm font-semibold mb-2 text-on-surface">E-mail</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-surface-container-high border-none rounded-lg py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary/40 transition-all text-on-background placeholder:text-outline outline-none"
                  placeholder="seu@email.com"
                  type="email"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-on-primary font-bold py-4 rounded-full flex items-center justify-center gap-2 shadow-[0px_12px_32px_rgba(36,49,86,0.06)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Consultando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">analytics</span>
                  Consultar Status
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="bg-error-container/30 border border-error/20 text-on-error-container p-4 rounded-2xl flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-error">error</span>
          <p className="font-medium text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {searched && orders.length > 0 && (
        <section className="space-y-6 animate-fade-in">
          {/* Profile Header */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-56 h-56 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-primary/30 p-0.5 flex-shrink-0">
                {profilePic ? (
                  <img
                    className="w-full h-full object-cover rounded-full"
                    src={profilePic}
                    alt={`@${orders[0].instagramUser}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-3xl">person</span>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-xl text-on-background">@{orders[0].instagramUser}</h3>
                </div>
                <p className="text-on-surface-variant text-sm font-medium mt-1">
                  {orders.length} pedido{orders.length > 1 ? 's' : ''} encontrado{orders.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Orders List */}
          {orders.map((order) => {
            const statusCfg = getStatusConfig(order.deliveryStatus);
            const progress = getProgressPercent(order);
            const delivered = order.startCount != null && order.currentCount != null
              ? order.currentCount - order.startCount
              : null;

            return (
              <div key={order.id} className="bg-surface-container-lowest rounded-3xl overflow-hidden relative group">
                <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>

                <div className="relative z-10 p-6 space-y-6">
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-outline uppercase tracking-wider">Pedido #{order.id.substring(0, 8)}</p>
                      <p className="text-on-surface-variant text-xs mt-1">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className={`${statusCfg.bgColor} px-4 py-2 rounded-full inline-flex items-center gap-2`}>
                      <span className={`w-2 h-2 rounded-full ${statusCfg.color} ${statusCfg.label === 'Entregando' ? 'animate-pulse' : ''}`}></span>
                      <span className={`${statusCfg.textColor} text-xs font-bold uppercase tracking-widest`}>{statusCfg.label}</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="bg-surface-container-low p-5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-outline uppercase tracking-wider">Produto</p>
                        <p className="font-bold text-on-background">{formatNumber(order.followersCount)} Inscritos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-outline uppercase tracking-wider">Valor</p>
                      <p className="font-extrabold text-primary text-lg">R$ {order.price.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {progress !== null ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-on-surface">Progresso da Entrega</span>
                        <span className={`text-2xl font-black ${progress > 0 ? 'text-primary' : 'text-amber-500'}`}>{progress}%</span>
                      </div>
                      <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                        {progress > 0 ? (
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full shadow-[0px_0px_12px_rgba(0,83,220,0.3)] transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                          ></div>
                        ) : (
                          <div className="h-full w-full bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      {progress > 0 ? (
                        <div className="flex justify-between text-[10px] font-bold text-outline-variant uppercase tracking-widest">
                          <span>Início: {order.startCount != null ? formatNumber(order.startCount) : '—'}</span>
                          <span>Atual: {order.currentCount != null ? formatNumber(order.currentCount) : '—'}</span>
                          <span>Meta: {order.startCount != null ? formatNumber(order.startCount + order.followersCount) : formatNumber(order.followersCount)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-amber-600">
                          <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                          <span className="text-xs font-bold uppercase tracking-widest">Preparando entrega...</span>
                        </div>
                      )}
                    </div>
                  ) : order.paymentStatus === 'PAID' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-on-surface">Progresso da Entrega</span>
                        <span className="text-sm font-bold text-amber-500">Aguardando</span>
                      </div>
                      <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 rounded-full animate-pulse"></div>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-amber-600">
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        <span className="text-xs font-bold uppercase tracking-widest">Iniciando processamento...</span>
                      </div>
                    </div>
                  )}

                  {/* Delivery Stats (when we have data) */}
                  {delivered !== null && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-surface-container-low p-4 rounded-xl text-center">
                        <p className="text-xs font-bold text-outline uppercase tracking-wider">Agora</p>
                        <p className="font-extrabold text-xl text-on-background mt-1">{order.currentCount != null ? formatNumber(order.currentCount) : '—'}</p>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-xl text-center">
                        <p className="text-xs font-bold text-outline uppercase tracking-wider">Restantes</p>
                        <p className="font-extrabold text-xl text-on-background mt-1">{order.remains != null ? formatNumber(order.remains) : '—'}</p>
                      </div>
                      <div className="bg-surface-container-low p-4 rounded-xl text-center">
                        <p className="text-xs font-bold text-outline uppercase tracking-wider">Total</p>
                        <p className="font-extrabold text-xl text-primary mt-1">{formatNumber(order.followersCount)}</p>
                      </div>
                    </div>
                  )}

                  {/* Payment Status */}
                  {order.paymentStatus === 'PENDING' && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
                      <span className="material-symbols-outlined text-amber-600">hourglass_top</span>
                      <p className="text-sm font-medium text-amber-800">Aguardando confirmação do pagamento PIX.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-tertiary-container/20 rounded-xl p-6 border border-tertiary-container/10">
              <span className="material-symbols-outlined text-tertiary mb-3">speed</span>
              <h5 className="font-bold text-tertiary">Velocidade FastGram</h5>
              <p className="text-sm text-on-tertiary-container leading-relaxed">Sua entrega está sendo processada em servidores de alta prioridade.</p>
            </div>
            <div className="bg-secondary-container/20 rounded-xl p-6 border border-secondary-container/10">
              <span className="material-symbols-outlined text-secondary-dim mb-3">shield</span>
              <h5 className="font-bold text-secondary-dim">Proteção Drop</h5>
              <p className="text-sm text-on-secondary-container leading-relaxed">Garantia de reposição automática ativa para este pedido por 30 dias.</p>
            </div>
            <div className="bg-primary-container/20 rounded-xl p-6 border border-primary-container/10">
              <span className="material-symbols-outlined text-primary mb-3">support_agent</span>
              <h5 className="font-bold text-primary">Suporte 24/7</h5>
              <p className="text-sm text-on-secondary-container leading-relaxed">Dúvidas sobre sua entrega? Nossa equipe está disponível no chat.</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};
