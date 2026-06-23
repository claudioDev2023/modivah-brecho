import fs from 'fs';
import path from 'path';

const distDir = 'dist/catalog-images';
if (!fs.existsSync(distDir)) {
  console.log(`Error: build directory ${distDir} does not exist!`);
  process.exit(1);
}

const files = fs.readdirSync(distDir);
console.log(`Success: dist/catalog-images exists and contains ${files.length} files.`);

let totalSize = 0;
files.forEach(f => {
  const filePath = path.join(distDir, f);
  const stats = fs.statSync(filePath);
  totalSize += stats.size;
});
console.log(`Total build image size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
