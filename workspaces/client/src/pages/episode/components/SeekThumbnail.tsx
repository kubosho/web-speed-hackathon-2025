import { StandardSchemaV1 } from '@standard-schema/spec';
import * as schema from '@wsh-2025/schema/src/api/schema';
import { useRef } from 'react';

import { usePointer } from '@wsh-2025/client/src/features/layout/hooks/usePointer';
import { useDuration } from '@wsh-2025/client/src/pages/episode/hooks/useDuration';
import { useSeekThumbnail } from '@wsh-2025/client/src/pages/episode/hooks/useSeekThumbnail';

interface Props {
  episode: StandardSchemaV1.InferOutput<typeof schema.getEpisodeByIdResponse>;
}

export const SeekThumbnail = ({ episode }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const thumbnailMetadata = useSeekThumbnail({ episode });
  const pointer = usePointer();
  const duration = useDuration();

  const elementRect = ref.current?.parentElement?.getBoundingClientRect() ?? { left: 0, width: 0 };
  const relativeX = pointer.x - elementRect.left;

  const percentage = Math.max(0, Math.min(relativeX / elementRect.width, 1));
  const pointedTime = duration * percentage;

  // サムネイルが画面からはみ出ないようにサムネイル中央を基準として left を計算する
  const MIN_LEFT = thumbnailMetadata.thumbnailWidth / 2;
  const MAX_LEFT = elementRect.width - thumbnailMetadata.thumbnailWidth / 2;

  // 表示するサムネイルのインデックスを計算
  const thumbnailIndex = Math.floor(pointedTime / thumbnailMetadata.interval);
  const spritePositionX = thumbnailIndex * thumbnailMetadata.thumbnailWidth;

  return (
    <div
      ref={ref}
      className="absolute bottom-0 h-[90px] w-[160px] translate-x-[-50%] bg-[size:auto_100%]"
      style={{
        backgroundImage: `url(${thumbnailMetadata.spriteUrl})`,
        backgroundPositionX: -1 * spritePositionX,
        left: Math.max(MIN_LEFT, Math.min(relativeX, MAX_LEFT)),
      }}
    />
  );
};
