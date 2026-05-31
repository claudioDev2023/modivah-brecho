import React from 'react';
import { Eye, ShieldCheck, Heart } from 'lucide-react';
import { motion } from 'motion/react';
// @ts-ignore
import heroBannerImg from '../assets/images/modivah_hero_banner_1780235216289.png';

interface HeroProps {
  onOpenStylist: () => void;
}

export default function Hero({ onOpenStylist }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-neutral-950 via-[#0a0a0a] to-neutral-950 border-b border-white/5 py-12 sm:py-20" id="modivah-hero">
      {/* Premium glow effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/[0.02] rounded-full filter blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
        
        {/* Subtle Luxury Category Tag */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
          <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.25em] text-amber-300 uppercase font-mono">
            ACERVO EXCLUSIVO & IA CUSTOMIZADA
          </span>
        </div>

        {/* 1. ORIGINAL IMAGE EMBEDDED PRECISELY AS REQUESTED */}
        <div className="relative w-full max-w-[850px] mx-auto mb-8 sm:mb-10 group animate-fadeIn">
          {/* Subtle surrounding light halo for premium contrast */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent filter blur-[25px] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative"
          >
            <img
              src={heroBannerImg}
              alt="MODIVAH BRECHÓ Premium Banner"
              referrerPolicy="no-referrer"
              style={{
                width: '100%',
                maxWidth: '850px',
                height: 'auto',
                objectFit: 'cover',
                display: 'block',
                margin: 'auto',
                borderRadius: '24px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
              className="select-none transition-all duration-500 group-hover:border-amber-400/40 group-hover:shadow-[0_30px_70px_rgba(245,158,11,0.15)]"
            />
          </motion.div>
        </div>

        {/* 2. DESCRIPTION TEXT AND ACTION PANEL */}
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-sm sm:text-base text-neutral-300 font-light leading-relaxed text-justify sm:text-center">
            Trabalhamos com marcas de grife e roupas extremamente conservadas, selecionadas uma a uma com carinho e sob rigoroso selo de qualidade para garantir a elegância deslumbrante e o consumo circular inteligente que você merece.
          </p>

          {/* Call-to-Actions (CTAs) */}
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <a
              href="https://wa.me/5527988226654"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-semibold uppercase tracking-widest rounded-full transition-all duration-300 shadow-lg shadow-emerald-500/10 active:scale-95 flex items-center gap-2 border border-emerald-400/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle shrink-0"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 .099.092 10 10 0 1 0-4.777-4.719"></path></svg>
              Fale Conosco via WhatsApp
            </a>

            <button
              onClick={onOpenStylist}
              className="px-8 py-3.5 bg-neutral-950 hover:bg-neutral-900 text-amber-300 hover:text-amber-200 text-xs font-semibold uppercase tracking-widest rounded-full transition-all duration-300 shadow-lg border border-white/5 active:scale-95 flex items-center gap-2"
            >
              <span>Fale com a Mo IA ✨</span>
            </button>
          </div>
        </div>

        {/* 3. SELLING VALUE PROPS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-14 pt-12 border-t border-white/5 text-left">
          <div className="flex gap-4 items-start bg-white/[0.02] p-5 rounded-2xl border border-white/5 transition duration-300 hover:border-white/10 hover:bg-white/[0.04]">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Qualidade Garantida</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light text-justify">
                Cada costura, botão e zíper são minuciosamente inspecionados para que você receba a peça em estado impecável.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-white/[0.02] p-5 rounded-2xl border border-white/5 transition duration-300 hover:border-white/10 hover:bg-white/[0.04]">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Curadoria Premium</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light text-justify">
                Marcas desejadas e peças selecionadas com todo rigor, unindo exclusividade com sustentabilidade real.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-white/[0.02] p-5 rounded-2xl border border-white/5 transition duration-300 hover:border-white/10 hover:bg-white/[0.04]">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Moda Circular</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light text-justify">
                Apoie o consumo inteligente: dê um novo ciclo a looks exuberantes com preços surpreendentes.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
