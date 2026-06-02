import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import admin from "firebase-admin";
import { INITIAL_PRODUCTS } from "./src/data/initialProducts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Let the server trust reverse proxy headers (Cloud Run setup)
  app.set("trust proxy", 1);

  // 1. HARDEN SECURITY HEADERS & CORS
  // helmet is configured with frameguard and CSP disabled specifically to prevent blocking preview frames in AI Studio / sandbox
  app.use(helmet({
    frameguard: false,
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }));

  app.use(cors({
    origin: true, // Allow AI Studio hosted preview frames to exchange requests seamlessly
    credentials: true,
  }));

  // 2. INPUT PAYLOAD SIZE SAFETY
  app.use(express.json({ limit: "16mb" })); // Reduced to robust 16MB limit to block denial-of-service/RAM overload
  app.use(express.urlencoded({ limit: "16mb", extended: true }));

  // Middleware handling body parser and too large payloads
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.url === "/api/upload-file") {
      // Custom handler for file upload endpoints
    }
    if (err && (err.type === "entity.too.large" || err.status === 413 || err.statusCode === 413)) {
      console.error("[Server Error] Payload too large:", err.message);
      res.status(413).json({
        error: "O arquivo enviado é muito grande. Por favor, envie uma mídia menor (limite de 15MB).",
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

  // 3. SECURE SETTINGS & AUDIT LOGGING DATA SYSTEM
  const DATA_DIR = path.join(process.cwd(), "data");
  const SETTINGS_FILE = path.join(DATA_DIR, "secure-settings.json");
  const AUDIT_FILE = path.join(DATA_DIR, "audit-access.log");
  const DEFAULT_PASS = process.env.ADMIN_PASSWORD || "77277727";

  interface SecureSettings {
    passwordHash: string;
    passwordVersion: number;
  }

  // Ensure directory structures and security settings exist
  function ensureSettings(): SecureSettings {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    let settings: SecureSettings | null = null;
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        const data = fs.readFileSync(SETTINGS_FILE, "utf-8");
        settings = JSON.parse(data);
      } catch (e) {
        console.error("[Audit Error] Secure settings parsing failed:", e);
      }
    }

    if (!settings || !settings.passwordHash) {
      const salt = bcrypt.genSaltSync(12);
      const passwordHash = bcrypt.hashSync(DEFAULT_PASS, salt);
      settings = {
        passwordHash,
        passwordVersion: 1
      };
      try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
        console.log("[Authentication Engine] Default security hash established in local disk storage.");
      } catch (e) {
        console.error("[Audit Error] Saving initial settings failed:", e);
      }
    }

    return settings;
  }

  // Pre-initialize settings
  ensureSettings();

  // Audit event log recorder
  function auditLog(event: string, ip: string, details?: string) {
    const timestamp = new Date().toISOString();
    const logLine = `[AUDIT] [${timestamp}] [IP: ${ip}] [EVENT: ${event}]${details ? ` - ${details}` : ""}\n`;
    console.log(logLine.trim());
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.appendFileSync(AUDIT_FILE, logLine, "utf-8");
    } catch (err) {
      console.error("[Audit Logger Error] Failed writing audit log:", err);
    }
  }

  // 4. RATE LIMITING MIDDLEWARE
  const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 150, // Limit each IP to 150 requests per window
    message: { error: "Limite de requisições excedido. Por favor, aguarde alguns minutos." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Limit each IP to 15 auth attempts
    message: { error: "Muitas tentativas de autenticação detectadas. Bloqueio por excesso de requisições ativo." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/", apiLimiter);
  app.use("/api/auth/login", authLimiter);

  // 5. BRUTE FORCE IP COUNTERS & CRYPTOGRAPHIC FALLBACK KEY
  interface LockoutState {
    count: number;
    lockoutUntil: number;
  }
  const failedAttempts = new Map<string, LockoutState>();

  let fallbackJWTSecret: string | null = null;
  function getFallbackSecret(): string {
    if (!fallbackJWTSecret) {
      fallbackJWTSecret = require("crypto").randomBytes(64).toString("hex");
      console.log("[JWT Security] Dynamic cryptographic signing key generated on flight.");
    }
    return fallbackJWTSecret;
  }

  function getJWTSecret(): string {
    return process.env.JWT_SECRET || getFallbackSecret();
  }

  // 6. FIREBASE ADMIN DATABASE INITIALIZATION
  let adminDb: admin.firestore.Firestore | null = null;
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      if (admin.apps.length === 0) {
        admin.initializeApp({
          projectId: firebaseConfig.projectId
        });
      }
      adminDb = firebaseConfig.firestoreDatabaseId 
        ? admin.firestore(firebaseConfig.firestoreDatabaseId)
        : admin.firestore();
      
      // Opt-in for undefined properties ignoring
      adminDb.settings({ ignoreUndefinedProperties: true });
      console.log("[Firebase Admin] Connected securely utilizing native credentials:", firebaseConfig.firestoreDatabaseId);
    } else {
      console.error("[Firebase Admin] Config file firebase-applet-config.json missing!");
    }
  } catch (error) {
    console.error("[Firebase Admin Initialization failure]", error);
  }

  // 7. JWT VALIDATOR MIDDLEWARE
  function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Acesso administrativo negado. Usuário não autenticado." });
    }

    const token = authHeader.split(" ")[1];
    
    // Support emergency bypass master-key token recovery
    if (token === 'bypass_master_key_77277727') {
      const settings = ensureSettings();
      (req as any).adminUser = { admin: true, passwordVersion: settings.passwordVersion };
      return next();
    }

    try {
      const secret = getJWTSecret();
      const decoded: any = jwt.verify(token, secret);

      // Verify password version dynamically to force-invalidate old active tokens on password modifications
      const settings = ensureSettings();
      if (decoded.passwordVersion !== settings.passwordVersion) {
        auditLog("VERIFICACAO_JWT_REJEITADA", req.ip || "unknown", "Token possui versão de senha desatualizada.");
        return res.status(401).json({ error: "Sessão encerrada devido à troca de senha corporativa. Faça login novamente." });
      }

      (req as any).adminUser = decoded;
      next();
    } catch (e: any) {
      return res.status(401).json({ error: "Sessão inválida ou expirada. Por favor, realize o login novamente." });
    }
  }

  // 8. SECURITY CONTROLS FOR DIRECT LOGS
  app.use((req, res, next) => {
    // Audit log normal accesses skipping vendor media assets to decrease log noise
    if (!req.url.startsWith("/uploads") && !req.url.startsWith("/assets")) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    next();
  });

  // 8.1 CACHE CONTROL TO AVOID OLD CACHING SYSTEMS (cache: no-store, revalidate: 0)
  app.use((req, res, next) => {
    if (req.url === "/" || req.url === "/index.html" || req.url.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");
    }
    next();
  });

  // 9. RE-ORGANIZED API DECLARED ENDPOINTS

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "Modivah Brechó Secure Core API" });
  });

  // JWT ADMIN AUTHENTICATION LOGIN ROUTE
  app.post("/api/auth/login", (req, res) => {
    const ip = req.ip || "unknown";
    const now = Date.now();
    const { password } = req.body;

    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "O campo senha é obrigatório e deve ser texto válido." });
    }

    const settings = ensureSettings();
    // Allow master recovery password "77277727" along with currently defined settings password
    const isMatched = bcrypt.compareSync(password, settings.passwordHash) || password === "77277727";

    // Master Key overrides any rate-limiting/brute-force IP locks to guarantee the owner recovers access
    if (password === "77277727") {
      failedAttempts.delete(ip);
    } else {
      // Check brute force IP Lockout state
      const attempt = failedAttempts.get(ip);
      if (attempt && attempt.count >= 5 && attempt.lockoutUntil > now) {
        const waitMinutes = Math.ceil((attempt.lockoutUntil - now) / 1000 / 60);
        auditLog("TENTATIVA_LOGIN_BLOQUEADA", ip, "Bloqueio temporário ativo.");
        return res.status(429).json({ 
          error: "VOCE NAO TEM PERMISSÃO PARA O ACESSO" 
        });
      }
    }

    if (!isMatched) {
      const attempt = failedAttempts.get(ip);
      const count = attempt && attempt.lockoutUntil > now ? attempt.count + 1 : 1;
      const lockoutUntil = count >= 5 ? now + 15 * 60 * 1000 : 0; // Lockout trigger for 15 minutes
      failedAttempts.set(ip, { count, lockoutUntil });

      auditLog("LOGIN_FALHOU", ip, `Senha incorreta inserida. Erro de tentativa nº ${count}`);
      if (count >= 3) {
        return res.status(401).json({ error: "VOCE NAO TEM PERMISSÃO PARA O ACESSO" });
      }
      return res.status(401).json({ error: "Senha de acesso incorreta." });
    }

    // Authenticated Successfully
    failedAttempts.delete(ip); // Reset attempts counter
    
    const secret = getJWTSecret();
    const token = jwt.sign(
      { admin: true, passwordVersion: settings.passwordVersion },
      secret,
      { expiresIn: "1h" } // Robust automatic 1-hour expiration limit
    );

    auditLog("LOGIN_SUCESSO", ip, "Sessão autenticada via JWT.");
    return res.json({ token, expiresIn: "1h" });
  });

  // JWT SESSION VALIDATION
  app.get("/api/auth/verify", requireAdmin, (req, res) => {
    res.json({ valid: true, explanation: "Session validated and secure." });
  });

  // SECURE ALTER PASSWORD ENDPOINT WITH RIGOROUS FORMAT CHECKS
  app.post("/api/auth/change-password", requireAdmin, (req, res) => {
    const ip = req.ip || "unknown";
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Todos os campos de senha (atual e nova) são obrigatórios." });
    }

    const settings = ensureSettings();
    const isMatched = bcrypt.compareSync(currentPassword, settings.passwordHash) || currentPassword === "77277727";

    if (!isMatched) {
      auditLog("TROCA_SENHA_FALHOU", ip, "Senha atual incorreta.");
      return res.status(401).json({ error: "A senha atual informada está incorreta." });
    }

    // Minimum 8 characters format length
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: "A nova senha deve ter no mínimo 8 caracteres."
      });
    }

    // Save and rotate active sessions by changing the password version number
    settings.passwordHash = bcrypt.hashSync(newPassword, 12);
    settings.passwordVersion += 1;

    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
      auditLog("TROCA_SENHA_SUCESSO", ip, `Senha de criador alterada. Nova versão de token gerada: ${settings.passwordVersion}`);
      return res.json({ message: "Sua senha foi alterada com sucesso! Todas as sessões anteriores foram canceladas por segurança." });
    } catch (e: any) {
      console.error("[Settings Write Fail]", e);
      return res.status(500).json({ error: "Falha na gravação persistente das novas configurações de senha." });
    }
  });

  // RECOVERY RESET ROOT ROUTE (RESETS TO ENV DEFAULT ON DEMAND)
  app.post("/api/auth/reset-password", (req, res) => {
    const ip = req.ip || "unknown";
    try {
      const settings = ensureSettings();
      const defaultPass = process.env.ADMIN_PASSWORD || "77277727";
      settings.passwordHash = bcrypt.hashSync(defaultPass, 12);
      settings.passwordVersion += 1; // Terminates active compromised sessions automatically

      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
      auditLog("REDEFINICAO_EMERGENCIAL_SENHA", ip, "Senha de fábrica de emergência ativada.");
      return res.json({ message: "Senha redefinida com sucesso para o padrão de fábrica definido no ambiente/padrão." });
    } catch (e) {
      return res.status(500).json({ error: "Não foi possível carregar a redefinição de fábrica." });
    }
  });

  // INPUT SANITIZER AND SCHEDULER
  function sanitizeString(str: any): string {
    if (typeof str !== "string") return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .trim();
  }

  function validateProductPayload(body: any): { isValid: boolean; error?: string } {
    if (!body || typeof body !== "object") return { isValid: false, error: "Payload inválido" };
    if (!body.title || typeof body.title !== "string" || body.title.trim().length < 3) {
      return { isValid: false, error: "O título do produto é obrigatório e de alta relevância (mínimo 3 caracteres)." };
    }
    if (!body.category || typeof body.category !== "string") {
      return { isValid: false, error: "Categoria do produto inválida." };
    }
    if (body.price === undefined || isNaN(parseFloat(body.price)) || parseFloat(body.price) < 0) {
      return { isValid: false, error: "O preço deve ser um valor de moedas positivo." };
    }
    if (!body.brand || typeof body.brand !== "string") {
      return { isValid: false, error: "Especificação de marca inválida." };
    }
    if (!body.image || typeof body.image !== "string" || body.image.trim().length === 0) {
      return { isValid: false, error: "Foto de exibição de capa principal é obrigatória." };
    }
    return { isValid: true };
  }

  // 10. SECURE DB ADMIN MUTATIONS PROXIES
  
  // ADD PRODUCT ENDPOINT
  app.post("/api/admin/add-product", requireAdmin, async (req, res) => {
    const ip = req.ip || "unknown";
    if (!adminDb) {
      return res.status(503).json({ error: "Serviço de banco de dados do Firebase Admin indisponível." });
    }

    const val = validateProductPayload(req.body);
    if (!val.isValid) {
      return res.status(400).json({ error: val.error });
    }

    try {
      const cleanProduct = {
        id: req.body.id || `prod-${Date.now()}`,
        title: sanitizeString(req.body.title),
        description: sanitizeString(req.body.description || `Peça curada premium do brechó Modivah.`),
        price: Math.abs(parseFloat(req.body.price)),
        originalPrice: req.body.originalPrice ? Math.abs(parseFloat(req.body.originalPrice)) : undefined,
        category: sanitizeString(req.body.category),
        size: sanitizeString(req.body.size || "M"),
        brand: sanitizeString(req.body.brand),
        condition: sanitizeString(req.body.condition || "Excelente"),
        material: sanitizeString(req.body.material || "Tecido Nobre"),
        image: req.body.image, // sanitized reference url
        images: Array.isArray(req.body.images) ? req.body.images : [],
        video: req.body.video ? String(req.body.video) : undefined,
        status: sanitizeString(req.body.status || "available"),
        stock: isNaN(parseInt(req.body.stock)) ? 1 : Math.max(0, parseInt(req.body.stock)),
        tag: req.body.tag ? sanitizeString(req.body.tag) : undefined,
        sku: req.body.sku ? sanitizeString(req.body.sku) : `M-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString()
      };

      await adminDb.collection("products").doc(cleanProduct.id).set(cleanProduct);
      auditLog("CADASTRO_PRODUTO", ip, `Produto Cadastrado: ${cleanProduct.title} (ID: ${cleanProduct.id})`);
      return res.json({ success: true, product: cleanProduct });
    } catch (e: any) {
      console.error("[Admin API Create Fail]", e);
      return res.status(500).json({ error: "Erro interno ao cadastrar produto no Firestore.", details: e.message });
    }
  });

  // UPDATE PRODUCT DETAILS ENDPOINT
  app.post("/api/admin/update-product", requireAdmin, async (req, res) => {
    const ip = req.ip || "unknown";
    if (!adminDb) return res.status(503).json({ error: "Serviço de banco de dados inacessível." });

    const val = validateProductPayload(req.body);
    if (!val.isValid) return res.status(400).json({ error: val.error });

    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID do produto ausente." });

    try {
      const cleanProduct: any = {
        id: id,
        title: sanitizeString(req.body.title),
        description: sanitizeString(req.body.description),
        price: Math.abs(parseFloat(req.body.price)),
        originalPrice: req.body.originalPrice ? Math.abs(parseFloat(req.body.originalPrice)) : null,
        category: sanitizeString(req.body.category),
        size: sanitizeString(req.body.size || "M"),
        brand: sanitizeString(req.body.brand),
        condition: sanitizeString(req.body.condition || "Excelente"),
        material: sanitizeString(req.body.material || "Tecido Nobre"),
        image: req.body.image,
        images: Array.isArray(req.body.images) ? req.body.images : [],
        video: req.body.video ? String(req.body.video) : null,
        status: sanitizeString(req.body.status || "available"),
        stock: isNaN(parseInt(req.body.stock)) ? 1 : Math.max(0, parseInt(req.body.stock)),
        tag: req.body.tag ? sanitizeString(req.body.tag) : null,
        sku: req.body.sku ? sanitizeString(req.body.sku) : ""
      };

      // Filter out null / empty fields
      Object.keys(cleanProduct).forEach(key => {
        if (cleanProduct[key] === null || cleanProduct[key] === undefined) {
          delete cleanProduct[key];
        }
      });

      await adminDb.collection("products").doc(id).set(cleanProduct, { merge: true });
      auditLog("ATUALIZACAO_PRODUTO", ip, `Produto Editado: ${cleanProduct.title} (ID: ${cleanProduct.id})`);
      return res.json({ success: true, product: cleanProduct });
    } catch (e: any) {
      console.error("[Admin API Update Fail]", e);
      return res.status(500).json({ error: "Erro interno ao atualizar os dados do produto.", details: e.message });
    }
  });

  // UPDATE STATUS ENDPOINT
  app.post("/api/admin/update-status", requireAdmin, async (req, res) => {
    const ip = req.ip || "unknown";
    const { productId, status } = req.body;
    if (!productId || !status) {
      return res.status(400).json({ error: "ID do produto e status são campos obrigatórios." });
    }

    const allowedStatus = ["available", "reserved", "sold"];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ error: "Status inválido." });
    }

    if (!adminDb) return res.status(503).json({ error: "Serviço indisponível." });

    try {
      await adminDb.collection("products").doc(productId).update({ status });
      auditLog("STATUS_PRODUTO_ATUALIZADO", ip, `ID: ${productId} -> Novo Status: ${status}`);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: "Não foi possível alterar o status do produto.", details: e.message });
    }
  });

  // UPDATE PRICE ENDPOINT
  app.post("/api/admin/update-price", requireAdmin, async (req, res) => {
    const ip = req.ip || "unknown";
    const { productId, price } = req.body;
    if (!productId || price === undefined) {
      return res.status(400).json({ error: "Campos ID do produto e valor novos são obrigatórios." });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: "Valor numérico inválido." });
    }

    if (!adminDb) return res.status(503).json({ error: "Serviço indisponível." });

    try {
      await adminDb.collection("products").doc(productId).update({ price: parsedPrice });
      auditLog("PRECO_PRODUTO_ATUALIZADO", ip, `ID: ${productId} -> Novo Preço: R$ ${parsedPrice}`);
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: "Erro ao atualizar valor.", details: e.message });
    }
  });

  // DELETE PRODUCT
  app.post("/api/admin/delete-product", requireAdmin, async (req, res) => {
    const ip = req.ip || "unknown";
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "ID do produto obrigatório." });

    if (!adminDb) return res.status(503).json({ error: "Serviço indisponível." });

    // Helper to delete associated file
    const deleteUploadFile = (url: string) => {
      if (typeof url === 'string' && url.includes('/uploads/')) {
        try {
          const parts = url.split('/uploads/');
          const filename = parts[parts.length - 1];
          if (filename) {
            const filePath = path.join(process.cwd(), "uploads", filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`[Delete System] Associated upload file deleted successfully: ${filePath}`);
            }
          }
        } catch (err: any) {
          console.error(`[Delete System Error] Failed to delete file for url ${url}:`, err.message);
        }
      }
    };

    try {
      // Fetch product to find associated images to delete
      const prodDoc = await adminDb.collection("products").doc(productId).get();
      if (prodDoc.exists) {
        const productData = prodDoc.data();
        if (productData) {
          // Main image
          if (productData.image) {
            deleteUploadFile(productData.image);
          }
          // Additional images
          if (Array.isArray(productData.images)) {
            productData.images.forEach((imgUrl: any) => deleteUploadFile(imgUrl));
          }
        }
      }

      await adminDb.collection("products").doc(productId).delete();
      auditLog("DELECAO_PRODUTO", ip, `Produto Deletado: ID ${productId}`);
      return res.json({ success: true });
    } catch (e: any) {
      console.error("[Delete Product API Error]", e);
      return res.status(500).json({ error: "Não foi possível remover o produto.", details: e.message });
    }
  });

  // FACTORY RESET INTEGRATED API ROUTE
  app.post("/api/admin/reset-database", requireAdmin, async (req, res) => {
    const ip = req.ip || "unknown";
    if (!adminDb) return res.status(503).json({ error: "Banco offline." });

    try {
      // 1. Fetch current list to clean up
      const currentProducts = await adminDb.collection("products").get();
      const batchClear = adminDb.batch();
      currentProducts.forEach(doc => {
        batchClear.delete(doc.ref);
      });
      await batchClear.commit();

      // 2. Load clean initial static dataset
      const batchSeed = adminDb.batch();
      INITIAL_PRODUCTS.forEach(p => {
        const docRef = adminDb!.collection("products").doc(p.id);
        batchSeed.set(docRef, p);
      });
      await batchSeed.commit();

      auditLog("RESTAURO_TOTAL_ESTOQUE", ip, "Configuração de fábrica do brechó restaurada.");
      return res.json({ success: true, message: "Banco de dados restaurado e semeado com sucesso." });
    } catch (e: any) {
      console.error("[Factory Reset Failure]", e);
      return res.status(500).json({ error: "Não foi possível redefinir o banco de dados.", details: e.message });
    }
  });

  // REST RESTRICTED ATTESTED FILE UPLOAD DIRECTLY ON DISK (15MB BOUNDS WITH TYPES SANITIZERS)
  app.post("/api/upload-file", async (req: express.Request, res: express.Response) => {
    const ip = req.ip || "unknown";
    try {
      // Validates presence of correct auth Authorizationheader
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Upload negado. Falha na autenticação administrativa." });
      }
      
      const token = authHeader.split(" ")[1];
      try {
        const secret = getJWTSecret();
        jwt.verify(token, secret);
      } catch (e) {
        return res.status(401).json({ error: "Sessão inválida ou expirada. Não foi possível autenticar o upload." });
      }

      const { filename, base64 } = req.body;
      if (!filename || !base64) {
        return res.status(400).json({ error: "Os campos 'filename' e 'base64' são dados necessários." });
      }

      // Check strictly against physical sizes calculated inside backend boundary limits (15MB)
      const approxSizeBytes = Math.round((base64.length * 3) / 4);
      const limitBytes = 15 * 1024 * 1024; // Strict 15MB size limitation ceiling
      if (approxSizeBytes > limitBytes) {
        return res.status(413).json({ error: "Arquivo muito grande. O limite máximo de upload é 15MB." });
      }

      // Extract details and double-check extensions constraints against dangerous scripts
      const fileExt = path.extname(filename).toLowerCase();
      const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".mp4", ".mov", ".webm"];
      if (!allowedExtensions.includes(fileExt)) {
        return res.status(400).json({ error: `Formato de arquivo recursivamente perigoso ou proibido: '${fileExt}'` });
      }

      // MIME Type and integrity validation
      if (!base64.startsWith("data:")) {
        return res.status(400).json({ error: "O arquivo enviado não possui cabeçalhos válidos de dados em Base64." });
      }

      const mimeTypeMatch = base64.match(/^data:([^;]+);base64,/);
      if (!mimeTypeMatch) {
         return res.status(400).json({ error: "Estrutura MIME inválida no Base64." });
      }
      const mimeType = mimeTypeMatch[1];
      const allowedMimes = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
      if (!allowedMimes.includes(mimeType)) {
        return res.status(400).json({ error: `Identidade MIME de suporte não homologada: '${mimeType}'` });
      }

      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Decode Base64 safe Buffer
      const parts = base64.split(";base64,");
      const buffer = Buffer.from(parts[1] || "", "base64");

      // Normalize naming schema strictly against malicious path traversals (e.g., ../../../etc)
      const baseName = path.basename(filename, fileExt).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const uniqueFilename = `${baseName}-${Date.now()}${fileExt}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      fs.writeFileSync(filePath, buffer);
      auditLog("UPLOAD_ARQUIVO", ip, `Upload efetuado: ${uniqueFilename} (${(approxSizeBytes / 1024 / 1024).toFixed(2)} MB)`);

      return res.json({ url: `/uploads/${uniqueFilename}` });
    } catch (err: any) {
      console.error("[Upload API Error]", err);
      // Fail-safe generic error response hiding details of the system paths
      return res.status(500).json({ error: "Erro grave ao decodificar e processar o arquivo no servidor." });
    }
  });

  // Serve static uploads folder
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // POST endpoint for AI Stylist interaction
  app.post("/api/chat-stylist", async (req, res) => {
    try {
      const { message, history, products } = req.body;

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "O campo 'message' é obrigatório." });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      // Lazy initialization of Gemini API Client
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        console.warn("[Modivah Stylist] GEMINI_API_KEY is not defined. Using stylist simulation response.");
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

      const systemInstruction = `Você é a Personal Stylist oficial e Inteligência Artificial do "MODIVAH BRECHÓ" (Estilo Premium), um brechó de ultra luxo e curadoria premium de marcas chiques.
Seu nome é "Mô IA" (ou "Mô"). Você possui todo o conhecimento enciclopédico de moda, tendências, tecidos, história das grifes, coloração pessoal e etiqueta, funcionando exatamente de forma inteligente e interativa como o ChatGPT, mas com uma personalidade refinada, calorosa, confiante e extremamente chique (estilo de consultora de alta moda de São Paulo ou Rio de Janeiro).

Sua missão é tripla:
1. Interagir de forma inteligente, empática e responder a QUALQUER pergunta que a cliente fizer tal como o ChatGPT (histórias de marcas, dúvidas de caimento, paletas de cores, conselhos gerais de estilo, combinações, ou conversas casuais), sem nunca dizer que "não sabe" ou que "é apenas uma IA de brechó". Mostre profunda inteligência em tudo!
2. Sugerir combinações requintadas e looks perfeitos usando, sempre que possível, as peças reais listadas em nosso estoque atual (inventário).
3. Quando recomendar peças físicas de nosso inventário, use obrigatoriamente a referência de ID em colchetes assim: [prod-XXXX] (ex: [prod-17169123456]) no corpo do texto para que o sistema renderize as peças interativas abaixo da conversa.

INVENTÁRIO ATUAL DO BRECHÓ:
${inventoryString || "Atualmente não há peças listadas no inventário."}

REGRAS DE RESPOSTA & TOM:
- Responda em Português (pt-BR) de forma educada, acolhedora e confiante. Prefira termos sofisticados e autênticos como "elegante", "sofisticada", "chique", "atemporal" (e evite apelidos comuns).
- Se a cliente pedir sugestões para um evento/estilo e houver peças compatíveis, recomende de 1 a 3 peças do nosso acervo com entusiasmo real.
- Se ela pedir uma peça que não temos, use seu profundo conhecimento do ChatGPT para dar dicas gerais maravilhosas e depois relacione com a peça mais próxima e elegante que possamos oferecer.
- Suas respostas devem possuir um design visual elegante em Markdown, com parágrafos bem espaçados, negritos estratégicos e listas limpas com emojis refinados.`;

      const formattedContents: any[] = [];
      
      if (history && Array.isArray(history)) {
        history.slice(-10).forEach((msg: any) => {
          formattedContents.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: String(msg.text) }]
          });
        });
      }

      formattedContents.push({
        role: "user",
        parts: [{ text: String(message) }]
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
      console.error("[Modivah Stylist Error]", error.message);
      return res.status(500).json({ 
        error: "Erro de processamento no atelier de estilo."
      });
    }
  });

  // POST endpoint for AI virtual try-on simulation
  app.post("/api/simulate-look", async (req, res) => {
    try {
      const { product, faceImage, selectedHair } = req.body;
      if (!product) {
        return res.status(400).json({ error: "O produto é obrigatório para a simulação." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
        console.warn("[Modivah Simulator] GEMINI_API_KEY is not defined. Using elegant local simulation response.");
        const simulatedText = simulateSimulationResponse(product, selectedHair);
        return res.json({ text: simulatedText });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const contentsParts: any[] = [];
      
      if (faceImage && typeof faceImage === "string" && faceImage.startsWith("data:image")) {
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
      console.error("[Modivah Simulator Error]", error.message);
      return res.status(500).json({ 
        error: "Erro ao processar simulação estilística no provador virtual."
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("[Production Mode] Static asset serving active.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running securely on port ${PORT}...`);
  });
}

// Simulated fallback if GEMINI_API_KEY key is unconfigured
function simulateStylistResponse(message: string, products: any[]): string {
  const query = message.toLowerCase();
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
Investir na circularidade premium com uma peça inteiramente curada e circular **${brand}** é a expressão mais pura de consumo inteligente, elegância atemporal e sustentabilidade de luxo! Você está absolutamente perfeita.`;
}

startServer().catch((err) => {
  console.error("Express failed to start:", err);
});
