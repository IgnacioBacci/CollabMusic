import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pendingSongs = await prisma.song.findMany({
      where: {
        status: 'PENDING',
        currentIterations: {
          lt: prisma.song.fields.targetIterations
        }
      },
      select: {
        id: true,
        genres: true,
        currentIterations: true,
        targetIterations: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ songs: pendingSongs });
  } catch (error) {
    console.error('Error fetching pending songs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
