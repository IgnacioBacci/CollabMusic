'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sequencer from '@/components/Sequencer';

export default function HelpSong() {
  const router = useRouter();
  const [songs, setSongs] = useState([]);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [artistName, setArtistName] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/songs/pending')
      .then(r => r.json())
      .then(data => {
        if (data.songs) setSongs(data.songs);
        setLoading(false);
      });
  }, []);

  const handleSaveTrack = async (notesData: string, duration: number) => {
    if (!selectedSong) return;
    setIsSaving(true);
    
    try {
      const res = await fetch(`/api/songs/${selectedSong.id}/iterate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notesData, duration, artistName })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Error saving track');
      
      if (data.status === 'COMPLETED') {
        alert('🎉 You contributed the final part! The song is now complete!');
      } else {
        alert('Track successfully contributed! The song still needs more collaborators.');
      }
      router.push('/');
    } catch (err: any) {
      alert(err.message);
      setIsSaving(false);
    }
  };

  if (loading) return <p style={{textAlign:'center', marginTop: '4rem'}}>Looking for songs that need help...</p>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="title" style={{ fontSize: '2.5rem', textAlign: 'left' }}>Iterate a Song</h1>
      <p style={{ color: '#aaa', marginBottom: '2rem' }}>Blindly contribute to a work-in-progress. You only know the genre and which iteration it is currently on.</p>

      {!selectedSong ? (
        <>
          {songs.length === 0 ? (
            <div className="card" style={{textAlign: 'center'}}>
              <p>No pending songs at the moment.</p>
              <button className="btn" style={{marginTop: '1rem'}} onClick={() => router.push('/create')}>Create the first one!</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {songs.map((s: any) => (
                <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ textTransform: 'capitalize', margin: 0 }}>{s.genres}</h3>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>Part {s.currentIterations + 1} of {s.targetIterations}</p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => setSelectedSong(s)}>Contribute to this song</button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem'}}>
              Contributing to: {selectedSong.genres}
            </h3>
            <p style={{ color: '#aaa' }}>You are creating part {selectedSong.currentIterations + 1} of {selectedSong.targetIterations}.</p>
            <button className="btn-secondary" style={{ padding: '0.5rem 1rem', marginTop: '1rem', border: '1px solid var(--accent-color)', borderRadius: '4px', cursor: 'pointer', background: 'transparent', color: 'var(--text-color)' }} onClick={() => setSelectedSong(null)}>
               &#8592; Back to list
            </button>
          </div>

          <div className="card">
            <div className="form-group">
              <label className="form-label">Your Name (Optional)</label>
              <input type="text" className="form-input" value={artistName} onChange={e => setArtistName(e.target.value)} />
            </div>

          </div>

          <Sequencer onSave={handleSaveTrack} isSaving={isSaving} />
        </>
      )}
    </div>
  );
}
