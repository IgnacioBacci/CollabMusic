'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Play, Square } from 'lucide-react';
import { INSTRUMENTS, NOTES_BY_INST, NOTE_DURATION, buildSynths } from './Sequencer';

const OVERLAP_STEPS = 8; // 1s at 120 bpm

export default function Player({ tracks }: { tracks: any[] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [totalSteps, setTotalSteps] = useState(0);
  const [grid, setGrid] = useState<boolean[][]>([]);
  const synthsRef = useRef<any>(null);

  useEffect(() => {
    synthsRef.current = buildSynths();
    return () => {
      if (synthsRef.current) {
        Object.values(synthsRef.current).forEach((s: any) => { try { s.dispose(); } catch {} });
      }
    };
  }, []);

  useEffect(() => {
    let cursor = 0;
    const offsets: number[] = [];

    tracks.forEach((track, idx) => {
      let payload: any = {};
      try { payload = JSON.parse(track.notesData || '{}'); } catch {}
      const stepsCount: number = payload.steps || 32;

      if (idx === 0) {
        offsets.push(0);
        cursor = stepsCount;
      } else {
        const overlap = Math.min(OVERLAP_STEPS, cursor);
        cursor -= overlap;
        offsets.push(cursor);
        cursor += stepsCount;
      }
    });

    const finalLength = cursor;
    setTotalSteps(finalLength);

    const newGrid = INSTRUMENTS.map(() => Array(finalLength).fill(false));
    tracks.forEach((track, trackIdx) => {
      try {
        const payload = JSON.parse(track.notesData || '{}');
        const notes: any[] = payload.notes || [];
        const offset = offsets[trackIdx];
        notes.forEach((note: any) => {
          const instIdx = INSTRUMENTS.findIndex(i => i.id === note.inst);
          if (instIdx !== -1) {
            const pos = offset + note.step;
            if (pos < finalLength) newGrid[instIdx][pos] = true;
          }
        });
      } catch {}
    });
    setGrid(newGrid);
  }, [tracks]);

  useEffect(() => {
    if (!isPlaying || grid.length === 0 || totalSteps === 0) return;

    let step = 0;
    Tone.Transport.bpm.value = 120;

    const sid = Tone.Transport.scheduleRepeat((time) => {
      INSTRUMENTS.forEach((inst, index) => {
        if (grid[index]?.[step]) {
          const s = synthsRef.current?.[inst.id];
          if (!s) return;
          const note = NOTES_BY_INST[inst.id];
          const dur = NOTE_DURATION[inst.id] ?? '16n';
          try {
            if (typeof note === 'string') {
              if (['snare','clap','fx_sweep'].includes(inst.id)) {
                (s as Tone.NoiseSynth).triggerAttackRelease(note as any, time);
              } else if (['hihat_c','hihat_o','crash','bell','cowbell','vibraphone'].includes(inst.id)) {
                (s as Tone.MetalSynth).triggerAttackRelease(note as any, time);
              } else {
                (s as Tone.Synth).triggerAttackRelease(note as any, dur, time);
              }
            } else {
              (s as Tone.PolySynth).triggerAttackRelease(note, dur, time);
            }
          } catch {}
        }
      });

      Tone.Draw.schedule(() => setCurrentStep(step), time);
      step++;
      if (step >= totalSteps) {
        Tone.Draw.schedule(() => setIsPlaying(false), time);
      }
    }, '16n');

    Tone.Transport.start();
    return () => {
      Tone.Transport.stop();
      Tone.Transport.clear(sid);
      setCurrentStep(-1);
    };
  }, [isPlaying, grid, totalSteps]);

  const handlePlayPause = async () => {
    await Tone.start();
    setIsPlaying(p => !p);
  };

  const pct = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--accent-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ margin: 0, color: 'var(--accent-gradient-2)', fontSize: '0.85rem' }}>
          {tracks.length} parts · {totalSteps} steps (with 1s overlaps)
        </p>
        <button onClick={handlePlayPause} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', borderRadius: '4px', cursor: 'pointer', background: 'var(--accent-color)', color: '#fff', border: 'none', fontSize: '0.9rem' }}>
          {isPlaying ? <><Square size={14}/> Stop</> : <><Play size={14}/> Play</>}
        </button>
      </div>
      <div style={{ marginTop: '0.75rem', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-color), var(--accent-gradient-2))', transition: 'width 0.1s linear' }} />
      </div>
    </div>
  );
}
