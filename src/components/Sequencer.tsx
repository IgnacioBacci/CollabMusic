'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Play, Square, Save } from 'lucide-react';

const INSTRUMENTS = [
  // Drums & Percussion
  { id: 'kick', name: 'Kick' },
  { id: 'snare', name: 'Snare' },
  { id: 'hihat_c', name: 'HiHat (C)' },
  { id: 'hihat_o', name: 'HiHat (O)' },
  { id: 'clap', name: 'Clap' },
  { id: 'tom_l', name: 'Low Tom' },
  { id: 'tom_h', name: 'High Tom' },
  { id: 'crash', name: 'Crash' },
  // Synths & Bass
  { id: 'bass_sub', name: 'Sub Bass' },
  { id: 'bass_fm', name: 'FM Bass' },
  { id: 'synth_pad', name: 'Synth Pad' },
  { id: 'synth_lead', name: 'Lead Synth' },
  { id: 'pluck', name: 'Pluck' },
  { id: 'arpeggio', name: 'Arp Synth' },
  // Keys & Strings
  { id: 'piano', name: 'El. Piano' },
  { id: 'organ', name: 'Organ' },
  { id: 'strings', name: 'Strings' },
  // FX & Extras
  { id: 'bell', name: 'Bell' },
  { id: 'fx_sweep', name: 'Sweep FX' },
  { id: 'fx_zap', name: 'Zap FX' }
];

const STEPS = 32;

interface SequencerProps {
  onSave: (notesData: string, duration: number) => void;
  isSaving: boolean;
}

