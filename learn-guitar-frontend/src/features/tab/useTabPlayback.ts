import { useEffect, useRef, useState, useCallback } from 'react';
import { TAB_STRINGS } from './tab.types';
import type { TabDetectionResult, TabStaff } from './tab.types';

export type PlaybackState = 'stopped' | 'playing' | 'paused';

const STRING_NOTES: Record<string, number[]> = {
  e: [64, 59, 55, 50, 45, 40, 35, 30],
  B: [71, 66, 59, 54, 49, 44, 38],
  G: [79, 74, 67, 62, 57, 52, 47],
  D: [86, 81, 74, 69, 64, 59, 54],
  A: [93, 88, 81, 76, 71, 66, 60],
  E: [100, 95, 88, 83, 78, 71, 67],
};

function getNoteMidi(stringLabel: string, fret: number): number {
  const baseNotes = STRING_NOTES[stringLabel] ?? [60];
  const base = baseNotes[0];
  return base + fret;
}

interface PlaybackConfig {
  result: TabDetectionResult;
  tempo: number;
  onTick: (staffIndex: number, eventIndex: number) => void;
  onEnd: () => void;
}

export function useTabPlayback(configRef: React.MutableRefObject<PlaybackConfig | null>) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [currentTick, setCurrentTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const currentEventRef = useRef<number>(0);
  const configRefInternal = useRef(configRef.current);
  configRefInternal.current = configRef.current;

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playNote = useCallback((midi: number, startTime: number, duration: number) => {
    const ctx = getAudioContext();
    const freq = 440 * Math.pow(2, (midi - 69) / 12);

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(2000, startTime);
    filterNode.frequency.exponentialRampToValueAtTime(300, startTime + duration * 0.8);

    const attackTime = 0.008;
    const releaseTime = Math.min(0.05, duration * 0.3);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.22, startTime + attackTime);
    gainNode.gain.setValueAtTime(0.22, startTime + duration - releaseTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  }, [getAudioContext]);

  const stopAll = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setPlaybackState('stopped');
    setCurrentTick(0);
    currentEventRef.current = 0;
    pausedAtRef.current = 0;
  }, []);

  const play = useCallback(() => {
    const cfg = configRefInternal.current;
    if (!cfg) return;

    const { tempo } = cfg;
    const beatDuration = 60000 / tempo;
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (pausedAtRef.current > 0) {
      startTimeRef.current = now - pausedAtRef.current;
      currentEventRef.current = pausedAtRef.current;
      pausedAtRef.current = 0;
    } else {
      startTimeRef.current = now;
      currentEventRef.current = 0;
    }

    setPlaybackState('playing');

    const tickFn = () => {
      const cfg2 = configRefInternal.current;
      if (!cfg2) return;

      const allStaffs = cfg2.result.staffs;
      let totalEvents = 0;
      for (const s of allStaffs) totalEvents += s.events.length;
      const startEvent = currentEventRef.current;

      if (startEvent >= totalEvents) {
        stopAll();
        cfg2.onEnd();
        return;
      }

      const tickMs: number = Date.now();
      void tickMs;

      let globalEventIdx = 0;
      let foundCurrentEvent = false;

      for (let si = 0; si < allStaffs.length && !foundCurrentEvent; si++) {
        for (let ei = 0; ei < allStaffs[si].events.length; ei++, globalEventIdx++) {
          if (globalEventIdx === startEvent) {
            foundCurrentEvent = true;
            break;
          }
        }
      }

      const now2 = ctx.currentTime;
      for (let si = 0; si < allStaffs.length; si++) {
        const staff = allStaffs[si];
        for (let ei = 0; ei < staff.events.length; ei++) {
          const globalIdx = allStaffs.slice(0, si).reduce((acc: number, s: TabStaff) => acc + s.events.length, 0) + ei;
          if (globalIdx < startEvent) continue;
          const event = staff.events[ei];
          const fretMap = event.string_fret_map ?? {};
          const noteStartTime = now2 + ((globalIdx - startEvent) * beatDuration) / 1000;
          const noteDuration = (beatDuration * 0.9) / 1000;

          for (const stringLabel of TAB_STRINGS) {
            const fret = fretMap[stringLabel];
            if (fret !== undefined && fret !== null) {
              const midi = getNoteMidi(stringLabel, fret as number);
              playNote(midi, noteStartTime, noteDuration);
            }
          }
        }
      }

      const onTick = cfg2.onTick;
      const updateTick = () => {
        const cfg3 = configRefInternal.current;
        if (!cfg3 || !audioCtxRef.current) return;
        const elapsedMs = (audioCtxRef.current.currentTime - now2) * 1000;
        const totalElapsedMs = (globalEventIdx - startEvent) * beatDuration + elapsedMs;
        const currentGlobal = startEvent + Math.floor(totalElapsedMs / beatDuration);
        setCurrentTick(currentGlobal);
        onTick(0, currentGlobal);

        if (currentGlobal >= totalEvents) {
          stopAll();
          cfg3.onEnd();
          return;
        }

        const remainingMs = beatDuration - (totalElapsedMs % beatDuration);
        rafRef.current = requestAnimationFrame(() => {
          setTimeout(updateTick, Math.max(0, remainingMs - 16));
        });
      };

      rafRef.current = requestAnimationFrame(updateTick);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    tickFn();
  }, [getAudioContext, playNote, stopAll]);

  const pause = useCallback(() => {
    if (playbackState !== 'playing') return;
    if (audioCtxRef.current) {
      pausedAtRef.current = currentEventRef.current;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setPlaybackState('paused');
  }, [playbackState]);

  const resume = useCallback(() => {
    if (playbackState !== 'paused') return;
    play();
  }, [playbackState, play]);

  const stop = useCallback(() => {
    pausedAtRef.current = 0;
    currentEventRef.current = 0;
    stopAll();
  }, [stopAll]);

  const seekTo = useCallback((eventIndex: number) => {
    const wasPlaying = playbackState === 'playing';
    if (wasPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
    pausedAtRef.current = eventIndex;
    currentEventRef.current = eventIndex;
    setCurrentTick(eventIndex);

    const cfg = configRefInternal.current;
    if (cfg) {
      let staffIdx = 0;
      let remaining = eventIndex;
      for (let si = 0; si < cfg.result.staffs.length; si++) {
        if (remaining < cfg.result.staffs[si].events.length) {
          staffIdx = si;
          break;
        }
        remaining -= cfg.result.staffs[si].events.length;
      }
      cfg.onTick(staffIdx, remaining);
    }

    if (wasPlaying) {
      const cfg2 = configRefInternal.current;
      if (cfg2) {
        startTimeRef.current = audioCtxRef.current?.currentTime ?? 0;
        const delay = 50;
        setTimeout(() => play(), delay);
      }
    }
  }, [playbackState, play]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  const totalEvents = configRef.current?.result.staffs.reduce((s: number, st: TabStaff) => s + st.events.length, 0) ?? 0;

  return {
    playbackState,
    currentTick,
    totalEvents,
    play,
    pause,
    resume,
    stop,
    seekTo,
    playNote,
    getAudioContext,
  };
}

export type { PlaybackConfig };
