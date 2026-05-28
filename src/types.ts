export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string; // 'vestidos' | 'casacos' | 'blusas' | 'calcas' | 'acessorios' | 'sapatos'
  size: string; // '36' | '38' | '40' | 'P' | 'M' | 'G' | 'GG'
  brand: string; // e.g. 'Farm', 'Zara', 'Schutz', 'Animale', 'Le Lis Blanc'
  condition: 'Novo com Etiqueta' | 'Excelente' | 'Gentilmente Usado';
  material: string;
  image: string;
  images?: string[]; // Up to 10 images for gallery
  video?: string; // Link to video presentation
  status: 'available' | 'reserved' | 'sold';
  stock: number; // Quantity available
  tag?: string; // 'Premium' | 'Seda Pura' | 'Lã Italiana' | 'Couro Nobre' etc.
  sku?: string; // Standard unique identifier
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StylistMessage {
  id: string;
  sender: 'user' | 'stylist';
  text: string;
  timestamp: string;
  recommendedProductIds?: string[];
}
