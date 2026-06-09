export interface FashionArticle {
  id: string;
  topic: string;
  keywords: string[];
  response: string;
}

export const FASHION_DATABASE: FashionArticle[] = [
  {
    id: "kb-farm",
    topic: "grifes-farm",
    keywords: ["farm", "estampas", "colorido", "tropical", "carioca", "vestido farm"],
    response: "### 🌸 **O Universo Vibrante da Farm**\n\nA **Farm** é a tradução perfeita do espírito solar e carioca em forma de moda! Conhecida mundialmente pelas suas estampas exclusivas, cores quentes e tecidos fluidos que celebram a natureza e a cultura tropical.\n\n**Dica de Stylist Modivah**:\n- **Look Casual Chic**: Combine um vestido estampado Farm do nosso acervo com rasteiras de couro ou tênis branco minimalista.\n- **Looks de Festa**: Invista em brincos neutros para deixar a estampa da Farm reinar absoluta.\n\n*Quer conferir os vestidos Farm disponíveis em nosso estoque hoje? Basta buscar na barra de pesquisa da página principal!*"
  },
  {
    id: "kb-animale",
    topic: "grifes-animale",
    keywords: ["animale", "festa", "alfaiataria", "seda", "linho", "fino"],
    response: "### 🥂 **Elegância Atemporal: Animale**\n\nA **Animale** personifica a sofisticação urbana e a feminilidade contemporânea. Suas peças prezam por tecidos nobres como linho puro, seda de caimento suave, couro legítimo e cortes de alfaiataria impecáveis para mulheres decididas.\n\n**Como Harmonizar**:\n- Um blazer Animale de linho estruturado cai perfeitamente sobre um jeans clássico reto, entregando o estilo *Quiet Luxury* definitivo para reuniões ou jantares.\n\n*Encontre blazers e camisas luxuosas da Animale filtrando por 'Marcas' em nossa vitrine!*"
  },
  {
    id: "kb-quiet-luxury",
    topic: "tendencias-luxury",
    keywords: ["quiet luxury", "luxo silencioso", "rico", "elegante", "atemporal", "sofisticado", "minimalismo", "cores neutras"],
    response: "### ⚜️ **A Tendência Quiet Luxury (Luxo Silencioso)**\n\nEssa tendência celebra o que há de mais refinado: o caimento sublime, as padronagens atemporais e a extrema qualidade textil, sem logotipos chamativos ou excessos. É o estilo das cores neutras: off-white, nude, bege, caramelo, azul-marinho e preto.\n\n**Como adotar no seu dia a dia**:\n1. Use peças de **alfaiataria estruturada** e camisas de fibras naturais combinadas.\n2. Escolha calçados clássicos (mules ou scarpins de bico fino).\n3. Valorize assessórios discretos e acabamento limpo.\n\n*Nossa curadoria na Modivah possui peças ideais da Animale, Zara e Schutz para montar um look Quiet Luxury completo com até 80% de desconto!*"
  },
  {
    id: "kb-zara",
    topic: "grifes-zara",
    keywords: ["zara", "moda rapida", "tendencias zara", "alfaiataria zara", "basico zara"],
    response: "### 🏛️ **Zara: Tendências Internacionais ao Seu Alcance**\n\nA **Zara** é especialista em ler as passarelas europeias de Milão e Paris e transformá-las em peças versáteis, modernas e cheias de personalidade. Do básico refinado à alfaiataria geométrica moderna, as peças Zara trazem excelente estrutura visual.\n\n**Combinação Prática**:\n- Calça Zara pantacourt + Camisa de seda branca + Salto fino da Schutz. Um visual que transita perfeitamente do trabalho ao happy hour!\n\n*Temos uma seleção incrível de calças, blazers e vestidos da Zara no estoque. Digite 'Zara' no campo de busca principal para se encantar!*"
  },
  {
    id: "kb-schutz",
    topic: "grifes-schutz",
    keywords: ["schutz", "sapatos", "salto", "bota", "sandalia", "bolsa schutz", "calcado"],
    response: "### 👠 **Schutz: Atitude, Design e Poder**\n\nFundada com foco em calçados icônicos, a **Schutz** traduz ousadia, modernidade e conforto em sandálias, botas estruturadas e bolsas que se tornam as protagonistas de qualquer combinação fashionista.\n\n**Dicas de Estilo**:\n- Use botas Schutz para dar peso e um toque urbano ou brutalista a vestidos leves de seda.\n- Invista nas sandálias clássicas Schutz para alongar a silhueta em looks de saia midi.\n\n*Nossos sapatos de luxo e botas Schutz encontram-se limpos, higienizados e prontos para uso na seção de Calçados da nossa loja física e virtual.*"
  },
  {
    id: "kb-tendency-2026",
    topic: "tendencias-gerais",
    keywords: ["tendencias", "outono", "inverno", "primavera", "verao", "moda de hoje", "em alta", "novidade"],
    response: "### 💡 **Tendências de Moda Atuais & Paleta de Cores**\n\nA moda caminha em direção a roupas que expressam histórias e caimento real. As grandes tendências do ano são:\n\n1. **Boho Chic Moderno**: Rendas, texturas artesanais de tricot e camurça de altíssima qualidade combinadas com acessórios dourados.\n2. **Estilo Corporativo Desconstruído**: Blazers oversized com ombros marcados de marcas clássicas usados de forma despojada sobre tops curtos.\n3. **Cores Terra e Vermelho Cereja**: Tons terrosos quentes e o marcante vermelho-cereja estão dominando as combinações e acessórios de luxo.\n\n*Quer elevar seu guarda-roupa? Fale com nossa equipe pelo WhatsApp para receber uma sacola condicional no conforto de sua casa!*"
  },
  {
    id: "kb-care",
    topic: "cuidados",
    keywords: ["lavar", "lavagem", "cuidado com tecido", "passar", "passadoria", "limpeza", "conservar"],
    response: "### 🧼 **Manual de Conservação dos Nossos Produtos Premium**\n\nNo **Modivah Brechó**, cada peça dura uma vida se cuidada com afeto! Veja como estender a vida útil das suas grifes:\n\n- **Peças de Linho e Seda**: Nunca lave na máquina. Prefira lavagem manual suave com sabão de coco neutro e seque à sombra para evitar desbotamento.\n- **Blazers e Peças Estruturadas**: Faça higienização a seco profissional periodicamente para manter a integridade dos ombros estruturados.\n- **Guardar em Cabides Macios**: Casacos pesados e peças de lã devem ser guardados dobrados (para não esticar os ombros), enquanto tecidos nobres devem usar cabides acolchoados.\n\n*Nossa curadoria entrega todas as peças 100% lavadas, higienizadas com ozônio e passadas no vapor por profissionais especializados!*"
  }
];

