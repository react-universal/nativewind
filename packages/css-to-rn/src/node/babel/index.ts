import * as Layer from 'effect/Layer';
import type {
  CompilerInput,
  APICallerOptions,
  BabelAPI,
  BabelCallValue,
  TwinBabelPluginOptions,
} from './babel.types';
import { JSXElementNode } from './models';
import { BabelCompiler } from './services/BabelCompiler.service';
import { BuildConfig, makeBabelConfig } from './services/BuildConfig.service';
import { ReactCompilerService } from './services/ReactBabel.service';
import { JSXImportPluginContext } from './services/TwinBabelPlugin.service';

const makeBabelLayer = ReactCompilerService.Live.pipe(
  Layer.provideMerge(BabelCompiler.Live),
);

export { BABEL_JSX_PLUGIN_IMPORT_RUNTIME } from '../../shared/twin.constants';
export {
  BabelCompiler,
  ReactCompilerService,
  BuildConfig,
  JSXElementNode,
  makeBabelLayer,
  makeBabelConfig,
  JSXImportPluginContext,
};
export type {
  CompilerInput,
  APICallerOptions,
  BabelAPI,
  BabelCallValue,
  TwinBabelPluginOptions,
};
