import { useEffect, useRef } from 'react';

export function CursorAura() {
  const auraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const aura = auraRef.current;
    if (!aura) return;

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight * 0.42;
    let currentX = targetX;
    let currentY = targetY;
    let frame = 0;

    const paint = () => {
      aura.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    };

    const handleMove = (event: PointerEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      aura.style.opacity = '1';
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.13;
      currentY += (targetY - currentY) * 0.13;
      paint();
      frame = window.requestAnimationFrame(tick);
    };

    paint();
    window.addEventListener('pointermove', handleMove, { passive: true });
    frame = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={auraRef} className="cursor-aura" aria-hidden="true" />;
}
