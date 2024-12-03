import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as LogLevel from 'effect/LogLevel';
import * as Option from 'effect/Option';
import * as path from 'node:path';
import { NodeWithNativeTwinOptions } from '../models/Compiler.models.js';

const getPlatformOutputs = (baseDir: string) => ({
  defaultFile: path.posix.join(baseDir, 'twin.out.native.css'),
  web: path.posix.join(baseDir, 'twin.out.web.css'),
  ios: path.posix.join(baseDir, 'twin.out.ios.css.js'),
  android: path.posix.join(baseDir, 'twin.out.android.css.js'),
  native: path.posix.join(baseDir, 'twin.out.native.css.js'),
});
const make = Effect.gen(function* () {
  const mainOutputDir = yield* Effect.try(() => require.resolve('@native-twin/core'));

  const defaultConfig = {
    inputCSS: Option.none<string>(),
    logLevel: LogLevel.All,
    outputDir: mainOutputDir,
    projectRoot: process.cwd(),
    twinConfigPath: Option.none<string>(),
    platformPaths: getPlatformOutputs(mainOutputDir),
  };

  // const configProvider = ConfigProvider.fromJson(defaultConfig);

  // return Layer.setConfigProvider(configProvider);

  return {
    env: defaultConfig,
    getUserConfig: (input: NodeWithNativeTwinOptions): CompilerConfigContext['env'] => {
      const inputCSS = Option.fromNullable(input.inputCSS);
      const projectRoot = Option.fromNullable(input.projectRoot).pipe(
        Option.getOrElse(() => defaultConfig.projectRoot),
      );
      const outputDir = Option.fromNullable(input.outputDir).pipe(
        Option.getOrElse(() => defaultConfig.outputDir),
      );
      const twinConfigPath = Option.fromNullable(input.twinConfigPath);

      return {
        ...defaultConfig,
        projectRoot,
        outputDir,
        twinConfigPath,
        inputCSS,
        platformPaths: getPlatformOutputs(outputDir),
      };
    },
  };
});

export interface CompilerConfigContext extends Effect.Effect.Success<typeof make> {}
export const CompilerConfigContext = Context.GenericTag<CompilerConfigContext>(
  'compiler/CompilerConfigContext',
);
export const CompilerConfigContextLive = Layer.effect(CompilerConfigContext, make);

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
