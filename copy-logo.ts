import * as fs from 'fs';
import * as path from 'path';

const baseDir = process.cwd();
const srcDir = path.join(baseDir, 'src', 'assets', 'images');
const publicDir = path.join(baseDir, 'public');
const iconsDir = path.join(publicDir, 'icons');

// Source logo files
const logoFile = 'modivah_logo_1779828536217.png';
const officialIconFile = 'modivah_official_icon_1780357423680.png';

const srcLogoPath = path.join(srcDir, logoFile);
const srcIconPath = path.join(srcDir, officialIconFile);

function copyFileSafe(src: string, dest: string) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied from ${src} to ${dest}`);
  } else {
    console.error(`Source file does not exist: ${src}`);
  }
}

// Ensure public directories exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy to various PWA / Favicon targets in public/ to replace any default "V" icons
copyFileSafe(srcLogoPath, path.join(publicDir, 'logo.png'));
copyFileSafe(srcLogoPath, path.join(publicDir, 'favicon.ico')); // Copying as favicon.ico (modern browsers accept PNG)
copyFileSafe(srcLogoPath, path.join(publicDir, 'favicon.png'));
copyFileSafe(srcIconPath, path.join(publicDir, 'icon-192.png'));
copyFileSafe(srcIconPath, path.join(publicDir, 'icon-512.png'));
copyFileSafe(srcIconPath, path.join(publicDir, 'apple-touch-icon.png'));

// Copy to PWA icons dir
const pwaSizes = ['192x192', '512x512', '128x128', '144x144', '152x152', '384x384', '48x48', '72x72', '96x96'];
pwaSizes.forEach(size => {
  copyFileSafe(srcIconPath, path.join(iconsDir, `icon-${size}.png`));
});

console.log('App identity assets replaced successfully.');
