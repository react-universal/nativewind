import type { NodePath } from '@babel/traverse';
import type * as BabelTypes from '@babel/types';
import type * as t from '@babel/types';
import type { SheetEntryHandler } from '@native-twin/css/jsx';
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

export interface JSXMappedAttributeWithText extends Omit<JSXMappedAttribute, 'value'> {
  templateExpression: Option.Option<string>;
  value: string;
}

export interface CompiledMappedProp extends JSXMappedAttributeWithText {
  templateExpression: Option.Option<string>;
  value: string;
  entries: Iterable<SheetEntryHandler>;
  childEntries: Iterable<SheetEntryHandler>;
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
