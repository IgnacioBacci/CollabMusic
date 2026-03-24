'use client';

import React from 'react';
import { useThemeControls } from './ThemeProvider';

export default function EqualizerBackground() {
  const { visualizerEnabled } = useThemeControls();
  
  if (!visualizerEnabled) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '35vh',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      zIndex: -1,
      opacity: 0.15,
      pointerEvents: 'none',
      gap: '1%'
    }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="eq-bar"
          style={{
            flex: 1,
            background: 'linear-gradient(to top, var(--accent-gradient-2), var(--accent-color))',
            animationDuration: `${0.5 + Math.random() * 1.5}s`,
            animationDelay: `${Math.random() * -2}s`,
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
          }}
        />
      ))}
    </div>
  );
}
