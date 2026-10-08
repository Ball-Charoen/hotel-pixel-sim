import { render } from 'preact';
import { App } from './ui/App.jsx';
// Fonts are bundled so the game looks the same without internet (owner decision, 8 Oct 2026).
// Full weight files keep unicode-range, so the browser only downloads the Thai/Latin parts it needs.
import '@fontsource/ibm-plex-sans-thai/400.css';
import '@fontsource/ibm-plex-sans-thai/600.css';
import '@fontsource/ibm-plex-sans-thai/700.css';
import '@fontsource/vt323/400.css';
import './ui/styles/game.css';

render(<App />, document.getElementById('app'));
