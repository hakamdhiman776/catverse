import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { gsap } from 'gsap';
import { Atmosphere } from './components/Atmosphere';
import { CursorAura } from './components/CursorAura';
import { isCatReady } from './config/cats';
import { useCatApparition } from './hooks/useCatApparition';
import { useCatSound } from './hooks/useCatSound';
import './App.css';

type Ripple = {
  key: number;
  x: number;
  y: number;
};

const FIRST_SOUND_DELAY = 0.09;
const REPLACE_SOUND_DELAY = 0.22;

export default function App() {
  const { apparition, phase, summon, finishExit } = useCatApparition();
  const playCatSound = useCatSound();
  const [hasSummoned, setHasSummoned] = useState(false);
  const [ripple, setRipple] = useState<Ripple | null>(null);
  const [readyKey, setReadyKey] = useState<number | null>(null);

  const rippleKeyRef = useRef(0);
  const brandRef = useRef<HTMLElement | null>(null);
  const brandFadedRef = useRef(false);
  const catRef = useRef<HTMLDivElement | null>(null);
  const entryRef = useRef<gsap.core.Animation | null>(null);
  const idleRef = useRef<gsap.core.Tween[]>([]);
  const catContextRef = useRef<gsap.Context | null>(null);

  const reducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const apparitionKey = apparition?.key ?? null;
  const apparitionSrc = apparition?.cat.src ?? null;

  const spawnAt = useCallback(
    (x: number, y: number) => {
      playCatSound(apparition ? REPLACE_SOUND_DELAY : FIRST_SOUND_DELAY);
      summon(x, y);
      rippleKeyRef.current += 1;
      setRipple({ key: rippleKeyRef.current, x, y });
      setHasSummoned(true);
    },
    [apparition, playCatSound, summon],
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

  useLayoutEffect(() => {
    const element = brandRef.current;
    if (!element) return;

    const target = hasSummoned ? 0.55 : 1;

    if (reducedMotion) {
      gsap.set(element, { opacity: target });
      return;
    }

    if (!brandFadedRef.current) {
      brandFadedRef.current = true;
      const fade = gsap.fromTo(
        element,
        { opacity: 0 },
        { opacity: 1, duration: 1.2, delay: 0.15, ease: 'power2.out' },
      );
      return () => {
        fade.kill();
      };
    }

    const dim = gsap.to(element, {
      opacity: target,
      duration: 1.2,
      ease: 'power1.out',
    });

    return () => {
      dim.kill();
    };
  }, [hasSummoned, reducedMotion]);

  useLayoutEffect(() => {
    if (!apparitionKey || !apparitionSrc) {
      setReadyKey(null);
      return;
    }

    setReadyKey(isCatReady(apparitionSrc) ? apparitionKey : null);
  }, [apparitionKey, apparitionSrc]);

  useLayoutEffect(() => {
    if (!apparitionKey || !apparitionSrc || readyKey !== apparitionKey) return;

    const element = catRef.current;
    if (!element) return;

    const context = gsap.context(() => {
      gsap.set('.cat-glow', { xPercent: -50, yPercent: -50 });

      if (reducedMotion) {
        entryRef.current = gsap.to(element, {
          opacity: 1,
          duration: 0.2,
          ease: 'power1.out',
        });
        return;
      }

      const entry = gsap.timeline();
      entryRef.current = entry;

      entry
        .fromTo(
          element,
          { opacity: 0, scale: 0.72, y: 24 },
          { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: 'back.out(1.4)' },
        )
        .fromTo(
          '.cat-glow',
          { opacity: 0, scale: 0.6 },
          { opacity: 0.85, scale: 1, duration: 0.6, ease: 'power2.out' },
          0,
        )
        .fromTo(
          '.cat-ground',
          { opacity: 0 },
          { opacity: 1, duration: 0.4, ease: 'power1.out' },
          0.08,
        );

      const float = gsap.to('.cat-float', {
        y: -7,
        rotation: -0.4,
        duration: 2.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        paused: true,
      });

      const breathe = gsap.to('.cat-image', {
        scale: 1.018,
        duration: 2.3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        paused: true,
      });

      const glow = gsap.to('.cat-glow', {
        opacity: 0.95,
        scale: 1.06,
        duration: 3.1,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        paused: true,
      });

      idleRef.current = [float, breathe, glow];

      entry.eventCallback('onComplete', () => {
        float.play();
        breathe.play();
        glow.play();
      });
    }, element);

    catContextRef.current = context;

    return () => {
      entryRef.current = null;
      idleRef.current = [];
      context.revert();
      if (catContextRef.current === context) catContextRef.current = null;
    };
  }, [apparitionKey, apparitionSrc, readyKey, reducedMotion]);

  useLayoutEffect(() => {
    if (phase !== 'exiting') return;

    const element = catRef.current;
    if (!element) return;

    entryRef.current?.kill();
    entryRef.current = null;

    idleRef.current.forEach((tween) => tween.kill());
    idleRef.current = [];

    const exit = gsap.timeline({ onComplete: finishExit });
    exit.to(element, {
      opacity: 0,
      scale: 0.88,
      y: -10,
      duration: reducedMotion ? 0.12 : 0.2,
      ease: 'power2.in',
    });

    return () => {
      exit.kill();
    };
  }, [phase, finishExit, reducedMotion]);

  const showLoader = apparition !== null && readyKey !== apparition.key;

  return (
    <main
      className="stage"
      onPointerDown={handlePointerDown}
      onContextMenu={(event) => event.preventDefault()}
      aria-label="CATVERSE. Click or tap anywhere to reveal a cat."
    >
      <Atmosphere />
      <CursorAura />

      <header
        ref={brandRef}
        className={`brand${hasSummoned ? ' is-dimmed' : ''}`}
        aria-hidden="true"
      >
        TAP ANYWHERE AND SEE THE MAGIC ✨
      </header>

      {ripple && (
        <span
          key={`ripple-${ripple.key}`}
          className="ripple"
          style={{ left: ripple.x, top: ripple.y }}
          onAnimationEnd={() => setRipple(null)}
          aria-hidden="true"
        />
      )}

      {apparition && (
        <Fragment key={`cat-${apparition.key}`}>
          <div
            ref={catRef}
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
                onLoad={() => {
                  if (readyKey !== apparition.key) setReadyKey(apparition.key);
                }}
              />
            </div>
          </div>

          {showLoader && (
            <span
              className="cat-loader"
              style={{
                left: apparition.x + apparition.width / 2,
                top: apparition.y + apparition.height / 2,
              }}
              aria-hidden="true"
            />
          )}
        </Fragment>
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
