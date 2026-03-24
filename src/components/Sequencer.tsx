'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Play, Square, Save } from 'lucide-react';

// 120 BPM, 16th notes → 1 step = 0.125s. 40s = 320 steps but we keep max 128 (32s rounded to beat).
// Actually at 120BPM: beat = 0.5s, 16th note = 0.125s. 40s = 320 steps.
// We'll allow up to 320 steps for 40s but display at most 128 columns at once to keep UI sane.
// Users can scroll the grid horizontally to see more steps.
const STEP_DURATION_S = 0.125; // at 120bpm, 16th note
const MAX_SECONDS = 40;
const MAX_STEPS = Math.floor(MAX_SECONDS / STEP_DURATION_S); // = 320

export const INSTRUMENTS = [
  // Drums & Percussion
  { id: 'kick',     name: '🥁 Kick',        group: 'Drums' },
  { id: 'snare',    name: '🥁 Snare',       group: 'Drums' },
  { id: 'hihat_c',  name: '🎶 HiHat (C)',   group: 'Drums' },
  { id: 'hihat_o',  name: '🎶 HiHat (O)',   group: 'Drums' },
  { id: 'clap',     name: '👏 Clap',        group: 'Drums' },
  { id: 'tom_l',    name: '🥁 Low Tom',     group: 'Drums' },
  { id: 'tom_h',    name: '🥁 High Tom',    group: 'Drums' },
  { id: 'crash',    name: '💥 Crash',       group: 'Drums' },
  { id: 'rimshot',  name: '🎯 Rimshot',     group: 'Drums' },
  { id: 'cowbell',  name: '🔔 Cowbell',     group: 'Drums' },
  // Strings
  { id: 'guitar',    name: '🎸 A. Guitar', group: 'Strings' },
  { id: 'guitar_el', name: '⚡ E. Guitar', group: 'Strings' },
  { id: 'guitar_dist',name:'🔥 Dist. Guitar',group:'Strings'},
  { id: 'banjo',     name: '🪕 Banjo',     group: 'Strings' },
  // Bass & Synths
  { id: 'bass_sub',  name: '〰 Sub Bass',  group: 'Synths' },
  { id: 'bass_fm',   name: '〰 FM Bass',   group: 'Synths' },
  { id: 'bass_pick', name: '🎸 Pick Bass', group: 'Synths' },
  { id: 'synth_pad', name: '🌌 Synth Pad', group: 'Synths' },
  { id: 'synth_lead',name: '🔆 Lead Synth',group: 'Synths' },
  { id: 'synth_mono',name: '📡 Mono Synth',group: 'Synths' },
  { id: 'pluck',     name: '🌿 Pluck',     group: 'Synths' },
  { id: 'arpeggio',  name: '🔀 Arpeggio',  group: 'Synths' },
  { id: 'chord',     name: '🎹 Chord',     group: 'Synths' },
  // Keys
  { id: 'piano',     name: '🎹 El. Piano', group: 'Keys' },
  { id: 'organ',     name: '🎹 Organ',     group: 'Keys' },
  { id: 'strings',   name: '🎻 Orchestral',group: 'Keys' },
  { id: 'vibraphone',name: '🪘 Vibraphone',group: 'Keys' },
  { id: 'marimba',   name: '🪘 Marimba',   group: 'Keys' },
  // FX
  { id: 'bell',      name: '🔔 Bell',      group: 'FX' },
  { id: 'fx_sweep',  name: '🌊 Sweep',     group: 'FX' },
  { id: 'fx_zap',    name: '⚡ Zap',       group: 'FX' },
  { id: 'reverbpad', name: '🌫 Reverb Pad',group: 'FX' },
];

export const NOTES_BY_INST: Record<string, string | string[]> = {
  kick: 'C1', snare: '8n', hihat_c: '32n', hihat_o: '8n', clap: '16n',
  tom_l: 'G1', tom_h: 'G2', crash: '4n', rimshot: 'D2', cowbell: 'G4',
  guitar: 'C4', guitar_el: 'E3', guitar_dist: 'A2', banjo: 'G4',
  bass_sub: 'C2', bass_fm: 'E2', bass_pick: 'A1',
  synth_pad: ['C4', 'E4', 'G4'], synth_lead: 'C5', synth_mono: 'G4',
  pluck: 'C4', arpeggio: 'C4', chord: ['C3', 'E3', 'G3'],
  piano: ['C3', 'E3', 'G3'], organ: 'C4', strings: ['C4', 'E4', 'A4'],
  vibraphone: 'C5', marimba: 'C4',
  bell: '32n', fx_sweep: '2n', fx_zap: 'C6', reverbpad: ['C3', 'G3'],
};

