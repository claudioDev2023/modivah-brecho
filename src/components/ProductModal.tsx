import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, MessageSquare, Shield, HelpCircle, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { Product } from '../types';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  initialViewMode?: 'image' | 'video'; // kept for backward compatibility signature
}

export default function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showDirectForm, setShowDirectForm] = useState(false);
  const [clientName, setClientName] = useState(() => localStorage.getItem('modivah_client_name') || 'CLAUDIO SILVA');
  const [clientPhone, setClientPhone] = useState(() => localStorage.getItem('modivah_client_phone') || '27988226654');
  const [address, setAddress] = useState(() => localStorage.getItem('modivah_client_address') || 'RUA DA VITORIA, 914, PRESIDENTE MEDICE, CARIACICA-ES');
  const [interactionType, setInteractionType] = useState<'compra' | 'duvida'>('compra');

  const [lastProduct, setLastProduct] = useState<Product | null>(null);

  // Sync last non-null product so we can keep modal DOM mounted even when closed
  useEffect(() => {
    if (product) {
      setLastProduct(product);
      setActiveImageIndex(0); // Reset thumbs on change
    }
  }, [product]);

  const activeProduct = product || lastProduct;

  if (!activeProduct) return null;

  const isVisible = !!product;
  const isSold = activeProduct.stock <= 0;
  const isReserved = activeProduct.status === 'reserved' && !isSold;
  const isAvailable = activeProduct.stock > 0 && !isReserved;

  // Build list of all images: first is activeProduct.image, then any in activeProduct.images
  const allImages = [activeProduct.image, ...(activeProduct.images || [])]
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .slice(0, 10);

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

    const productSku = activeProduct.sku || 'M-' + String(activeProduct.id).replace('prod-', '').toUpperCase().padStart(4, '0');
    
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
    text += `PEÇA: ${activeProduct.title}\n`;
    text += `SKU : ${productSku}\n`;
    text += `MARCA: ${activeProduct.brand} | TAMANHO: ${activeProduct.size}\n`;
    text += `MATERIAL: ${activeProduct.material} | CONDIÇÃO: ${activeProduct.condition}\n`;
    text += `VALOR DA PEÇA: R$ ${Number(activeProduct.price).toFixed(2)}\n`;
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
    <div id="product-modal-scroll" className={`fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 py-6 md:py-10 ${isVisible ? '' : 'hidden pointer-events-none'}`}>
      {/* Dark backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in duration-200">
        
        {/* Close Button inside modal header as fallback */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-2 bg-neutral-950/95 backdrop-blur-md hover:bg-white text-white hover:text-black rounded-full border border-white/15 transition cursor-pointer shadow-lg active:scale-95"
          aria-label="Voltar para a loja"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Product Image Panel (Top) */}
        <div className="w-full flex flex-col aspect-square shrink-0 relative bg-black overflow-hidden rounded-t-2xl select-none group">
          
          {/* Main Selected Image */}
          <div className="flex-1 relative h-full w-full overflow-hidden flex items-center justify-center bg-black">
            <div className="w-full h-full overflow-hidden flex items-center justify-center">
              <img
                src={allImages[activeImageIndex] || activeProduct.image}
                alt={activeProduct.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain bg-black transition-all duration-500 ease-out hover:scale-[1.15] cursor-zoom-in"
              />
            </div>

            {/* Premium Arrow Navigation Controls (Slider) */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
                  }}
                  className="absolute left-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black text-white border border-white/10 hover:border-amber-400 transition-all shadow-lg active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 sm:opacity-100 duration-300"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev + 1) % allImages.length);
                  }}
                  className="absolute right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-amber-500 hover:text-black text-white border border-white/10 hover:border-amber-400 transition-all shadow-lg active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 sm:opacity-100 duration-300"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Premium Indicator Badge */}
            {allImages.length > 1 && (
              <div className="absolute top-4 right-14 z-20 px-3 py-1 bg-black/75 backdrop-blur-md rounded-xl border border-white/10 text-[9px] uppercase font-black text-amber-300 tracking-wider flex items-center gap-1.5 shadow-md">
                <ImageIcon className="h-3 w-3 text-amber-400" />
                <span>Ver Fotos ({activeImageIndex + 1}/{allImages.length})</span>
              </div>
            )}

            {activeProduct.tag && (
              <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-amber-500 font-semibold text-black text-[10px] uppercase tracking-widest rounded-full shadow-lg">
                {activeProduct.tag}
              </span>
            )}
            
            {isSold && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-[2.5px] flex items-center justify-center p-0 overflow-hidden z-10">
                <div className="w-full bg-red-600 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider py-4 border-y border-red-500 shadow-2xl text-center select-none px-4 transform -rotate-12 scale-110">
                  POXA, VOCÊ PERDEU ESSA, JÁ FOI VENDIDO. 💔
                </div>
              </div>
            )}

            {/* Responsive glass horizontal carousel for thumbs */}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 max-w-[90%] overflow-x-auto select-none no-scrollbar">
                {allImages.map((imgUrl, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setActiveImageIndex(idx);
                    }}
                    className={`w-9 h-9 rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer shrink-0 ${
                      activeImageIndex === idx 
                        ? 'border-amber-500 bg-amber-500/10 scale-105' 
                        : 'border-white/20 hover:border-white/50'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${activeProduct.title} vista ${idx + 1}`}
                      className="w-full h-full object-contain bg-black"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Info Panel (Bottom) */}
        <div className="w-full p-5 sm:p-6 md:p-8 flex flex-col justify-between overflow-visible bg-neutral-900" id="modal-product-details">
          
          <div>
            {/* Quick mobile-only back link to prevent scrolling downwards */}
            <button
              onClick={onClose}
              className="md:hidden w-full py-3 bg-neutral-950 hover:bg-neutral-900 text-amber-300 hover:text-white border border-white/5 rounded-xl text-xs font-semibold uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer mb-5"
            >
              <span>← Voltar para a Loja</span>
            </button>
            {/* Brand + Condition tags */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-amber-300 font-mono font-semibold tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                {activeProduct.brand}
              </span>
              <span className="text-[10px] text-neutral-400 bg-white/5 px-2.5 py-0.5 rounded border border-white/5">
                Estado: {activeProduct.condition}
              </span>
            </div>

            {/* Product Title */}
            <h2 className="text-xl md:text-2xl font-sans font-light text-white mb-4 leading-tight">
              {activeProduct.title}
            </h2>

            {/* Price section */}
            <div className="flex flex-col mb-6">
              <div className="flex items-baseline gap-3">
                <span className="text-xs text-neutral-400 line-through font-mono">
                  De: R$ {(Number(activeProduct.originalPrice) || (Math.round((Number(activeProduct.price) * 2.5) / 10) * 10)).toFixed(2)}
                </span>
                <span className="text-[10px] text-[#39ff14] font-semibold uppercase tracking-wider animate-pulse">
                  Desconto Modivah ✨
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-mono text-amber-300 font-bold tracking-tight">R$ {Number(activeProduct.price).toFixed(2)}</span>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Pagamento via PIX
                </span>
              </div>
            </div>

            {/* Specifications Box */}
            <div className="space-y-3 bg-zinc-950 border border-zinc-805 p-4 rounded-xl mb-6">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-neutral-400 font-medium block">Tamanho</span>
                  <span className="text-white font-semibold">{activeProduct.size}</span>
                </div>
                <div>
                  <span className="text-neutral-400 font-medium block">Material</span>
                  <span className="text-white font-semibold">{activeProduct.material}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-white/5">
                <div>
                  <span className="text-neutral-400 font-medium block">Categoria</span>
                  <span className="text-white font-semibold">{activeProduct.category}</span>
                </div>
                <div>
                  <span className="text-amber-300 font-bold block uppercase tracking-wider text-[9px]">Código SKU</span>
                  <span className="text-amber-300 font-mono font-bold text-xs">
                    {activeProduct.sku || 'M-' + String(activeProduct.id).replace('prod-', '').toUpperCase().padStart(4, '0')}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-white/5">
                <div>
                  <span className="text-neutral-400 font-medium block">Condição de Envio</span>
                  <span className="text-white font-semibold">Imediato (Curadoria Pronta)</span>
                </div>
                <div>
                  <span className="text-neutral-400 font-medium block">Garantia</span>
                  <span className="text-emerald-400 font-semibold">Curadoria Premium Modivah</span>
                </div>
              </div>
              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium">Quantidade Disponível:</span>
                <span className="text-amber-300 font-bold font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {activeProduct.stock <= 0 ? (
                    <span className="text-red-400">ESGOTADO VENDIDO</span>
                  ) : activeProduct.stock === 1 ? (
                    'Apenas 1 (Peça Exclusiva)'
                  ) : (
                    `${activeProduct.stock} peças em estoque`
                  )}
                </span>
              </div>
            </div>

            {/* Rich Narrative / Description */}
            <div className="mb-6">
              <h4 className="text-xs text-neutral-300 uppercase tracking-wider font-semibold mb-2">História & Curadoria</h4>
              <p className="text-xs text-zinc-100 leading-relaxed mb-3 text-justify">
                {activeProduct.description} Nossas peças passam por processos ecologicamente corretos de higienização e revitalização de fibras. Ao adquirir, você apoia o ciclo sustentável da moda com integridade.
              </p>
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
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95 duration-250 animate-pulse-scale"
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
                        onAddToCart(activeProduct);
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
                      className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold uppercase tracking-wider rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 animate-pulse-scale"
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
                POXA, VOCÊ PERDEU ESSA, JÁ FOI VENDIDO. 💔
              </div>
            )}

            {/* Prominent Back Button (Botão Voltar) */}
            <button
              onClick={onClose}
              className="w-full py-3.5 bg-neutral-950 hover:bg-neutral-900 text-amber-300 hover:text-white border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer mt-4 duration-200 shadow-md"
            >
              <span>← Voltar para a Loja</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
