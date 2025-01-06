import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as Stream from 'effect/Stream';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import { TwinPath } from '../internal/fs';
import { CompilerStyleSheet } from '../models/CompilerSheet';
import type { ImportedTwinConfig } from '../models/Twin.models.js';
import { createTwinProcessor, extractTwinConfig } from '../utils/twin.utils.js';
import { CompilerConfigContext } from './CompilerConfig.service.js';

const make = Effect.gen(function* () {
  const env = yield* CompilerConfigContext;
  const twinPath = yield* TwinPath.TwinPath;

  const twinConfigRef = yield* SubscriptionRef.make(
    extractTwinConfig(env.twinConfigPath),
  );
  const projectFilesRef = yield* SubscriptionRef.make(
    HashSet.fromIterable(
      yield* getProjectFilesFromConfig(yield* Ref.get(twinConfigRef), 'sync'),
    ),
  );
  const runningPlatformsRef = yield* SubscriptionRef.make(HashSet.empty<string>());
  const twRunnersRef = yield* Ref.get(twinConfigRef).pipe(
    Effect.flatMap((config) =>
      Ref.make({
        native: new CompilerStyleSheet(
          {
            baseRem: config.root.rem ?? 16,
            platform: 'native',
          },
          createTwinProcessor('native', config) as any,
          true,
        ),
        web: new CompilerStyleSheet(
          {
            baseRem: config.root.rem ?? 16,
            platform: 'web',
          },
          createTwinProcessor('web', config) as any,
          true,
        ),
      }),
    ),
  );

  return {
    state: {
      projectFiles: {
        ref: projectFilesRef,
        get: SubscriptionRef.get(projectFilesRef),
        changes: Stream.changes(projectFilesRef.changes),
      },
      twinConfig: {
        ref: twinConfigRef,
        get: SubscriptionRef.get(twinConfigRef),
        changes: Stream.changes(twinConfigRef.changes),
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
    subscribeToConfigScoped,
    isAllowedPath,
    getTwForPlatform,
    getOutputCSSPath,
    getProjectFilesFromConfig,
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

  function getProjectFilesFromConfig(
    config: ImportedTwinConfig,
    mode: 'sync' | 'async' = 'async',
  ) {
    return Stream.fromIterable(config.content).pipe(
      Stream.map(twinPath.make.glob),
      Stream.runCollect,
      Effect.flatMap((globs) => twinPath.glob(globs, mode)),
      Effect.map(RA.map(twinPath.make.absoluteFromString)),
    );
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

  function isAllowedPath(filePath: string) {
    return Ref.get(projectFilesRef).pipe(
      Effect.map((projectFiles) => {
        const absPath = twinPath.make.absoluteFromString(filePath);
        return HashSet.has(projectFiles, absPath);
      }),
    );
  }

  function subscribeToConfigScoped(
    onChange: (config: ImportedTwinConfig) => Effect.Effect<void>,
  ) {
    return twinConfigRef.changes
      .pipe(Stream.runForEach(onChange))
      .pipe(Effect.forkScoped);
  }
});

export interface TwinNodeContext extends Effect.Effect.Success<typeof make> {}
export const TwinNodeContext = Context.GenericTag<TwinNodeContext>('node/shared/context');

export const TwinNodeContextLive = Layer.effect(TwinNodeContext, make).pipe(
  Layer.provide(TwinPath.TwinPathLive),
);
