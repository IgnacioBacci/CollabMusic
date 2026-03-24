import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Simple email-via-Resend (or any SMTP) using fetch
async function sendCompletionEmails(emails: string[], songTitle: string, artists: string[]) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return; // Skip if not configured

  const artistList = artists.filter(Boolean).join(', ') || 'Anonymous';

  for (const email of emails) {
    if (!email) continue;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CollabMusic <noreply@collabmusic.app>',
        to: email,
        subject: `🎵 "${songTitle}" is now complete!`,
        html: `
          <h2>🎵 Your collaborative song is ready!</h2>
          <p><strong>"${songTitle}"</strong> has received all the contributions it needed and is now a complete masterpiece!</p>
          <p><strong>Artists:</strong> ${artistList}</p>
          <p>Go to CollabMusic to listen to the final result!</p>
          <hr/>
          <small>You received this because you contributed to this song on CollabMusic.</small>
        `
      })
    });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { notesData, duration, artistName, email } = body;

    if (!notesData || typeof duration !== 'number' || duration > 40) {
       return NextResponse.json({ error: 'Invalid track data (max 40s)' }, { status: 400 });
    }

    // Fetch the song first
    const song = await prisma.song.findUnique({
      where: { id }
    });

    if (!song || song.status !== 'PENDING') {
      return NextResponse.json({ error: 'Song not found or already processing/completed' }, { status: 400 });
    }

    if (song.currentIterations >= song.targetIterations) {
      return NextResponse.json({ error: 'Song already reached target iterations' }, { status: 400 });
    }

    // Add the new track and increment iterations
    const updatedSong = await prisma.song.update({
      where: { id },
      data: {
        currentIterations: { increment: 1 },
        tracks: {
          create: {
            notesData,
            duration,
            artistName: artistName || 'Anonymous',
            email: email || null,
          }
        }
      }
    });

    // Check if it reached the target after update
    if (updatedSong.currentIterations >= updatedSong.targetIterations) {
      // Fetch all tracks chronologically
      const allTracks = await prisma.track.findMany({
        where: { songId: id },
        orderBy: { createdAt: 'asc' }
      });

      // Update their orderedIndex chronologically
      await prisma.$transaction(
        allTracks.map((t, index) => 
          prisma.track.update({
            where: { id: t.id },
            data: { orderedIndex: index }
          })
        )
      );

      // Finalize the song
      await prisma.song.update({
        where: { id },
        data: { status: 'COMPLETED' }
      });

      // Send email notifications to all contributors who provided an email
      const emails = allTracks.map(t => t.email).filter((e): e is string => !!e);
      const artists = allTracks.map(t => t.artistName).filter((a): a is string => !!a);
      // Don't await — fire-and-forget to not delay the response
      sendCompletionEmails(emails, updatedSong.title, artists).catch(console.error);

      return NextResponse.json({ success: true, status: 'COMPLETED' }, { status: 200 });
    }

    return NextResponse.json({ success: true, status: 'PENDING' }, { status: 200 });
  } catch (error) {
    console.error('Error iterating song:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
