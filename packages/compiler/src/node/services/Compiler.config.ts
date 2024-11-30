import { Option } from 'effect';
import * as Config from 'effect/Config';
import * as ConfigProvider from 'effect/ConfigProvider';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as LogLevel from 'effect/LogLevel';
import * as path from 'node:path';
import { TwinEnvContext } from '@native-twin/compiler/TwinEnv';
import { DEFAULT_TWIN_INPUT_CSS_FILE } from '../../shared/twin.constants.js';
import { getTwinCacheDir } from '../utils/twin.utils.node.js';

const mainOutputDir = getTwinCacheDir();

interface CompilerConfigShape {
  projectRoot: string;
  twinConfigPath: string;
  logLevel: LogLevel.LogLevel;
  inputCSS: string;
  outputDir: string;
  platformPaths: {
    web: string;
    ios: string;
    android: string;
    native: string;
  };
}

const getDefaultConfig = () => {
  return Effect.try<CompilerConfigShape>(() => {
    return {
      inputCSS: path.resolve(mainOutputDir, DEFAULT_TWIN_INPUT_CSS_FILE),
      logLevel: LogLevel.All,
      outputDir: mainOutputDir,
      projectRoot: process.cwd(),
      twinConfigPath: path.join(process.cwd(), 'tailwind.config.ts'),
      platformPaths: {
        defaultFile: path.join(mainOutputDir, 'twin.out.native.css'),
        web: path.join(mainOutputDir, 'twin.out.web.css'),
        ios: path.join(mainOutputDir, 'twin.out.ios.css.js'),
        android: path.join(mainOutputDir, 'twin.out.android.css.js'),
        native: path.join(mainOutputDir, 'twin.out.native.css.js'),
      },
    };
  });
};

const makeConfig = <A extends CompilerConfigShape>(config: Config.Config.Wrap<A>) => {
  return Config.unwrap(config);
};

export const CompilerConfig = makeConfig({
  projectRoot: Config.nonEmptyString('projectRoot').pipe(
    Config.withDescription('Usually where the main package.json is placed'),
  ),
  inputCSS: Config.string('inputCSS').pipe(
    Config.withDescription('twin config definition file path'),
  ),
  logLevel: Config.logLevel('logLevel').pipe(Config.withDescription('Log level')),
  outputDir: Config.nonEmptyString('outputDir').pipe(
    Config.withDescription('Global css input'),
  ),
  twinConfigPath: Config.nonEmptyString('twinConfigPath').pipe(
    Config.withDescription('Folder where output files will be placed'),
  ),
  platformPaths: {
    android: Config.nonEmptyString('android').pipe(
      Config.withDescription(
        'android platform styles file default: twin.out.android.css.js',
      ),
    ),
    // defaultFile: Config.nonEmptyString('defaultFile').pipe(
    //   Config.withDescription(
    //     'default platform styles file default: twin.out.native.css.js',
    //   ),
    // ),
    ios: Config.nonEmptyString('ios').pipe(
      Config.withDescription('ios platform styles file default: twin.out.ios.css.js'),
    ),
    native: Config.nonEmptyString('native').pipe(
      Config.withDescription(
        'native platform styles file default: twin.out.native.css.js',
      ),
    ),
    web: Config.nonEmptyString('web').pipe(
      Config.withDescription('web platform styles file default: twin.out.web.css.js'),
    ),
  },
});

export const setConfigLayerFromUser = Effect.gen(function* () {
  const defaultConfig = yield* getDefaultConfig();
  const config = yield* TwinEnvContext;
  const unwrapped: CompilerConfigShape = {
    inputCSS: config.inputCss.pipe(Option.getOrElse(() => defaultConfig.inputCSS)),
    logLevel: defaultConfig.logLevel,
    outputDir: config.outputDir ?? defaultConfig.outputDir,
    platformPaths: config.platformOutputs ?? defaultConfig.platformPaths,
    projectRoot: config.projectRoot ?? defaultConfig.projectRoot,
    twinConfigPath: config.twinConfigPath.pipe(
      Option.getOrElse(() => defaultConfig.twinConfigPath),
    ),
  };

  const configProvider = ConfigProvider.fromMap(
    new Map<string, string>(
      Object.entries(unwrapped).flatMap(([key, value]) => {
        if (typeof value === 'string') {
          return [[key, value]];
        }
        if ('_tag' in value) {
          return [[key, value.label]];
        }

        return Object.entries(value);
      }),
    ),
  );

  return Layer.setConfigProvider(configProvider);
}).pipe(Layer.unwrapEffect);

// export const CompilerConfig: Config.Config<CompilerConfigShape> = Config.all({
//   projectRoot: Config.string('projectRoot').pipe(
//     // Config.withDefault(process.cwd()),
//     Config.withDescription('Usually where the main package.json is placed'),
//   ),
//   twinConfigPath: Config.string('twinConfigPath').pipe(
//     // Config.withDefault(path.join(process.cwd(), 'tailwind.config.ts')),
//     Config.withDescription('twin config definition file path'),
//   ),
//   logLevel: Config.logLevel('LOG_LEVEL').pipe(
//     // Config.withDefault(LogLevel.Info),
//     Config.withDescription('Log level'),
//   ),
//   inputCSS: Config.string('inputCSS').pipe(
//     // Config.withDefault(path.join(mainOutputDir, DEFAULT_TWIN_INPUT_CSS_FILE)),
//     Config.withDescription('Global css input'),
//   ),
//   outputDir: Config.string('outputDir').pipe(
//     // Config.withDefault(mainOutputDir),
//     Config.withDescription('Folder where output files will be placed'),
//   ),
//   platformPaths: Config.all({
//     defaultFile: Config.string('defaultFile'),
//     // .pipe
//     // Config.withDefault(path.join(outputDir, 'twin.out.native.css')),
//     // (),
//     web: Config.string('web'),
//     // .pipe
//     // Config.withDefault(path.join(outputDir, 'twin.out.web.css')),
//     // (),
//     ios: Config.string('ios'),
//     // .pipe
//     // Config.withDefault(path.join(outputDir, 'twin.out.ios.css.js')),
//     // (),
//     android: Config.string('android'),
//     // .pipe
//     // Config.withDefault(path.join(outputDir, 'twin.out.android.css.js')),
//     // (),
//     native: Config.string('native'),
//     // .pipe
//     // Config.withDefault(path.join(outputDir, 'twin.out.native.css.js')),
//     // (),
//   }),
// });
