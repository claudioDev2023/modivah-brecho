import React, { useState, useRef, useEffect } from 'react';
import { X, ShoppingBag, MessageSquare, Shield, HelpCircle, Sparkles, Play, Video } from 'lucide-react';
import { Product } from '../types';

function getEmbeddableVideo(url: string) {
  const normalized = url.trim();
  
  if (!normalized) {
    return { type: 'external' as const, url: '' };
  }

  // 1. YouTube & YouTube Shorts
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) {
    let id = '';
    if (normalized.includes('watch?v=')) {
      id = normalized.split('watch?v=')[1]?.split('&')[0];
    } else if (normalized.includes('youtu.be/')) {
      id = normalized.split('youtu.be/')[1]?.split('?')[0];
    } else if (normalized.includes('/shorts/')) {
      id = normalized.split('/shorts/')[1]?.split('?')[0];
    } else if (normalized.includes('/embed/')) {
      id = normalized.split('/embed/')[1]?.split('?')[0];
    }
    
    if (id) {
      // Build a modern, autoplaying, looping, muted YouTube player URL for best results in ads
      const embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=1&playsinline=1&rel=0&showinfo=0&modestbranding=1`;
      return { type: 'iframe' as const, url: embedUrl };
    }
  }

  // 2. Instagram (Reels & Posts)
  if (normalized.includes('instagram.com')) {
    let id = '';
    if (normalized.includes('/p/')) {
      id = normalized.split('/p/')[1]?.split('/')[0];
    } else if (normalized.includes('/reels/')) {
      id = normalized.split('/reels/')[1]?.split('/')[0];
    } else if (normalized.includes('/reel/')) {
      id = normalized.split('/reel/')[1]?.split('/')[0];
    } else if (normalized.includes('/tv/')) {
      id = normalized.split('/tv/')[1]?.split('/')[0];
    }
    
    if (id) {
      // Instagram's official iframe embedding endpoint
      const embedUrl = `https://www.instagram.com/p/${id}/embed/`;
      return { type: 'iframe' as const, url: embedUrl };
    }
  }

  // 3. TikTok
  if (normalized.includes('tiktok.com')) {
    let id = '';
    if (normalized.includes('/video/')) {
      id = normalized.split('/video/')[1]?.split('?')[0];
    }
    
    if (id) {
      // TikTok official embed URL: works perfectly in iframe
      const embedUrl = `https://www.tiktok.com/embed/v2/${id}`;
      return { type: 'iframe' as const, url: embedUrl };
    }
  }

  // 4. Facebook Watch & General Video
  if (normalized.includes('facebook.com') || normalized.includes('fb.watch')) {
    // Return the Facebook official embedded video player plugin
    const embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(normalized)}&show_text=0&autoplay=1&mute=1`;
    return { type: 'iframe' as const, url: embedUrl };
  }

  // 5. Vimeo
  if (normalized.includes('vimeo.com')) {
    let id = '';
    if (normalized.includes('player.vimeo.com/video/')) {
      id = normalized.split('player.vimeo.com/video/')[1]?.split('?')[0];
    } else {
      id = normalized.split('vimeo.com/')[1]?.split('?')[0]?.split('#')[0];
    }
    
    if (id) {
      const embedUrl = `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=0&playsinline=1`;
      return { type: 'iframe' as const, url: embedUrl };
    }
  }

  // 6. Google Drive / Docs
  if (normalized.includes('drive.google.com') || normalized.includes('docs.google.com')) {
    let fileId: string | null = null;
    if (normalized.includes('/file/d/')) {
      fileId = normalized.split('/file/d/')[1]?.split('/')[0] || null;
    } else if (normalized.includes('id=')) {
      fileId = normalized.split('id=')[1]?.split('&')[0] || null;
    } else if (normalized.includes('/open?id=')) {
      fileId = normalized.split('/open?id=')[1]?.split('&')[0] || null;
    }
    
    if (fileId) {
      return { type: 'iframe' as const, url: `https://drive.google.com/file/d/${fileId}/preview` };
    }
  }

  // 7. Dropbox
  if (normalized.includes('dropbox.com')) {
    const rawUrl = normalized
      .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
      .replace('?dl=0', '?raw=1')
      .replace('&dl=0', '&raw=1');
    return { type: 'native' as const, url: rawUrl };
  }

  // 8. Direct Local Native Video formats (MP4, raw data/base64, local files etc)
  const isDirectVideo = 
    normalized.startsWith('/') || 
    normalized.startsWith('data:video') || 
    normalized.toLowerCase().includes('.mp4') || 
    normalized.toLowerCase().includes('.mov') || 
    normalized.toLowerCase().includes('.webm') ||
    normalized.toLowerCase().includes('.m4v') ||
    normalized.toLowerCase().includes('.ogv') ||
    normalized.toLowerCase().includes('video/') ||
    normalized.toLowerCase().includes('assets.mixkit.co');

  if (isDirectVideo) {
    return { type: 'native' as const, url: normalized };
  }

  // Default fallback
  return { type: 'external' as const, url: normalized };
}

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
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Callback ref guarantees autoplay is triggered as soon as the element mounts to the DOM
  const videoRefCallback = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) {
      el.muted = true;
      el.playsInline = true;
      el.autoplay = true;
      el.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.log("Autoplay started dynamically or requires user tap: ", err);
          setIsPlaying(false);
        });
    }
  };

  const [lastProduct, setLastProduct] = useState<Product | null>(null);

  // Sync last non-null product so we can keep modal DOM mounted even when closed
  useEffect(() => {
    if (product) {
      setLastProduct(product);
      setActiveImageIndex(0); // Reset thumbs on change
    }
  }, [product]);

  const activeProduct = product || lastProduct;

  // Pause video if modal is closed
  useEffect(() => {
    if (!product && videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (err) {
        console.warn(err);
      }
      setIsPlaying(false);
    }
  }, [product]);

  if (!activeProduct) return null;

  const isVisible = !!product;
  const isAvailable = activeProduct.status === 'available' && activeProduct.stock > 0;
  const isSold = activeProduct.status === 'sold' || activeProduct.stock <= 0;

  // Build list of all images: first is activeProduct.image, then any in activeProduct.images
  const allImages = [activeProduct.image, ...(activeProduct.images || [])]
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .slice(0, 10);

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn("Play execution aborted or failed to launch:", err);
      });
    }
  };

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
    <div className={`fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 py-6 md:py-10 ${isVisible ? '' : 'hidden pointer-events-none'}`}>
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
        <div className="w-full flex flex-col h-[320px] sm:h-[450px] md:h-[500px] shrink-0 relative z-0 bg-neutral-950 overflow-hidden rounded-t-2xl">
          
          {/* Main Selected Image */}
          <div className="flex-1 relative h-full w-full overflow-hidden flex items-center justify-center bg-black">
            <img
              src={allImages[activeImageIndex] || activeProduct.image}
              alt={activeProduct.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain bg-neutral-950 transition-all duration-300"
            />
            {activeProduct.tag && (
              <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-amber-500 font-semibold text-black text-[10px] uppercase tracking-widest rounded-full">
                {activeProduct.tag}
              </span>
            )}
            {isSold && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-[2.5px] flex items-center justify-center p-0 overflow-hidden z-10">
                <div className="w-full bg-red-650 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider py-4 border-y border-red-500 shadow-2xl text-center select-none px-4 transform -rotate-12 scale-110 bg-red-600">
                  poxa, você perdeu essa, já foi vendido. 💔
                </div>
              </div>
            )}

            {/* Responsive glass horizontal carousel for thumbs */}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/65 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 max-w-[90%] overflow-x-auto select-none no-scrollbar">
                {allImages.map((imgUrl, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-9 h-9 rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer shrink-0 ${
                      activeImageIndex === idx 
                        ? 'border-amber-500 bg-amber-500/10 scale-105' 
                        : 'border-white/20 hover:border-white/50'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${activeProduct.title} vista ${idx + 1}`}
                      className="w-full h-full object-contain bg-neutral-900"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Info Panel (Bottom) */}
        <div className="w-full p-5 sm:p-6 md:p-8 flex flex-col justify-between overflow-visible relative z-10 bg-neutral-900" id="modal-product-details">
          
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
                <span className="text-xs text-neutral-500 line-through font-mono">
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
                  <span className="text-neutral-500 font-light block">Tamanho</span>
                  <span className="text-white font-medium">{activeProduct.size}</span>
                </div>
                <div>
                  <span className="text-neutral-500 font-light block">Material</span>
                  <span className="text-white font-medium">{activeProduct.material}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-2.5 border-t border-white/5">
                <div>
                  <span className="text-neutral-500 font-light block">Categoria</span>
                  <span className="text-white font-medium">{activeProduct.category}</span>
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
              <p className="text-xs text-neutral-400 leading-relaxed font-light mb-3 text-justify">
                {activeProduct.description} Nossas peças passam por processos ecologicamente corretos de higienização e revitalização de fibras. Ao adquirir, você apoia o ciclo sustentável da moda com integridade.
              </p>

              {/* Video representation if exists */}
              {activeProduct.video && activeProduct.video.trim() !== '' && (() => {
                const videoData = getEmbeddableVideo(activeProduct.video);
                return (
                  <div className="mt-4 overflow-hidden rounded-xl border border-white/5 bg-[#000]">
                    <span className="text-[9px] text-amber-300 font-mono font-semibold tracking-wider bg-amber-500/10 px-2.5 py-1.5 block border-b border-white/5 uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                      Apresentação em Vídeo Premium 📽️
                    </span>

                    {videoData.type === 'iframe' && (
                      <div>
                        <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                          <iframe
                            src={videoData.url}
                            title={activeProduct.title}
                            className="absolute inset-0 w-full h-full border-0 select-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                          {/* Direct fallback trigger for cross-origin preview constraints */}
                          <div className="absolute bottom-2 right-2 z-20">
                            <a 
                              href={activeProduct.video} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="bg-black/85 hover:bg-black text-amber-300 hover:text-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-white/10 transition-all shadow-md active:scale-95"
                            >
                              Abrir no YouTube ➔
                            </a>
                          </div>
                        </div>
                        {/* Guia de Resolução para YouTube Erro 150/153 */}
                        <div className="bg-amber-500/5 p-3.5 border-t border-white/5 space-y-2 text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              ⚠️ Vídeo com erro "Veja no YouTube" ou "Erro 153"?
                            </span>
                            <a 
                              href={activeProduct.video} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-block text-[9px] text-center bg-red-650 hover:bg-red-600 text-white font-bold py-1 px-2.5 rounded uppercase tracking-wider shadow-sm transition active:scale-95 bg-red-600"
                            >
                              Abrir e Assistir no YouTube
                            </a>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-light leading-relaxed">
                            No YouTube, o erro 150/153 ocorre quando o dono do vídeo <strong>desativou a reprodução integrada em outros aplicativos</strong>.
                          </p>
                          <div className="bg-neutral-950 p-2.5 rounded border border-white/5 space-y-1">
                            <p className="text-[9px] text-[#39ff14] font-semibold uppercase tracking-wider">Como resolver hoje no seu YouTube Studio:</p>
                            <ol className="list-decimal list-inside text-[9px] text-zinc-300 space-y-1 leading-normal">
                              <li>Acesse seu canal do <strong>YouTube Studio</strong> e abra os Detalhes do vídeo.</li>
                              <li>Role a página até a opção <strong>"Permitir incorporação"</strong> (geralmente sob "Mostrar Mais").</li>
                              <li>Marque essa caixa e clique em <strong>Salvar</strong>. Pronto! O vídeo passará a rodar aqui imediatamente.</li>
                              <li><em>Recomendado:</em> Se preferir, você também pode fazer o upload do vídeo MP4 original direto pelo Painel.</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    )}

                    {videoData.type === 'native' && (
                      <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center" style={{ background: '#000' }}>
                        <video
                          key={activeProduct.video}
                          ref={videoRefCallback}
                          src={videoData.url}
                          width="100%"
                          height="auto"
                          controls
                          autoPlay
                          muted
                          playsInline
                          preload="auto"
                          loop
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onPlaying={() => setIsPlaying(true)}
                          className="w-full h-auto"
                          style={{
                            width: '100%',
                            height: 'auto',
                            objectFit: 'cover',
                            background: '#000'
                          }}
                        >
                          <source src={videoData.url} type="video/mp4" />
                          <source src={videoData.url} type="video/ogg" />
                          <source src={videoData.url} type="video/webm" />
                          Seu navegador não oferece suporte para visualização de vídeo local.
                        </video>
                        
                        {/* Play button overlay fallback */}
                        {!isPlaying && (
                          <button
                            onClick={handlePlayToggle}
                            className="absolute inset-0 m-auto w-14 h-14 bg-black/75 hover:bg-amber-500 text-amber-300 hover:text-black rounded-full border border-white/25 flex items-center justify-center transition-all duration-200 shadow-2xl active:scale-95 cursor-pointer z-10"
                            aria-label="Reproduzir vídeo"
                          >
                            <Play className="h-6 w-6 ml-0.5 fill-current" />
                          </button>
                        )}

                        {/* Elegant fallback helper info for iframe preview and codec support */}
                        <div className="absolute bottom-2 right-2 z-20 flex gap-1.5">
                          <a 
                            href={videoData.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-black/80 hover:bg-black text-amber-300 hover:text-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded border border-white/10 transition-all shadow-md active:scale-95"
                          >
                            Abrir Vídeo Original ➔
                          </a>
                        </div>
                      </div>
                    )}

                    {videoData.type === 'external' && (
                      <div className="p-5 flex flex-col items-center justify-center bg-zinc-950/80 border-t border-white/5 text-center space-y-2.5">
                        <Video className="h-6 w-6 text-amber-400 animate-pulse" />
                        <h5 className="text-[11px] text-white font-bold uppercase tracking-wider">Apresentação Externa Instalada 📱</h5>
                        <p className="text-[10px] text-neutral-400 max-w-[280px] leading-relaxed mx-auto">
                          Vídeo hospedado no Instagram, TikTok ou plataforma externa da grife. Toque no botão abaixo para assistir completo!
                        </p>
                        <a
                          href={activeProduct.video}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider py-1.5 px-3.5 rounded-lg shadow-md transition-all active:scale-[0.97]"
                        >
                          <span>Assistir Vídeo no App</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })()}
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
