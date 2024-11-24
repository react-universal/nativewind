import type * as BabelTypes from '@babel/types';

export interface CompilerInput {
  code: string;
  filename: string;
  outputCSS: string;
  platform: string;
  inputCSS: string;
  projectRoot: string;
  twinConfigPath: string;
}

/** @domain jsx import babel plugin */
export type BabelCallValue = BabelTypes.CallExpression['arguments'][0];

/** @domain jsx import babel plugin */
export interface APICallerOptions {
  engine: string | null;
  isServer: boolean;
  isDev: boolean;
  platform: string;
}

/** @domain jsx import babel plugin */
export interface BabelAPI {
  types: typeof BabelTypes;
  caller: <T>(caller: (data?: APICallerOptions) => T) => NonNullable<T>;
  cache: (x: boolean) => void;
}

/** @domain jsx import babel plugin */
export interface TwinBabelPluginOptions extends APICallerOptions {
  twinConfigPath?: string;
  inputCSS?: string;
  outputDir?: string;
}