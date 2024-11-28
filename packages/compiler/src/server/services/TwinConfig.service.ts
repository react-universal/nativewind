import * as HttpApi from '@effect/platform/HttpApi';
import * as HttpApiBuilder from '@effect/platform/HttpApiBuilder';
import * as HttpApiEndpoint from '@effect/platform/HttpApiEndpoint';
import * as HttpApiGroup from '@effect/platform/HttpApiGroup';
import * as HttpApiMiddleware from '@effect/platform/HttpApiMiddleware';
import * as HttpApiSchema from '@effect/platform/HttpApiSchema';
import * as OpenApi from '@effect/platform/OpenApi';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Schema from 'effect/Schema';
import { TwinNodeContext } from '../../node/services/TwinNodeContext.service';

/**
 * @category ServerModels
 */
class TwinServerConfigError extends Schema.TaggedError<TwinServerConfigError>()(
  'TwinServerConfigError',
  {
    message: Schema.String,
  },
  HttpApiSchema.annotations({
    status: 401,
    description: 'Must provide a twin configuration',
  }),
) {}

/**
 * @category ServerModels
 */
class TwinServerConfig extends Schema.Class<TwinServerConfig>('TwinServerConfig')({
  projectFiles: Schema.HashSet(Schema.String),
  runningPlatforms: Schema.HashSet(Schema.String),
  allowedFilePaths: Schema.Array(Schema.String),
  allowedPathPatterns: Schema.Array(Schema.String),
}) {}

/**
 * @category ServerModels
 */
class TwinCurrentConfig extends Context.Tag('TwinCurrentConfig')<
  TwinCurrentConfig,
  TwinServerConfig
>() {}

/**
 * @category ServerMiddleware
 */
export class TwinConfigMiddleware extends HttpApiMiddleware.Tag<TwinConfigMiddleware>()(
  'TwinConfigMiddleware',
  {
    failure: TwinServerConfigError,
    provides: TwinCurrentConfig,
  },
) {}

/**
 * @category ServerApis
 */
export class TwinConfigApiGroup extends HttpApiGroup.make('twinConfig')
  .add(
    HttpApiEndpoint.post('setConfig', '/')
      .setPayload(
        HttpApiSchema.Multipart(
          Schema.Struct({
            logLevel: Schema.String,
            inputCSS: Schema.String,
            outputDir: Schema.String,
            projectRoot: Schema.String,
            twinConfigPath: Schema.String,
          }),
        ),
      )
      .addSuccess(TwinServerConfig)
      .addError(
        Schema.String.pipe(HttpApiSchema.asEmpty({ status: 413, decode: () => 'boom' })),
      ),
  )
  .add(HttpApiEndpoint.get('current', '/current').addSuccess(TwinServerConfig))
  .middleware(TwinConfigMiddleware)
  .prefix('/config')
  .annotateContext(
    OpenApi.annotations({
      title: 'Twin config API',
      description: 'API for handle twin config endpoints',
    }),
  ) {}

export const TwinConfigMiddlewareLive = Layer.effect(
  TwinConfigMiddleware,
  Effect.gen(function* () {
    return TwinConfigMiddleware.of(
      Effect.succeed({
        allowedFilePaths: [],
        allowedPathPatterns: [],
        projectFiles: HashSet.empty<string>(),
        runningPlatforms: HashSet.empty<string>(),
      }),
    );
  }),
);

export class TwinConfigGroupAPI extends HttpApi.empty.add(TwinConfigApiGroup) {}

export const TwinServerConfigGroupLive = HttpApiBuilder.group(
  TwinConfigGroupAPI,
  'twinConfig',
  (handlers) =>
    handlers
      .handle('setConfig', (_) =>
        Effect.gen(function* () {
          const ctx = yield* TwinNodeContext;
          const allowedPaths = yield* ctx.scanAllowedPaths;
          const projectFiles = yield* Ref.get(ctx.projectFilesRef);
          const allowedPathPatterns = yield* ctx.getAllowedGlobPatterns;
          const runningPlatforms = yield* Ref.get(ctx.runningPlatformsRef);
          return {
            allowedFilePaths: allowedPaths.files,
            allowedPathPatterns,
            projectFiles: projectFiles,
            runningPlatforms,
          };
        }),
      )
      .handle('current', () =>
        Effect.gen(function* () {
          const ctx = yield* TwinNodeContext;
          const allowedPaths = yield* ctx.scanAllowedPaths;
          const projectFiles = yield* Ref.get(ctx.projectFilesRef);
          const allowedPathPatterns = yield* ctx.getAllowedGlobPatterns;
          const runningPlatforms = yield* Ref.get(ctx.runningPlatformsRef);
          return {
            allowedFilePaths: allowedPaths.files,
            allowedPathPatterns,
            projectFiles: projectFiles,
            runningPlatforms,
          };
        }),
      ),
).pipe(Layer.provide(TwinConfigMiddlewareLive));
