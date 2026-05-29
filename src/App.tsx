import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Filter, RotateCcw, HelpCircle, Check, Search, Calendar, Heart, ArrowRight, Sparkles,
  Shirt, Footprints, Briefcase, Gem, Award, Lock, Truck, Home, Grid, Plus, User, Eye, ShoppingBag
} from 'lucide-react';
import { Product, CartItem } from './types';
import { INITIAL_PRODUCTS } from './data/initialProducts';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import StylistChat from './components/StylistChat';
import AdminPanel from './components/AdminPanel';
import ProductCarousel from './components/ProductCarousel';
// @ts-ignore
import logoImg from './assets/images/modivah_logo_1779828536217.png';
// @ts-ignore
import mascotImg from './assets/images/modivah_app_icon_1779927087425.png';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export default function App() {
  // Products list from localStorage or INITIAL_PRODUCTS fallback
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('modivah_products_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler modivah_products_cache de localStorage:', e);
    }
    return INITIAL_PRODUCTS;
  });
  
  // Cart state sync
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Category & Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('Tudo');
  const [selectedSize, setSelectedSize] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drawer & Overlay Toggle controls
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isStylistOpen, setIsStylistOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductViewMode, setSelectedProductViewMode] = useState<'image' | 'video'>('image');

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('modivah_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isFavoritesOnly, setIsFavoritesOnly] = useState(false);

  // Admin session flag
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Notification banners
  const [notification, setNotification] = useState<string | null>(null);

  // Seed the Firestore database with initial products if it is empty
  const seedDatabase = async () => {
    try {
      const batch = writeBatch(db);
      INITIAL_PRODUCTS.forEach((product) => {
        const docRef = doc(db, 'products', product.id);
        batch.set(docRef, product);
      });
      await batch.commit();
      notify("Estoque inicial carregado no banco de dados sincronizado!");
      try {
        localStorage.setItem('modivah_products_cache', JSON.stringify(INITIAL_PRODUCTS));
      } catch (err) {
        console.warn('Erro ao salvar cache de produtos:', err);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  // Load baseline values on mount and subscribe to Firestore updates
  useEffect(() => {
    // 1. Subscribe to Real-time Products catalog
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const fetchedProducts: Product[] = [];
        snapshot.forEach((doc) => {
          fetchedProducts.push(doc.data() as Product);
        });

        if (fetchedProducts.length === 0) {
          // If Firestore is empty, let's see if we have products in local cache first
          let cached: Product[] = [];
          try {
            const saved = localStorage.getItem('modivah_products_cache');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                cached = parsed;
              }
            }
          } catch (e) {}

          if (cached.length > 0) {
            // Seed Firestore with our cached products so they aren't lost!
            const batch = writeBatch(db);
            cached.forEach((product) => {
              const docRef = doc(db, 'products', product.id);
              batch.set(docRef, product);
            });
            batch.commit()
              .then(() => notify("Estoque recuperado e sincronizado com o banco de dados remoto!"))
              .catch((err) => console.error("Erro ao subir cache local para o Firestore:", err));
            setProducts(cached);
          } else {
            // Empty DB and empty cache: seed with default catalog
            seedDatabase();
          }
        } else {
          // Sort fetched products by creation timestamp descending
          fetchedProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          // Set products directly from the latest snapshot of Firestore - guaranteeing real-time updates!
          setProducts(fetchedProducts);

          // Update disk storage cache
          try {
            localStorage.setItem('modivah_products_cache', JSON.stringify(fetchedProducts));
          } catch (err) {
            console.warn('Erro ao atualizar modivah_products_cache:', err);
          }
        }
      },
      (error) => {
        console.warn('Firestore connection issue or permission denied. Falling back to local cache.', error);
        // Fallback: Read cache
        try {
          const saved = localStorage.getItem('modivah_products_cache');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProducts(parsed);
            }
          }
        } catch (e) {
          console.warn('Erro ao ler cache local após falha do Firestore:', e);
        }
      }
    );

    // 2. Load shopping cart from localStorage (local to individual client)
    const savedCart = localStorage.getItem('modivah_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        setCart([]);
      }
    }

    return () => unsubscribe();
  }, []);

  // Save cart changes asynchronously to prevent blocking the UI thread (INP optimization)
  const saveCartToStorage = useCallback((newCart: CartItem[]) => {
    setCart(newCart);
    setTimeout(() => {
      try {
        localStorage.setItem('modivah_cart', JSON.stringify(newCart));
      } catch (err) {
        console.warn('Erro ao salvar no localStorage:', err);
      }
    }, 0);
  }, []);

  // Memoized push notifications
  const notify = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) => {
      const isFav = prev.includes(productId);
      const updated = isFav ? prev.filter((id) => id !== productId) : [...prev, productId];
      setTimeout(() => {
        try {
          localStorage.setItem('modivah_favorites', JSON.stringify(updated));
        } catch (e) {
          console.warn(e);
        }
      }, 0);
      notify(isFav ? 'Removido dos favoritos 🖤' : 'Adicionado aos favoritos! ❤️');
      return updated;
    });
  }, [notify]);

  // CART HANDLERS - Optimized for maximum performance and touch latency reduction (PWA/Mobile INP)
  const handleAddToCart = useCallback((product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find(item => item.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const availableStock = product.stock !== undefined ? product.stock : 1;

      if (currentQty >= availableStock) {
        // Enqueue next tick to maintain clean call stack
        setTimeout(() => {
          notify(`Limite esgotado! Apenas ${availableStock} ${availableStock === 1 ? 'peça única' : 'unidades'} deste item em estoque.`);
        }, 0);
        return prevCart;
      }

      let updated: CartItem[];
      if (existing) {
        updated = prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        updated = [...prevCart, { product, quantity: 1 }];
      }

      // Defer high cost side-effects (Disk I/O and secondary UI rendering transitions)
      setTimeout(() => {
        try {
          localStorage.setItem('modivah_cart', JSON.stringify(updated));
        } catch (e) {
          console.warn(e);
        }
        
        notify(`"${product.title}" adicionado à sacola! ✨`);
        
        // Defer drawer opening to allow button click ripple animation to finish instantly
        setTimeout(() => {
          React.startTransition(() => {
            setIsCartOpen(true);
          });
        }, 30);
      }, 0);

      return updated;
    });
  }, [notify]);

  const handleUpdateCartQuantity = useCallback((productId: string, delta: number) => {
    setCart((prevCart) => {
      const updated = prevCart.map(item => {
        if (item.product.id === productId) {
          const nextQty = item.quantity + delta;
          const availableStock = item.product.stock !== undefined ? item.product.stock : 1;
          
          if (nextQty > availableStock) {
            setTimeout(() => {
              notify(`Poxa! Apenas ${availableStock} ${availableStock === 1 ? 'unidade está' : 'unidades estão'} disponível no momento.`);
            }, 0);
            return item;
          }
          return nextQty > 0 ? { ...item, quantity: nextQty } : item;
        }
        return item;
      });

      setTimeout(() => {
        try {
          localStorage.setItem('modivah_cart', JSON.stringify(updated));
        } catch (e) {
          console.warn(e);
        }
      }, 0);

      return updated;
    });
  }, [notify]);

  const handleRemoveCartItem = useCallback((productId: string) => {
    setCart((prevCart) => {
      const updated = prevCart.filter(item => item.product.id !== productId);
      
      setTimeout(() => {
        try {
          localStorage.setItem('modivah_cart', JSON.stringify(updated));
        } catch (e) {
          console.warn(e);
        }
      }, 0);

      return updated;
    });
  }, []);

  const handleClearCart = useCallback(() => {
    setCart([]);
    setTimeout(() => {
      try {
        localStorage.removeItem('modivah_cart');
      } catch (e) {
        console.warn(e);
      }
      notify("Sacola esvaziada.");
    }, 0);
  }, [notify]);

  // Stable view details handler optimized with non-blocking startTransition (INP optimization)
  const handleViewDetails = useCallback((product: Product, initialView?: 'image' | 'video') => {
    React.startTransition(() => {
      setSelectedProduct(product);
      setSelectedProductViewMode(initialView || 'image');
    });
  }, []);

  // Helper for authenticated backend API operations
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = sessionStorage.getItem('modivah_admin_token') || localStorage.getItem('modivah_admin_token');
    const headers = {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      sessionStorage.removeItem('modivah_admin_token');
      sessionStorage.removeItem('modivah_admin_auth');
      localStorage.removeItem('modivah_admin_token');
      localStorage.removeItem('modivah_admin_auth');
      setIsAdminMode(false);
      throw new Error("Sessão administrativa expirada ou inválida. Por favor, faça login novamente.");
    }
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Erro de rede: Código ${res.status}`);
    }
    
    return res.json();
  };

  // PRODUCT / CATALOG HANDLERS
  const handleAddProduct = async (newProduct: Product) => {
    try {
      const cleanProduct = Object.fromEntries(
        Object.entries(newProduct).filter(([_, v]) => v !== undefined)
      ) as Product;

      // Update local state and disk storage instantaneously so nothing disappears
      setProducts((prev) => {
        const updated = [cleanProduct, ...prev.filter(p => p.id !== cleanProduct.id)];
        try {
          localStorage.setItem('modivah_products_cache', JSON.stringify(updated));
        } catch (err) {
          console.warn('Erro ao salvar no localStorage:', err);
        }
        return updated;
      });

      // 1. Direct write to Firestore from the client-side
      const docRef = doc(db, 'products', cleanProduct.id);
      await setDoc(docRef, cleanProduct);

      // 2. Safe secondary backend proxy write
      try {
        await authFetch('/api/admin/add-product', {
          method: 'POST',
          body: JSON.stringify(cleanProduct)
        });
      } catch (be) {
        console.warn('Erro secundário de sincronização no backend (ignorado pois já salvo no Firestore):', be);
      }

      notify(`Nova peça "${cleanProduct.title}" cadastrada com sucesso!`);
    } catch (error: any) {
      console.warn('Erro ao salvar no Firestore:', error);
      notify(`Erro ao salvar: ${error.message}`);
      // Revert if error occurs so local state is consistent
      try {
        const cached = localStorage.getItem('modivah_products_cache');
        if (cached) setProducts(JSON.parse(cached));
      } catch (e) {}
    }
    setIsAdminMode(true);
  };

  const handleUpdateProductStatus = async (productId: string, status: 'available' | 'reserved' | 'sold') => {
    try {
      // Synchronous optimistic update to local state and localStorage cache
      setProducts((prev) => {
        const updated = prev.map(p => p.id === productId ? { ...p, status } : p);
        try {
          localStorage.setItem('modivah_products_cache', JSON.stringify(updated));
        } catch (err) {
          console.warn(err);
        }
        return updated;
      });

      // 1. Direct update to Firestore from the client-side
      const docRef = doc(db, 'products', productId);
      await updateDoc(docRef, { status });

      // 2. Safe secondary backend proxy update
      try {
        await authFetch('/api/admin/update-status', {
          method: 'POST',
          body: JSON.stringify({ productId, status })
        });
      } catch (be) {
        console.warn('Erro secundário ao atualizar status no backend:', be);
      }

      notify("Status da peça atualizado.");
    } catch (error: any) {
      console.warn('Erro ao salvar status no Firestore, revertendo:', error);
      notify(`Erro: ${error.message}`);
      try {
        const cached = localStorage.getItem('modivah_products_cache');
        if (cached) setProducts(JSON.parse(cached));
      } catch (e) {}
    }
  };

  const handleUpdateProductPrice = async (productId: string, price: number) => {
    try {
      // Synchronous optimistic update to local state and localStorage cache
      setProducts((prev) => {
        const updated = prev.map(p => p.id === productId ? { ...p, price } : p);
        try {
          localStorage.setItem('modivah_products_cache', JSON.stringify(updated));
        } catch (err) {
          console.warn(err);
        }
        return updated;
      });

      // 1. Direct update to Firestore from the client-side
      const docRef = doc(db, 'products', productId);
      await updateDoc(docRef, { price });

      // 2. Safe secondary backend proxy update
      try {
        await authFetch('/api/admin/update-price', {
          method: 'POST',
          body: JSON.stringify({ productId, price })
        });
      } catch (be) {
        console.warn('Erro secundário ao atualizar preço no backend:', be);
      }

      notify("Valor da peça atualizado.");
    } catch (error: any) {
      console.warn('Erro ao salvar valor do produto no Firestore, revertendo:', error);
      notify(`Erro: ${error.message}`);
      try {
        const cached = localStorage.getItem('modivah_products_cache');
        if (cached) setProducts(JSON.parse(cached));
      } catch (e) {}
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      const cleanProduct = Object.fromEntries(
        Object.entries(updatedProduct).filter(([_, v]) => v !== undefined)
      ) as Product;

      // Synchronous optimistic update to local state and localStorage cache
      setProducts((prev) => {
        const updated = prev.map(p => p.id === cleanProduct.id ? cleanProduct : p);
        try {
          localStorage.setItem('modivah_products_cache', JSON.stringify(updated));
        } catch (err) {
          console.warn(err);
        }
        return updated;
      });

      // 1. Direct write to Firestore from the client-side
      const docRef = doc(db, 'products', cleanProduct.id);
      await setDoc(docRef, cleanProduct);

      // 2. Safe secondary backend proxy update
      try {
        await authFetch('/api/admin/update-product', {
          method: 'POST',
          body: JSON.stringify(cleanProduct)
        });
      } catch (be) {
        console.warn('Erro secundário ao atualizar produto no backend:', be);
      }
      
      if (selectedProduct && selectedProduct.id === cleanProduct.id) {
        setSelectedProduct(cleanProduct);
      }
      notify(`Anúncio "${cleanProduct.title}" atualizado!`);
    } catch (error: any) {
      console.warn('Erro ao atualizar produto no Firestore, revertendo:', error);
      notify(`Erro: ${error.message}`);
      try {
        const cached = localStorage.getItem('modivah_products_cache');
        if (cached) setProducts(JSON.parse(cached));
      } catch (e) {}
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm("Deseja realmente remover esta peça única do catálogo do brechó?")) {
      try {
        // Synchronous optimistic update to local state and localStorage cache
        setProducts((prev) => {
          const updated = prev.filter(p => p.id !== productId);
          try {
            localStorage.setItem('modivah_products_cache', JSON.stringify(updated));
          } catch (err) {
            console.warn(err);
          }
          return updated;
        });

        // 1. Direct delete from Firestore on the client-side
        const docRef = doc(db, 'products', productId);
        await deleteDoc(docRef);

        // 2. Safe secondary backend delete
        try {
          await authFetch('/api/admin/delete-product', {
            method: 'POST',
            body: JSON.stringify({ productId })
          });
        } catch (be) {
          console.warn('Erro secundário ao excluir produto no backend:', be);
        }

        notify("Peça removida do estoque.");
      } catch (error: any) {
        console.warn('Erro ao remover produto no Firestore, revertendo:', error);
        notify(`Erro: ${error.message}`);
        try {
          const cached = localStorage.getItem('modivah_products_cache');
          if (cached) setProducts(JSON.parse(cached));
        } catch (e) {}
      }
    }
  };

  const handleResetDatabase = async () => {
    if (confirm("Deseja realmente restaurar as configurações de fábrica e recarregar todo o estoque original no Firebase?")) {
      try {
        // Limpa cache local primeiro
        try {
          localStorage.removeItem('modivah_products_cache');
        } catch (e) {}

        await authFetch('/api/admin/reset-database', {
          method: 'POST'
        });
        
        setCart([]);
        localStorage.removeItem('modivah_cart');
        setIsAdminMode(true);
        notify("Banco de dados restaurado e semeado com sucesso!");
      } catch (error: any) {
        console.warn('Erro ao resetar banco no backend:', error);
        notify(`Erro: ${error.message}`);
      }
    }
  };

  // FILTERS IMPLEMENTATIONS
  const categories = ['Tudo', 'Acessórios', 'Blusas', 'Calçados', 'Calças', 'Casacos', 'Conjuntos', 'Outros', 'Roupas Fitness', 'Shortes', 'Vestidos'];
  const sizes = ['Todos', 'P', 'M', 'G', 'GG', '36', '38', '40', 'Único'];

  const filteredProducts = products.filter(p => {
    // 0. Favorites filter
    if (isFavoritesOnly && !favorites.includes(p.id)) return false;

    // 1. Category comparison
    const matchesCategory = selectedCategory === 'Tudo' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    
    // 2. Size comparison
    const matchesSize = selectedSize === 'Todos' || p.size.toUpperCase() === selectedSize.toUpperCase();
    
    // 3. Search text query comparison (fuzzy scanning)
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = normalizedQuery === '' || 
      p.title.toLowerCase().includes(normalizedQuery) ||
      p.brand.toLowerCase().includes(normalizedQuery) ||
      p.description.toLowerCase().includes(normalizedQuery) ||
      p.category.toLowerCase().includes(normalizedQuery) ||
      p.size.toLowerCase().includes(normalizedQuery) ||
      (p.tag && p.tag.toLowerCase().includes(normalizedQuery));

    return matchesCategory && matchesSize && matchesSearch;
  });

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0f0f0f] text-white/90 selection:bg-amber-500 selection:text-black font-sans flex flex-col antialiased">
      
      {/* BILBOARD BRAND POSTER / CARTAZ FIXO NO TOPO COBRINDO DE UM LADO A OUTRO */}
      <div className="w-full bg-black border-b-2 border-amber-500/15 relative overflow-hidden shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.8)]" id="marquee-brand-banner">
        <img 
          src={logoImg} 
          alt="Banner Modivah Brechó" 
          className="w-full h-auto block select-none" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#39ff14] to-transparent shadow-[0_0_15px_rgba(57,255,20,0.5)]" />
      </div>

      {/* Visual background atmospheric lights */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/[0.02] filter blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/[0.01] filter blur-[150px] pointer-events-none" />

      {/* Floating global persistent notifications banner */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-black/95 text-amber-200 border border-amber-500/20 px-6 py-2.5 rounded-full text-xs font-medium shadow-2xl flex items-center gap-2"
          >
            <Check className="h-4 w-4 text-amber-400" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Sticky Navigation Panel */}
      <Navbar 
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenStylist={() => setIsStylistOpen(true)}
        onOpenAdmin={() => {
          setIsAdminOpen(true);
          setIsAdminMode(true);
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isAdmin={isAdminMode}
      />

      {/* Hero Curated Title Presentation Area */}
      <Hero onOpenStylist={() => setIsStylistOpen(true)} />

      {/* Dynamic Products Carousel Showcase (Velocidade ideal com fotos em formato de tamanho celular perfeitamente otimizado) */}
      <ProductCarousel 
        products={products}
        onViewDetails={handleViewDetails}
        onAddToCart={handleAddToCart}
      />

      {/* Main product showcase and category filter tabs section */}
      <main className="max-w-7xl mx-auto px-4 py-12 flex-1 w-full flex flex-col md:flex-row gap-8" id="storefront-main-grid">
        
        {/* Dynamic Left sidebar panel for screens filter inputs */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl sticky top-28">
            <h3 className="text-xs uppercase tracking-widest text-neutral-400 font-semibold mb-4 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-amber-400" />
              <span>Garimpar Filtros</span>
            </h3>

            {/* Filter by Brand text Search box */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1.5 font-mono">Pesquisa Chave</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Zara, Farm, G, seda..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-white/30"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white text-xs">×</button>
                  )}
                </div>
              </div>

              {/* Categorias links list vertical (Fluorescent blue active and hover effects) */}
              <div>
                <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-1.5 font-mono">Categorias</label>
                <div className="flex flex-row flex-wrap md:flex-col md:flex-nowrap gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left text-xs px-3 py-1.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/40 shadow-[0_0_15px_rgba(0,240,255,0.3)] font-bold'
                          : 'bg-transparent text-neutral-400 border-transparent hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 hover:border-[#00f0ff]/20 hover:shadow-[0_0_10px_rgba(0,240,255,0.15)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tamanho grid box size filters */}
              <div>
                <label className="text-[10px] text-neutral-500 uppercase tracking-wider block mb-2 font-mono">Tamanhos</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`text-center py-1 rounded text-xs transition border font-mono ${
                        selectedSize === sz
                          ? 'bg-amber-300 text-black font-semibold border-amber-300'
                          : 'bg-white/5 text-neutral-400 border-white/5 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset selection states filters */}
              {(selectedCategory !== 'Tudo' || selectedSize !== 'Todos' || searchQuery !== '') && (
                <button
                  onClick={() => {
                    setSelectedCategory('Tudo');
                    setSelectedSize('Todos');
                    setSearchQuery('');
                  }}
                  className="w-full align-center py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-xs font-medium cursor-pointer transition flex items-center justify-center gap-1.5 mt-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Limpar Filtros</span>
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Right Product Grid Area */}
        <section className="flex-1 space-y-6">
          <div className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <span className="text-xs text-neutral-400 block font-light leading-snug">Exibindo peças únicas selecionadas</span>
              <h2 className="text-lg md:text-xl font-sans font-light text-white mt-0.5">
                {selectedCategory === 'Tudo' ? 'Nosso Acervo' : selectedCategory} 
                {selectedSize !== 'Todos' && ` — Tam ${selectedSize}`}
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-500">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'peça encontrada' : 'peças encontradas'}
            </span>
          </div>

          {/* Catalog Loading/Empty state conditional */}
          {filteredProducts.length === 0 ? (
            <div className="py-20 text-center bg-white/[0.01] border border-white/5 rounded-2xl">
              <div className="p-4 bg-white/5 rounded-full inline-block mb-3">
                <Search className="h-6 w-6 text-neutral-500" />
              </div>
              <h3 className="text-sm font-medium text-white">Nenhuma peça coincide com sua busca</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed mt-1.5 font-light text-justify md:text-center">
                Gosto refinado costuma ser único! Experimente limpar alguns filtros, expandir a busca por tamanhos, ou pergunte à **Mo IA** por alternativas similares.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('Tudo');
                  setSelectedSize('Todos');
                  setSearchQuery('');
                }}
                className="mt-6 px-4 py-2 bg-white text-black font-semibold text-[10px] uppercase tracking-widest rounded-full cursor-pointer hover:bg-neutral-200 transition"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="products-catalog-bento-grid">
              {filteredProducts.map((p) => (
                <ProductCard 
                  key={p.id}
                  product={p}
                  onViewDetails={handleViewDetails}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Exquisite Footer signature */}
      <footer className="bg-black/60 border-t border-white/10 mt-28 py-12 text-center text-xs text-white/50 space-y-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-sm font-bold tracking-[0.2em] text-white">MODIVAH BRECHÓ</span>
            <p className="text-[10px] text-neutral-500 mt-1 font-light">Curadoria Premium de Moda Circular Feminina Autêntica</p>
          </div>
          
          <div className="flex gap-4">
            <a href="https://wa.me/5527988226654" target="_blank" rel="noopener noreferrer" className="hover:text-amber-200 transition">Atendimento WhatsApp</a>
            <span>•</span>
            <button onClick={() => setIsStylistOpen(true)} className="hover:text-amber-200 transition cursor-pointer">Fale com a Mo IA</button>
            <span>•</span>
            <button onClick={() => { setIsAdminOpen(true); setIsAdminMode(true); }} className="hover:text-amber-200 transition cursor-pointer">Painel Admin</button>
          </div>
        </div>
        
        <div className="pt-6 border-t border-white/5 text-[10px] text-neutral-600 space-y-1">
          <p>© 2026 MODIVAH BRECHÓ — Todos os direitos reservados Cariacica - ES, Brasil.</p>
          <p className="text-[9px] text-neutral-700 tracking-wider">Criado por Claudio S. Silva</p>
        </div>
      </footer>

      {/* QUICK VIEW DETAILS MODAL */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        initialViewMode={selectedProductViewMode}
      />

      {/* SHOPPING BAG DRAWER */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      {/* AI PERSONAL STYLIST DRAWER CHAT */}
      <StylistChat
        isOpen={isStylistOpen}
        onClose={() => setIsStylistOpen(false)}
        products={products}
        onViewProduct={(p) => {
          handleViewDetails(p);
          setIsStylistOpen(false);
        }}
        onAddToCart={(p) => {
          handleAddToCart(p);
          setIsStylistOpen(false);
          setIsCartOpen(true);
        }}
      />

      {/* CONSOLE DATABASE ADMIN DRAWER PANEL */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onUpdateProductStatus={handleUpdateProductStatus}
        onUpdateProductPrice={handleUpdateProductPrice}
        onDeleteProduct={handleDeleteProduct}
        onResetDatabase={handleResetDatabase}
      />

      {/* Float sticky quick CTA for Personal Stylist */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
        {/* Whatsapp contact */}
        <a 
          href="https://wa.me/5527988226654" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition flex items-center justify-center cursor-pointer"
          title="Falar no WhatsApp"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle shrink-0"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 .099.092 10 10 0 1 0-4.777-4.719"></path></svg>
        </a>

        {/* AI stylist bubble */}
        <button
          onClick={() => setIsStylistOpen(true)}
          className="bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:from-amber-300 hover:to-amber-400 p-3.5 rounded-full shadow-lg shadow-amber-500/40 hover:scale-105 active:scale-95 transition flex items-center justify-center cursor-pointer border border-amber-300/30"
          title="Falar com a Mo IA"
        >
          <Sparkles className="h-5.5 w-5.5 text-black animate-spin-slow" />
        </button>
      </div>



    </div>
  );
}
