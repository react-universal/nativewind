import * as Context from 'effect/Context';
import * as LogLevel from 'effect/LogLevel';
import * as Option from 'effect/Option';
import * as path from 'node:path';

const getPlatformOutputs = (baseDir: string) => ({
  defaultFile: path.posix.join(baseDir, 'twin.out.native.css'),
  web: path.posix.join(baseDir, 'twin.out.web.css'),
  ios: path.posix.join(baseDir, 'twin.out.ios.css.js'),
  android: path.posix.join(baseDir, 'twin.out.android.css.js'),
  native: path.posix.join(baseDir, 'twin.out.native.css.js'),
});

export const createCompilerConfig = (params: {
  rootDir: string;
  outDir: string;
  twinConfigPath?: string;
  inputCSS?: string;
}): CompilerConfigContext => {
  return CompilerConfigContext.of({
    inputCSS: Option.fromNullable(params.inputCSS).pipe(
      Option.getOrElse(() => path.join(params.outDir, 'twin.in.css')),
    ),
    logLevel: LogLevel.Debug,
    outputDir: params.outDir,
    projectRoot: params.rootDir,
    twinConfigPath: Option.fromNullable(params.twinConfigPath),
    platformPaths: getPlatformOutputs(params.outDir),
  });
};

export interface CompilerConfigContext {
  inputCSS: string;
  logLevel: LogLevel.LogLevel;
  outputDir: string;
  projectRoot: string;
  twinConfigPath: Option.Option<string>;
  platformPaths: {
    defaultFile: string;
    web: string;
    ios: string;
    android: string;
    native: string;
  };
}
export const CompilerConfigContext = Context.GenericTag<CompilerConfigContext>(
  'compiler/CompilerConfigContext',
);

// const make = Effect.gen(function* () {
//   const mainOutputDir = yield* Effect.try(() => require.resolve('@native-twin/core'));
//   const currentConfig = yield* SynchronizedRef.make({
//     inputCSS: Option.none<string>(),
//     logLevel: LogLevel.All,
//     outputDir: mainOutputDir,
//     projectRoot: process.cwd(),
//     twinConfigPath: Option.none<string>(),
//     platformPaths: getPlatformOutputs(mainOutputDir),
//   });

//   // const configProvider = ConfigProvider.fromJson(defaultConfig);

//   // return Layer.setConfigProvider(configProvider);

//   return {
//     env: Effect.suspend(() => Ref.get(currentConfig)),
//     setConfigByUser: (input: NodeWithNativeTwinOptions) => {
//       return Effect.gen(function* () {
//         const config = yield* Ref.get(currentConfig);
//         const inputCSS = Option.fromNullable(input.inputCSS);
//         const projectRoot = Option.fromNullable(input.projectRoot).pipe(
//           Option.getOrElse(() => config.projectRoot),
//         );
//         const outputDir = Option.fromNullable(input.outputDir).pipe(
//           Option.getOrElse(() => config.outputDir),
//         );
//         const twinConfigPath = Option.fromNullable(input.twinConfigPath);

//         return yield* Ref.updateAndGet(currentConfig, (config) => ({
//           ...config,
//           projectRoot,
//           outputDir,
//           twinConfigPath,
//           inputCSS,
//           platformPaths: getPlatformOutputs(outputDir),
//         }));
//       });
//     },
//   };
// });

// const makeConfig = <A extends CompilerConfigShape>(config: Config.Config.Wrap<A>) => {
//   return Config.unwrap(config);
// };

// const setConfigLayerFromUser = Effect.gen(function* () {
//   const defaultConfig = yield* getDefaultConfig();
//   const unwrapped: CompilerConfigShape = {
//     inputCSS: config.inputCss.pipe(Option.getOrElse(() => defaultConfig.inputCSS)),
//     logLevel: defaultConfig.logLevel,
//     outputDir: config.outputDir ?? defaultConfig.outputDir,
//     platformPaths: config.platformOutputs ?? defaultConfig.platformPaths,
//     projectRoot: config.projectRoot ?? defaultConfig.projectRoot,
//     twinConfigPath: config.twinConfigPath.pipe(
//       Option.getOrElse(() => defaultConfig.twinConfigPath),
//     ),
//   };
// });

// const configProvider = ConfigProvider.fromMap(
//   new Map<string, string>(
//     Object.entries(unwrapped).flatMap(([key, value]) => {
//       if (typeof value === 'string') {
//         return [[key, value]];
//       }
//       if ('_tag' in value) {
//         return [[key, value.label]];
//       }

//       return Object.entries(value);
//     }),
//   ),
// );
// const CompilerConfig = makeConfig({
//   projectRoot: Config.nonEmptyString('projectRoot').pipe(
//     Config.withDescription('Usually where the main package.json is placed'),
//   ),
//   inputCSS: Config.string('inputCSS').pipe(
//     Config.withDescription('twin config definition file path'),
//   ),
//   logLevel: Config.logLevel('logLevel').pipe(Config.withDescription('Log level')),
//   outputDir: Config.nonEmptyString('outputDir').pipe(
//     Config.withDescription('Global css input'),
//   ),
//   twinConfigPath: Config.nonEmptyString('twinConfigPath').pipe(
//     Config.withDescription('Folder where output files will be placed'),
//   ),
//   platformPaths: {
//     android: Config.nonEmptyString('android').pipe(
//       Config.withDescription(
//         'android platform styles file default: twin.out.android.css.js',
//       ),
//     ),
//     // defaultFile: Config.nonEmptyString('defaultFile').pipe(
//     //   Config.withDescription(
//     //     'default platform styles file default: twin.out.native.css.js',
//     //   ),
//     // ),
//     ios: Config.nonEmptyString('ios').pipe(
//       Config.withDescription('ios platform styles file default: twin.out.ios.css.js'),
//     ),
//     native: Config.nonEmptyString('native').pipe(
//       Config.withDescription(
//         'native platform styles file default: twin.out.native.css.js',
//       ),
//     ),
//     web: Config.nonEmptyString('web').pipe(
//       Config.withDescription('web platform styles file default: twin.out.web.css.js'),
//     ),
//   },
// });
