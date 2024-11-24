import * as Effect from 'effect/Effect';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { makeNodeLayer } from '@native-twin/compiler/node';
import { TwinCSSExtractor } from '@native-twin/compiler/programs/css.extractor';

export interface TwinVitePluginConfig {
  inputCSS: string;
  outputCSS: string;
  projectRoot?: string;
  twinConfigPath: string;
}

const extractor = (config: TwinVitePluginConfig) => (code: string, filePath: string) =>
  TwinCSSExtractor(code, filePath).pipe(
    Effect.flatMap((compiled) =>
      Effect.gen(function* () {
        const outputExists = fs.existsSync(config.outputCSS);
        if (!outputExists) return compiled;

        yield* Effect.promise(() => fsp.writeFile(config.outputCSS, compiled.cssOutput));
        console.log('RESULT____: ', compiled.cssOutput);
        return compiled;
      }),
    ),
  );

export const createTwinExtractor = (viteConfig: TwinVitePluginConfig) => {
  const nodeLayer = makeNodeLayer({
    configPath: viteConfig.twinConfigPath,
    debug: true,
    inputCSS: viteConfig.inputCSS,
    projectRoot: viteConfig.projectRoot,
  });
  const runExtractorEffect = extractor(viteConfig);

  return {
    viteConfig,
    extractor: async (code: string, filePath: string) => {
      return runExtractorEffect(code, filePath).pipe(
        Effect.provide(nodeLayer),
        Effect.runPromise,
      );
    },
  };
};

// const config = makeBabelConfig({
//   code,
//   filename: filepath,
//   inputCSS: `${projectRoot}/input.css`,
//   outputCSS: `${projectRoot}/public/output.css`,
//   platform: 'web',
//   projectRoot,
//   twinConfigPath: 'tailwind.config.ts',
// });
