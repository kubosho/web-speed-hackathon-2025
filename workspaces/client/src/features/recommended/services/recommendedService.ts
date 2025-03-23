import { createFetch, createSchema } from '@better-fetch/fetch';
import { StandardSchemaV1 } from '@standard-schema/spec';
import * as schema from '@wsh-2025/schema/src/api/schema';

import { schedulePlugin } from '@wsh-2025/client/src/features/requests/schedulePlugin';

const $fetch = createFetch({
  baseURL: process.env['API_BASE_URL'] ?? '/api',
  plugins: [schedulePlugin],
  schema: createSchema({
    '/recommended/:referenceId/carousel': {
      output: schema.getRecommendedCarouselModulesResponse,
    },
    '/recommended/:referenceId/jumbotron': {
      output: schema.getRecommendedJumbotronModulesResponse,
    },
  }),
  throw: true,
});

interface RecommendedService {
  fetchRecommendedCarouselModules: (params: {
    referenceId: string;
  }) => Promise<StandardSchemaV1.InferOutput<typeof schema.getRecommendedCarouselModulesResponse>>;
  fetchRecommendedJumbotronModules: (params: {
    referenceId: string;
  }) => Promise<StandardSchemaV1.InferOutput<typeof schema.getRecommendedJumbotronModulesResponse>>;
}

export const recommendedService: RecommendedService = {
  async fetchRecommendedCarouselModules({ referenceId }) {
    const data = await $fetch('/recommended/:referenceId/carousel', {
      params: { referenceId },
    });
    return data;
  },
  async fetchRecommendedJumbotronModules({ referenceId }) {
    const data = await $fetch('/recommended/:referenceId/jumbotron', {
      params: { referenceId },
    });
    return data;
  },
};
