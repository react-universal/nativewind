import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as HttpApiSwagger from '@effect/platform/HttpApiSwagger';
import * as HttpMiddleware from '@effect/platform/HttpMiddleware';
import * as HttpServer from '@effect/platform/HttpServer';
import * as Layer from 'effect/Layer';
import { createServer } from 'node:http';
import { TwinNodeContext } from '../node/services/TwinNodeContext.service';
import { TwinServerApiLive } from './services/TwinApi.service';

export const LaunchTwinServer = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(TwinServerApiLive),
  Layer.provide(HttpApiBuilder.middlewareCors()),
  Layer.provide(TwinNodeContext.Live),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
  Layer.launch,
);
