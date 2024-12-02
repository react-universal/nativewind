import { HttpApiBuilder } from '@effect/platform';
import { Array, Effect, Layer, pipe, Record } from 'effect';
import { TwinEnvContext } from '../../TwinEnv.js';
import { FsUtils } from '../../internal/fs.utils.js';
import { TwinServerApi } from '../Api.js';
import { TwinConfigNotFound } from '../Domain/TwinConfig.model.js';
import { TwinConfigService } from './Service.js';

export const HttpTwinConfigLive = HttpApiBuilder.group(
  TwinServerApi,
  'twinConfig',
  (handlers) =>
    Effect.gen(function* () {
      const config = yield* TwinConfigService;
      const env = yield* TwinEnvContext;
      const fs = yield* FsUtils;

      yield* fs.mkdirCached(env.outputDir);
      yield* Effect.all(
        pipe(
          Record.values(env.platformOutputs),
          Array.map((x) => fs.mkEmptyFileCached(x)),
        ),
      );
      console.log('SERVER_ENV: ', env);
      return handlers
        .handle('updateConfig', ({ payload, path }) => {
          return config.with(path.platformID, (data) =>
            config.create(data.platformID, payload),
          );
        })
        .handle('getCurrentConfig', ({ path }) => {
          return config.with(path.platformID, (data) => {
            return config.findByPlatform(path.platformID).pipe(
              Effect.flatten,
              Effect.mapError(
                () => new TwinConfigNotFound({ message: `Notfound: ${path.platformID}` }),
              ),
            );
          });
        });
    }),
).pipe(Layer.provide(TwinConfigService.Default));
// handlers
//   .handle('updateConfig', ({ payload }) =>
//     Effect.gen(function* () {
//       // const ctx = yield* TwinNodeContext;
//       // const projectFiles = yield* Ref.get(ctx.projectFilesRef);
//       // const allowedPaths = yield* ctx.scanAllowedPaths;
//       // const allowedPathPatterns = yield* ctx.getAllowedGlobPatterns;
//       // const runningPlatforms = yield* Ref.get(ctx.runningPlatformsRef);
//       // return {
//       //   allowedFilePaths: allowedPaths.files,
//       //   allowedPathPatterns,
//       //   projectFiles: projectFiles,
//       //   runningPlatforms,
//       // };
//       const config = yield* configRepo.findById(TwinConfigId.make(1));
//       const result = Option.match(config, {
//         onNone: () =>
//           new TwinConfigError({
//             message: 'Error!',
//           }),
//         onSome: (_) => _,
//       });
//       return result;
//     }),
//   )
//   .handle('getCurrentConfig', () =>
//     Effect.gen(function* () {
//       // const ctx = yield* TwinNodeContext;
//       // const allowedPaths = yield* ctx.scanAllowedPaths;
//       // const projectFiles = yield* Ref.get(ctx.projectFilesRef);
//       // const allowedPathPatterns = yield* ctx.getAllowedGlobPatterns;
//       // const runningPlatforms = yield* Ref.get(ctx.runningPlatformsRef);
//       // return {
//       //   allowedFilePaths: allowedPaths.files,
//       //   allowedPathPatterns,
//       //   projectFiles: projectFiles,
//       //   runningPlatforms,
//       // };

//       const config = yield* configRepo.findById(TwinConfigId.make(1));
//       const result = Option.match(config, {
//         onNone: () =>
//           new TwinConfigError({
//             message: 'Error!',
//           }),
//         onSome: (_) => _,
//       });
//       return result;
//     }),
//   ),
// ).pipe(Layer.provide(TwinConfigMiddlewareLive));
