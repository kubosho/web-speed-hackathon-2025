import { StandardSchemaV1 } from '@standard-schema/spec';
import * as schema from '@wsh-2025/schema/src/api/schema';
import { useEffect, useState } from 'react';

import { timetableService } from '@wsh-2025/client/src/features/timetable/services/timetableService';

type Episode = StandardSchemaV1.InferOutput<typeof schema.getTimetableEpisodesResponse>[number];

export function useEpisode(episodeId: string) {
  const [episode, setEpisode] = useState<Episode | null>(null);

  useEffect(() => {
    timetableService
      .fetchTimetableEpisodes({ episodeIds: episodeId })
      .then((episodes) => {
        const firstEpisode = episodes[0] ?? null;
        setEpisode(firstEpisode);
      })
      .catch(() => {
        setEpisode(null);
      });
  }, [episodeId]);

  return episode;
}
