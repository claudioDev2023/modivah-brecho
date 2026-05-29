import React, { useState, useRef, useEffect } from 'react';
import { X, ShoppingBag, MessageSquare, Shield, HelpCircle, Sparkles, Play, Video } from 'lucide-react';
import { Product } from '../types';

function getVideoMimeType(url: string) {
  const lower = url.toLowerCase();
  if (lower.includes('.mp4')) return 'video/mp4';
  if (lower.includes('.mov') || lower.includes('.quicktime')) return 'video/mp4';
  if (lower.includes('.webm')) return 'video/webm';
  if (lower.includes('.ogv') || lower.includes('.ogg')) return 'video/ogg';
  if (lower.includes('.m4v')) return 'video/mp4';
  return 'video/mp4';
}

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
    normalized.toLowerCase().includes('assets.mixkit.co') ||
    (!normalized.includes('youtube.com') && 
     !normalized.includes('youtu.be') && 
     !normalized.includes('instagram.com') && 
     !normalized.includes('tiktok.com') && 
     !normalized.includes('facebook.com') && 
     !normalized.includes('vimeo.com') && 
     !normalized.includes('drive.google.com') && 
     !normalized.includes('dropbox.com'));

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
  initialViewMode?: 'image' | 'video';
}

export default function ProductModal({ product, onClose, onAddToCart, initialViewMode = 'image' }: ProductModalProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showDirectForm, setShowDirectForm] = useState(false);
  const [viewMode, setViewMode] = useState<'image' | 'video'>(initialViewMode);
  const [clientName, setClientName] = useState(() => localStorage.getItem('modivah_client_name') || 'CLAUDIO SILVA');
  const [clientPhone, setClientPhone] = useState(() => localStorage.getItem('modivah_client_phone') || '27988226654');
  const [address, setAddress] = useState(() => localStorage.getItem('modivah_client_address') || 'RUA DA VITORIA, 914, PRESIDENTE MEDICE, CARIACICA-ES');
  const [interactionType, setInteractionType] = useState<'compra' | 'duvida'>('compra');
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoPlayError, setVideoPlayError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleChangeViewMode = (mode: 'image' | 'video') => {
    setViewMode(mode);
    setIsPlaying(false);
  };

  // Callback ref triggered when the video element mounts to the DOM
  const videoRefCallback = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el) {
      el.playsInline = true;
      el.setAttribute('playsinline', 'true');
      el.setAttribute('webkit-playsinline', 'true');
      el.preload = 'metadata';
    }
  };

  const [lastProduct, setLastProduct] = useState<Product | null>(null);

  // Sync last non-null product so we can keep modal DOM mounted even when closed
  useEffect(() => {
    if (product) {
      setLastProduct(product);
      setActiveImageIndex(0); // Reset thumbs on change
      setViewMode(initialViewMode);   // Reset to chosen mode when a new product is opened
      setVideoPlayError(false); // Reset video error for the new item!
      setIsPlaying(false); // Start as not playing preview/thumbnail
    }
  }, [product, initialViewMode]);

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
        <div className="w-full flex flex-col aspect-square shrink-0 relative bg-black overflow-hidden rounded-t-2xl">
          
          {/* Main Selected Image or Active In-App Video Player */}
          <div className="flex-1 relative h-full w-full overflow-hidden flex items-center justify-center bg-black">
            {viewMode === 'video' && activeProduct.video && activeProduct.video.trim() !== '' ? (
              <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center z-10">
                {!isPlaying ? (
                  /* 🎬 Video Cover Thumbnail View with centered Modern Play Button */
                  <div 
                    onClick={() => setIsPlaying(true)}
                    className="absolute inset-0 w-full h-full bg-black flex items-center justify-center cursor-pointer group/videothumb select-none"
                    title="Clique para reproduzir o vídeo"
                  >
                    <img 
                      src={activeProduct.image} 
                      alt={activeProduct.title} 
                      className="w-full h-full object-contain bg-black transition-all duration-350"
                      referrerPolicy="no-referrer"
                    />
                    {/* Glowing Overlay Centered Giant Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover/videothumb:bg-black/50 transition duration-300">
                      <div className="w-16 h-16 bg-black/90 text-[#39ff14] border border-[#39ff14]/30 rounded-full flex items-center justify-center shadow-[0_0_32px_rgba(57,255,20,0.4)] group-hover/videothumb:scale-110 active:scale-95 transition-all duration-300">
                        <Play className="h-7 w-7 ml-1 fill-current" />
                      </div>
                    </div>
                    
                    {/* Caption helper */}
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 px-3.5 py-1.5 rounded-xl text-[9px] text-[#39ff14] tracking-widest uppercase font-mono font-bold backdrop-blur-md shadow-2xl">
                      Clique para Reproduzir Vídeo 🎬
                    </div>
                  </div>
                ) : (
                  /* Play mode enabled: Render actual video components directly on click */
                  (() => {
                    const videoData = getEmbeddableVideo(activeProduct.video);
                    if (videoData.type === 'native') {
                      return !videoPlayError ? (
                        <video
                          key={`top-panel-video-${activeProduct.video}`}
                          ref={videoRefCallback}
                          src={videoData.url}
                          controls
                          autoPlay
                          playsInline
                          loop
                          preload="metadata"
                          className="w-full h-full object-contain bg-black rounded-2xl"
                          style={{
                            width: '100%',
                            height: '100%',
                            background: '#000',
                            objectFit: 'contain'
                          }}
                          onError={(e) => {
                            console.warn("Top-panel video failed:", e);
                            setVideoPlayError(true);
                          }}
                        >
                          <source src={videoData.url} type={getVideoMimeType(videoData.url)} />
                          Seu navegador não suporta reprodução de vídeo nativo.
                        </video>
                      ) : (
                        // Fallback visual to prevent black screen! Displays thumbnail and explicit CTA to play/open externally
                        <div className="absolute inset-0 w-full h-full bg-neutral-950 flex flex-col items-center justify-center relative">
                          <img 
                            src={activeProduct.image} 
                            alt={activeProduct.title} 
                            className="absolute inset-0 w-full h-full object-contain bg-black opacity-40 blur-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div className="z-10 text-center px-5 py-4 bg-black/85 rounded-2xl border border-white/10 m-4 max-w-xs shadow-2xl">
                            <Video className="h-9 w-9 text-amber-400 mx-auto mb-2 animate-pulse" />
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5">Vídeo não carregou no navegador</h4>
                            <p className="text-[10px] text-zinc-300 leading-relaxed mb-4">
                              Não se preocupe! Você pode abrir o vídeo original externamente em tela cheia ou continuar visualizando as fotos da peça.
                            </p>
                            <div className="flex flex-col gap-2.5 w-full">
                              <a
                                href={videoData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full text-center px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase tracking-wider rounded-xl transition active:scale-95 shadow-lg"
                              >
                                Abrir Vídeo Externo ➔
                              </a>
                              <div className="flex gap-2 w-full">
                                <button 
                                  onClick={() => {
                                    setVideoPlayError(false);
                                    setIsPlaying(false);
                                  }} 
                                  className="flex-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[9px] font-bold uppercase tracking-wider rounded-lg transition"
                                >
                                  Tentar Novamente
                                </button>
                                <button 
                                  onClick={() => handleChangeViewMode('image')} 
                                  className="flex-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider rounded-lg transition"
                                >
                                  Ver Fotos
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    } else if (videoData.type === 'iframe') {
                      return (
                        <div className="relative w-full h-full bg-[#000]">
                          <iframe
                            src={videoData.url + (videoData.url.includes('?') ? '&' : '?') + 'autoplay=1'}
                            title={activeProduct.title}
                            className="absolute inset-0 w-full h-full border-0 select-none z-10 bg-black"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-6 text-center space-y-4 max-w-sm mx-auto z-10">
                          <Video className="h-10 w-10 text-amber-300 mx-auto animate-pulse" />
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">Apresentação Externa Instalada 📱</h4>
                          <p className="text-[11px] text-zinc-400 leading-relaxed text-justify">
                            Este look possui vídeo hospedado fora do YouTube convencional (Instagram/TikTok). Clique abaixo para abrir direto no aplicativo:
                          </p>
                          <a
                            href={activeProduct.video}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider py-2 px-4 rounded-xl shadow-lg transition active:scale-95"
                          >
                            Assistir no App Externo ➔
                          </a>
                        </div>
                      );
                    }
                  })()
                )}
              </div>
            ) : (
              <img
                src={allImages[activeImageIndex] || activeProduct.image}
                alt={activeProduct.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain bg-black transition-all duration-350"
              />
            )}

            {/* Float Toggle Controller for Photos vs. Video Mode */}
            {activeProduct.video && activeProduct.video.trim() !== '' && (
              <div className="absolute top-4 right-14 z-30 flex gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-xl select-none">
                <button
                  type="button"
                  onClick={() => handleChangeViewMode('image')}
                  className={`px-3 py-1 text-[9px] uppercase font-bold rounded-lg transition-all cursor-pointer ${
                    viewMode === 'image'
                      ? 'bg-amber-500 text-black shadow-md font-black'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Fotos
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('video');
                    setIsPlaying(true);
                  }}
                  className={`px-3 py-1 text-[9px] uppercase font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    viewMode === 'video'
                      ? 'bg-[#39ff14]/90 text-black shadow-md font-black'
                      : 'text-amber-400 hover:text-amber-300 hover:bg-white/5'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
                  Vídeo 🎬
                </button>
              </div>
            )}



            {activeProduct.tag && (
              <span className="absolute top-4 left-4 z-10 px-3 py-1 bg-amber-500 font-semibold text-black text-[10px] uppercase tracking-widest rounded-full">
                {activeProduct.tag}
              </span>
            )}
            
            {isSold && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-[2.5px] flex items-center justify-center p-0 overflow-hidden z-10">
                <div className="w-full bg-red-600 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider py-4 border-y border-red-500 shadow-2xl text-center select-none px-4 transform -rotate-12 scale-110">
                  poxa, você perdeu essa, já foi vendido. 💔
                </div>
              </div>
            )}

            {/* Responsive glass horizontal carousel for thumbs (includes photos and video button) */}
            {(allImages.length > 1 || (activeProduct.video && activeProduct.video.trim() !== '')) && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 bg-black/65 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 max-w-[90%] overflow-x-auto select-none no-scrollbar">
                {allImages.map((imgUrl, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      handleChangeViewMode('image');
                      setActiveImageIndex(idx);
                    }}
                    className={`w-9 h-9 rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer shrink-0 ${
                      viewMode === 'image' && activeImageIndex === idx 
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

                {/* Inline Video Play button represented as a video thumbnail right in the gallery row */}
                {activeProduct.video && activeProduct.video.trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('video');
                      setIsPlaying(true);
                    }}
                    className={`w-9 h-9 rounded-lg border overflow-hidden transition-all duration-200 cursor-pointer shrink-0 flex flex-col items-center justify-center bg-neutral-950 ${
                      viewMode === 'video'
                        ? 'border-[#39ff14] bg-[#39ff14]/15 scale-105 text-[#39ff14]'
                        : 'border-amber-500/30 text-amber-500 bg-black/40 hover:border-amber-500 hover:text-white'
                    }`}
                    title="Assistir gravação real d'este look"
                  >
                    <Play className="h-4 w-4 fill-current text-current" />
                    <span className="text-[7px] font-black uppercase mt-0.5 tracking-wider">VÍDEO</span>
                  </button>
                )}
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
                              className="inline-block text-[9px] text-center bg-red-650 hover:bg-neutral-800 text-white font-bold py-1 px-2.5 rounded uppercase tracking-wider shadow-sm transition active:scale-95 bg-red-600"
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
                      <div className="p-5 flex flex-col items-center justify-center bg-zinc-950/80 border-t border-white/5 text-center space-y-3.5">
                        {viewMode === 'video' ? (
                          <>
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full bg-[#39ff14]/10 flex items-center justify-center border border-[#39ff14]/30 text-[#39ff14]">
                                <Video className="h-5 w-5 animate-pulse" />
                              </div>
                              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#39ff14] border border-black animate-ping" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-[11px] text-[#39ff14] font-black uppercase tracking-wider">🟢 Reprodutor Ativo no Topo! 🍿</h5>
                              <p className="text-[10px] text-zinc-400 max-w-[280px] leading-relaxed mx-auto">
                                O vídeo em alta definição com a gravação real da peça está rodando no topo dos detalhes deste anúncio.
                              </p>
                            </div>
                            <div className="flex gap-2.5">
                              <button
                                type="button"
                                onClick={() => {
                                  handleChangeViewMode('image');
                                  document.getElementById('product-modal-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="inline-flex items-center gap-1.5 bg-neutral-900 border border-white/10 hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider py-2 px-4 rounded-xl shadow transition active:scale-95 cursor-pointer"
                              >
                                <span>Ver Fotos do Look</span>
                              </button>
                              <a 
                                href={videoData.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider py-2 px-3 rounded-xl border border-amber-500/20 transition active:scale-95"
                              >
                                Baixar / Abrir Original ➔
                              </a>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  setViewMode('video');
                                  setIsPlaying(true);
                                  document.getElementById('product-modal-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="w-12 h-12 rounded-full bg-amber-500 hover:bg-[#39ff14] text-amber-300 hover:text-black flex items-center justify-center border border-amber-500/30 hover:border-black/5 transition-all duration-300 shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_16px_rgba(57,255,20,0.4)] active:scale-95 cursor-pointer"
                              >
                                <Play className="h-5 w-5 ml-0.5 fill-current" />
                              </button>
                              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 border border-black animate-ping" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="text-[11px] text-white font-extrabold uppercase tracking-wider">Gravação Real d'este Look Disponível! 📽️</h5>
                              <p className="text-[10px] text-zinc-400 max-w-[320px] leading-relaxed mx-auto">
                                Temos uma filmagem fiel da peça física real feita em alta definição no estúdio. Assista agora mesmo no reprodutor integrado!
                              </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setViewMode('video');
                                  setIsPlaying(true);
                                  document.getElementById('product-modal-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="inline-flex items-center gap-1.5 bg-[#39ff14] hover:bg-[#39ff14]/90 text-black text-[10px] font-black uppercase tracking-wider py-2 px-4 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
                              >
                                <span>Assistir Vídeo no Próprio App 🎬</span>
                              </button>
                              <a 
                                href={videoData.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-neutral-300 text-[10px] font-semibold uppercase tracking-wider py-2 px-3.5 rounded-xl transition active:scale-95"
                              >
                                Baixar Arquivo MP4
                              </a>
                            </div>
                          </>
                        )}
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
