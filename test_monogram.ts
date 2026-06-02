import { Jimp } from 'jimp';
import * as path from 'path';

async function scan() {
  const files = [
    'src/assets/images/modivah_official_icon_1780357423680.png',
    'src/assets/images/modivah_app_icon_1779927087425.png'
  ];

  for (const f of files) {
    const fullPath = path.join(process.cwd(), f);
    try {
      const img = await Jimp.read(fullPath);
      console.log(`\n=== SCanning ${f} ===`);
      
      // Let's count some color families:
      // Goldish/Yellow: R > 150, G > 100, B < 100
      // Black/Dark: R < 40, G < 40, B < 40
      // White/Very Light: R > 240, G > 240, B > 240
      let gold = 0, black = 0, white = 0, other = 0;
      
      const width = img.bitmap.width;
      const height = img.bitmap.height;
      const step = 4; // Sample every 4th pixel for speed
      
      for (let y = 0; y < height; y += step) {
        for (let x = 0; x < width; x += step) {
          const color = img.getPixelColor(x, y);
          const r = (color >> 24) & 0xFF;
          const g = (color >> 16) & 0xFF;
          const b = (color >> 8) & 0xFF;
          const a = color & 0xFF; // transparency

          if (r > 160 && g > 110 && b < 110) {
            gold++;
          } else if (r < 30 && g < 30 && b < 30) {
            black++;
          } else if (r > 240 && g > 240 && b > 240) {
            white++;
          } else {
            other++;
          }
        }
      }
      
      console.log(`Sampled pixels status:`);
      console.log(`- Gold-ish: ${gold}`);
      console.log(`- Black-ish: ${black}`);
      console.log(`- White-ish: ${white}`);
      console.log(`- Other: ${other}`);
    } catch (err: any) {
      console.error(`Error with ${f}:`, err.message);
    }
  }
}

scan();
