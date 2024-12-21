import type { NodePath, Visitor } from '@babel/traverse';
import type * as BabelTypes from '@babel/types';
import type * as t from '@babel/types';
import type { RuntimeSheetEntry } from '@native-twin/css/jsx';
import * as Data from 'effect/Data';
import type * as Option from 'effect/Option';

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

/**
 * @description represents the twin version of jsx element NodePath
 * */
interface TwinBabelLocation extends Omit<t.SourceLocation, 'identifierName'> {
  identifierName: Option.Option<string>;
}

export interface JSXMappedAttributeWithText extends Omit<JSXMappedAttribute, 'value'> {
  templateExpression: Option.Option<string>;
  value: string;
  // entries: Iterable<RuntimeSheetEntry>;
}

export interface CompiledMappedProp extends JSXMappedAttributeWithText {
  templateExpression: Option.Option<string>;
  value: string;
  entries: Iterable<RuntimeSheetEntry>;
  childEntries: Iterable<RuntimeSheetEntry>;
}
/**
 * @description represents the twin version of jsx element NodePath
 * */
export interface TwinBabelJSXElement {
  babelNode: t.JSXElement;
  jsxName: Option.Option<t.JSXIdentifier>;
  location: Option.Option<TwinBabelLocation>;
  childs: Iterable<TwinBabelJSXElement>;
  mappedProps: Iterable<JSXMappedAttributeWithText>;
  index: number;
}

export interface TwinBabelFile {
  jsxElements: Iterable<TwinBabelJSXElement>;
  location: Option.Option<TwinBabelLocation>;
}

export class TwinBabelError extends Data.TaggedError('TwinBabelError')<{
  cause: Error;
  message: string;
}> {}

export interface JSXMappedAttribute {
  prop: string;
  value: t.StringLiteral | t.TemplateLiteral;
  target: string;
}

export const createJSXElementVisitor = (
  onJSXElement: (path: NodePath<t.JSXElement>) => void,
): Visitor => ({
  JSXElement(path) {
    onJSXElement(path);
  },
});
