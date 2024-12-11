import type { Data } from 'effect';
import type * as LogLevel from 'effect/LogLevel';

/**
 * @domain `TwinNodeContext` Common Input config options
 */
export interface NodeWithNativeTwinOptions {
  /**
   * Must be absolute
   * @example ```js
   * __dirname
   * ```
   * */
  projectRoot?: string | undefined;
  /**
   * Must be absolute
   * @example ```js
   * path.join(__dirname, 'public/out.css')
   * ```
   * */
  outputDir?: string | undefined;
  twinConfigPath: string;
  /**
   * Must be absolute
   * @example ```js
   * path.join(__dirname, 'globals.css')
   * ```
   * */
  inputCSS?: string | undefined;
  /**
   * @default `INFO`
   * */
  logLevel: LogLevel.Literal;
}

export interface TwinPathInfo {
  absolute: string;
  relative: string;
}
export type TwinFileInfo = Data.TaggedEnum<{
  File: { readonly path: TwinPathInfo; name: string; dirname: string };
  Directory: { readonly path: TwinPathInfo };
  Glob: { readonly path: TwinPathInfo };
}>;
