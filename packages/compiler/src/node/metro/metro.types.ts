import type { IntermediateConfigT, TransformerConfigT } from 'metro-config';

// MARK: Metro config types
/** @domain Metro transformer config */
type TwinTransformerConfig = TransformerConfigT & {
  transformerPath?: string;
} & Record<string, unknown>;

/** @domain Metro config options */
export interface TwinMetroConfig extends IntermediateConfigT {
  transformer: TwinTransformerConfig;
}

/** @domain Metro config options */
export interface MetroWithNativeTwindOptions {
  projectRoot?: string;
  outputDir?: string;
  configPath?: string;
  inputCSS?: string;
  debug?: boolean;
}
