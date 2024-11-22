import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import micromatch from 'micromatch';
import path from 'node:path';
import type { TailwindConfig } from '@native-twin/core';
import type { InternalTwFn, InternalTwinConfig } from '../native-twin';
import { createTwinProcessor, extractTwinConfig } from '../utils/twin.utils';

interface ContextOptions {
  projectRoot: string;
  twinConfigPath: string;
  inputCSS: string;
  outputDir: string;
  debug: boolean;
  twinConfig?: TailwindConfig<InternalTwinConfig>;
}
const make = ({
  projectRoot,
  twinConfigPath,
  inputCSS,
  outputDir,
  debug,
  twinConfig,
}: ContextOptions) => {
  return Effect.gen(function* () {
    let configPath = twinConfigPath;
    let finalConfig: TailwindConfig<InternalTwinConfig> | null = twinConfig ?? null;

    if (!finalConfig) {
      const userConfig = extractTwinConfig({ projectRoot, twinConfigPath });
      finalConfig = finalConfig ?? userConfig.config;
      configPath = userConfig.twinConfigPath;
    }

    const nativeTw = createTwinProcessor('native', finalConfig);
    const webTw = createTwinProcessor('web', finalConfig);

    const allowedPathsGlob = RA.map(finalConfig.content, (x) =>
      path.join(projectRoot, x),
    );

    const allowedPaths = RA.map(
      RA.map(allowedPathsGlob, (x) => micromatch.scan(x)),
      (x) => x.base,
    );

    const isAllowedPath = (filePath: string) => {
      // console.log('ALLOWED_PATHS: ', filePath, this.allowedPathsGlob);
      return (
        micromatch.isMatch(path.join(projectRoot, filePath), allowedPathsGlob) ||
        micromatch.isMatch(filePath, allowedPathsGlob)
      );
    };

    const outputPaths = {
      defaultFile: path.join(outputDir, 'twin.out.native.css'),
      web: path.join(outputDir, 'twin.out.web.css'),
      ios: path.join(outputDir, 'twin.out.ios.css.js'),
      android: path.join(outputDir, 'twin.out.android.css.js'),
      native: path.join(outputDir, 'twin.out.native.css.js'),
    };

    const getTwForPlatform = (platform: string) => {
      if (platform === 'web') return webTw;
      return nativeTw;
    };

    const getOutputCSSPath = (platform: string) => {
      switch (platform) {
        case 'web':
          return outputPaths.web;
        case 'ios':
          return outputPaths.ios;
        case 'android':
          return outputPaths.android;
        case 'native':
          return outputPaths.native;
        default:
          console.warn('[WARN]: cant determine outputCSS fallback to default');
          return outputPaths.defaultFile;
      }
    };

    const config = {
      allowedPathsGlob,
      allowedPaths,
      projectRoot,
      twinConfigPath: configPath,
      twinConfig: finalConfig,
      inputCSS,
      outputDir,
      outputPaths,
      debug,
    };
    return Layer.succeed(
      TwinNodeContext,
      TwinNodeContext.of({
        config,
        utils: {
          isAllowedPath,
          getTwForPlatform,
          getOutputCSSPath,
        },
        tw: {
          native: nativeTw,
          web: webTw,
        },
      }),
    );
  }).pipe(Layer.unwrapEffect);
};

export class TwinNodeContext extends Context.Tag('node/shared/context')<
  TwinNodeContext,
  {
    config: {
      projectRoot: string;
      twinConfigPath: string;
      inputCSS: string;
      twinConfig: TailwindConfig<InternalTwinConfig>;
      outputDir: string;
      debug: boolean;
      allowedPathsGlob: string[];
      allowedPaths: string[];
      outputPaths: {
        defaultFile: string;
        web: string;
        ios: string;
        android: string;
        native: string;
      };
    };
    tw: {
      native: InternalTwFn;
      web: InternalTwFn;
    };
    utils: {
      isAllowedPath: (path: string) => boolean;
      getTwForPlatform: (platform: string) => InternalTwFn;
      getOutputCSSPath: (platform: string) => string;
    };
  }
>() {
  static make = make;
}

export type NodeContextShape = TwinNodeContext['Type'];
