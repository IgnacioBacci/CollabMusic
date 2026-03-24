import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { voteType } = body;
    
    if (voteType !== 'LIKE' && voteType !== 'DISLIKE') {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    // Get IP
    const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Check if vote exists
    const existingVote = await prisma.vote.findUnique({
      where: {
        songId_ipAddress: {
          songId: id,
          ipAddress
        }
      }
    });

    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted on this song' }, { status: 400 });
    }

    // Create vote and increment
    await prisma.$transaction([
      prisma.vote.create({
        data: {
          songId: id,
          ipAddress,
          voteType
        }
      }),
      prisma.song.update({
        where: { id },
        data: voteType === 'LIKE' ? { likes: { increment: 1 } } : { dislikes: { increment: 1 } }
      })
    ]);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
