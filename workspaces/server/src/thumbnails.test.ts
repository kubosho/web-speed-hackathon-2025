import { access } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import fastify from 'fastify';
import { registerThumbnails } from './thumbnails';

vi.mock('node:fs/promises', () => ({
  access: vi.fn(),
  mkdir: vi.fn(),
  readFile: vi.fn().mockResolvedValue(Buffer.from('test')),
  writeFile: vi.fn(),
}));

vi.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: vi.fn().mockImplementation(() => ({
    load: vi.fn(),
    writeFile: vi.fn(),
    exec: vi.fn(),
    readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    terminate: vi.fn(),
  })),
}));

const mockDatabase = {
  query: {
    episode: {
      findFirst: vi.fn().mockResolvedValue({
        id: 'test-episode-id',
        stream: {
          id: 'test-stream-id',
          numberOfChunks: 10,
        },
      }),
    },
  },
};

vi.mock('./drizzle/database', () => ({
  getDatabase: () => mockDatabase,
}));

describe('thumbnails', () => {
  let app: ReturnType<typeof fastify>;

  beforeEach(async () => {
    app = fastify();
    await registerThumbnails(app);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /thumbnails/episode/:episodeId/sprite.json', () => {
    test('エピソードが存在する場合、サムネイルメタデータを返す', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/thumbnails/episode/test-episode-id/sprite.json',
      });

      expect(response.statusCode).toBe(200);
      const metadata = JSON.parse(response.payload);
      expect(metadata).toEqual({
        spriteUrl: '/thumbnails/test-stream-id_sprite.jpg',
        interval: 1,
        thumbnailWidth: 160,
        thumbnailHeight: 90,
        columns: 20, // numberOfChunks * 2 / interval = 10 * 2 / 1 = 20
      });
    });

    test('サムネイルが存在しない場合、新しく生成する', async () => {
      vi.mocked(access).mockRejectedValueOnce(new Error('File not found'));

      const response = await app.inject({
        method: 'GET',
        url: '/thumbnails/episode/test-episode-id/sprite.json',
      });

      expect(response.statusCode).toBe(200);
      expect(FFmpeg).toHaveBeenCalled();
      const mockFFmpeg = vi.mocked(FFmpeg);
      expect(mockFFmpeg.mock.results[0]?.value.exec).toHaveBeenCalledWith([
        '-i', 'input.ts',
        '-vf', 'fps=1/1,scale=160:90,tile=20x1',
        '-frames:v', '1',
        'output.jpg'
      ]);
    });

    test('サムネイルが既に存在する場合、生成をスキップする', async () => {
      vi.mocked(access).mockResolvedValueOnce(undefined);

      const response = await app.inject({
        method: 'GET',
        url: '/thumbnails/episode/test-episode-id/sprite.json',
      });

      expect(response.statusCode).toBe(200);
      expect(FFmpeg).not.toHaveBeenCalled();
    });

    test('エピソードが存在しない場合、エラーを返す', async () => {
      mockDatabase.query.episode.findFirst.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: '/thumbnails/episode/non-existent-id/sprite.json',
      });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual({
        error: 'Internal Server Error',
        message: 'The episode is not found.',
        statusCode: 500,
      });
    });
  });
});
