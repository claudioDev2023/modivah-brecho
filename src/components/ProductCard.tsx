import React, { memo } from 'react';
import { ShoppingBag, Eye } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onViewDetails: (product: Product, initialView?: 'image' | 'video') => void;
  onAddToCart: (product: Product) => void;
}

const ProductCard = memo(function ProductCard({ product, onViewDetails, onAddToCart }: ProductCardProps): React.JSX.Element {
  const isSold = product.stock <= 0;
  const isReserved = product.status === 'reserved' && !isSold;
  const isAvailable = product.stock > 0 && !isReserved;

  // Upper left tag: use product.tag if defined, else fallback to 'NOVO'
  const leftTag = product.tag ? product.tag.toUpperCase() : 'NOVO';

  // Format Size tag gracefully as 'TAM P', 'TAM M', 'TAM 38' etc.
  const formatSize = (sz: string) => {
    const clean = sz.trim().toUpperCase();
    if (clean.startsWith('TAM')) return clean;
    return `TAM ${clean}`;
  };

  // Helper calculation for original price fallback to ensure pre-sale price exists
  const origVal = Number(product.originalPrice) || (Math.round((Number(product.price) * 1.5) / 10) * 10);

  return (
    <div 
      className="group relative flex flex-col bg-white border border-neutral-100 hover:border-neutral-200/80 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-2xl w-full h-[585px] sm:h-[625px]"
      id={`product-card-${product.id}`}
    >
      {/* 1. AREA DA IMAGEM PRINCIPAL (65% of card height) */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative h-[65%] w-full bg-neutral-50 overflow-hidden cursor-pointer group/img border-b border-neutral-100 z-0 select-none"
        title="Clique para ver todos os detalhes desta peça"
      >
        {/* EXPANSÃO INTELIGENTE DE FUNDO / FUNDO COMPLEMENTAR
            A blurred ambient background constructed from the product photo itself to avoid empty spaces or black bars */}
        <div className="absolute inset-0 select-none pointer-events-none scale-108 blur-xl opacity-30 overflow-hidden">
          <img
            src={product.image}
            alt=""
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Crisp original product image displayed on top - 100% visible, centered, and fully preserved without cuts */}
        <img
          src={product.image}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="relative z-10 w-full h-full object-contain mx-auto transition-transform duration-700 group-hover/img:scale-103"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800";
          }}
        />

        {/* Outer Dark Overlay for Sold or Out of Stock Items */}
        {isSold && (
          <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-[2px] flex items-center justify-center p-0 overflow-hidden">
            <div className="w-full bg-red-600 text-white text-base font-black uppercase tracking-wider py-4 border-y border-red-500 shadow-2xl text-center select-none px-4 transform -rotate-12 scale-110">
              JÁ VENDIDO 💔
            </div>
          </div>
        )}

        {/* Outer Dark Overlay for Reserved Items */}
        {isReserved && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[1.5px] flex flex-col items-center justify-center">
            <span className="px-5 py-2.5 bg-amber-500 text-black text-[13px] font-black uppercase tracking-widest rounded-full shadow-lg">
              Reservado
            </span>
            <span className="text-xs text-neutral-200 mt-2 font-mono font-bold">Aguardando pagamento</span>
          </div>
        )}

        {/* Hover Action Highlight */}
        {isAvailable && !isSold && !isReserved && (
          <div className="absolute inset-0 z-10 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="bg-white text-neutral-900 text-xs font-bold tracking-wider uppercase px-5 py-2.5 rounded-full border border-neutral-150 flex items-center gap-1.5 shadow-lg select-none">
              <Eye className="h-4 w-4 text-orange-500 animate-pulse" />
              <span>Ver Produto Completo</span>
            </span>
          </div>
        )}

        {/* FLOATING BADGES - High Priority Layer (z-20), above style layer, never hidden or cut */}
        {/* Upper Left: Status Badge */}
        <div className="absolute top-3 left-3 z-20 px-3.5 py-1.5 bg-white text-neutral-950 text-[10px] sm:text-xs uppercase tracking-wider font-extrabold rounded-full shadow-md border border-neutral-100/90 pointer-events-none select-none">
          {leftTag}
        </div>

        {/* Upper Right: Size Badge */}
        <div className="absolute top-3 right-3 z-20 px-3.5 py-1.5 bg-white text-neutral-950 text-[10px] sm:text-xs font-mono font-extrabold rounded-full shadow-md border border-neutral-100/90 uppercase pointer-events-none select-none">
          {formatSize(product.size)}
        </div>
      </div>

      {/* 2. AREA INFERIOR DO CARD (35% of card height) - Fully Independent of Photo */}
      <div className="h-[35%] w-full p-3.5 sm:p-4.5 flex flex-col justify-between bg-white select-none relative z-10">
        
        {/* Top Segment: Condition Label & Product Name */}
        <div className="space-y-1.5 flex-1 overflow-hidden min-w-0">
          
          {/* Label "Gentilmente Usado" / Condition - Soft Light Orange theme */}
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-block px-2.5 py-1 text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider bg-[#FFF2E9] text-[#E67E22] border border-[#FEE3D0] rounded-md leading-none">
              ✨ Gentilmente Usado
            </span>
            <span className="text-[10.5px] font-bold text-neutral-400 capitalize max-w-[100px] truncate">
              {product.category}
            </span>
          </div>

          {/* Product Title - Big dark readable bold text, max 2 lines, avoids cropped titles */}
          <h3 
            onClick={() => onViewDetails(product)}
            className="text-[16px] sm:text-[18px] font-sans font-extrabold text-neutral-950 hover:text-orange-600 transition-colors duration-150 line-clamp-2 leading-tight cursor-pointer"
            title={product.title}
          >
            {product.title}
          </h3>
        </div>

        {/* Middle Segment: Stock Info & Urgent Warnings */}
        <div className="space-y-1 my-1">
          {/* Stock Availability - Strong/Bold Rich Green and prominent size */}
          <div className="text-[#0fa33a] font-extrabold text-[12.5px] sm:text-[13.5px] flex items-center gap-1.5 line-none">
            <span className="inline-block w-2 h-2 rounded-full bg-[#0fa33a]" />
            <span>Quantidade em estoque: {isSold ? '0' : product.stock}</span>
          </div>

          {/* Urgent message for final unit - Soft red-light warning background */}
          {product.stock === 1 && !isSold && !isReserved && (
            <div className="flex flex-col items-center justify-center py-1.5 bg-[#FFF0F0] border border-[#FADBD8] text-red-650 rounded-lg text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider leading-tight text-center">
              <span>🔥 ÚLTIMA UNIDADE DISPONÍVEL</span>
              <span className="text-red-700 font-extrabold text-[9px] sm:text-[9.5px] mt-0.5">(RESTA APENAS 1)</span>
            </div>
          )}
        </div>

        {/* Bottom Segment: Price Block & Dynamic Interaction Buttons */}
        <div className="pt-2 border-t border-neutral-150 flex flex-col gap-2">
          
          {/* Price Layout */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-[12px] text-red-505 font-bold line-through ml-0.5 text-neutral-400">
                De R$ {origVal.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[17px] sm:text-[21px] text-[#0fa33a] font-mono font-black tracking-tight leading-none">
                Por R$ {Number(product.price).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action buttons wrapper */}
          {!isAvailable ? (
            <button
              onClick={() => onViewDetails(product)}
              className="w-full py-2.5 bg-neutral-100 text-neutral-500 border border-neutral-200 rounded-xl text-xs sm:text-[13px] uppercase font-bold hover:bg-neutral-150 hover:text-neutral-750 transition duration-150"
            >
              Sem estoque (Detalhes)
            </button>
          ) : (
            <div className="grid grid-cols-5 gap-1.5 max-w-full">
              {/* COMPRAR Button - neon green glowing pulse animation, prominent action marker */}
              <button
                id={`add-to-cart-btn-${product.id}`}
                onClick={() => onAddToCart(product)}
                className="col-span-3 py-2.5 bg-[#39ff14] hover:bg-[#2ae00a] text-black rounded-lg cursor-pointer font-black text-[11px] sm:text-xs uppercase tracking-wider animate-pulse-scale flex items-center justify-center gap-1.5 transition-transform hover:shadow-md border border-emerald-500/15"
                title="Comprar agora"
              >
                <ShoppingBag className="h-3.5 w-3.5 stroke-[3.2] shrink-0" />
                <span>COMPRAR</span>
              </button>

              <button
                onClick={() => onViewDetails(product)}
                className="col-span-2 py-2.5 bg-neutral-50 hover:bg-neutral-100 text-[#111111] border border-neutral-200 rounded-lg text-[10px] sm:text-[11px] uppercase tracking-wider font-extrabold cursor-pointer transition flex items-center justify-center text-center"
                title="Informações detalhadas"
              >
                Detalhes
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
});

export default ProductCard;
