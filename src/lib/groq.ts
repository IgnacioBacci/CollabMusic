import { Groq } from 'groq-sdk';
import { prisma } from './db';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export async function processSongCompletion(songId: string) {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    include: { tracks: true }
  });

  if (!song || song.status !== 'PENDING') return;

  // Mark as processing
  await prisma.song.update({
    where: { id: songId },
    data: { status: 'PROCESSING' }
  });

  let orderedTrackIds = song.tracks.map(t => t.id); // Default fallback

  if (groq) {
    try {
      const trackSummaries = song.tracks.map(t => {
        let noteCount = 0;
        try {
          const data = JSON.parse(t.notesData || '[]');
          noteCount = data.length || 0;
        } catch(e) {}
        return {
          id: t.id,
          noteCount,
          duration: t.duration
        };
      });

      const prompt = `You are a music producer AI. We are building a collaborative song. 
Genre(s): ${song.genres}. 
There are ${song.tracks.length} tracks (parts). 
Summary: ${JSON.stringify(trackSummaries)}.
Please output ONLY a JSON object with a single key "ordered_ids" containing an array of the track IDs sorted in the optimal musical sequence.`;

      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);
      if (parsed.ordered_ids && Array.isArray(parsed.ordered_ids)) {
        orderedTrackIds = parsed.ordered_ids;
      }
    } catch (err) {
      console.error('Groq error, falling back to chronological order:', err);
    }
  } else {
      console.log('No GROQ_API_KEY set. Simulating AI processing delay...');
      await new Promise(r => setTimeout(r, 2000));
  }

  // Validate AI output
  const allPresent = song.tracks.every(t => orderedTrackIds.includes(t.id));
  if (!allPresent || orderedTrackIds.length !== song.tracks.length) {
    orderedTrackIds = song.tracks.map(t => t.id);
  }

  // Update tracks
  await prisma.$transaction(
    orderedTrackIds.map((id, index) => 
      prisma.track.update({
        where: { id },
        data: { orderedIndex: index }
      })
    )
  );

  // Mark completed
  await prisma.song.update({
    where: { id: songId },
    data: { status: 'COMPLETED' }
  });
}
