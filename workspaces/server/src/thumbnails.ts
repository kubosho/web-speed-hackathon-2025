import type { FastifyInstance } from 'fastify';
import { getDatabase } from '@wsh-2025/server/src/drizzle/database';

const THUMBNAIL_INTERVAL = 1;
const THUMBNAIL_WIDTH = 160;
const THUMBNAIL_HEIGHT = 90;

export async function registerThumbnails(app: FastifyInstance): Promise<void> {
  app.get<{
    Params: { episodeId: string };
  }>('/thumbnails/episode/:episodeId/sprite.json', async (req, reply) => {
    try {
      const database = getDatabase();

      const episode = await database.query.episode.findFirst({
        where(episode, { eq }) {
          return eq(episode.id, req.params.episodeId);
        },
        with: {
          stream: true,
        },
      });

      if (episode == null) {
        return reply.status(404).send({ error: 'Episode not found' });
      }

      const stream = episode.stream;
      const metadata = {
        spriteUrl: `/public/thumbnails/${stream.id}_sprite.jpg`,
        interval: THUMBNAIL_INTERVAL,
        thumbnailWidth: THUMBNAIL_WIDTH,
        thumbnailHeight: THUMBNAIL_HEIGHT,
        columns: Math.ceil((stream.numberOfChunks * 2) / THUMBNAIL_INTERVAL),
      };

      reply.send(metadata);
    } catch (error) {
      console.error('Thumbnail metadata error:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
