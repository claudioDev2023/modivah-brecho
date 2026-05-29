import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, Edit2, Sliders, RefreshCw, Sparkles, Check, Archive, ArrowLeft, Video, BookOpen, AlertCircle, Database, Image as ImageIcon } from 'lucide-react';
import { Product } from '../types';

const IMAGE_DATABASE = [
  { name: 'Vestido Midi Floral Rio (Farm)', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80', category: 'Vestidos' },
  { name: 'Sobretudo de Lã Italiana Noir', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80', category: 'Casacos' },
  { name: 'Bolsa Tiracolo Couro Caramelo', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80', category: 'Acessórios' },
  { name: 'Camisa Pura Seda Off-White', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80', category: 'Blusas' },
  { name: 'Conjunto Alfaiataria Linho Areia', url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80', category: 'Conjuntos' },
  { name: 'Scarpin Salto Classic Blue', url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80', category: 'Calçados' },
  { name: 'Calça Clochard Jeans Escuro', url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80', category: 'Calças' },
  { name: 'Vestido Canelado Midnight Animale', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80', category: 'Vestidos' },
  { name: 'Blazer Estruturado Rosa Pastel', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80', category: 'Casacos' },
  { name: 'Vestido Floral Off-White Romântico', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80', category: 'Vestidos' },
  { name: 'Jaqueta Retrô Jeans Denim Chique', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80', category: 'Casacos' },
  { name: 'Cropped Alfaiataria Noite Preta', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80', category: 'Blusas' }
];

const VIDEO_DATABASE = [
  { name: 'Vídeo Desfile Rio Floral (Drapeado)', url: 'https://assets.mixkit.co/videos/preview/mixkit-woman-holding-a-green-leaf-in-front-of-her-face-34444-large.mp4', label: 'Estilo Carioca' },
  { name: 'Apresentação Vestido Longo Elegante', url: 'https://assets.mixkit.co/videos/preview/mixkit-elegant-woman-modeling-a-pink-draped-dress-34443-large.mp4', label: 'Lookbook Rosa' },
  { name: 'Modelo Studio Swr Pose Clássica', url: 'https://assets.mixkit.co/videos/preview/mixkit-beautiful-girl-in-a-knitted-sweater-modeling-in-studio-34448-large.mp4', label: 'Outono Chic' },
  { name: 'Close up Detalhes Brilho Alta Costura', url: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-details-of-a-glamorous-sparkly-dress-34446-large.mp4', label: 'Luxo Noite' },
  { name: 'Aesthetic Walk Campo Orgânico', url: 'https://assets.mixkit.co/videos/preview/mixkit-aesthetic-portrait-of-a-woman-in-a-rural-field-34445-large.mp4', label: 'Casual Outwear' },
  { name: 'Teste Standard (Trailer Animado)', url: 'https://www.w3schools.com/html/mov_bbb.mp4', label: 'Geral Anúncio' }
];

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void; // Full edit support for existing products
  onUpdateProductStatus: (productId: string, status: 'available' | 'reserved' | 'sold') => void;
  onUpdateProductPrice: (productId: string, price: number) => void;
  onDeleteProduct: (productId: string) => void;
  onResetDatabase: () => void;
}

export default function AdminPanel({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onUpdateProduct,
  onUpdateProductStatus,
  onUpdateProductPrice,
  onDeleteProduct,
  onResetDatabase
}: AdminPanelProps) {
  if (!isOpen) return null;

  // Password Authentication
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('modivah_admin_auth') === 'true';
  });
  const [authError, setAuthError] = useState(false);

  // Editing state: if non-null, we are editing this product id
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form states (shared for creation & editing)
  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('Farm');
  const [brandSelectValue, setBrandSelectValue] = useState('Farm');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Vestidos');
  const [size, setSize] = useState('M');
  const [price, setPrice] = useState('199.00');
  const [originalPrice, setOriginalPrice] = useState('');
  const [condition, setCondition] = useState<'Novo com Etiqueta' | 'Excelente' | 'Gentilmente Usado'>('Excelente');
  const [material, setMaterial] = useState('Viscose de Reflorestamento');
  const [tag, setTag] = useState('Novidade');
  const [image, setImage] = useState('https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [video, setVideo] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('1');

  // Input refs for file uploads from computer
  const fileImgRef = useRef<HTMLInputElement>(null);
  const fileVidRef = useRef<HTMLInputElement>(null);
  const extraFileRef = useRef<HTMLInputElement>(null);
  const [uploadTargetIndex, setUploadTargetIndex] = useState<number | null>(null);

  // Media database navigation/search states
  const [showImageDb, setShowImageDb] = useState(false);
  const [showVideoDb, setShowVideoDb] = useState(false);
  const [imageSearch, setImageSearch] = useState('');
  const [videoSearch, setVideoSearch] = useState('');

  // Quick preset templates to test things quickly
  const chicClothingTemplates = [
    {
      title: 'Bota Atalaia Tratorada Couro',
      brand: 'Schutz',
      category: 'Calçados',
      size: '37',
      price: '320.00',
      condition: 'Excelente' as const,
      material: '100% Couro legítimo bovino',
      tag: 'Calçados Luxo',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
      description: 'Uma bota robusta, moderna e estilosa com acabamento tratorado de última linha Schutz.',
      video: 'https://www.w3schools.com/html/mov_bbb.mp4',
      stock: '2'
    },
    {
      title: 'Vestido Canelado Tricot Midnight',
      brand: 'Animale',
      category: 'Vestidos',
      size: 'P',
      price: '289.00',
      condition: 'Novo com Etiqueta' as const,
      material: 'Tricot canelado acetinado',
      tag: 'Noite Estelar',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
      description: 'Perfeito caimento delineado da grife Animale, ideal para festas elegantes ou eventos noturnos.',
      video: ''
    },
    {
      title: 'Blazer Estruturado Linho Rosa Pastel',
      brand: 'Zara Premium',
      category: 'Casacos',
      size: 'M',
      price: '399.00',
      condition: 'Excelente' as const,
      material: '70% Linho, 30% Algodão',
      tag: 'Alfaiataria Cor',
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800',
      description: 'Estruturação clássica alfaiate com a suavidade fresca do autêntico linho premium Zara.',
      video: ''
    }
  ];

  const handleGenerateRandomChic = () => {
    const template = chicClothingTemplates[Math.floor(Math.random() * chicClothingTemplates.length)];
    setTitle(template.title);
    setBrand(template.brand);
    setCategory(template.category);
    setSize(template.size);
    setPrice(template.price);
    setCondition(template.condition);
    setMaterial(template.material);
    setTag(template.tag);
    setImage(template.image);
    setVideo(template.video || '');
    setDescription(template.description || '');
    setStock(template.stock || '1');
  };

  const handleStartEdit = (p: Product) => {
    setEditingProductId(p.id);
    setTitle(p.title);
    setBrand(p.brand);
    
    const knownBrands = ['Zara Premium', 'Farm', 'Schutz', 'Animale', 'Le Lis Blanc', 'Colcci Alquimia', 'Morena Rosa'];
    if (knownBrands.includes(p.brand)) {
      setBrandSelectValue(p.brand);
    } else {
      setBrandSelectValue('Outros');
    }
    
    setSku(p.sku || '');
    setCategory(p.category);
    setSize(p.size);
    setPrice(p.price.toString());
    setOriginalPrice(p.originalPrice ? p.originalPrice.toString() : '');
    setCondition(p.condition);
    setMaterial(p.material);
    setTag(p.tag || '');
    setImage(p.image);
    setImagesList(p.images || []);
    setVideo(p.video || '');
    setDescription(p.description || '');
    setStock(p.stock !== undefined ? p.stock.toString() : '1');

    // Smooth scroll to the editor form anchor
    const el = document.getElementById('admin-form-anchor');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setTitle('');
    setBrand('Farm');
    setBrandSelectValue('Farm');
    setSku('');
    setCategory('Vestidos');
    setSize('M');
    setPrice('199.00');
    setOriginalPrice('');
    setCondition('Excelente');
    setMaterial('Viscose de Reflorestamento');
    setTag('Novidade');
    setImage('https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800');
    setImagesList([]);
    setVideo('');
    setDescription('');
    setStock('1');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || isNaN(parseFloat(price))) return;

    const finalBrand = brandSelectValue === 'Outros' ? (brand.trim() || 'Outros') : brandSelectValue;
    const baseDescription = description.trim() || `Esta maravilhosa peça da consagrada grife ${finalBrand} representa modernidade consciente. Perfeita em caimento corporativo ou casual, foi meticulosamente higienizada e restaurada.`;
    const parsedStock = isNaN(parseInt(stock)) ? 1 : Math.max(0, parseInt(stock));
    const finalSku = sku.trim() || `M-${Math.floor(1000 + Math.random() * 9000)}`;

    if (editingProductId) {
      // Editing existing product details
      const updatedProd: Product = {
        id: editingProductId,
        title: title.trim(),
        description: baseDescription,
        price: Math.abs(parseFloat(price)),
        originalPrice: originalPrice ? Math.abs(parseFloat(originalPrice)) : undefined,
        category,
        size,
        brand: finalBrand,
        condition,
        material,
        image: image.trim() || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
        images: imagesList.filter(img => img.trim() !== ''),
        video: video.trim() || undefined,
        status: parsedStock <= 0 ? 'sold' : (products.find(p => p.id === editingProductId)?.status === 'sold' ? 'available' : products.find(p => p.id === editingProductId)?.status || 'available'),
        stock: parsedStock,
        tag: tag.trim() || undefined,
        sku: finalSku,
        createdAt: products.find(p => p.id === editingProductId)?.createdAt || new Date().toISOString()
      };

      onUpdateProduct(updatedProd);
      setEditingProductId(null);
    } else {
      // Registering new product
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        title: title.trim(),
        description: baseDescription,
        price: Math.abs(parseFloat(price)),
        originalPrice: originalPrice ? Math.abs(parseFloat(originalPrice)) : undefined,
        category,
        size,
        brand: finalBrand,
        condition,
        material,
        image: image.trim() || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
        images: imagesList.filter(img => img.trim() !== ''),
        video: video.trim() || undefined,
        status: parsedStock <= 0 ? 'sold' : 'available',
        stock: parsedStock,
        tag: tag.trim() || undefined,
        sku: finalSku,
        createdAt: new Date().toISOString()
      };

      onAddProduct(newProd);
    }

    // Reset Form Fields
    setTitle('');
    setDescription('');
    setVideo('');
    setStock('1');
    setSku('');
    setImagesList([]);
    setOriginalPrice('');
    // keep branding & images placeholders
  };

  // 🔐 SCREEN 1: PASSWORD VALIDATION (SÓ ACESSA SE DIGITAR "77277727")
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden" id="admin-auth-container">
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-black/85 backdrop-blur-md" 
          onClick={onClose}
        />

        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-neutral-950 border-l border-white/10 flex flex-col justify-between p-8 shadow-2xl animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <span className="text-xs font-semibold text-neutral-400 tracking-widest uppercase">Verificação</span>
              <button onClick={onClose} className="p-1 hover:bg-white/5 rounded text-neutral-400 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Core Content */}
            <div className="space-y-6 my-auto text-center">
              <div className="inline-flex p-4 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                <Sliders className="h-8 w-8 text-amber-400 animate-pulse" />
              </div>
              
              <div>
                <h2 className="text-xl font-bold tracking-[0.2em] text-white uppercase">Acesso do Criador</h2>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto mt-2 font-light leading-relaxed">
                  Este painel é exclusivo do proprietário de <strong className="text-amber-200">Modivah Brechó</strong>. Insira a senha correspondente para validar.
                </p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (passwordInput === '77277727') {
                    setIsAuthenticated(true);
                    sessionStorage.setItem('modivah_admin_auth', 'true');
                    setAuthError(false);
                  } else {
                    setAuthError(true);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <input
                    type="password"
                    placeholder="Digite a senha de criador..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-center text-white focus:outline-none focus:border-amber-500 font-mono tracking-widest"
                    autoFocus
                  />
                  {authError && (
                    <p className="text-[11px] text-red-400 mt-2 font-light flex items-center justify-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>Senha incorreta! Use a senha correta de 8 dígitos.</span>
                    </p>
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs uppercase tracking-wider rounded-xl transition border border-white/5 cursor-pointer text-center"
                  >
                    ← Voltar para a Loja
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-amber-500/10"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/5 text-center">
              <span className="text-[9px] text-neutral-600 font-mono uppercase tracking-widest">Acesso Protegido Modivah v1.4</span>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // 🔓 SCREEN 2: AUTHENTICATED ADMIN PANEL DRAWER
  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="admin-drawer-container">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm" 
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-neutral-950 border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 bg-bleed border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Botão VOLTAR PROMINENTE */}
              <button 
                onClick={onClose}
                className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition cursor-pointer font-bold uppercase tracking-wider bg-white/5 py-1 px-3 rounded-lg border border-white/10"
                id="admin-header-back-btn"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Voltar</span>
              </button>

              <div className="h-4 w-px bg-white/10 hidden sm:block" />

              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-400" />
                <h2 className="text-xs font-semibold text-white tracking-widest uppercase font-mono">Console Administrativo</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-md cursor-pointer transition lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-8" id="admin-form-anchor">
            
            {/* Quick action section */}
            <section className="bg-amber-950/25 border border-amber-950 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-semibold text-amber-200 uppercase tracking-wider">Ações de Curadora</h3>
                <p className="text-[11px] text-amber-400/80 font-light mt-1">
                  Se você testar modificações e quiser restaurar o catálogo de grife com as 8 fotos originais do acervo.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja recomeçar a curadoria do acervo? Todas as alterações serão perdidas.')) {
                    onResetDatabase();
                    alert('Catálogo original restaurado!');
                  }
                }}
                className="px-4 py-2 bg-amber-600/30 hover:bg-amber-600 border border-amber-500/30 font-medium text-[10px] text-white uppercase tracking-wider rounded-lg transition shrink-0 cursor-pointer"
              >
                Resetar Loja
              </button>
            </section>

            {/* Form list: CADASTRO E EDIÇÃO DE ANÚNCIOS */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-2">
                  {editingProductId ? (
                    <>
                      <Edit2 className="h-4 w-4 text-purple-400" />
                      <span>EDITAR ANÚNCIO ATIVO</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 text-emerald-400" />
                      <span>CADASTRAR NOVA PEÇA ÚNICA</span>
                    </>
                  )}
                </h3>
                
                {/* Generate random template */}
                {!editingProductId && (
                  <button
                    type="button"
                    onClick={handleGenerateRandomChic}
                    className="flex items-center gap-1.5 text-[10px] text-amber-300 hover:text-amber-200 bg-amber-500/5 py-1 px-2.5 rounded-full border border-amber-500/20 cursor-pointer"
                    title="Poupar tempo e preencher aleatório"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Gerar Peça Aleatória</span>
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="bg-white/[0.01] border border-white/5 rounded-xl p-4 space-y-4">
                {editingProductId && (
                  <div className="p-3 bg-purple-950/20 border border-purple-900/35 rounded-lg flex items-center justify-between text-xs text-purple-300">
                    <div>
                      Você está editando a peça única: <strong>ID {editingProductId}</strong>
                    </div>
                    <button 
                      type="button" 
                      onClick={handleCancelEdit} 
                      className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded text-[10px] uppercase font-bold"
                    >
                      Cancelar Edição
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Título da Roupa (Anúncio)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Blazer de Alfaiataria Creme"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Brand field */}
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Grife (Marca)</label>
                    <div className="space-y-1.5">
                      <select
                        value={brandSelectValue}
                        onChange={(e) => {
                          setBrandSelectValue(e.target.value);
                          if (e.target.value !== 'Outros') {
                            setBrand(e.target.value);
                          } else {
                            setBrand('');
                          }
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option className="bg-neutral-900 text-white" value="Zara Premium">Zara Premium</option>
                        <option className="bg-neutral-900 text-white" value="Farm">Farm</option>
                        <option className="bg-neutral-900 text-white" value="Schutz">Schutz</option>
                        <option className="bg-neutral-900 text-white" value="Animale">Animale</option>
                        <option className="bg-neutral-900 text-white" value="Le Lis Blanc">Le Lis Blanc</option>
                        <option className="bg-neutral-900 text-white" value="Colcci Alquimia">Colcci Alquimia</option>
                        <option className="bg-neutral-900 text-white" value="Morena Rosa">Morena Rosa</option>
                        <option className="bg-neutral-900 text-white" value="Outros">Outros</option>
                      </select>
                      {brandSelectValue === 'Outros' && (
                        <input
                          type="text"
                          required
                          placeholder="Digite o nome da marca/grife"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          className="w-full bg-amber-500/5 border border-amber-500/30 rounded-lg px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400 placeholder:text-neutral-600 animate-in fade-in slide-in-from-top-1 duration-200"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-7 gap-4">
                  {/* Category */}
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Categoria</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option className="bg-neutral-900 text-white" value="Vestidos">Vestidos</option>
                      <option className="bg-neutral-900 text-white" value="Casacos">Casacos</option>
                      <option className="bg-neutral-900 text-white" value="Shortes">Shortes</option>
                      <option className="bg-neutral-900 text-white" value="Roupas Fitness">Roupas Fitness</option>
                      <option className="bg-neutral-900 text-white" value="Calçados">Calçados</option>
                      <option className="bg-neutral-900 text-white" value="Blusas">Blusas</option>
                      <option className="bg-neutral-900 text-white" value="Conjuntos">Conjuntos</option>
                      <option className="bg-neutral-900 text-white" value="Calças">Calças</option>
                      <option className="bg-neutral-900 text-white" value="Acessórios">Acessórios</option>
                      <option className="bg-neutral-900 text-white" value="Outros">Outros</option>
                    </select>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Tamanho</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: M, P, 38..."
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Preço Atual (R$)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      placeholder="e.g. 199.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                    />
                  </div>

                  {/* Preço Anterior */}
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Preço Antes (R$)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Semelhante: 499.00"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-amber-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="text-[10px] text-amber-200 block mb-1 font-semibold">Qtd Estoque</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="Ex: 1"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="w-full bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="text-[10px] text-amber-300 block mb-1 font-semibold">SKU do Produto</label>
                    <input
                      type="text"
                      placeholder="Ex: M-9823"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-500 font-mono font-bold"
                    />
                  </div>

                  {/* Tag */}
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Tag Visual</label>
                    <input
                      type="text"
                      placeholder="Ex: Seda Pura, Raro"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Condition selector */}
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Conservação</label>
                    <select
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option className="bg-neutral-900 text-white" value="Novo com Etiqueta">Novo com Etiqueta</option>
                      <option className="bg-neutral-900 text-white" value="Excelente">Excelente estado</option>
                      <option className="bg-neutral-900 text-white" value="Gentilmente Usado">Gentilmente Usado</option>
                    </select>
                  </div>

                  {/* Material composition */}
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">Material de Confecção</label>
                    <input
                      type="text"
                      placeholder="Ex: 100% Algodão Reciclável, Seda"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Edit Narrative / Description */}
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1 flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-neutral-400" />
                    <span>Descrição do Anúncio (História & Detalhes da Roupa)</span>
                  </label>
                  <textarea
                    placeholder="Descreva a peça única, corte, estado de conservação real, caimento, etc..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none font-light leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Custom image option */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">Imagem Principal da Capa 🏷️</label>
                      <button
                        type="button"
                        onClick={() => setShowImageDb(!showImageDb)}
                        className={`text-[10px] px-2 py-0.5 rounded cursor-pointer font-semibold uppercase tracking-wider transition ${
                          showImageDb 
                            ? 'bg-amber-500 text-black' 
                            : 'bg-white/10 hover:bg-white/20 text-text-amber-300'
                        }`}
                      >
                        📂 Banco de Dados ({IMAGE_DATABASE.length})
                      </button>
                    </div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />

                    {/* PC image upload with absolute pointer-based useRef search */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileImgRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 border border-dashed border-amber-500/20 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 hover:text-amber-100 transition-colors py-2 px-3 rounded-lg cursor-pointer text-center text-[10px] font-bold uppercase tracking-wider"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Buscar do meu Computador 💻</span>
                      </button>
                      
                      <input
                        type="file"
                        ref={fileImgRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setImage(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                          // clear to allow same file uploading
                          e.target.value = '';
                        }}
                      />
                    </div>

                    {/* Expandable Image Database selection widget */}
                    {showImageDb && (
                      <div className="bg-neutral-900 border border-amber-500/30 rounded-lg p-3 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Banco de Imagens Modivah</span>
                          <input
                            type="text"
                            placeholder="Buscar no banco (ex: vestidos, casacos...)"
                            value={imageSearch}
                            onChange={(e) => setImageSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                          {IMAGE_DATABASE.filter(img => 
                            img.name.toLowerCase().includes(imageSearch.toLowerCase()) ||
                            img.category.toLowerCase().includes(imageSearch.toLowerCase())
                          ).map((img, i) => {
                            const isSelected = image === img.url;
                            return (
                              <div
                                key={i}
                                onClick={() => {
                                  setImage(img.url);
                                }}
                                className={`relative aspect-square rounded-md overflow-hidden bg-neutral-950 border transition cursor-pointer ${
                                  isSelected ? 'border-amber-500 scale-95' : 'border-white/10 hover:border-white/45'
                                }`}
                                title={img.name}
                              >
                                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/75 p-1 text-[8px] text-neutral-300 truncate font-sans">
                                  {img.name}
                                </div>
                                {isSelected && (
                                  <div className="absolute inset-0 bg-amber-500/15 flex items-center justify-center">
                                    <span className="bg-amber-500 text-black rounded-full p-0.5"><Check className="h-3 w-3" /></span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Additional Gallery Album for multiple images (Up to 10 overall) */}
                    <div className="mt-4 p-4 bg-neutral-950/40 rounded-xl border border-white/5 space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <label className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
                          Mais Imagens da Peça (Álbum / Até 9 Extras)
                        </label>
                        <span className="text-[9px] text-neutral-400 font-mono bg-white/5 px-2 py-0.5 rounded">
                          {imagesList.length + 1} de 10 Fotos Salvas
                        </span>
                      </div>
                      <p className="text-[9px] text-neutral-400 font-light leading-normal">
                        Adicione mais fotos para criar um portfólio rico da peça. Cada anúncio suporta 1 capa principal + até 9 fotos secundárias que ficarão ao lado no anúncio.
                      </p>

                      <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                        {imagesList.map((imgUrl, idx) => (
                          <div key={idx} className="flex gap-2 items-start bg-neutral-900/80 p-2 rounded-lg border border-white/5">
                            {/* Short Preview thumbnail */}
                            <div className="w-10 h-10 rounded bg-black/80 border border-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                              {imgUrl ? (
                                <img src={imgUrl} alt={`Adicional ${idx + 1}`} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[8px] text-neutral-600 uppercase font-bold">Vazio</span>
                              )}
                            </div>

                            <div className="flex-grow space-y-1">
                              <input
                                type="url"
                                placeholder="https:// Link da foto adicional ou carregue do PC"
                                value={imgUrl}
                                onChange={(e) => {
                                  const newList = [...imagesList];
                                  newList[idx] = e.target.value;
                                  setImagesList(newList);
                                }}
                                className="w-full bg-black/50 border border-white/5 rounded px-2 py-1 text-[10px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-amber-500 font-mono"
                              />
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setUploadTargetIndex(idx);
                                    setTimeout(() => extraFileRef.current?.click(), 30);
                                  }}
                                  className="text-[8px] font-bold text-amber-300 hover:text-white uppercase bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded cursor-pointer transition border border-amber-500/30"
                                >
                                  Inserir do meu Computador 💻
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setImagesList(imagesList.filter((_, i) => i !== idx));
                                  }}
                                  className="text-[8px] font-bold text-red-400 hover:text-red-300 uppercase bg-red-400/10 hover:bg-red-400/20 px-2 py-0.5 rounded cursor-pointer transition"
                                >
                                  Excluir
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {imagesList.length < 9 && (
                        <button
                          type="button"
                          onClick={() => {
                            setImagesList([...imagesList, '']);
                          }}
                          className="w-full py-2 bg-amber-500/10 hover:bg-amber-400/25 text-amber-300 border border-dashed border-amber-500/30 rounded-lg text-[9px] font-bold uppercase tracking-widest transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Adicionar Foto Adicional ({9 - imagesList.length} vagas)</span>
                        </button>
                      )}

                      {/* Single dynamic helper file selector */}
                      <input
                        type="file"
                        ref={extraFileRef}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && uploadTargetIndex !== null) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                const newList = [...imagesList];
                                newList[uploadTargetIndex] = reader.result;
                                setImagesList(newList);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = '';
                        }}
                      />
                    </div>
                  </div>

                  {/* Custom video option */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-neutral-400 block flex items-center gap-1">
                        <Video className="h-3 w-3 text-neutral-400" />
                        <span>Link de Vídeo (YouTube ou MP4)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowVideoDb(!showVideoDb)}
                        className={`text-[10px] px-2 py-0.5 rounded cursor-pointer font-semibold uppercase tracking-wider transition ${
                          showVideoDb 
                            ? 'bg-amber-500 text-black' 
                            : 'bg-white/10 hover:bg-white/20 text-amber-300'
                        }`}
                      >
                        📽️ Banco de Vídeos ({VIDEO_DATABASE.length})
                      </button>
                    </div>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=... ou .mp4"
                      value={video}
                      onChange={(e) => setVideo(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />

                    {/* PC video upload with custom useRef trigger pointer */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileVidRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 border border-dashed border-amber-500/20 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 hover:text-amber-100 transition-colors py-2 px-3 rounded-lg cursor-pointer text-center text-[10px] font-bold uppercase tracking-wider"
                      >
                        <Video className="h-3.5 w-3.5" />
                        <span>Buscar Vídeo no Computador 💻</span>
                      </button>
                      
                      <input
                        type="file"
                        ref={fileVidRef}
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setVideo(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = '';
                        }}
                      />
                    </div>

                    {/* Expandable Video Database selection widget */}
                    {showVideoDb && (
                      <div className="bg-neutral-900 border border-amber-500/30 rounded-lg p-3 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Banco de Vídeos Estéticos</span>
                          <input
                            type="text"
                            placeholder="Buscar vídeos..."
                            value={videoSearch}
                            onChange={(e) => setVideoSearch(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-[10px] text-white focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                          {VIDEO_DATABASE.filter(vd => 
                            vd.name.toLowerCase().includes(videoSearch.toLowerCase()) ||
                            vd.label.toLowerCase().includes(videoSearch.toLowerCase())
                          ).map((vd, i) => {
                            const isSelected = video === vd.url;
                            return (
                              <button
                                type="button"
                                key={i}
                                onClick={() => setVideo(vd.url)}
                                className={`w-full flex items-center justify-between p-2 rounded text-left transition select-none cursor-pointer text-xs ${
                                  isSelected 
                                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 opacity-100' 
                                    : 'bg-white/5 hover:bg-white/10 border border-white/5 text-neutral-400 hover:text-white'
                                }`}
                              >
                                <div className="truncate">
                                  <p className="font-semibold truncate text-[11px]">{vd.name}</p>
                                  <p className="text-[9px] text-neutral-500">{vd.label}</p>
                                </div>
                                {isSelected ? (
                                  <Check className="h-3.5 w-3.5 text-amber-400" />
                                ) : (
                                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-white/5 border border-white/15 rounded text-[8px] hover:bg-amber-500 hover:text-black">Usar</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-lg text-xs font-semibold uppercase tracking-widest cursor-pointer transition active:scale-95 duration-200"
                >
                  {editingProductId ? 'Salvar Alterações de Anúncio' : 'Confirmar Cadastro da Peça'}
                </button>
              </form>
            </section>

            {/* List and controls for active products */}
            <section className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-2">
                <Archive className="h-4 w-4 text-amber-500" />
                <span>Controle Geral do Estoque ({products.length} peças)</span>
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1 border border-white/5 rounded-xl p-2 bg-white/[0.01]">
                {products.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-6">Estoque zerado. Cadastre novas peças acima!</p>
                ) : (
                  products.map((p) => (
                    <div 
                      key={p.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-neutral-900 rounded-lg border border-white/5 hover:border-white/10 transition"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.image} 
                          alt={p.title} 
                          referrerPolicy="no-referrer"
                          className="h-10 w-8 object-cover rounded shrink-0 bg-neutral-950"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase text-amber-300 font-semibold">{p.brand}</span>
                            <span className="text-[9px] text-neutral-500 font-mono">({p.size})</span>
                            {p.video && (
                              <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 py-0.2 rounded uppercase font-mono">Vídeo</span>
                            )}
                          </div>
                          <h4 className="text-xs text-white font-normal line-clamp-1">{p.title}</h4>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="text-neutral-400">R$ {p.price.toFixed(2)}</span>
                            <span className="text-neutral-500">|</span>
                            <span className={p.stock <= 0 ? 'text-red-400 font-bold' : 'text-amber-200'}>
                              {p.stock} un. em estoque
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {/* State switcher */}
                        <select
                          value={p.status}
                          onChange={(e) => onUpdateProductStatus(p.id, e.target.value as any)}
                          className="text-[10px] bg-neutral-950 border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                        >
                          <option value="available">Disponível</option>
                          <option value="reserved">Reservado</option>
                          <option value="sold">Vendido</option>
                        </select>

                        {/* EDIT FULL ADVERTISEMENT TRIGGER */}
                        <button
                          onClick={() => handleStartEdit(p)}
                          className={`text-[10px] border p-1.5 rounded transition flex items-center justify-center ${
                            editingProductId === p.id 
                              ? 'bg-purple-600 border-purple-500 text-white'
                              : 'text-neutral-400 hover:text-white border-white/10 bg-white/5'
                          }`}
                          title="Editar Anúncio Completo (Imagem, Vídeo, Composição)"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>

                        {/* Delete logic */}
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="text-neutral-500 hover:text-red-400 border border-white/5 hover:border-red-500/20 p-1.5 rounded bg-white/5"
                          title="Deletar da loja"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* VOLTAR PROMINENTE NO RODAPÉ */}
            <div className="pt-4 border-t border-white/5">
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>← Voltar para a Página Principal</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
