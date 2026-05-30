import React, { memo } from 'react';
import { ShoppingBag, Eye, Tag } from 'lucide-react';
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

  // Condition Badge Color Helper
  const getConditionColor = (cond: string) => {
    switch (cond) {
      case 'Novo com Etiqueta':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Excelente':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
    }
  };

  return (
    <div 
      className="group relative flex flex-col bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Area - Clickable to enter product details */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative aspect-square bg-neutral-950 overflow-hidden cursor-pointer group/img"
        title="Clique para ver todos os detalhes desta peça"
      >
        <img
          src={product.image}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover bg-black transition-transform duration-700 group-hover/img:scale-105"
          onError={(e) => {
            // Fallback generic clothing image URL if standard fails to load
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800";
          }}
        />

        {/* Outer Dark Overlay for Sold or Out of Stock Items */}
        {isSold && (
          <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-[2.5px] flex items-center justify-center p-0 overflow-hidden">
            <div className="w-full bg-red-600 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider py-3 border-y border-red-500 shadow-2xl text-center select-none px-4 transform -rotate-12 scale-110">
              POXA, VOCÊ PERDEU ESSA, JÁ FOI VENDIDO. 💔
            </div>
          </div>
        )}

        {/* Outer Dark Overlay for Reserved Items */}
        {isReserved && (
          <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center">
            <span className="px-5 py-2 bg-amber-500/95 text-black text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">
              Reservado
            </span>
            <span className="text-[10px] text-neutral-300 mt-2 font-mono">Aguardando pagamento</span>
          </div>
        )}

        {/* Custom Badges (e.g. Premium / Novidade) */}
        {product.tag && isAvailable && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-md text-amber-300 text-[9px] uppercase tracking-wider font-semibold rounded-full border border-amber-500/20 shadow">
            {product.tag}
          </span>
        )}

        {/* Floating video indicator removed */}

        {/* Size Floating Badge */}
        {isAvailable && (
          <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/80 backdrop-blur-md text-white text-xs font-mono font-medium rounded-md border border-white/10">
            TAM {product.size}
          </span>
        )}

        {/* Hover Action Hints */}
        {isAvailable && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="bg-black/90 text-white text-[11px] font-medium tracking-wider uppercase px-4 py-2 rounded-full border border-white/10 flex items-center gap-1.5 shadow-2xl">
              <Eye className="h-3.5 w-3.5 text-amber-300" />
              <span>Ver Produto Completo</span>
            </span>
          </div>
        )}
      </div>

      {/* Product Information Area */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Brand & Condition Line */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[10px] text-amber-400 uppercase tracking-wider truncate font-semibold">
            {product.brand}
          </span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getConditionColor(product.condition)}`}>
            {product.condition}
          </span>
        </div>

        {/* Product Title */}
        <h3 
          onClick={() => onViewDetails(product)}
          className="text-sm font-sans font-normal text-white hover:text-amber-200 transition-colors duration-200 line-clamp-1 mb-1.5 cursor-pointer"
        >
          {product.title}
        </h3>

        {/* Available Stock Quantity Info */}
        <div className="mb-2.5 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-mono tracking-wide text-amber-200/90 font-medium">
            {product.stock === 0 ? (
              <span className="text-red-400">Estoque Esgotado</span>
            ) : product.stock === 1 ? (
              <span>Apenas 1 peça disponível (Única!)</span>
            ) : (
              <span>Quantidade disponível: {product.stock} peças</span>
            )}
          </span>
        </div>

        {/* Details snippet */}
        <p className="text-xs text-zinc-200 line-clamp-2 leading-relaxed mb-4 font-normal text-justify">
          {product.description}
        </p>

        {/* Price & Cart Actions (Always aligned at the bottom) */}
        <div className="mt-auto pt-3 border-t border-white/5 space-y-3">
          {/* Prices line */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[9px] uppercase tracking-widest text-[#f59e0b] block font-medium">
                De (Grife)
              </span>
              <span className="text-xs text-neutral-400 line-through font-mono">
                R$ {(Number(product.originalPrice) || (Math.round((Number(product.price) * 2.5) / 10) * 10)).toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-widest text-[#39ff14] font-semibold block animate-pulse">
                Por (Modivah) ✨
              </span>
              <span className="text-sm sm:text-base text-amber-300 font-mono font-bold tracking-tight">
                R$ {Number(product.price).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Button */}
          {!isAvailable ? (
            <button
              onClick={() => onViewDetails(product)}
              className="w-full py-2.5 bg-white/5 text-white/40 border border-white/5 rounded-xl text-[11px] uppercase font-bold hover:bg-white/10 hover:text-red-300 transition-colors duration-250 cursor-pointer text-center"
            >
              Ver Detalhes (Indisponível)
            </button>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              <button
                id={`add-to-cart-btn-${product.id}`}
                onClick={() => onAddToCart(product)}
                className="col-span-3 py-2.5 px-3 bg-[#39ff14] hover:bg-[#2ee60d] text-black rounded-xl cursor-pointer hover:scale-[1.02] active:scale-95 duration-200 transition-all font-black text-[11px] uppercase tracking-wider animate-pulse-scale flex items-center justify-center gap-1.5"
                title="Comprar agora"
              >
                <ShoppingBag className="h-3.5 w-3.5 stroke-[2.5]" />
                <span>COMPRAR</span>
              </button>
              
              <button
                onClick={() => onViewDetails(product)}
                className="col-span-2 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-[10px] uppercase tracking-wider font-semibold cursor-pointer transition active:scale-95 flex items-center justify-center"
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
