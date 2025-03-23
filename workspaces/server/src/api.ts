import 'zod-openapi/extend';

import { randomBytes } from 'node:crypto';

import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import * as databaseSchema from '@wsh-2025/schema/src/database/schema';
import * as schema from '@wsh-2025/schema/src/openapi/schema';
import * as bcrypt from 'bcrypt';
import type { FastifyInstance } from 'fastify';
import {
  fastifyZodOpenApiPlugin,
  type FastifyZodOpenApiSchema,
  fastifyZodOpenApiTransform,
  fastifyZodOpenApiTransformObject,
  type FastifyZodOpenApiTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-zod-openapi';
import { z } from 'zod';
import type { ZodOpenApiVersion } from 'zod-openapi';

import { getDatabase, initializeDatabase } from '@wsh-2025/server/src/drizzle/database';
import { createRoutes } from '@wsh-2025/client/src/app/createRoutes';
import { createStore } from '@wsh-2025/client/src/app/createStore';
import { createStaticHandler } from 'react-router';
import { createStandardRequest } from 'fastify-standard-request-reply';

export async function registerApi(app: FastifyInstance): Promise<void> {
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    cookie: {
      path: '/',
      secure: process.env['NODE_ENV'] === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1週間
    },
    cookieName: 'wsh-2025-session',
    secret: randomBytes(32).toString('base64'),
  });

  await app.register(fastifyZodOpenApiPlugin);
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Web Speed Hackathon 2025 API',
        version: '1.0.0',
      },
      openapi: '3.0.3' satisfies ZodOpenApiVersion,
    },
    transform: fastifyZodOpenApiTransform,
    transformObject: fastifyZodOpenApiTransformObject,
  });
  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  const api = app.withTypeProvider<FastifyZodOpenApiTypeProvider>();

  /* eslint-disable sort/object-properties */
  api.route({
    method: 'POST',
    url: '/api/initialize',
    schema: {
      tags: ['初期化'],
      response: {
        200: {
          content: {
            'application/json': {
              schema: z.object({}),
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function initialize(_req, reply) {
      await initializeDatabase();
      reply.code(200).send({});
    },
  });

  api.route({
    method: 'GET',
    url: '/api/channels',
    schema: {
      tags: ['チャンネル'],
      querystring: schema.getChannelsRequestQuery,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getChannelsResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getChannels(req, reply) {
      const database = getDatabase();

      const channels = await database.query.channel.findMany({
        orderBy(channel, { asc }) {
          return asc(channel.id);
        },
        where(channel, { inArray }) {
          if (req.query.channelIds != null) {
            const channelIds = req.query.channelIds.split(',');
            return inArray(channel.id, channelIds);
          }
          return void 0;
        },
      });
      reply
        .header('Cache-Control', 'public, max-age=3600') // 1時間のキャッシュ
        .code(200)
        .send(channels);
    },
  });

  api.route({
    method: 'GET',
    url: '/api/channels/:channelId',
    schema: {
      tags: ['チャンネル'],
      params: schema.getChannelByIdRequestParams,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getChannelByIdResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getChannelById(req, reply) {
      const database = getDatabase();

      const channel = await database.query.channel.findFirst({
        where(channel, { eq }) {
          return eq(channel.id, req.params.channelId);
        },
      });
      if (channel == null) {
        return reply.code(404).send();
      }
      reply.code(200).send(channel);
    },
  });

  api.route({
    method: 'GET',
    url: '/api/episodes',
    schema: {
      tags: ['エピソード'],
      querystring: schema.getEpisodesRequestQuery,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getEpisodesResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getEpisodes(req, reply) {
      const database = getDatabase();

      const episodes = await database.query.episode.findMany({
        orderBy(episode, { asc }) {
          return asc(episode.id);
        },
        where(episode, { inArray }) {
          if (req.query.episodeIds != null) {
            const episodeIds = req.query.episodeIds.split(',');
            return inArray(episode.id, episodeIds);
          }
          return void 0;
        },
        columns: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          premium: true,
        },
        with: {
          series: {
            with: {
              episodes: {
                orderBy(episode, { asc }) {
                  return asc(episode.order);
                },
              },
            },
          },
        },
      });
      reply
        .header('Cache-Control', 'public, max-age=3600') // 1時間のキャッシュ
        .code(200)
        .send(episodes);
    },
  });

  api.route({
    method: 'GET',
    url: '/api/episodes/:episodeId',
    schema: {
      tags: ['エピソード'],
      params: schema.getEpisodeByIdRequestParams,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getEpisodeByIdResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getEpisodeById(req, reply) {
      const database = getDatabase();

      const episode = await database.query.episode.findFirst({
        where(episode, { eq }) {
          return eq(episode.id, req.params.episodeId);
        },
        columns: {
          id: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          premium: true,
        },
        with: {
          series: {
            with: {
              episodes: {
                orderBy(episode, { asc }) {
                  return asc(episode.order);
                },
              },
            },
          },
        },
      });
      if (episode == null) {
        return reply.code(404).send();
      }
      reply.code(200).send(episode);
    },
  });

  api.route({
    method: 'GET',
    url: '/api/series',
    schema: {
      tags: ['シリーズ'],
      querystring: schema.getSeriesRequestQuery,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getSeriesResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getSeries(req, reply) {
      const database = getDatabase();

      const series = await database.query.series.findMany({
        orderBy(series, { asc }) {
          return asc(series.id);
        },
        where(series, { inArray }) {
          if (req.query.seriesIds != null) {
            const seriesIds = req.query.seriesIds.split(',');
            return inArray(series.id, seriesIds);
          }
          return void 0;
        },
        with: {
          episodes: {
            orderBy(episode, { asc }) {
              return asc(episode.order);
            },
            with: {
              series: true,
            },
          },
        },
      });
      reply.code(200).send(series);
    },
  });

  api.route({
    method: 'GET',
    url: '/api/series/:seriesId',
    schema: {
      tags: ['シリーズ'],
      params: schema.getSeriesByIdRequestParams,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getSeriesByIdResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getProgramById(req, reply) {
      const database = getDatabase();

      const series = await database.query.series.findFirst({
        where(series, { eq }) {
          return eq(series.id, req.params.seriesId);
        },
        with: {
          episodes: {
            orderBy(episode, { asc }) {
              return asc(episode.order);
            },
            with: {
              series: true,
            },
          },
        },
      });
      if (series == null) {
        return reply.code(404).send();
      }
      reply.code(200).send(series);
    },
  });

  api.route({
    method: 'GET',
    url: '/api/timetable',
    schema: {
      tags: ['番組表'],
      querystring: schema.getTimetableRequestQuery,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getTimetableResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getTimetable(req, reply) {
      const database = getDatabase();

      const programs = await database.query.program.findMany({
        orderBy(program, { asc }) {
          return asc(program.startAt);
        },
        where(program, { between, sql }) {
          // 競技のため、時刻のみで比較する
          return between(
            program.startAt,
            sql`time(${req.query.since}, '+9 hours')`,
            sql`time(${req.query.until}, '+9 hours')`,
          );
        },
        columns: {
          id: true,
          title: true,
          startAt: true,
          endAt: true,
          thumbnailUrl: true,
          channelId: true,
          episodeId: true,
        },
      });
      reply
        .header('Cache-Control', 'public, max-age=3600') // 1時間のキャッシュ
        .code(200)
        .send(programs);
    },
  });

  api.route({
    method: 'GET',
    url: '/api/programs',
    schema: {
      tags: ['番組'],
      querystring: schema.getProgramsRequestQuery,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getProgramsResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getPrograms(req, reply) {
      const database = getDatabase();

      const programs = await database.query.program.findMany({
        orderBy(program, { asc }) {
          return asc(program.startAt);
        },
        where(program, { inArray }) {
          if (req.query.programIds != null) {
            const programIds = req.query.programIds.split(',');
            return inArray(program.id, programIds);
          }
          return void 0;
        },
        with: {
          channel: true,
          episode: {
            with: {
              series: {
                with: {
                  episodes: {
                    orderBy(episode, { asc }) {
                      return asc(episode.order);
                    },
                  },
                },
              },
            },
          },
        },
      });
      reply.code(200).send(programs);
    },
  });

  api.route({
    method: 'GET',
    url: '/api/programs/:programId',
    schema: {
      tags: ['番組'],
      params: schema.getProgramByIdRequestParams,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getProgramByIdResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getProgramById(req, reply) {
      const database = getDatabase();

      const program = await database.query.program.findFirst({
        where(program, { eq }) {
          return eq(program.id, req.params.programId);
        },
        with: {
          channel: true,
          episode: {
            with: {
              series: {
                with: {
                  episodes: {
                    orderBy(episode, { asc }) {
                      return asc(episode.order);
                    },
                  },
                },
              },
            },
          },
        },
      });
      if (program == null) {
        return reply.code(404).send();
      }
      reply.code(200).send(program);
    },
  });

  api.route({
    method: 'GET',
    url: '/api/recommended/:referenceId',
    schema: {
      tags: ['レコメンド'],
      params: schema.getRecommendedModulesRequestParams,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getRecommendedModulesResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getRecommendedModules(req, reply) {
      const database = getDatabase();

      const modules = await database.query.recommendedModule.findMany({
        orderBy(module, { asc }) {
          return asc(module.order);
        },
        where(module, { eq }) {
          return eq(module.referenceId, req.params.referenceId);
        },
        with: {
          items: {
            orderBy(item, { asc }) {
              return asc(item.order);
            },
          },
        },
      });

      // 必要なデータだけを取得するのだ
      const itemIds = modules.flatMap((module) => module.items.map((item) => item.id));
      const items = await database.query.recommendedItem.findMany({
        where(item, { inArray }) {
          return inArray(item.id, itemIds);
        },
        with: {
          series: true,
          episode: {
            with: {
              series: true,
            },
          },
        },
      });

      // モジュールとアイテムを組み合わせるのだ
      const result = modules.map((module) => ({
        ...module,
        items: module.items.map((item) => {
          const fullItem = items.find((i) => i.id === item.id);
          if (!fullItem) {
            return {
              ...item,
              series: null,
              episode: null,
            };
          }

          return {
            ...item,
            series: fullItem.series
              ? {
                  id: fullItem.series.id,
                  title: fullItem.series.title,
                  description: fullItem.series.description,
                  thumbnailUrl: fullItem.series.thumbnailUrl,
                }
              : null,
            episode: fullItem.episode
              ? {
                  id: fullItem.episode.id,
                  title: fullItem.episode.title,
                  description: fullItem.episode.description,
                  thumbnailUrl: fullItem.episode.thumbnailUrl,
                  series: fullItem.episode.series
                    ? {
                        id: fullItem.episode.series.id,
                        title: fullItem.episode.series.title,
                        description: fullItem.episode.series.description,
                        thumbnailUrl: fullItem.episode.series.thumbnailUrl,
                      }
                    : null,
                }
              : null,
          };
        }),
      }));

      reply.code(200).send(result);
    },
  });

  // CarouselSection用のエンドポイント
  api.route({
    method: 'GET',
    url: '/api/recommended/:referenceId/carousel',
    schema: {
      tags: ['レコメンド'],
      params: schema.getRecommendedCarouselModulesRequestParams,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getRecommendedCarouselModulesResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getRecommendedCarouselModules(req, reply) {
      const database = getDatabase();

      const modules = await database.query.recommendedModule.findMany({
        orderBy(module, { asc }) {
          return asc(module.order);
        },
        where(module, { and, eq }) {
          return and(eq(module.referenceId, req.params.referenceId), eq(module.type, 'carousel'));
        },
        with: {
          items: {
            orderBy(item, { asc }) {
              return asc(item.order);
            },
            with: {
              series: {
                columns: {
                  id: true,
                  title: true,
                  thumbnailUrl: true,
                },
              },
              episode: {
                columns: {
                  id: true,
                  title: true,
                  thumbnailUrl: true,
                  premium: true,
                },
                with: {
                  series: {
                    columns: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      reply.code(200).send(modules);
    },
  });

  // JumbotronSection用のエンドポイント
  api.route({
    method: 'GET',
    url: '/api/recommended/:referenceId/jumbotron',
    schema: {
      tags: ['レコメンド'],
      params: schema.getRecommendedJumbotronModulesRequestParams,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getRecommendedJumbotronModulesResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getRecommendedJumbotronModules(req, reply) {
      const database = getDatabase();

      const modules = await database.query.recommendedModule.findMany({
        orderBy(module, { asc }) {
          return asc(module.order);
        },
        where(module, { and, eq }) {
          return and(eq(module.referenceId, req.params.referenceId), eq(module.type, 'jumbotron'));
        },
        with: {
          items: {
            orderBy(item, { asc }) {
              return asc(item.order);
            },
            with: {
              episode: {
                columns: {
                  id: true,
                  title: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      reply.code(200).send(modules);
    },
  });

  api.route({
    method: 'POST',
    url: '/api/signIn',
    schema: {
      tags: ['認証'],
      body: schema.signInRequestBody,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.signInResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function signIn(req, reply) {
      const database = getDatabase();

      const user = await database.query.user.findFirst({
        where(user, { eq }) {
          return eq(user.email, req.body.email);
        },
      });
      if (!user || !bcrypt.compareSync(req.body.password, user.password)) {
        return reply.code(401).send();
      }

      const ret = schema.signInResponse.parse({ id: user.id, email: user.email });

      req.session.set('id', ret.id.toString());
      reply.code(200).send(ret);
    },
  });

  api.route({
    method: 'POST',
    url: '/api/signUp',
    schema: {
      tags: ['認証'],
      body: schema.signUpRequestBody,
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.signUpResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function signUp(req, reply) {
      const database = getDatabase();

      const hasAlreadyExists = await database.query.user.findFirst({
        where(user, { eq }) {
          return eq(user.email, req.body.email);
        },
      });
      if (hasAlreadyExists) {
        return reply.code(400).send();
      }

      const users = await database
        .insert(databaseSchema.user)
        .values({
          email: req.body.email,
          password: bcrypt.hashSync(req.body.password, 10),
        })
        .returning();

      const user = users.find((u) => u.email === req.body.email);
      if (!user) {
        return reply.code(500).send();
      }

      const ret = schema.signUpResponse.parse({ id: user.id, email: user.email });

      req.session.set('id', ret.id.toString());
      reply.code(200).send(ret);
    },
  });

  api.route({
    method: 'GET',
    url: '/api/users/me',
    schema: {
      tags: ['認証'],
      response: {
        200: {
          content: {
            'application/json': {
              schema: schema.getUserResponse,
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getSession(req, reply) {
      const database = getDatabase();

      const userId = req.session.get('id');
      if (!userId) {
        return reply.code(401).send();
      }

      const user = await database.query.user.findFirst({
        where(user, { eq }) {
          return eq(user.id, Number(userId));
        },
      });
      if (!user) {
        return reply.code(401).send();
      }
      reply.code(200).send(user);
    },
  });

  api.route({
    method: 'POST',
    url: '/api/signOut',
    schema: {
      tags: ['認証'],
    } satisfies FastifyZodOpenApiSchema,
    handler: async function signOut(req, reply) {
      const userId = req.session.get('id');
      if (!userId) {
        return reply.code(401).send();
      }
      req.session.destroy();
      reply.code(200).send();
    },
  });

  // hydrationデータを提供するエンドポイント
  api.route({
    method: 'GET',
    url: '/api/hydration-data/*',
    schema: {
      tags: ['Hydration'],
      response: {
        200: {
          content: {
            'application/json': {
              schema: z.object({
                actionData: z.any(),
                loaderData: z.any(),
              }),
            },
          },
        },
      },
    } satisfies FastifyZodOpenApiSchema,
    handler: async function getHydrationData(req, reply) {
      // @ts-expect-error FastifyのRequest/Replyの型とReact Routerの型の互換性の問題
      const request = createStandardRequest(req, reply);
      const store = createStore({});
      const handler = createStaticHandler(createRoutes(store));
      const context = await handler.query(request);

      if (context instanceof Response) {
        // Responseオブジェクトの場合は、そのままクライアントに返す
        return reply.status(context.status).send(await context.json());
      }

      reply.header('Cache-Control', 'private, max-age=60').header('Content-Type', 'application/json').send({
        actionData: context.actionData,
        loaderData: context.loaderData,
      });
    },
  });

  /* eslint-enable sort/object-properties */
}
