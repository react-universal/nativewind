import * as NodeHttpServer from '@effect/platform-node/NodeHttpServer';
import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as HttpMiddleware from '@effect/platform/HttpMiddleware';
import * as HttpServer from '@effect/platform/HttpServer';
import * as Layer from 'effect/Layer';
import { createServer } from 'node:http';
import { TwinServerApiLive } from './Http.js';

export const LaunchTwinServer = HttpApiBuilder.serve(HttpMiddleware.logger).pipe(
  // Layer.provide(HttpApiBuilder.middlewareOpenApi()),
  // Layer.provide(HttpApiSwagger.layer()),
  Layer.provide(HttpApiBuilder.middlewareCors()),
  Layer.provide(TwinServerApiLive),
  // Layer.provide(HttpServerRequest.),
  // Layer.provide(TwinNodeContext.Live),
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000, path: 'localhost' })),
  Layer.launch,
);
