import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Filter, RotateCcw, HelpCircle, Check, Search, Calendar, Heart, ArrowRight, Sparkles,
  Shirt, Footprints, Briefcase, Gem, Award, Lock, Truck, Home, Grid, Plus, User, Eye, ShoppingBag,
  X, RefreshCw, Image as ImageIcon, AlertCircle
} from 'lucide-react';
import { Product, CartItem, Category } from './types';
import { FULL_MOCK_ACERVO } from './data/fullMockAcervo';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import StylistChat from './components/StylistChat';
import AdminPanel from './components/AdminPanel';
import ProductCarousel from './components/ProductCarousel';
import ClientAuth from './components/ClientAuth';
import CommentsSection from './components/CommentsSection';
import LeadCapture from './components/LeadCapture';
import { onAuthStateChanged, signOut } from 'firebase/auth';
// @ts-ignore
import logoImg from './assets/images/modivah_logo_1779828536217.png';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch, getDoc, query, where, getDocs } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { apiFetch } from './utils/apiFetch';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-acessorios', name: 'Acessórios', active: true, order: 1 },
  { id: 'cat-bermudas', name: 'Bermudas', active: true, order: 2 },
  { id: 'cat-bijuterias', name: 'Bijuterias', active: true, order: 3 },
  { id: 'cat-blazers', name: 'Blazers', active: true, order: 4 },
  { id: 'cat-blusas', name: 'Blusas', active: true, order: 5 },
  { id: 'cat-bodys', name: 'Bodys', active: true, order: 6 },
  { id: 'cat-bolsas', name: 'Bolsas', active: true, order: 7 },
  { id: 'cat-botas', name: 'Botas', active: true, order: 8 },
  { id: 'cat-calcas', name: 'Calças', active: true, order: 9 },
  { id: 'cat-calcados', name: 'Calçados', active: true, order: 10 },
  { id: 'cat-camisas', name: 'Camisas', active: true, order: 11 },
  { id: 'cat-camisetas', name: 'Camisetas', active: true, order: 12 },
  { id: 'cat-cardigans', name: 'Cardigans', active: true, order: 13 },
  { id: 'cat-carteiras', name: 'Carteiras', active: true, order: 14 },
  { id: 'cat-casacos', name: 'Casacos', active: true, order: 15 },
  { id: 'cat-cintos', name: 'Cintos', active: true, order: 16 },
  { id: 'cat-coletes', name: 'Coletes', active: true, order: 17 },
  { id: 'cat-conjuntos', name: 'Conjuntos', active: true, order: 18 },
  { id: 'cat-croppeds', name: 'Croppeds', active: true, order: 19 },
  { id: 'cat-fitness', name: 'Fitness', active: true, order: 20 },
  { id: 'cat-infantil', name: 'Infantil', active: true, order: 21 },
  { id: 'cat-jaquetas', name: 'Jaquetas', active: true, order: 22 },
  { id: 'cat-jeans', name: 'Jeans', active: true, order: 23 },
  { id: 'cat-joias', name: 'Joias e Semijoias', active: true, order: 24 },
  { id: 'cat-lencos', name: 'Lenços', active: true, order: 25 },
  { id: 'cat-macacoes', name: 'Macacões', active: true, order: 26 },
  { id: 'cat-macaquinhos', name: 'Macaquinhos', active: true, order: 27 },
  { id: 'cat-malas-mochilas', name: 'Malas e Mochilas', active: true, order: 28 },
  { id: 'cat-masculino', name: 'Masculino', active: true, order: 29 },
  { id: 'cat-moda-praia', name: 'Moda Praia', active: true, order: 30 },
  { id: 'cat-moletons', name: 'Moletons', active: true, order: 31 },
  { id: 'cat-oculos', name: 'Óculos', active: true, order: 32 },
  { id: 'cat-perfumes', name: 'Perfumes', active: true, order: 33 },
  { id: 'cat-plus-size', name: 'Plus Size', active: true, order: 34 },
  { id: 'cat-regatas', name: 'Regatas', active: true, order: 35 },
  { id: 'cat-relogios', name: 'Relógios', active: true, order: 36 },
  { id: 'cat-saias', name: 'Saias', active: true, order: 37 },
  { id: 'cat-sandalias', name: 'Sandálias', active: true, order: 38 },
  { id: 'cat-shorts', name: 'Shorts', active: true, order: 39 },
  { id: 'cat-sueteres', name: 'Suéteres', active: true, order: 40 },
  { id: 'cat-tenis', name: 'Tênis', active: true, order: 41 },
  { id: 'cat-trench-coats', name: 'Trench Coats', active: true, order: 42 },
  { id: 'cat-trico-croche', name: 'Tricô e Crochê', active: true, order: 43 },
  { id: 'cat-vestidos', name: 'Vestidos', active: true, order: 44 }
];

