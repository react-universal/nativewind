import { DevTools } from '@effect/experimental';
import { NodeSocket } from '@effect/platform-node';
import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import fs from 'node:fs';
import path from 'node:path';
import { inspect } from 'node:util';
// import { inspect } from 'node:util';
import {
  DEFAULT_TWIN_INPUT_CSS_FILE,
  TWIN_DEFAULT_FILES,
} from '../../shared/twin.constants.js';
import { NodeWithNativeTwinOptions } from '../models/Compiler.types.js';
import { extractTwinConfig } from '../utils/twin.utils.js';
import { getTwinCacheDir } from '../utils/twin.utils.node.js';
import { twinLoggerLayer } from './Logger.service.js';
import { ReactCompilerService } from './ReactBabel.service.js';
import { TwinFileSystem } from './TwinFileSystem.service.js';
import { TwinNodeContext } from './TwinNodeContext.service.js';

export const NodeMainLayer = Layer.empty.pipe(
  Layer.provideMerge(ReactCompilerService.Live),
  Layer.provideMerge(TwinFileSystem.Live),
);

const DevToolsLive = DevTools.layerWebSocket().pipe(
  Layer.provide(NodeSocket.layerWebSocketConstructor),
);

const FSLive = Layer.mergeAll(NodeFileSystem.layer, NodePath.layer);

// const getOrCreateFile = (config: {
//   basedir: string;
//   filePath: string;
//   fallbackFilePath: string;
// }) =>
//   Effect.gen(function* () {
//     console.debug('----START_GET_FILE-----');
//     console.debug(inspect(config, false, null, true));
//     let filePath = config.filePath;
//     const isAbsolute = path.isAbsolute(config.filePath);
//     if (!isAbsolute) {
//       console.log('filePath is not absolute: ', config.filePath);
//       filePath = path.join(config.basedir, config.filePath);
//       console.log('created absolute path: ', filePath);
//     }

//     if (!fs.existsSync(filePath)) {
//       console.log('filePath not exists: ', filePath);
//     }

//     console.debug('----END_GET_FILE-----\n\n');
//     return {
//       filePath,
//     };
//   });

