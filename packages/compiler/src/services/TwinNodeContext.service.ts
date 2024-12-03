import { Option } from 'effect';
import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Ref from 'effect/Ref';
import * as SubscriptionRef from 'effect/SubscriptionRef';
import * as micromatch from 'micromatch';
import * as path from 'node:path';
import { defineConfig } from '@native-twin/core';
import {
  createTwinProcessor,
  extractTwinConfig,
  getFilesFromGlobs,
} from '../utils/twin.utils.js';
import { CompilerConfigContext } from './CompilerConfig.service.js';

const TwinNodeContextLive = Effect.gen(function* () {
  const { env } = yield* CompilerConfigContext;
  const initialConfig = Option.map(env.twinConfigPath, (x) => extractTwinConfig(x)).pipe(
    Option.getOrElse(() => defineConfig({ content: [] })),
  );
  const projectFilesRef = yield* SubscriptionRef.make(HashSet.empty<string>());
  const twinConfigRef = yield* SubscriptionRef.make(initialConfig);
  const runningPlatformsRef = yield* SubscriptionRef.make(HashSet.empty<string>());
  const twRunnersRef = yield* Ref.make({
    native: createTwinProcessor('native', initialConfig),
    web: createTwinProcessor('web', initialConfig),
  });

  const getAllowedGlobPatterns = Ref.get(twinConfigRef).pipe(
    Effect.map((x) =>
      pipe(
        RA.map(x.content, (x) => path.join(env.projectRoot, x)),
        (x) => [env.twinConfigPath.pipe(Option.getOrElse(() => '')), ...x],
      ),
    ),
  );

  const scanAllowedPaths = getAllowedGlobPatterns.pipe(
    Effect.map((globPatterns) => getFilesFromGlobs(globPatterns)),
  );

  const isAllowedPath = (filePath: string) =>
    getAllowedGlobPatterns.pipe(
      Effect.map((globPatterns) => {
        return (
          micromatch.isMatch(path.join(env.projectRoot, filePath), globPatterns) ||
          micromatch.isMatch(filePath, globPatterns)
        );
      }),
    );

  const getTwForPlatform = (platform: string) => {
    return Ref.get(twRunnersRef).pipe(
      Effect.map((runners) => {
        if (platform === 'web') return runners.web;
        return runners.native;
      }),
    );
  };

  const getOutputCSSPath = (platform: string) => {
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
  };
  return {
    projectFilesRef,
    twinConfigRef,
    runningPlatformsRef,
    getAllowedGlobPatterns,
    twinConfig: yield* Ref.get(twinConfigRef),
    tw: twRunnersRef,
    isAllowedPath,
    getTwForPlatform,
    getOutputCSSPath,
    scanAllowedPaths,
  };
});

export class TwinNodeContext extends Context.Tag('node/shared/context')<
  TwinNodeContext,
  Effect.Effect.Success<typeof TwinNodeContextLive>
>() {
  static Live = Layer.scoped(TwinNodeContext, TwinNodeContextLive);
}

// export const TwinNodeUserConfig = Effect.Tag('TwinNodeUserConfig')<
//   'twin/TwinNodeUserConfig',
//   {
//     projectRoot: string;
//     outputDir: string;
//     configPath: string;
//     inputCSS: string;
//     debug: boolean;
//   }
// >();

export type NodeContextShape = TwinNodeContext['Type'];