export const NON_FASHION_REJECTION = "Como sua Personal Stylist oficial do **MODIVAH BRECHÓ**, meu espaço e coração são dedicados exclusivamente ao mundo da moda, tendências de estilo e os produtos incríveis do nosso acervo! ✨\n\nTenho certeza de que você tem dúvidas maravilhosas sobre looks, grifes ou peças. Me conte: para qual ocasião você precisa montar um look aujourd'hui, ou qual marca do nosso estoque chamou sua atenção? 🥂👜";

export function isQueryAboutFashion(query: string): boolean {
  const normalized = query.toLowerCase();
  
  // High value words related to fashion, style, garments, shopping, brands or specific app info
  const fashionTerms = [
    "moda", "tendencia", "tendência", "estilo", "look", "roupa", "vestido", "casaco", "calça", "camisa", "blusa",
    "saia", "tamanho", "marca", "grife", "linho", "seda", "algodao", "algodão", "poliester", "couro", "jeans", "tecido",
    "farm", "zara", "animale", "schutz", "arezzo", "lez a lez", "morena rosa", "pantallona", "pantacourt", "blazer",
    "sapato", "bota", "sandalia", "sandália", "salto", "bolsa", "acessorio", "acessório", "brinco", "colar", "pulseira",
    "combina", "combinacao", "combinação", "vestir", "outfit", "quiet luxury", "boho", "minimal", "co-admin", "admin", "produto",
    "preço", "brechó", "brecho", "comprar", "estoque", "vitrine", "curadoria", "tamanho", "tamanhos", "whatsapp", "anuncio",
    "anúncio", "aplicativo", "app", "cupom", "entrega", "frete", "pagamento"
  ];
  
  return fashionTerms.some(term => normalized.includes(term));
}
