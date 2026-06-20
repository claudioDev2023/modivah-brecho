import React, { useState } from 'react';
import { 
  Users, ShoppingBag, Send, Calendar, MapPin, Smartphone, 
  MessageSquare, DollarSign, Search, Clock, CheckCircle, AlertOctagon, ExternalLink, X
} from 'lucide-react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface ReportsClientsDashboardProps {
  clientsList: any[];
  ordersList: any[];
  recoveriesList: any[];
  products: any[];
}

export default function ReportsClientsDashboard({
  clientsList,
  ordersList,
  recoveriesList,
  products
}: ReportsClientsDashboardProps) {

  // Search states
  const [searchClient, setSearchClient] = useState('');
  const [searchOrder, setSearchOrder] = useState('');
  const [searchRecovery, setSearchRecovery] = useState('');

  // Active recovery preview modal
  const [activeRecovery, setActiveRecovery] = useState<any | null>(null);
  const [sendingRecoveryId, setSendingRecoveryId] = useState<string | null>(null);

  // Group dynamic revenue sums
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfThisYear = new Date(now.getFullYear(), 0, 1).getTime();

  let revenueToday = 0;
  let revenueThisMonth = 0;
  let revenueThisYear = 0;

  ordersList.forEach(ord => {
    try {
      const totalNum = Number(ord.total) || 0;
      const orderTime = new Date(ord.createdAt).getTime();
      if (orderTime >= startOfToday) {
        revenueToday += totalNum;
      }
      if (orderTime >= startOfThisMonth) {
        revenueThisMonth += totalNum;
      }
      if (orderTime >= startOfThisYear) {
         revenueThisYear += totalNum;
      }
    } catch {}
  });

  // Filter clients List
  const filteredClients = clientsList.filter(c => {
    if (!c) return false;
    const q = searchClient.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      (c.state || '').toLowerCase().includes(q)
    );
  });

  // Filter orders List
  const filteredOrders = ordersList.filter(o => {
    if (!o) return false;
    const q = searchOrder.toLowerCase();
    return (
      (o.id || '').toLowerCase().includes(q) ||
      (o.clientName || '').toLowerCase().includes(q) ||
      (o.paymentMethod || '').toLowerCase().includes(q) ||
      (o.clientPhone || '').toLowerCase().includes(q)
    );
  });

  // Filter recoveries List
  const filteredRecoveries = recoveriesList.filter(r => {
    if (!r) return false;
    const q = searchRecovery.toLowerCase();
    return (
      (r.clientName || '').toLowerCase().includes(q) ||
      (r.productTitle || '').toLowerCase().includes(q) ||
      (r.clientPhone || '').toLowerCase().includes(q)
    );
  });

  // Launch campaign handler
  const handleLaunchCampaign = async (recoveryDoc: any) => {
    if (!recoveryDoc) return;
    setSendingRecoveryId(recoveryDoc.id);

    try {
      // 1. Mark completed recovery state in Firestore
      const docRef = doc(db, 'cart_recovery', recoveryDoc.id);
      await updateDoc(docRef, {
        isRecovered: true,
        recoveredAt: new Date().toISOString(),
        recoveryMessageSent: true
      });

      // 2. Format Whatsapp URL payload with standard query parameters redirecting back as requested
      const hostname = typeof window !== 'undefined' ? window.location.origin : 'https://modivah.com.br';
      const checkoutRedirectLink = `${hostname}?checkout_recovery=${recoveryDoc.productId || recoveryDoc.id}&rec_client=${recoveryDoc.clientId || ''}`;

      const whatsappRawText = `Não desista do seu pedido. Ele está te aguardando. ✨\n\n` +
                              `🛍️ *Olá, ${recoveryDoc.clientName}!* Notamos que você amou uma peça exclusiva de curadoria do nosso acervo, mas não concluiu a reserva:\n\n` +
                              `👚 *Peça:* ${recoveryDoc.productTitle}\n` +
                              `🏷️ *Tamanho/Marca:* M / Modivah Circular\n` +
                              `💰 *Valor Curado:* R$ ${(Number(recoveryDoc.price) || 0).toFixed(2)}\n\n` +
                              `🔗 *Clique no link abaixo para concluir seu PIX e finalizá-la imediatamente:* \n${checkoutRedirectLink}\n\n` +
                              `Aproveite, pois as peças do brechó são *únicas* e podem esgotar a qualquer momento! Atenciosamente, Modivah Brechó.`;

      const encodedText = encodeURIComponent(whatsappRawText);
      let phoneClean = (recoveryDoc.clientPhone || '').replace(/\D/g, '');
      if (phoneClean.length === 11 && !phoneClean.startsWith('55')) {
        phoneClean = '55' + phoneClean;
      }
      
      const waUrl = `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodedText}`;
      
      window.open(waUrl, '_blank');
      setActiveRecovery(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao disparar campanha no banco de dados.");
    } finally {
      setSendingRecoveryId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300" id="reports-clients-panel">
      
      {/* 1. Receipts of the period summary */}
      <section className="bg-neutral-900 border border-white/5 p-5 rounded-2xl">
        <h3 className="text-xs font-mono font-bold text-[#ffe4a0] uppercase tracking-widest flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-amber-500" />
          <span>Faturamento de Receitas por Período</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Receita Hoje</span>
              <p className="text-xl font-mono text-white font-bold mt-1">R$ {(Number(revenueToday) || 0).toFixed(2)}</p>
            </div>
            <Calendar className="h-5 w-5 text-zinc-600" />
          </div>
          <div className="bg-black/40 border border-[#ffe490]/10 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[9px] text-amber-300/60 uppercase tracking-widest font-mono">Receita Mensal</span>
              <p className="text-xl font-mono text-amber-300 font-bold mt-1">R$ {(Number(revenueThisMonth) || 0).toFixed(2)}</p>
            </div>
            <ShoppingBag className="h-5 w-5 text-amber-500/80" />
          </div>
          <div className="bg-black/40 border border-[#39ff14]/10 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[9px] text-[#39ff14]/60 uppercase tracking-widest font-mono">Faturamento Anual</span>
              <p className="text-xl font-mono text-[#39ff14] font-black mt-1">R$ {(Number(revenueThisYear) || 0).toFixed(2)}</p>
            </div>
            <ExternalLink className="h-5 w-5 text-[#39ff14]/80" />
          </div>
        </div>
      </section>

      {/* 2. Registered customers table */}
      <section className="bg-neutral-900 border border-white/5 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" />
            <span>Clientes Registrados ({filteredClients.length})</span>
          </h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Pesquisar clientes..."
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              className="bg-black/50 border border-white/15 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 w-full sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-black/60 border-b border-white/5 text-zinc-400 font-mono text-[9px] uppercase tracking-wider">
                <th className="p-3">Cliente</th>
                <th className="p-3">Acesso / Cidade</th>
                <th className="p-3">WhatsApp / Telefone</th>
                <th className="p-3 text-right">Cadastrado em</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c, idx) => (
                <tr key={c.id || idx} className="border-b border-white/5 hover:bg-white/[0.01] transition last:border-0">
                  <td className="p-3">
                    <p className="font-bold text-white text-[13px]">{c.name || 'Sem nome'}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{c.email || '—'}</p>
                  </td>
                  <td className="p-3 text-neutral-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-zinc-500 shrink-0" />
                      <span>{c.city || 'Desconhecida'} / {c.state || 'ES'}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-zinc-400">
                    <a 
                      href={`https://wa.me/${(c.whatsapp || c.phone || '').replace(/\D/g, '')}`}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>{c.whatsapp || c.phone || 'Sem wpp'}</span>
                    </a>
                  </td>
                  <td className="p-3 text-right text-zinc-500 font-mono">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-zinc-500 text-center font-light">Nenhum cliente cadastrado correspondendo à pesquisa.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Successful Orders log */}
      <section className="bg-neutral-900 border border-white/5 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs uppercase tracking-widest text-[#ffe4a0] font-semibold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-amber-500" />
            <span>Vendas Concluídas ({filteredOrders.length})</span>
          </h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Pesquisar pedidos..."
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
              className="bg-black/50 border border-white/15 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 w-full sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-black/60 border-b border-white/5 text-zinc-400 font-mono text-[9px] uppercase tracking-wider">
                <th className="p-3">Ref. ID / Data</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Itens Comprados</th>
                <th className="p-3">Método / Total</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o, idx) => (
                <tr key={o.id || idx} className="border-b border-white/5 hover:bg-white/[0.01] transition last:border-0">
                  <td className="p-3">
                    <p className="font-mono text-zinc-300 font-semibold">{o.id ? o.id.slice(0, 8) : 'PROD-' + idx}</p>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{o.createdAt ? new Date(o.createdAt).toLocaleString() : '—'}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-bold text-white text-[12px]">{o.clientName || 'Visitante Anônimo'}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{o.clientPhone || '—'}</p>
                  </td>
                  <td className="p-3 text-zinc-400">
                    <div className="flex flex-col gap-1.5 max-w-[240px]">
                      {Array.isArray(o.products) ? o.products.map((pi: any, pIdx: number) => {
                        const matchProd = products.find(p => p.id === pi.productId || p.id === pi.id);
                        const imgUrl = matchProd?.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=120';
                        const skuStr = matchProd?.sku || pi.sku || 'M-GEN';
                        return (
                          <div key={pIdx} className="flex items-center gap-2 bg-black/45 p-1 rounded border border-white/5">
                            <img 
                              src={imgUrl} 
                              alt={pi.title || pi.productTitle} 
                              referrerPolicy="no-referrer"
                              className="h-8 w-6 object-cover rounded bg-neutral-950 border border-white/10 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-[10px] font-sans font-bold text-neutral-200 truncate">{pi.title || pi.productTitle}</p>
                              <p className="text-[8px] font-mono text-neutral-500">SKU: {skuStr} • Qtd: {pi.quantity || 1}</p>
                            </div>
                          </div>
                        );
                      }) : (
                        <span className="text-[11px] font-mono text-neutral-500">Peça Espacial</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-mono">
                    <p className="text-neutral-400 text-[10px] uppercase">{o.paymentMethod || 'PIX'}</p>
                    <p className="text-[#39ff14] font-bold">R$ {(Number(o.total) || 0).toFixed(2)}</p>
                  </td>
                  <td className="p-3 text-right">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase text-[9px]">Sucedido</span>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-zinc-500 text-center font-light">Nenhum pedido efetuado ainda no marketplace.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Abandoned Carts section */}
      <section className="bg-neutral-900 border border-white/5 p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs uppercase tracking-widest text-[#ffe4a0] font-semibold flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-orange-400" />
            <span>Abandono de Sacolas Pendentes ({filteredRecoveries.filter(cr => !cr.isRecovered).length})</span>
          </h3>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Pesquisar abandonos..."
              value={searchRecovery}
              onChange={(e) => setSearchRecovery(e.target.value)}
              className="bg-black/50 border border-white/15 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 w-full sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-black/60 border-b border-white/5 text-zinc-400 font-mono text-[9px] uppercase tracking-wider">
                <th className="p-3">Compradora / Data</th>
                <th className="p-3">Produto Abandonado</th>
                <th className="p-3 text-right">Preço</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecoveries.map((r, idx) => (
                <tr key={r.id || idx} className="border-b border-white/5 hover:bg-white/[0.01] transition last:border-0">
                  <td className="p-3">
                    <p className="font-bold text-white text-[12px]">{r.clientName || 'Visitante'}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</p>
                  </td>
                  <td className="p-3 text-zinc-300">
                    <div className="flex items-center gap-2">
                      {r.productImage && (
                        <img 
                          src={r.productImage} 
                          alt={r.productTitle} 
                          referrerPolicy="no-referrer"
                          className="h-8 w-6 object-contain rounded bg-neutral-950 border border-white/10 shrink-0"
                        />
                      )}
                      <span className="font-medium truncate max-w-[150px]">{r.productTitle || 'Peça Sem Nome'}</span>
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono text-zinc-300 font-bold">
                    R$ {(Number(r.price) || 0).toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    {r.isRecovered ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase text-[9px]">Recuperado</span>
                    ) : (
                      <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded font-bold uppercase text-[9px]">Abandonado</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {r.isRecovered ? (
                      <span className="text-[10px] text-zinc-500 font-mono">Concluído</span>
                    ) : (
                      <button
                        onClick={() => setActiveRecovery(r)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer shrink-0"
                      >
                        Recuperar Card
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRecoveries.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-zinc-500 text-center font-light">Nenhum carrinho pendente de recuperação.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Campaign Preview Overlay / Modal */}
      {activeRecovery && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveRecovery(null)} />
          
          <div className="relative w-full max-w-md bg-neutral-900 border border-white/10 p-6 rounded-2xl shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-xs font-mono font-bold text-amber-400 tracking-widest uppercase">Visualizar Campanha de Resgate</span>
              <button onClick={() => setActiveRecovery(null)} className="p-1 hover:bg-white/5 rounded text-neutral-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-black/40 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                {activeRecovery.productImage && (
                  <img src={activeRecovery.productImage} className="h-14 w-10 object-contain bg-neutral-950 rounded border border-white/5 shrink-0" referrerPolicy="no-referrer" />
                )}
                <div>
                  <p className="text-[10px] uppercase text-amber-300 font-mono">Peça de Curadoria</p>
                  <h4 className="text-xs text-white font-bold">{activeRecovery.productTitle || 'Sem Título'}</h4>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">R$ {(Number(activeRecovery.price) || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Mock WhatsApp message screen */}
              <div>
                <label className="text-[9px] text-zinc-400 block mb-1 uppercase tracking-wider font-mono">Conteúdo da Mensagem Automatizada</label>
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-[#e0f2f1] font-light leading-relaxed whitespace-pre-wrap select-all select-none">
                  <span className="text-emerald-400 font-bold font-mono text-[9px] block mb-2 border-b border-emerald-500/10 pb-1">📱 WHATSAPP TEMPLATE (LGPD CONSENTIDO)</span>
                  Não desista do seu pedido. Ele está te aguardando. ✨
                  
                  🛍️ *Olá, {activeRecovery.clientName || 'Cliente'}!* Notamos que você amou uma peça exclusiva de curadoria do nosso acervo, mas não concluiu a reserva:

                  👚 *Peça:* {activeRecovery.productTitle || 'Sem Título'}
                  💰 *Valor Curado:* R$ {(Number(activeRecovery.price) || 0).toFixed(2)}

                  🔗 *Clique para concluir o PIX e finalizá-la:* 
                  https://modivah.com.br/?checkout={activeRecovery.productId || 'id'}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button 
                onClick={() => setActiveRecovery(null)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs uppercase tracking-wider transition"
              >
                Cancelar
              </button>
              <button
                disabled={sendingRecoveryId === activeRecovery.id}
                onClick={() => handleLaunchCampaign(activeRecovery)}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Send className="h-3 w-3" />
                <span>{sendingRecoveryId === activeRecovery.id ? 'Gerando...' : 'Enviar WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