export default function Sequencer({ onSave, isSaving }: SequencerProps) {
  const [grid, setGrid] = useState(() => 
    INSTRUMENTS.map(() => Array(STEPS).fill(false))
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const synthsRef = useRef<any>({});

  useEffect(() => {
    // Generate an arsenal of 20 distinct synths
    synthsRef.current = {
      kick: new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 4 }).toDestination(),
      snare: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.2 } }).toDestination(),
      hihat_c: new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.05, release: 0.01 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination(),
      hihat_o: new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 0.4, release: 0.1 }, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination(),
      clap: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.01, decay: 0.3 } }).toDestination(),
      tom_l: new Tone.MembraneSynth({ pitchDecay: 0.2, octaves: 2 }).toDestination(),
      tom_h: new Tone.MembraneSynth({ pitchDecay: 0.1, octaves: 2 }).toDestination(),
      crash: new Tone.MetalSynth({ envelope: { attack: 0.001, decay: 1.5, release: 0.5 } }).toDestination(),
      
      bass_sub: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 0.5 } }).toDestination(),
      bass_fm: new Tone.FMSynth({ harmonicity: 0.5, modulationIndex: 5, envelope: { attack: 0.01, decay: 0.2 } }).toDestination(),
      synth_pad: new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sawtooth' }, envelope: { attack: 0.5, decay: 0.5, sustain: 0.5, release: 1 } }).toDestination(),
      synth_lead: new Tone.Synth({ oscillator: { type: 'square' }, envelope: { attack: 0.05, decay: 0.1, sustain: 0.3 } }).toDestination(),
      pluck: new Tone.PluckSynth().toDestination(),
      arpeggio: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.3 } }).toDestination(),
      
      piano: new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle8' }, envelope: { attack: 0.02, decay: 1, sustain: 0.2, release: 1.5 } }).toDestination(),
      organ: new Tone.FMSynth({ harmonicity: 2, modulationIndex: 2 }).toDestination(),
      strings: new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 0.8, decay: 0.5, sustain: 1, release: 1.2 } }).toDestination(),
      
      bell: new Tone.MetalSynth({ harmonicity: 12, resonance: 8000, modulationIndex: 20, envelope: { decay: 0.8 } }).toDestination(),
      fx_sweep: new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { attack: 1, decay: 1, sustain: 0, release: 0.5 } }).toDestination(),
      fx_zap: new Tone.Synth({ oscillator: { type: 'sawtooth' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0 } }).toDestination()
    };

    return () => {
      Object.values(synthsRef.current).forEach((s: any) => s.dispose());
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    let step = 0;
    const interval = '16n';
    
    // Scale volumes slightly so 20 instruments don't blow out the speakers
    Tone.Destination.volume.value = -8;

    const sid = Tone.Transport.scheduleRepeat((time) => {
      INSTRUMENTS.forEach((inst, index) => {
        if (grid[index][step]) {
          const s = synthsRef.current[inst.id];
          if (!s) return;
          
          switch(inst.id) {
            case 'kick': s.triggerAttackRelease('C1', '8n', time); break;
            case 'snare': s.triggerAttackRelease('16n', time); break;
            case 'hihat_c': s.triggerAttackRelease('32n', time, 0.5); break;
            case 'hihat_o': s.triggerAttackRelease('8n', time, 0.5); break;
            case 'clap': s.triggerAttackRelease('16n', time, 0.8); break;
            case 'tom_l': s.triggerAttackRelease('G1', '8n', time); break;
            case 'tom_h': s.triggerAttackRelease('G2', '8n', time); break;
            case 'crash': s.triggerAttackRelease('4n', time, 0.6); break;
            
            case 'bass_sub': s.triggerAttackRelease('C2', '8n', time); break;
            case 'bass_fm': s.triggerAttackRelease('E2', '16n', time); break;
            case 'synth_pad': s.triggerAttackRelease(['C4', 'E4', 'G4'], '4n', time, 0.4); break;
            case 'synth_lead': s.triggerAttackRelease('C5', '16n', time); break;
            case 'pluck': s.triggerAttackRelease('C4', '16n', time); break;
            case 'arpeggio': s.triggerAttackRelease(step % 2 === 0 ? 'C4' : 'G4', '16n', time); break;
            
            case 'piano': s.triggerAttackRelease(['C3', 'E3', 'G3'], '8n', time); break;
            case 'organ': s.triggerAttackRelease('C4', '8n', time); break;
            case 'strings': s.triggerAttackRelease(['C4', 'E4', 'A4'], '2n', time, 0.3); break;
            
            case 'bell': s.triggerAttackRelease('32n', time); break;
            case 'fx_sweep': s.triggerAttackRelease('2n', time, 0.3); break;
            case 'fx_zap': s.triggerAttackRelease('C6', '32n', time); break;
          }
        }
      });
      
      Tone.Draw.schedule(() => {
        setCurrentStep(step);
      }, time);

      step = (step + 1) % STEPS;
    }, interval);

    Tone.Transport.start();

    return () => {
      Tone.Transport.stop();
      Tone.Transport.clear(sid);
      setCurrentStep(0);
    };
  }, [isPlaying, grid]);

  const toggleCell = (instIndex: number, stepIndex: number) => {
    const newGrid = [...grid];
    newGrid[instIndex] = [...newGrid[instIndex]];
    newGrid[instIndex][stepIndex] = !newGrid[instIndex][stepIndex];
    setGrid(newGrid);
  };

  const handlePlayPause = async () => {
    await Tone.start();
    setIsPlaying(!isPlaying);
  };

  const handleSave = () => {
    const activeNotes = [];
    for (let i = 0; i < INSTRUMENTS.length; i++) {
      for (let s = 0; s < STEPS; s++) {
        if (grid[i][s]) activeNotes.push({ inst: INSTRUMENTS[i].id, step: s });
      }
    }
    const duration = (STEPS * 60) / 120 / 4;
    onSave(JSON.stringify(activeNotes), duration);
  };

  return (
    <div className="card" style={{ marginTop: '2rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Sequencer Studio</h3>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <button className={`btn ${isPlaying ? 'btn-secondary' : ''}`} onClick={handlePlayPause}>
          {isPlaying ? <Square size={18} /> : <Play size={18} />}
          {isPlaying ? 'Stop' : 'Play'}
        </button>
        <button className="btn" onClick={handleSave} disabled={isSaving}>
          <Save size={18} /> {isSaving ? 'Saving...' : 'Contribute Track'}
        </button>
      </div>

      <div className="sequencer-grid" style={{ gridTemplateColumns: `auto repeat(${STEPS}, 1fr)` }}>
        {INSTRUMENTS.map((inst, i) => (
          <React.Fragment key={inst.id}>
            <div className="instrument-label">{inst.name}</div>
            {grid[i].map((isActive, s) => (
              <div
                key={s}
                className={`note-cell ${isActive ? 'active' : ''} ${currentStep === s && isPlaying ? 'playing' : ''}`}
                onClick={() => toggleCell(i, s)}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
