/* The owner's finished PNGs in assets/sprites/ (names from assets/art-templates/README-TH.txt).
   Vite finds them at build time; if a file is missing, the game keeps using the placeholder art. */
const FILES = import.meta.glob('/assets/sprites/*.png', { eager: true, query: '?url', import: 'default' });

export const spriteUrl = name => FILES[`/assets/sprites/${name}`] || null;

const cache = {};
/* Promise of a loaded <img>, or null when the file isn't there. */
export function loadSprite(name) {
  const url = spriteUrl(name);
  if (!url) return Promise.resolve(null);
  if (!cache[name]) {
    cache[name] = new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }
  return cache[name];
}

/* Staff row in staff-sprites.png / staff-portraits.png: candidate c0..c7 -> row 0..7. */
export const staffRow = id => Number(String(id).replace(/\D/g, '')) % 8;
