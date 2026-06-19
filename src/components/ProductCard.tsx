import React, { memo } from 'react';
import { ShoppingBag, Eye } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  onViewDetails: (product: Product, initialView?: 'image' | 'video') => void;
  onAddToCart: (product: Product) => void;
}

const getSingularCategoryName = (name: string): string => {
  const trimmed = (name || "").trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'bermudas') return 'Bermuda';
  if (lower === 'blusas') return 'Blusa';
  if (lower === 'blazers') return 'Blazer';
  if (lower === 'bolsas') return 'Bolsa';
  if (lower === 'calçados' || lower === 'calcados') return 'Calçado';
  if (lower === 'camisas') return 'Camisa';
  if (lower === 'conjuntos') return 'Conjunto';
  if (lower === 'cintos') return 'Cinto';
  if (lower === 'vestidos') return 'Vestido';
  if (lower === 'saias') return 'Saia';
  if (lower === 'shorts') return 'Short';
  if (lower === 'casacos') return 'Casaco';
  if (lower === 'jaquetas') return 'Jaqueta';
  if (lower === 'sapatos') return 'Sapato';
  return trimmed;
};

const ProductCard = memo(function ProductCard({ product, onViewDetails, onAddToCart }: ProductCardProps): React.JSX.Element {
  const isSold = product.stock <= 0;
  const isReserved = product.status === 'reserved' && !isSold;
  const isAvailable = product.stock > 0 && !isReserved;

  // Upper left tag: use product.tag if defined, else fallback to 'NOVO'
  const leftTag = product.tag ? product.tag.toUpperCase() : 'NOVO';

  // State / condition normalization
  const isNew = product.condition === 'Novo com Etiqueta' || 
                String(product.condition || '').toLowerCase().includes('novo');

  // Fallback field parsing for title and description for bulletproof rendering
  const displayTitle = product.title || (product as any).name || (product as any).productName || "Peça Exclusiva";
  const displayDesc = product.description || (product as any).itemDescription || "Detalhes indisponíveis no momento.";

  // Format Size tag gracefully as 'TAM P', 'TAM M', 'TAM 38' etc.
  const formatSize = (sz: string) => {
    const clean = (sz || '').trim().toUpperCase();
    if (clean.startsWith('TAM')) return clean;
    return `TAM ${clean}`;
  };

  // Helper calculation for original price fallback to ensure pre-sale price exists
  const origVal = Number(product.originalPrice) || (Math.round((Number(product.price) * 1.5) / 10) * 10);  return (
    <div 
      className="group relative flex flex-col bg-white border border-[#FF6A4D]/40 hover:border-[#EE4D2D] rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md w-full h-[585px] sm:h-[625px]"
      id={`product-card-${product.id}`}
    >
      {/* 1. AREA DA IMAGEM PRINCIPAL (53% of card height) */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative h-[53%] w-full bg-zinc-50 overflow-hidden cursor-pointer group/img border-b border-zinc-100 z-0 select-none rounded-t-2xl"
        title="Clique para ver todos os detalhes desta peça"
      >
        {/* EXPANSÃO INTELIGENTE DE FUNDO / FUNDO COMPLEMENTAR
            A blurred ambient background constructed from the product photo itself to avoid empty spaces or black bars */}
        <div className="absolute inset-0 select-none pointer-events-none scale-108 blur-xl opacity-10 overflow-hidden">
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
          alt={displayTitle}
          referrerPolicy="no-referrer"
          className="relative z-10 w-full h-full object-contain mx-auto transition-transform duration-700 group-hover/img:scale-103"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800";
          }}
        />

        {/* Outer Dark Overlay for Sold or Out of Stock Items */}
        {isSold && (
          <div className="absolute inset-x-0 bottom-4 mx-4 z-20 flex items-center justify-center select-none pointer-events-none">
            <div className="w-full bg-[#EE4D2D] text-white text-xs sm:text-sm font-black uppercase tracking-wider py-2 px-3 rounded-lg shadow-lg text-center border-2 border-white/95">
              JÁ VENDIDO 💔
            </div>
          </div>
        )}

        {/* Outer Dark Overlay for Reserved Items */}
        {isReserved && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[1.5px] flex flex-col items-center justify-center">
            <span className="px-5 py-2.5 bg-[#EE4D2D] text-white text-[13px] font-black uppercase tracking-widest rounded-full shadow-lg border border-[#EE4D2D]">
              Reservado
            </span>
            <span className="text-xs text-zinc-350 mt-2 font-mono font-bold">Aguardando pagamento</span>
          </div>
        )}

        {/* Hover Action Highlight */}
        {isAvailable && !isSold && !isReserved && (
          <div className="absolute inset-0 z-10 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="bg-white/95 text-[#EE4D2D] text-xs font-bold tracking-wider uppercase px-5 py-2.5 rounded-full border border-[#FF6A4D]/40 flex items-center gap-1.5 shadow-lg select-none">
              <Eye className="h-4 w-4 text-[#EE4D2D] animate-pulse" />
              <span>Ver Produto Completo</span>
            </span>
          </div>
        )}

        {/* FLOATING BADGES - High Priority Layer (z-20), above style layer, never hidden or cut */}
        {/* Upper Left: Status Badge */}
        <div className="absolute top-3 left-3 z-20 px-3.5 py-1.5 bg-[#EE4D2D] text-white text-[10px] sm:text-xs uppercase tracking-wider font-extrabold rounded-full shadow-md pointer-events-none select-none">
          {leftTag}
        </div>

        {/* Upper Right: Size Badge */}
        <div className="absolute top-3 right-3 z-20 px-3.5 py-1.5 bg-zinc-100 text-zinc-700 text-[10px] sm:text-xs font-mono font-extrabold rounded-full shadow-sm border border-zinc-200 uppercase pointer-events-none select-none">
          {formatSize(product.size)}
        </div>
      </div>

      {/* 2. AREA INFERIOR DO CARD (47% of card height) - Fully Independent of Photo */}
      <div className="h-[47%] w-full p-3.5 sm:p-4.5 flex flex-col justify-between bg-white select-none relative z-10">
        
        {/* Top Segment: Condition Label & Product Name */}
        <div className="space-y-1.5 flex-1 overflow-hidden min-w-0">
          
          {/* Label "NOVO / SEMINOVO" & Estado do produto / Category - Soft theme */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="inline-block px-2.5 py-1 text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider rounded-md leading-none bg-[#EE4D2D] text-white">
                {isNew ? 'NOVO' : 'SEMINOVO'}
              </span>
              <span className="text-[10px] text-zinc-600 font-bold hidden xs:inline truncate">
                {product.condition || 'Seminovo'}
              </span>
            </div>
            <span className="text-[10.5px] font-bold text-[#EE4D2D] capitalize max-w-[100px] truncate shrink-0">
              {getSingularCategoryName(product.category)}
            </span>
          </div>

          {/* Product Title - Big dark readable bold text, max 2 lines, avoids cropped titles */}
          <h3 
            onClick={() => onViewDetails(product)}
            className="text-[16px] sm:text-[18px] font-sans font-bold text-black hover:text-[#EE4D2D] transition-colors duration-150 line-clamp-2 leading-tight cursor-pointer tracking-tight"
            title={displayTitle}
          >
            {displayTitle}
          </h3>

          {/* Product Description - Line-clamped, elegant secondary style */}
          {displayDesc && (
            <p 
              className="text-zinc-600 text-xs font-normal leading-relaxed line-clamp-2 sm:line-clamp-3 overflow-hidden text-ellipsis break-words cursor-pointer opacity-90"
              style={{ wordBreak: 'break-word' }}
              onClick={() => onViewDetails(product)}
            >
              {displayDesc}
            </p>
          )}
        </div>

        {/* Middle Segment: Stock Info & Urgent Warnings */}
        <div className="space-y-1 my-1">
          {/* Stock Availability - Strong/Bold Rich Green and prominent size */}
          <div className="text-zinc-700 font-extrabold text-[12.5px] sm:text-[13.5px] flex items-center gap-1.5 line-none">
            <span className="inline-block w-2 h-2 rounded-full bg-[#EE4D2D]" />
            <span>Quantidade em estoque: <strong className="text-[#EE4D2D] font-black">{isSold ? '0' : product.stock}</strong></span>
          </div>
        </div>

        {/* Bottom Segment: Price Block & Dynamic Interaction Buttons */}
        <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
          
          {/* Price Layout */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[11px] sm:text-[12px] font-semibold line-through ml-0.5 text-zinc-400">
                De R$ {origVal.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[19px] sm:text-[23px] text-[#EE4D2D] font-sans font-black tracking-tight leading-none">
                Por R$ {Number(product.price).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action buttons wrapper */}
          {!isAvailable ? (
            <button
              onClick={() => onViewDetails(product)}
              className="w-full py-2.5 bg-[#F5F5F5] hover:bg-[#EEEEEE] text-[#666666] hover:text-[#333333] border border-[#D9D9D9] rounded-xl text-xs sm:text-[13px] uppercase font-bold transition duration-150"
            >
              Sem estoque (Detalhes)
            </button>
          ) : (
            <div className="grid grid-cols-5 gap-1.5 max-w-full">
              {/* COMPRAR Button - neon green glowing pulse animation, prominent action marker */}
              <button
                id={`add-to-cart-btn-${product.id}`}
                onClick={() => onAddToCart(product)}
                className="col-span-3 py-2.5 bg-[#EE4D2D] hover:bg-[#FF6A4D] text-white rounded-lg cursor-pointer font-black text-[11px] sm:text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all duration-200"
                title="Comprar agora"
              >
                <ShoppingBag className="h-3.5 w-3.5 stroke-[3.2] shrink-0 text-white" />
                <span>COMPRAR</span>
              </button>

              <button
                onClick={() => onViewDetails(product)}
                className="col-span-2 py-2.5 bg-[#F5F5F5] hover:bg-[#EEEEEE] text-[#666666] hover:text-[#333333] border border-[#D9D9D9] rounded-lg text-[10px] sm:text-[11px] uppercase tracking-wider font-bold cursor-pointer transition flex items-center justify-center text-center duration-200"
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
