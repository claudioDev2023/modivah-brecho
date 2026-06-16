import React from 'react';
import { ShoppingBag, Search, Sparkles, Sliders, Menu, X, User } from 'lucide-react';
import { CartItem } from '../types';
// @ts-ignore
import logoImg from '../assets/images/modivah_official_icon_1780357423680.png';

interface NavbarProps {
  cart: CartItem[];
  onOpenCart: () => void;
  onOpenStylist: () => void;
  onOpenAdmin: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAdmin: boolean;
}

export default function Navbar({
  cart,
  onOpenCart,
  onOpenStylist,
  onOpenAdmin,
  searchQuery,
  setSearchQuery,
  isAdmin
}: NavbarProps) {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm" id="modivah-header">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setSearchQuery(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 px-1 py-0.5 group rounded-xl transition hover:opacity-95"
            id="nav-logo-btn"
          >
            <img 
              src={logoImg} 
              alt="Modivah Brechó Logo" 
              className="h-9 w-9 sm:h-11 sm:w-11 object-contain rounded-full bg-white p-1 border border-zinc-200 group-hover:border-[#EE4D2D] group-hover:scale-105 transition-all duration-300 shadow-md shadow-zinc-200" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/favicon.png';
              }}
            />
            <div className="flex flex-col text-left">
              <span className="text-sm sm:text-lg font-black tracking-[0.2em] text-[#EE4D2D] leading-none mb-1">
                MODIVAH
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] text-zinc-500 font-extrabold leading-none">
                Brechó
              </span>
            </div>
          </button>
        </div>

        {/* Search Bar - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md relative" id="desktop-search-container">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            id="desktop-search-input"
            type="text"
            placeholder="Buscar peças (Zara, Farm, G, Vestidos...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[#EE4D2D] focus:bg-white transition shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3" id="navbar-actions">
          {/* AI Stylist Trigger */}
          <button
            id="trigger-stylist-btn"
            onClick={onOpenStylist}
            className="group relative flex items-center gap-1.5 bg-[#EE4D2D]/10 hover:bg-[#EE4D2D]/20 border border-[#EE4D2D]/20 hover:border-[#EE4D2D]/40 text-[#EE4D2D] px-3.5 py-2 rounded-full text-xs font-semibold cursor-pointer transition duration-300"
            title="Fale com a Mo IA"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#EE4D2D] animate-pulse group-hover:scale-110 transition" />
            <span className="hidden sm:inline tracking-wide font-sans font-bold text-[#EE4D2D]">FALE COM A MO IA</span>
          </button>

          {/* Secret Admin Switch */}
          <button
            id="trigger-admin-btn"
            onClick={onOpenAdmin}
            className={`p-2.5 rounded-full border cursor-pointer transition relative flex items-center justify-center ${
              isAdmin 
                ? 'bg-zinc-100 border-zinc-300 text-zinc-800' 
                : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800'
            }`}
            title="Painel Administrativo"
          >
            <Sliders className="h-4 w-4" />
            {isAdmin && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#EE4D2D] animate-ping" />
            )}
          </button>

          {/* Cart Icon trigger */}
          <button
            id="trigger-cart-btn"
            onClick={onOpenCart}
            className="relative inline-flex items-center gap-2 bg-[#EE4D2D] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#EE4D2D]/90 cursor-pointer active:scale-95 transition duration-200"
          >
            <ShoppingBag className="h-4 w-4 shrink-0 text-white" />
            <span className="hidden sm:inline">Carrinho</span>
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-white text-[#EE4D2D] text-[10px] font-black">
              {totalItems}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar Row */}
      <div className="block md:hidden px-4 pb-3" id="mobile-search-row">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            id="mobile-search-input"
            type="text"
            placeholder="Buscar por marca, tamanho, estilo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-full pl-10 pr-4 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-[#EE4D2D] focus:bg-white transition shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
