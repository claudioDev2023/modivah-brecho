import fs from 'fs';

const path = 'audit_db_result.json';
if (!fs.existsSync(path)) {
  console.log("No audit_db_result.json found.");
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(path, 'utf8'));
const products = db.products || [];

console.log(`Total products in Firestore: ${products.length}`);

let base64Count = 0;
let pathCount = 0;
let otherCount = 0;

products.forEach((p, idx) => {
  const img = p.image || '';
  if (img.startsWith('data:image/')) {
    base64Count++;
  } else if (img.startsWith('/catalog-images/')) {
    pathCount++;
  } else {
    otherCount++;
  }
});

console.log(`Base64 images: ${base64Count}`);
console.log(`Path images (/catalog-images/...): ${pathCount}`);
console.log(`Other images: ${otherCount}`);

if (pathCount > 0) {
  console.log("\nSome paths:");
  products.filter(p => (p.image || '').startsWith('/catalog-images/')).slice(0, 5).forEach(p => {
    console.log(`  - ID: ${p.id} | Title: ${p.title} | Image: ${p.image}`);
  });
}

if (base64Count > 0) {
  console.log("\nSome base64 examples (size in chars):");
  products.filter(p => (p.image || '').startsWith('data:image/')).slice(0, 5).forEach(p => {
    console.log(`  - ID: ${p.id} | Title: ${p.title} | Base64 Length: ${p.image.length}`);
  });
}
