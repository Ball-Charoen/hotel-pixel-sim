import { render } from 'preact';
import { App } from './ui/App.jsx';
import { getLang } from './i18n/index.js';
// Fonts are bundled so the game looks the same without internet (owner decision, 8 Oct 2026).
// Full weight files keep unicode-range, so the browser only downloads the Thai/Latin parts it needs.
import '@fontsource/ibm-plex-sans-thai/400.css';
import '@fontsource/ibm-plex-sans-thai/600.css';
import '@fontsource/ibm-plex-sans-thai/700.css';
import '@fontsource/vt323/400.css';
import './ui/styles/game.css';

// Every link that leaves the game opens in a new tab, so the running game is never replaced (owner request).
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || a.origin === location.origin) return;
  e.preventDefault();
  window.open(a.href, '_blank', 'noopener,noreferrer');
});

document.documentElement.lang = getLang();
render(<App />, document.getElementById('app'));
