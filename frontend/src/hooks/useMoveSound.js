import { useRef } from 'react';

export function useMoveSound() {
  const audioContextRef = useRef(null);

  function getAudioContext() {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        return null;
      }

      audioContextRef.current = new AudioContextClass();
    }

    return audioContextRef.current;
  }

  function playTone(frequency, duration, type = 'sine', gainValue = 0.05) {
    const audioContext = getAudioContext();

    if (!audioContext) {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.value = gainValue;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();

    gainNode.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + duration
    );
    oscillator.stop(audioContext.currentTime + duration);
  }

  function playMove() {
    playTone(420, 0.12, 'triangle', 0.045);
  }

  function playFinish() {
    playTone(660, 0.12, 'sine', 0.04);
    window.setTimeout(() => playTone(880, 0.18, 'sine', 0.04), 110);
  }

  return {
    playFinish,
    playMove,
  };
}
