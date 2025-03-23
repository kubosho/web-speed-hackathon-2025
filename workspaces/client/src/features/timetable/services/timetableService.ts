import { createFetch, createSchema } from '@better-fetch/fetch';
import { StandardSchemaV1 } from '@standard-schema/spec';
import * as schema from '@wsh-2025/schema/src/api/schema';

import { schedulePlugin } from '@wsh-2025/client/src/features/requests/schedulePlugin';

const $fetch = createFetch({
  baseURL: process.env['API_BASE_URL'] ?? '/api',
  plugins: [schedulePlugin],
  schema: createSchema({
    '/timetable': {
      output: schema.getTimetableResponse,
      query: schema.getTimetableRequestQuery,
    },
    '/episodes/timetable': {
      output: schema.getTimetableEpisodesResponse,
      query: schema.getTimetableEpisodesRequestQuery,
    },
  }),
  throw: true,
});

interface TimetableService {
  fetchTimetable: (
    params: StandardSchemaV1.InferOutput<typeof schema.getTimetableRequestQuery>,
  ) => Promise<StandardSchemaV1.InferOutput<typeof schema.getTimetableResponse>>;
  fetchTimetableEpisodes: (
    params: StandardSchemaV1.InferOutput<typeof schema.getTimetableEpisodesRequestQuery>,
  ) => Promise<StandardSchemaV1.InferOutput<typeof schema.getTimetableEpisodesResponse>>;
}

export const timetableService: TimetableService = {
  async fetchTimetable({ since, until }) {
    const data = await $fetch('/timetable', {
      query: { since, until },
    });
    return data;
  },
  async fetchTimetableEpisodes({ episodeIds }) {
    const data = await $fetch('/episodes/timetable', {
      query: episodeIds ? { episodeIds } : {},
    });
    return data;
  },
};
