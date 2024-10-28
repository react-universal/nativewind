// import connect from 'connect';
// import * as Chunk from 'effect/Chunk';
// import * as Effect from 'effect/Effect';
// import { pipe } from 'effect/Function';
// import * as Stream from 'effect/Stream';
// import fsPromises from 'fs/promises';
// import type { GetTransformOptions } from 'metro-config';
// import type { ConfigT } from 'metro-config';
// import type { FileSystem } from 'metro-file-map';
// import type { CustomResolver } from 'metro-resolver';
// import type MetroServer from 'metro/src/Server';
// import path from 'node:path';
// import { TwinWatcherService, NativeTwinServiceNode } from '../node';
// import { MetroConfigService, TwinMetroConfig } from './services';

// let haste: any;
// const virtualModules = new Map<string, Promise<string | Buffer>>();
// const setupPlatforms: Set<string> = new Set();
// let isWatching = false;

// /** @category Programs */
// export const getTransformerOptions = (
//   ...[entryPoints, options, getDeps]: Parameters<GetTransformOptions>
// ) => {
//   return Effect.gen(function* () {
//     const ctx = yield* MetroConfigService;
//     const { getPlatformOutput } = yield* NativeTwinServiceNode;
//     const watcher = yield* TwinWatcherService;

//     const { metroConfig } = ctx;
//     const writeStylesToFS = !options.dev;
//     const originalGetTransformOptions = metroConfig.transformer.getTransformOptions;

//     console.debug(`getTransformOptions.dev ${options.dev}`);
//     console.debug(`getTransformOptions.watching ${isWatching}`);
//     console.debug(`getTransformOptions.writeStylesToFS ${writeStylesToFS}`);

//     // We can skip writing to the filesystem if this instance patched Metro
//     if (writeStylesToFS) {
//       const platform = options.platform || 'native';
//       const outputPath = getPlatformOutput(platform);

//       console.debug(`getTransformOptions.platform ${platform}`);
//       console.debug(`getTransformOptions.output ${outputPath}`);

//       // const allFiles = yield* watcher.getAllFilesInProject;
//       // const compiledFilles = yield* watcher.compileFiles(allFiles);

//       // const cssOutput = yield* watcher
//       //   .getTwinCssOutput({
//       //     filepath: ctx.getPlatformOutput(platform),
//       //     trees: RA.map(compiledFilles, (x) => x.trees),
//       //     platform,
//       //   })
//       //   .pipe(
//       //     Effect.map((x) => {
//       //       return getNativeJS(x, options.dev);
//       //     }),
//       //   );

//       // yield* Effect.promise(() => fsPromises.writeFile(outputPath, cssOutput));
//     }

//     if (options.platform && !setupPlatforms.has(options.platform)) {
//       // setupPlatforms.add(options.platform);
//       // yield* watcher.setupPlatform({
//       //   projectRoot: ctx.userConfig.projectRoot,
//       //   targetPlatform: options.platform ?? 'native',
//       // });

//       const allFiles = yield* watcher.getAllFilesInProject;
//       const platform = options.platform;

//       const hasPlatform = setupPlatforms.has(platform);
//       const currentSize = setupPlatforms.size;
//       if (!hasPlatform) {
//         if (currentSize === 0) {
//           yield* Effect.log(`Initializing project \n`);
//           yield* watcher.runTwinForFiles(allFiles, platform);
//           yield* pipe(
//             yield* watcher.startWatcher,
//             Stream.take(allFiles.length),
//             Stream.chunks,
//             Stream.runForEach((fs) =>
//               watcher.runTwinForFiles(
//                 Chunk.toArray(fs).map((x) => x.path),
//                 platform,
//               ),
//             ),
//             Effect.scoped,
//             Effect.forkDaemon,
//           );
//           yield* Effect.yieldNow();
//           yield* Effect.log(`Watcher started`);
//           setupPlatforms.add(platform);
//         }
//       }
//     }

//     const result = yield* Effect.promise(() =>
//       originalGetTransformOptions(entryPoints, options, getDeps),
//     );

//     return result;
//   });
// };

