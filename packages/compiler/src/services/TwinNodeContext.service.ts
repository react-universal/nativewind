import * as path from 'node:path';
import type { CompilerContext } from '@native-twin/css/jsx';
import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as Ref from 'effect/Ref';
import * as Stream from 'effect/Stream';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import * as micromatch from 'micromatch';
import { FsUtils, FsUtilsLive } from '../internal/fs.utils.js';
import type { ExtractedTwinConfig } from '../models/Twin.models.js';
import { createFilesTree } from '../utils/logger.utils.js';
import { createTwinProcessor, extractTwinConfig } from '../utils/twin.utils.js';
import { CompilerConfigContext } from './CompilerConfig.service.js';

const TwinNodeContextLive = Effect.gen(function* () {
  const env = yield* CompilerConfigContext;
  const fs = yield* FsUtils;

  const projectFilesRef = yield* SubscriptionRef.make(HashSet.empty<string>());
  const twinConfigRef = yield* SubscriptionRef.make(
    extractTwinConfig(env.twinConfigPath),
  );
  const runningPlatformsRef = yield* SubscriptionRef.make(HashSet.empty<string>());
  const twRunnersRef = yield* Ref.get(twinConfigRef).pipe(
    Effect.flatMap((config) =>
      Ref.make({
        native: createTwinProcessor('native', config),
        web: createTwinProcessor('web', config),
      }),
    ),
  );

  const getAllowedGlobPatterns = Ref.get(twinConfigRef).pipe(
    Effect.map((x) =>
      pipe(
        RA.map(x.content, (x) => path.join(env.projectRoot, x)),
        (x) => [env.twinConfigPath.pipe(Option.getOrElse(() => '')), ...x],
      ),
    ),
  );

  return {
    state: {
      projectFiles: {
        ref: projectFilesRef,
        get: SubscriptionRef.get(projectFilesRef),
        changes: Stream.changes(projectFilesRef.changes).pipe(
          Stream.tap((x) =>
            createFilesTree(RA.fromIterable(x), env.projectRoot).pipe(
              Effect.tap((message) =>
                message.length > 0
                  ? Effect.logDebug('Project files: \n', message.trimStart())
                  : Effect.void,
              ),
            ),
          ),
        ),
      },
      twinConfig: {
        ref: twinConfigRef,
        get: SubscriptionRef.get(twinConfigRef),
        changes: Stream.changes(twinConfigRef.changes),
        subscribeWith: (
          equals: (
            a: ExtractedTwinConfig,
            b: ExtractedTwinConfig,
          ) => Effect.Effect<boolean>,
        ) => Stream.changesWithEffect(twinConfigRef.changes, equals),
      },
      runningPlatforms: {
        ref: runningPlatformsRef,
        get: SubscriptionRef.get(runningPlatformsRef),
        changes: Stream.changes(runningPlatformsRef.changes),
      },
      twRunners: {
        get: Ref.get(twRunnersRef),
      },
    },
    isAllowedPath,
    getTwForPlatform,
    getOutputCSSPath,
    getTwinRuntime,
    getProjectFilesFromConfig,
    getProjectFilesFromConfigSync,
    onChangeTwinConfigFile,
  };

  function getTwForPlatform(platform: string) {
    return Ref.get(twRunnersRef).pipe(
      Effect.map((runners) => {
        if (platform === 'web') return runners.web;
        return runners.native;
      }),
    );
  }

  function getProjectFilesFromConfig(config: ExtractedTwinConfig) {
    return fs
      .glob(config.content)
      .pipe(Effect.map(RA.map((x) => (typeof x === 'string' ? x : x.parentPath))));
  }

  function getProjectFilesFromConfigSync(config: ExtractedTwinConfig) {
    return fs.globFilesSync(config.content);
  }

  function onChangeTwinConfigFile() {
    return Effect.gen(function* () {
      const twinConfig = extractTwinConfig(env.twinConfigPath);
      const projectFiles = yield* getProjectFilesFromConfig(twinConfig);
      yield* SubscriptionRef.set(projectFilesRef, HashSet.fromIterable(projectFiles));
    }).pipe(Effect.catchAll((e) => Effect.logError('Cant extract twin config file', e)));
  }

  function getOutputCSSPath(platform: string) {
    switch (platform) {
      case 'web':
        return env.platformPaths.web;
      case 'ios':
        return env.platformPaths.ios;
      case 'android':
        return env.platformPaths.android;
      case 'native':
        return env.platformPaths.native;
      default:
        console.warn('[WARN]: cant determine outputCSS fallback to default');
        return env.platformPaths.native;
    }
  }

  function getTwinRuntime(platform: string) {
    return getTwForPlatform(platform).pipe(
      Effect.map((tw) => {
        const compilerContext: CompilerContext = {
          baseRem: tw.config.root.rem ?? 16,
          platform,
        };
        return {
          tw,
          compilerContext,
        };
      }),
    );
  }

  function isAllowedPath(filePath: string) {
    return getAllowedGlobPatterns.pipe(
      Effect.map((globPatterns) => {
        return (
          micromatch.isMatch(path.join(env.projectRoot, filePath), globPatterns) ||
          micromatch.isMatch(filePath, globPatterns)
        );
      }),
    );
  }
});

export class TwinNodeContext extends Context.Tag('node/shared/context')<
  TwinNodeContext,
  Effect.Effect.Success<typeof TwinNodeContextLive>
>() {
  static Live = Layer.scoped(TwinNodeContext, TwinNodeContextLive).pipe(
    Layer.provide(FsUtilsLive),
  );
}

export type NodeContextShape = TwinNodeContext['Type'];
