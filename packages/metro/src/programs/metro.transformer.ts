import * as path from 'node:path';
import {
  BabelCompilerContext,
  CompilerConfigContext,
  TwinDocumentsContext,
  TwinNodeContext,
} from '@native-twin/compiler';
import { matchCss } from '@native-twin/helpers/server';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as LogLevel from 'effect/LogLevel';
import * as Option from 'effect/Option';
import type { TransformResponse } from 'metro-transform-worker';
import * as worker from 'metro-transform-worker';
import type { TwinMetroTransformFn } from '../models/Metro.models.js';
import { MetroLayerWithTwinFS } from '../services/Metro.layers.js';
import { transformCSSExpo } from '../utils/css.utils.js';

type MetroTransformFn = typeof worker.transform;

export const transform: TwinMetroTransformFn = async (
  config,
  projectRoot,
  filename,
  data,
  options,
) => {
  const twinConfig = config.twinConfig;
  const platform = options.platform ?? 'native';

  return Effect.gen(function* () {
    const { createDocument } = yield* TwinDocumentsContext;
    const ctx = yield* TwinNodeContext;
    const compiler = yield* BabelCompilerContext;
    const platformOutput = ctx.getOutputCSSPath(platform);

    const transform: MetroTransformFn = twinConfig.originalTransformerPath
      ? require(twinConfig.originalTransformerPath).transform
      : worker.transform;

    if (
      platformOutput &&
      matchCss(filename) &&
      filename.includes(path.basename(platformOutput))
    ) {
      console.log('[METRO_TRANSFORMER]: Detect css file', filename);
      const result: TransformResponse = yield* Effect.promise(() =>
        transformCSSExpo(config, projectRoot, filename, data, options),
      );
      // console.log('RESULT: ', result);
      return result;
    }

    if (!(yield* ctx.isAllowedPath(filename))) {
      return yield* Effect.promise(() =>
        transform(config, projectRoot, filename, data, options),
      );
    }

    let code = data.toString('utf-8');
    const document = yield* createDocument(filename, code);
    const output = yield* compiler.compileTwinDocument(document, platform);

    const result = yield* compiler.mutateAST(output.ast);
    // yield* Effect.log('MUTATE: ');

    if (result?.code) {
      // console.log('OPTIONS: ', params.options);
      code = `const runtimeTW = require('@native-twin/core').tw;\n\n${result.code}`;
    }

    const transformed = yield* Effect.promise(() =>
      transform(config, projectRoot, filename, Buffer.from(code, 'utf-8'), options),
    );

    return transformed;
  }).pipe(
    Effect.provide(MetroLayerWithTwinFS),
    Effect.provide(
      Layer.succeed(CompilerConfigContext, {
        inputCSS: config.twinConfig.inputCSS,
        logLevel: LogLevel.fromLiteral(config.twinConfig.logLevel),
        outputDir: config.twinConfig.outputDir,
        platformPaths: config.twinConfig.platformOutputs,
        projectRoot: config.twinConfig.projectRoot,
        twinConfigPath: Option.fromNullable(config.twinConfig.twinConfigPath),
      }),
    ),
    Effect.runPromise,
  );
};
