import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'newest';
    const completedSongs = await prisma.song.findMany({
      where: {
        status: 'COMPLETED'
      },
      include: {
        tracks: {
          orderBy: {
            orderedIndex: 'asc'
          }
        }
      },
      orderBy: sort === 'likes' ? { likes: 'desc' } : { updatedAt: 'desc' }
    });

    return NextResponse.json({ songs: completedSongs });
  } catch (error) {
    console.error('Error fetching completed songs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