export const NOTE_DURATION: Record<string, string> = {
  kick: '8n', snare: '16n', hihat_c: '32n', hihat_o: '8n', clap: '16n',
  tom_l: '8n', tom_h: '8n', crash: '4n', rimshot: '8n', cowbell: '16n',
  guitar: '8n', guitar_el: '4n', guitar_dist: '4n', banjo: '16n',
  bass_sub: '8n', bass_fm: '16n', bass_pick: '16n',
  synth_pad: '4n', synth_lead: '16n', synth_mono: '8n',
  pluck: '16n', arpeggio: '16n', chord: '4n',
  piano: '8n', organ: '8n', strings: '2n',
  vibraphone: '8n', marimba: '16n',
  bell: '4n', fx_sweep: '2n', fx_zap: '32n', reverbpad: '2n',
};

export function buildSynths() {
  const verb = new Tone.Reverb({ decay: 2, wet: 0.2 }).toDestination();
  const dist = new Tone.Distortion(0.6).toDestination();
  return {
    kick:       new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4 }).toDestination(),
    snare:      new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.18, sustain: 0 } }).toDestination(),
    hihat_c:    new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.04, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination(),
    hihat_o:    new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.35, release: 0.1  }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination(),
    clap:       new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.005, decay: 0.15, sustain: 0 } }).toDestination(),
    tom_l:      new Tone.MembraneSynth({ pitchDecay: 0.2, octaves: 2 }).toDestination(),
    tom_h:      new Tone.MembraneSynth({ pitchDecay: 0.1, octaves: 2.5 }).toDestination(),
    crash:      new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 1.2, release: 0.4 } }).toDestination(),
    rimshot:    new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0 } }).toDestination(),
    cowbell:    new Tone.MetalSynth({ harmonicity: 5.1, modulationIndex: 16, resonance: 3000, envelope: { attack: 0.001, decay: 0.3 } }).toDestination(),

    guitar:     new Tone.PluckSynth({ attackNoise: 1.2, dampening: 3500, resonance: 0.97 }).connect(verb),
    guitar_el:  new Tone.FMSynth({ harmonicity: 1, modulationIndex: 8, envelope: { attack: 0.05, decay: 0.5, sustain: 0.3 } }).toDestination(),
    guitar_dist:new Tone.FMSynth({ harmonicity: 0.5, modulationIndex: 15, envelope: { attack: 0.03, decay: 0.4, sustain: 0.2 } }).connect(dist),
    banjo:      new Tone.PluckSynth({ attackNoise: 2, dampening: 5500, resonance: 0.55 }).toDestination(),

    bass_sub:   new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.08, decay: 0.2, sustain: 0.8, release: 0.5 } }).toDestination(),
    bass_fm:    new Tone.FMSynth({ harmonicity: 0.5, modulationIndex: 4, envelope: { attack: 0.01, decay: 0.25 } }).toDestination(),
    bass_pick:  new Tone.PluckSynth({ attackNoise: 0.8, dampening: 2000, resonance: 0.85 }).toDestination(),
    synth_pad:  new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.4, decay: 0.5, sustain: 0.6, release: 1.2 } }).connect(verb),
    synth_lead: new Tone.Synth({ oscillator: { type: 'square8' }, envelope: { attack: 0.04, decay: 0.1, sustain: 0.4, release: 0.3 } }).toDestination(),
    synth_mono: new Tone.MonoSynth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.2 } }).toDestination(),
    pluck:      new Tone.PluckSynth({ attackNoise: 0.5, dampening: 4000, resonance: 0.95 }).toDestination(),
    arpeggio:   new Tone.Synth({ oscillator: { type: 'triangle8' }, envelope: { attack: 0.01, decay: 0.25, sustain: 0, release: 0.1 } }).toDestination(),
    chord:      new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.1, decay: 0.5, sustain: 0.4, release: 0.8 } }).connect(verb),

    piano:      new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle8' }, envelope: { attack: 0.015, decay: 0.9, sustain: 0.15, release: 1.2 } }).toDestination(),
    organ:      new Tone.FMSynth({ harmonicity: 2, modulationIndex: 2, envelope: { attack: 0.02, sustain: 1, release: 0.3 } }).toDestination(),
    strings:    new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.7, decay: 0.5, sustain: 1, release: 1.5 } }).connect(verb),
    vibraphone: new Tone.MetalSynth({ harmonicity: 3.5, resonance: 5000, modulationIndex: 10, envelope: { decay: 0.9 } }).toDestination(),
    marimba:    new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.2 } }).toDestination(),

    bell:       new Tone.MetalSynth({ harmonicity: 12.1, resonance: 8200, modulationIndex: 20, envelope: { decay: 1.1 } }).connect(verb),
    fx_sweep:   new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 1.2, decay: 0.8, sustain: 0, release: 0.5 } }).toDestination(),
    fx_zap:     new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.001, decay: 0.08, sustain: 0 } }).toDestination(),
    reverbpad:  new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 1.0, decay: 1.0, sustain: 0.8, release: 2.0 } }).connect(verb),
  };
}

