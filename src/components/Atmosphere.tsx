import { useMemo, type CSSProperties } from 'react';

type DustParticle = {
  id: number;
  left: string;
  top: string;
  size: string;
  opacity: number;
  duration: string;
  delay: string;
  driftX: string;
  driftY: string;
};

const DUST_COUNT = 28;

function createDust(): DustParticle[] {
  return Array.from({ length: DUST_COUNT }, (_, index) => ({
    id: index,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: `${1 + Math.random() * 2.2}px`,
    opacity: 0.12 + Math.random() * 0.45,
    duration: `${12 + Math.random() * 20}s`,
    delay: `-${Math.random() * 24}s`,
    driftX: `${(Math.random() - 0.5) * 46}px`,
    driftY: `${-22 - Math.random() * 56}px`,
  }));
}

export function Atmosphere() {
  const dust = useMemo(createDust, []);

  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="orb orb-warm" />
      <div className="orb orb-cool" />
      <div className="ambient-center" />
      <div className="vignette" />

      <div className="dust-layer">
        {dust.map((particle) => (
          <span
            key={particle.id}
            className="dust"
            style={
              {
                left: particle.left,
                top: particle.top,
                width: particle.size,
                height: particle.size,
                '--dust-opacity': particle.opacity,
                '--dust-duration': particle.duration,
                '--dust-delay': particle.delay,
                '--dust-drift-x': particle.driftX,
                '--dust-drift-y': particle.driftY,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="grain" />
    </div>
  );
}