// const twinMetroRequestResolver = (
//   originalResolver: CustomResolver | undefined,
//   twinConfig: NativeTwinServiceNode['Type'],
// ): CustomResolver => {
//   return (context, moduleName, platform) => {
//     const resolver = originalResolver ?? context.resolveRequest;
//     const resolved = resolver(context, moduleName, platform);

//     platform ??= 'native';
//     const platformOutput = twinConfig.getPlatformOutput(platform);
//     const platformInput = twinConfig.getPlatformInput();

//     // const twinConfigOutput = twinConfig.getTwinConfigPath();
//     // if ('filePath' in resolved && resolved.filePath === twinConfigOutput) {
//     //   if (isWatching) {
//     //     startCSSProcessor(twinConfigOutput, twinConfigOutput);
//     //   }
//     //   return {
//     //     ...resolved,
//     //   };
//     // }
//     if ('filePath' in resolved && resolved.filePath === platformInput) {
//       // if (isWatching) {
//       //   startCSSProcessor(platformInput, platformOutput);
//       // }
//       return {
//         ...resolved,
//         filePath: path.resolve(platformOutput),
//       };
//     }

//     return resolved;
//   };
// };

// export async function startCSSProcessor(filePath: string, outputPath: string) {
//   console.debug(`virtualModules.size ${virtualModules.size}`);

//   // Ensure that we only start the processor once per file
//   if (virtualModules.has(filePath)) {
//     return;
//   }

//   virtualModules.set(filePath, processFile(filePath, outputPath));
// }

// const processFile = (filePath: string, outputPath: string) => {
//   console.log('PROCESSING_FILE: ', filePath);

//   return fsPromises
//     .readFile(outputPath)
//     .then((x) => {
//       // virtualModules.set(filePath, Promise.resolve(getNativeJS(x.toString(), true)));
//       haste.emit('change', {
//         eventsQueue: [
//           {
//             filePath,
//             metadata: {
//               modifiedTime: Date.now(),
//               size: 1, // Can be anything
//               type: 'virtual', // Can be anything
//             },
//             type: 'change',
//           },
//         ],
//       });
//       return x;
//     })
//     .then((x) => {
//       return getNativeJS(x.toString(), true);
//     });
// };

// /**
//  * Patch the Metro File system to new cache virtual modules
//  */
// export function ensureFileSystemPatched(
//   fs: FileSystem & {
//     getSha1: {
//       __css_interop_patched?: boolean;
//     };
//   },
// ) {
//   if (!fs.getSha1.__css_interop_patched) {
//     const original_getSha1 = fs.getSha1.bind(fs);
//     fs.getSha1 = (filename) => {
//       if (virtualModules.has(filename)) {
//         // Don't cache this file. It should always be fresh.
//         return `${filename}-${Date.now()}`;
//       }
//       return original_getSha1(filename);
//     };
//     fs.getSha1.__css_interop_patched = true;
//   }

//   return fs;
// }

// /**
//  * Patch the bundler to use virtual modules
//  */
// function ensureBundlerPatched(
//   bundler: ReturnType<ReturnType<MetroServer['getBundler']>['getBundler']> & {
//     transformFile: { __css_interop__patched?: boolean };
//   },
// ) {
//   if (bundler.transformFile.__css_interop__patched) {
//     console.log('ALREADY_PATCHED');
//     return;
//   }

//   const originalTransformFile = bundler.transformFile.bind(bundler);

//   bundler.transformFile = async function (filePath, transformOptions, fileBuffer) {
//     console.log('TRANSFORM_PATCHED: ', filePath);
//     const virtualModule = virtualModules.get(filePath);
//     if (virtualModule) {
//       console.log('BUNDLER_TRANSFORM_FILE: ', filePath);
//       fileBuffer = Buffer.from(await virtualModule);
//       // fileBuffer = Buffer.from(
//       //   fileBuffer.toString().replaceAll('StyleSheet.', '__inject_1.StyleSheet.'),
//       // );
//     }

