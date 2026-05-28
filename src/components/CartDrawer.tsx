import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, MessageSquare, Plus, Minus, CreditCard, Copy, Check, Upload, Image, CheckCircle } from 'lucide-react';
import { CartItem, Product } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CartDrawerProps) {
  if (!isOpen) return null;

  const [clientName, setClientName] = useState(() => localStorage.getItem('modivah_client_name') || 'CLAUDIO SILVA');
  const [clientPhone, setClientPhone] = useState(() => localStorage.getItem('modivah_client_phone') || '27988226654');
  const [address, setAddress] = useState(() => localStorage.getItem('modivah_client_address') || 'RUA DA VITORIA, 914, PRESIDENTE MEDICE, CARIACICA-ES');
  const [paymentMethod, setPaymentMethod] = useState('PIX');

  // Multi-step PIX parameters
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [showUploadField, setShowUploadField] = useState(false);

  const totalCost = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const finalTotal = totalCost;

  // Pre-validate coordinates and step into Step 2: PIX Transfer Instruction
  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) return;

    if (!clientName.trim()) {
      alert('Por favor, preencha o Nome Completo para prosseguir.');
      return;
    }
    if (!clientPhone.trim()) {
      alert('Por favor, preencha o Telefone de contato para prosseguir.');
      return;
    }
    if (!address.trim()) {
      alert('Por favor, preencha o Endereço para prosseguir.');
      return;
    }

    // Save fields explicitly to localStorage
    localStorage.setItem('modivah_client_name', clientName.trim());
    localStorage.setItem('modivah_client_phone', clientPhone.trim());
    localStorage.setItem('modivah_client_address', address.trim());

    // Switch to step 2 payment drawer screen
    setShowPaymentScreen(true);
  };

  // Prepares complete cart log text plus redirect to Claudio's store phone endpoint 27 988226654
  const handleSendFinalReceiptWhatsApp = () => {
    let text = `===================================\n`;
    text += `   🧾 REGISTRO DE PEDIDO - MODIVAH BRECHÓ\n`;
    text += `===================================\n\n`;
    text += `CLIENTE       : ${clientName.trim().toUpperCase()}\n`;
    text += `TELEFONE      : ${clientPhone.trim()}\n`;
    text += `ENDEREÇO      : ${address.trim().toUpperCase()}\n`;
    text += `MÉTODO PGTO   : PIX EFETUADO COM SUCESSO\n`;
    text += `DESTINATÁRIO  : Claudio de Souza Silva (Celular: 27988084694)\n`;
    text += `-----------------------------------\n\n`;
    
    text += `[PEÇAS ADQUIRIDAS]\n`;
    cart.forEach((item, idx) => {
      const productSku = item.product.sku || 'M-' + item.product.id.replace('prod-', '').toUpperCase().padStart(4, '0');
      text += `${idx + 1}. ${item.product.title} (SKU: ${productSku}) - Tam: ${item.product.size}\n`;
      text += `   Marca: ${item.product.brand} | R$ ${item.product.price.toFixed(2)}\n\n`;
    });

    text += `-----------------------------------\n`;
    text += `SUBTOTAL      : R$ ${totalCost.toFixed(2)}\n`;
    text += `FRETE (ENVIO) : NEGOCIAR FRETE\n`;
    text += `TOTAL PEÇAS   : R$ ${finalTotal.toFixed(2)}\n`;
    text += `===================================\n\n`;
    text += `Olá Claudio! Acabo de transferir R$ ${finalTotal.toFixed(2)} via PIX para o seu nome (Claudio de Souza Silva).\n`;
    text += `Gostaria de negociar o frete para o meu endereço.\n`;
    text += `Estou enviando em anexo os dados da minha sacola e o arquivo do comprovante em seguida. Por favor, confirme o recebimento do pedido!`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/5527988226654?text=${encodedText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-container">
      {/* Drawer Overlay backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Slidin panel content container */}
        <div className="w-screen max-w-md bg-neutral-950 border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          
          {/* Header section */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition cursor-pointer font-medium uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded"
              id="cart-back-btn"
            >
              <span>← Voltar</span>
            </button>

            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-amber-300" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-white">Meu Carrinho</h2>
              <span className="px-2 py-0.5 bg-white/5 rounded-full text-xs font-mono text-neutral-400 border border-white/5">
                {cart.length}
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-md cursor-pointer transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {showPaymentScreen ? (
            <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6" id="pix-payment-screen">
              {/* Go Back Header */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <button 
                  onClick={() => setShowPaymentScreen(false)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer font-medium uppercase tracking-wider"
                >
                  <span>← Corrigir Dados / Carrinho</span>
                </button>
                <span className="text-[10px] text-amber-300 font-mono tracking-wider uppercase font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/10">PASSO 2 DE 2</span>
              </div>

              {/* Title PIX */}
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">Confirmar Pagamento PIX</h3>
                <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                  Realize a transferência escaneando o QR Code abaixo ou insira a chave manual no aplicativo do seu banco.
                </p>
              </div>

              {/* Elegant QR Code Frame */}
              <div className="flex flex-col items-center justify-center py-4 px-6 bg-neutral-900 border border-white/5 rounded-2xl relative shadow-inner animate-in zoom-in-95 duration-250">
                <div className="relative p-2 bg-white rounded-lg mb-2 shadow-xl">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=0a0a0a&bgcolor=ffffff&data=${encodeURIComponent(
                      `00020101021126380014br.gov.bcb.pix0111279880846945204000053039865405${finalTotal.toFixed(2)}5802BR5921Claudio de Souza Silva6009Cariacica62070503***6304`
                    )}`}
                    alt="QR Code de Pagamento PIX"
                    className="w-36 h-36 object-contain"
                  />
                  {/* Dynamic decorative visual indicators */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 rounded flex items-center justify-center shadow-lg border-2 border-white">
                    <span className="text-[8px] font-black text-black">PIX</span>
                  </div>
                </div>
                
                {/* Dynamic pricing tags */}
                <span className="text-lg font-mono text-amber-300 font-bold tracking-tight">R$ {finalTotal.toFixed(2)}</span>
                <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-medium mt-0.5">Claudio de Souza Silva</span>
              </div>

              {/* PIX Details card */}
              <div className="space-y-3 bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-white/5">
                    <div>
                      <span className="text-[9px] text-neutral-500 block font-light uppercase">Banco / Destinatário</span>
                      <span className="text-neutral-200 font-medium">Claudio de Souza Silva</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">Chave Telefone</span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <div>
                      <span className="text-[9px] text-neutral-500 block font-light uppercase">Chave PIX (Telefone)</span>
                      <span className="text-amber-200 font-mono font-bold tracking-wide">27 988084694</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('27988084694');
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 2000);
                      }}
                      className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-xs text-white rounded-lg flex items-center gap-1 cursor-pointer transition active:scale-95"
                    >
                      {copiedKey ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-neutral-400" />
                          <span>Copiar Chave</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Prompt Phrase and Image Upload dropzone area */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowUploadField(true)}
                  className="w-full text-center p-3 bg-gradient-to-r from-emerald-950/20 to-emerald-900/20 hover:from-emerald-950/40 hover:to-emerald-900/40 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl transition duration-200 cursor-pointer"
                >
                  <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider block">
                    👉 favor enviar o comprovande de pagamento por aqui
                  </span>
                  <span className="text-[10px] text-neutral-400 font-light block mt-0.5">
                    Clique aqui para anexar o comprovante na tela
                  </span>
                </button>

                {/* Conditionally reveal the local file upload frame */}
                {showUploadField && (
                  <div className="bg-neutral-900 border border-white/10 rounded-xl p-4 space-y-3 animate-in fade-in duration-300">
                    <label className="block text-center cursor-pointer border-2 border-dashed border-white/10 hover:border-emerald-500/30 p-5 rounded-lg transition duration-200 bg-black/20">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setReceiptFile(file);
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                      setReceiptPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setReceiptPreview(null);
                            }
                          }
                        }}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <Upload className="h-5 w-5 text-neutral-400" />
                        <span className="text-xs text-white">Anexar imagem do comprovante</span>
                        <span className="text-[9px] text-neutral-500 font-light">Selecione ou arraste a captura de tela</span>
                      </div>
                    </label>

                    {/* If file is attached */}
                    {receiptFile && (
                      <div className="bg-white/[0.02] border border-white/5 p-3 rounded-lg flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {receiptPreview ? (
                            <img src={receiptPreview} alt="Comprovante" className="h-10 w-10 object-cover rounded border border-white/10" />
                          ) : (
                            <Image className="h-5 w-5 text-neutral-500" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs text-white font-medium truncate">{receiptFile.name}</p>
                            <p className="text-[10px] text-neutral-500 font-mono">{(receiptFile.size / 1024).toFixed(0)} KB</p>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setReceiptFile(null);
                            setReceiptPreview(null);
                          }}
                          className="text-xs text-neutral-500 hover:text-red-400 font-bold px-1.5 py-0.5 rounded hover:bg-white/5 cursor-pointer"
                        >
                          Limpar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Final submit button */}
              <div className="pt-2">
                <button
                  onClick={handleSendFinalReceiptWhatsApp}
                  className="w-full py-3 bg-[#39ff14] hover:bg-[#2ee60d] text-black rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-2 shadow-lg shadow-[#39ff14]/15 active:scale-95 duration-200"
                >
                  <MessageSquare className="h-4 w-4 stroke-[2.5]" />
                  <span>Enviar por WhatsApp</span>
                </button>
                <div className="text-center mt-2.5">
                  <p className="text-[9px] text-neutral-500 leading-normal text-justify">
                    Ao confirmar, abriremos o seu WhatsApp de suporte do número **27 988226654** com um resumo elegante pronto. Basta colar ou carregar a foto do comprovante que você selecionou!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Cart item listing container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4" id="cart-items-list">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-white/5 rounded-full mb-4">
                      <ShoppingBag className="h-8 w-8 text-neutral-600" />
                    </div>
                    <h3 className="text-sm font-medium text-white mb-1">Seu carrinho está vazio</h3>
                    <p className="text-xs text-neutral-500 max-w-xs leading-relaxed text-justify sm:text-center">
                      Explore nossa curadoria premium e selecione roupas que traduzam sua identidade autêntica.
                    </p>
                    <button
                      onClick={onClose}
                      className="mt-6 px-5 py-2.5 bg-white text-black font-medium text-xs uppercase tracking-widest rounded-full cursor-pointer hover:bg-neutral-200 transition"
                    >
                      ← Voltar para os Produtos
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div 
                      key={item.product.id}
                      className="flex gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-white/10 transition group"
                    >
                      {/* Thumbnail */}
                      <div className="h-32 w-24 sm:h-36 sm:w-28 bg-neutral-900 border border-white/10 rounded-xl overflow-hidden shrink-0 shadow-lg relative group-hover:border-white/20 transition">
                        <img 
                          src={item.product.image} 
                          alt={item.product.title} 
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>

                      {/* Descriptions block */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <span className="text-[10px] uppercase tracking-wider text-amber-300 font-bold">
                              {item.product.brand}
                            </span>
                            
                            {/* Remove item button */}
                            <button
                              onClick={() => onRemoveItem(item.product.id)}
                              className="text-neutral-500 hover:text-red-400 p-0.5 cursor-pointer transform hover:scale-110 transition"
                              title="Remover item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <h4 className="text-sm font-medium text-white line-clamp-2 whitespace-normal leading-snug my-1.5">
                            {item.product.title}
                          </h4>
                          
                          <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                            <span>Tam: <strong>{item.product.size}</strong></span>
                            <span>•</span>
                            <span>Cond: <strong>{item.product.condition}</strong></span>
                            {item.product.stock !== undefined && (
                              <>
                                <span>•</span>
                                <span className="text-amber-200">Estoq: {item.product.stock} un.</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Counts slider and subtotal pricing */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center bg-white/5 border border-white/10 rounded-md">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, -1)}
                              className="px-2 py-0.5 text-neutral-400 hover:text-white cursor-pointer"
                              title="Diminuir"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs text-white font-mono min-w-[16px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              className="px-2 py-0.5 text-neutral-400 hover:text-white cursor-pointer"
                              title="Aumentar"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <span className="text-xs text-white font-mono">
                            R$ {(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout pricing box */}
              {cart.length > 0 && (
                <div className="p-6 bg-neutral-900 border-t border-white/10 space-y-4 max-h-[60%] overflow-y-auto">
                  
                  {/* Form de Dados do Cliente */}
                  <div className="space-y-3 pb-3 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Recibo & Entrega</h4>
                      <span className="text-[9px] text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 font-mono font-bold uppercase border border-emerald-500/25">Automático</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] text-neutral-400 block mb-0.5 font-medium">Nome Completo</label>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                          placeholder="Ex: CLAUDIO SILVA"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-neutral-400 block mb-0.5 font-medium">Telefone de Contato</label>
                          <input
                            type="tel"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                            placeholder="Ex: 27 988226654"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-neutral-400 block mb-0.5 font-medium">Método de Pagamento</label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                          >
                            <option className="bg-neutral-900 text-white" value="PIX">PIX</option>
                            <option className="bg-neutral-900 text-white" value="Outras Formas (Falar como Atendente)">Outras Formas (Falar com Atendente)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] text-neutral-400 block mb-0.5 font-medium">Endereço Completo</label>
                      <textarea
                        rows={2}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 leading-normal resize-none font-light"
                        placeholder="RUA DA VITORIA, 914, PRESIDENTE MEDICE, CARIACICA-ES"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-amber-300 block mb-0.5 font-semibold">Envio / Frete</label>
                      <div className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-lg px-2.5 py-1.5 flex items-center justify-center uppercase tracking-wider">
                        🤝 NEGOCIAR FRETE VIA WHATSAPP
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Subtotal ({cart.length} itens)</span>
                    <span className="font-mono">R$ {totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Higienização & Curadoria</span>
                    <span className="text-emerald-400 font-medium">Inclusa grátis</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Frete (Envio)</span>
                    <span className="text-xs text-amber-300 font-medium uppercase font-sans">A negociar</span>
                  </div>
                  
                  <div className="pt-4 border-t border-white/5 flex justify-between items-baseline">
                    <span className="text-sm font-light text-white">Total Geral (Peças)</span>
                    <div className="text-right">
                      <span className="text-xl font-mono text-amber-300 font-bold tracking-tight">
                        R$ {finalTotal.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-emerald-400 font-medium">Pagamento à vista via PIX</p>
                      <p className="text-[9px] text-neutral-400 mt-0.5 font-light leading-tight">Frete a combinar posteriormente com o atendente</p>
                    </div>
                  </div>

                  {/* Actions dispatch buttons */}
                  <div className="pt-2 space-y-2">
                    <button
                      id="cart-checkout-whatsapp-btn"
                      onClick={handleCheckoutWhatsApp}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 active:scale-95 duration-200"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Ir para Pagamento PIX</span>
                    </button>
                    
                    <button
                      onClick={onClearCart}
                      className="w-full py-2 border border-white/5 hover:border-white/10 text-neutral-500 hover:text-white rounded-lg text-[10px] uppercase tracking-wider transition font-medium cursor-pointer"
                    >
                      Limpar Todo o Carrinho
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-[9px] text-neutral-500 leading-normal">
                      Ao clicar em prosseguir, você visualizará a chave PIX e local para anexar o comprovante do seu pedido.
                    </p>
                  </div>

                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
