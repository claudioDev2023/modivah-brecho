import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquare, Send, CheckCircle, Gift, Award, Sparkles, User } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';

interface Comment {
  id: string;
  name: string;
  rating: number;
  text: string;
  category: 'app' | 'produto' | 'ambos';
  createdAt: string;
  isExample?: boolean;
}

const PRESET_COMMENTS: Comment[] = [
  {
    id: 'preset-1',
    name: 'Camila Albuquerque',
    rating: 5,
    text: 'Estou completamente apaixonada pelo vestido da Farm que comprei! O estado de conservação é absurdo, parece novinho de loja. A embalagem cheirosa e o bilhete escrito à mão ganharam meu coração de vez. ✨👗',
    category: 'produto',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    isExample: true
  },
  {
    id: 'preset-2',
    name: 'Juliana Menezes',
    rating: 5,
    text: 'O app é super rápido, mas o que mais me impressionou foi o Provador Virtual com Inteligência Artificial! Consegui visualizar exatamente o caimento das roupas antes de reservar. Atendimento impecável pelo WhatsApp.',
    category: 'app',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
    isExample: true
  },
  {
    id: 'preset-3',
    name: 'Fernanda Rocha',
    rating: 5,
    text: 'A iniciativa de economia circular sustentável me motivou a fazer minha primeira compra. Entrega super rápida para Vila Velha e a curadoria das marcas é fantástica. Com certeza comprarei mais peças de luxo!',
    category: 'ambos',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 75).toISOString(),
    isExample: true
  },
  {
    id: 'preset-4',
    name: 'Patrícia Soares',
    rating: 5,
    text: 'Curadorias maravilhosas! Já sou cliente física do Brechó e ver essa tecnologia toda no app facilitou demais minhas escolhas. Poder ver as novidades e reservar com Pix em segundos é muito prático!',
    category: 'ambos',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    isExample: true
  },
  {
    id: 'preset-5',
    name: 'Mariana Costa',
    rating: 5,
    text: 'Comprei uma jaqueta de couro legítimo que era meu grande sonho de consumo por menos de 1/3 do preço original. O provador virtual com IA ajudou a tirar a dúvida do tamanho e o envio foi imediato. Nota 10!',
    category: 'produto',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 200).toISOString(),
    isExample: true
  }
];

