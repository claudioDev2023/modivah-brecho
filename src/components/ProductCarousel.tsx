import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Eye, ShoppingBag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

interface ProductCarouselProps {
  products: Product[];
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductCarousel({ products, onViewDetails, onAddToCart }: ProductCarouselProps) {
  // Filter for available pieces with images
  const availableProducts = products.filter(
    (p) => p.status === 'available' && (p.stock === undefined || p.stock > 0)
  );

  // Take up to 12 recent items to showcase in high rhythm
  const showcaseProducts = availableProducts.slice(0, 12);

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-play timer (Velocidade ideal: 3.5 segundos por ciclo para visibilidade natural)
  useEffect(() => {
    if (showcaseProducts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % showcaseProducts.length);
    }, 4500); // 4.5 seconds is the sweet spot: enough to look, read title & price, and appreciate detail

    return () => clearInterval(interval);
  }, [showcaseProducts.length]);

  if (showcaseProducts.length === 0) return null;

  // Simple handlers
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % showcaseProducts.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + showcaseProducts.length) % showcaseProducts.length);
  };

  // Swiping optimization for mobile touch devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // minimum distance for swipe

    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrev();
    }
    // Reset coordinates helper
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentItem = showcaseProducts[currentIndex];

  return (
    <div 
      className="w-full bg-gradient-to-b from-black/80 to-transparent border-y border-white/5 py-8"
      id="curated-spotlight-carousel"
    >
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Aesthetic Title with Neon Sparkle */}
        <div className="flex items-center gap-2 mb-6 justify-center sm:justify-start">
          <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
          <h2 className="text-xs uppercase tracking-[0.2em] text-neutral-300 font-bold">
            Peças Garimpadas em Destaque
          </h2>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[8px] uppercase tracking-widest bg-[#39ff14]/10 text-[#39ff14] font-medium border border-[#39ff14]/20">
            Vitrine Dinâmica
          </span>
        </div>

        {/* Outer Slider Box Container */}
        <div className="relative group/carousel max-w-5xl mx-auto">
          
          {/* Active Product Slide Container */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full bg-[#141414]/90 rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative select-none"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 md:grid-cols-12 gap-0 md:h-[350px]"
              >
              
              {/* Product Visual Slide Panel (Col 5) */}
              <div 
                className="col-span-1 md:col-span-5 relative h-[280px] sm:h-[320px] md:h-full overflow-hidden bg-neutral-950 group/spotlight cursor-pointer flex items-center justify-center select-none"
                onClick={() => onViewDetails(currentItem)}
              >
                {/* Expansão Inteligente com IA - Outpainting de Contexto de Fundo para preencher ausências sem deformar */}
                <img 
                  src={currentItem.image} 
                  alt="" 
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover filter blur-[20px] opacity-45 scale-125 select-none pointer-events-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                
                {/* Overlay gradiente para fundir e enriquecer a continuidade visual das laterais */}
                <div className="absolute inset-0 bg-black/25 pointer-events-none" />

                {/* Imagem Frontal Completa Preservada Sem Cortes de Cabine, Roupas, Bolsas, Mãos, Pés e Rostos - Centralizada */}
                <img 
                  src={currentItem.image} 
                  alt={currentItem.title}
                  referrerPolicy="no-referrer"
                  className="max-h-full max-w-full object-contain relative z-10 p-3 transition-transform duration-700 group-hover/spotlight:scale-[1.03]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800";
                  }}
                />
              </div>

              {/* Product Description Pane Panel (Col 7) */}
              <div className="col-span-1 md:col-span-7 p-6 sm:p-8 flex flex-col justify-between h-full bg-[#121212] relative">
                
                {/* Dynamic neon linear decoration */}
                <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00f0ff]/30 to-transparent" />

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-amber-300 font-bold uppercase tracking-widest font-mono mr-1">
                        {currentItem.brand}
                      </span>
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] font-semibold text-amber-100 uppercase font-mono">
                        TAM {currentItem.size}
                      </span>
                      <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] font-medium text-neutral-300 font-sans">
                        {currentItem.condition}
                      </span>
                    </div>
                    {currentItem.tag && (
                      <span className="px-2 py-0.5 bg-[#00f0ff]/10 text-[#00f0ff] text-[8px] font-bold uppercase tracking-widest border border-[#00f0ff]/20 rounded-full">
                        {currentItem.tag}
                      </span>
                    )}
                  </div>

                  <h3 
                    onClick={() => onViewDetails(currentItem)}
                    className="text-lg sm:text-2xl font-normal text-white hover:text-amber-200 cursor-pointer transition line-clamp-1 sm:line-clamp-2 leading-snug mb-3 font-sans"
                  >
                    {currentItem.title}
                  </h3>

                  <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed text-justify font-light pr-2">
                    {currentItem.description}
                  </p>
                </div>

                {/* Prices and action controls */}
                <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Price column box */}
                  <div className="flex items-baseline gap-4">
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase font-mono tracking-wider">Garimpo Modivah</span>
                      <span className="text-lg sm:text-2xl font-mono font-bold text-[#FFD700] tracking-tight">
                        R$ {Number(currentItem.price).toFixed(2)}
                      </span>
                    </div>
                    {currentItem.originalPrice && (
                      <div>
                        <span className="text-[9px] text-neutral-600 block uppercase font-mono leading-none mb-0.5">Novo Na Loja</span>
                        <span className="text-xs text-neutral-500 line-through font-mono">
                          R$ {Number(currentItem.originalPrice).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Operational call actions */}
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => onAddToCart(currentItem)}
                      className="px-5 py-3 bg-[#D4AF37] hover:bg-[#E5C150] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition duration-200 active:scale-95 flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.25)] hover:shadow-[0_0_20px_rgba(212,175,55,0.45)] cursor-pointer"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Comprar</span>
                    </button>

                    <button
                      onClick={() => onViewDetails(currentItem)}
                      className="px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition active:scale-95 cursor-pointer border border-white/5"
                    >
                      Detalhes
                    </button>
                  </div>
                </div>

              </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Nav Controls Left and Right Arrow Buttons */}
          {showcaseProducts.length > 1 && (
            <>
              {/* Left back */}
              <button 
                onClick={handlePrev}
                className="absolute -left-4 sm:-left-12 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/80 hover:bg-neutral-900 text-neutral-400 hover:text-white border border-white/10 flex items-center justify-center transition shadow-2xl active:scale-95 z-20 cursor-pointer"
                title="Destaque Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {/* Right forward */}
              <button 
                onClick={handleNext}
                className="absolute -right-4 sm:-right-12 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/80 hover:bg-neutral-900 text-neutral-400 hover:text-white border border-white/10 flex items-center justify-center transition shadow-2xl active:scale-95 z-20 cursor-pointer"
                title="Próximo Destaque"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Dots Indicator Progress dots list bar */}
          {showcaseProducts.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {showcaseProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentIndex === idx 
                      ? 'w-6 bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.7)]' 
                      : 'w-1.5 bg-neutral-700 hover:bg-neutral-500'
                  }`}
                  title={`Ir para destaque ${idx + 1}`}
                />
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
