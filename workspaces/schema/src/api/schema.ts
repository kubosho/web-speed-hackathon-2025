import { Compile, TypeBox, Valibot, Zod } from '@sinclair/typemap';

import * as openapiSchema from '@wsh-2025/schema/src/openapi/schema';

export const getChannelsRequestQuery = Compile(TypeBox(openapiSchema.getChannelsRequestQuery));
export const getChannelsResponse = Compile(TypeBox(openapiSchema.getChannelsResponse));
export const getChannelByIdRequestParams = Compile(TypeBox(openapiSchema.getChannelByIdRequestParams));
export const getChannelByIdResponse = Compile(TypeBox(openapiSchema.getChannelByIdResponse));
export const getEpisodesRequestQuery = Compile(TypeBox(openapiSchema.getEpisodesRequestQuery));
export const getEpisodesResponse = Compile(TypeBox(openapiSchema.getEpisodesResponse));
export const getEpisodeByIdRequestParams = Compile(TypeBox(openapiSchema.getEpisodeByIdRequestParams));
export const getEpisodeByIdResponse = Compile(TypeBox(openapiSchema.getEpisodeByIdResponse));
export const getSeriesRequestQuery = Compile(Valibot(openapiSchema.getSeriesRequestQuery));
export const getSeriesResponse = Compile(Valibot(openapiSchema.getSeriesResponse));
export const getSeriesByIdRequestParams = Compile(Valibot(openapiSchema.getSeriesByIdRequestParams));
export const getSeriesByIdResponse = Compile(Valibot(openapiSchema.getSeriesByIdResponse));
export const getTimetableRequestQuery = Compile(Valibot(openapiSchema.getTimetableRequestQuery));
export const getTimetableResponse = Compile(Valibot(openapiSchema.getTimetableResponse));
export const getProgramsRequestQuery = Compile(Valibot(openapiSchema.getProgramsRequestQuery));
export const getProgramsResponse = Compile(Valibot(openapiSchema.getProgramsResponse));
export const getProgramByIdRequestParams = Compile(Valibot(openapiSchema.getProgramByIdRequestParams));
export const getProgramByIdResponse = Compile(Valibot(openapiSchema.getProgramByIdResponse));
export const getRecommendedModulesRequestParams = Compile(Valibot(openapiSchema.getRecommendedModulesRequestParams));
export const getRecommendedModulesResponse = Compile(Valibot(openapiSchema.getRecommendedModulesResponse));
export const getRecommendedCarouselModulesRequestParams = Compile(
  Valibot(openapiSchema.getRecommendedCarouselModulesRequestParams),
);
export const getRecommendedCarouselModulesResponse = Compile(
  Valibot(openapiSchema.getRecommendedCarouselModulesResponse),
);
export const getRecommendedJumbotronModulesRequestParams = Compile(
  Valibot(openapiSchema.getRecommendedJumbotronModulesRequestParams),
);
export const getRecommendedJumbotronModulesResponse = Compile(
  Valibot(openapiSchema.getRecommendedJumbotronModulesResponse),
);
export const signInRequestBody = Compile(Zod(openapiSchema.signInRequestBody));
export const signInResponse = Compile(Zod(openapiSchema.signInResponse));
export const signUpRequestBody = Compile(Zod(openapiSchema.signUpRequestBody));
export const signUpResponse = Compile(Zod(openapiSchema.signUpResponse));
export const getUserResponse = Compile(Zod(openapiSchema.getUserResponse));
export const getTimetableEpisodesRequestQuery = Compile(TypeBox(openapiSchema.getTimetableEpisodesRequestQuery));
export const getTimetableEpisodesResponse = Compile(TypeBox(openapiSchema.getTimetableEpisodesResponse));
