import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Middleware handling body parser and large payload errors into valid JSON
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err && (err.type === "entity.too.large" || err.status === 413 || err.statusCode === 413)) {
      console.error("[Server Error] Payload too large:", err);
      res.status(413).json({
        error: "A imagem enviada é muito grande. Por favor, envie uma foto menor (limite de 50MB).",
        details: err.message
      });
      return;
    }
    if (err instanceof SyntaxError && "status" in err && err.status === 400) {
      console.error("[Server Error] JSON parse failure:", err);
      res.status(400).json({ error: "Requisição inválida. O formato do JSON está incorreto." });
      return;
    }
    next(err);
  });

  // Serves as an API logger
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Modivah Brechó API" });
  });

  // POST endpoint for AI Stylist interaction
  app.post("/api/chat-stylist", async (req, res) => {
    try {
      const { message, history, products } = req.body;

      if (!message) {
        return res.status(400).json({ error: "O campo 'message' é obrigatório." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      // Lazy initialization of Gemini API Client
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        console.warn("[Modivah Stylist] GEMINI_API_KEY is not defined. Using stylist simulation response.");
        // Simulated premium stylist response if no API key is supplied
        const simulatedText = simulateStylistResponse(message, products || []);
        return res.json({ text: simulatedText });
      }

      // Initialize GoogleGenAI SDK correctly
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Format inventory for AI
      const inventoryString = (products || [])
        .map((p: any) => `- [${p.id}] "${p.title}" da marca ${p.brand}. Categoria: ${p.category}, Tamanho: ${p.size}, Preço: R$ ${p.price.toFixed(2)}, Condição: ${p.condition}, Material: ${p.material}. Tags: ${p.tag || 'Nenhuma'}`)
        .join("\n");

      const systemInstruction = `Você é a Personal Stylist oficial do "MODIVAH BRECHÓ" (Estilo Premium), um brechó de ultra luxo e curadoria premium.
Seu nome é "Stylist Modivah" e você fala de forma elegante, acolhedora, chique e confiante (estilo de consultora de alta moda em São Paulo/Rio).
Você deve se comunicar EXCLUSIVAMENTE em Português (pt-BR).

SUA MISSÃO:
Ajudar a cliente a encontrar a peça perfeita no inventário do brechó ou sugerir combinações elegantes usando as peças disponíveis.
Sempre que fizer sentido, mencione de forma natural um ou mais produtos específicos que temos em estoque! Use os IDs fornecidos (ex: [prod-1]) para que possamos recomendá-los na interface.
Seja honesta sobre tamanhos e marcas (Zara, Farm, Schutz, Animale, Le Lis Blanc, Colcci).

INVENTÁRIO ATUAL DO BRECHÓ:
${inventoryString || "Atualmente não há peças listadas no inventário."}

REGRAS DE RESPOSTA:
1. Seja amigável e use termos elegantes, mas sem clichês exagerados ("querida", "maravilhosa" com moderação, prefira "elegante", "autêntica", "chique").
2. Recomende de 1 a 3 peças do nosso inventário se houver correspondência com o gosto, tamanho ou ocasião mencionada pela cliente.
3. Se não houver correspondência direta, console pedindo para ela ficar de olho nas novidades semanais e recomende a peça mais próxima que temos (ex: se ela quer calça branca e temos calça jeans ou conjunto linho areia, sugira o conjunto linho para elegância de resort).
4. Suas respostas devem ser descritas em Markdown elegante com bom uso de espaçamento.`;

      // Structure contents with history for full chat context
      const formattedContents: any[] = [];
      
      if (history && Array.isArray(history)) {
        history.slice(-10).forEach((msg: any) => {
          formattedContents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        });
      }

      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        },
      });

      const text = response.text || "Desculpe, meu atelier de estilo está um pouco ocupado no momento. Como posso ajudar com nossas peças?";
      return res.json({ text });
    } catch (error: any) {
      console.error("[Modivah Stylist Error]", error);
      return res.status(500).json({ 
        error: "Erro ao processar consulta de moda.", 
        details: error.message 
      });
    }
  });

  // POST endpoint for AI virtual try-on simulation and stylist report
  app.post("/api/simulate-look", async (req, res) => {
    try {
      const { product, faceImage, selectedHair } = req.body;
      if (!product) {
        return res.status(400).json({ error: "O produto é obrigatório para a simulação." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      
      // If no API key, or default placeholder API key is supplied, we return simulated premium response.
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        console.warn("[Modivah Simulator] GEMINI_API_KEY is not defined. Using elegant local simulation response.");
        const simulatedText = simulateSimulationResponse(product, selectedHair);
        return res.json({ text: simulatedText });
      }

      // Initialize GoogleGenAI SDK correctly
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare request contents. Since Gemini 3.5 Flash is multimodal, if faceImage base64 is provided, we can pass it!
      const contentsParts: any[] = [];
      
      if (faceImage && faceImage.startsWith("data:image")) {
        // Extract the base64 part
        const matches = faceImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          contentsParts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          });
        }
      }

      const textPrompt = `Escreva um laudo de estilo de moda e assessoria de imagem para a simulação virtual de provador de roupas do "MODIVAH BRECHÓ" (Estilo Premium).
A cliente está experimentando virtualmente o seguinte produto de nossa curadoria:
- Nome da peça: "${product.title}"
- Marca/Grife: ${product.brand}
- Tamanho: ${product.size}
- Material / Tecido: ${product.material}
- Categoria: ${product.category}
- Condição/Estado: ${product.condition}
${selectedHair ? `- Cabelo/Estilo do Rosto: ${selectedHair}` : ''}

Se houver uma foto de rosto da cliente anexada, por favor analise de forma elegante e elogiosa as harmonias cromáticas e estilo mais recomendável para o caimento da peça, realçando a beleza natural dela.
Fale como uma consultora pessoal altamente de luxo (chique, polida, acolhedora). Divida o laudo estruturado com títulos claros e emojis elegantes usando Markdown:
1. ✨ Impressão Geral do Look: Como a peça realça a elegância natural;
2. 🥂 Harmonia & Cores (Paleta): Por que a cor e o tecido harmonizam muito bem e trazem sofisticação;
3. 👜 Dica da Stylist (Combinações): Sugestões de como usar no dia-a-dia chique ou eventos importantes;
4. 💫 O Veredito: Uma frase curta marcante de empoderamento e inteligência circular sustentável na moda.

Mantenha a resposta com cerca de 150 a 200 palavras em português pt-BR.`;

      contentsParts.push({ text: textPrompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: contentsParts },
        config: {
          temperature: 0.8,
        }
      });

      const text = response.text || simulateSimulationResponse(product, selectedHair);
      return res.json({ text });
    } catch (error: any) {
      console.error("[Modivah Simulator Error]", error);
      return res.status(500).json({ 
        error: "Erro ao processar simulação de moda.", 
        details: error.message 
      });
    }
  });

  // Local static serving inside production, Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[Developer Mode] Vite middleware active.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback handling
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("[Production Mode] Static asset serving active.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}...`);
    console.log(`Please access via: http://0.0.0.0:${PORT}`);
  });
}

