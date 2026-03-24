import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { genres, targetIterations, notesData, duration, artistName, title } = body;

    if (!genres || !targetIterations || targetIterations < 2 || targetIterations > 6) {
      return NextResponse.json({ error: 'Invalid config payload' }, { status: 400 });
    }

    if (!notesData || typeof duration !== 'number' || duration > 40) {
       return NextResponse.json({ error: 'Invalid track data (max 40s)' }, { status: 400 });
    }

    const song = await prisma.song.create({
      data: {
        title: title?.trim() || 'Untitled',
        genres,
        targetIterations,
        currentIterations: 1,
        status: 'PENDING',
        tracks: {
          create: {
            notesData,
            duration,
            artistName: artistName || 'Anonymous',
          }
        }
      },
    });

    return NextResponse.json({ song }, { status: 201 });
  } catch (error) {
    console.error('Error creating song:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
