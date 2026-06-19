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
    <section className="mt-28 py-16 px-4 max-w-7xl mx-auto border-t border-zinc-200 relative shrink-0 w-full" id="customer-reviews-section">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full bg-[#EE4D2D]/[0.02] filter blur-[120px] pointer-events-none" />
      
      {/* Dynamic Title with Exquisite typography */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EE4D2D]/10 border border-[#EE4D2D]/20 rounded-full text-[#EE4D2D] text-[10px] font-mono uppercase tracking-[0.2em] mb-3">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Feedbacks & Experiência</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-wide text-zinc-800">
          Depoimentos do Acervo
        </h2>
        <p className="text-xs text-zinc-500 max-w-md mx-auto leading-relaxed mt-2.5 font-semibold">
          A curadoria de luxo sustentável da MODIVAH BRECHÓ é aprovada por quem entende de moda e preza por elegância e sustentabilidade.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-zinc-800">
        {/* Left Side: Create comment form */}
        <div className="lg:col-span-5 bg-zinc-50 border border-zinc-200 p-6 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-[#EE4D2D]/10">
            <Sparkles className="h-10 w-10" />
          </div>

          <h3 className="text-sm font-bold uppercase tracking-widest text-[#EE4D2D] mb-4 flex items-center gap-2">
            Deixe sua Avaliação
          </h3>
          <p className="text-xs text-zinc-500 font-semibold leading-relaxed mb-6">
            Sua opinião é vital para mantermos o padrão de excelência de Cariacica para todo o Brasil. Avalie sua jornada!
          </p>

          <AnimatePresence>
            {success && (
              <motion.div 
                key="comment-success-alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-xs flex items-center gap-2 font-bold"
              >
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Obrigado! Seu comentário foi publicado em tempo real com sucesso!</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Name */}
            <div>
              <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">Seu Nome Completo</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"><User className="h-3.5 w-3.5" /></span>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Albuquerque"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#EE4D2D]"
                />
              </div>
            </div>

            {/* Selecting Category Category */}
            <div>
              <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">O que está avaliando?</label>
              <div className="grid grid-cols-3 gap-2">
                {(['app', 'produto', 'ambos'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormCategory(cat)}
                    className={`py-2 px-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition cursor-pointer text-center ${
                      formCategory === cat
                        ? 'bg-[#EE4D2D]/10 border-[#EE4D2D] text-[#EE4D2D]'
                        : 'bg-white border-zinc-200 text-zinc-500 hover:border-[#EE4D2D]/50'
                    }`}
                  >
                    {cat === 'app' ? 'App / IA' : cat === 'produto' ? 'Peças' : 'Ambos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Stars evaluation input section */}
            <div>
              <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-1">Nota da Experiência</label>
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
                          ? 'fill-[#EE4D2D] text-[#EE4D2D]'
                          : 'text-zinc-300 hover:text-[#EE4D2D]/60'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-[10px] font-mono text-zinc-450 ml-2 font-bold">
                  {formRating}/5 Estrelas
                </span>
              </div>
            </div>

            {/* Comment Message Input Box */}
            <div>
              <label className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-1.5">Seu Comentário</label>
              <textarea
                required
                rows={3}
                placeholder="Compartilhe como foi sua experiência com nosso acervo, provador virtual ou usabilidade do app..."
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                maxLength={400}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-3.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-[#EE4D2D]"
              />
              <span className="text-[9px] text-zinc-400 text-right block mt-1">
                Máximo 400 caracteres
              </span>
            </div>

            {/* Submit Reviews Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-[#EE4D2D] hover:bg-[#FF6A4D] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer transition flex items-center justify-center gap-2 shadow-md hover:shadow-[#EE4D2D]/10 active:scale-95 duration-150"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Publicar Comentário</span>
            </button>
          </form>
        </div>

        {/* Right Side: Feed display with responsive grid layouts */}
        <div className="lg:col-span-7 space-y-4 max-h-[580px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-zinc-200" id="comments-timeline-feed">
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
                  className={`p-4 bg-white border border-zinc-200 rounded-xl space-y-3 relative hover:border-zinc-300 transition leading-snug ${
                    comment.isExample ? 'bg-orange-50/30 border-orange-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-850 uppercase tracking-wider flex flex-wrap items-center gap-2">
                        <span>{comment.name}</span>
                        {comment.isExample && (
                          <span className="px-1.5 py-0.5 bg-[#EE4D2D]/10 border border-[#EE4D2D]/20 rounded text-[8px] font-mono font-bold uppercase tracking-wider text-[#EE4D2D] inline-block">
                            Depoimento Verificado ✨
                          </span>
                        )}
                      </h4>
                      <p className="text-[9px] text-zinc-400 font-mono mt-0.5">
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
                              ? 'fill-[#EE4D2D] text-[#EE4D2D]' 
                              : 'text-zinc-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Feedback description text */}
                  <p className="text-xs text-zinc-700 font-normal leading-relaxed text-justify">
                    {comment.text}
                  </p>

                  <div className="flex items-center justify-between border-t border-zinc-150 pt-2 mt-2">
                    <span className="text-[9px] uppercase tracking-wider bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded text-zinc-500 font-mono font-bold">
                      Avaliou: {getCategoryLabel(comment.category)}
                    </span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Award className="h-3 w-3 text-[#EE4D2D]" />
                      <span className="font-bold text-[9px] font-mono">Curadoria MODIVAH</span>
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
