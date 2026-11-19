import { useCallback, useEffect } from 'react';

const SOUND_SRC = '/sounds/cat-sound.mp3';
const VOLUME = 0.65;

type AudioContextConstructor = typeof AudioContext;

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
  useEffect(() => {
    const context = getAudioContext();
    if (context) void loadBuffer(context);
  }, []);

  return useCallback(() => {
    const context = getAudioContext();
    if (!context) return;

    void context.resume();

    void loadBuffer(context).then((buffer) => {
      if (!buffer) return;

      const source = context.createBufferSource();
      const gain = context.createGain();
      gain.gain.value = VOLUME;
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(context.destination);
      source.start(0);
    });
  }, []);
}
