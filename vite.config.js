import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  // Relative asset paths so the build also works from a GitHub Pages sub-folder.
  base: './',
  server: { port: 5173, strictPort: true },
  // Only scan the game entry; prototype/ is kept for reference and not bundled.
  optimizeDeps: { entries: ['index.html'] },
});