//     if (!fileBuffer) {
//       fileBuffer = await fsPromises.readFile(filePath);
//     }
//     console.log('BUFFER: ', fileBuffer);
//     return originalTransformFile(filePath, transformOptions, fileBuffer);
//   };
//   bundler.transformFile.__css_interop__patched = true;
// }
// // .replaceAll(
// //   `import { StyleSheet } from '@native-twin/jsx';`,
// //   'const __inject_1 = require("@native-twin/jsx");',
// // )
// // .replaceAll(
// //   `import { setup } from '@native-twin/core';`,
// //   `const setup = require('@native-twin/core').setup;`,
// // )
// // .replaceAll('StyleSheet.', '__inject_1.StyleSheet.')
// const getNativeJS = (data = '', dev = false) => {
//   let output = `
//  "use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
// // const ____refresh = global[__METRO_GLOBAL_PREFIX__ + "__ReactRefresh"];
// // if (____refresh) {
// //   ____refresh.performReactRefresh();
// //   console.log("REACT_REFRESHING: ", ____refresh);
// // }
// ${data
//   .replace(`import { StyleSheet } from '@native-twin/jsx';`, '')
//   .replace('StyleSheet.', '__inject_1.StyleSheet.')}
// `;
//   // ${data}`;

//   if (dev) {
//     output += `
// /**
//  * This is a hack for Expo Router. It's _layout files export 'unstable_settings' which break Fast Refresh
//  * Expo Router only supports Metro as a bundler
//  */
// if (typeof __METRO_GLOBAL_PREFIX__ !== "undefined" && global[__METRO_GLOBAL_PREFIX__ + "__ReactRefresh"]) {
//   const Refresh = global[__METRO_GLOBAL_PREFIX__ + "__ReactRefresh"]
//   const isLikelyComponentType = Refresh.isLikelyComponentType
//   const expoRouterExports = new WeakSet()
//   Object.assign(Refresh, {
//     isLikelyComponentType(value) {
//       if (typeof value === "object" && "unstable_settings" in value) {
//         expoRouterExports.add(value.unstable_settings)
//       }

//       if (typeof value === "object" && "ErrorBoundary" in value) {
//         expoRouterExports.add(value.ErrorBoundary)
//       }

//       // When ErrorBoundary is exported, the inverse dependency will also include the _ctx file. So we need to account for it as well
//       if (typeof value === "object" && "ctx" in value && value.ctx.name === "metroContext") {
//         expoRouterExports.add(value.ctx)
//       }

//       return expoRouterExports.has(value) || isLikelyComponentType(value)
//     }
//   })
// }
// `;
//   }

//   return Buffer.from(output);
// };

// export const decorateMetroServer = (
//   metroConfig: TwinMetroConfig,
//   twinConfig: NativeTwinServiceNode['Type'],
// ): Pick<ConfigT, 'server' | 'resolver'> => {
//   const metroServer = metroConfig.server;
//   const originalMiddleware = metroServer.enhanceMiddleware;
//   const originalResolver = metroConfig.resolver?.resolveRequest;
//   return {
//     resolver: {
//       ...metroConfig.resolver,
//       // sourceExts: [...metroConfig.resolver.sourceExts, 'css'],
//       resolveRequest: twinMetroRequestResolver(originalResolver, twinConfig),
//     },
//     server: {
//       ...metroServer,
//       enhanceMiddleware(middleware, currentServer) {
//         const server = connect();
//         // const bundler = currentServer.getBundler().getBundler();

//         // const initPromise = bundler.getDependencyGraph().then(async (graph: any) => {
//         //   haste = graph._haste;
//         //   ensureFileSystemPatched(graph._fileSystem);
//         //   ensureBundlerPatched(bundler);
//         // });

//         // This instance of Metro has been setup with the dev server watching
//         // for changes
//         isWatching = true;

//         // server.use(async (_, __, next) => {
//         //   // Wait until the bundler patching has completed
//         //   await initPromise;
//         //   next();
//         // });

//         return originalMiddleware
//           ? server.use(originalMiddleware(middleware, currentServer))
//           : server.use(middleware);
//       },
//     },
//   };
// };
