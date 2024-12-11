import type { NodePath } from '@babel/traverse';
import type * as BabelTypes from '@babel/types';
import type * as t from '@babel/types';
import type { RuntimeComponentEntry } from '@native-twin/css/jsx';
import type { Tree } from '@native-twin/helpers/tree';
import * as Data from 'effect/Data';
import type * as Option from 'effect/Option';
import type { JSXElementNode } from './JSXElement.model.js';

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

export type JSXElementNodePath = NodePath<t.JSXElement>;

export interface JSXFileTree {
  filePath: string;
  parents: Tree<JSXElementTree>[];
}

export interface TransformedJSXElementTree {
  leave: JSXElementNode;
  runtimeSheets: RuntimeComponentEntry[];
  runtimeAST: Option.Option<t.Expression>;
}

export interface JSXElementTree {
  readonly _tag: 'JSXElementTree';
  babelNode: JSXElementNodePath['node'];
  order: number;
  uid: string;
  parentID: string | null;
  cssImports: string[];
  source: {
    kind: string;
    source: string;
  };
}

export const JSXElementTree = Data.tagged<JSXElementTree>('JSXElementTree');
