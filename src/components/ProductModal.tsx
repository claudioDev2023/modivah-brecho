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
    text += `TAMANHO: ${activeProduct.size} | CONDIÇÃO: ${activeProduct.condition}\n`;
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
        className="fixed inset-0 bg-black/85 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col z-10 animate-in fade-in zoom-in duration-200 text-zinc-900">
        
        {/* Close Button inside modal header as fallback */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-2.5 bg-zinc-100 hover:bg-zinc-200 text-[#111111] rounded-full border border-zinc-200 transition cursor-pointer shadow-lg active:scale-95"
          aria-label="Voltar para a loja"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Product Image Panel (Top) */}
        <div className="w-full flex flex-col aspect-[4/5] shrink-0 relative bg-zinc-50 overflow-hidden rounded-t-2xl select-none group">
          
          {/* Main Selected Image */}
          <div className="flex-1 relative h-full w-full overflow-hidden flex items-center justify-center bg-zinc-100">
            {/* Intelligent Outpainted Concept Background Backdrop to prevent empty margins or white spaces */}
            <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none">
              <img
                src={allImages[activeImageIndex] || activeProduct.image}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover filter blur-[24px] opacity-55 scale-110 pointer-events-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Soft overlay to match light luxury presentation */}
              <div className="absolute inset-0 bg-white/45 pointer-events-none" />
            </div>

            <div className="w-full h-full overflow-hidden flex items-center justify-center relative z-10 p-1">
              <img
                src={allImages[activeImageIndex] || activeProduct.image}
                alt={activeProduct.title}
                referrerPolicy="no-referrer"
                className="transition-all duration-500 ease-out hover:scale-[1.12] cursor-zoom-in"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  display: 'block'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800";
                }}
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
                  className="absolute left-4 z-30 p-2.5 rounded-full bg-white/90 hover:bg-black hover:text-white text-black border border-zinc-250 transition-all shadow-lg active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 sm:opacity-100 duration-300"
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
                  className="absolute right-4 z-30 p-2.5 rounded-full bg-white/90 hover:bg-black hover:text-white text-black border border-zinc-250 transition-all shadow-lg active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100 sm:opacity-100 duration-300"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Premium Indicator Badge */}
            {allImages.length > 1 && (
              <div className="absolute top-4 right-14 z-20 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl border border-zinc-200 text-[10px] uppercase font-bold text-neutral-800 tracking-wider flex items-center gap-1.5 shadow-md">
                <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
                <span>Ver Fotos ({activeImageIndex + 1}/{allImages.length})</span>
              </div>
            )}

            {activeProduct.tag && (
              <span className="absolute top-4 left-4 z-10 px-3 py-1.5 bg-amber-500 font-bold text-black text-[11px] uppercase tracking-widest rounded-full shadow-lg">
                {activeProduct.tag}
              </span>
            )}
            
            {isSold && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-[2.5px] flex items-center justify-center p-0 overflow-hidden z-10">
                <div className="w-full bg-red-600 text-white text-base font-black uppercase tracking-wider py-4 border-y border-red-500 shadow-2xl text-center select-none px-4 transform -rotate-12 scale-110">
                  JÁ VENDIDO 💔
                </div>
              </div>
            )}

            {/* Responsive glass horizontal carousel for thumbs */}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-white/90 backdrop-blur-md px-3 py-2 rounded-xl border border-zinc-250 max-w-[90%] overflow-x-auto select-none no-scrollbar shadow-lg">
                {allImages.map((imgUrl, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setActiveImageIndex(idx);
                    }}
                    className={`w-9 h-9 rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer shrink-0 ${
                      activeImageIndex === idx 
                        ? 'border-amber-600 bg-amber-500/10 scale-105' 
                        : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${activeProduct.title} vista ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Info Panel (Bottom) */}
        <div className="w-full p-6 sm:p-8 flex flex-col justify-between overflow-visible bg-white text-zinc-900" id="modal-product-details">
          
          <div>
            {/* Quick mobile-only back link to prevent scrolling downwards */}
            <button
              onClick={onClose}
              className="md:hidden w-full py-3.5 bg-zinc-100 hover:bg-zinc-200 text-[#111111] border border-zinc-250 rounded-xl text-base font-bold uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer mb-5"
            >
              <span>← Voltar para a Loja</span>
            </button>
            {/* Condition badge only */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-neutral-600 bg-zinc-50 px-3 py-1.5 rounded border border-zinc-200 font-medium">
                Estado: {activeProduct.condition}
              </span>
            </div>

            {/* Product Title - MINIMUM 18px */}
            <h2 className="text-2xl md:text-3xl font-sans font-bold text-[#111111] mb-4 leading-tight">
              {activeProduct.title}
            </h2>

            {/* Price section - MINIMUM 22px */}
            {(() => {
              const origVal = Number(activeProduct.originalPrice) || (Math.round((Number(activeProduct.price) * 2.5) / 10) * 10);
              const maxSavingsVal = Math.max(0, origVal - Number(activeProduct.price));
              const percentVal = Math.max(1, Math.min(99, Math.round((maxSavingsVal / origVal) * 100)));
              return (
                <div className="flex flex-col mb-6 space-y-1.5">
                  <div className="flex items-baseline gap-3">
                    <span className="text-[#DC2626] line-through font-mono font-bold text-base sm:text-lg">
                      De: R$ {origVal.toFixed(2)}
                    </span>
                    <span className="text-xs text-emerald-650 font-bold uppercase tracking-wider bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                      Desconto Especial ✨
                    </span>
                  </div>
                  <div className="flex flex-wrap items-baseline gap-2 mt-1">
                    <span className="text-3xl md:text-4xl font-mono text-[#0fa33a] font-black tracking-tight block">
                      Por: R$ {Number(activeProduct.price).toFixed(2)}
                    </span>
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Pagamento via PIX
                    </span>
                  </div>
                  {maxSavingsVal > 0 && (
                    <div className="flex items-center gap-1 text-xs font-black text-[#0ea137] bg-emerald-50 border border-emerald-150 px-3 py-2 rounded-xl w-fit uppercase tracking-widest mt-2">
                      <span>✨ Você economiza R$ {maxSavingsVal.toFixed(2)} ({percentVal}% OFF)</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Specifications Box - MINIMUM 16px texts */}
            <div className="space-y-4 bg-zinc-50 border border-zinc-200 p-5 rounded-xl mb-6">
              <div className="grid grid-cols-2 gap-4 text-base">
                <div>
                  <span className="text-[#444444] font-medium block text-xs uppercase tracking-wider">Tamanho</span>
                  <span className="text-[#111111] font-bold text-lg">{activeProduct.size}</span>
                </div>
                <div>
                  <span className="text-[#444444] font-medium block text-xs uppercase tracking-wider">Categoria</span>
                  <span className="text-[#111111] font-bold text-lg">{activeProduct.category}</span>
                </div>
              </div>
              <div className="pt-3.5 border-t border-zinc-200 flex flex-col gap-2 text-base">
                <span className="text-[#222222] font-semibold text-sm uppercase tracking-wider">Disponibilidade</span>
                
                {(() => {
                  if (activeProduct.stock <= 0) {
                    return (
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-650 text-xs font-bold rounded-lg leading-relaxed shadow-sm">
                        <span>❌</span>
                        <span>Estoque Esgotado</span>
                      </div>
                    );
                  }
                  if (activeProduct.stock <= 5) {
                    const textFormatted = activeProduct.stock === 1 
                      ? "🔥 Última unidade disponível (Resta apenas 1!)" 
                      : `🔥 Últimas ${activeProduct.stock} unidades disponíveis`;
                    return (
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-xs font-extrabold rounded-lg leading-relaxed shadow-sm animate-pulse uppercase tracking-wider">
                        <span>{textFormatted}</span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold rounded-lg leading-relaxed shadow-sm">
                      <span>📦</span>
                      <span>Restam apenas {activeProduct.stock} unidades em estoque</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Rich Narrative / Description - MINIMUM 16px */}
            <div className="mb-6">
              <h4 className="text-sm text-[#111111] uppercase tracking-wider font-bold mb-2">Descrição do Produto</h4>
              <p className="text-base text-[#222222] leading-relaxed mb-3 text-justify whitespace-pre-line font-normal">
                {activeProduct.description}
              </p>
            </div>
          </div>

          {/* Action Footer - MINIMUM 16px buttons and forms */}
          <div className="space-y-3 pt-4 border-t border-zinc-150">
            {isAvailable ? (
              showDirectForm ? (
                <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 space-y-4 animate-in fade-in slide-in-from-bottom duration-200">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <span className="text-xs font-bold text-neutral-800 uppercase tracking-widest flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4 text-amber-600 animate-pulse" />
                      Atendimento WhatsApp
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDirectForm(false)}
                      className="text-xs text-neutral-500 hover:text-black underline uppercase tracking-wider font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={handleDirectWhatsAppSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="text-xs text-[#222222] font-semibold block mb-1">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-base text-zinc-900 focus:outline-none focus:border-amber-500 font-semibold"
                        placeholder="Ex: CLAÚDIA SILVA"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[#222222] font-semibold block mb-1">Telefone / Whats</label>
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-base text-zinc-900 focus:outline-none focus:border-amber-500 font-mono"
                          placeholder="Ex: 27988226654"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#222222] font-semibold block mb-1">Seu Objetivo</label>
                        <select
                          value={interactionType}
                          onChange={(e) => setInteractionType(e.target.value as 'compra' | 'duvida')}
                          className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-base text-zinc-900 focus:outline-none focus:border-amber-500 font-medium"
                        >
                          <option value="compra">Reservar Peça 🛍️</option>
                          <option value="duvida">Tirar Dúvida ❓</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-[#222222] font-semibold block mb-1">Endereço Completo</label>
                      <textarea
                        rows={2}
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-base text-zinc-900 focus:outline-none focus:border-amber-500 leading-normal resize-none font-normal"
                        placeholder="RUA DA VITÓRIA, 914, PRESIDENTE MEDICI, CARIACICA-ES"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-base font-bold uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95 duration-250"
                    >
                      <MessageSquare className="h-5 w-5" />
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
                      className="py-4 px-3 bg-[#39ff14] hover:bg-[#2ee60d] text-black text-[13px] sm:text-base font-black uppercase tracking-wider rounded-lg cursor-pointer transition flex items-center justify-center gap-2 animate-pulse-scale shadow-lg shadow-[#39ff14]/15"
                    >
                      <ShoppingBag className="h-5 w-5 stroke-[3]" />
                      <span>Colocar no Carrinho</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setInteractionType('compra');
                        setShowDirectForm(true);
                      }}
                      className="py-4 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] sm:text-base font-bold uppercase tracking-wider rounded-lg cursor-pointer transition flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] duration-150"
                      title="Reservar rápido pelo WhatsApp"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>Comprar por Whats 📲</span>
                    </button>
                  </div>

                  {/* Question CTA button */}
                  <button
                    onClick={() => {
                      setInteractionType('duvida');
                      setShowDirectForm(true);
                    }}
                    className="w-full py-3.5 border border-zinc-300 hover:border-amber-500/50 text-neutral-600 hover:text-amber-700 text-sm uppercase font-bold tracking-widest rounded-lg transition duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Dúvida? Perguntar à Atendente sobre esta Peça 💬</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs text-neutral-500 justify-center pt-1.5">
                    <Shield className="h-4.5 w-4.5 text-neutral-500 shrink-0" />
                    <span>Curadoria Modivah: Peça legítima e fotos reais</span>
                  </div>
                </>
              )
            ) : (
              <div className="w-full py-4 px-4 bg-red-650 border border-red-500 text-white text-base font-bold uppercase tracking-wider rounded-lg text-center select-none bg-red-600 shadow-lg">
                JÁ VENDIDO. 💔
              </div>
            )}

            {/* Prominent Back Button (Botão Voltar) */}
            <button
              onClick={onClose}
              className="w-full py-4 bg-zinc-100 hover:bg-zinc-200 text-[#111111] border border-zinc-300 rounded-xl text-base font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer mt-4 duration-200 shadow-md"
            >
              <span>← Voltar para a Loja</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
