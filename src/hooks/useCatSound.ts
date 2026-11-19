import { useCallback, useEffect, useRef } from 'react';

const SOUND_SRC = '/sounds/cat-sound.mp3';
const VOLUME = 0.65;

export function useCatSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(SOUND_SRC);
    audio.preload = 'auto';
    audio.volume = VOLUME;
    audio.load();
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    };
  }, []);

  return useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.currentTime = 0;
      const playback = audio.play();
      if (playback) void playback.catch(() => undefined);
    } catch {
      return;
    }
  }, []);
}
