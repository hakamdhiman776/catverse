import { useCallback, useEffect, useRef } from 'react';

const SOUND_SRC = '/sounds/cat-sound.mp3';
const VOLUME = 0.65;

type AudioContextConstructor = typeof AudioContext;

type ScheduledPlayback = {
  source: AudioBufferSourceNode;
  startsAt: number;
};

let audioContext: AudioContext | null = null;
let bufferPromise: Promise<AudioBuffer | null> | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioContext && audioContext.state !== 'closed') return audioContext;

  const ContextClass =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext;

  if (!ContextClass) return null;

  audioContext = new ContextClass();
  return audioContext;
}

function loadBuffer(context: AudioContext): Promise<AudioBuffer | null> {
  if (!bufferPromise) {
    bufferPromise = fetch(SOUND_SRC)
      .then((response) => (response.ok ? response.arrayBuffer() : null))
      .then((data) => (data ? context.decodeAudioData(data) : null))
      .catch(() => null);
  }

  return bufferPromise;
}

export function useCatSound() {
  const scheduledRef = useRef<ScheduledPlayback | null>(null);

  useEffect(() => {
    const context = getAudioContext();
    if (context) void loadBuffer(context);

    return () => {
      const scheduled = scheduledRef.current;
      if (scheduled) {
        scheduled.source.stop();
        scheduledRef.current = null;
      }
    };
  }, []);

  return useCallback((delay = 0) => {
    const context = getAudioContext();
    if (!context) return;

    void context.resume();

    const scheduled = scheduledRef.current;
    if (scheduled && context.currentTime < scheduled.startsAt) {
      scheduled.source.stop();
    }
    scheduledRef.current = null;

    void loadBuffer(context).then((buffer) => {
      if (!buffer) return;

      const source = context.createBufferSource();
      const gain = context.createGain();
      gain.gain.value = VOLUME;
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(context.destination);

      const startsAt = context.currentTime + Math.max(delay, 0);
      source.start(startsAt);
      scheduledRef.current = { source, startsAt };

      source.onended = () => {
        if (scheduledRef.current?.source === source) {
          scheduledRef.current = null;
        }
      };
    });
  }, []);
}
