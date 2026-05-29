import fs from "fs";
import path from "path";
import type { Product } from "./src/types";

const DATA_DIR = path.join(process.cwd(), "data");
const CATALOG_FILE = path.join(DATA_DIR, "products-catalog.json");

export function ensureCatalogFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadCatalogFromDisk(): Product[] {
  ensureCatalogFile();
  if (!fs.existsSync(CATALOG_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(CATALOG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => p && typeof p.id === "string") as Product[];
  } catch (e) {
    console.error("[CatalogStore] Falha ao ler catálogo em disco:", e);
    return [];
  }
}

export function saveCatalogToDisk(products: Product[]): void {
  ensureCatalogFile();
  const sorted = sortProductsByDate(products);
  fs.writeFileSync(CATALOG_FILE, JSON.stringify(sorted, null, 2), "utf-8");
}

export function sortProductsByDate(products: Product[]): Product[] {
  return [...products].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function mergeProductLists(...lists: Product[][]): Product[] {
  const map = new Map<string, Product>();
  for (const list of lists) {
    for (const p of list) {
      if (!p?.id) continue;
      const prev = map.get(p.id);
      if (!prev) {
        map.set(p.id, p);
        continue;
      }
      const prevTime = new Date(prev.createdAt || 0).getTime();
      const nextTime = new Date(p.createdAt || 0).getTime();
      map.set(p.id, nextTime >= prevTime ? p : prev);
    }
  }
  return sortProductsByDate(Array.from(map.values()));
}

export function upsertProductOnDisk(product: Product): Product[] {
  const catalog = loadCatalogFromDisk();
  const idx = catalog.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    catalog[idx] = product;
  } else {
    catalog.unshift(product);
  }
  saveCatalogToDisk(catalog);
  return catalog;
}

export function removeProductFromDisk(productId: string): Product[] {
  const catalog = loadCatalogFromDisk().filter((p) => p.id !== productId);
  saveCatalogToDisk(catalog);
  return catalog;
}

export function replaceCatalogOnDisk(products: Product[]): Product[] {
  saveCatalogToDisk(products);
  return loadCatalogFromDisk();
}

/** Reduz payload para Firestore (limite ~1MB/doc). Mantém URLs; omite data URLs grandes. */
export function productForFirestore(product: Product): Product {
  const copy: Product = { ...product };

  if (copy.image?.startsWith("data:") && copy.image.length > 700_000) {
    const fallback =
      copy.images?.find((u) => u && !u.startsWith("data:")) ||
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800";
    copy.image = fallback;
  }

  if (Array.isArray(copy.images)) {
    copy.images = copy.images.filter(
      (u) => typeof u === "string" && (!u.startsWith("data:") || u.length < 400_000)
    );
  }

  if (copy.video?.startsWith("data:") && copy.video.length > 500_000) {
    delete copy.video;
  }

  return copy;
}

export function estimateProductPayloadSize(product: Product): number {
  try {
    return JSON.stringify(product).length;
  } catch {
    return 0;
  }
}
