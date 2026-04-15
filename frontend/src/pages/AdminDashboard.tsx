import React, { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:3333';

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

  useEffect(() => {
    authFetch(`${API}/api/admin/orders`).then(r => r.json()).then(d => { setOrders(d.orders || []); setLoading(false); });
  }, []);

  const statusColor: Record<string, string> = {
    PAID: 'bg-green-500/20 text-green-400', PENDING: 'bg-amber-500/20 text-amber-400',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400', COMPLETED: 'bg-emerald-500/20 text-emerald-400',
    WAITING_PAYMENT: 'bg-slate-500/20 text-slate-400'
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {orders.map(o => (
              <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-mono text-slate-300 text-xs">{o.id.substring(0, 8)}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
