import fs from 'fs';
import path from 'path';

const backupPath = 'public/products_real_backup.json';
if (!fs.existsSync(backupPath)) {
  console.log("No public/products_real_backup.json found.");
  process.exit(1);
}

const products = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
console.log(`Total products in backup: ${products.length}`);

let base64Count = 0;
let pathCount = 0;
let emptyImgCount = 0;
let missingImgFiles = [];
let otherCount = 0;

products.forEach((p, idx) => {
  const img = p.image || '';
  if (!img) {
    emptyImgCount++;
  } else if (img.startsWith('data:image/')) {
    base64Count++;
  } else if (img.startsWith('/catalog-images/')) {
    pathCount++;
    const localPath = path.join('public', img);
    if (!fs.existsSync(localPath)) {
      missingImgFiles.push({ id: p.id, title: p.title, path: img });
    }
  } else {
    otherCount++;
  }
});

console.log(`Base64 images: ${base64Count}`);
console.log(`Path images (/catalog-images/...): ${pathCount}`);
console.log(`Empty images: ${emptyImgCount}`);
console.log(`Other images: ${otherCount}`);
console.log(`Missing image files locally: ${missingImgFiles.length}`);

if (missingImgFiles.length > 0) {
  console.log("\nSome missing image files:");
  missingImgFiles.slice(0, 10).forEach(m => {
    console.log(`  - ID: ${m.id} | Title: ${m.title} | Path: ${m.path}`);
  });
}

console.log("\nFirst 10 products with images:");
products.slice(0, 10).forEach((p, idx) => {
  console.log(`  ${idx + 1}. [ID: ${p.id}] "${p.title}"`);
  console.log(`     Image: "${p.image}"`);
});
