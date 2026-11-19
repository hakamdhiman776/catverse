import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { Atmosphere } from './components/Atmosphere';
import { CursorAura } from './components/CursorAura';
import { useCatApparition } from './hooks/useCatApparition';
import { useCatSound } from './hooks/useCatSound';
import './App.css';

type Ripple = {
  key: number;
  x: number;
  y: number;
};

export default function App() {
  const { apparition, phase, summon } = useCatApparition();
  const playCatSound = useCatSound();
  const [hasSummoned, setHasSummoned] = useState(false);
  const [ripple, setRipple] = useState<Ripple | null>(null);
  const rippleKeyRef = useRef(0);

  const spawnAt = useCallback(
    (x: number, y: number) => {
      playCatSound();
      summon(x, y);
      rippleKeyRef.current += 1;
      setRipple({ key: rippleKeyRef.current, x, y });
      setHasSummoned(true);
    },
    [playCatSound, summon],
  );

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    spawnAt(event.clientX, event.clientY);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      spawnAt(window.innerWidth / 2, window.innerHeight / 2);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [spawnAt]);

  useEffect(() => {
    const preventGesture = (event: Event) => event.preventDefault();

    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
    };
  }, []);

  return (
    <main
      className="stage"
      onPointerDown={handlePointerDown}
      onContextMenu={(event) => event.preventDefault()}
      aria-label="CATVERSE. Click or tap anywhere to reveal a cat."
    >
      <Atmosphere />
      <CursorAura />

      <header className={`brand${hasSummoned ? ' is-dimmed' : ''}`} aria-hidden="true">
        CATVERSE
      </header>

      {ripple && (
        <span
          key={ripple.key}
          className="ripple"
          style={{ left: ripple.x, top: ripple.y }}
          onAnimationEnd={() => setRipple(null)}
          aria-hidden="true"
        />
      )}

      {apparition && (
        <div
          key={apparition.key}
          className={`cat-anchor ${phase === 'exiting' ? 'is-exiting' : 'is-entering'}`}
          style={{
            left: apparition.x,
            top: apparition.y,
            width: apparition.width,
            height: apparition.height,
          }}
          aria-hidden="true"
        >
          <div className="cat-glow" />
          <div className="cat-ground" />
          <div className="cat-float">
            <img
              className="cat-image"
              src={apparition.cat.src}
              alt=""
              draggable={false}
              decoding="async"
            />
          </div>
        </div>
      )}

      <div className={`hint${hasSummoned ? ' is-hidden' : ''}`} aria-hidden={hasSummoned}>
        <span className="hint-dot" />
        <span>tap anywhere</span>
      </div>

      <div className="sr-only" aria-live="polite">
        {apparition && phase !== 'exiting' ? `${apparition.cat.name} appeared.` : ''}
      </div>
    </main>
  );
}
