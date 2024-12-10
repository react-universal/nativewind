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