// Simulated fallback if GEMINI_API_KEY key is unconfigured
function simulateStylistResponse(message: string, products: any[]): string {
  const query = message.toLowerCase();
  
  // Find match keywords in available products
  const matches = products.filter(p => 
    query.includes(p.title.toLowerCase()) || 
    query.includes(p.brand.toLowerCase()) || 
    query.includes(p.category.toLowerCase()) ||
    query.includes(p.material.toLowerCase()) ||
    query.includes(p.size.toLowerCase())
  );

  let response = `Olá, elegante! Sou a sua **Stylist Virtual Modivah**.\n\n`;

  if (matches.length > 0) {
    response += `Que excelente gosto! Percebi que você está interessada em peças refinadas. Selecionei a dedo algumas opções que temos em estoque agora que combinam perfeitamente com seu estilo:\n\n`;
    matches.slice(0, 3).forEach(p => {
      response += `- **${p.title}** (${p.brand}) no tamanho **${p.size}** — R$ ${p.price.toFixed(2)}. Uma joia em estado *${p.condition}*!\n`;
    });
    response += `\nQual destas peças faria você se sentir mais autêntica hoje? Posso te ajudar a montar um look completo ou guiar até o fechamento com nosso WhatsApp!`;
  } else if (query.includes("vestido")) {
    const vestidos = products.filter(p => p.category === 'Vestidos');
    response += `Ah, vestidos! A expressão máxima de feminilidade fluida. No momento, nossa curadoria conta com peças lindíssimas, como:\n\n`;
    vestidos.forEach(p => {
      response += `- **${p.title}** (${p.brand}), Tam. **${p.size}** por R$ ${p.price.toFixed(2)}. Perfeito para ocasiões marcantes.\n`;
    });
    response += `\nQual deles combina com seu compromisso?`;
  } else if (query.includes("frio") || query.includes("casaco") || query.includes("inverno")) {
    const casacos = products.filter(p => p.category === 'Casacos');
    if (casacos.length > 0) {
      response += `Para se manter aquecida com elegância soberana, recomendo fortemente os nossos casacos curados:\n\n`;
      casacos.forEach(p => {
        response += `- **${p.title}** da grife **${p.brand}** no tamanho **${p.size}**. Uma peça atemporal estruturada de alta costura!\n`;
      });
    } else {
      response += `Nossos casacos premium estão fazendo muito sucesso, mas no momento estão esgotados! Que tal dar uma olhada em nossos conjuntos refinados de linho Animale ou camisas de pura seda Le Lis Blanc?`;
    }
  } else {
    response += `Seja muito bem-vinda ao círculo de moda premium do **MODIVAH BRECHÓ**!\n\nEstou aqui para fazer uma consultoria de estilo personalizada para você. Quer encontrar uma peça específica, combinar cores, descobrir o tamanho ideal ou ver o que acabou de chegar das marcas mais desejadas como **Farm**, **Zara**, **Schutz** e **Animale**?\n\nMe conte: que tipo de ocasião ou estilo você está vestindo hoje? ✨`;
  }
  
  return response;
}

