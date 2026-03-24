'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sequencer from '@/components/Sequencer';

export default function CreateSong() {
  const router = useRouter();
  const [genres, setGenres] = useState('');
  const [iterations, setIterations] = useState('4');
  const [email, setEmail] = useState('');
  const [artistName, setArtistName] = useState('');
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (notesData: string, duration: number) => {
    if (!genres) {
      alert('Please enter at least one genre!');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/songs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          genres,
          targetIterations: parseInt(iterations),
          email,
          artistName,
          notesData,
          duration
        })
      });

      if (!res.ok) throw new Error('Error saving the song');
      
      alert('Your initial track has been created! Wait for others to join.');
      router.push('/');
    } catch (err) {
      console.error(err);
      alert('An error occurred :(');
      setIsSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="title" style={{ fontSize: '2.5rem', textAlign: 'left' }}>Create a Song</h1>
      <p style={{ color: '#aaa', marginBottom: '2rem' }}>Define the details of your song and contribute the opening track (max 40s) using the sequencer.</p>

      <div className="card">
        <div className="form-group">
          <label className="form-label">Song Title</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Give your song a name..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Genre(s)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="E.g. Synthwave, Rock, Lo-Fi"
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Target Iterations (2 to 6)</label>
          <input 
            type="number" 
            className="form-input" 
            min="2" max="6"
            value={iterations}
            onChange={(e) => setIterations(e.target.value)}
          />
          <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>Number of people needed to complete the masterpiece.</p>
        </div>

        <div className="form-group">
          <label className="form-label">Artist Name (Optional)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Your stage name"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Your Email (Optional, notify when completed)</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="mail@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <Sequencer onSave={handleSave} isSaving={isSaving} />
    </div>
  );
}
