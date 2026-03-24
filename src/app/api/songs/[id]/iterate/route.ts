import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processSongCompletion } from '@/lib/groq';

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
      // Trigger Groq Processing asynchronously (non-blocking)
      // Note: In Vercel serverless, background promises need special handling usually, 
      // but await locally or with waitUntil is better. For standard Next.js, we can just await it or don't await.
      // We will await it here to ensure it finishes during the request, max wait might be a few seconds.
      await processSongCompletion(id);
      return NextResponse.json({ success: true, status: 'COMPLETED' }, { status: 200 });
    }

    return NextResponse.json({ success: true, status: 'PENDING' }, { status: 200 });
  } catch (error) {
    console.error('Error iterating song:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