// Simulated fallback for virtual try-on report
function simulateSimulationResponse(product: any, selectedHair?: string): string {
  const brand = product.brand || "Modivah";
  const material = product.material || "Tecido Nobre";
  const title = product.title || "Peça Exclusiva";
  const hairDesc = selectedHair ? `corte/estilo de cabelo no estilo ${selectedHair}` : "visual impecável";
  
  return `### ✨ **Impressão Geral do Look**
A escolha do(a) **${title}** da refinada grife **${brand}** é um verdadeiro manifesto de estilo consciente e sofisticação urbana. A estrutura da peça e o acabamento primoroso trazem um caimento impecável que destaca a sua beleza com total leveza e sobriedade.

### 🥂 **Harmonia & Cores (Paleta)**
O toque nobre do **${material}** confere uma assinatura tátil luxuosa ao visual. A tonalidade exala um minimalismo contemporâneo requintado (estilo *quiet luxury*). Como as suas fotos evidenciam um ${hairDesc}, a cor cria uma moldura perfeita de contraste, elevando o brilho natural das suas feições.

### 👜 **Dicas de Combinação da Stylist**
- **Looks Diurnos / Brunch / Corporativo**: Combine com rasteiras elegantes de tiras finas ou mocassins Schutz, acrescentando brincos dourados minimalistas.
- **Transição para Noite / Cocktail**: Acrescente um scarpin meia-pata, bolsa baguete estruturada e uma maquiagem de tons terrosos quentes com batom sutil.

### 💫 **O Veredito Modivah**
Investir na circularidade premium com uma peça icônica **${brand}** é a expressão mais pura de consumo inteligente, elegância atemporal e sustentabilidade de luxo! Você está absolutamente perfeita.`;
}

startServer().catch((err) => {
  console.error("Express failed to start:", err);
});