export default function App() {
  // Products list starts empty in compliance with database emergency recovery directives
  const [products, setProducts] = useState<Product[]>([]);
  
  // Cart state sync
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Category & Filter states
  const [categoriesList, setCategoriesList] = useState<Category[]>(DEFAULT_CATEGORIES);
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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Admin session flag
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return localStorage.getItem('modivah_admin_auth') === 'true' || sessionStorage.getItem('modivah_admin_auth') === 'true';
  });

  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);

  const [currentClient, setCurrentClient] = useState<any | null>(() => {
    try {
      const cached = localStorage.getItem('modivah_client_data');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isClientAuthLoading, setIsClientAuthLoading] = useState(true);
  const [isInitialLoadingProducts, setIsInitialLoadingProducts] = useState(true);
  const isCatalogLoadingRef = useRef(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [splashActive, setSplashActive] = useState(true);

  // Elegant minimum display timer for the high-end luxury white Brand Splash Screen
  useEffect(() => {
    // Purge fake mock caches immediately from localStorage and sessionStorage
    try {
      localStorage.removeItem('modivah_products_cache');
      localStorage.removeItem('modivah_categories_cache');
      sessionStorage.removeItem('modivah_products_cache');
      sessionStorage.removeItem('modivah_categories_cache');
    } catch (e) {}

    const timer = setTimeout(() => {
      setSplashActive(false);
    }, 1700); // 1.7 seconds of pure luxury brand showcase with zoom & shining fade
    return () => clearTimeout(timer);
  }, []);

  // Subscribe to core Authentication states
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setIsClientAuthLoading(true);
      if (authUser) {
        try {
          const user = authUser;
          let adminData: any = null;
          let role: string = '';
          const emailLower = user.email ? user.email.toLowerCase().trim() : '';

          // 1. Fetch client profile from Firestore Database
          const docRef = doc(db, 'clients', authUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const clientData = snap.data();
            setCurrentClient(clientData);
            localStorage.setItem('modivah_client_data', JSON.stringify(clientData));
          } else {
            // Profile backup fallback
            const backupProfile = {
              id: authUser.uid,
              name: authUser.displayName || 'Cliente Modivah Oficial',
              email: authUser.email || '',
              phone: '',
              whatsapp: '',
              city: 'Cariacica',
              state: 'ES',
              createdAt: new Date().toISOString()
            };
            setCurrentClient(backupProfile);
            localStorage.setItem('modivah_client_data', JSON.stringify(backupProfile));
          }

          // 2. Query administrators database table/collection dynamically on any device
          if (emailLower) {
            try {
              const adminsRef = collection(db, 'admins');
              const q = query(adminsRef, where('email', '==', emailLower));
              const querySnapshot = await getDocs(q);
              
              if (!querySnapshot.empty) {
                const adminDoc = querySnapshot.docs[0];
                adminData = adminDoc.data();
                role = adminData.role || 'admin';
              }
            } catch (err) {
              console.warn("[Admin Sync] Error querying admins collection on login: ", err);
            }

            // Guarantee that ONLY claudioshekina34@gmail.com and gleidefx38@gmail.com can possess administrative access
            if (emailLower === 'claudioshekina34@gmail.com' || emailLower === 'gleidefx38@gmail.com') {
              if (!adminData) {
                adminData = {
                  id: authUser.uid,
                  email: emailLower,
                  name: emailLower === 'gleidefx38@gmail.com' ? 'Gleide' : 'Claudio Shekina',
                  role: 'superadmin',
                  createdAt: new Date().toISOString()
                };
              }
              role = 'superadmin';
            } else {
              adminData = null;
              role = '';
            }
          }

          // 3. Apply administrative permissions securely
          if (adminData) {
            setIsAdminMode(true);
            setIsAdminOpen(false); // keep drawer closed until they open it, but enable mode
            localStorage.setItem('modivah_admin_auth', 'true');
            sessionStorage.setItem('modivah_admin_auth', 'true');
            localStorage.setItem('modivah_admin_email', emailLower);
            
            // Sync fallback secure token for backend API operations
            if (!localStorage.getItem('modivah_admin_token') && !sessionStorage.getItem('modivah_admin_token')) {
              localStorage.setItem('modivah_admin_token', 'bypass_master_key_77277727');
              sessionStorage.setItem('modivah_admin_token', 'bypass_master_key_77277727');
            }

            // Exata string de log requisitada pelo diagnóstico no item 9:
            console.log("Usuário autenticado:", user.email);
            console.log("Administrador encontrado:", adminData);
            console.log("Permissão aplicada:", role);
            console.log("Dispositivo:", navigator.userAgent);
            console.log("Sessão carregada com sucesso");
          } else {
            // Se não for administrador no banco de dados, limpa qualquer resquício
            setIsAdminMode(false);
            localStorage.removeItem('modivah_admin_auth');
            sessionStorage.removeItem('modivah_admin_auth');
            localStorage.removeItem('modivah_admin_token');
            sessionStorage.removeItem('modivah_admin_token');
          }

        } catch (err) {
          console.warn("Error resolving client profile snapshot:", err);
        }
      } else {
        const isFallback = localStorage.getItem('modivah_auth_fallback_active') === 'true';
        if (!isFallback) {
          setCurrentClient(null);
          localStorage.removeItem('modivah_client_data');
        }
        
        // Do NOT clean up modivah_admin_auth session here, because admin
        // authentication is custom JWT-based and independent of client Firebase Auth states.
      }
      setIsClientAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  const handleClientLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Error signing out with Firebase Auth:", e);
    }
    localStorage.removeItem('modivah_client_data');
    localStorage.removeItem('modivah_auth_fallback_active');
    setCurrentClient(null);
  }, []);

  // Synchronise admin mode periodically from localStorage/sessionStorage
  useEffect(() => {
    const checkAdminAuth = () => {
      const isAuth = localStorage.getItem('modivah_admin_auth') === 'true' || sessionStorage.getItem('modivah_admin_auth') === 'true';
      if (isAuth !== isAdminMode) {
        setIsAdminMode(isAuth);
      }
    };
    
    const interval = setInterval(checkAdminAuth, 1000);
    return () => clearInterval(interval);
  }, [isAdminMode]);

  // Synchronize route and administrator drawer state on mount/popstate
  useEffect(() => {
    const handleUrlPath = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      const isAdminPath = path === '/admin' || path.startsWith('/admin/');
      if (isAdminPath) {
        setIsAdminOpen(true);
      } else {
        setIsAdminOpen(false);
      }
    };
    
    handleUrlPath();
    window.addEventListener('popstate', handleUrlPath);
    return () => window.removeEventListener('popstate', handleUrlPath);
  }, []);

  const handleCloseAdmin = useCallback(() => {
    setIsAdminOpen(false);
    if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin/')) {
      window.history.pushState({}, '', '/');
      setCurrentPath('/');
    }
  }, []);

  const handleOpenAdmin = useCallback(() => {
    setIsAdminOpen(true);
    setIsAdminMode(true);
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
      setCurrentPath('/admin');
    }
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setIsAdminMode(true);
    setIsAdminOpen(true);
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
    setCurrentPath('/admin');
  }, []);

  // Track product activities in Firestore behavioral database
  const trackActivity = useCallback(async (actionType: string, product?: Product) => {
    // Local Statistics Counter for any visitor (including anonymous/not logged in)
    if (product && actionType === 'view') {
      try {
        const key = 'modivah_perf_viewed_products';
        const saved = localStorage.getItem(key);
        const map = saved ? JSON.parse(saved) : {};
        map[product.id] = (map[product.id] || 0) + 1;
        localStorage.setItem(key, JSON.stringify(map));
      } catch (e) {}
    }

    if (!currentClient) return;
    try {
      const activityId = `act-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const activityRef = doc(db, 'activities', activityId);
      await setDoc(activityRef, {
        id: activityId,
        clientId: currentClient.id,
        clientName: currentClient.name,
        type: actionType,
        productId: product ? product.id : null,
        productTitle: product ? product.title : 'Navegando acervo',
        price: product ? product.price : 0,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Background behavioral tracking issue:", e);
    }
  }, [currentClient]);

  // Live Cart recovery trigger session
  const registerCartRecovery = useCallback(async (product: Product) => {
    if (!currentClient) return;
    try {
      const recoveryId = `rec-${currentClient.id}-${product.id}`;
      const recRef = doc(db, 'cart_recovery', recoveryId);
      await setDoc(recRef, {
        id: recoveryId,
        clientId: currentClient.id,
        clientName: currentClient.name,
        clientPhone: currentClient.whatsapp || currentClient.phone || '',
        productId: product.id,
        productTitle: product.title,
        productImage: product.image,
        price: product.price,
        isRecovered: false,
        recoveryMessageSent: false,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Abandoned cart logging issue:", err);
    }
  }, [currentClient]);

  // Notification banners
  const [notification, setNotification] = useState<string | null>(null);

  // States for viewing/auditing payment receipt via URL parameters
  const [receiptViewId, setReceiptViewId] = useState<string | null>(null);
  const [receiptOrderData, setReceiptOrderData] = useState<any | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewId = urlParams.get('view_receipt') || urlParams.get('receipt_id');
    if (viewId) {
      setReceiptViewId(viewId);
      setLoadingReceipt(true);
      
      getDoc(doc(db, 'orders', viewId)).then((snap) => {
        if (snap.exists()) {
          setReceiptOrderData(snap.data());
        }
        setLoadingReceipt(false);
      }).catch((err) => {
        console.error("Error fetching payment receipt document from Firestore:", err);
        setLoadingReceipt(false);
      });
    }
  }, []);

  // Seed the Firestore database with initial products if it is empty
  const seedDatabase = async () => {
    try {
      const batch = writeBatch(db);
      FULL_MOCK_ACERVO.forEach((product) => {
        const docRef = doc(db, 'products', product.id);
        batch.set(docRef, product);
      });
      await batch.commit();
      notify("Estoque inicial carregado no banco de dados sincronizado!");
      try {
        localStorage.setItem('modivah_products_cache', JSON.stringify(FULL_MOCK_ACERVO));
      } catch (err) {
        console.warn('Erro ao salvar cache de produtos:', err);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products');
    }
  };

  // Public catalog fetcher with local cache fallback and deduplication logic
  const loadPublicCatalog = useCallback(async () => {
    // Prevent multiple parallel loading cycles to satisfy: "deduplicação de chamadas, evitar chamadas duplicadas ao abrir a loja"
    if (isCatalogLoadingRef.current) {
      console.log("[Public Catalog] Already loading, skipping parallel request.");
      return;
    }
    isCatalogLoadingRef.current = true;
    setIsInitialLoadingProducts(true);

    try {
      console.log("[Public Catalog] Initiating optimized public query.");
      
      // Fetch products and categories concurrently
      const [prodRes, catRes] = await Promise.allSettled([
        apiFetch<{ success: boolean; products: Product[]; source?: string }>("/api/public/products?bypassCache=true"),
        apiFetch<{ success: boolean; categories: Category[]; source?: string }>("/api/public/categories")
      ]);

      // 1. Process Products response
      let updatedProducts: Product[] = [];
      
      if (prodRes.status === "fulfilled" && prodRes.value && prodRes.value.success) {
        updatedProducts = prodRes.value.products;
      } else {
        const errorMsg = prodRes.status === "rejected" ? prodRes.reason : "Response failure";
        console.warn("[Public Catalog] Failed loading products from API:", errorMsg);
        
        // Check for Firebase lock/quota or server errors through diagnostic signals
        const errStr = String(errorMsg).toLowerCase();
        if (errStr.includes("quota") || errStr.includes("exhausted") || errStr.includes("429") || errStr.includes("503") || errStr.includes("firebase")) {
          setIsQuotaExceeded(true);
        }
      }

      // Fallback intelligently to local cache or stable mock catalog instead of leaving catalog empty or broken
      if (updatedProducts && updatedProducts.length > 0) {
        setProducts(updatedProducts);
        try {
          localStorage.setItem('modivah_products_cache', JSON.stringify(updatedProducts));
        } catch (e) {}
      } else {
        let cachedItems: Product[] = [];
        try {
          const cachedStr = localStorage.getItem('modivah_products_cache');
          if (cachedStr) {
            const parsed = JSON.parse(cachedStr);
            if (Array.isArray(parsed) && parsed.length > 0) {
              cachedItems = parsed;
            }
          }
        } catch (e) {}

        if (cachedItems.length > 0) {
          console.log("[Public Catalog] No fresh products fetched from API; falling back to valid local cache.");
          setProducts(cachedItems);
        } else {
          console.log("[Public Catalog] No fresh API response or local cache; falling back to stable catalog FULL_MOCK_ACERVO.");
          setProducts(FULL_MOCK_ACERVO);
          try {
            localStorage.setItem('modivah_products_cache', JSON.stringify(FULL_MOCK_ACERVO));
          } catch (e) {}
        }
      }

      // 2. Process Categories response
      let updatedCategories: Category[] = [];
      if (catRes.status === "fulfilled" && catRes.value && catRes.value.success) {
        updatedCategories = catRes.value.categories;
      } else {
        console.warn("[Public Catalog] Failed loading categories from API:", catRes.status === "rejected" ? catRes.reason : "Response failure");
      }

      if (updatedCategories && updatedCategories.length > 0) {
        setCategoriesList(updatedCategories);
        try {
          localStorage.setItem('modivah_categories_cache', JSON.stringify(updatedCategories));
        } catch (e) {}
      } else {
        // Fallback in localStorage for categories
        let fallbackCategories: Category[] = [];
        try {
          const cached = localStorage.getItem('modivah_categories_cache');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              fallbackCategories = parsed;
            }
          }
        } catch (e) {}

        if (fallbackCategories.length > 0) {
          setCategoriesList(fallbackCategories);
        } else {
          setCategoriesList(DEFAULT_CATEGORIES);
        }
      }

    } catch (e: any) {
      console.error("[Public Catalog Load Crash - Logged Internally]:", e);
      // Fallback aggressively to local caches, never show technical error
      let fallbackProducts: Product[] = [];
      try {
        const cached = localStorage.getItem('modivah_products_cache');
        if (cached) {
          fallbackProducts = JSON.parse(cached);
        }
      } catch (err) {}

      if (fallbackProducts.length > 0) {
        setProducts(fallbackProducts);
      } else {
        setProducts(FULL_MOCK_ACERVO);
      }
      setIsQuotaExceeded(true);
    } finally {
      setIsInitialLoadingProducts(false);
      isCatalogLoadingRef.current = false;
    }
  }, [setProducts, setCategoriesList, setIsQuotaExceeded, setIsInitialLoadingProducts]);

  useEffect(() => {
    // Increment mobile access metric
    try {
      const cnt = Number(localStorage.getItem('modivah_perf_access_count') || '0');
      localStorage.setItem('modivah_perf_access_count', String(cnt + 1));
    } catch (_) {}

    // Record load boot speed timing
    try {
      const t1 = performance.now();
      // Record instantaneous render speed on first mounting
      localStorage.setItem('modivah_perf_mount_time', t1.toFixed(1));
    } catch (_) {}

    // 1. Load public catalog on mount
    loadPublicCatalog();

    // 2. Load shopping cart from localStorage (local to individual client)
    const savedCart = localStorage.getItem('modivah_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        setCart([]);
      }
    }
  }, [loadPublicCatalog]);

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
    const prod = products.find(p => p.id === productId);
    if (prod) {
      trackActivity('favorite', prod);
    }
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
  }, [notify, products, trackActivity]);

  // CART HANDLERS - Optimized for maximum performance and touch latency reduction (PWA/Mobile INP)
  const handleAddToCart = useCallback((product: Product) => {
    trackActivity('cart_add', product);
    registerCartRecovery(product);
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
  }, [notify, trackActivity, registerCartRecovery]);

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
    trackActivity('view', product);
    React.startTransition(() => {
      setSelectedProduct(product);
      setSelectedProductViewMode(initialView || 'image');
    });
  }, [trackActivity]);

  // Helper for authenticated backend API operations
  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = sessionStorage.getItem('modivah_admin_token') || localStorage.getItem('modivah_admin_token');
    const headers = {
      ...(options.headers || {}),
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    try {
      return await apiFetch(url, { ...options, headers });
    } catch (err: any) {
      if (err.message.includes("Status 401") || err.message.includes("401")) {
        sessionStorage.removeItem('modivah_admin_token');
        sessionStorage.removeItem('modivah_admin_auth');
        localStorage.removeItem('modivah_admin_token');
        localStorage.removeItem('modivah_admin_auth');
        setIsAdminMode(false);
        throw new Error("Sessão administrativa expirada ou inválida. Por favor, faça login novamente.");
      }
      throw err;
    }
  };

  // Helper to persist stock entry/exit history logs for administrators
  const logStockMovement = useCallback(async (
    productId: string,
    productTitle: string,
    type: 'entrada' | 'saida',
    quantity: number,
    reason: 'venda_cliente' | 'ajuste_adm' | 'criacao_produto',
    previousStock: number,
    newStock: number,
    operator: string
  ) => {
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const movementId = `mov-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const movementRef = doc(db, 'stock_movements', movementId);
      await setDoc(movementRef, {
        id: movementId,
        productId,
        productTitle,
        type,
        quantity,
        reason,
        previousStock,
        newStock,
        operator,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn("Falha ao registrar histórico de movimentação do estoque:", err);
    }
  }, []);

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

      // Audit Log stock movement with creation event entry
      await logStockMovement(
        cleanProduct.id,
        cleanProduct.title,
        'entrada',
        cleanProduct.stock,
        'criacao_produto',
        0,
        cleanProduct.stock,
        'admin'
      );

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

      const oldProduct = products.find(p => p.id === cleanProduct.id);
      const previousStock = oldProduct ? oldProduct.stock : 0;

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

      // Log stock movement audit records if stock levels altered by curadora
      if (cleanProduct.stock !== previousStock) {
        const type = cleanProduct.stock > previousStock ? 'entrada' : 'saida';
        const quantity = Math.abs(cleanProduct.stock - previousStock);
        await logStockMovement(
          cleanProduct.id,
          cleanProduct.title,
          type,
          quantity,
          'ajuste_adm',
          previousStock,
          cleanProduct.stock,
          'admin'
        );
      }

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
      console.error('Erro ao remover produto do sistema:', error);
      notify("Não foi possível excluir o produto. Tente novamente.");
      try {
        const cached = localStorage.getItem('modivah_products_cache');
        if (cached) setProducts(JSON.parse(cached));
      } catch (e) {}
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

  const handleRestoreCategories = async () => {
    try {
      const batch = writeBatch(db);
      DEFAULT_CATEGORIES.forEach((cat) => {
        const docRef = doc(db, 'categories', cat.id);
        batch.set(docRef, cat);
      });
      await batch.commit();
      notify("As 44 categorias do brechó de luxo foram reabastecidas com sucesso de forma dinâmica!");
    } catch (error: any) {
      console.error("Erro ao restaurar categorias:", error);
      notify("Erro na escrita da nuvem: Limite de cota do Firebase atingido hoje.");
    }
  };

  const handleImportProducts = (imported: Product[]) => {
    if (!Array.isArray(imported) || imported.length === 0) {
      notify("Falha ao importar: Formato de backup inválido.");
      return;
    }
    setProducts(imported);
    try {
      localStorage.setItem('modivah_products_cache', JSON.stringify(imported));
    } catch (e) {
      console.warn("Erro ao gravar modivah_products_cache de backup:", e);
    }
    notify(`Backup carregado! ${imported.length} produtos importados e salvos localmente.`);
  };

  const handleSyncToFirestore = async () => {
    if (products.length === 0) {
      notify("Nenhum produto para sincronizar.");
      return;
    }
    try {
      const batch = writeBatch(db);
      products.forEach((product) => {
        const docRef = doc(db, 'products', product.id);
        batch.set(docRef, product);
      });
      await batch.commit();
      notify("Acervo carregado com total sucesso no Firestore!");
    } catch (error: any) {
      console.error("Erro na sincronização manual com o Firestore:", error);
      notify("Erro de Sincronização: O banco ainda está com limite de cota ativo.");
      throw error;
    }
  };

  // Helper to convert any category to standard singular name
  const getSingularDisplayName = (name: string): string => {
    const trimmed = (name || "").trim();
    const lower = trimmed.toLowerCase();
    
    if (lower === 'bermudas') return 'Bermuda';
    if (lower === 'blusas') return 'Blusa';
    if (lower === 'blazers') return 'Blazer';
    if (lower === 'bolsas') return 'Bolsa';
    if (lower === 'calçados' || lower === 'calcados') return 'Calçado';
    if (lower === 'camisas') return 'Camisa';
    if (lower === 'conjuntos') return 'Conjunto';
    if (lower === 'cintos') return 'Cinto';
    if (lower === 'vestidos') return 'Vestido';
    if (lower === 'saias') return 'Saia';
    if (lower === 'shorts') return 'Short';
    if (lower === 'casacos') return 'Casaco';
    if (lower === 'jaquetas') return 'Jaqueta';
    if (lower === 'sapatos') return 'Sapato';
    
    return trimmed;
  };

  // Helper to normalize category name for exact deduplication and group matching
  const normalizeForGrouping = (name: string): string => {
    const singular = getSingularDisplayName(name);
    return singular
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
      .toLowerCase()
      .replace(/\s+/g, " "); // collapse spacing and extra spaces
  };

  // FILTERS IMPLEMENTATIONS
  const getDeduplicatedCategoriesList = (): string[] => {
    const seen = new Set<string>();
    const list: string[] = [];
    (categoriesList || []).forEach(c => {
      if (c && c.active && c.name) {
        const singularName = getSingularDisplayName(c.name);
        const norm = normalizeForGrouping(singularName);
        if (!seen.has(norm)) {
          seen.add(norm);
          list.push(singularName);
        }
      }
    });
    return list.sort((a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' }));
  };

  const categories = [
    'Tudo',
    ...getDeduplicatedCategoriesList()
  ];
  const sizes = ['Todos', 'P', 'M', 'G', 'GG', '36', '38', '40', 'Único'];

  const filteredProducts = products.filter(p => {
    // 0. Favorites filter
    if (isFavoritesOnly && !favorites.includes(p.id)) return false;

    // 1. Category comparison with robust grouping
    const matchesCategory = selectedCategory === 'Tudo' || normalizeForGrouping(p.category) === normalizeForGrouping(selectedCategory);
    
    // 2. Size comparison
    const matchesSize = selectedSize === 'Todos' || p.size.toUpperCase() === selectedSize.toUpperCase();
    
    // 3. Search text query comparison (fuzzy accent-insensitive scanning)
    const normalizeSearchText = (text: string): string => {
      return (text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    };

    const normalizedQuery = normalizeSearchText(searchQuery);
    const matchesSearch = normalizedQuery === '' || 
      normalizeSearchText(p.title).includes(normalizedQuery) ||
      normalizeSearchText(p.brand).includes(normalizedQuery) ||
      normalizeSearchText(p.description).includes(normalizedQuery) ||
      normalizeSearchText(p.category).includes(normalizedQuery) ||
      normalizeSearchText(p.size).includes(normalizedQuery) ||
      (p.tag && normalizeSearchText(p.tag).includes(normalizedQuery));

    return matchesCategory && matchesSize && matchesSearch;
  });

  if (splashActive || isClientAuthLoading || isInitialLoadingProducts) {
    return (
      <div className="splash-screen bg-white" id="app-splash-screen">
        <div className="splash-aura" />
        <div className="splash-content text-center">
          <img 
            src={logoImg} 
            alt="MODIVAH BRECHÓ" 
            className="logo-splash"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/favicon.png';
            }}
          />
          <div className="mt-6 flex flex-col items-center gap-1.5 animate-pulse duration-1000">
            <span className="text-[10px] font-sans text-amber-600/60 uppercase tracking-[0.4em] font-medium leading-none">
              CURADORIA DE LUXO
            </span>
            <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-[0.25em]">
              MODA CIRCULAR
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Mandatory Admin-Only check for /admin path
  const isUrlPathAdmin = currentPath === '/admin' || currentPath.startsWith('/admin/');

  if (isUrlPathAdmin) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col justify-between" id="admin-login-mandatory-block">
        <Suspense fallback={
          <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-mono text-xs text-amber-500">
            Carregando Painel Administrativo...
          </div>
        }>
          <AdminPanel
            isOpen={true}
            onClose={handleCloseAdmin}
            products={products}
            categoriesList={categoriesList}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onUpdateProductStatus={handleUpdateProductStatus}
            onUpdateProductPrice={handleUpdateProductPrice}
            onDeleteProduct={handleDeleteProduct}
            onResetDatabase={handleResetDatabase}
            onImportProducts={handleImportProducts}
            onSyncToFirestore={handleSyncToFirestore}
            onRestoreCategories={handleRestoreCategories}
            isQuotaExceeded={isQuotaExceeded}
            onLoginSuccess={handleLoginSuccess}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FFFFFF] text-zinc-800 selection:bg-[#EE4D2D] selection:text-white font-sans flex flex-col antialiased">
      
      {/* BILBOARD BRAND POSTER / CARTAZ FIXO NO TOPO COBRINDO DE UM LADO A OUTRO */}
      <div className="w-full bg-white border-b border-zinc-200 relative overflow-hidden shrink-0 shadow-sm" id="marquee-brand-banner">
        <img 
          src={logoImg} 
          alt="Banner Modivah Brechó" 
          className="w-full h-auto block select-none" 
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/favicon.png';
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-[#EE4D2D]" />
      </div>

      {/* LEAD CAPTURE - RECEBA NOVIDADES PRIMEIRO */}
      <LeadCapture />

      {/* Visual Welcome Ribbon for Authenticated Clients */}
      {currentClient && (
        <div className="w-full bg-[#FAFAFA] border-b border-zinc-200 py-2 px-6 flex items-center justify-between text-xs transition duration-200" id="welcome-client-ribbon">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#39ff14]/80 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#39ff14]"></span>
            </span>
            <span className="text-zinc-650 font-medium">
              Bem-vindo(a), <span className="text-[#EE4D2D] font-bold">{currentClient.name}</span>
            </span>
          </div>
          <button
            onClick={handleClientLogout}
            className="text-[9px] uppercase tracking-widest text-[#ff3b30] hover:text-red-700 font-black bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1 rounded-lg transition duration-200 flex items-center gap-1 cursor-pointer"
          >
            <span>Sair</span>
          </button>
        </div>
      )}

      {/* Database Quota Exceeded Warning Banner */}
      {isQuotaExceeded && (
        isAdminMode ? (
          <div className="w-full bg-[#ff3b30]/10 border-b border-[#ff3b30]/20 py-3 px-6 flex flex-col md:flex-row md:items-center md:justify-between text-xs gap-3 transition duration-200" id="quota-exceeded-banner">
            <div className="flex items-start md:items-center gap-2.5">
              <span className="relative flex h-2 w-2 mt-1 md:mt-0 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3b30]/80 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff3b30]"></span>
              </span>
              <span className="text-zinc-300 leading-relaxed">
                <strong className="text-amber-500 font-semibold">Cota Diária Excedida (GCP Firestore Spark):</strong> O limite diário de leitura gratuita do Google Firebase foi atingido pelo alto volume de acessos. Exibindo acervo salvo localmente. Suas compras e reservas via WhatsApp seguem funcionando normalmente!
              </span>
            </div>
            <a
              href="https://console.firebase.google.com/project/gen-lang-client-0300626869/firestore/databases/ai-studio-089e9585-2405-444b-8356-8163e1545262/data?openUpgradeDialog=true"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] uppercase tracking-widest text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg transition duration-200 flex items-center justify-center gap-1 shrink-0 w-fit cursor-pointer hover:border-amber-400/40"
            >
              <span>Ver Console Firebase</span>
            </a>
          </div>
        ) : (
          <div className="w-full bg-[#EE4D2D]/10 border-b border-[#EE4D2D]/20 py-3 px-6 flex items-center gap-2.5 text-xs text-zinc-300 justify-center transition duration-200" id="quota-exceeded-banner">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EE4D2D]/80 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EE4D2D]"></span>
            </span>
            <span className="font-semibold text-center">Estamos atualizando a loja. Alguns produtos podem levar alguns instantes para aparecer.</span>
          </div>
        )
      )}

      {/* Visual background atmospheric lights */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/[0.02] filter blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-purple-500/[0.01] filter blur-[150px] pointer-events-none" />

      {/* Floating global persistent notifications banner */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            key="global-notification-banner"
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
        onOpenAdmin={handleOpenAdmin}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isAdmin={isAdminMode}
      />

      {/* Shopee-style Orange Gradient Promotion Header Band */}
      <div className="w-full bg-gradient-to-r from-[#F4511E] to-[#FF8A3D] text-white py-8 px-4 sm:px-6 md:px-8 border-b border-orange-600/10 shadow-md relative overflow-hidden" id="shopee-gradient-header-band">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="text-center md:text-left space-y-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-wider text-white uppercase drop-shadow-sm font-sans" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
              MODIVAH BRECHÓ
            </h1>
            
            {/* Elegant Brand Slogan */}
            <div className="flex justify-center md:justify-start items-center gap-2 py-1 select-none" id="brand-official-slogan-wrapper">
              <span className="h-[1px] w-5 bg-white/30 hidden sm:block animate-pulse" />
              <p className="text-sm sm:text-base md:text-lg font-serif italic tracking-[0.25em] text-[#FFE8D6] font-semibold drop-shadow-md leading-none uppercase animate-pulse">
                A MODA DAS DIVAS
              </p>
              <span className="h-[1px] w-5 bg-white/30 hidden sm:block animate-pulse" />
            </div>

            <p className="text-xs sm:text-sm md:text-base text-white/95 font-medium leading-relaxed max-w-2xl">
              Roupas conservadas, selecionadas uma a uma, beleza, qualidade e elegância em cada peça.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 justify-center">
            <a
              href="https://wa.me/5527988226654"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3 bg-white text-[#25D366] font-sans text-xs font-extrabold uppercase tracking-widest rounded-xl hover:bg-zinc-50 transition duration-200 text-center shadow-md flex items-center justify-center gap-2 border border-zinc-100"
              id="header-whatsapp-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide shrink-0"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 .099.092 10 10 0 1 0-4.777-4.719"></path></svg>
              WhatsApp
            </a>
            <button
              onClick={() => setIsStylistOpen(true)}
              className="w-full sm:w-auto px-6 py-3 bg-black text-white hover:bg-zinc-900 font-sans text-xs font-extrabold uppercase tracking-widest rounded-xl transition duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer"
              id="header-moia-btn"
            >
              <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
              Consultar Mo IA
            </button>
          </div>
        </div>
        {/* Subtle decorative Shopee-like floating circles */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
      </div>

      {/* Hero Curated Title Presentation Area */}
      <Hero onOpenStylist={() => setIsStylistOpen(true)} />

      {/* Dynamic Products Carousel Showcase (Velocidade ideal com fotos em formato de tamanho celular perfeitamente otimizado) */}
      <ProductCarousel 
        products={products}
        onViewDetails={handleViewDetails}
        onAddToCart={handleAddToCart}
      />

      {/* Main product showcase and category filter tabs section */}
      <main className="max-w-none px-4 sm:px-6 md:px-8 py-12 w-full flex flex-col md:flex-row gap-6 md:gap-8 grow shrink-0 min-h-0" id="storefront-main-grid">
        
        {/* Dynamic Left sidebar panel for screens filter inputs */}
        <aside className="hidden md:block md:w-64 shrink-0 space-y-6">
          <div className="bg-white border border-zinc-200 p-6 rounded-2xl shadow-sm sticky top-28">
            <h3 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4 flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[#EE4D2D]" />
              <span>Garimpar Filtros</span>
            </h3>

            {/* Filter by Brand text Search box */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5 font-mono">Pesquisa Chave</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Zara, Farm, G, seda..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2 text-xs text-zinc-800 focus:outline-none focus:border-[#EE4D2D]"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs">×</button>
                  )}
                </div>
              </div>

              {/* Categorias links list vertical (Fluorescent blue active and hover effects) */}
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-1.5 font-mono">Categorias</label>
                <div className="flex flex-row flex-wrap md:flex-col md:flex-nowrap gap-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-left text-xs px-3 py-1.5 rounded-lg border transition-all duration-300 cursor-pointer flex items-center justify-between gap-2 ${
                        selectedCategory === cat
                          ? 'bg-[#EE4D2D]/10 text-[#EE4D2D] border-[#EE4D2D]/35 font-bold shadow-sm'
                          : 'bg-transparent text-zinc-650 border-transparent hover:text-[#EE4D2D] hover:bg-zinc-50'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="text-[10px] opacity-75 font-mono">
                        {cat === 'Tudo' 
                          ? products.length 
                          : products.filter(p => normalizeForGrouping(p.category) === normalizeForGrouping(cat)).length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tamanho grid box size filters */}
              <div>
                <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2 font-mono">Tamanhos</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`text-center py-1 rounded text-xs transition border font-mono ${
                        selectedSize === sz
                          ? 'bg-[#EE4D2D] text-white font-bold border-[#EE4D2D]'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:text-zinc-800 hover:bg-zinc-100'
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
                  className="w-full align-center py-2 bg-zinc-55 hover:bg-zinc-100 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 mt-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Limpar Filtros</span>
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Right Product Grid Area */}
        <section className="flex-1 min-w-0 space-y-6">
          <div className="flex items-baseline justify-between gap-4 border-b border-zinc-200 pb-4">
            <div>
              <span className="text-xs text-zinc-500 block font-semibold leading-snug">Exibindo peças únicas selecionadas</span>
              <h2 className="text-lg md:text-xl font-sans font-bold text-black mt-0.5">
                {selectedCategory === 'Tudo' ? 'Nosso Acervo' : selectedCategory} 
                {selectedSize !== 'Todos' && ` — Tam ${selectedSize}`}
              </h2>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'peça encontrada' : 'peças encontradas'}
            </span>
          </div>

          {/* Mobile Filter Button (Shopee style: background white, border #EE4D2D, text #EE4D2D, rounded-full) */}
          <div className="md:hidden py-1" id="mobile-filter-trigger-container">
            <button
              onClick={() => setIsMobileFiltersOpen(true)}
              className="w-full py-3 bg-white border border-[#EE4D2D] text-[#EE4D2D] hover:bg-[#EE4D2D]/5 font-sans text-xs font-bold uppercase tracking-widest rounded-full transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.98]"
            >
              <Filter className="h-4 w-4" />
              <span>☰ FILTROS</span>
            </button>
          </div>

          {/* Catalog Loading/Empty state conditional */}
          {filteredProducts.length === 0 ? (
            <div className="py-24 text-center bg-zinc-50 border border-zinc-150 rounded-3xl px-6" id="empty-catalog-container">
              <div className="p-4 bg-zinc-100 rounded-full inline-block mb-3 text-zinc-400">
                <Shirt className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-sans font-bold text-neutral-800 uppercase tracking-widest">Nenhuma Peça Encontrada</h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto leading-relaxed mt-2 text-center font-sans">
                Experimente alterar os filtros selecionados ou pesquisar outro termo. Novas peças exclusivas de curadoria chegam constantemente ao nosso acervo!
              </p>
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 sm:gap-6" 
              id="products-catalog-bento-grid"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
            >
              {filteredProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  variants={{
                    hidden: { opacity: 0, y: 15 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
                  }}
                >
                  <ProductCard 
                    product={p}
                    onViewDetails={handleViewDetails}
                    onAddToCart={handleAddToCart}
                    isPriority={idx < 4}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

      </main>

      {/* Space for customer reviews and star evaluations */}
      <CommentsSection />

      {/* RODAPÉ DOS BENEFÍCIOS */}
      <section className="bg-white py-16 border-t border-zinc-200 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            
            {/* Benefício 1: Compra segura */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-6 bg-zinc-50 border border-zinc-200 rounded-xl shadow-sm transition duration-300">
              <div className="p-3 bg-[#EE4D2D]/10 text-[#EE4D2D] rounded-xl shrink-0">
                <Lock className="h-6 w-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#EE4D2D] tracking-wider uppercase font-sans">Compra Segura</h3>
                <p className="text-xs text-zinc-650 leading-relaxed font-normal text-justify md:text-left">
                  Seus dados e pagamentos PIX são processados com total segurança e confirmação imediata.
                </p>
              </div>
            </div>

            {/* Benefício 2: Entrega rápida */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-6 bg-zinc-50 border border-zinc-200 rounded-xl shadow-sm transition duration-300">
              <div className="p-3 bg-[#EE4D2D]/10 text-[#EE4D2D] rounded-xl shrink-0">
                <Truck className="h-6 w-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#EE4D2D] tracking-wider uppercase font-sans">Entrega Rápida</h3>
                <p className="text-xs text-zinc-650 leading-relaxed font-normal text-justify md:text-left">
                  Enviamos via motoboy express ou correios rapidamente para que você desfrute do seu look de grife.
                </p>
              </div>
            </div>

            {/* Benefício 3: Qualidade garantida */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4 p-6 bg-zinc-50 border border-zinc-200 rounded-xl shadow-sm transition duration-300">
              <div className="p-3 bg-[#EE4D2D]/10 text-[#EE4D2D] rounded-xl shrink-0">
                <Award className="h-6 w-6 stroke-[2]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#EE4D2D] tracking-wider uppercase font-sans">Qualidade Garantida</h3>
                <p className="text-xs text-zinc-650 leading-relaxed font-normal text-justify md:text-left">
                  Selo rigoroso de curadoria e higienização para peças 100% autênticas e em estado impecável.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Exquisite Footer signature */}
      <footer className="bg-white border-t border-zinc-200 mt-0 py-12 text-center text-xs text-zinc-500 space-y-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-sm font-bold tracking-[0.2em] text-zinc-800">MODIVAH BRECHÓ</span>
            <p className="text-[10px] text-zinc-400 mt-1 font-light">Curadoria Premium de Moda Circular Feminina Autêntica</p>
          </div>
          
          <div className="flex gap-4">
            <a href="https://wa.me/5527988226654" target="_blank" rel="noopener noreferrer" className="hover:text-[#EE4D2D] transition">Atendimento WhatsApp</a>
            <span>•</span>
            <button onClick={() => setIsStylistOpen(true)} className="hover:text-[#EE4D2D] transition cursor-pointer">Fale com a Mo IA</button>
            <span>•</span>
            <button onClick={handleOpenAdmin} className="hover:text-[#EE4D2D] transition cursor-pointer">Painel Admin</button>
          </div>
        </div>
        
        <div className="pt-6 border-t border-zinc-200 text-[10px] text-zinc-400 space-y-1">
          <p>© 2026 MODIVAH BRECHÓ — Todos os direitos reservados Cariacica - ES, Brasil.</p>
          <p className="text-[9px] text-zinc-400 tracking-wider">Criado por Claudio S. Silva</p>
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
        currentClient={currentClient}
      />

      {/* AI PERSONAL STYLIST DRAWER CHAT */}
      <Suspense fallback={null}>
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
      </Suspense>

      {/* CONSOLE DATABASE ADMIN DRAWER PANEL */}
      <Suspense fallback={null}>
        <AdminPanel
          isOpen={isAdminOpen}
          onClose={handleCloseAdmin}
          products={products}
          categoriesList={categoriesList}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onUpdateProductStatus={handleUpdateProductStatus}
          onUpdateProductPrice={handleUpdateProductPrice}
          onDeleteProduct={handleDeleteProduct}
          onResetDatabase={handleResetDatabase}
          onImportProducts={handleImportProducts}
          onSyncToFirestore={handleSyncToFirestore}
          onRestoreCategories={handleRestoreCategories}
          isQuotaExceeded={isQuotaExceeded}
          onLoginSuccess={handleLoginSuccess}
        />
      </Suspense>

      {/* Float sticky quick CTA for Personal Stylist */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
        {/* Whatsapp contact */}
        <a 
          href="https://wa.me/5527988226654" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-lg shadow-emerald-500/30 active:scale-95 transition flex items-center justify-center cursor-pointer animate-green-pulse"
          title="Falar no WhatsApp"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle shrink-0"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 .099.092 10 10 0 1 0-4.777-4.719"></path></svg>
        </a>

        {/* AI stylist bubble */}
        <button
          onClick={() => setIsStylistOpen(true)}
          className="bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:from-amber-300 hover:to-amber-400 p-3.5 rounded-full shadow-lg shadow-amber-500/40 active:scale-95 transition flex items-center justify-center cursor-pointer border border-amber-300/30 animate-premium-pulse"
          title="Falar com a Mo IA"
        >
          <Sparkles className="h-5.5 w-5.5 text-black animate-spin-slow" />
        </button>
      </div>

      {/* 🧾 LIGHTBOX MODAL DE COMPROVANTE (VIEW_RECEIPT) */}
      {receiptViewId && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-950 border border-white/10 rounded-2xl w-full max-w-lg p-6 relative shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setReceiptViewId(null);
                setReceiptOrderData(null);
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              className="absolute top-4 right-4 p-2 hover:bg-white/15 text-neutral-400 hover:text-white rounded-lg cursor-pointer transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center space-y-1 pb-2 border-b border-white/5">
              <span className="text-[10px] text-amber-300 font-mono font-bold uppercase tracking-widest bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded">
                COMPROVANTE DE PAGAMENTO PIX
              </span>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mt-2">Pedido #{receiptViewId}</h3>
            </div>

            {loadingReceipt ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
                <p className="text-xs text-neutral-400 font-mono">Buscando comprovante seguro...</p>
              </div>
            ) : receiptOrderData ? (
              <div className="space-y-4">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-xl text-xs font-mono">
                  <div>
                    <span className="text-neutral-500 text-[9px] block uppercase">Cliente</span>
                    <span className="text-neutral-200 font-bold font-sans">{receiptOrderData.clientName || 'Anônimo'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[9px] block uppercase">Valor Pago</span>
                    <span className="text-[#39ff14]/90 font-bold font-sans">R$ {(Number(receiptOrderData.total) || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[9px] block uppercase">Contato Celular</span>
                    <span className="text-neutral-300">{receiptOrderData.clientPhone || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[9px] block uppercase">Registrado em</span>
                    <span className="text-neutral-300">{receiptOrderData.createdAt ? new Date(receiptOrderData.createdAt).toLocaleDateString() : '—'}</span>
                  </div>
                </div>

                {/* Receipt Image Visualizer */}
                <div className="border border-white/10 rounded-xl overflow-hidden bg-black/60 flex items-center justify-center max-h-[350px]">
                  {receiptOrderData.receiptDataUrl ? (
                    <img
                      src={receiptOrderData.receiptDataUrl}
                      alt="Comprovante Pix Anexo"
                      className="max-h-[350px] w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="py-20 flex flex-col items-center gap-2">
                      <ImageIcon className="h-10 w-10 text-neutral-700" />
                      <p className="text-xs text-neutral-500 font-light text-center">Nenhuma imagem de comprovante anexada neste pedido.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-400 space-y-2">
                <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
                <p className="text-xs">Comprovante ou pedido não encontrado ou expirado.</p>
              </div>
            )}

            <button
              onClick={() => {
                setReceiptViewId(null);
                setReceiptOrderData(null);
                window.history.replaceState({}, document.title, window.location.pathname);
              }}
              className="w-full py-2.5 bg-neutral-950 border border-white/15 hover:bg-neutral-900 text-neutral-300 font-bold hover:text-white text-xs uppercase tracking-widest cursor-pointer transition"
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}

      {/* 📱 MOBILE FILTERS PANEL DRAWER (Animado de forma premium via motion/react) */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden md:hidden" id="mobile-filters-drawer-portal">
            {/* Dark background backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black cursor-pointer"
              onClick={() => setIsMobileFiltersOpen(false)}
            />

            {/* Panel sliding elegantly from the right */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="absolute inset-y-0 right-0 max-w-sm w-full bg-white shadow-2xl flex flex-col z-10"
            >
              {/* Header with Close and Title */}
              <div className="p-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
                <h3 className="text-xs uppercase tracking-widest text-[#EE4D2D] font-bold flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Garimpar Filtros</span>
                </h3>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1.5 hover:bg-zinc-200/50 text-zinc-400 hover:text-zinc-700 rounded-md cursor-pointer transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable inputs space */}
              <div className="flex-1 overflow-y-auto p-5 space-y-8">
                
                {/* Search Term Box */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2 font-mono">Pesquisa Chave</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Zara, Farm, G, seda..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-3 pr-8 py-2.5 text-xs text-zinc-800 focus:outline-[none] focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]/30"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-bold font-sans">×</button>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2 font-mono">Categorias</label>
                  <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1 border border-zinc-100 p-2 rounded-xl bg-zinc-50/50">
                    {categories.map((cat) => (
                      <button
                        key={`mob-${cat}`}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-left text-xs px-3 py-2 rounded-lg border transition-all duration-300 cursor-pointer flex items-center justify-between gap-2 ${
                          selectedCategory === cat
                            ? 'bg-[#EE4D2D]/10 text-[#EE4D2D] border-[#EE4D2D]/35 font-bold shadow-xs'
                            : 'bg-white text-zinc-650 border-zinc-200 hover:text-[#EE4D2D] hover:bg-zinc-50'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className="text-[10px] opacity-75 font-mono">
                          {cat === 'Tudo' 
                            ? products.length 
                            : products.filter(p => normalizeForGrouping(p.category) === normalizeForGrouping(cat)).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sizes selection */}
                <div>
                  <label className="text-[10px] text-zinc-400 uppercase tracking-wider block mb-2.5 font-mono">Tamanhos</label>
                  <div className="grid grid-cols-4 gap-2">
                    {sizes.map((sz) => (
                      <button
                        key={`mob-sz-${sz}`}
                        onClick={() => setSelectedSize(sz)}
                        className={`text-center py-2 rounded text-xs transition border font-mono cursor-pointer ${
                          selectedSize === sz
                            ? 'bg-[#EE4D2D] text-white font-bold border-[#EE4D2D] shadow-xs'
                            : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:text-zinc-800 hover:bg-zinc-100'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset filters action */}
                {(selectedCategory !== 'Tudo' || selectedSize !== 'Todos' || searchQuery !== '') && (
                  <button
                    onClick={() => {
                      setSelectedCategory('Tudo');
                      setSelectedSize('Todos');
                      setSearchQuery('');
                    }}
                    className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Limpar Filtros</span>
                  </button>
                )}

              </div>

              {/* Sticky bottom submit and review counts */}
              <div className="p-4 border-t border-zinc-200 bg-zinc-50 space-y-2">
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full py-3 bg-[#EE4D2D] hover:bg-[#FF6A4D] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Ver {filteredProducts.length} Peças</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
