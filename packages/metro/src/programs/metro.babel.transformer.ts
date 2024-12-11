// import upstreamTransformer from '@expo/metro-config/babel-transformer';
// import * as Effect from 'effect/Effect';
// import * as Layer from 'effect/Layer';
// import * as LogLevel from 'effect/LogLevel';
// import * as Option from 'effect/Option';
// import {
//   TwinNodeContext,
//   BabelCompilerContext,
//   TwinFileSystem,
//   CompilerConfigContext,
// } from '@native-twin/compiler';
// import type { BabelTransformerFn } from '../models/Metro.models.js';

// const NodeMainLayerSync = TwinFileSystem.Live.pipe(
//   Layer.provideMerge(TwinNodeContext.Live),
// );

// export const transform: BabelTransformerFn = async (params) => {
//   // console.log('[transform]: PARAMS: ', params);

//   const program = Effect.gen(function* () {
//     const ctx = yield* TwinNodeContext;
//     const compiler = yield* BabelCompilerContext;
//     let code = params.src;

//     if (yield* ctx.isAllowedPath(params.filename)) {
//       const output = yield* compiler.getBabelOutput({
//         _tag: 'BabelCodeEntry',
//         filename: params.filename,
//         code: params.src,
//         platform: params.options.platform,
//       });

//       const result = yield* compiler.mutateAST(output.ast);

//       if (result?.code) {
//         console.log('OPTIONS: ', params.options);
//         code = result.code;
//       }
//     }

//     // @ts-expect-error untyped
//     return upstreamTransformer.transform({
//       src: code,
//       options: params.options,
//       filename: params.filename,
//     });
//   }).pipe(
//     Effect.provide(NodeMainLayerSync),
//     Effect.provide(
//       Layer.succeed(CompilerConfigContext, {
//         inputCSS: params.options.customTransformOptions.inputCSS,
//         logLevel: LogLevel.fromLiteral(params.options.customTransformOptions.logLevel),
//         outputDir: params.options.customTransformOptions.outputCSS,
//         platformPaths: params.options.customTransformOptions.platformPaths,
//         projectRoot: params.options.customTransformOptions.environment,
//         twinConfigPath: Option.fromNullable(
//           params.options.customTransformOptions.twinConfigPath,
//         ),
//       }),
//     ),
//     Effect.runPromise,
//   );

//   return program;
// };