interface SequencerProps {
  onSave: (notesData: string, duration: number) => void;
  isSaving: boolean;
}

export default function Sequencer({ onSave, isSaving }: SequencerProps) {
  const [steps, setSteps] = useState(64);
  const [grid, setGrid] = useState<boolean[][]>(() =>
    INSTRUMENTS.map(() => Array(MAX_STEPS).fill(false))
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const synthsRef = useRef<any>(null);
  const seqIdRef = useRef<number | null>(null);

  useEffect(() => {
    synthsRef.current = buildSynths();
    return () => {
      if (synthsRef.current) {
        Object.values(synthsRef.current).forEach((s: any) => { try { s.dispose(); } catch {} });
      }
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    let step = 0;
    Tone.Transport.bpm.value = 120;
    Tone.Destination.volume.value = -6;

    seqIdRef.current = Tone.Transport.scheduleRepeat((time) => {
      INSTRUMENTS.forEach((inst) => {
        if (grid[INSTRUMENTS.indexOf(inst)][step]) {
          const s = synthsRef.current?.[inst.id];
          if (!s) return;

          const note = NOTES_BY_INST[inst.id];
          const dur = NOTE_DURATION[inst.id] ?? '16n';

          try {
            if (typeof note === 'string') {
              if (inst.id === 'snare' || inst.id === 'clap' || inst.id === 'fx_sweep') {
                (s as Tone.NoiseSynth).triggerAttackRelease(note as any, time);
              } else if (inst.id === 'hihat_c' || inst.id === 'hihat_o' || inst.id === 'crash' || inst.id === 'bell' || inst.id === 'cowbell' || inst.id === 'vibraphone') {
                (s as Tone.MetalSynth).triggerAttackRelease(note as any, time);
              } else {
                (s as Tone.Synth).triggerAttackRelease(note as any, dur, time);
              }
            } else {
              (s as Tone.PolySynth).triggerAttackRelease(note, dur, time);
            }
          } catch { /* ignore timing edge cases */ }
        }
      });

      Tone.Draw.schedule(() => setCurrentStep(step), time);
      step = (step + 1) % steps;
    }, '16n');

    Tone.Transport.start();
    return () => {
      Tone.Transport.stop();
      if (seqIdRef.current !== null) {
        Tone.Transport.clear(seqIdRef.current);
        seqIdRef.current = null;
      }
      setCurrentStep(-1);
    };
  }, [isPlaying, grid, steps]);

  const toggleCell = (instIdx: number, stepIdx: number) => {
    setGrid(prev => {
      const next = prev.map(row => [...row]);
      next[instIdx][stepIdx] = !next[instIdx][stepIdx];
      return next;
    });
  };

  const handlePlayPause = async () => {
    await Tone.start();
    setIsPlaying(p => !p);
  };

  const handleSave = () => {
    const notes: { inst: string; step: number }[] = [];
    INSTRUMENTS.forEach((inst, i) => {
      for (let s = 0; s < steps; s++) {
        if (grid[i][s]) notes.push({ inst: inst.id, step: s });
      }
    });
    const duration = steps * STEP_DURATION_S; // in seconds
    onSave(JSON.stringify({ notes, steps }), Math.min(duration, 40));
  };

  const handleStepsChange = (val: number) => {
    const clamped = Math.min(MAX_STEPS, Math.max(8, val));
    setSteps(clamped);
  };

  const durationSecs = (steps * STEP_DURATION_S).toFixed(1);

  let currentGroup = '';

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      {/* Controls row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h3 style={{ margin: 0 }}>Sequencer Studio</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.85rem', color: '#aaa' }}>Steps:</label>
          <input
            type="range"
            min={8} max={MAX_STEPS} step={8}
            value={steps}
            onChange={e => handleStepsChange(parseInt(e.target.value))}
            style={{ width: '120px', accentColor: 'var(--accent-color)' }}
          />
          <span style={{ fontSize: '0.85rem', color: '#00d2ff', minWidth: '70px' }}>
            {durationSecs}s / 40s
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handlePlayPause}>
            {isPlaying ? <><Square size={16}/> Stop</> : <><Play size={16}/> Play</>}
          </button>
          <button className="btn" onClick={handleSave} disabled={isSaving}>
            <Save size={16}/> {isSaving ? 'Saving...' : 'Contribute'}
          </button>
        </div>
      </div>

      {/* Scrollable grid */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '70vh' }}>
        <table style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '120px', minWidth: '120px' }} />
            {Array.from({ length: steps }).map((_, s) => (
              <col key={s} style={{ width: '22px', minWidth: '22px' }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {/* Sticky corner */}
              <th style={{ position: 'sticky', left: 0, top: 0, zIndex: 30, background: '#0d0f1a', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '4px 6px', textAlign: 'left', fontSize: '0.7rem', color: '#888' }}>
                Instrument
              </th>
              {Array.from({ length: steps }).map((_, s) => (
                <th
                  key={s}
                  style={{
                    position: 'sticky', top: 0, zIndex: 20,
                    background: s % 16 === 0 ? '#161923' : '#0d0f1a',
                    color: s % 16 === 0 ? 'var(--accent-color)' : '#555',
                    fontSize: '0.6rem',
                    width: '22px',
                    textAlign: 'center',
                    padding: '4px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    fontWeight: s % 16 === 0 ? 700 : 400,
                  }}
                >
                  {s + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INSTRUMENTS.map((inst, i) => {
              const showGroupHeader = inst.group !== currentGroup;
              if (showGroupHeader) currentGroup = inst.group;
              return (
                <React.Fragment key={inst.id}>
                  {showGroupHeader && (
                    <tr>
                      <td
                        colSpan={steps + 1}
                        style={{
                          position: 'sticky', left: 0,
                          background: 'rgba(164,69,255,0.08)',
                          color: 'var(--accent-color)',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '3px 6px',
                          letterSpacing: '0.1em'
                        }}
                      >
                        {inst.group}
                      </td>
                    </tr>
                  )}
                  <tr>
                    {/* Sticky instrument label */}
                    <td
                      style={{
                        position: 'sticky', left: 0, zIndex: 10,
                        background: '#0d0f1a',
                        padding: '3px 6px',
                        fontSize: '0.72rem',
                        color: '#ccc',
                        whiteSpace: 'nowrap',
                        borderRight: '1px solid rgba(255,255,255,0.1)',
                        userSelect: 'none',
                      }}
                    >
                      {inst.name}
                    </td>
                    {Array.from({ length: steps }).map((_, s) => (
                      <td
                        key={s}
                        onClick={() => toggleCell(i, s)}
                        style={{
                          width: '22px',
                          height: '22px',
                          cursor: 'pointer',
                          background: grid[i][s]
                            ? 'var(--accent-color)'
                            : s === currentStep
                              ? 'rgba(255,255,255,0.12)'
                              : s % 16 < 8
                                ? 'rgba(255,255,255,0.04)'
                                : 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '2px',
                          boxShadow: grid[i][s] ? '0 0 6px var(--accent-color)' : 'none',
                          transition: 'background 0.08s',
                        }}
                      />
                    ))}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
