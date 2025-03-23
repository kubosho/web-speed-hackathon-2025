import { lens } from '@dhmk/zustand-lens';
import { StandardSchemaV1 } from '@standard-schema/spec';
import * as schema from '@wsh-2025/schema/src/api/schema';
import { produce } from 'immer';
import { ArrayValues } from 'type-fest';

import { recommendedService } from '@wsh-2025/client/src/features/recommended/services/recommendedService';

type ReferenceId = string;
type RecommendedModuleId = string;

interface RecommendedState {
  recommendedModules: Record<
    RecommendedModuleId,
    | ArrayValues<StandardSchemaV1.InferOutput<typeof schema.getRecommendedCarouselModulesResponse>>
    | ArrayValues<StandardSchemaV1.InferOutput<typeof schema.getRecommendedJumbotronModulesResponse>>
  >;
  references: Record<ReferenceId, RecommendedModuleId[]>;
}

interface RecommendedActions {
  fetchRecommendedModulesByReferenceId: (params: {
    referenceId: ReferenceId;
  }) => Promise<
    (
      | ArrayValues<StandardSchemaV1.InferOutput<typeof schema.getRecommendedCarouselModulesResponse>>
      | ArrayValues<StandardSchemaV1.InferOutput<typeof schema.getRecommendedJumbotronModulesResponse>>
    )[]
  >;
}

export const createRecommendedStoreSlice = () => {
  return lens<RecommendedState & RecommendedActions>((set) => ({
    fetchRecommendedModulesByReferenceId: async ({ referenceId }) => {
      const [carouselModules, jumbotronModules] = await Promise.all([
        recommendedService.fetchRecommendedCarouselModules({ referenceId }),
        recommendedService.fetchRecommendedJumbotronModules({ referenceId }),
      ]);

      const modules = [...carouselModules, ...jumbotronModules].sort((a, b) => a.order - b.order);

      set((state) => {
        return produce(state, (draft) => {
          draft.references[referenceId] = modules.map((module) => module.id);
          for (const module of modules) {
            draft.recommendedModules[module.id] = module;
          }
        });
      });

      return modules;
    },
    recommendedModules: {},
    references: {},
  }));
};
