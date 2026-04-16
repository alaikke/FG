import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { API_BASE } from '../config';

const API = API_BASE;

// ─── Helper ───
const authFetch = (url: string, opts: any = {}) => {
  const token = localStorage.getItem('fg_admin_token') || '';
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(opts.headers || {}) }
  });
};

// ─── LOGIN ───
const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch(`${API}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('fg_admin_token', data.token);
      onLogin();
    } else {
      setError(data.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black">
      <form onSubmit={handleLogin} className="bg-white/[0.02] backdrop-blur-2xl p-10 rounded-3xl shadow-2xl w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">⚡ FastGram</h1>
          <p className="text-slate-400 text-sm mt-1">Painel Administrativo</p>
        </div>
        <div className="space-y-4">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="E-mail de acesso"
            required
            className="w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Senha secreta"
            required
            className="w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        {error && <p className="text-red-400 text-sm text-center font-bold">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
};

// ─── ORDERS TAB ───
const OrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState(false);

  const load = () => {
    authFetch(`${API}/api/admin/orders`).then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false); });
  };
  
  useEffect(() => { load(); }, []);

  const handleRetry = async (orderId: string) => {
    if (!confirm('Deseja disparar manualmente este pedido novamente no fornecedor? (Custo será gerado se processado)')) return;
    setRetrying(orderId);
    try {
      const res = await authFetch(`${API}/api/admin/orders/${orderId}/retry`, { 
        method: 'POST',
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert('Falha ao reenviar: ' + (data.error || 'Erro desconhecido'));
      } else {
        alert('Reenviado com sucesso! SMM ID: ' + data.order.providerOrderId);
        setSelectedOrder({ ...selectedOrder, ...data.order });
      }
      load();
    } catch {
      alert('Erro inesperado no servidor.');
    } finally {
      setRetrying(null);
    }
  };

  const saveNotes = async () => {
    if (!selectedOrder) return;
    setSavingNotes(true);
    try {
      const res = await authFetch(`${API}/api/admin/orders/${selectedOrder.id}/notes`, { 
        method: 'PUT',
        body: JSON.stringify({ notes: adminNotes })
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedOrder({ ...selectedOrder, adminNotes: data.adminNotes });
        load();
        alert('Anotação salva com sucesso!');
      } else {
        alert('Erro ao salvar nota: ' + (data.error || 'Falha na requisição'));
      }
    } catch (e) {
      alert('Erro inesperado ao salvar nota');
    }
    setSavingNotes(false);
  };

  const openOrder = (o: any) => {
    setSelectedOrder(o);
    setAdminNotes(o.adminNotes || '');
  };

  const statusColor: Record<string, string> = {
    PAID: 'bg-green-500/20 text-green-400', PENDING: 'bg-amber-500/20 text-amber-400',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400', COMPLETED: 'bg-emerald-500/20 text-emerald-400',
    WAITING_PAYMENT: 'bg-slate-500/20 text-slate-400', ERROR: 'bg-red-500/20 text-red-500', CANCELLED: 'bg-red-500/20 text-red-500'
  };

  if (loading) return <div className="text-center text-slate-400 py-20">Carregando pedidos...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Pedidos ({orders.length})</h2>
      </div>
      <div className="overflow-x-auto rounded-3xl hover:border-white/10 transition-colors border border-white/5">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] backdrop-blur-xl shadow-2xl">
            <tr className="text-slate-400 text-left text-xs uppercase tracking-wider">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Instagram</th>
              <th className="px-4 py-3">Pacote</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3">Entrega</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-white/[0.02] backdrop-blur-xl shadow-2xl transition-colors">
                <td className="px-4 py-3 font-mono text-slate-300 text-xs">
                  {o.id.substring(0, 8)}
                </td>
                <td className="px-4 py-3">
                  <p className="text-white font-medium text-xs">{o.clientName}</p>
                  <p className="text-slate-500 text-xs">{o.clientEmail}</p>
                </td>
                <td className="px-4 py-3 text-blue-400 font-medium text-xs">@{o.instagramUser}</td>
                <td className="px-4 py-3 text-white text-xs">{o.followersCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-emerald-400 font-bold text-xs">R$ {o.price.toFixed(2).replace('.', ',')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusColor[o.paymentStatus] || 'bg-slate-700 text-slate-300'}`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusColor[o.deliveryStatus] || 'bg-slate-700 text-slate-300'}`}>
                    {o.deliveryStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => openOrder(o)}
                    className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                  >
                    Abrir Pedido
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal Overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black/80 backdrop-blur-sm">
          <div className="bg-white/[0.02] backdrop-blur-2xl w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/5">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02] backdrop-blur-2xl">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">receipt_long</span>
                  Detalhes do Pedido - {selectedOrder.id.substring(0,8)}
                </h3>
                <p className="text-slate-400 text-sm mt-1">Data: {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
              
              {/* Left Column: Info & Logs */}
              <div className="flex-1 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] backdrop-blur-xl shadow-2xl p-4 rounded-xl border border-white/5">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Cliente</span>
                    <p className="text-white font-medium">{selectedOrder.clientName}</p>
                    <p className="text-slate-400 text-sm">{selectedOrder.clientEmail}</p>
                    <p className="text-slate-400 text-sm">{selectedOrder.clientPhone}</p>
                  </div>
                  <div className="bg-white/[0.02] backdrop-blur-xl shadow-2xl p-4 rounded-xl border border-white/5">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Pacote</span>
                    <p className="text-white font-medium">{selectedOrder.followersCount.toLocaleString()} Seguidores</p>
                    <p className="text-emerald-400 font-bold">R$ {selectedOrder.price.toFixed(2).replace('.', ',')}</p>
                    <a href={`https://instagram.com/${selectedOrder.instagramUser}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm flex items-center gap-1 mt-1">
                      @{selectedOrder.instagramUser} <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  </div>
                  <div className="bg-white/[0.02] backdrop-blur-xl shadow-2xl p-4 rounded-xl border border-white/5">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Pagamento (PIX)</span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold inline-block mt-1 ${statusColor[selectedOrder.paymentStatus] || 'bg-slate-700 text-slate-300'}`}>
                      {selectedOrder.paymentStatus}
                    </span>
                    <p className="text-slate-500 text-xs mt-2 font-mono truncate" title={selectedOrder.txid}>ID: {selectedOrder.txid || 'N/A'}</p>
                  </div>
                  <div className="bg-white/[0.02] backdrop-blur-xl shadow-2xl p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Fornecedor (SMM)</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold inline-block mt-1 ${statusColor[selectedOrder.deliveryStatus] || 'bg-slate-700 text-slate-300'}`}>
                        {selectedOrder.deliveryStatus}
                      </span>
                      <p className="text-slate-500 text-xs mt-2 font-mono">Ref: {selectedOrder.providerOrderId || 'N/A'}</p>
                    </div>
                    
                    <button 
                      onClick={() => handleRetry(selectedOrder.id)}
                      disabled={retrying === selectedOrder.id}
                      className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 text-white py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      {retrying === selectedOrder.id ? 'Ligando...' : 'Reenviar API'}
                    </button>
                  </div>
                </div>

                {/* API Logs */}
                {selectedOrder.providerLog && (
                  <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-sm">terminal</span>
                      Raw Provider Logs
                    </h4>
                    {selectedOrder.providerError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-3">
                        <span className="font-bold">Error Reason:</span> {selectedOrder.providerError}
                      </div>
                    )}
                    <pre className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black p-3 rounded-lg text-slate-400 text-xs overflow-x-auto whitespace-pre-wrap max-h-48 border border-slate-800">
                      {selectedOrder.providerLog}
                    </pre>
                  </div>
                )}
              </div>

              {/* Right Column: Admin Notes */}
              <div className="w-full lg:w-80 flex flex-col bg-white/[0.02] backdrop-blur-xl shadow-2xl border border-white/5 rounded-3xl hover:border-white/10 transition-colors overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-400 text-lg">edit_note</span>
                    Anotações Internas
                  </h4>
                  <p className="text-slate-400 text-xs mt-1">Visível apenas para administradores</p>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <textarea 
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Escreva detalhes sobre o contato com o cliente, resolução de bugs ou links secundários..."
                    className="flex-1 w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-4 text-slate-300 text-sm outline-none focus:border-blue-500 resize-none"
                  ></textarea>
                </div>
                <div className="p-4 bg-white/[0.02] backdrop-blur-xl shadow-2xl border-t border-white/5">
                  <button 
                    onClick={saveNotes}
                    disabled={savingNotes}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/25 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">save</span>
                    {savingNotes ? 'Salvando...' : 'Salvar Anotação'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PRODUCTS TAB ───
const ProductsTab: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ followers: '', subtitle: '', price: '', icon: 'person', tag: '', features: ['', ''] });
  const [loading, setLoading] = useState(true);

  const load = () => authFetch(`${API}/api/admin/products`).then(r => r.json()).then(d => { setProducts(d.products || []); setLoading(false); });
  useEffect(() => { load(); }, []);

  const startEdit = (p: any) => {
    setEditing(p.id);
    setForm({ followers: p.followers, subtitle: p.subtitle, price: p.price, icon: p.icon, tag: p.tag || '', features: p.features.length ? p.features : ['', ''] });
  };

  const save = async () => {
    if (!editing) return;
    await authFetch(`${API}/api/admin/products/${editing}`, {
      method: 'PUT',
      body: JSON.stringify({ ...form, features: form.features.filter(f => f.trim()) })
    });
    setEditing(null); load();
  };

  const addProduct = async () => {
    await authFetch(`${API}/api/admin/products`, {
      method: 'POST',
      body: JSON.stringify({ followers: '500', subtitle: 'Novo Pacote', price: '29,90', icon: 'person', features: ['Feature 1'], sortOrder: products.length + 1 })
    });
    load();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Excluir este produto?')) return;
    await authFetch(`${API}/api/admin/products/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleActive = async (p: any) => {
    await authFetch(`${API}/api/admin/products/${p.id}`, {
      method: 'PUT', body: JSON.stringify({ active: !p.active })
    });
    load();
  };

  if (loading) return <div className="text-center text-slate-400 py-20">Carregando produtos...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Produtos ({products.length})</h2>
        <button onClick={addProduct} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined text-lg">add</span> Novo Produto
        </button>
      </div>

      <div className="grid gap-4">
        {products.map(p => (
          <div key={p.id} className={`bg-white/[0.02] backdrop-blur-xl shadow-2xl rounded-3xl hover:border-white/10 transition-colors p-5 border ${p.active ? 'border-white/5' : 'border-red-500/30 opacity-60'}`}>
            {editing === p.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Seguidores</label>
                    <input value={form.followers} onChange={e => setForm({ ...form, followers: e.target.value })}
                      className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Subtítulo</label>
                    <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
                      className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Preço (R$)</label>
                    <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Tag (opcional)</label>
                    <input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} placeholder="Mais Popular"
                      className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Ícone (Material Symbols)</label>
                  <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
                    className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Features</label>
                  {form.features.map((f, i) => (
                    <input key={i} value={f} onChange={e => { const nf = [...form.features]; nf[i] = e.target.value; setForm({ ...form, features: nf }); }}
                      placeholder={`Feature ${i + 1}`}
                      className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 mb-2" />
                  ))}
                  <button onClick={() => setForm({ ...form, features: [...form.features, ''] })} className="text-blue-400 text-xs font-bold hover:underline">+ Adicionar feature</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={save} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-500/25 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">Salvar</button>
                  <button onClick={() => setEditing(null)} className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-blue-400" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{p.followers} Seguidores</span>
                      {p.tag && <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-2 py-0.5 rounded-lg">{p.tag}</span>}
                      {!p.active && <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-lg">Desativado</span>}
                    </div>
                    <p className="text-slate-400 text-xs">{p.subtitle} • {p.features.join(', ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-black text-lg">R$ {p.price}</span>
                  <button onClick={() => startEdit(p)} className="text-slate-400 hover:text-white transition-colors p-1">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button onClick={() => toggleActive(p)} className="text-slate-400 hover:text-white transition-colors p-1">
                    <span className="material-symbols-outlined text-lg">{p.active ? 'visibility_off' : 'visibility'}</span>
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="text-slate-400 hover:text-red-400 transition-colors p-1">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── SETTINGS TAB ───
const SettingsTab: React.FC<{ role: string }> = ({ role }) => {
  const [googleTagId, setGoogleTagId] = useState('');
  const [googleAdsConversionId, setGoogleAdsConversionId] = useState('');
  const [metaPixelId, setMetaPixelId] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    authFetch(`${API}/api/admin/settings`).then(r => r.json()).then(d => {
      setGoogleTagId(d.googleTagId || ''); 
      setGoogleAdsConversionId(d.googleAdsConversionId || '');
      setMetaPixelId(d.metaPixelId || ''); 
      setLogoUrl(d.logoUrl || '');
    });
  }, []);

  const saveTags = async () => {
    await authFetch(`${API}/api/admin/settings`, { method: 'PUT', body: JSON.stringify({ googleTagId, googleAdsConversionId, metaPixelId }) });
    setMsg('Tags salvas com sucesso!');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const res = await authFetch(`${API}/api/admin/logo`, { method: 'PUT', body: JSON.stringify({ logoBase64: base64 }) });
      if (res.ok) { setLogoUrl(base64); setMsg('Logo atualizada!'); setTimeout(() => setMsg(''), 3000); }
      else { alert('Apenas admins podem mudar a logo.'); }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Tem certeza que deseja remover a logo e voltar para o texto e ícone padrão?')) return;
    const res = await authFetch(`${API}/api/admin/logo`, { method: 'PUT', body: JSON.stringify({ logoBase64: null }) });
    if (res.ok) { setLogoUrl(''); setMsg('Logo removida!'); setTimeout(() => setMsg(''), 3000); }
    else { alert('Apenas admins podem mudar a logo.'); }
  };

  const changePassword = async () => {
    const res = await authFetch(`${API}/api/admin/password`, {
      method: 'PUT', body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
    });
    const data = await res.json();
    if (res.ok) {
      setPassMsg('Senha alterada com sucesso!'); setCurrentPass(''); setNewPass('');
    } else {
      setPassMsg(data.error);
    }
    setTimeout(() => setPassMsg(''), 3000);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {msg && <div className="bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-3 rounded-xl text-sm font-bold">{msg}</div>}

      {/* Logo (Apenas ADMIN pode editar, mas EDITOR pode ver) */}
      <div className="bg-white/[0.02] backdrop-blur-xl shadow-2xl rounded-3xl hover:border-white/10 transition-colors p-6 border border-white/5 space-y-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-400">image</span> Logo do Site
        </h3>
        <div className="flex items-center gap-6">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-16 object-contain bg-white rounded-xl p-2" />
          ) : (
            <div className="h-16 w-32 bg-black/20 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-500 text-xs">Sem logo</div>
          )}
          {role === 'ADMIN' && (
            <div>
              <input type="file" ref={fileRef} accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <div className="flex items-center gap-2">
                <button onClick={() => fileRef.current?.click()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                  Alterar Logo
                </button>
                {logoUrl && (
                  <button onClick={handleRemoveLogo}
                    className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
                    Remover
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white/[0.02] backdrop-blur-xl shadow-2xl rounded-3xl hover:border-white/10 transition-colors p-6 border border-white/5 space-y-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-400">code</span> Tags de Rastreamento
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">Google Tag (GTM / GA4)</label>
            <input value={googleTagId} onChange={e => setGoogleTagId(e.target.value)} placeholder="GTM-XXXXXXX ou G-XXXXXXX"
              className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">Google Ads / Rótulo Conversão (Opcional)</label>
            <input value={googleAdsConversionId} onChange={e => setGoogleAdsConversionId(e.target.value)} placeholder="AW-12345/AbCde..."
              className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">Meta Pixel ID</label>
            <input value={metaPixelId} onChange={e => setMetaPixelId(e.target.value)} placeholder="123456789012345"
              className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" />
          </div>
        </div>
        <button onClick={saveTags} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 text-white text-sm font-bold px-6 py-2 rounded-xl transition-colors">
          Salvar Tags
        </button>
      </div>

      {/* Password do seu próprio usuário */}
      <div className="bg-white/[0.02] backdrop-blur-xl shadow-2xl rounded-3xl hover:border-white/10 transition-colors p-6 border border-white/5 space-y-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-400">lock</span> Alterar Minha Senha
        </h3>
        {passMsg && <p className={`text-sm font-bold ${passMsg.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>{passMsg}</p>}
        <div className="space-y-3">
          <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="Senha atual"
            className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" />
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Nova senha"
            className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" />
        </div>
        <button onClick={changePassword} disabled={!currentPass || !newPass}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-500/25 text-white text-sm font-bold px-6 py-2 rounded-xl transition-colors disabled:opacity-50">
          Alterar Senha
        </button>
      </div>
    </div>
  );
};

