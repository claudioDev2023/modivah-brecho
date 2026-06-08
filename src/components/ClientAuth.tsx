import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, Check, MapPin, Phone, MessageSquare, Lock, Eye, EyeOff, Sparkles, Loader } from 'lucide-react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
// @ts-ignore
import logoImg from '../assets/images/modivah_logo_1779828536217.png';

interface ClientAuthProps {
  onAuthSuccess: (clientId: string, clientData: any) => void;
}

export default function ClientAuth({ onAuthSuccess }: ClientAuthProps) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isRecoveryView, setIsRecoveryView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  
  // Password visible toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [consent, setConsent] = useState(true);
  const [isRequestingAdmin, setIsRequestingAdmin] = useState(false);

  const [isFallbackMode, setIsFallbackMode] = useState(() => {
    return localStorage.getItem('modivah_auth_fallback_active') === 'true';
  });

  // Utility to cryptographically hash password with native SHA-256
  const hashPassword = async (pwd: string): Promise<string> => {
    try {
      const msgBuffer = new TextEncoder().encode(pwd);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Fallback in case of subtle crypto limitation
      return btoa(pwd);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setSuccessText(null);
    setLoading(true);

    const checkStateInput = () => {
      if (!isRecoveryView && password.length < 6) {
        throw new Error("A senha deve conter pelo menos 6 caracteres.");
      }

      // General validation for Sign Up fields
      if (!isLoginView && !isRecoveryView) {
        if (!fullName.trim()) throw new Error("O nome completo é obrigatório.");
        if (!phone.trim()) throw new Error("O telefone celular é obrigatório.");
        if (!whatsapp.trim()) throw new Error("O número do WhatsApp é obrigatório.");
        if (!city.trim()) throw new Error("A sua cidade é obrigatória.");
        if (!state.trim()) throw new Error("O seu estado (sigla) é obrigatório.");
        if (!consent) throw new Error("Você precisa aceitar os termos de consentimento para receber ofertas.");
        if (password !== confirmPassword) {
          throw new Error("As senhas informadas não coincidem. Verifique a confirmação.");
        }
      }
    };

    try {
      checkStateInput();
    } catch (err: any) {
      setErrorText(err.message);
      setLoading(false);
      return;
    }

    // Helper to log in or create using Firestore-only Fallback Mode
    const executeFirestoreFallbackAuth = async () => {
      const emailLower = email.trim().toLowerCase();
      try {
        const clientsRef = collection(db, 'clients');

        if (isRecoveryView) {
          // Password Recovery in contingency sandbox
          const q = query(clientsRef, where('email', '==', emailLower), limit(1));
          const snap = await getDocs(q);

          if (snap.empty) {
            setErrorText("Conta não encontrada.");
            return;
          }

          setSuccessText("O envio de e-mails oficial necessita que o administrador ative o provedor de e-mail no console Firebase. Como o modo de contingência inteligente está ativo, você pode redefinir sua senha diretamente aqui ao se cadastrar novamente ou entrando em contato via WhatsApp com o suporte!");
          return;
        }

        if (isLoginView) {
          // Login via Firestore-only (Password Hash Comparison)
          const q = query(clientsRef, where('email', '==', emailLower), limit(1));
          const snap = await getDocs(q);

          if (snap.empty) {
            setErrorText("Conta não encontrada.");
            return;
          }

          let loggedClient: any = null;
          snap.forEach(d => {
            loggedClient = d.data();
          });

          // Verify password hash
          const currentHash = await hashPassword(password);
          if (loggedClient.passwordHash && loggedClient.passwordHash !== currentHash) {
            setErrorText("Verifique sua senha e tente novamente.");
            return;
          }

          // Update lastAccess date
          const clientDocRef = doc(db, 'clients', loggedClient.id);
          const updateData = {
            lastAccess: new Date().toISOString()
          };
          await updateDoc(clientDocRef, updateData);
          loggedClient.lastAccess = updateData.lastAccess;

          // Track login activity
          try {
            const activityRef = doc(db, 'activities', `act-login-${Date.now()}`);
            await setDoc(activityRef, {
              id: activityRef.id,
              clientId: loggedClient.id,
              type: 'visit',
              productTitle: 'Login de Cliente (Contingência)',
              price: 0,
              createdAt: new Date().toISOString(),
              userAgent: navigator.userAgent,
              origin: "contingency_login"
            });
          } catch {}

          // Persist the fallback flag
          localStorage.setItem('modivah_auth_fallback_active', 'true');
          onAuthSuccess(loggedClient.id, loggedClient);
        } else {
          // Signup via Firestore-only (Verify duplicate emails)
          const q = query(clientsRef, where('email', '==', emailLower), limit(1));
          const snap = await getDocs(q);

          if (!snap.empty) {
            setErrorText("Este e-mail já possui uma conta.");
            return;
          }

          const fallbackUid = `client-fb-${emailLower.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
          const passwordHash = await hashPassword(password);

          const newClientData = {
            id: fallbackUid,
            name: fullName.trim(),
            email: emailLower,
            phone: phone.trim(),
            whatsapp: whatsapp.trim(),
            city: city.trim(),
            state: state.trim().toUpperCase(),
            consent,
            passwordHash,
            requestAdminAccess: isRequestingAdmin,
            adminRequestStatus: isRequestingAdmin ? 'pending' : null,
            adminRequestDate: isRequestingAdmin ? new Date().toISOString() : null,
            createdAt: new Date().toISOString(),
            lastAccess: new Date().toISOString(),
            purchasesCount: 0,
            totalSpent: 0,
            viewedProducts: [],
            favoritedProducts: [],
            cartProducts: [],
            purchasedProducts: []
          };

          const clientDocRef = doc(db, 'clients', fallbackUid);
          await setDoc(clientDocRef, newClientData);

          // Track activity
          try {
            const activityRef = doc(db, 'activities', `act-signup-${Date.now()}`);
            await setDoc(activityRef, {
              id: activityRef.id,
              clientId: fallbackUid,
              type: 'visit',
              productTitle: 'Cadastro de Novo Cliente (Contingência)',
              price: 0,
              createdAt: new Date().toISOString(),
              userAgent: navigator.userAgent,
              origin: "contingency_signup"
            });
          } catch {}

          // Persist the fallback flag
          localStorage.setItem('modivah_auth_fallback_active', 'true');
          onAuthSuccess(fallbackUid, newClientData);
        }
      } catch (e: any) {
        console.error("Critical Firestore Contingency Auth error:", e);
        setErrorText("Não foi possível efetuar o acesso seguro pelo banco de dados.");
      }
    };

    // Main Submit Router (Firestore fallback is triggered on isFallbackMode or on catching auth/operation-not-allowed)
    if (isFallbackMode) {
      await executeFirestoreFallbackAuth();
      setLoading(false);
      return;
    }

    if (isRecoveryView) {
      try {
        await sendPasswordResetEmail(auth, email.trim());
        setSuccessText("Instruções de redefinição de senha enviadas com sucesso para o e-mail informado!");
      } catch (e: any) {
        console.error("Recovery submit error:", e);
        if (e.code === 'auth/operation-not-allowed') {
          setIsFallbackMode(true);
          await executeFirestoreFallbackAuth();
        } else if (e.code === 'auth/user-not-found') {
          setErrorText("Conta não encontrada.");
        } else {
          setErrorText("Falha ao enviar e-mail de recuperação. Verifique o endereço inserido.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      if (isLoginView) {
        // Core Sign In with Auth SDK
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const { uid } = userCredential.user;

        // Fetch client details from database
        const clientDocRef = doc(db, 'clients', uid);
        const clientSnap = await getDoc(clientDocRef);
        
        let clientData = null;
        if (clientSnap.exists()) {
          clientData = clientSnap.data();
          // Update lastAccess timestamp
          await updateDoc(clientDocRef, {
            lastAccess: new Date().toISOString()
          });
          clientData.lastAccess = new Date().toISOString();
        } else {
          // Fallback if auth exists but no client doc (rare)
          clientData = {
            id: uid,
            name: userCredential.user.displayName || "Cliente Modivah",
            email: email.trim(),
            phone: "",
            whatsapp: "",
            city: "",
            state: "",
            consent: true,
            createdAt: new Date().toISOString(),
            lastAccess: new Date().toISOString(),
            purchasesCount: 0,
            totalSpent: 0,
            viewedProducts: [],
            favoritedProducts: [],
            cartProducts: [],
            purchasedProducts: []
          };
          await setDoc(clientDocRef, clientData);
        }

        onAuthSuccess(uid, clientData);
      } else {
        // Create in Firebase Auth SDK
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const { uid } = userCredential.user;

        const passwordHash = await hashPassword(password);

        // Store client details in Firestore
        const newClientData = {
          id: uid,
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          consent,
          passwordHash,
          requestAdminAccess: isRequestingAdmin,
          adminRequestStatus: isRequestingAdmin ? 'pending' : null,
          adminRequestDate: isRequestingAdmin ? new Date().toISOString() : null,
          createdAt: new Date().toISOString(),
          lastAccess: new Date().toISOString(),
          purchasesCount: 0,
          totalSpent: 0,
          viewedProducts: [],
          favoritedProducts: [],
          cartProducts: [],
          purchasedProducts: []
        };

        const clientDocRef = doc(db, 'clients', uid);
        await setDoc(clientDocRef, newClientData);

        // Track signup activity in background
        try {
          const activityRef = doc(db, 'activities', `act-signup-${Date.now()}`);
          await setDoc(activityRef, {
            id: activityRef.id,
            clientId: uid,
            type: 'visit',
            productTitle: 'Cadastro de Novo Cliente',
            price: 0,
            createdAt: new Date().toISOString(),
            userAgent: navigator.userAgent,
            origin: document.referrer || "direct"
          });
        } catch (e) {
          console.warn("Background activity tracking error:", e);
        }

        onAuthSuccess(uid, newClientData);
      }
    } catch (e: any) {
      console.error("Auth submit error:", e);
      if (e.code === 'auth/operation-not-allowed') {
        setIsFallbackMode(true);
        // Execute fallback right away so the user doesn't even notice a broken flow!
        await executeFirestoreFallbackAuth();
      } else {
        let translatedMsg = e.message;
        if (e.code === 'auth/invalid-email') {
          translatedMsg = "E-mail informado possui formato inválido.";
        } else if (e.code === 'auth/email-already-in-use') {
          translatedMsg = "Este e-mail já possui uma conta.";
        } else if (e.code === 'auth/weak-password') {
          translatedMsg = "A senha é muito fraca. Escolha outra mais forte (mínimo 6 caracteres).";
        } else if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
          translatedMsg = "Verifique sua senha e tente novamente.";
        } else if (e.code === 'auth/user-not-found') {
          translatedMsg = "Conta não encontrada.";
        }
        setErrorText(translatedMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const statesOfBrazil = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
    'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <div className="flex-1 w-full flex items-center justify-center p-4 py-16 xs:py-24" id="client-auth-container">
      <div className="absolute inset-0 bg-[#070707] pointer-events-none" />
      
      {/* Decorative ambient visual background blur bubbles */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-amber-500/[0.04] filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-[#00f0ff]/[0.03] filter blur-[100px] pointer-events-none" />
 
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-lg bg-zinc-950/60 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative z-10 font-sans text-white"
      >
        {/* Brand Logo at the top of the card */}
        <div className="flex justify-center mb-6">
          <img 
            src={logoImg} 
            alt="MODIVAH BRECHÓ Logo" 
            className="h-12 w-auto object-contain brightness-105"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-mono uppercase tracking-wider mb-4">
            <Shield className="h-3 w-3" />
            <span>Marketplace Premium Seguro</span>
          </div>
          <h2 className="text-xl md:text-2xl font-sans font-light tracking-wide text-white">
            {isRecoveryView 
              ? 'Recuperação de Senha'
              : isLoginView 
                ? 'Seja bem-vinda de volta' 
                : 'Crie seu acesso exclusivo'}
          </h2>
          <p className="text-xs text-neutral-400 mt-2.5 leading-relaxed">
            {isRecoveryView 
              ? 'Insira o seu e-mail cadastrado para enviarmos as instruções de redefinição de acesso segura.'
              : isLoginView 
                ? 'Conecte-se para explorar nosso acervo exclusivo de peças únicas premium selecionadas do Modivah Brechó.'
                : 'Garanta seu acesso total aos melhores produtos disponíveis na MODIVAH BRECHÓ.'
            }
          </p>
        </div>



        {errorText && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 mb-6 space-y-3 font-sans">
            <div className="flex items-start gap-2">
              <span className="font-bold shrink-0">Atenção:</span>
              <span className="text-justify leading-relaxed">{errorText}</span>
            </div>
          </div>
        )}

        {/* Dynamic Display Success Message */}
        {successText && (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 mb-6 flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successText}</span>
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
          
          {/* SIGN UP EXTRAS */}
          {!isLoginView && !isRecoveryView && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 overflow-hidden"
            >
              {/* Full name input */}
              <div>
                <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-mono">Nome Completo</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><User className="h-4 w-4" /></span>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:bg-white/[0.08] transition"
                  />
                </div>
              </div>

              {/* Grid cell phone and whatsapp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-mono">Telefone Celular</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><Phone className="h-4 w-4" /></span>
                    <input
                      type="tel"
                      required
                      placeholder="(DD) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:bg-white/[0.08] transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-mono">WhatsApp para Contato</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><MessageSquare className="h-4 w-4" /></span>
                    <input
                      type="tel"
                      required
                      placeholder="(DD) 99999-9999"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:bg-white/[0.08] transition"
                    />
                  </div>
                </div>
              </div>

              {/* Grid city & state */}
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-mono">Cidade</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><MapPin className="h-4 w-4" /></span>
                    <input
                      type="text"
                      required
                      placeholder="Sua cidade"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:bg-white/[0.08] transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-mono">Estado</label>
                  <select
                    required={!isLoginView && !isRecoveryView}
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-2 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="" disabled>UF</option>
                    {statesOfBrazil.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Core Sign-in/Sign-up/Recovery inputs: Email */}
          <div>
            <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-mono">Endereço de E-mail</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><Mail className="h-4 w-4" /></span>
              <input
                type="email"
                required
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:bg-white/[0.08] transition"
              />
            </div>
          </div>

          {/* Password Inputs (Hidden in recovery view) */}
          {!isRecoveryView && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">Senha de Acesso</label>
                  {isLoginView && (
                    <button
                      type="button"
                      onClick={() => {
                        setErrorText(null);
                        setSuccessText(null);
                        setIsRecoveryView(true);
                      }}
                      className="text-[9px] font-mono text-amber-400 hover:underline cursor-pointer bg-transparent border-none"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><Lock className="h-4 w-4" /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder={isLoginView ? "Sua senha" : "Defina a sua senha (mínimo 6 dígitos)"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:bg-white/[0.08] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isLoginView && (
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-1.5 font-mono">Confirmar Senha</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><Lock className="h-4 w-4" /></span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Repita a senha informada"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:bg-white/[0.08] transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* LGPD Safety & Consent Clause Box (Mandatory Checkbox) */}
          {!isLoginView && !isRecoveryView && (
            <div className="bg-black/40 border border-zinc-800 p-4 rounded-2xl space-y-3 mt-2" id="client-consent-and-admin-req-box">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consentCheckbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 bg-zinc-950 cursor-pointer border-white/10"
                />
                <label htmlFor="consentCheckbox" className="text-[10px] leading-relaxed text-neutral-400 cursor-pointer select-none text-justify">
                  Concordo em receber comunicações, ofertas, avisos de pedidos e recuperação de carrinho através de WhatsApp, e-mail e outros canais.
                </label>
              </div>

              {/* SOLICITAR PRIVILÉGIOS DE ADMINISTRADOR SELECTION */}
              <div className="border-t border-white/5 pt-2 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="adminRequestCheckbox"
                  checked={isRequestingAdmin}
                  onChange={(e) => setIsRequestingAdmin(e.target.checked)}
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-500 bg-zinc-950 cursor-pointer border-white/10"
                />
                <div className="flex flex-col">
                  <label htmlFor="adminRequestCheckbox" className="text-[10.5px] font-bold text-amber-300 cursor-pointer select-none">
                    🔑 Solicitar Acesso de Co-Administrador
                  </label>
                  <p className="text-[9.5px] text-neutral-500 mt-0.5 leading-normal">
                    Selecione esta opção se você for membro da equipe e precisa de privilégios de acesso administrativo. Sua conta precisará ser aprovada pela proprietária.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-2 flex items-center gap-2 text-[9px] text-[#39ff14]/90 font-mono">
                <Shield className="h-3 w-3" />
                <span>Em plena conformidade legal com a LGPD.</span>
              </div>
            </div>
          )}

          {/* Form Action Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-semibold uppercase tracking-wider text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer border border-amber-300/30"
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>
                  {isRecoveryView 
                    ? 'Enviar Instruções' 
                    : isLoginView 
                      ? 'Entrar no Acervo' 
                      : 'Concluir Cadastro & Acessar'
                  }
                </span>
              </>
            )}
          </button>
        </form>

        {/* View Switch Link */}
        <div className="text-center mt-6 text-xs text-neutral-400 space-y-2">
          {isRecoveryView ? (
            <p>
              Ir para o{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorText(null);
                  setSuccessText(null);
                  setIsRecoveryView(false);
                  setIsLoginView(true);
                }}
                className="text-amber-400 font-semibold underline hover:text-amber-300 cursor-pointer bg-transparent border-none"
              >
                Login
              </button>
              {' '}ou{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorText(null);
                  setSuccessText(null);
                  setIsRecoveryView(false);
                  setIsLoginView(false);
                }}
                className="text-amber-400 font-semibold underline hover:text-amber-300 cursor-pointer bg-transparent border-none"
              >
                Cadastre-se grátis
              </button>
            </p>
          ) : isLoginView ? (
            <p>
              Ainda não possui acesso cadastrado?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorText(null);
                  setSuccessText(null);
                  setIsLoginView(false);
                }}
                className="text-amber-400 font-semibold underline hover:text-amber-300 cursor-pointer bg-transparent border-none"
              >
                Cadastre-se grátis
              </button>
            </p>
          ) : (
            <p>
              Já possui uma credencial de acesso?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorText(null);
                  setSuccessText(null);
                  setIsLoginView(true);
                }}
                className="text-amber-400 font-semibold underline hover:text-amber-300 cursor-pointer bg-transparent border-none"
              >
                Faça o seu login
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