export default function CommentsSection() {
  const [comments, setComments] = useState<Comment[]>(PRESET_COMMENTS);
  const [formName, setFormName] = useState('');
  const [formText, setFormText] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formCategory, setFormCategory] = useState<'app' | 'produto' | 'ambos'>('ambos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Synchronize dynamic comments using Firestore snapshot
  useEffect(() => {
    const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbComments: Comment[] = [];
      snapshot.forEach((doc) => {
        dbComments.push({ id: doc.id, ...doc.data() } as Comment);
      });

      // Merge presets with database comments (preventing duplicates and maintaining reverse sorted order)
      const merged = [...dbComments];
      PRESET_COMMENTS.forEach(preset => {
        if (!dbComments.some(dbC => dbC.name === preset.name && dbC.text === preset.text)) {
          merged.push(preset);
        }
      });

      // Sort by date (descending)
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setComments(merged);
    }, (err) => {
      console.warn("Firestore comments reading failed:", err);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formText.trim()) return;

    setIsSubmitting(true);
    try {
      const newComment = {
        name: formName.trim(),
        text: formText.trim(),
        rating: formRating,
        category: formCategory,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'comments'), newComment);
      
      // Clear controls
      setFormName('');
      setFormText('');
      setFormRating(5);
      setFormCategory('ambos');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error("Failed to commit user review to database:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (cat: 'app' | 'produto' | 'ambos') => {
    switch (cat) {
      case 'app': return 'Aplicativo';
      case 'produto': return 'Peças & Produtos';
      default: return 'Geral / Ambos';
    }
  };

  return (
    <section className="mt-28 py-16 px-4 max-w-7xl mx-auto border-t border-white/5 relative shrink-0 w-full" id="customer-reviews-section">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full bg-amber-500/[0.02] filter blur-[120px] pointer-events-none" />
      
      {/* Dynamic Title with Exquisite typography */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10px] font-mono uppercase tracking-[0.2em] mb-3">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Feedbacks & Experiência</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-sans font-light tracking-wide text-white">
          Depoimentos do Acervo
        </h2>
        <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed mt-2.5 font-light">
          A curadoria de luxo sustentável da MODIVAH BRECHÓ é aprovada por quem entende de moda e preza por elegância e tecnologia.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Create comment form */}
        <div className="lg:col-span-5 bg-zinc-950/40 border border-white/5 p-6 rounded-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 p-3 text-amber-500/10">
            <Sparkles className="h-10 w-10" />
          </div>

          <h3 className="text-sm font-sans uppercase tracking-widest text-amber-400 mb-4 font-semibold flex items-center gap-2">
            Deixe sua Avaliação
          </h3>
          <p className="text-xs text-neutral-400 font-light leading-relaxed mb-6">
            Sua opinião é vital para mantermos o padrão de excelência de Cariacica para todo o Brasil. Avalie sua jornada!
          </p>

          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Obrigado! Seu comentário foi publicado em tempo real com sucesso!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Name */}
            <div>
              <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono block mb-1.5">Seu Nome Completo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"><User className="h-3.5 w-3.5" /></span>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Albuquerque"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:bg-white/[0.08]"
                />
              </div>
            </div>

            {/* Selecting Category Category */}
            <div>
              <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono block mb-1.5">O que está avaliando?</label>
              <div className="grid grid-cols-3 gap-2">
                {(['app', 'produto', 'ambos'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormCategory(cat)}
                    className={`py-2 px-1.5 rounded-lg text-[10px] font-semibold tracking-wider uppercase border transition cursor-pointer text-center ${
                      formCategory === cat
                        ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                        : 'bg-black/20 border-white/5 text-neutral-400 hover:border-white/10'
                    }`}
                  >
                    {cat === 'app' ? 'App / IA' : cat === 'produto' ? 'Peças' : 'Ambos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Stars evaluation input section */}
            <div>
              <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono block mb-1">Nota da Experiência</label>
              <div className="flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 cursor-pointer transition transform active:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= (hoverRating ?? formRating)
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                          : 'text-neutral-600 hover:text-amber-400/60'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-[10px] font-mono text-neutral-500 ml-2">
                  {formRating}/5 Estrelas
                </span>
              </div>
            </div>

            {/* Comment Message Input Box */}
            <div>
              <label className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono block mb-1.5">Seu Comentário</label>
              <textarea
                required
                rows={3}
                placeholder="Compartilhe como foi sua experiência com nosso acervo, provador virtual ou usabilidade do app..."
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                maxLength={400}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 focus:bg-white/[0.08]"
              />
              <span className="text-[9px] text-neutral-500 text-right block mt-1">
                Máximo 400 caracteres
              </span>
            </div>

            {/* Submit Reviews Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-400/10 active:scale-95 duration-150"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Publicar Comentário</span>
            </button>
          </form>
        </div>

        {/* Right Side: Feed display with responsive grid layouts */}
        <div className="lg:col-span-7 space-y-4 max-h-[580px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-white/10" id="comments-timeline-feed">
          <AnimatePresence initial={false}>
            {comments.map((comment, index) => {
              const formattedDate = new Date(comment.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              });

              return (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.05, 0.4) }}
                  className={`p-4 bg-zinc-900/30 border border-white/5 rounded-xl space-y-3 relative hover:border-white/10 transition leading-snug ${
                    comment.isExample ? 'border-amber-500/5 bg-zinc-900/[0.15]' : ''
                  }`}
                >
                  {comment.isExample && (
                    <span className="absolute top-3.5 right-3 px-2 py-0.5 bg-amber-400/5 border border-amber-400/10 rounded text-[8px] font-mono font-bold uppercase tracking-wider text-amber-400">
                      Depoimento Verificado ✨
                    </span>
                  )}

                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        {comment.name}
                      </h4>
                      <p className="text-[9px] text-neutral-500 font-mono mt-0.5">
                        Postado em {formattedDate}
                      </p>
                    </div>

                    {/* Stars render */}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < comment.rating 
                              ? 'fill-amber-400 text-amber-400' 
                              : 'text-neutral-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Feedback description text */}
                  <p className="text-xs text-neutral-300 font-light leading-relaxed text-justify">
                    {comment.text}
                  </p>

                  <div className="flex items-center justify-between border-t border-white/[0.03] pt-2 mt-2">
                    <span className="text-[9px] uppercase tracking-wider bg-white/5 border border-white/5 px-2 py-0.5 rounded text-neutral-400 font-mono">
                      Avaliou: {getCategoryLabel(comment.category)}
                    </span>
                    <span className="text-[10px] text-neutral-500 flex items-center gap-1">
                      <Award className="h-3 w-3 text-amber-500" />
                      <span className="font-light text-[9px] font-mono">Curadoria MODIVAH</span>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
