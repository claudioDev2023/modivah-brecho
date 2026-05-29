import React, { useState } from 'react';
import { X, ShoppingBag, MessageSquare, Shield, HelpCircle, Sparkles } from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showDirectForm, setShowDirectForm] = useState(false);
  const [clientName, setClientName] = useState(() => localStorage.getItem('modivah_client_name') || 'CLAUDIO SILVA');
  const [clientPhone, setClientPhone] = useState(() => localStorage.getItem('modivah_client_phone') || '27988226654');
  const [address, setAddress] = useState(() => localStorage.getItem('modivah_client_address') || 'RUA DA VITORIA, 914, PRESIDENTE MEDICE, CARIACICA-ES');
  const [interactionType, setInteractionType] = useState<'compra' | 'duvida'>('compra');

  if (!product) return null;

  const isAvailable = product.status === 'available' && product.stock > 0;
  const isSold = product.status === 'sold' || product.stock <= 0;

  // Build list of all images: first is product.image, then any in product.images
  const allImages = [product.image, ...(product.images || [])].filter(v => v && v.trim() !== '').slice(0, 10);

  // Directly set interaction type and open client details form
  const handleWhatsAppBuyNow = () => {
    setInteractionType('compra');
    setShowDirectForm(true);
  };

  const handleDirectWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Por favor, informe seu Nome Completo para cadastros.');
      return;
    }
    if (!clientPhone.trim()) {
      alert('Por favor, informe seu Telefone de contato.');
      return;
    }
    if (!address.trim()) {
      alert('Por favor, informe seu Endereço Completo.');
      return;
    }

    // Persist client credentials securely in local device storage
    localStorage.setItem('modivah_client_name', clientName.trim());
    localStorage.setItem('modivah_client_phone', clientPhone.trim());
    localStorage.setItem('modivah_client_address', address.trim());

    const productSku = product.sku || 'M-' + product.id.replace('prod-', '').toUpperCase().padStart(4, '0');
    
    let text = `===================================\n`;
    if (interactionType === 'compra') {
      text += `   🛍️ INTERESSE DE COMPRA - MODIVAH BRECHÓ\n`;
    } else {
      text += `   ❓ DÚVIDA DE PEÇA - MODIVAH BRECHÓ\n`;
    }
    text += `===================================\n\n`;
    text += `[DADOS PARA BANCO DE DADOS / PLANILHA]\n`;
    text += `NOME COMPLETO : ${clientName.trim().toUpperCase()}\n`;
    text += `TELEFONE      : ${clientPhone.trim()}\n`;
    text += `ENDEREÇO      : ${address.trim().toUpperCase()}\n`;
    text += `SOLICITAÇÃO   : ${interactionType === 'compra' ? 'COMPRAR PEÇA' : 'DÚVIDA / DETALHES'}\n`;
    text += `-----------------------------------\n\n`;
    
    text += `[DETALHES DA PEÇA]\n`;
    text += `PEÇA: ${product.title}\n`;
    text += `SKU : ${productSku}\n`;
    text += `MARCA: ${product.brand} | TAMANHO: ${product.size}\n`;
    text += `MATERIAL: ${product.material} | CONDIÇÃO: ${product.condition}\n`;
    text += `VALOR DA PEÇA: R$ ${product.price.toFixed(2)}\n`;
    text += `===================================\n\n`;
    
    if (interactionType === 'compra') {
      text += `Olá! Tenho muito interesse em reservar e comprar essa peça. Gostaria de confirmar os dados de pagamento PIX e envio.`;
    } else {
      text += `Olá! Gostaria de falar com a atendente para tirar uma dúvida sobre esta peça.`;
    }

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/5527988226654?text=${encodedText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-neutral-950/80 hover:bg-white text-white hover:text-black rounded-full border border-white/10 transition cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Product Image Panel (Left/Top) */}
        <div className="w-full md:w-1/2 flex flex-col sm:flex-row h-auto md:h-[550px] relative bg-neutral-950 overflow-hidden">
          {/* Thumbnails list on the side */}
          {allImages.length > 1 && (
            <div className="w-full sm:w-16 md:w-20 bg-black/40 border-b sm:border-b-0 sm:border-r border-white/5 flex sm:flex-col gap-2 p-2 overflow-x-auto sm:overflow-x-hidden sm:overflow-y-auto shrink-0 select-none">
              {allImages.map((imgUrl, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-square w-10 sm:w-full rounded border overflow-hidden transition-all duration-200 cursor-pointer shrink-0 ${
                    activeImageIndex === idx 
                      ? 'border-amber-500 ring-1 ring-amber-500 scale-[0.93]' 
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.title} vista ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Selected Image */}
          <div className="flex-1 relative aspect-[4/5] sm:aspect-auto h-full overflow-hidden flex items-center justify-center bg-black">
            <img
              src={allImages[activeImageIndex] || product.image}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-all duration-300"
            />
            {product.tag && (
              <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-amber-500 font-semibold text-black text-[10px] uppercase tracking-widest rounded-full">
                {product.tag}
              </span>
            )}
            {isSold && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-[2.5px] flex items-center justify-center p-0 overflow-hidden z-10">
                <div className="w-full bg-red-650 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider py-4 border-y border-red-500 shadow-2xl text-center select-none px-4 transform -rotate-12 scale-110 bg-red-600">
                  poxa, você perdeu essa, já foi vendido. 💔
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Info Panel (Right/Bottom) */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto max-h-[450px] md:max-h-[550px]" id="modal-product-details">
          
          <div>
            {/* Brand + Condition tags */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-amber-300 font-mono font-semibold tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                {product.brand}
              </span>
              <span className="text-[10px] text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded border border-white/5">
                Estado: {product.condition}
              </span>
            </div>

            {/* Product Title */}
            <h2 className="text-xl md:text-2xl font-sans font-light text-white mb-4 leading-tight">
              {product.title}
            </h2>

            {/* Price section */}
            <div className="flex flex-col mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-neutral-500 line-through font-mono">
                  De: R$ {(product.originalPrice || (Math.round((product.price * 2.5) / 10) * 10)).toFixed(2)}
                </span>
                <span className="text-[10px] text-[#39ff14] font-semibold uppercase tracking-wider animate-pulse">
                  Desconto Modivah ✨
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-mono text-amber-300 font-bold tracking-tight">R$ {product.price.toFixed(2)}</span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Pagamento via PIX
                </span>
              </div>
            </div>

            {/* Specifications Box */}
            <div className="space-y-3 bg-white/[0.02] border border-white/5 p-4 rounded-xl mb-6">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-neutral-500 font-light block">Tamanho</span>
                  <span className="text-white font-medium">{product.size}</span>
                </div>
                <div>
                  <span className="text-neutral-500 font-light block">Material</span>
                  <span className="text-white font-medium">{product.material}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-white/5">
                <div>
                  <span className="text-neutral-500 font-light block">Categoria</span>
                  <span className="text-white font-medium">{product.category}</span>
                </div>
                <div>
                  <span className="text-amber-300 font-bold block uppercase tracking-wider text-[9px]">Código SKU</span>
                  <span className="text-amber-300 font-mono font-bold text-xs">
                    {product.sku || 'M-' + product.id.replace('prod-', '').toUpperCase().padStart(4, '0')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-white/5">
                <div>
                  <span className="text-neutral-500 font-light block">Condição de Envio</span>
                  <span className="text-white font-medium">Imediato (Curadoria Pronta)</span>
                </div>
                <div>
                  <span className="text-neutral-500 font-light block">Garantia</span>
                  <span className="text-emerald-400 font-medium">Curadoria Premium Modivah</span>
                </div>
              </div>
              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium">Quantidade Disponível:</span>
                <span className="text-amber-300 font-bold font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {product.stock <= 0 ? (
                    <span className="text-red-400">ESGOTADO VENDIDO</span>
                  ) : product.stock === 1 ? (
                    'Apenas 1 (Peça Exclusiva)'
                  ) : (
                    `${product.stock} peças em estoque`
                  )}
                </span>
              </div>
            </div>

            {/* Rich Narrative / Description */}
            <div className="mb-6">
              <h4 className="text-xs text-neutral-300 uppercase tracking-wider font-semibold mb-2">História & Curadoria</h4>
              <p className="text-xs text-neutral-400 leading-relaxed font-light mb-3 text-justify">
                {product.description} Nossas peças passam por processos ecologicamente corretos de higienização e revitalização de fibras. Ao adquirir, você apoia o ciclo sustentável da moda com integridade.
              </p>

              {/* Video representation if exists */}
              {product.video && product.video.trim() !== '' && (
                <div className="mt-4 bg-black/50 rounded-xl overflow-hidden border border-white/5">
                  <span className="text-[9px] text-amber-300 font-mono font-semibold tracking-wider bg-amber-500/10 px-2 py-1 block border-b border-white/5 uppercase">
                    Apresentação em Vídeo 📽️
                  </span>
                  <div className="relative aspect-video bg-neutral-950">
                    {product.video.includes('youtube') || product.video.includes('youtu.be') ? (
                      <iframe
                        src={product.video.includes('watch?v=') 
                          ? product.video.replace('watch?v=', 'embed/').split('&')[0]
                          : product.video.includes('youtu.be/') 
                            ? `https://www.youtube.com/embed/${product.video.split('youtu.be/')[1]}`
                            : product.video
                        }
                        title={product.title}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={product.video}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        playsInline
                        muted
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="space-y-3 pt-4 border-t border-white/5">
            {isAvailable ? (
              showDirectForm ? (
                <div className="bg-neutral-950 p-4 rounded-xl border border-amber-500/30 space-y-3 animate-in fade-in slide-in-from-bottom duration-200">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                      Atendimento WhatsApp
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDirectForm(false)}
                      className="text-[9px] text-neutral-400 hover:text-white underline uppercase tracking-wider font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={handleDirectWhatsAppSubmit} className="space-y-3 text-left">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                        placeholder="Ex: CLAUDIO SILVA"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-neutral-400 block mb-1">Telefone / Whats</label>
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                          placeholder="Ex: 27988226654"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-neutral-400 block mb-1">Seu Objetivo</label>
                        <select
                          value={interactionType}
                          onChange={(e) => setInteractionType(e.target.value as 'compra' | 'duvida')}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                        >
                          <option className="bg-neutral-900 text-white" value="compra">Reservar Peça 🛍️</option>
                          <option className="bg-neutral-900 text-white" value="duvida">Tirar Dúvida ❓</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Endereço Completo</label>
                      <textarea
                        rows={2}
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 leading-normal resize-none font-light"
                        placeholder="RUA DA VITORIA, 914, PRESIDENTE MEDICE, CARIACICA-ES"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95 duration-250"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Gerar Recibo e Enviar ➔</span>
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onAddToCart(product);
                        onClose();
                      }}
                      className="py-3 px-3 bg-white hover:bg-neutral-100 text-black text-xs font-semibold uppercase tracking-wider rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      <span>Colocar no Carrinho</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setInteractionType('compra');
                        setShowDirectForm(true);
                      }}
                      className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5"
                      title="Reservar rápido pelo WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Comprar por Whats 📲</span>
                    </button>
                  </div>

                  {/* Question CTA button */}
                  <button
                    onClick={() => {
                      setInteractionType('duvida');
                      setShowDirectForm(true);
                    }}
                    className="w-full py-2 border border-white/10 hover:border-amber-500/40 text-neutral-400 hover:text-amber-300 text-[10px] uppercase font-bold tracking-widest rounded-lg transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>Dúvida? Perguntar à Atendente sobre esta Peça 💬</span>
                  </button>

                  <div className="flex items-center gap-2 text-[10px] text-neutral-500 justify-center pt-1.5">
                    <Shield className="h-3 w-3 text-neutral-500 shrink-0" />
                    <span>Curadoria Modivah: Peça legítima e fotos reais</span>
                  </div>
                </>
              )
            ) : (
              <div className="w-full py-3.5 px-4 bg-red-650 border border-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg text-center select-none bg-red-600 shadow-lg">
                poxa, você perdeu essa, já foi vendido. 💔
              </div>
            )}

            {/* Prominent Back Button (Botão Voltar) */}
            <button
              onClick={onClose}
              className="w-full py-3 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>← Voltar para a Loja</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
