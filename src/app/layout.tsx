import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--primary-font' });

export const metadata: Metadata = {
  title: 'CollabMusic - Create Together',
  description: 'A platform for building music collaboratively and intelligently.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <nav>
          <div className="logo">
            <Link href="/">CollabMusic</Link>
          </div>
          <div className="nav-links">
            <Link href="/create" className="btn btn-secondary">Create</Link>
            <Link href="/help" className="btn">Help</Link>
          </div>
        </nav>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
