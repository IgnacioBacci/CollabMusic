'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const ThemeContext = createContext({
  visualizerEnabled: true,
  setVisualizerEnabled: (v: boolean) => {}
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [visualizerEnabled, setVisualizerEnabled] = useState(true);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!visualizerEnabled) {
      document.documentElement.style.setProperty('--accent-color', '#a445ff');
      document.documentElement.style.setProperty('--accent-gradient-2', '#00d2ff');
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    let t = 0;
    const animate = () => {
      t += 0.03;
      const hue1 = 260 + Math.sin(t) * 50; 
      const hue2 = 190 + Math.cos(t * 0.7) * 50;
      
      document.documentElement.style.setProperty('--accent-color', `hsl(${hue1}, 100%, 65%)`);
      document.documentElement.style.setProperty('--accent-gradient-2', `hsl(${hue2}, 100%, 50%)`);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visualizerEnabled]);

  return (
    <ThemeContext.Provider value={{ visualizerEnabled, setVisualizerEnabled }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeControls = () => useContext(ThemeContext);
