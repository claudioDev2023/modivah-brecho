import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { X, Sparkles, Send, CheckCircle, Phone, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function LeadCapture() {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorText, setErrorText] = useState('');

  useEffect(() => {
    // Check if user has already dismissed or registered
    const dismissed = localStorage.getItem('modivah_lead_dismissed');
    const registered = localStorage.getItem('modivah_lead_registered');
    
    if (!dismissed && !registered) {
      // Delay showing it for a smooth entrance effect
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('modivah_lead_dismissed', 'true');
    setIsVisible(false);
  };

  const formatWhatsApp = (value: string) => {
    // Basic phone number formatting (e.g. (99) 99999-9999)
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    if (formatted.length <= 15) {
      setWhatsapp(formatted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!name.trim()) {
      setErrorText('Por favor, informe seu nome.');
      return;
    }

    const digitsOnly = whatsapp.replace(/\D/g, '');
    if (digitsOnly.length < 10) {
      setErrorText('Por favor, informe seu WhatsApp com DDD (mínimo 10 dígitos).');
      return;
    }

    setIsSubmitting(true);

    try {
      const id = `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      await setDoc(doc(db, 'interested_customers', id), {
        id,
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        createdAt,
        source: 'lead_capture_flagship'
      });

      localStorage.setItem('modivah_lead_registered', 'true');
      setIsSubmitted(true);
      
      // Auto close after 3 seconds on success
      setTimeout(() => {
        setIsVisible(false);
      }, 3500);
    } catch (err: any) {
      console.error('Error registering lead interest:', err);
      setErrorText('Ocorreu um erro ao salvar o cadastro. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full bg-gradient-to-r from-[#FFF5F5] via-[#FFF8F6] to-[#FFF5F5] border-b border-rose-100 py-5 px-4 sm:px-6 md:px-8 relative shadow-sm overflow-hidden"
        id="lead-capture-highlights-banner"
      >
        {/* Delicate background elements */}
        <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-rose-200/20 blur-3xl pointer-events-none" />
        <div className="absolute left-10 top-2 w-24 h-24 rounded-full bg-[#EE4D2D]/5 blur-2xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-8 relative z-10">
          
          {/* Slogan and Text Header */}
          <div className="text-center lg:text-left space-y-1.5 max-w-xl">
            <div className="flex items-center justify-center lg:justify-start gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-[#9c27b0] tracking-wider uppercase font-sans flex items-center gap-1">
                ✨ Receba Novidades Primeiro
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-650 font-medium font-sans">
              Cadastre seu nome e WhatsApp e fique por dentro das novas peças.
            </p>
          </div>

          {/* Form Container */}
          <div className="w-full lg:w-auto flex-1 max-w-2xl">
            <AnimatePresence mode="wait">
              {isSubmitted ? (
                <motion.div
                  key="success-message"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center lg:justify-end gap-3 text-emerald-700 py-2.5 font-medium text-xs sm:text-sm"
                >
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>Seu cadastro foi realizado com sucesso! Em breve enviaremos as novidades no WhatsApp. 🌸</span>
                </motion.div>
              ) : (
                <motion.form
                  onSubmit={handleSubmit}
                  key="capture-form"
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:justify-end"
                >
                  {/* Name Input */}
                  <div className="relative w-full sm:max-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <User className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full bg-white border border-rose-100 hover:border-rose-200 focus:border-rose-400 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none transition duration-200 font-sans font-medium"
                      required
                    />
                  </div>

                  {/* WhatsApp Input */}
                  <div className="relative w-full sm:max-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <Phone className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="tel"
                      placeholder="(DD) 99999-9999"
                      value={whatsapp}
                      onChange={handlePhoneChange}
                      disabled={isSubmitting}
                      className="w-full bg-white border border-rose-100 hover:border-rose-200 focus:border-rose-400 rounded-xl pl-9 pr-3 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none transition duration-200 font-sans font-medium"
                      required
                    />
                  </div>

                  {/* Submission Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#9c27b0] to-[#e040fb] hover:from-[#7b1fa2] hover:to-[#d500f9] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition duration-200 shadow-sm active:translate-y-[1px] disabled:opacity-50 shrink-0 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>QUERO RECEBER NOVIDADES</span>
                        <Send className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {errorText && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-rose-500 text-[11px] font-medium mt-1.5 text-center lg:text-right"
              >
                ⚠️ {errorText}
              </motion.p>
            )}
          </div>

          {/* Elegant Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute right-3 lg:right-4 top-1/2 -translate-y-1/2 lg:-translate-y-1/2 text-zinc-400 hover:text-zinc-650 p-1 rounded-full hover:bg-rose-100/50 transition duration-150 cursor-pointer"
            title="Fechar"
            aria-label="Ignorar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
