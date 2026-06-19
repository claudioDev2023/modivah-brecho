import { FULL_MOCK_ACERVO } from "./src/data/fullMockAcervo";

const DEFAULT_CATEGORIES = [
  'Acessórios', 'Bermudas', 'Bijuterias', 'Blazers', 'Blusas', 'Bodys', 'Bolsas', 'Botas',
  'Calças', 'Calçados', 'Camisas', 'Camisetas', 'Cardigans', 'Carteiras', 'Casacos', 'Cintos',
  'Coletes', 'Conjuntos', 'Croppeds', 'Fitness', 'Infantil', 'Jaquetas', 'Jeans', 'Joias e Semijoias',
  'Lenços', 'Macacões', 'Macaquinhos', 'Malas e Mochilas', 'Masculino', 'Moda Praia', 'Moletons',
  'Óculos', 'Perfumes', 'Plus Size', 'Regatas', 'Relógios', 'Saias', 'Sandálias', 'Shorts', 'Suéteres',
  'Tênis', 'Trench Coats', 'Tricô e Crochê', 'Vestidos'
];

function getSingularDisplayName(trimmed: string): string {
  const lower = trimmed.toLowerCase();
  
  if (lower === 'acessórios') return 'Acessório';
  if (lower === 'bermudas') return 'Bermuda';
  if (lower === 'bijuterias') return 'Bijuteria';
  if (lower === 'blazers') return 'Blazer';
  if (lower === 'blusas') return 'Blusa';
  if (lower === 'bodys') return 'Body';
  if (lower === 'bolsas') return 'Bolsa';
  if (lower === 'botas') return 'Bota';
  if (lower === 'calças') return 'Calça';
  if (lower.startsWith('calçado')) return 'Sapato';
  if (lower === 'camisas') return 'Camisa';
  if (lower === 'camisetas') return 'Camiseta';
  if (lower === 'cardigans') return 'Casaco';
  if (lower === 'carteiras') return 'Carteira';
  if (lower === 'casacos') return 'Casaco';
  if (lower === 'cintos') return 'Cinto';
  if (lower === 'coletes') return 'Colete';
  if (lower === 'conjuntos') return 'Conjunto';
  if (lower === 'croppeds') return 'Cropped';
  if (lower === 'jaquetas') return 'Jaqueta';
  if (lower === 'jeans') return 'Jeans';
  if (lower === 'macacões') return 'Macacão';
  if (lower === 'macaquinhos') return 'Macaquinho';
  if (lower === 'saias') return 'Saia';
  if (lower === 'sandálias') return 'Sandália';
  if (lower === 'shorts') return 'Short';
  if (lower === 'suéteres') return 'Casaco';
  if (lower === 'tênis') return 'Sapato';
  if (lower === 'trench coats') return 'Casaco';
  if (lower === 'tricô e crochê') return 'Tricô';
  if (lower === 'vestidos') return 'Vestido';
  if (lower === 'sapatos') return 'Sapato';
  
  return trimmed;
}

function normalizeForGrouping(name: string): string {
  const singular = getSingularDisplayName(name);
  return singular
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const catSet = new Set(DEFAULT_CATEGORIES.map(c => normalizeForGrouping(c)));

console.log("CAT_SET:", Array.from(catSet));

const unmatched: any[] = [];
FULL_MOCK_ACERVO.forEach(p => {
  const norm = normalizeForGrouping(p.category);
  // check if any active category matches
  let found = false;
  for (const c of DEFAULT_CATEGORIES) {
    if (normalizeForGrouping(c) === norm) {
      found = true;
      break;
    }
  }
  if (!found) {
    unmatched.push(p);
  }
});

console.log("Unmatched count:", unmatched.length);
unmatched.forEach(p => {
  console.log(`Product: ${p.title}, Category: ${p.category}`);
});
