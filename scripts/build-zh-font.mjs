// Build a small Traditional Chinese font containing only the characters the game uses.
// Run after changing src/i18n/zh-TW.json:  npm run font:zh
// Source: Noto Sans TC variable font (SIL OFL 1.1), downloaded to tools/font-src/ (not in git):
//   https://raw.githubusercontent.com/google/fonts/main/ofl/notosanstc/NotoSansTC%5Bwght%5D.ttf
import fs from 'node:fs';
import subsetFont from 'subset-font';

const SRC = new URL('../tools/font-src/NotoSansTC[wght].ttf', import.meta.url);
const OUT_DIR = new URL('../src/fonts/', import.meta.url);
// Same ranges as the @font-face unicode-range in src/ui/styles/game.css.
export const CJK = /[⺀-鿿　-〿豈-﫿＀-￯]/u;

if (!fs.existsSync(SRC)) {
  console.error('Missing tools/font-src/NotoSansTC[wght].ttf. Download it from the URL at the top of this file.');
  process.exit(1);
}

const text = fs.readFileSync(new URL('../src/i18n/zh-TW.json', import.meta.url), 'utf8');
const chars = [...new Set([...text].filter(c => CJK.test(c)))].sort().join('');

const woff2 = await subsetFont(fs.readFileSync(SRC), chars, {
  targetFormat: 'woff2',
  // Regular weight only (132 KB vs 235 KB for 400-700): browsers draw bold Chinese by thickening it.
  // Owner asked for the smallest file close to the English fonts (8 Oct 2026).
  variationAxes: { wght: 400 },
});

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(new URL('noto-sans-tc-subset.woff2', OUT_DIR), woff2);
fs.writeFileSync(new URL('noto-sans-tc-subset.chars.txt', OUT_DIR), chars + '\n');
console.log(`${[...chars].length} characters -> src/fonts/noto-sans-tc-subset.woff2 (${(woff2.length / 1024).toFixed(0)} KB)`);