// ─── USUÁRIOS TAB ───
const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', role: 'EDITOR' });

  const load = () => {
    authFetch(`${API}/api/admin/users`)
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await authFetch(`${API}/api/admin/users`, {
      method: 'POST', body: JSON.stringify(form)
    });
    if (res.ok) {
      setForm({ email: '', password: '', role: 'EDITOR' });
      load();
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Excluir este usuário?')) return;
    const res = await authFetch(`${API}/api/admin/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
    }
    load();
  };

  if (loading) return <div className="text-slate-400">Carregando usuários...</div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Equipe ({users.length})</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <form onSubmit={addUser} className="bg-white/[0.02] backdrop-blur-xl shadow-2xl rounded-3xl hover:border-white/10 transition-colors p-6 border border-white/5 space-y-4 h-fit">
          <h3 className="font-bold text-white mb-2">Adicionar Novo</h3>
          <input type="email" required placeholder="E-mail" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" />
          <input type="text" required placeholder="Senha" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
            className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" />
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
            className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500">
            <option value="EDITOR">Editor</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 text-white font-bold py-3 rounded-xl transition-colors">
            Adicionar
          </button>
        </form>

        <div className="md:col-span-2 space-y-3">
          {users.map(u => (
            <div key={u.id} className="bg-white/[0.02] backdrop-blur-xl shadow-2xl border border-white/5 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">{u.email}</p>
                <div className="flex gap-2 items-center mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {u.role}
                  </span>
                  <span className="text-slate-500 text-xs">Criado em {new Date(u.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => deleteUser(u.id)} className="text-slate-400 hover:text-red-400 p-2">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── LOGS TAB ───
const LogsTab: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    authFetch(`${API}/api/admin/logs`)
      .then(r => r.json())
      .then(d => { setLogs(d.logs || []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-slate-400">Carregando logs...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Log de Ações</h2>
      <div className="overflow-x-auto rounded-3xl hover:border-white/10 transition-colors border border-white/5 bg-white/[0.02] backdrop-blur-xl shadow-2xl">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.02] backdrop-blur-xl shadow-2xl">
            <tr className="text-slate-400 text-left text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Data/Hora</th>
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Ação</th>
              <th className="px-4 py-3">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-white/[0.02] backdrop-blur-xl shadow-2xl">
                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-blue-400 font-medium text-xs">
                  {log.userEmail}
                </td>
                <td className="px-4 py-3">
                  <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs font-bold font-mono">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300 text-xs">
                  {log.details || '-'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-6 text-slate-500">Nenhum log registrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── DASHBOARD TAB ───
const DashboardTab: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d'); // 7d, 30d, all
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const load = async () => {
    setLoading(true);
    let start = '';
    let end = '';

    if (period === 'custom') {
      start = customStart;
      end = customEnd;
    } else if (period !== 'all') {
      const days = period === '7d' ? 7 : 30;
      const today = new Date();
      end = today.toISOString().split('T')[0];
      const past = new Date(today);
      past.setDate(today.getDate() - days);
      start = past.toISOString().split('T')[0];
    }

    let url = `${API}/api/admin/dashboard`;
    if (start && end) url += `?startDate=${start}&endDate=${end}`;

    const res = await authFetch(url);
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [period, customStart, customEnd]);

  if (loading && !data) return <div className="text-slate-400 py-10">Carregando métricas...</div>;
  if (!data) return <div className="text-red-400 py-10">Erro ao carregar dados.</div>;

  const PIX_COLOR = '#10b981'; // emerald-500
  const CARD_COLOR = '#8b5cf6'; // violet-500
  const pieData = [
    { name: 'PIX', value: data.paymentMethods.pix.total, fill: PIX_COLOR },
    { name: 'Cartão', value: data.paymentMethods.card.total, fill: CARD_COLOR },
  ].filter(i => i.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-400">monitoring</span>
          Visão Geral
        </h2>

        <div className="flex flex-wrap items-center gap-3 bg-white/[0.02] backdrop-blur-xl shadow-2xl p-2 rounded-xl border border-white/5">
          <button onClick={() => setPeriod('7d')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${period==='7d'?'bg-blue-600 text-white':'text-slate-400 hover:bg-slate-700'}`}>7 dias</button>
          <button onClick={() => setPeriod('30d')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${period==='30d'?'bg-blue-600 text-white':'text-slate-400 hover:bg-slate-700'}`}>30 dias</button>
          <button onClick={() => setPeriod('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${period==='all'?'bg-blue-600 text-white':'text-slate-400 hover:bg-slate-700'}`}>Tudo</button>
          
          <div className="h-6 w-px bg-slate-700 mx-1"></div>
          
          <button onClick={() => setPeriod('custom')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${period==='custom'?'bg-blue-600 text-white':'text-slate-400 hover:bg-slate-700'}`}>Personalizado</button>
          
          {period === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} className="bg-black/20 backdrop-blur-md border border-white/10 text-white text-xs px-2 py-1.5 rounded-lg" />
              <span className="text-slate-500">até</span>
              <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} className="bg-black/20 backdrop-blur-md border border-white/10 text-white text-xs px-2 py-1.5 rounded-lg" />
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/[0.02] backdrop-blur-xl shadow-2xl p-6 rounded-3xl hover:border-white/10 transition-colors border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-6xl">payments</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Faturamento Total</p>
          <h3 className="text-3xl font-black text-emerald-400">R$ {data.revenue.total.toFixed(2).replace('.',',')}</h3>
          <p className="text-slate-500 text-xs mt-2 font-medium">{data.revenue.count} pedidos pagos</p>
        </div>
        
        <div className="bg-white/[0.02] backdrop-blur-xl shadow-2xl p-6 rounded-3xl hover:border-white/10 transition-colors border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-6xl">shopping_cart</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Ticket Médio</p>
          <h3 className="text-3xl font-black text-white">R$ {data.revenue.ticket.toFixed(2).replace('.',',')}</h3>
        </div>

        <div className="bg-white/[0.02] backdrop-blur-xl shadow-2xl p-6 rounded-3xl hover:border-white/10 transition-colors border border-white/5 flex justify-between items-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="material-symbols-outlined text-6xl">pie_chart</span>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Origem Receita</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{backgroundColor: PIX_COLOR}}></span>
                  <span className="text-white font-bold">{data.paymentMethods.pix.percentage}%</span>
                  <span className="text-slate-500 text-xs">PIX</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{backgroundColor: CARD_COLOR}}></span>
                  <span className="text-white font-bold">{data.paymentMethods.card.percentage}%</span>
                  <span className="text-slate-500 text-xs">Cartão</span>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico Linear Timeline */}
        <div className="bg-white/[0.02] backdrop-blur-xl shadow-2xl p-6 rounded-3xl hover:border-white/10 transition-colors border border-white/5 lg:col-span-2">
           <h3 className="text-white font-bold mb-6">Receita Diária</h3>
           <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.timeline} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').reverse().slice(0,2).join('/')} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  formatter={(value: any) => [`R$ ${Number(value || 0).toFixed(2)}`, 'Receita']}
                  labelFormatter={(label: any) => `Data: ${String(label || '').split('-').reverse().join('/')}`}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Gráfico Donut de Pagamentos */}
        <div className="bg-white/[0.02] backdrop-blur-xl shadow-2xl p-6 rounded-3xl hover:border-white/10 transition-colors border border-white/5 flex flex-col">
           <h3 className="text-white font-bold mb-6">Receita por Método de Pagamento</h3>
           <div className="flex-1 flex items-center justify-center -mt-4 text-xs">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                    formatter={(value: any) => `R$ ${Number(value || 0).toFixed(2)}`}
                  />
                  <Legend iconType="circle" verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
             ) : (
                <div className="text-slate-500 font-medium">Nenhuma venda encontrada</div>
             )}
           </div>
           {/* Detalhamento */}
           <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
             <div className="flex justify-between items-center text-sm">
               <span className="text-slate-400">PoloPag (PIX)</span>
               <span className="text-emerald-400 font-bold">R$ {data.paymentMethods.pix.total.toFixed(2)}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-slate-400">Stripe (Cartão)</span>
               <span className="text-violet-400 font-bold">R$ {data.paymentMethods.card.total.toFixed(2)}</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───
export const AdminDashboard: React.FC = () => {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [tab, setTab] = useState<'dashboard' | 'orders' | 'products' | 'settings' | 'users' | 'logs'>('dashboard');
  const [init, setInit] = useState(true);

  const fetchUser = async () => {
    const res = await authFetch(`${API}/api/admin/me`);
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      setAuthed(true);
    } else {
      localStorage.removeItem('fg_admin_token');
      setAuthed(false);
    }
    setInit(false);
  };

  useEffect(() => {
    const token = localStorage.getItem('fg_admin_token');
    if (token) fetchUser();
    else setInit(false);
  }, []);

  if (init) return <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black flex items-center justify-center text-slate-500">Carregando...</div>;
  if (!authed) return <LoginScreen onLogin={fetchUser} />;

  const isEditor = user?.role === 'EDITOR';

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: 'monitoring' },
    { id: 'orders' as const, label: 'Pedidos', icon: 'receipt_long' },
    { id: 'products' as const, label: 'Produtos', icon: 'inventory_2' },
    { id: 'settings' as const, label: 'Configurações', icon: 'settings' },
    ...(!isEditor ? [
      { id: 'users' as const, label: 'Usuários', icon: 'group' },
      { id: 'logs' as const, label: 'Histórico', icon: 'history' },
    ] : [])
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/[0.02] backdrop-blur-2xl border-r border-white/5 p-6 flex flex-col">
        <div className="mb-10">
          <h1 className="text-xl font-black text-white">⚡ FastGram</h1>
          <p className="text-slate-500 text-xs mt-1">Painel Admin</p>
          {user && (
            <div className="mt-4 p-3 bg-white/[0.02] backdrop-blur-xl shadow-2xl rounded-xl border border-white/5 border-dashed">
              <p className="text-white text-xs font-bold truncate" title={user.email}>{user.email}</p>
              <p className="text-blue-400 text-[10px] uppercase font-black tracking-wider mt-1">{user.role}</p>
            </div>
          )}
        </div>
        <nav className="space-y-2 flex-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${tab === t.id ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/[0.02] backdrop-blur-xl shadow-2xl'}`}>
              <span className="material-symbols-outlined text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <button onClick={() => { localStorage.removeItem('fg_admin_token'); setAuthed(false); setUser(null); }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors">
          <span className="material-symbols-outlined text-lg">logout</span> Sair
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'settings' && <SettingsTab role={user?.role || 'EDITOR'} />}
        {tab === 'users' && !isEditor && <UsersTab />}
        {tab === 'logs' && !isEditor && <LogsTab />}
      </main>
    </div>
  );
};
