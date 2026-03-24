'use client';

import './globals.css';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { ThemeProvider, useThemeControls } from '@/components/ThemeProvider';
import { Settings } from 'lucide-react';

const inter = Inter({ subsets: ['latin'], variable: '--primary-font' });

function NavControls() {
  const { visualizerEnabled, setVisualizerEnabled } = useThemeControls();
  
  return (
    <nav>
      <div className="logo">
        <Link href="/">CollabMusic</Link>
      </div>
      <div className="nav-links" style={{ alignItems: 'center' }}>
        <button 
          onClick={() => setVisualizerEnabled(!visualizerEnabled)}
          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: visualizerEnabled ? 1 : 0.5 }}
          title="Toggle Dynamic Visualizer & Colors"
        >
          <Settings size={18} /> {visualizerEnabled ? 'VFX: ON' : 'VFX: OFF'}
        </button>
        <Link href="/create" className="btn btn-secondary">Create</Link>
        <Link href="/help" className="btn">Help</Link>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>CollabMusic - Create Together</title>
      </head>
      <body className={inter.variable}>
        <ThemeProvider>
          <NavControls />
          <main>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
