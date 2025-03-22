import { StandardSchemaV1 } from '@standard-schema/spec';
import * as schema from '@wsh-2025/schema/src/api/schema';
import { use } from 'react';

interface Params {
  episode: StandardSchemaV1.InferOutput<typeof schema.getEpisodeByIdResponse>;
}

interface ThumbnailMetadata {
  spriteUrl: string;
  interval: number;
  thumbnailWidth: number;
  thumbnailHeight: number;
  columns: number;
}

async function getSeekThumbnail({ episode }: Params): Promise<ThumbnailMetadata> {
  const response = await fetch(`/thumbnails/episode/${episode.id}/sprite.json`);
  if (!response.ok) {
    throw new Error('Failed to fetch thumbnail metadata');
  }
  return response.json();
}

const weakMap = new WeakMap<object, Promise<ThumbnailMetadata>>();

export const useSeekThumbnail = ({ episode }: Params): ThumbnailMetadata => {
  const promise = weakMap.get(episode) ?? getSeekThumbnail({ episode });
  weakMap.set(episode, promise);
  return use(promise);
};
