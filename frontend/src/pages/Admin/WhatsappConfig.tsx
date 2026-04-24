import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config';

const API = API_BASE;

const authFetch = (url: string, opts: any = {}) => {
  const token = localStorage.getItem('fg_admin_token') || '';
  return fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, ...(opts.headers || {}) }
  });
};

export const WhatsappConfig: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await authFetch(`${API}/api/whatsapp/status`);
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.state === 'connecting') {
          // If connecting but we don't have QR, we might need to call connect
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateQrCode = async () => {
    setConnecting(true);
    try {
      const res = await authFetch(`${API}/api/whatsapp/connect`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.qrcode && data.qrcode.base64) {
          setQrCode(data.qrcode.base64);
        } else if (data.base64) {
          setQrCode(data.base64);
        } else {
          // Attempt to refetch status
          fetchStatus();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar o WhatsApp atual?')) return;
    setLoading(true);
    try {
      await authFetch(`${API}/api/whatsapp/disconnect`, { method: 'POST' });
      setStatus({ state: 'disconnected' });
      setQrCode(null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) return <div className="text-zinc-400 py-10">Carregando status do WhatsApp...</div>;

  const isConnected = status?.state === 'open';
  const isConnecting = status?.state === 'connecting';

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400">chat</span> WhatsApp API
        </h2>
      </div>

      <div className="bg-[#18181b] rounded-3xl p-6 border border-zinc-800 space-y-6">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
          <div>
            <p className="text-white font-bold">Status da Conexão</p>
            <p className="text-zinc-400 text-sm">
              {isConnected ? 'Conectado e operante' : isConnecting ? 'Aguardando conexão...' : 'Desconectado'}
            </p>
          </div>
        </div>

        {!isConnected && (
          <div className="border-t border-zinc-800 pt-6">
            {!qrCode ? (
              <div className="text-center">
                <button
                  onClick={generateQrCode}
                  disabled={connecting}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-500/25 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {connecting ? 'Gerando QR Code...' : 'Gerar QR Code de Conexão'}
                </button>
                <p className="text-zinc-500 text-xs mt-4">Isto criará a instância na Evolution API e exibirá o QR Code para leitura.</p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-zinc-300 text-sm font-bold">Escaneie o QR Code com o WhatsApp do Suporte</p>
                <div className="bg-white p-4 rounded-xl inline-block">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 object-contain" />
                </div>
                <p className="text-zinc-500 text-xs">O status atualizará automaticamente quando conectado.</p>
              </div>
            )}
          </div>
        )}

        {isConnected && (
          <div className="border-t border-zinc-800 pt-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-emerald-400 font-bold text-sm">Sessão Ativa</p>
                <p className="text-emerald-500/70 text-xs mt-1">O bot do n8n está pronto para enviar e receber mensagens.</p>
              </div>
              <button
                onClick={disconnect}
                className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
              >
                Desconectar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
