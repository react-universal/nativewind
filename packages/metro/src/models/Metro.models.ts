import type { SheetEntry } from '@native-twin/css';
import type * as LogLevel from 'effect/LogLevel';
import type { IntermediateConfigT, TransformerConfigT } from 'metro-config';
import type {
  JsTransformerConfig,
  JsTransformOptions,
  TransformResponse,
} from 'metro-transform-worker';

// MARK: Metro config types
/** @domain Metro transformer config */
type TwinTransformerConfig = TransformerConfigT & {
  transformerPath?: string;
} & Record<string, unknown>;

/** @domain Metro config options */
export interface TwinMetroConfig extends IntermediateConfigT {
  transformer: TwinTransformerConfig;
}

export type BabelTransformerFn = (params: {
  src: string;
  filename: string;
  options: BabelTransformerOptions;
}) => Promise<any>;

export interface BaseTwinTransformerOptions {
  transformerPath?: string;
  originalTransformerPath?: string;
  allowedPaths: string[];
  allowedPathsGlob: string[];
  twinConfigPath: string;
  outputDir: string;
  projectRoot: string;
  inputCSS: string;
  logLevel: LogLevel.Literal;
  platformOutputs: string[];
  runtimeEntries: SheetEntry[];
}
export interface NativeTwinTransformerOpts extends JsTransformerConfig {
  twinConfig: BaseTwinTransformerOptions;
}

export interface MetroWorkerInput {
  config: NativeTwinTransformerOpts;
  projectRoot: string;
  filename: string;
  data: Buffer;
  options: JsTransformOptions;
}

export type TwinMetroTransformFn = (
  config: NativeTwinTransformerOpts,
  projectRoot: string,
  filename: string,
  data: Buffer,
  options: JsTransformOptions,
) => Promise<TransformResponse>;

export interface BabelTransformerOptions {
  customTransformOptions: {
    runtimeEntries: SheetEntry[];
    routerRoot: string;
    inputCSS: string;
    outputCSS: string;
    environment: string;
    baseUrl: string;
    twinConfigPath: string;
    logLevel: LogLevel.Literal;
    outputDir: string;
  };
  dev: boolean;
  hot: boolean;
  // inlinePlatform: boolean;
  // minify: boolean;
  platform: string;
  // unstable_transformProfile: string;
  // experimentalImportSupport: boolean;
  // unstable_disableES6Transforms: boolean;
  // nonInlinedRequires: string[];
  type: string;
  // enableBabelRCLookup: boolean;
  // enableBabelRuntime: boolean;
  // globalPrefix: string;
  // hermesParser: boolean;
  projectRoot: string;
  // publicPath: string;
}

export interface BabelTransformerConfig {
  options: BabelTransformerOptions;
  filename: string;
  outputCSS: string;
  inputCSS: string;
  code: string;

  allowedPaths: string[];

  platform: string;
  generate: {
    tree: boolean;
    componentID: boolean;
    styledProps: boolean;
    templateStyles: boolean;
    order: boolean;
  };
}
