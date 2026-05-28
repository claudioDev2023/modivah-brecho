import React from 'react';
import { Eye, ShieldCheck, Heart } from 'lucide-react';

interface HeroProps {
  onOpenStylist: () => void;
}

export default function Hero({ onOpenStylist }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-neutral-900 to-[#0f0f0f] border-b border-white/5 py-16 sm:py-24" id="modivah-hero">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        
        {/* MODIVAH BRECHÓ - BEM DESTACADO */}
        <div className="mb-6">
          <h1 className="text-3xl xs:text-4xl sm:text-7xl md:text-8xl font-black tracking-[0.1em] sm:tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-white uppercase inline-block drop-shadow-lg" id="hero-title-modivah">
            MODIVAH BRECHÓ
          </h1>
        </div>
        
        {/* Replacement Sentence */}
        <h2 className="text-lg sm:text-2xl text-neutral-200 font-light max-w-3xl mx-auto leading-relaxed mb-10 text-justify sm:text-center">
          Trabalhamos com roupas extremamente conservadas, selecionadas uma a uma para garantir beleza, qualidade e elegância em cada detalhe.
        </h2>

        {/* Dynamic CTA - Only WhatsApp now */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <a
            href="https://wa.me/5527988226654"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-semibold uppercase tracking-widest rounded-full transition-all duration-300 shadow-lg shadow-emerald-500/10 active:scale-95"
          >
            Fale Conosco via WhatsApp
          </a>
        </div>

        {/* Selling Value Props */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12 pt-12 border-t border-white/5 text-left">
          <div className="flex gap-4 items-start bg-white/[0.02] p-5 rounded-2xl border border-white/5">
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

          <div className="flex gap-4 items-start bg-white/[0.02] p-5 rounded-2xl border border-white/5">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg shrink-0">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Peças Acessíveis</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light text-justify">
                Peças acessíveis com preço acessíveis.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start bg-white/[0.02] p-5 rounded-2xl border border-white/5">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg shrink-0">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white mb-1">Consumo Sustentável</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-light text-justify">
                O que você procura pode ser seu a um clique.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
