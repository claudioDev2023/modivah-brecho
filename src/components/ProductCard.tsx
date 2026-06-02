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
      className="group relative flex flex-col bg-white border border-zinc-200 hover:border-zinc-300 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl"
      id={`product-card-${product.id}`}
    >
      {/* Product Image Area - Clickable to enter product details */}
      <div 
        onClick={() => onViewDetails(product)}
        className="relative aspect-square bg-zinc-50 overflow-hidden cursor-pointer group/img"
        title="Clique para ver todos os detalhes desta peça"
      >
        <img
          src={product.image}
          alt={product.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover bg-zinc-100 transition-transform duration-700 group-hover/img:scale-105"
          style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
          onError={(e) => {
            // Fallback generic clothing image URL if standard fails to load
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800";
          }}
        />

        {/* Outer Dark Overlay for Sold or Out of Stock Items */}
        {isSold && (
          <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-[2.5px] flex items-center justify-center p-0 overflow-hidden">
            <div className="w-full bg-red-600 text-white text-base font-black uppercase tracking-wider py-4 border-y border-red-500 shadow-2xl text-center select-none px-4 transform -rotate-12 scale-110">
              JÁ VENDIDO 💔
            </div>
          </div>
        )}

        {/* Outer Dark Overlay for Reserved Items */}
        {isReserved && (
          <div className="absolute inset-0 z-10 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center">
            <span className="px-5 py-2.5 bg-amber-500 text-black text-[13px] font-bold uppercase tracking-widest rounded-full shadow-lg">
              Reservado
            </span>
            <span className="text-xs text-neutral-200 mt-2 font-mono">Aguardando pagamento</span>
          </div>
        )}

        {/* Custom Badges (e.g. Premium / Novidade) */}
        {product.tag && isAvailable && (
          <span className="absolute top-3 left-3 px-3 py-1.5 bg-white/95 backdrop-blur-md text-amber-600 text-xs uppercase tracking-wider font-bold rounded-full border border-amber-500/20 shadow">
            {product.tag}
          </span>
        )}

        {/* Size Floating Badge */}
        {isAvailable && (
          <span className="absolute bottom-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-md text-[#111111] text-xs font-mono font-medium rounded-md border border-zinc-200">
            TAM {product.size}
          </span>
        )}

        {/* Hover Action Hints */}
        {isAvailable && (
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <span className="bg-white text-[#111111] text-xs font-medium tracking-wider uppercase px-5 py-2.5 rounded-full border border-zinc-200 flex items-center gap-1.5 shadow-2xl">
              <Eye className="h-4 w-4 text-amber-600" />
              <span>Ver Produto Completo</span>
            </span>
          </div>
        )}
      </div>

      {/* Product Information Area */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Condition Line (Brand removed completely as per ads specification) */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs px-2.5 py-0.5 rounded border font-medium ${getConditionColor(product.condition)}`}>
            {product.condition}
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>

        {/* Product Title - MINIMUM 18px */}
        <h3 
          onClick={() => onViewDetails(product)}
          className="text-lg sm:text-[19px] font-sans font-bold text-[#111111] hover:text-amber-600 transition-colors duration-200 line-clamp-1 mb-2 cursor-pointer"
        >
          {product.title}
        </h3>

        {/* Available Stock Quantity Info */}
        <div className="mb-3.5">
          {(() => {
            if (product.stock <= 0) {
              return (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-650 text-xs font-bold rounded-lg leading-relaxed shadow-sm">
                  <span>❌</span>
                  <span>Estoque Esgotado</span>
                </div>
              );
            }
            if (product.stock <= 5) {
              const textFormatted = product.stock === 1 
                ? "🔥 Última unidade disponível (Resta apenas 1!)" 
                : `🔥 Últimas ${product.stock} unidades disponíveis`;
              return (
                <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-xs font-extrabold rounded-lg leading-relaxed shadow-sm animate-pulse uppercase tracking-wider">
                  <span>{textFormatted}</span>
                </div>
              );
            }
            return (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold rounded-lg leading-relaxed shadow-sm">
                <span>📦</span>
                <span>Restam apenas {product.stock} unidades em estoque</span>
              </div>
            );
          })()}
        </div>

        {/* Details snippet - MINIMUM 16px */}
        <p className="text-base text-[#222222] line-clamp-2 leading-relaxed mb-4 font-normal text-justify">
          {product.description}
        </p>

        {/* Price & Cart Actions (Always aligned at the bottom) */}
        <div className="mt-auto pt-4 border-t border-zinc-100 space-y-4">
          {/* Prices line */}
          {(() => {
            const origVal = Number(product.originalPrice) || (Math.round((Number(product.price) * 2.5) / 10) * 10);
            const maxSavingsVal = Math.max(0, origVal - Number(product.price));
            const percentVal = Math.max(1, Math.min(99, Math.round((maxSavingsVal / origVal) * 100)));
            return (
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 overflow-hidden">
                  <div>
                    <span className="text-xs sm:text-sm text-[#DC2626] line-through font-mono font-bold block">
                      De: R$ {origVal.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[20px] sm:text-[23px] text-[#0fa33a] font-mono font-black tracking-tight block">
                      Por: R$ {Number(product.price).toFixed(2)}
                    </span>
                  </div>
                </div>
                {maxSavingsVal > 0 && (
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs font-black text-[#0ea137] bg-emerald-50 border border-emerald-150 px-2.5 py-1.5 rounded-lg w-fit uppercase tracking-widest animation duration-250">
                    <span>✨ Você economiza R$ {maxSavingsVal.toFixed(2)} ({percentVal}% OFF)</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Action Button - MINIMUM 16px */}
          {!isAvailable ? (
            <button
              onClick={() => onViewDetails(product)}
              className="w-full py-3 bg-zinc-100 text-[#444444] border border-zinc-200 rounded-xl text-xs sm:text-sm uppercase font-bold hover:bg-zinc-200 hover:text-[#111111] transition-all duration-250 cursor-pointer text-center"
            >
              Ver Detalhes (Indisponível)
            </button>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              <button
                id={`add-to-cart-btn-${product.id}`}
                onClick={() => onAddToCart(product)}
                className="col-span-3 py-3 px-3 bg-[#39ff14] hover:bg-[#2ee60d] text-black rounded-xl cursor-pointer hover:scale-[1.02] active:scale-95 duration-200 transition-all font-black text-xs sm:text-sm uppercase tracking-wider animate-pulse-scale flex items-center justify-center gap-1.5 shadow-md shadow-[#39ff14]/10"
                title="Comprar agora"
              >
                <ShoppingBag className="h-4 w-4 stroke-[3]" />
                <span>COMPRAR</span>
              </button>
              
              <button
                onClick={() => onViewDetails(product)}
                className="col-span-2 py-3 bg-zinc-100 hover:bg-zinc-200 text-[#111111] border border-zinc-200 rounded-xl text-xs sm:text-[13px] uppercase tracking-wider font-semibold cursor-pointer transition active:scale-95 flex items-center justify-center"
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
