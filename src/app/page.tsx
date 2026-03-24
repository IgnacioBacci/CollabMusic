'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sequencer from '@/components/Sequencer';
import Player from '@/components/Player';
import EqualizerBackground from '@/components/EqualizerBackground';

export default function Home() {
  const [completedSongs, setCompletedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'likes'>('newest');
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);

  useEffect(() => {
    fetchSongs();
  }, [sortBy]);

  const fetchSongs = () => {
    setLoading(true);
    fetch(`/api/songs/completed?sort=${sortBy}`)
      .then(r => r.json())
      .then(data => {
        if (data.songs) setCompletedSongs(data.songs);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleVote = async (songId: string, type: 'LIKE' | 'DISLIKE') => {
    try {
      const res = await fetch(`/api/songs/${songId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType: type })
      });
      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || 'Failed to vote');
      } else {
        // Refresh silently
        fetch(`/api/songs/completed?sort=${sortBy}`)
          .then(r => r.json())
          .then(data => {
            if (data.songs) setCompletedSongs(data.songs);
          });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <EqualizerBackground />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 className="title">Welcome to CollabMusic</h1>
        <p className="subtitle">Collaboratively compose music blindfolded and let AI assemble it.</p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
        <Link href="/create" className="btn btn-secondary" style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}>Create Option</Link>
        <Link href="/help" className="btn" style={{ padding: '1rem 3rem', fontSize: '1.2rem' }}>Help Option</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <h2 style={{ margin: 0 }}>Listen</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            onClick={() => setSortBy('newest')} 
            className="btn-secondary" 
            style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem', border: sortBy === 'newest' ? '1px solid var(--accent-color)' : '1px solid transparent', borderRadius: '4px', cursor: 'pointer', background: sortBy === 'newest' ? 'rgba(164, 69, 255, 0.1)' : 'transparent', color: 'var(--text-color)' }}
          >
            Newest
          </button>
          <button 
            onClick={() => setSortBy('likes')} 
            className="btn-secondary" 
            style={{ padding: '0.3rem 0.8rem', fontSize: '0.9rem', border: sortBy === 'likes' ? '1px solid var(--accent-color)' : '1px solid transparent', borderRadius: '4px', cursor: 'pointer', background: sortBy === 'likes' ? 'rgba(164, 69, 255, 0.1)' : 'transparent', color: 'var(--text-color)' }}
          >
            Most Liked
          </button>
        </div>
      </div>
      
      {loading ? (
        <p>Loading completed masterpieces...</p>
      ) : completedSongs.length === 0 ? (
        <p style={{ color: '#aaa' }}>No completed songs yet. Jump in and create the first one!</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {completedSongs.map((song: any) => (
            <div key={song.id} className="card">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <h3 style={{ marginBottom: '0.5rem', textTransform: 'capitalize' }}>{song.genres}</h3>
               <div style={{ display: 'flex', gap: '0.5rem' }}>
                 <button onClick={() => handleVote(song.id, 'LIKE')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                   👍 {song.likes}
                 </button>
                 <button onClick={() => handleVote(song.id, 'DISLIKE')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                   👎 {song.dislikes}
                 </button>
               </div>
             </div>
             
             <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '1rem' }}>
               {song.tracks.length} collaborated parts • {new Date(song.updatedAt).toLocaleDateString()}
             </p>
             <button 
                className="btn btn-secondary" 
                style={{ width: '100%' }}
                onClick={() => setPlayingSongId(playingSongId === song.id ? null : song.id)}
              >
               {playingSongId === song.id ? 'Close Player' : 'Play Masterpiece'}
             </button>
             {playingSongId === song.id && (
               <Player tracks={song.tracks} />
             )}
            </div>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
