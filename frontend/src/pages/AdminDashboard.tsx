import React, { useState, useEffect, useRef } from 'react';
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
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch(`${API}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
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
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <form onSubmit={handleLogin} className="bg-[#1e293b] p-10 rounded-3xl shadow-2xl w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">⚡ FastGram</h1>
          <p className="text-slate-400 text-sm mt-1">Painel Administrativo</p>
        </div>
        <input
          type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Senha de acesso"
          className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 outline-none focus:border-blue-500 transition-colors"
        />
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
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
      <div className="overflow-x-auto rounded-2xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/50">
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
              <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm">
          <div className="bg-[#1e293b] w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/50">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-[#1e293b]">
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
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Cliente</span>
                    <p className="text-white font-medium">{selectedOrder.clientName}</p>
                    <p className="text-slate-400 text-sm">{selectedOrder.clientEmail}</p>
                    <p className="text-slate-400 text-sm">{selectedOrder.clientPhone}</p>
                  </div>
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Pacote</span>
                    <p className="text-white font-medium">{selectedOrder.followersCount.toLocaleString()} Seguidores</p>
                    <p className="text-emerald-400 font-bold">R$ {selectedOrder.price.toFixed(2).replace('.', ',')}</p>
                    <a href={`https://instagram.com/${selectedOrder.instagramUser}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm flex items-center gap-1 mt-1">
                      @{selectedOrder.instagramUser} <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </a>
                  </div>
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">Pagamento (PIX)</span>
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold inline-block mt-1 ${statusColor[selectedOrder.paymentStatus] || 'bg-slate-700 text-slate-300'}`}>
                      {selectedOrder.paymentStatus}
                    </span>
                    <p className="text-slate-500 text-xs mt-2 font-mono truncate" title={selectedOrder.txid}>ID: {selectedOrder.txid || 'N/A'}</p>
                  </div>
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/30 flex flex-col justify-between">
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
                      className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      {retrying === selectedOrder.id ? 'Ligando...' : 'Reenviar API'}
                    </button>
                  </div>
                </div>

                {/* API Logs */}
                {selectedOrder.providerLog && (
                  <div className="bg-slate-900 border border-slate-700/50 rounded-xl p-4">
                    <h4 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-sm">terminal</span>
                      Raw Provider Logs
                    </h4>
                    {selectedOrder.providerError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-3">
                        <span className="font-bold">Error Reason:</span> {selectedOrder.providerError}
                      </div>
                    )}
                    <pre className="bg-[#0f172a] p-3 rounded-lg text-slate-400 text-xs overflow-x-auto whitespace-pre-wrap max-h-48 border border-slate-800">
                      {selectedOrder.providerLog}
                    </pre>
                  </div>
                )}
              </div>

              {/* Right Column: Admin Notes */}
              <div className="w-full lg:w-80 flex flex-col bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
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
                    className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-300 text-sm outline-none focus:border-blue-500 resize-none"
                  ></textarea>
                </div>
                <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
                  <button 
                    onClick={saveNotes}
                    disabled={savingNotes}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
        <button onClick={addProduct} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined text-lg">add</span> Novo Produto
        </button>
      </div>

      <div className="grid gap-4">
        {products.map(p => (
          <div key={p.id} className={`bg-slate-800/50 rounded-2xl p-5 border ${p.active ? 'border-slate-700/50' : 'border-red-500/30 opacity-60'}`}>
            {editing === p.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Seguidores</label>
                    <input value={form.followers} onChange={e => setForm({ ...form, followers: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Subtítulo</label>
                    <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Preço (R$)</label>
                    <input value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 font-bold block mb-1">Tag (opcional)</label>
                    <input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} placeholder="Mais Popular"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Ícone (Material Symbols)</label>
                  <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">Features</label>
                  {form.features.map((f, i) => (
                    <input key={i} value={f} onChange={e => { const nf = [...form.features]; nf[i] = e.target.value; setForm({ ...form, features: nf }); }}
                      placeholder={`Feature ${i + 1}`}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 mb-2" />
                  ))}
                  <button onClick={() => setForm({ ...form, features: [...form.features, ''] })} className="text-blue-400 text-xs font-bold hover:underline">+ Adicionar feature</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={save} className="bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">Salvar</button>
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
const SettingsTab: React.FC = () => {
  const [googleTagId, setGoogleTagId] = useState('');
  const [metaPixelId, setMetaPixelId] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    authFetch(`${API}/api/admin/settings`).then(r => r.json()).then(d => {
      setGoogleTagId(d.googleTagId || ''); setMetaPixelId(d.metaPixelId || ''); setLogoUrl(d.logoUrl || '');
    });
  }, []);

  const saveTags = async () => {
    await authFetch(`${API}/api/admin/settings`, { method: 'PUT', body: JSON.stringify({ googleTagId, metaPixelId }) });
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
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Tem certeza que deseja remover a logo e voltar para o texto e ícone padrão?')) return;
    const res = await authFetch(`${API}/api/admin/logo`, { method: 'PUT', body: JSON.stringify({ logoBase64: null }) });
    if (res.ok) { setLogoUrl(''); setMsg('Logo removida!'); setTimeout(() => setMsg(''), 3000); }
  };

  const changePassword = async () => {
    const res = await authFetch(`${API}/api/admin/password`, {
      method: 'PUT', body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('fg_admin_token', data.token);
      setPassMsg('Senha alterada com sucesso!'); setCurrentPass(''); setNewPass('');
    } else {
      setPassMsg(data.error);
    }
    setTimeout(() => setPassMsg(''), 3000);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {msg && <div className="bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-3 rounded-xl text-sm font-bold">{msg}</div>}

      {/* Logo */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 space-y-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-400">image</span> Logo do Site
        </h3>
        <div className="flex items-center gap-6">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-16 object-contain bg-white rounded-xl p-2" />
          ) : (
            <div className="h-16 w-32 bg-slate-900 rounded-xl flex items-center justify-center text-slate-500 text-xs">Sem logo</div>
          )}
          <div>
            <input type="file" ref={fileRef} accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors">
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
        </div>
      </div>

      {/* Tags */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 space-y-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-400">code</span> Tags de Rastreamento
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">Google Tag (GTM / GA4)</label>
            <input value={googleTagId} onChange={e => setGoogleTagId(e.target.value)} placeholder="GTM-XXXXXXX ou G-XXXXXXX"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 font-bold block mb-1">Meta Pixel ID</label>
            <input value={metaPixelId} onChange={e => setMetaPixelId(e.target.value)} placeholder="123456789012345"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" />
          </div>
        </div>
        <button onClick={saveTags} className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-6 py-2 rounded-xl transition-colors">
          Salvar Tags
        </button>
      </div>

      {/* Password */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 space-y-4">
        <h3 className="text-white font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-400">lock</span> Alterar Senha
        </h3>
        {passMsg && <p className={`text-sm font-bold ${passMsg.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>{passMsg}</p>}
        <div className="space-y-3">
          <input type="password" value={currentPass} onChange={e => setCurrentPass(e.target.value)} placeholder="Senha atual"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" />
          <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Nova senha"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500" />
        </div>
        <button onClick={changePassword} disabled={!currentPass || !newPass}
          className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold px-6 py-2 rounded-xl transition-colors disabled:opacity-50">
          Alterar Senha
        </button>
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───
export const AdminDashboard: React.FC = () => {
  const [authed, setAuthed] = useState(!!localStorage.getItem('fg_admin_token'));
  const [tab, setTab] = useState<'orders' | 'products' | 'settings'>('orders');

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  const tabs = [
    { id: 'orders' as const, label: 'Pedidos', icon: 'receipt_long' },
    { id: 'products' as const, label: 'Produtos', icon: 'inventory_2' },
    { id: 'settings' as const, label: 'Configurações', icon: 'settings' },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e293b] border-r border-slate-700/50 p-6 flex flex-col">
        <div className="mb-10">
          <h1 className="text-xl font-black text-white">⚡ FastGram</h1>
          <p className="text-slate-500 text-xs mt-1">Painel Admin</p>
        </div>
        <nav className="space-y-2 flex-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${tab === t.id ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              <span className="material-symbols-outlined text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <button onClick={() => { localStorage.removeItem('fg_admin_token'); setAuthed(false); }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-colors">
          <span className="material-symbols-outlined text-lg">logout</span> Sair
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {tab === 'orders' && <OrdersTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
};
