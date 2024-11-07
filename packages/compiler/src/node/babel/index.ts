import * as Layer from 'effect/Layer';
import type {
  CompilerInput,
  APICallerOptions,
  BabelAPI,
  BabelCallValue,
  TwinBabelPluginOptions,
} from './babel.types';
import {
  JSXElementNode,
  JSXElementTree,
  JSXFileTree,
  jsxElementNodeKey,
  JSXChildElement,
  JSXElementNodeKey,
  JSXElementNodePath,
  JSXElementTreeMinimal,
  JSXMappedAttribute,
  MapChildFn,
  RuntimeTreeNode,
  StyledPropEntries,
} from './models';
import { BabelCompiler } from './services/BabelCompiler.service';
import { BuildConfig, makeBabelConfig } from './services/BuildConfig.service';
import { ReactCompilerService } from './services/ReactBabel.service';
import { JSXImportPluginContext } from './services/TwinBabelPlugin.service';

const makeBabelLayer = ReactCompilerService.Live.pipe(
  Layer.provideMerge(BabelCompiler.Live),
);
export { getJSXElementRegistry, compileReactCode } from './programs/react.program';

export { BABEL_JSX_PLUGIN_IMPORT_RUNTIME } from '../../shared/twin.constants';

export { jsxTreeNodeToJSXElementNode } from './utils/babel.transform';

export {
  BabelCompiler,
  ReactCompilerService,
  BuildConfig,
  JSXElementNode,
  CompilerInput,
  makeBabelLayer,
  makeBabelConfig,
  JSXImportPluginContext,
  JSXFileTree,
  jsxElementNodeKey,
  JSXChildElement,
  JSXElementNodeKey,
  JSXElementNodePath,
  JSXElementTreeMinimal,
  JSXMappedAttribute,
  MapChildFn,
  RuntimeTreeNode,
  StyledPropEntries,
};
export type {
  APICallerOptions,
  BabelAPI,
  BabelCallValue,
  TwinBabelPluginOptions,
  JSXElementTree,
};
