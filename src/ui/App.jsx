import { useState, useRef, useReducer } from 'preact/hooks';
import { startSession } from './session.js';
import { SetupScreen } from './screens/SetupScreen.jsx';
import { GameScreen } from './screens/GameScreen.jsx';
import { FinalScreen } from './screens/FinalScreen.jsx';

/* The sim core mutates the game object in place, so the session lives in a ref
   and update(fn) runs the change then forces a re-render. */
export function App() {
  const [screen, setScreen] = useState('setup');
  const session = useRef(null);
  const [, rerender] = useReducer(x => x + 1, 0);
  const update = fn => { fn(session.current); rerender(); };

  const start = opts => { session.current = startSession(opts); setScreen('game'); window.scrollTo(0, 0); };
  const restart = () => { session.current = null; setScreen('setup'); window.scrollTo(0, 0); };

  if (screen === 'setup') return <SetupScreen onStart={start} />;
  if (screen === 'final') return <FinalScreen s={session.current} onRestart={restart} />;
  return <GameScreen s={session.current} update={update} onFinal={() => { setScreen('final'); window.scrollTo(0, 0); }} />;
}
