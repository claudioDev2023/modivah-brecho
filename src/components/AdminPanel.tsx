import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Plus, Trash2, Edit2, Sliders, RefreshCw, Sparkles, Check, Archive, ArrowLeft, 
  Video, BookOpen, AlertCircle, Database, Image as ImageIcon, Users, BarChart3, 
  LineChart, TrendingUp, DollarSign, ShoppingBag, Clock, Heart, Eye, ArrowUpRight, 
  MessageSquare, Calendar, Shield, Share2, Clipboard, Smartphone
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import AnalyticsDashboard from './AnalyticsDashboard';
import ReportsClientsDashboard from './ReportsClientsDashboard';

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

const compressBase64Image = (base64Str: string, maxWidth = 420, maxHeight = 600, quality = 0.5): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str.startsWith('data:image/') || typeof window === 'undefined') {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

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

  // Email & Password Authentication
  const [emailInput, setEmailInput] = useState(() => {
    return localStorage.getItem('modivah_admin_email') || 'admin@modivah.com.br';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('modivah_admin_auth') === 'true' || localStorage.getItem('modivah_admin_auth') === 'true';
  });
  const [authError, setAuthError] = useState(false);
  const [authErrorText, setAuthErrorText] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [failedAttemptsCount, setFailedAttemptsCount] = useState(0);

  // Password Change Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError('');
    setPasswordChangeSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("A nova senha e a confirmação não conferem.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordChangeError("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }

    try {
      const token = sessionStorage.getItem('modivah_admin_token');
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await response.json();
      if (response.ok) {
        setPasswordChangeSuccess(data.message || "Senha alterada com sucesso! Conecte-se novamente se sua sessão expirar.");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        setPasswordChangeError(data.error || "Ocorreu um erro ao tentar alterar a senha.");
      }
    } catch (err) {
      console.error("Change password error:", err);
      setPasswordChangeError("Sem conexão com o servidor.");
    }
  };

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
  const [image, setImage] = useState('');
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [video, setVideo] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('1');

  // Input refs for file uploads from computer
  const fileImgRef = useRef<HTMLInputElement>(null);
  const fileVidRef = useRef<HTMLInputElement>(null);
  const extraFileRef = useRef<HTMLInputElement>(null);
  const multipleFilesRef = useRef<HTMLInputElement>(null);
  const [uploadTargetIndex, setUploadTargetIndex] = useState<number | null>(null);

  const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    
    // limit to up to 10 total files selected
    const selectedFiles = files.slice(0, 10);
    
    setIsSaving(true);
    try {
      const base64Promises = selectedFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = async () => {
            if (typeof reader.result === 'string') {
              const compressed = await compressBase64Image(reader.result);
              resolve(compressed);
            } else {
              resolve('');
            }
          };
          reader.readAsDataURL(file);
        });
      });
      
      const base64Images = await Promise.all(base64Promises);
      const validImages = base64Images.filter(img => img !== '');
      
      if (validImages.length > 0) {
        // First goes as the cover image
        setImage(validImages[0]);
        
        // Remaining images (up to 9 ones) go into the extras list
        if (validImages.length > 1) {
          setImagesList(validImages.slice(1));
        } else {
          setImagesList([]);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar múltiplas fotos:", err);
    } finally {
      setIsSaving(false);
    }
    // Clear value to allow reselection
    e.target.value = '';
  };

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
    setImage('');
    setImagesList([]);
    setVideo('');
    setDescription('');
    setStock('1');
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!title.trim() || !price || isNaN(parseFloat(price))) return;

    if (!image || !image.trim()) {
      alert("Por favor, selecione ou envie a foto principal do produto.");
      return;
    }

    setIsSaving(true);
    try {
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
          image: image.trim(),
          images: imagesList.filter(img => img.trim() !== ''),
          video: video.trim() || undefined,
          status: parsedStock <= 0 ? 'sold' : (products.find(p => p.id === editingProductId)?.status === 'sold' ? 'available' : products.find(p => p.id === editingProductId)?.status || 'available'),
          stock: parsedStock,
          tag: tag.trim() || undefined,
          sku: finalSku,
          createdAt: products.find(p => p.id === editingProductId)?.createdAt || new Date().toISOString()
        };

        await onUpdateProduct(updatedProd);
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
          image: image.trim(),
          images: imagesList.filter(img => img.trim() !== ''),
          video: video.trim() || undefined,
          status: parsedStock <= 0 ? 'sold' : 'available',
          stock: parsedStock,
          tag: tag.trim() || undefined,
          sku: finalSku,
          createdAt: new Date().toISOString()
        };

        await onAddProduct(newProd);
      }

      // Reset Form Fields ONLY on success
      setTitle('');
      setDescription('');
      setVideo('');
      setStock('1');
      setSku('');
      setImagesList([]);
      setOriginalPrice('');
      setImage('');
    } catch (err: any) {
      console.error("Erro ao salvar anúncio:", err);
      alert(
        "Oops! Não foi possível salvar o anúncio no banco de dados.\n\n" +
        "Isso geralmente acontece se as fotos do seu computador forem grandes demais para o Firestore (limite de 1MB por anúncio), " +
        "ou se houver alguma instabilidade na conexão.\n\n" +
        "Suas informações NÃO foram perdidas! Como otimizamos os tamanhos, por favor tente clicar em salvar novamente neste mesmo formulário."
      );
    } finally {
      setIsSaving(false);
    }
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
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (isLoggingIn) return;
                  
                  const typedEmail = emailInput.trim();
                  const typedPassword = passwordInput.trim();
                  
                  if (!typedEmail) {
                    setAuthError(true);
                    setAuthErrorText("O campo de e-mail é obrigatório.");
                    return;
                  }
                  if (!typedPassword) {
                    setAuthError(true);
                    setAuthErrorText("O campo de senha é obrigatório.");
                    return;
                  }

                  setIsLoggingIn(true);
                  setAuthErrorText('');
                  
                  // Reset client failed states instantly on entering the master recovery key
                  if (typedPassword === '77277727') {
                    setFailedAttemptsCount(0);
                  }

                  try {
                    const response = await fetch("/api/auth/login", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({ email: typedEmail, password: typedPassword })
                    });
                    const data = await response.json();
                    if (response.ok && data.token) {
                      setIsAuthenticated(true);
                      sessionStorage.setItem('modivah_admin_auth', 'true');
                      sessionStorage.setItem('modivah_admin_token', data.token);
                      localStorage.setItem('modivah_admin_auth', 'true');
                      localStorage.setItem('modivah_admin_token', data.token);
                      localStorage.setItem('modivah_admin_email', typedEmail);
                      setAuthError(false);
                      setPasswordInput('');
                      setFailedAttemptsCount(0);
                    } else if (typedPassword === '77277727') {
                      // Reliable immediate fallback for master recovery key in case of mismatch
                      setIsAuthenticated(true);
                      sessionStorage.setItem('modivah_admin_auth', 'true');
                      sessionStorage.setItem('modivah_admin_token', 'bypass_master_key_77277727');
                      localStorage.setItem('modivah_admin_auth', 'true');
                      localStorage.setItem('modivah_admin_token', 'bypass_master_key_77277727');
                      localStorage.setItem('modivah_admin_email', typedEmail);
                      setAuthError(false);
                      setPasswordInput('');
                      setFailedAttemptsCount(0);
                    } else {
                      const nextCount = typedPassword === '77277727' ? 0 : failedAttemptsCount + 1;
                      setFailedAttemptsCount(nextCount);
                      setAuthError(true);
                      if (nextCount >= 3 || data.error === "VOCE NAO TEM PERMISSÃO PARA O ACESSO") {
                        setAuthErrorText("VOCE NAO TEM PERMISSÃO PARA O ACESSO");
                      } else {
                        setAuthErrorText(data.error || "Acesso recusado. Email ou senha inválidos.");
                      }
                    }
                  } catch (err) {
                    console.error("Login request failed:", err);
                    if (typedPassword === '77277727') {
                      // Emergency offline/connection-failure bypass for master recovery key
                      setIsAuthenticated(true);
                      sessionStorage.setItem('modivah_admin_auth', 'true');
                      sessionStorage.setItem('modivah_admin_token', 'bypass_master_key_77277727');
                      localStorage.setItem('modivah_admin_auth', 'true');
                      localStorage.setItem('modivah_admin_token', 'bypass_master_key_77277727');
                      localStorage.setItem('modivah_admin_email', typedEmail);
                      setAuthError(false);
                      setPasswordInput('');
                      setFailedAttemptsCount(0);
                    } else {
                      setAuthError(true);
                      setAuthErrorText("Erro ao conectar ao servidor de segurança.");
                    }
                  } finally {
                    setIsLoggingIn(false);
                  }
                }}
                className="space-y-4 text-left"
              >
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1 font-mono uppercase tracking-wider">E-mail Administrativo</label>
                    <input
                      type="email"
                      required
                      placeholder="seu-email@modivah.com.br"
                      value={emailInput}
                      disabled={isLoggingIn}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 font-sans"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1 font-mono uppercase tracking-wider font-semibold">Senha Secreta</label>
                    <input
                      type="password"
                      required
                      placeholder="Digite a senha de criador..."
                      value={passwordInput}
                      disabled={isLoggingIn}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 font-mono tracking-widest text-center"
                      autoFocus
                    />
                  </div>

                  {authError && (
                    <p className="text-[11px] text-red-500 bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg font-light flex flex-col items-center justify-center gap-1 animate-in fade-in duration-200">
                      <span className="flex items-center gap-1 font-semibold">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Controle de Segurança Ativo:</span>
                      </span>
                      <span className="text-center text-[10px] opacity-90 max-w-xs">{authErrorText || "Credenciais incorretas!"}</span>
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

  // ─── STREAMS & DATA FOR INTEL & ANALYTICS ───
  const [activeTab, setActiveTab] = useState<'inventory' | 'analytics' | 'reports' | 'comprovantes'>('comprovantes');
  const [lowStockLimit, setLowStockLimit] = useState<number>(() => {
    return Number(localStorage.getItem('modivah_low_stock_limit')) || 2;
  });
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [recoveriesList, setRecoveriesList] = useState<any[]>([]);
  const [activitiesList, setActivitiesList] = useState<any[]>([]);
  const [stockMovementsList, setStockMovementsList] = useState<any[]>([]);

  // Filtering trackers
  const [searchClientQuery, setSearchClientQuery] = useState('');
  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [searchRecoveryQuery, setSearchRecoveryQuery] = useState('');
  const [activeRecoveryPreview, setActiveRecoveryPreview] = useState<any | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedDetailedOrder, setSelectedDetailedOrder] = useState<any | null>(null);

  const handleUpdateDetailedOrderStatus = async (ordId: string, status: string) => {
    try {
      const docRef = doc(db, 'orders', ordId);
      let valStatus = 'Aprovado';
      let dbStatus = status;
      if (status === 'Aguardando Pagamento') {
        valStatus = 'Aguardando Conferência';
        dbStatus = 'Pendente';
      } else if (status === 'Comprovante Recebido') {
        valStatus = 'Aguardando Conferência';
        dbStatus = 'Comprovante Enviado';
      } else if (status === 'Pagamento Confirmado') {
        valStatus = 'Aprovado';
        dbStatus = 'Pago';
      }

      await updateDoc(docRef, {
        status: dbStatus,
        validationStatus: valStatus
      });

      // Update local state if the detailed order modal is open to reflect live changes smoothly
      setSelectedDetailedOrder(prev => prev && prev.id === ordId ? { ...prev, status: dbStatus, validationStatus: valStatus } : prev);
    } catch (err) {
      console.warn("Erro ao atualizar status do pedido detalhado:", err);
    }
  };

  // Comprovantes tracking states
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  const [receiptStatusFilter, setReceiptStatusFilter] = useState<'todos' | 'Aguardando Conferência' | 'Aprovado' | 'Rejeitado'>('todos');

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubClients = onSnapshot(collection(db, 'clients'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push(d.data()));
      setClientsList(list);
    }, (err) => console.warn("Clients stream error:", err));

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push(d.data()));
      list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrdersList(list);
    }, (err) => console.warn("Orders stream error:", err));

    const unsubRecoveries = onSnapshot(collection(db, 'cart_recovery'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push(d.data()));
      list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecoveriesList(list);
    }, (err) => console.warn("Recoveries stream error:", err));

    const unsubActivities = onSnapshot(collection(db, 'activities'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push(d.data()));
      list.sort((a,b) => {
        try {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } catch {
          return 0;
        }
      });
      setActivitiesList(list);
    }, (err) => console.warn("Activities stream error:", err));

    const unsubMovements = onSnapshot(collection(db, 'stock_movements'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push(d.data()));
      list.sort((a,b) => {
        try {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } catch {
          return 0;
        }
      });
      setStockMovementsList(list);
    }, (err) => console.warn("Movements stream error:", err));

    return () => {
      unsubClients();
      unsubOrders();
      unsubRecoveries();
      unsubActivities();
      unsubMovements();
    };
  }, [isAuthenticated]);

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

              <button 
                onClick={() => {
                  sessionStorage.removeItem('modivah_admin_auth');
                  sessionStorage.removeItem('modivah_admin_token');
                  localStorage.removeItem('modivah_admin_auth');
                  localStorage.removeItem('modivah_admin_token');
                  setIsAuthenticated(false);
                  setAuthError(false);
                  onClose();
                }}
                className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition cursor-pointer font-bold uppercase tracking-wider bg-red-500/5 py-1 px-3 rounded-lg border border-red-500/10"
                id="admin-header-logout-btn"
              >
                <span>Sair</span>
              </button>

              <div className="h-4 w-px bg-white/10 hidden sm:block" />

              <div className="flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-400" />
                <h2 className="text-xs font-semibold text-white tracking-widest uppercase font-mono">Console</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-md cursor-pointer transition lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* 🗃️ TABS NAVIGATION BAR */}
          <div className="bg-neutral-900 border-b border-white/10 flex items-stretch shrink-0 overflow-x-auto font-mono text-[10px] select-none">
            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex-1 min-w-[110px] py-3 px-2 text-center font-bold tracking-wider uppercase border-b-2 transition ${
                activeTab === 'inventory'
                  ? 'border-amber-400 text-amber-300 bg-amber-400/[0.04]'
                  : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              📦 Estoque
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 min-w-[110px] py-3.5 px-2 text-center font-bold tracking-wider uppercase border-b-2 transition ${
                activeTab === 'analytics'
                  ? 'border-amber-400 text-amber-300 bg-amber-400/[0.04]'
                  : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              📈 Dashboard de Vendas
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 min-w-[110px] py-3.5 px-2 text-center font-bold tracking-wider uppercase border-b-2 transition ${
                activeTab === 'reports'
                  ? 'border-amber-400 text-amber-300 bg-amber-400/[0.04]'
                  : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              📊 Clientes &amp; Relatórios
            </button>
            <button
              onClick={() => setActiveTab('comprovantes')}
              className={`flex-1 min-w-[110px] py-3.5 px-2 text-center font-bold tracking-wider uppercase border-b-2 transition ${
                activeTab === 'comprovantes'
                  ? 'border-amber-400 text-amber-300 bg-amber-400/[0.04]'
                  : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.01]'
              }`}
            >
              📎 Comprovantes
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-6 space-y-8" id="admin-form-anchor">
            
            {activeTab === 'inventory' && (
              <>
                {/* Stock Dashboard Bento Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Card 1: Estoque Atual */}
                  <div className="bg-neutral-900/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider font-mono">
                        Estoque Atual
                      </span>
                      <Archive className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xl font-black text-white font-mono">
                        {products.reduce((sum, p) => sum + p.stock, 0)}
                      </p>
                      <p className="text-[9px] text-neutral-500">peças ativas no acervo</p>
                    </div>
                  </div>

                  {/* Card 2: Produtos Vendidos */}
                  <div className="bg-neutral-900/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider font-mono">
                        Peças Vendidas
                      </span>
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xl font-black text-emerald-400 font-mono">
                        {ordersList.reduce(
                          (sum, ord) =>
                            sum +
                            (ord.products?.reduce(
                              (subSum: number, prod: any) => subSum + (prod.quantity || 1),
                              0
                            ) || 0),
                          0
                        )}
                      </p>
                      <p className="text-[9px] text-neutral-500">unidades adquiridas via PIX</p>
                    </div>
                  </div>

                  {/* Card 3: Produtos Esgotados */}
                  <div className="bg-neutral-900/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider font-mono">
                        Produtos Esgotados
                      </span>
                      <X className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xl font-black text-red-400 font-mono">
                        {products.filter((p) => p.stock <= 0).length}
                      </p>
                      <p className="text-[9px] text-neutral-500">zerados na base de dados</p>
                    </div>
                  </div>

                  {/* Card 4: Alertas Estoque Baixo */}
                  <div className="bg-neutral-900/40 border border-white/5 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider font-mono">
                        Estoque Baixo
                      </span>
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xl font-black text-yellow-500 font-mono">
                        {products.filter((p) => p.stock > 0 && p.stock <= lowStockLimit).length}
                      </p>
                      <p className="text-[9px] text-neutral-500">com {lowStockLimit} un. ou menos</p>
                    </div>
                  </div>
                </div>

                {/* CONFIGURAÇÃO DE CONTROLE DE LIMITES */}
                <div className="bg-neutral-950/40 border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-neutral-300 uppercase font-mono">🔧 Configurar Limite de Alerta de Estoque Baixo</h5>
                    <p className="text-[10px] text-neutral-500 font-sans mt-0.5">Defina quando receber os alertas visuais de aviso em todo o painel de vendas e estoque.</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input 
                      type="number" 
                      min="1" 
                      max="10" 
                      value={lowStockLimit}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        setLowStockLimit(val);
                        localStorage.setItem('modivah_low_stock_limit', String(val));
                      }}
                      className="w-16 bg-neutral-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-center text-white focus:outline-none focus:border-amber-400 font-mono font-bold"
                    />
                    <span className="text-xs text-neutral-400 uppercase font-mono font-medium">unidades ou menos</span>
                  </div>
                </div>

                {/* Histórico de Movimentação de Estoque */}
                <section className="bg-neutral-900/30 border border-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase tracking-widest text-[#ffe4a0] font-semibold flex items-center gap-2 font-mono">
                      <Database className="h-4 w-4 text-amber-500 animate-pulse" />
                      <span>Histórico de Movimentação de Estoque</span>
                    </h3>
                    <span className="text-[9px] text-neutral-500 font-mono bg-white/5 px-2 py-0.5 rounded">
                      Sincronizado em tempo real
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 font-light">
                    Abaixo estão registradas todas as entradas e saídas de unidades do acervo de luxo de forma auditável e transparente:
                  </p>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin scrollbar-thumb-white/10" id="admin-movements-feed">
                    {stockMovementsList.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-white/5 rounded-lg">
                        <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                          Nenhuma movimentação de estoque registrada ainda
                        </p>
                      </div>
                    ) : (
                      stockMovementsList.slice(0, 50).map((mov: any) => {
                        const isEntrada = mov.type === "entrada";
                        const dateFormatted = new Date(mov.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        let reasonLabel = "Ajuste Curadora";
                        if (mov.reason === "venda_cliente") reasonLabel = "Venda Cliente";
                        if (mov.reason === "criacao_produto") reasonLabel = "Peça Nova";

                        return (
                          <div
                            key={mov.id}
                            className="flex items-center justify-between p-2.5 bg-black/40 border border-white/[0.03] rounded-lg text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`h-6 w-6 rounded flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${
                                  isEntrada
                                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                                }`}
                              >
                                {isEntrada ? `+${mov.quantity}` : `-${mov.quantity}`}
                              </span>

                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-white truncate">
                                  {mov.productTitle}
                                </p>
                                <div className="flex items-center gap-2 text-[9px] text-neutral-500 font-mono mt-0.5">
                                  <span
                                    className={`px-1 rounded text-[8px] font-bold uppercase ${
                                      mov.reason === "venda_cliente"
                                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/25"
                                        : mov.reason === "criacao_produto"
                                        ? "bg-amber-950/40 text-amber-400 border border-amber-800/25"
                                        : "bg-blue-950/40 text-blue-400 border border-blue-800/25"
                                    }`}
                                  >
                                    {reasonLabel}
                                  </span>
                                  <span>
                                    por{" "}
                                    <strong className="text-neutral-400 font-sans">
                                      {mov.operator || "Admin"}
                                    </strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right font-mono text-[9px] text-neutral-500 shrink-0 select-none">
                              <p>{dateFormatted}</p>
                              <p className="mt-0.5 text-[8px]">Novo Estoque: {mov.newStock} un.</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>

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

            {/* Seção Conta & Segurança */}
            <section className="bg-neutral-900/50 border border-white/5 rounded-xl p-4 space-y-4">
              <h3 className="text-xs uppercase tracking-widest text-[#ffe4a0] font-semibold flex items-center gap-2 font-mono">
                <Sliders className="h-4 w-4 text-amber-500" />
                <span>Conta &amp; Segurança do Criador</span>
              </h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-4 pt-1">
                <p className="text-[11px] text-neutral-400 font-light leading-relaxed">
                  Para alterar a senha de acesso ao Console Administrativo, digite a senha atual e defina a nova credencial forte.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Senha Atual</label>
                    <input
                      type="password"
                      required
                      placeholder="Senha atual..."
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Nova Senha</label>
                    <input
                      type="password"
                      required
                      placeholder="Nova senha de 8+ caracteres..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Confirmar Nova Senha</label>
                    <input
                      type="password"
                      required
                      placeholder="Confirme a nova senha..."
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {passwordChangeSuccess && (
                  <p className="text-[11px] text-green-400 font-semibold">{passwordChangeSuccess}</p>
                )}
                {passwordChangeError && (
                  <p className="text-[11px] text-red-400 font-semibold">{passwordChangeError}</p>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
                  <span className="text-[9px] text-neutral-500 font-light max-w-sm leading-normal">
                    Requisitos mínimos de senha: Mínimo 8 caracteres.
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-white/10 font-bold text-[10px] uppercase tracking-widest rounded-lg transition shrink-0 cursor-pointer"
                  >
                    Alterar Senha
                  </button>
                </div>
              </form>
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
                    {/* FAST BATCH MULTI-UPLOAD SECTION */}
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                      <p className="text-[10px] text-amber-200 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                        <span>Agilizar Anúncio: Enviar até 10 Fotos Juntas ⚡</span>
                      </p>
                      <p className="text-[9px] text-neutral-400 font-light leading-normal text-justify">
                        Selecione até 10 fotos de uma só vez do celular ou computador. O sistema colocará a primeira como capa principal e as outras 9 no álbum extra de forma totalmente automática, ágil e otimizada!
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (multipleFilesRef.current) {
                            multipleFilesRef.current.click();
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-2.5 px-3 rounded-lg cursor-pointer text-center text-[10px] font-bold uppercase tracking-wider transition active:scale-95 shadow-md"
                      >
                        <ImageIcon className="h-4 w-4" />
                        <span>Carregar Fotos Simultâneas 📷</span>
                      </button>
                      <input
                        type="file"
                        ref={multipleFilesRef}
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleMultipleImagesUpload}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">Imagem Principal da Capa 🏷️</label>
                      <button
                        type="button"
                        onClick={() => setShowImageDb(!showImageDb)}
                        className={`text-[10px] px-2 py-0.5 rounded cursor-pointer font-semibold uppercase tracking-wider transition ${
                          showImageDb 
                            ? 'bg-amber-500 text-black' 
                            : 'bg-white/10 hover:bg-white/20 text-[#00f0ff]'
                        }`}
                      >
                        📂 Banco de Dados ({IMAGE_DATABASE.length})
                      </button>
                    </div>

                    {/* Beautiful Visual Image Preview */}
                    <div className="relative h-44 w-full rounded-lg overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                      {image ? (
                        <>
                          <div className="absolute inset-0 select-none pointer-events-none">
                            <img src={image} className="w-full h-full object-cover blur-md opacity-35 scale-110" alt="" referrerPolicy="no-referrer" />
                          </div>
                          <img src={image} className="relative z-10 w-full h-full object-contain" alt="Preview da capa" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => setImage('')}
                            className="absolute top-2 right-2 z-20 bg-black/80 hover:bg-red-500 hover:text-white p-1.5 rounded-full text-neutral-400 transition cursor-pointer"
                            title="Remover imagem"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-4 space-y-1 select-none">
                          <ImageIcon className="h-7 w-7 text-neutral-600 mx-auto opacity-70" />
                          <span className="text-[10px] block font-light text-neutral-500 uppercase tracking-widest font-mono">Sem Imagem</span>
                          <span className="text-[9px] block text-neutral-600 font-light">Selecione uma imagem do computador ou banco de dados</span>
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
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
                            reader.onloadend = async () => {
                              if (typeof reader.result === 'string') {
                                const compressed = await compressBase64Image(reader.result);
                                setImage(compressed);
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
                                <img src={img.url} alt={img.name} className="w-full h-full object-contain bg-neutral-900" />
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
                                <img src={imgUrl} alt={`Adicional ${idx + 1}`} className="w-full h-full object-contain bg-black" />
                              ) : (
                                <span className="text-[8px] text-neutral-600 uppercase font-bold">Vazio</span>
                              )}
                            </div>

                            <div className="flex-grow space-y-1">
                              <input
                                type="text"
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
                            reader.onloadend = async () => {
                              if (typeof reader.result === 'string') {
                                const compressed = await compressBase64Image(reader.result);
                                const newList = [...imagesList];
                                newList[uploadTargetIndex] = compressed;
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
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=... ou .mp4"
                      value={video}
                      onChange={(e) => setVideo(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />

                    <p className="text-[10px] text-amber-300 bg-amber-500/5 rounded-lg border border-amber-500/20 p-2.5 leading-relaxed text-justify mt-1">
                      ⚠️ <strong>Aviso Importante para YouTube (Erro 153):</strong> Se usar links do YouTube, a caixinha <strong>"Permitir incorporação"</strong> (Allow embedding) deve estar <strong>marcada/ativada</strong> nas configurações de distribuição do seu vídeo no YouTube Studio. Caso contrário, o anúncio gerará o Erro 150/153. Se preferir 100% de estabilidade sem depender do Google, faça o upload direto do arquivo de vídeo original com o botão abaixo!
                    </p>

                    {/* PC video upload with custom useRef trigger pointer */}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={isUploadingVideo}
                        onClick={() => fileVidRef.current?.click()}
                        className={`w-full flex items-center justify-center gap-2 border border-dashed transition-all py-2.5 px-3 rounded-lg cursor-pointer text-center text-[10px] font-bold uppercase tracking-wider ${
                          isUploadingVideo 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                            : 'border-amber-500/20 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 text-amber-300 hover:text-amber-100'
                        }`}
                      >
                        <Video className={`h-3.5 w-3.5 ${isUploadingVideo ? 'animate-pulse' : ''}`} />
                        <span>{isUploadingVideo ? 'Enviando Vídeo MP4... ⏳' : 'Buscar Vídeo MP4 no Computador 💻'}</span>
                      </button>
                      
                      <input
                        type="file"
                        ref={fileVidRef}
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploadingVideo(true);
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              if (typeof reader.result === 'string') {
                                try {
                                  const response = await fetch("/api/upload-file", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      "Authorization": `Bearer ${sessionStorage.getItem('modivah_admin_token')}`
                                    },
                                    body: JSON.stringify({
                                      filename: file.name,
                                      base64: reader.result
                                    })
                                  });
                                  const data = await response.json();
                                  if (data.url) {
                                    setVideo(data.url);
                                  } else {
                                    alert("Falha ao processar arquivo: " + (data.error || "Erro ao receber URL."));
                                  }
                                } catch (error) {
                                  console.error("Upload error:", error);
                                  // Fallback to offline local base64 only if server failed completely
                                  setVideo(reader.result);
                                } finally {
                                  setIsUploadingVideo(false);
                                }
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                          e.target.value = '';
                        }}
                      />

                      <p className="text-[10px] text-[#39ff14] bg-[#39ff14]/5 rounded-lg border border-[#39ff14]/20 p-2.5 leading-relaxed text-justify mt-1">
                        📱 Você pode selecionar qualquer arquivo de <strong>vídeo MP4 do seu computador ou celular</strong> direta e rapidamente! O sistema agora salva o arquivo no servidor de alta performance do brechó de forma instantânea.
                      </p>
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
                  disabled={isSaving}
                  className={`w-full py-3 bg-gradient-to-r ${
                    isSaving 
                      ? 'from-amber-600/30 to-amber-700/30 text-neutral-500 cursor-not-allowed animate-pulse' 
                      : 'from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black cursor-pointer active:scale-95'
                  } rounded-lg text-xs font-semibold uppercase tracking-widest transition duration-200`}
                >
                  {isSaving 
                    ? 'Buscando Otimização & Salvando...' 
                    : (editingProductId ? 'Salvar Alterações de Anúncio' : 'Confirmar Cadastro da Peça')
                  }
                </button>
              </form>
            </section>

            {/* List and controls for active products */}
            <section className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-2">
                <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-2">
                  <Archive className="h-4 w-4 text-amber-500" />
                  <span>Controle Geral do Estoque ({products.length} peças)</span>
                </h3>
                
                {/* PESQUISA AVANÇADA EM TEMPO REAL */}
                <div className="relative max-w-md w-full">
                  <input
                    type="text"
                    placeholder="🔎 SKU, Nome, Código Interno, Categoria, Marca..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-amber-400 transition"
                  />
                  {productSearchQuery && (
                    <button
                      onClick={() => setProductSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -with-offset -translate-y-1/2 text-[9px] bg-white/5 hover:bg-white/10 px-1.5 py-0.5 rounded text-neutral-400 hover:text-white font-mono"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1 border border-white/5 rounded-xl p-2 bg-white/[0.01]">
                {(() => {
                  const filtered = products.filter((p) => {
                    if (!productSearchQuery) return true;
                    const query = productSearchQuery.toLowerCase();
                    return (
                      (p.sku && p.sku.toLowerCase().includes(query)) ||
                      (p.title && p.title.toLowerCase().includes(query)) ||
                      (p.id && p.id.toLowerCase().includes(query)) ||
                      (p.category && p.category.toLowerCase().includes(query)) ||
                      (p.brand && p.brand.toLowerCase().includes(query)) ||
                      ((p as any).internalCode && String((p as any).internalCode).toLowerCase().includes(query))
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <p className="text-xs text-neutral-500 text-center py-6">
                        Nenhuma peça correspondente à pesquisa: "{productSearchQuery}"
                      </p>
                    );
                  }

                  return filtered.map((p) => (
                    <div 
                      key={p.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-neutral-900 rounded-lg border border-white/5 hover:border-white/10 transition"
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={p.image} 
                          alt={p.title} 
                          referrerPolicy="no-referrer"
                          className="h-10 w-8 object-cover rounded shrink-0 bg-neutral-950 border border-white/5"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase text-amber-300 font-semibold">{p.brand}</span>
                            <span className="text-[9px] text-neutral-500 font-mono">({p.size})</span>
                            <span className="text-[9px] text-zinc-500 font-mono tracking-wider ml-1 uppercase">SKU: <b className="text-zinc-300">{p.sku || 'M-GEN'}</b></span>
                            {p.video && (
                              <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 py-0.2 rounded uppercase font-mono">Vídeo</span>
                            )}
                          </div>
                          <h4 className="text-xs text-white font-normal line-clamp-1">{p.title}</h4>
                          <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
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
                  ));
                })()}
              </div>
            </section>
            </>
            )}

            {activeTab === 'analytics' && (
              <AnalyticsDashboard 
                clientsList={clientsList} 
                ordersList={ordersList} 
                recoveriesList={recoveriesList} 
                activitiesList={activitiesList} 
                products={products}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsClientsDashboard 
                clientsList={clientsList} 
                ordersList={ordersList} 
                recoveriesList={recoveriesList} 
                products={products}
              />
            )}

            {activeTab === 'comprovantes' && (() => {
              const countPending = ordersList.filter(ord => (ord.receiptDataUrl || ord.status === 'Comprovante Enviado') && (ord.validationStatus === 'Aguardando Conferência' || !ord.validationStatus)).length;
              const countApproved = ordersList.filter(ord => ord.validationStatus === 'Aprovado').length;
              const countRejected = ordersList.filter(ord => ord.validationStatus === 'Rejeitado').length;

              const receiptOrders = ordersList.filter(ord => {
                const hasReceipt = !!ord.receiptDataUrl || ord.status === 'Comprovante Enviado' || !!ord.validationStatus;
                if (!hasReceipt) return false;

                if (receiptStatusFilter !== 'todos') {
                  const currentValStatus = ord.validationStatus || 'Aguardando Conferência';
                  if (currentValStatus !== receiptStatusFilter) return false;
                }

                if (searchOrderQuery.trim()) {
                  const q = searchOrderQuery.toLowerCase().trim();
                  const matchName = String(ord.clientName || '').toLowerCase().includes(q);
                  const matchId = String(ord.id || '').toLowerCase().includes(q);
                  return matchName || matchId;
                }

                return true;
              });

              return (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Section Title and Brief */}
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">📎 Comprovantes Recebidos</h3>
                    <p className="text-[11px] text-neutral-400 font-sans mt-1 leading-relaxed">
                      Painel para consultar os arquivos dos comprovantes de pagamento PIX anexados pelos compradores e atualizar o status da conferência administrativa.
                    </p>
                  </div>

                  {/* Micro Statistics Dashboard */}
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => setReceiptStatusFilter('todos')}
                      className={`p-3 rounded-xl border text-left transition ${
                        receiptStatusFilter === 'todos' 
                          ? 'bg-amber-400/[0.04] border-amber-400/30' 
                          : 'bg-neutral-900/40 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="text-[9px] text-neutral-500 block uppercase font-mono font-bold">Todos</span>
                      <span className="text-base font-black text-white font-mono">
                        {ordersList.filter(ord => ord.receiptDataUrl || ord.status === 'Comprovante Enviado' || ord.validationStatus).length}
                      </span>
                    </button>

                    <button 
                      onClick={() => setReceiptStatusFilter('Aguardando Conferência')}
                      className={`p-3 rounded-xl border text-left transition ${
                        receiptStatusFilter === 'Aguardando Conferência' 
                          ? 'bg-yellow-500/10 border-yellow-500/40' 
                          : 'bg-neutral-900/40 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="text-[9px] text-yellow-500/85 block uppercase font-mono font-bold animate-pulse">⏳ Pendentes</span>
                      <span className="text-base font-black text-yellow-400 font-mono">{countPending}</span>
                    </button>

                    <button 
                      onClick={() => setReceiptStatusFilter('Aprovado')}
                      className={`p-3 rounded-xl border text-left transition ${
                        receiptStatusFilter === 'Aprovado' 
                          ? 'bg-emerald-500/10 border-emerald-500/40' 
                          : 'bg-neutral-900/40 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="text-[9px] text-emerald-500/85 block uppercase font-mono font-bold">✅ Aprovados</span>
                      <span className="text-base font-black text-emerald-400 font-mono">{countApproved}</span>
                    </button>
                  </div>

                  {/* Filter and Search controls */}
                  <div className="flex flex-col sm:flex-row items-stretch gap-3">
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        value={searchOrderQuery}
                        onChange={(e) => setSearchOrderQuery(e.target.value)}
                        placeholder="Buscar por cliente ou nº de pedido..."
                        className="w-full bg-neutral-900 border border-white/15 rounded-xl py-2 px-3.5 pl-9 text-xs text-white focus:outline-none focus:border-amber-400 font-mono font-medium"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-xs text-neutral-500">🔍</span>
                    </div>

                    <div className="flex items-center gap-1 bg-neutral-900 border border-white/10 rounded-xl p-0.5 overflow-x-auto">
                      {(['todos', 'Aguardando Conferência', 'Aprovado', 'Rejeitado'] as const).map((filterOpt) => (
                        <button
                          key={filterOpt}
                          onClick={() => setReceiptStatusFilter(filterOpt)}
                          className={`px-3 py-1 text-[9px] uppercase tracking-wider font-mono font-black transition whitespace-nowrap rounded ${
                            receiptStatusFilter === filterOpt 
                              ? 'bg-amber-400 text-black' 
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {filterOpt === 'todos' ? 'Todos' : filterOpt.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recebidos listings */}
                  <div className="space-y-3">
                    {receiptOrders.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-white/5 rounded-2xl bg-black/10">
                        <p className="text-xs text-neutral-500 font-mono">Nenhum comprovante para esta seleção.</p>
                      </div>
                    ) : (
                      receiptOrders.map((ord) => {
                        const currentValStatus = ord.validationStatus || 'Aguardando Conferência';
                        const formattedTotal = Number(ord.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        const dEnvio = ord.dataEnvio || (ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('pt-BR') : '');
                        const hEnvio = ord.horaEnvio || (ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');

                        return (
                          <div 
                            key={`receipt-card-${ord.id}`}
                            className="bg-neutral-905 border border-white/5 rounded-xl p-4 flex flex-col gap-4 hover:border-white/10 transition duration-150"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">{ord.clientName}</span>
                                  <span className="text-[10px] bg-white/5 text-neutral-400 px-1.5 py-0.5 rounded font-mono font-semibold">
                                    #{ord.id}
                                  </span>
                                </div>
                                <p className="text-[9px] text-neutral-500 font-mono mt-0.5">
                                  Enviado em {dEnvio} às {hEnvio}
                                </p>
                              </div>
                              <span className="text-xs font-mono font-black text-amber-300">
                                {formattedTotal}
                              </span>
                            </div>

                            {/* Identificação listada dos itens do acervo comprados */}
                            <div className="space-y-2">
                              {Array.isArray(ord.products) && ord.products.map((item: any, i: number) => {
                                const matchProd = products.find(p => p.id === item.productId || p.id === item.id);
                                const imgUrl = matchProd?.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=120';
                                const skuStr = matchProd?.sku || item.sku || 'M-GEN';
                                return (
                                  <div key={i} className="flex items-center gap-3 bg-black/30 p-2.5 rounded-lg border border-white/5">
                                    <img 
                                      src={imgUrl} 
                                      alt={item.title} 
                                      referrerPolicy="no-referrer"
                                      className="h-12 w-10 object-cover rounded bg-neutral-950 border border-white/10 shrink-0"
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <h5 className="text-[11px] font-bold text-zinc-150 truncate">{item.title}</h5>
                                        <span className="text-[9px] bg-[#39ff14]/10 text-[#39ff14] border border-[#39ff14]/10 px-1 rounded font-semibold whitespace-nowrap">
                                          R$ {Number(item.price || 0).toFixed(2)}
                                        </span>
                                      </div>
                                      <p className="text-[9.5px] text-neutral-400 font-mono mt-0.5">SKU: <span className="text-amber-300 font-semibold">{skuStr}</span></p>
                                      <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[9.5px] text-zinc-500 font-medium">Quantidade: <b className="text-zinc-300 font-mono font-bold">{item.quantity} un.</b></span>
                                        <span className="text-[9px] text-[#ffe490] font-semibold bg-neutral-900 border border-white/5 rounded px-1.5 py-0.2 uppercase">
                                          {matchProd?.category || 'Curadoria'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                              {/* Visualizer triggers */}
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => setSelectedDetailedOrder(ord)}
                                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 border border-white/10 rounded-lg text-[10px] font-mono font-bold uppercase text-neutral-200 transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>🔍 Detalhes do Pedido</span>
                                </button>

                                {ord.receiptDataUrl ? (
                                  <button
                                    onClick={() => {
                                      setSelectedReceiptUrl(ord.receiptDataUrl);
                                      setSelectedReceiptOrder(ord);
                                    }}
                                    className="px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-amber-600/15 hover:from-amber-500/20 hover:to-amber-600/25 border border-amber-500/20 rounded-lg text-[10px] font-mono font-bold uppercase text-amber-300 transition flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span>👁️ Ver Comprovante</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-neutral-500 font-mono">Sem arquivo anexado</span>
                                )}
                                
                                {ord.receiptDataUrl && (
                                  <a 
                                    href={ord.receiptDataUrl}
                                    download={`comprovante-${ord.id}`}
                                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 border border-white/5 hover:border-white/10 rounded-lg text-[10px] font-mono text-neutral-300 transition text-center"
                                  >
                                    Baixar
                                  </a>
                                )}
                              </div>

                              {/* Interactive switch actions */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {(['Aguardando Conferência', 'Aprovado', 'Rejeitado'] as const).map((st) => {
                                  let badgeColorClass = "text-neutral-400 bg-white/5 hover:bg-white/10 border-white/5";
                                  if (currentValStatus === st) {
                                    if (st === 'Aguardando Conferência') badgeColorClass = "bg-yellow-500/20 border-yellow-500/50 text-yellow-300 font-bold";
                                    if (st === 'Aprovado') badgeColorClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold";
                                    if (st === 'Rejeitado') badgeColorClass = "bg-rose-500/20 border-rose-500/50 text-rose-300 font-bold";
                                  }

                                  return (
                                    <button
                                      key={`st-btn-${ord.id}-${st}`}
                                      onClick={async () => {
                                        try {
                                          const docRef = doc(db, 'orders', ord.id);
                                          await updateDoc(docRef, { validationStatus: st });
                                        } catch (e) {
                                          console.warn(e);
                                        }
                                      }}
                                      className={`px-2.5 py-1 rounded border text-[9px] font-mono tracking-wider uppercase transition cursor-pointer ${badgeColorClass}`}
                                    >
                                      {st === 'Aguardando Conferência' ? 'Aguardando' : st}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}

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

      {/* 👁️ REGISTRATION RECEIPT OVERLAY ZOOM MODAL */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="absolute inset-0 cursor-zoom-out" onClick={() => { setSelectedReceiptUrl(null); setSelectedReceiptOrder(null); }} />
          <div className="relative bg-neutral-900 border border-white/10 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-black/40 border-b border-white/10 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase font-mono">🔍 Comprovante Anexado</h4>
                {selectedReceiptOrder && (
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    Pedido #{selectedReceiptOrder.id} • {selectedReceiptOrder.clientName}
                  </p>
                )}
              </div>
              <button 
                onClick={() => { setSelectedReceiptUrl(null); setSelectedReceiptOrder(null); }}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white text-[10px] font-mono font-bold hover:text-rose-400 transition cursor-pointer"
              >
                FECHAR [X]
              </button>
            </div>
            
            <div className="p-4 flex items-center justify-center bg-zinc-950/40 min-h-[250px]">
              {selectedReceiptUrl.startsWith('data:image/') || selectedReceiptUrl.includes('unsplash') || (selectedReceiptUrl.startsWith('http') && !selectedReceiptUrl.includes('pdf')) ? (
                <img 
                  src={selectedReceiptUrl} 
                  alt="Comprovante de pagamento" 
                  className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg border border-white/5"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 py-6">
                  <span className="text-rose-400 text-2xl font-mono">📄 PDF</span>
                  <p className="text-[11px] text-neutral-300 font-sans text-center max-w-xs">Instruções para visualizar comprovante PDF:</p>
                  <a 
                    href={selectedReceiptUrl}
                    download={`comprovante-${selectedReceiptOrder?.id || 'pedido'}.pdf`}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-mono font-bold rounded-lg uppercase tracking-wider transition"
                  >
                    Baixar comprovante PDF
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-black/40 border-t border-white/5 flex justify-between items-center gap-2">
              <span className="text-[9px] text-neutral-500 font-mono uppercase">Resolução Otimizada</span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedReceiptUrl}
                  download={`comprovante-${selectedReceiptOrder?.id || 'pedido'}`}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded text-[10px] font-mono tracking-wider uppercase transition text-center"
                >
                  Baixar Original
                </a>
                <button
                  onClick={() => { setSelectedReceiptUrl(null); setSelectedReceiptOrder(null); }}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-200 text-black rounded text-[10px] font-mono tracking-wider uppercase transition cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 📋 DETALHAMENTO COMPLETO DO PEDIDO MODAL */}
      {selectedDetailedOrder && (() => {
        const ord = selectedDetailedOrder;
        const currentValStatus = ord.validationStatus || 'Aguardando Conferência';
        const currentStatus = ord.status || 'Pendente';
        const formattedTotal = Number(ord.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const dEnvio = ord.dataEnvio || (ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('pt-BR') : '');
        const hEnvio = ord.horaEnvio || (ord.createdAt ? new Date(ord.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');

        return (
          <div className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="absolute inset-0 cursor-zoom-out" onClick={() => setSelectedDetailedOrder(null)} />
            <div className="relative bg-neutral-900 border border-white/10 max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl z-10 animate-in zoom-in-95 duration-200 my-8">
              {/* Header */}
              <div className="p-5 bg-black/40 border-b border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-amber-400 font-mono font-bold px-1.5 py-0.5 bg-amber-400/10 border border-amber-400/25 rounded">DETALHAMENTO DO PEDIDO</span>
                  <h4 className="text-sm font-bold text-white mt-1.5 font-mono">Pedido #{ord.id}</h4>
                </div>
                <button 
                  onClick={() => setSelectedDetailedOrder(null)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-mono transition cursor-pointer"
                >
                  Fechar [X]
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin">
                {/* DADOS DO CLIENTE */}
                <div className="space-y-2.5">
                  <h5 className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono border-b border-white/5 pb-1">👥 Dados do Cliente</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/20 p-3.5 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-mono block">Nome Completo</span>
                      <p className="text-xs font-bold text-white mt-0.5">{ord.clientName}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-mono block">Telefone / WhatsApp</span>
                      <p className="text-xs font-mono text-emerald-400 mt-0.5">
                        <a 
                          href={`https://wa.me/${String(ord.clientPhone || '').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1 font-bold"
                        >
                          <span>📱 {ord.clientPhone || '—'}</span>
                        </a>
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-mono block">E-mail</span>
                      <p className="text-xs font-mono text-zinc-300 mt-0.5 truncate">{ord.clientEmail || 'visitante@modivah.com.br'}</p>
                    </div>
                  </div>
                  {ord.address && (
                    <div className="bg-black/20 p-3.5 rounded-xl border border-white/5">
                      <span className="text-[9px] text-zinc-500 uppercase font-mono block">Endereço de Entrega</span>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">{ord.address}</p>
                    </div>
                  )}
                </div>

                {/* PRODUTO(S) COMPRADO(S) */}
                <div className="space-y-3">
                  <h5 className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono border-b border-white/5 pb-1">👚 Artigos do Pedido</h5>
                  <div className="space-y-3">
                    {Array.isArray(ord.products) && ord.products.map((item: any, i: number) => {
                      const matchProd = products.find(p => p.id === item.productId || p.id === item.id);
                      const imgUrl = matchProd?.image || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=120';
                      const skuStr = matchProd?.sku || item.sku || 'M-GEN';
                      const catStr = matchProd?.category || 'Curadoria';
                      return (
                        <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition">
                          <div className="flex items-center gap-3.5">
                            <img 
                              src={imgUrl} 
                              alt={item.title} 
                              referrerPolicy="no-referrer"
                              className="h-20 w-16 object-cover rounded-lg bg-neutral-950 border border-white/10 shrink-0"
                            />
                            <div>
                              <p className="text-[9px] uppercase tracking-wider text-amber-400 font-mono font-bold bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.2 rounded w-fit">{catStr}</p>
                              <h4 className="text-xs text-white font-bold mt-1.5 leading-relaxed max-w-sm line-clamp-2">{item.title}</h4>
                              <p className="text-[9px] text-zinc-500 font-mono mt-1">SKU: <span className="text-neutral-300 font-semibold">{skuStr}</span></p>
                            </div>
                          </div>
                          <div className="sm:text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-1.5 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                            <span className="text-[10px] text-zinc-500 font-mono">Preço unitário/Qtd</span>
                            <p className="text-xs font-mono font-bold text-white mt-0.5">R$ {(item.price || 0).toFixed(2)} x {item.quantity}</p>
                            <p className="text-[11px] font-mono text-[#39ff14] font-black mt-1">R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PAGAMENTO & COMPROVANTE */}
                <div className="space-y-4">
                  <h5 className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono border-b border-white/5 pb-1">💰 Pagamento & Comprovante PIX</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Payment Specs */}
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col justify-between gap-3">
                      <div className="space-y-1.5">
                        <span className="text-[9px] text-zinc-500 uppercase font-mono block">Valor Consolidado</span>
                        <p className="text-lg font-mono font-black text-amber-300">{formattedTotal}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-mono block">Data/Hora da Transação</span>
                        <p className="text-xs text-neutral-300 font-mono">Enviado em {dEnvio} às {hEnvio}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-mono block">Método de Captura</span>
                        <p className="text-[10px] font-mono uppercase bg-white/5 text-neutral-300 border border-white/5 rounded px-2 py-0.5 w-fit">PIX DIRETO (QR CODE)</p>
                      </div>
                    </div>

                    {/* Receipt visualizer / download link */}
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center space-y-3 min-h-[140px]">
                      {ord.receiptDataUrl ? (
                        <>
                          <div className="relative group cursor-pointer border border-white/10 rounded-lg overflow-hidden max-h-32 w-28 bg-neutral-950 flex items-center justify-center">
                            {ord.receiptDataUrl.startsWith('data:image/') || ord.receiptDataUrl.includes('unsplash') || (ord.receiptDataUrl.startsWith('http') && !ord.receiptDataUrl.includes('pdf')) ? (
                              <img 
                                src={ord.receiptDataUrl} 
                                alt="Comprovante" 
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <span className="text-rose-400 text-lg font-mono">📄 PDF</span>
                            )}
                            <div 
                              onClick={() => {
                                setSelectedReceiptUrl(ord.receiptDataUrl);
                                setSelectedReceiptOrder(ord);
                              }}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
                            >
                              <span className="text-[9px] text-white font-semibold font-mono tracking-wider">EXPANDIR</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedReceiptUrl(ord.receiptDataUrl);
                                setSelectedReceiptOrder(ord);
                              }}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-neutral-300 text-[10px] font-mono border border-white/5 rounded transition"
                            >
                              Expandir Comprovante
                            </button>
                            <a 
                              href={ord.receiptDataUrl}
                              download={`comprovante-${ord.id}`}
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/20 rounded transition"
                            >
                              Baixar
                            </a>
                          </div>
                        </>
                      ) : (
                        <div className="py-4">
                          <span className="text-2xl">⚠️</span>
                          <p className="text-xs text-neutral-500 mt-2 font-mono">Nenhum comprovante de pagamento PIX foi anexado a este pedido.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* STATUS FLOW MANAGER */}
                <div className="space-y-3">
                  <h5 className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono border-b border-white/5 pb-1">⚡- Status do Pedido (Atualização)</h5>
                  
                  {/* Current Status Badge view */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] text-zinc-500 font-mono">Status Atual do Pedido:</span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-black ${
                      currentStatus === 'Pago' || currentStatus === 'pago' || ord.status === 'Pago'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : currentStatus === 'Em Separação'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : currentStatus === 'Enviado' || currentStatus === 'enviado'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : currentStatus === 'Entregue' || currentStatus === 'entregue'
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    }`}>
                      {currentStatus}
                    </span>
                    <span className="text-zinc-600 font-mono">|</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Status Financeiro:</span>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-black ${
                      currentValStatus === 'Aprovado' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : currentValStatus === 'Rejeitado'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}>
                      {currentValStatus}
                    </span>
                  </div>

                  {/* Status update steps */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { label: "Aguardando Pagamento", status: "Aguardando Pagamento", style: "border-yellow-500/20 hover:bg-yellow-500/5 text-yellow-400" },
                      { label: "Comprovante Recebido", status: "Comprovante Recebido", style: "border-orange-500/20 hover:bg-orange-500/5 text-orange-400" },
                      { label: "Pagamento Confirmado", status: "Pagamento Confirmado", style: "border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-400" },
                      { label: "Em Separação", status: "Em Separação", style: "border-purple-500/20 hover:bg-purple-500/5 text-purple-400" },
                      { label: "Enviado", status: "Enviado", style: "border-blue-500/20 hover:bg-blue-500/5 text-blue-400" },
                      { label: "Entregue", status: "Entregue", style: "border-green-500/20 hover:bg-green-500/5 text-green-400" }
                    ].map((stItem) => {
                      // Normalize active check
                      let isActive = false;
                      if (stItem.status === 'Aguardando Pagamento' && (currentStatus === 'Aguardando Pagamento' || currentStatus === 'Pendente')) isActive = true;
                      else if (stItem.status === 'Comprovante Recebido' && currentStatus === 'Comprovante Enviado') isActive = true;
                      else if (stItem.status === 'Pagamento Confirmado' && (currentStatus === 'Pago' || currentStatus === 'Pagamento Confirmado' || currentStatus === 'pago')) isActive = true;
                      else if (stItem.status === currentStatus) isActive = true;

                      return (
                        <button
                          key={stItem.status}
                          onClick={() => handleUpdateDetailedOrderStatus(ord.id, stItem.status)}
                          className={`px-3 py-2.5 rounded-lg border text-left text-[10px] font-mono transition font-bold uppercase tracking-wide cursor-pointer flex flex-col justify-between ${
                            isActive 
                              ? 'bg-white text-black border-white font-black'
                              : `bg-neutral-900 border-white/5 ${stItem.style}`
                          }`}
                        >
                          <span>{stItem.label}</span>
                          {isActive && <span className="text-[8px] bg-neutral-900 text-white border border-white/10 px-1 py-0.2 rounded mt-1 font-mono uppercase">Ativo</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-black/40 border-t border-white/10 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setSelectedDetailedOrder(null)}
                  className="px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded-lg font-mono font-bold uppercase cursor-pointer"
                >
                  Concluir Visualização
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
