import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Send, Bot, User, RefreshCw, ShoppingCart, Eye } from 'lucide-react';
import { Product, StylistMessage } from '../types';
// @ts-ignore
import moIaImg from '../assets/images/modivah_avatar_perfect_1780249727394.png';

interface StylistChatProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onViewProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function StylistChat({
  isOpen,
  onClose,
  products,
  onViewProduct,
  onAddToCart
}: StylistChatProps) {
  if (!isOpen) return null;

  const [messages, setMessages] = useState<StylistMessage[]>([
    {
      id: 'welcome',
      sender: 'stylist',
      text: 'Olá, elegante! Sou a **Mo IA**, sua Consultora de Moda e Stylist Virtual da Modivah Brechó.\n\nFiz uma curadoria completa das peças mais desejadas de grifes como **Zara, Farm, Schutz e Animale** que temos hoje em nosso acervo.\n\nEstou aqui para criar combinações incríveis e te guiar! Me conte: você busca alguma peça específica, um visual para alguma ocasião ou quer saber o que combina com o seu estilo?',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll message feed
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Preset quick questions to let the client play instantly
  const presetQuestions = [
    'O que vestir em uma ocasião elegante?',
    'Quero dicas com peças da grife Farm',
    'Indique um look premium para o frio',
    'Quais sapatos e bolsas combinam hoje?'
  ];

  // Post consultation handler to server
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: StylistMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Gather active products list to supply to Gemini to ensure zero-hallucinations
      const response = await fetch('/api/chat-stylist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages,
          products: products
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao conectar com o serviço de estilo.');
      }

      const data = await response.json();
      
      const stylistMsg: StylistMessage = {
        id: `stylist-${Date.now()}`,
        sender: 'stylist',
        text: data.text,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, stylistMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: StylistMessage = {
        id: `error-${Date.now()}`,
        sender: 'stylist',
        text: 'Ah, mil perdões! Tive uma pequena oscilação em minha conexão estilística. Mas não se preocupe: você pode explorar toda a nossa curadoria incrível de vestidos e casacos diretamente nos filtros da página principal! ✨',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (q: string) => {
    handleSendMessage(q);
  };

  // Helper parser: scans messages for pattern [prod-X] and extracts associated Product
  const parseRecommendedProducts = (text: string): Product[] => {
    const recommended: Product[] = [];
    const regex = /\[(prod-\d+)\]/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const matchId = match[1];
      const matchedProd = products.find(p => p.id === matchId);
      if (matchedProd && !recommended.some(item => item.id === matchedProd.id)) {
        recommended.push(matchedProd);
      }
    }
    
    return recommended;
  };

  // Basic styling formatter for preview markdown block
  const formatMsgText = (text: string) => {
    // Bold matches
    let formatted = text;
    // Replace markdown double asterisks with bold tag
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-amber-100">$1</strong>');
    // Replace list asterisks with chique bullets
    formatted = formatted.replace(/^\s*\-\s(.*)$/gm, '<li class="ml-2 pl-1 list-none before:content-[\'✨\'] before:mr-2 before:text-[10px] my-1">$1</li>');
    // Clean product code tags references so they only show up visually below
    formatted = formatted.replace(/\[prod-\d+\]/g, '');

    return <div className="space-y-1 font-light text-neutral-200" dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="stylist-drawer-container">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-neutral-950 border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          
          {/* Header section with sparkles */}
          <div className="p-6 bg-gradient-to-r from-neutral-900 to-black border-b border-white/10 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition cursor-pointer font-medium uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded"
              id="stylist-back-btn"
            >
              <span>← Voltar</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 rounded-full overflow-hidden border-2 border-amber-400 bg-neutral-900 shadow-lg shrink-0">
                <img 
                  src={moIaImg} 
                  alt="Mo IA" 
                  className="h-full w-full object-cover scale-110 object-top"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-neutral-950 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-1.5">
                  Mo IA <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                </h2>
                <span className="text-[10px] text-zinc-400 block font-light leading-none mt-1">Sua Consultora de Moda AI</span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-md cursor-pointer transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick preset questions scroll */}
          {messages.length === 1 && !isLoading && (
            <div className="px-6 py-3 bg-neutral-900/55 border-b border-white/5">
              <span className="text-[9px] uppercase tracking-widest text-neutral-500 block mb-2 font-mono">Sugestões de Garimpo:</span>
              <div className="flex flex-wrap gap-2">
                {presetQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(q)}
                    className="text-[10px] bg-white/5 border border-white/10 hover:border-amber-500/30 text-neutral-300 hover:text-amber-200 px-3 py-1.5 rounded-full cursor-pointer transition duration-200 truncate max-w-xs"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message List area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-950" id="stylist-messages-box" ref={scrollRef}>
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const recommendedProducts = parseRecommendedProducts(msg.text);

              return (
                <div key={msg.id} className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {/* Chatbot logo bubble prefix */}
                  {!isUser && (
                    <div className="h-8 w-8 rounded-full overflow-hidden shrink-0 border border-amber-500/25 bg-neutral-900 shadow-md">
                      <img 
                        src={moIaImg} 
                        alt="Mo IA" 
                        className="h-full w-full object-cover scale-110 object-top"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Bubble wrapper */}
                  <div className="max-w-[82%] flex flex-col space-y-1">
                    <div 
                      className={`p-4 rounded-2xl text-xs leading-relaxed border ${
                        isUser 
                          ? 'bg-neutral-800 border-neutral-700 text-white rounded-tr-none' 
                          : 'bg-white/[0.03] border-white/5 text-neutral-100 rounded-tl-none shadow-sm shadow-black/10'
                      }`}
                    >
                      {formatMsgText(msg.text)}
                    </div>
                    
                    {/* Timestamp signature */}
                    <span className="text-[9px] text-neutral-500 font-mono tracking-wider px-1 self-start">
                      {msg.timestamp}
                    </span>

                    {/* Injectable micro product recommendation card */}
                    {recommendedProducts.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 gap-2 pt-2 border-t border-white/5">
                        <span className="text-[10px] uppercase tracking-widest text-amber-300 font-medium">Recomendações Citadas:</span>
                        {recommendedProducts.map((p) => (
                          <div 
                            key={p.id}
                            className="flex items-center gap-3 p-2 bg-white/[0.02] border border-white/5 rounded-xl hover:border-amber-500/20 transition group"
                          >
                            <img 
                              src={p.image} 
                              alt={p.title} 
                              referrerPolicy="no-referrer"
                              className="h-12 w-10 object-contain bg-neutral-950 rounded-md shrink-0 border border-white/5"
                            />
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] uppercase font-mono tracking-tight text-neutral-400">{p.brand}</span>
                              <h4 className="text-[11px] text-white font-normal truncate">{p.title}</h4>
                              <span className="text-xs text-neutral-300 font-mono">R$ {Number(p.price).toFixed(2)}</span>
                            </div>
                            
                            <div className="flex gap-1 shrink-0">
                              <button
                                onClick={() => onViewProduct(p)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-md cursor-pointer transition"
                                title="Visualizar"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => onAddToCart(p)}
                                className="p-1.5 bg-white hover:bg-neutral-100 text-black rounded-md cursor-pointer transition"
                                title="Adicionar"
                              >
                                <ShoppingCart className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* User logo spacer */}
                  {isUser && (
                    <div className="h-8 w-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0 border border-neutral-700">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Scanning processing typing state */}
            {isLoading && (
              <div className="flex gap-3.5 justify-start">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-black shrink-0 animate-pulse">
                  <Bot className="h-4.5 w-4.5 animate-spin-slow" />
                </div>
                <div className="max-w-[80%] flex flex-col space-y-1">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                    <span className="text-xs text-neutral-400 font-light">Analisando o acervo de peças e combinando estilos...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User message input box */}
          <div className="p-4 bg-neutral-900 border-t border-white/10">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputText); }}
              className="flex items-center gap-2"
            >
              <input
                id="stylist-user-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Perguntar ajuda de estilo ou look para jantar..."
                disabled={isLoading}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-amber-500/30 focus:bg-white/10 transition"
              />
              <button
                id="stylist-send-submit-btn"
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0 ${
                  inputText.trim() && !isLoading
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10 hover:bg-amber-400'
                    : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                }`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="text-center mt-2.5">
              <span className="text-[9px] text-neutral-500 font-light">Consultoria integrada com a inteligência do nosso acervo.</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
