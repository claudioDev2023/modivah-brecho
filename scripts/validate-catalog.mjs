import fs from 'fs';
import path from 'path';

console.log('--- INICIANDO VALIDAÇÃO DO CATÁLOGO DE BACKUP ---');

const backupPath = path.resolve('public/products_real_backup.json');
const imagesDir = path.resolve('public/catalog-images');

if (!fs.existsSync(backupPath)) {
  console.error(`Erro: Arquivo do acervo não encontrado em: ${backupPath}`);
  process.exit(1);
}

let products;
try {
  const fileContent = fs.readFileSync(backupPath, 'utf8');
  products = JSON.parse(fileContent);
} catch (err) {
  console.error('Erro de Sintaxe no JSON! O JSON está corrompido:', err.message);
  process.exit(1);
}

if (!Array.isArray(products)) {
  console.error('Erro: O conteúdo do catálogo não é um Array válido.');
  process.exit(1);
}

console.log(`Catálogo carregado com sucesso. Total de produtos cadastrados: ${products.length}`);

let hasErrors = false;
const checkedImagesSet = new Set();

products.forEach((p, idx) => {
  const pid = p.id || `RefIndex-${idx}`;
  const prefix = `[Produto ID: ${pid} - "${p.title || 'Sem título'}"]`;

  // 1. Validar ID
  if (!p.id) {
    console.error(`${prefix} Erro: ID ausente.`);
    hasErrors = true;
  }

  // 2. Validar Title
  if (!p.title || typeof p.title !== 'string' || p.title.trim() === '') {
    console.error(`${prefix} Erro: O título não pode estar vazio.`);
    hasErrors = true;
  }

  // 3. Validar Price
  if (p.price === undefined || typeof p.price !== 'number' || isNaN(p.price) || p.price < 0) {
    console.error(`${prefix} Erro: Preço inválido (${p.price}). Deve ser um número maior ou igual a zero.`);
    hasErrors = true;
  }

  // 4. Validar Category
  if (!p.category || typeof p.category !== 'string' || p.category.trim() === '') {
    console.error(`${prefix} Erro: Categoria ausente ou inválida.`);
    hasErrors = true;
  }

  // 5. Validar Imagem Principal
  if (!p.image || typeof p.image !== 'string' || p.image.trim() === '') {
    console.error(`${prefix} Erro: Imagem principal ausente ou vazia.`);
    hasErrors = true;
  } else {
    // Se a imagem for uma referência local estática em /catalog-images/
    if (p.image.startsWith('/catalog-images/')) {
      const imgFileName = p.image.replace('/catalog-images/', '');
      const imgPhysicalPath = path.join(imagesDir, imgFileName);
      if (!fs.existsSync(imgPhysicalPath)) {
        console.error(`${prefix} Erro: Imagem referenciada não existe no disco: ${p.image}`);
        hasErrors = true;
      } else {
        checkedImagesSet.add(imgFileName);
      }
    } else if (p.image.startsWith('data:image/')) {
      console.error(`${prefix} Erro: Encontrado base64 gigante no campo 'image'. Todas as imagens devem ser convertidas arquivos locais.`);
      hasErrors = true;
    }
  }

  // 6. Validar Imagens Secundárias
  if (p.images && Array.isArray(p.images)) {
    p.images.forEach((img, subIdx) => {
      if (!img || typeof img !== 'string') {
        console.error(`${prefix} Erro: Link de imagem secundária inválido no índice ${subIdx}.`);
        hasErrors = true;
      } else if (img.startsWith('/catalog-images/')) {
        const imgFileName = img.replace('/catalog-images/', '');
        const imgPhysicalPath = path.join(imagesDir, imgFileName);
        if (!fs.existsSync(imgPhysicalPath)) {
          console.error(`${prefix} Erro: Imagem secundária referenciada não existe no disco: ${img}`);
          hasErrors = true;
        } else {
          checkedImagesSet.add(imgFileName);
        }
      } else if (img.startsWith('data:image/')) {
        console.error(`${prefix} Erro: Encontrado base64 gigante no array 'images' (índice ${subIdx}).`);
        hasErrors = true;
      }
    });
  }
});

// Alerta sobre arquivos órfãos na pasta catalog-images (arquivos que não pertencem a nenhum produto)
if (fs.existsSync(imagesDir)) {
  const physicalFiles = fs.readdirSync(imagesDir);
  const orphanCount = physicalFiles.filter(file => !checkedImagesSet.has(file)).length;
  if (orphanCount > 0) {
    console.log(`[Aviso] Encontrados ${orphanCount} arquivos de imagens órfãos no caminho catalog-images (não apontados pelo JSON atual).`);
  }
}

if (hasErrors) {
  console.error('\n❌ ERRO: O acervo possui inconsistências críticas. O build foi cancelado.');
  process.exit(1);
} else {
  console.log('\n✅ SUCESSO: Tudo perfeito! O catálogo de anúncios está 100% válido e consistente.');
  process.exit(0);
}
