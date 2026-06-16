import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, MessageSquare, Plus, Minus, CreditCard, Copy, Check, Upload, Image, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { CartItem, Product } from '../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Helper to compute standard CRC16 CCITT checksum for PIX payload validation
function computeCrc16(data: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    for (let b = 0; b < 8; b++) {
      const bit = ((code >> (7 - b)) & 1) === 1;
      const c15 = ((crc >> 15) & 1) === 1;
      crc <<= 1;
      if (c15 !== bit) {
        crc ^= polynomial;
      }
    }
  }
  crc &= 0xFFFF;
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Generate valid, cross-bank compatible Brazil PIX BR Code Payload
function getPixQrCodePayload(amount: number): string {
  // Key: "+5527988084694" is the official BCB cellphone key format
  const key = "+5527988084694";
  
  const merchantAccountInfo = `0014br.gov.bcb.pix0114${key}`;
  const merchantAccountTag = `26${merchantAccountInfo.length.toString().padStart(2, '0')}${merchantAccountInfo}`;
  
  const mcc = "52040000";
  const currency = "5303986";
  
  const amountStr = amount.toFixed(2);
  const amountTag = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;
  
  const country = "5802BR";
  
  const name = "Claudio Silva";
  const nameTag = `59${name.length.toString().padStart(2, '0')}${name}`;
  
  const city = "Cariacica";
  const cityTag = `60${city.length.toString().padStart(2, '0')}${city}`;
  
  const additionalData = "0503***";
  const additionalDataTag = `62${additionalData.length.toString().padStart(2, '0')}${additionalData}`;
  
  const basePayload = `000201${merchantAccountTag}${mcc}${currency}${amountTag}${country}${nameTag}${cityTag}${additionalDataTag}6304`;
  const checksum = computeCrc16(basePayload);
  return `${basePayload}${checksum}`;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  currentClient?: any;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  currentClient
}: CartDrawerProps) {
  if (!isOpen) return null;

  const [whatsappNotFound, setWhatsAppNotFound] = useState(false);

  const triggerWhatsApp = (phone: string, text: string) => {
    setWhatsAppNotFound(false);
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    const encodedText = encodeURIComponent(text);
    const deepLink = `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`;

    const start = Date.now();
    let opened = false;

    const onBlur = () => {
      opened = true;
    };
    window.addEventListener('blur', onBlur);

    // Navigate to local deep link safely
    window.location.href = deepLink;

    setTimeout(() => {
      window.removeEventListener('blur', onBlur);
      if (!opened && document.hasFocus()) {
        const elapsed = Date.now() - start;
        if (elapsed < 1900) {
          setWhatsAppNotFound(true);
        }
      }
    }, 1500);
  };

  const [clientName, setClientName] = useState(() => {
    if (currentClient && currentClient.name) return currentClient.name;
    return localStorage.getItem('modivah_client_name') || '';
  });
  const [clientPhone, setClientPhone] = useState(() => {
    if (currentClient) return currentClient.whatsapp || currentClient.phone || '';
    return localStorage.getItem('modivah_client_phone') || '';
  });
  const [address, setAddress] = useState(() => {
    if (currentClient && currentClient.city) {
      const defaultAddr = `RUA PRINCIPAL, CENTRO, ${currentClient.city.toUpperCase()}-${currentClient.state.toUpperCase()}`;
      return localStorage.getItem('modivah_client_address') || defaultAddr;
    }
    return localStorage.getItem('modivah_client_address') || '';
  });
  const [paymentMethod, setPaymentMethod] = useState('PIX');

  // Multi-step PIX parameters
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const totalCost = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const finalTotal = totalCost;

  // Real-time stock transaction states
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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

  const [orderCompletedData, setOrderCompletedData] = useState<{ id: string, name: string, total: number, date: string, waText: string } | null>(null);

  // Prepares complete cart log text plus redirect to Claudio's store phone endpoint 27 988084694
  const handleSendFinalReceiptWhatsApp = () => {
    if (!receiptFile) {
      alert("Por favor, anexe o comprovante de pagamento para continuar.");
      return;
    }

    const orderId = `ord-${Date.now()}-${Math.floor(1000 + Math.random() * 9500)}`;

    let text = `Olá, segue comprovante referente ao pedido nº ${orderId}.\n\n`;
    text += `Cliente: ${clientName.trim()}\n`;
    text += `Valor: R$ ${finalTotal.toFixed(2)}\n\n`;
    text += `Favor confirmar o recebimento.`;

    // Commit the order permanently in live Firestore database for Intel & reporting!
    const commitOrderToFirestore = async () => {
      setIsCheckingStock(true);
      setCheckoutError(null);
      try {
        const orderRef = doc(db, 'orders', orderId);
        
        const orderProducts = cart.map(item => ({
          productId: item.product.id,
          title: item.product.title,
          price: item.product.price,
          quantity: item.quantity,
          sku: item.product.sku || 'M-GEN'
        }));

        const { runTransaction } = await import('firebase/firestore');

        await runTransaction(db, async (transaction) => {
          const productLogSnaps = [];

          // 1. Core Stock read validations
          for (const item of cart) {
            const prodRef = doc(db, 'products', item.product.id);
            const sn = await transaction.get(prodRef);
            if (!sn.exists()) {
              throw new Error(`Produto "${item.product.title}" não encontrado no acervo.`);
            }
            const data = sn.data();
            const currentStock = typeof data.stock === 'number' ? data.stock : 0;
            
            if (currentStock < item.quantity) {
              throw new Error(`Produto indisponível. Esta peça já foi vendida.`);
            }

            productLogSnaps.push({ 
              ref: prodRef, 
              id: item.product.id, 
              title: item.product.title, 
              previousStock: currentStock, 
              newStock: currentStock - item.quantity, 
              quantity: item.quantity 
            });
          }

          // 2. Perform ACID updates in transaction context
          for (const ps of productLogSnaps) {
            transaction.update(ps.ref, {
              stock: ps.newStock,
              status: ps.newStock <= 0 ? 'sold' : 'available'
            });

            // Audit Log direct transaction record entry for real-time reporting
            const movementId = `mov-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const movementRef = doc(db, 'stock_movements', movementId);
            transaction.set(movementRef, {
              id: movementId,
              productId: ps.id,
              productTitle: ps.title,
              type: 'saida',
              quantity: ps.quantity,
              reason: 'venda_cliente',
              previousStock: ps.previousStock,
              newStock: ps.newStock,
              operator: clientName.trim(),
              createdAt: new Date().toISOString()
            });
          }

          // 3. Complete order details insertion with new custom state parameter
          transaction.set(orderRef, {
            id: orderId,
            clientId: currentClient ? currentClient.id : 'anonymous_client',
            clientName: clientName.trim(),
            clientPhone: clientPhone.trim(),
            address: address.trim(),
            products: orderProducts,
            total: finalTotal,
            paymentMethod: 'PIX',
            receiptDataUrl: receiptPreview || null,
            status: 'Comprovante Enviado',
            validationStatus: 'Aguardando Conferência',
            dataEnvio: new Date().toLocaleDateString('pt-BR'),
            horaEnvio: new Date().toLocaleTimeString('pt-BR'),
            createdAt: new Date().toISOString()
          });
        });

        // Track purchase behavioral activity in background database
        try {
          const activityId = `act-${Date.now()}`;
          const activityRef = doc(db, 'activities', activityId);
          await setDoc(activityRef, {
            id: activityId,
            clientId: currentClient ? currentClient.id : 'anonymous',
            clientName: clientName.trim(),
            type: 'purchase',
            productId: cart[0]?.product.id || null,
            productTitle: cart.map(item => item.product.title).join(', '),
            price: finalTotal,
            createdAt: new Date().toISOString()
          });
        } catch {}

        // Clean recoveries for these items
        if (currentClient) {
          for (const item of cart) {
            try {
              const recDocId = `rec-${currentClient.id}-${item.product.id}`;
              const recRef = doc(db, 'cart_recovery', recDocId);
              await setDoc(recRef, { 
                isRecovered: true, 
                recoveredAt: new Date().toISOString() 
              }, { merge: true });
            } catch {}
          }
        }

        // Store orderCompletedData to reveal the dual-WhatsApp prompt screen
        setOrderCompletedData({
          id: orderId,
          name: clientName.trim(),
          total: finalTotal,
          date: new Date().toLocaleDateString('pt-BR'),
          waText: text
        });

        // Clear client cart & stop loading
        onClearCart();
        setIsCheckingStock(false);

        // Open WhatsApp automatically for the first number via Deep Link!
        triggerWhatsApp('5527988084694', text);
      } catch (err: any) {
        console.error("Atomic transaction failed of checkout:", err);
        setCheckoutError(err.message || "Produto indisponível. Esta peça já foi vendida.");
        setIsCheckingStock(false);
      }
    };

    commitOrderToFirestore();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-container">
      {/* Drawer Overlay backdrop with highlighted products on the left for Desktop */}
      <div 
        className="absolute inset-0 bg-[#000000]/40 backdrop-blur-sm transition-opacity flex items-center justify-start pr-12 md:pr-[450px]" 
        onClick={onClose}
      >
        {cart.length > 0 && (
          <div className="hidden md:flex flex-col gap-5 p-8 overflow-y-auto h-full max-w-xl flex-grow items-center justify-center pointer-events-none select-none">
            <div className="text-center space-y-1.5 mb-2">
              <span className="px-3 py-1 bg-[#EE4D2D]/10 border border-[#EE4D2D]/20 text-[#EE4D2D] text-[10px] font-bold uppercase tracking-widest rounded-full animate-pulse">
                ✨ Peças na sua Sacola Premium
              </span>
              <p className="text-xs text-zinc-500 font-normal max-w-sm">
                Confira abaixo as peças que estão no seu carrinho:
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-5 w-full max-w-md">
              {cart.map((item) => (
                <div 
                  key={`drawer-left-${item.product.id}`}
                  className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-lg flex flex-col"
                >
                  <div className="aspect-[4/5] relative bg-zinc-50 w-full overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 select-none pointer-events-none scale-110 blur-md opacity-30">
                      <img src={item.product.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                    </div>
                    <img 
                      src={item.product.image} 
                      alt={item.product.title}
                      className="relative z-10 max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-[#EE4D2D] rounded px-1.5 py-0.5 text-[9px] font-mono text-white font-bold uppercase">
                      {item.product.brand}
                    </div>
                    <div className="absolute bottom-3 right-3 bg-zinc-200 border border-zinc-300 rounded px-1.5 py-0.5 text-[9px] font-mono text-zinc-700 font-bold uppercase">
                      TAM {item.product.size}
                    </div>
                  </div>
                  <div className="p-3 bg-white border-t border-zinc-100">
                    <h4 className="text-[11px] text-zinc-800 font-bold truncate mb-1">
                      {item.product.title}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#EE4D2D] font-mono font-bold">
                        R$ {Number(item.product.price).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Qtd: {item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Slidin panel content container */}
        <div className="w-screen max-w-md bg-white border-l border-zinc-250 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          
          {/* Header section */}
          <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 transition cursor-pointer font-bold uppercase tracking-wider bg-zinc-100 px-2.5 py-1 rounded"
              id="cart-back-btn"
            >
              <span>← Voltar</span>
            </button>

            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#EE4D2D]" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-800">Meu Carrinho</h2>
              <span className="px-2 py-0.5 bg-[#EE4D2D]/10 rounded-full text-xs font-mono font-bold text-[#EE4D2D] border border-[#EE4D2D]/20">
                {cart.length}
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 rounded-md cursor-pointer transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {orderCompletedData ? (
            <div className="flex-1 flex flex-col justify-between overflow-y-auto p-6 space-y-6 text-zinc-700" id="order-completed-view">
              <div className="space-y-6">
                <div className="text-center space-y-3 pt-6 animate-in zoom-in-95 duration-200">
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600">
                    <CheckCircle className="h-7 w-7 stroke-[2.5]" />
                  </div>
                  <h3 className="text-sm font-bold tracking-widest uppercase text-[#EE4D2D]">PEDIDO REALIZADO!</h3>
                  <p className="text-xs text-zinc-500 font-normal max-w-xs mx-auto">
                    Obrigado, <span className="text-zinc-850 font-bold">{orderCompletedData.name}</span>. Seu pedido foi processado com sucesso.
                  </p>
                </div>

                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-2.5 font-mono text-[11px]">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                    <span className="text-zinc-400 uppercase tracking-widest text-[9px]">ID Pedido</span>
                    <span className="text-zinc-800 font-bold">#{orderCompletedData.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                    <span className="text-zinc-400 uppercase tracking-widest text-[9px]">Valor Total</span>
                    <span className="text-[#EE4D2D] font-bold">R$ {orderCompletedData.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-zinc-400 uppercase tracking-widest text-[9px]">Data da Compra</span>
                    <span className="text-zinc-600">{orderCompletedData.date}</span>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <p className="text-[10.5px] text-amber-800 leading-relaxed text-justify">
                    <strong>Aviso de Comprovante:</strong> O sistema abriu automaticamente o WhatsApp para o primeiro parceiro de atendimento. Envie também no segundo número para agilizar a liberação rápida do seu frete!
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-200 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    triggerWhatsApp('5527988084694', orderCompletedData.waText);
                  }}
                  className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-lg active:scale-95 duration-150"
                >
                  <MessageSquare className="h-4 w-4 stroke-[3]" />
                  <span>Enviar p/ Suporte 1 (27 98808-4694)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerWhatsApp('5527988226654', orderCompletedData.waText);
                  }}
                  className="w-full py-3.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-[#25D366] font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-sm active:scale-95 duration-150"
                >
                  <MessageSquare className="h-4 w-4 stroke-[3]" />
                  <span>Enviar p/ Suporte 2 (27 98822-6654)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderCompletedData(null);
                    setShowPaymentScreen(false);
                    onClose();
                  }}
                  className="w-full py-3 bg-zinc-100 text-zinc-800 font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer hover:bg-zinc-200 transition text-center block"
                >
                  Continuar Navegando
                </button>
              </div>
            </div>
          ) : showPaymentScreen ? (
            <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6" id="pix-payment-screen">
              {/* Go Back Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <button 
                  onClick={() => setShowPaymentScreen(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-800 flex items-center gap-1 cursor-pointer font-bold uppercase tracking-wider"
                >
                  <span>← Corrigir Dados / Carrinho</span>
                </button>
                <span className="text-[10px] text-[#EE4D2D] font-mono tracking-wider uppercase font-bold px-2 py-0.5 rounded bg-[#EE4D2D]/10 border border-[#EE4D2D]/10">PASSO 2 DE 2</span>
              </div>

               {/* Title PIX */}
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-zinc-850 tracking-wide uppercase">Confirmar Pagamento PIX</h3>
                <p className="text-[11px] text-zinc-500 font-normal leading-relaxed">
                  Realize a transferência escaneando o QR Code abaixo ou insira a chave manual no aplicativo do seu banco.
                </p>
              </div>

              {/* Elegant QR Code Frame */}
              <div className="flex flex-col items-center justify-center py-4 px-6 bg-zinc-50 border border-zinc-200 rounded-2xl relative shadow-inner animate-in zoom-in-95 duration-250">
                <div className="relative p-2 bg-white rounded-lg mb-2 shadow-xl border border-zinc-200">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=0a0a0a&bgcolor=ffffff&data=${encodeURIComponent(
                      getPixQrCodePayload(finalTotal)
                    )}`}
                    alt="QR Code de Pagamento PIX"
                    className="w-36 h-36 object-contain"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 rounded flex items-center justify-center shadow-lg border-2 border-white">
                    <span className="text-[8px] font-black text-white">PIX</span>
                  </div>
                </div>
                
                {/* Dynamic pricing tags */}
                <span className="text-lg font-mono text-[#EE4D2D] font-bold tracking-tight">R$ {finalTotal.toFixed(2)}</span>
                <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-bold mt-0.5">Claudio de Souza Silva</span>
              </div>

              {/* PIX Details card */}
              <div className="space-y-3 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-zinc-200">
                    <div>
                      <span className="text-[9px] text-zinc-400 block font-light uppercase">Banco / Destinatário</span>
                      <span className="text-zinc-800 font-bold">Claudio de Souza Silva</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono font-medium">PIX Seguro</span>
                  </div>

                  <div className="flex flex-col items-stretch py-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('27988084694');
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 3000);
                      }}
                      className="w-full py-3 px-4 bg-[#EE4D2D] hover:bg-[#FF6A4D] active:scale-[0.98] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-md uppercase tracking-wider"
                    >
                      {copiedKey ? (
                        <>
                          <Check className="h-4 w-4 stroke-[3]" />
                          <span>Chave PIX copiada com sucesso</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copiar chave PIX para pagamento</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Mandatory Image/PDF Upload dropzone area */}
              <div className="space-y-3">
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-300">
                  <div className="text-[11px] font-bold text-[#EE4D2D] uppercase tracking-widest text-center">
                    📎 Envio de Comprovante Obrigatório
                  </div>
                  <label className="block text-center cursor-pointer border-2 border-dashed border-zinc-300 hover:border-[#EE4D2D]/50 p-5 rounded-lg transition duration-200 bg-white">
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,.pdf,image/png,image/jpeg,image/jpg,application/pdf" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const extension = file.name.split('.').pop()?.toLowerCase();
                          const allowed = ['jpg', 'jpeg', 'png', 'pdf'];
                          if (!extension || !allowed.includes(extension)) {
                            alert('Formato inválido! Somente arquivos JPG, JPEG, PNG e PDF são aceitos.');
                            return;
                          }
                          setReceiptFile(file);
                          if (file.type.startsWith('image/')) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setReceiptPreview(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          } else {
                            // Render a nice generic visual template for PDF documents
                            setReceiptPreview("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23ef4444' stroke-width='2'><path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/><polyline points='14 2 14 8 20 8'/></svg>");
                          }
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <Upload className="h-5 w-5 text-zinc-400" />
                      <span className="text-xs text-zinc-800 font-bold">Anexar comprovante de pagamento</span>
                      <span className="text-[9px] text-zinc-500 font-light">Formatos suportados: JPG, JPEG, PNG, PDF</span>
                    </div>
                  </label>

                  {/* If file is attached */}
                  {receiptFile && (
                    <div className="bg-white border border-zinc-200 p-3 rounded-lg flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {receiptPreview ? (
                          <img src={receiptPreview} alt="Comprovante" className="h-10 w-10 object-cover rounded border border-zinc-200" />
                        ) : (
                          <Image className="h-5 w-5 text-zinc-500" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-800 font-semibold truncate">{receiptFile.name}</p>
                           <p className="text-[10px] text-zinc-500 font-mono">{(receiptFile.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setReceiptFile(null);
                          setReceiptPreview(null);
                        }}
                        className="text-xs text-zinc-500 hover:text-[#EE4D2D] font-bold px-1.5 py-0.5 rounded hover:bg-zinc-100 cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Final submit button */}
              <div className="pt-2 space-y-3">
                {checkoutError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-bold text-center leading-relaxed">
                    😞 {checkoutError}
                  </div>
                )}

                {/* Validation Info Alert Message */}
                {!receiptFile && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center text-amber-800 text-xs font-semibold animate-pulse font-sans">
                    ⚠️ Anexe o comprovante de pagamento para continuar.
                  </div>
                )}

                <button
                  onClick={handleSendFinalReceiptWhatsApp}
                  disabled={isCheckingStock || !receiptFile}
                  className="w-full py-3 bg-[#EE4D2D] hover:bg-[#ff5131] text-white rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-2 shadow-md active:scale-95 duration-200 disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  {isCheckingStock ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-white" />
                      <span>Verificando estoque...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 stroke-[2.5]" />
                      <span>ENVIAR COMPROVANTE</span>
                    </>
                  )}
                </button>
                <div className="text-center mt-2.5">
                  <p className="text-[9px] text-zinc-400 leading-normal">
                    Após anexar o arquivo válido, o envio será habilitado. Ao clicar, abriremos seu WhatsApp automaticamente enviando o comprovante diretamente para nosso suporte oficial no número **27 98808-4694**!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col overflow-y-auto" id="cart-items-list-container">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 min-h-[300px]">
                  <div className="p-4 bg-zinc-100 rounded-full mb-4 border border-zinc-200">
                    <ShoppingBag className="h-8 w-8 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-800 mb-1">Seu carrinho está vazio</h3>
                  <p className="text-xs text-zinc-500 max-w-xs leading-relaxed text-justify sm:text-center">
                    Explore nossa curadoria premium e selecione roupas que traduzam sua identidade autêntica.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-6 px-5 py-2.5 bg-[#EE4D2D] text-white hover:bg-[#FF6A4D] font-bold text-xs uppercase tracking-widest rounded-full cursor-pointer transition"
                  >
                    ← Voltar para os Produtos
                  </button>
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Cart Item Listing Section */}
                  <div className="p-6 space-y-4 border-b border-zinc-200">
                    {cart.map((item) => {
                      const itemOrigPrice = Number(item.product.originalPrice) || (Math.round((Number(item.product.price) * 2.5) / 10) * 10);
                      const isEcoNew = item.product.condition === 'Novo com Etiqueta';
                      const isExcellent = item.product.condition === 'Excelente';

                      return (
                        <div 
                          key={item.product.id}
                          className="flex gap-4 p-4 bg-white border border-zinc-200 rounded-2xl hover:border-zinc-300 transition-all duration-300 group shadow-sm"
                        >
                          {/* Thumbnail */}
                          <div className="relative aspect-[4/5] w-24 sm:w-28 bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                            <div className="absolute inset-0 select-none pointer-events-none scale-110 blur-md opacity-30">
                              <img src={item.product.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            </div>
                            <img 
                              src={item.product.image} 
                              alt={item.product.title} 
                              referrerPolicy="no-referrer"
                              className="relative z-10 max-h-full max-w-full object-contain group-hover:scale-103 transition duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800";
                              }}
                            />
                          </div>

                          {/* Highlighted Descriptions block & Luxury metadata */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                            <div>
                              <div className="flex justify-between items-start gap-1 mb-1">
                                <span className="text-[9px] uppercase tracking-widest text-[#EE4D2D] font-bold bg-[#EE4D2D]/10 border border-[#EE4D2D]/20 px-2 py-0.5 rounded-md">
                                  {item.product.brand}
                                </span>
                                
                                {/* Remove item button */}
                                <button
                                  onClick={() => onRemoveItem(item.product.id)}
                                  className="text-zinc-400 hover:text-[#EE4D2D] p-1 cursor-pointer transform hover:scale-110 transition rounded hover:bg-zinc-100"
                                  title="Remover item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              
                              <h4 className="text-xs font-bold text-zinc-800 hover:text-[#EE4D2D] transition-colors line-clamp-1 whitespace-normal leading-tight font-sans">
                                {item.product.title}
                              </h4>
                              
                              {/* Rich info badges instead of plain text */}
                              <div className="flex flex-wrap gap-1.5 items-center mt-2">
                                <span className="bg-zinc-200 border border-zinc-300 text-zinc-700 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  TAM {item.product.size}
                                </span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                                  isEcoNew 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    : isExcellent
                                      ? 'bg-blue-50 text-blue-600 border-blue-200'
                                      : 'bg-orange-50 text-orange-600 border-orange-200'
                                }`}>
                                  {item.product.condition}
                                </span>
                                {item.product.stock !== undefined && item.product.stock <= 1 && (
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 bg-red-50 border border-red-200 text-red-500 rounded uppercase tracking-wide animate-pulse">
                                    Última Peça! 🏷️
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Subtotal highlights + Original-price comparative details */}
                            <div className="mt-3 pt-2 border-t border-zinc-200 flex items-end justify-between">
                              <div className="flex items-center bg-zinc-100 border border-zinc-200 rounded-lg p-0.5">
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, -1)}
                                  className="px-1.5 py-0.5 text-zinc-400 hover:text-zinc-800 cursor-pointer hover:bg-zinc-200 rounded transition"
                                  title="Diminuir"
                                >
                                  <Minus className="h-2.5 w-2.5" />
                                </button>
                                <span className="text-[10px] text-zinc-800 font-mono min-w-[12px] text-center font-bold px-1">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                                  className="px-1.5 py-0.5 text-zinc-400 hover:text-zinc-800 cursor-pointer hover:bg-zinc-200 rounded transition"
                                  title="Aumentar"
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                </button>
                              </div>

                              <div className="text-right flex flex-col">
                                {/* Comparative Pricing */}
                                <span className="text-[8px] text-zinc-400 line-through font-mono">
                                  R$ {(itemOrigPrice * item.quantity).toFixed(2)}
                                </span>
                                <span className="text-[11px] text-[#EE4D2D] font-mono font-bold tracking-tight flex items-center justify-end gap-1">
                                  <span className="text-[7px] text-zinc-400 font-sans uppercase">Brechó</span>
                                  <span>R$ {(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Checkout Pricing Form */}
                  <div className="p-6 bg-zinc-50 border-t border-zinc-200 space-y-4">
                    {/* Form de Dados do Cliente */}
                    <div className="space-y-3 pb-3 border-b border-zinc-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] text-[#EE4D2D] font-bold uppercase tracking-wider">Recibo & Entrega</h4>
                        <span className="text-[9px] text-[#25D366] px-1.5 py-0.5 rounded bg-emerald-50 font-mono font-bold uppercase border border-emerald-200">Automático</span>
                      </div>
                      
                      <div className="space-y-3 font-sans">
                        <div>
                          <label className="text-[9px] text-zinc-500 block mb-0.5 font-bold">Nome Completo</label>
                          <input
                            type="text"
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#EE4D2D] font-semibold"
                            placeholder="Ex: CLAUDIO SILVA"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9px] text-zinc-500 block mb-0.5 font-bold">Telefone de Contato</label>
                            <input
                              type="tel"
                              value={clientPhone}
                              onChange={(e) => setClientPhone(e.target.value)}
                              className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#EE4D2D] font-mono"
                              placeholder="Ex: 27 988226654"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-500 block mb-0.5 font-bold">Método de Pagamento</label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="w-full bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#EE4D2D] font-semibold"
                            >
                              <option value="PIX">PIX</option>
                              <option value="Outras Formas (Falar como Atendente)">Outras Formas (Falar com Atendente)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] text-zinc-500 block mb-0.5 font-bold">Endereço Completo</label>
                        <textarea
                          rows={2}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-[#EE4D2D] leading-normal resize-none font-semibold"
                          placeholder="RUA DA VITORIA, 914, PRESIDENTE MEDICE, CARIACICA-ES"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-zinc-500 block mb-0.5 font-bold">Envio / Frete</label>
                        <div className="w-full bg-orange-50 border border-orange-200 text-[#EE4D2D] text-xs font-bold rounded-lg px-2.5 py-1.5 flex items-center justify-center uppercase tracking-wider">
                          🤝 NEGOCIAR FRETE VIA WHATSAPP
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Subtotal ({cart.length} itens)</span>
                      <span className="font-mono text-zinc-800 font-semibold">R$ {totalCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-zinc-500">
                      <span>Frete (Envio)</span>
                      <span className="text-xs text-[#EE4D2D] font-bold uppercase font-sans">A negociar</span>
                    </div>
                    
                    <div className="pt-4 border-t border-zinc-200 flex justify-between items-baseline">
                      <span className="text-sm font-semibold text-zinc-850">Total Geral (Peças)</span>
                      <div className="text-right">
                        <span className="text-xl font-mono text-[#EE4D2D] font-bold tracking-tight">
                          R$ {finalTotal.toFixed(2)}
                        </span>
                        <p className="text-[10px] text-emerald-600 font-bold">Pagamento à vista via PIX</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5 font-light leading-tight">Frete a combinar posteriormente com o atendente</p>
                      </div>
                    </div>

                    {/* Actions dispatch buttons */}
                    <div className="pt-2 space-y-2">
                      <button
                        id="cart-checkout-whatsapp-btn"
                        onClick={handleCheckoutWhatsApp}
                        className="w-full py-3 bg-[#EE4D2D] hover:bg-[#FF6A4D] text-white rounded-lg text-xs font-bold uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-2 shadow-md active:scale-95 duration-200"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>Ir para Pagamento PIX</span>
                      </button>
                      
                      <button
                        onClick={onClearCart}
                        className="w-full py-2 border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 rounded-lg text-[10px] uppercase tracking-wider transition font-semibold cursor-pointer"
                      >
                        Limpar Todo o Carrinho
                      </button>
                    </div>

                    <div className="text-center">
                      <p className="text-[9px] text-zinc-500 leading-normal">
                        Ao clicar em prosseguir, você visualizará a chave PIX e local para anexar o comprovante do seu pedido.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {whatsappNotFound && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl max-w-sm w-full space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-12 h-12 bg-rose-100 border border-rose-200 rounded-full flex items-center justify-center text-rose-600">
              <AlertCircle className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-zinc-800 uppercase font-mono tracking-wider">WhatsApp não encontrado</h4>
              <p className="text-[11px] text-zinc-500 font-normal leading-relaxed">
                Não conseguimos abrir o aplicativo WhatsApp instalado neste celular/computador automaticamente. Por favor, certifique-se de que ele está instalado.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <a 
                href="https://www.whatsapp.com/download" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition text-center block cursor-pointer"
              >
                Instalar WhatsApp
              </a>
              <button 
                type="button"
                onClick={() => setWhatsAppNotFound(false)}
                className="w-full py-2 bg-zinc-100 border border-zinc-200 rounded-xl text-zinc-700 text-xs font-semibold hover:text-zinc-800 transition font-mono uppercase cursor-pointer"
              >
                Voltar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