export const makeNodeLayer = (config: NodeWithNativeTwinOptions) => {
  return Effect.gen(function* () {
    if (!config.inputCSS) {
      yield* Effect.log('NO_INPUT: ', inspect(config, false, null, true));
    }
    const projectRoot = yield* Effect.fromNullable(config.projectRoot).pipe(
      Effect.tapError(() =>
        Effect.log('projectRoot not provided, falling back to CWD', process.cwd()),
      ),
      Effect.orElse(() => Effect.succeed(process.cwd())),
    );
    const outputDir = yield* Effect.fromNullable(config.outputDir).pipe(
      Effect.tapError(() =>
        Effect.log('outDir not provided, falling back to:', getTwinCacheDir()),
      ),
      Effect.orElse(() => Effect.succeed(getTwinCacheDir())),
    );

    const defaultInputCSS = path.join(outputDir, DEFAULT_TWIN_INPUT_CSS_FILE);
    const inputCSS = yield* Effect.fromNullable(config.inputCSS).pipe(
      Effect.tapError(() =>
        Effect.log('inputCSS not provided, falling back to internal', config.inputCSS),
      ),
      Effect.orElse(() => {
        const exists = fs.existsSync(defaultInputCSS);
        if (!exists) {
          fs.writeFileSync(defaultInputCSS, new Uint8Array());
        }
        return Effect.succeed(defaultInputCSS);
      }),
    );

    const defaultTwinConfig = path.join(outputDir, 'tailwind.config.ts');
    const twinConfigPath = yield* Effect.fromNullable(config.configPath).pipe(
      Effect.flatMap((file) =>
        Effect.gen(function* () {
          const isAbsolute = path.isAbsolute(file);
          if (!isAbsolute) {
            file = path.join(projectRoot, file);
          }
          const exists = fs.existsSync(file);
          if (!exists) {
            yield* Effect.logWarning('provided twinConfigPath does not exists: ', file);
            return yield* Effect.fail('NoSuchElement');
          }
          return file;
        }),
      ),
      Effect.tapError(() =>
        Effect.log('tailwind file not provided, falling back to:', defaultTwinConfig),
      ),
      Effect.orElse(() =>
        Effect.gen(function* () {
          yield* Effect.log('Searching for twin config common files');
          const configFiles = TWIN_DEFAULT_FILES.map((x) => {
            return path.join(projectRoot, x);
          });
          const foundConfigFile = yield* Effect.firstSuccessOf(
            configFiles.map((x) => Effect.liftPredicate(x, fs.existsSync, () => '')),
          ).pipe(
            Effect.orElse(() => {
              return Effect.gen(function* () {
                const filePath = path.join(projectRoot, 'tailwind.config.ts');
                fs.writeFileSync(
                  filePath,
                  new TextEncoder()
                    .encode(`import { defineConfig } from '@native-twin/core';\nexport default tailwindConfig = defineConfig({ contents: [] });
                  `),
                  {
                    flag: 'a+',
                  },
                );

                return filePath;
              });
            }),
          );
          return foundConfigFile;
        }),
      ),
    );

    const twinConfig = extractTwinConfig({ projectRoot, twinConfigPath });

    
    return NodeMainLayer.pipe(
      Layer.provideMerge(
        TwinNodeContext.make({
          projectRoot,
          debug: true,
          inputCSS,
          outputDir,
          twinConfigPath,
          twinConfig: twinConfig.config,
        }),
      ),
    );
  }).pipe(
    Effect.withSpan('Hi', {
      attributes: { foo: 'bar' },
      captureStackTrace: true,
      root: true,
    }),
    Layer.unwrapEffect,
    Layer.provideMerge(FSLive),
    Layer.provide(twinLoggerLayer),
    Layer.provide(DevToolsLive),
  );
};

// export const makeNodeLayer = (config: NodeWithNativeTwinOptions) => {
//   const projectRoot = config.projectRoot ?? process.cwd();
//   const twinConfigPath = config.configPath ?? 'tailwind.config.ts';

//   let inputCSS = config.inputCSS;
//   const outputDir = config.outputDir ?? getTwinCacheDir();

//   if (!inputCSS) {
//     inputCSS = path.join(outputDir, DEFAULT_TWIN_INPUT_CSS_FILE);
//   } else {
//     const isAbsolute = path.isAbsolute(inputCSS);
//     const absolutePath = path.join(projectRoot, inputCSS);
//     if (!isAbsolute) {
//       if (fs.existsSync(absolutePath)) {
//         inputCSS = absolutePath;
//       }
//     }
//   }

//   if (!fs.existsSync(outputDir)) {
//     console.log('CREATING_OUTPUT_FILE_AT: ', outputDir);
//     fs.mkdirSync(outputDir, { recursive: true });
//   }

//   if (!fs.existsSync(inputCSS)) {
//     console.log('CREATING_INPUT_FILE_AT: ', inputCSS);
//     fs.writeFileSync(inputCSS, '');
//   }

//   const twinConfig = extractTwinConfig({ projectRoot, twinConfigPath });

//   const nodeContext = TwinNodeContext.make({
//     projectRoot,
//     outputDir,
//     debug: !!config.debug,
//     twinConfigPath: twinConfig.twinConfigPath,
//     inputCSS,
//     twinConfig: twinConfig.config,
//   });

//   const MainLayer = Layer.empty
//     .pipe(Layer.provideMerge(nodeContext))
//     .pipe(Layer.provide(twinLoggerLayer));

//   const executor = ManagedRuntime.make(MainLayer);

//   return {
//     MainLayer,
//     executor,
//   };
// };

export type TwinNodeLayer = ReturnType<typeof makeNodeLayer>;
