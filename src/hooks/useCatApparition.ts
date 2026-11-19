import { useCallback, useEffect, useRef, useState } from 'react';
import { CATS, type Cat } from '../config/cats';
import { placeCat, type Placement } from '../lib/layout';

export type CatPhase = 'entering' | 'exiting';

export type Apparition = Placement & {
  key: number;
  cat: Cat;
  anchorX: number;
  anchorY: number;
};

type PendingSummon = {
  anchorX: number;
  anchorY: number;
  catIndex: number;
};

export function useCatApparition() {
  const [apparition, setApparition] = useState<Apparition | null>(null);
  const [phase, setPhase] = useState<CatPhase>('entering');

  const activeRef = useRef<Apparition | null>(null);
  const pendingRef = useRef<PendingSummon | null>(null);
  const nextCatRef = useRef(0);
  const keyRef = useRef(0);

  const revealPending = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;

    pendingRef.current = null;
    const cat = CATS[pending.catIndex] ?? CATS[0];

    keyRef.current += 1;
    const next: Apparition = {
      key: keyRef.current,
      cat,
      anchorX: pending.anchorX,
      anchorY: pending.anchorY,
      ...placeCat(pending.anchorX, pending.anchorY, cat.aspectRatio),
    };

    activeRef.current = next;
    setApparition(next);
    setPhase('entering');
  }, []);

  const summon = useCallback(
    (anchorX: number, anchorY: number) => {
      const catIndex = nextCatRef.current;
      nextCatRef.current = (nextCatRef.current + 1) % CATS.length;
      pendingRef.current = { anchorX, anchorY, catIndex };

      if (!activeRef.current) {
        revealPending();
        return;
      }

      setPhase('exiting');
    },
    [revealPending],
  );

  const finishExit = useCallback(() => {
    if (!activeRef.current) return;

    activeRef.current = null;
    revealPending();
  }, [revealPending]);

  useEffect(() => {
    let frame = 0;

    const reposition = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const current = activeRef.current;
        if (!current) return;

        const next = {
          ...current,
          ...placeCat(current.anchorX, current.anchorY, current.cat.aspectRatio),
        };

        activeRef.current = next;
        setApparition(next);
      });
    };

    window.addEventListener('resize', reposition);
    window.addEventListener('orientationchange', reposition);

    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('orientationchange', reposition);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return { apparition, phase, summon, finishExit };
}
