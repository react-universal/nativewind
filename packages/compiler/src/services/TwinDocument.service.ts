import type { ParseResult } from '@babel/parser';
import type * as t from '@babel/types';
import * as Context from 'effect/Context';
import type * as TextDocument from 'vscode-languageserver-textdocument';
import type { NativeTwinPluginConfiguration } from '../shared/compiler.constants';

export interface TwinDocumentCtx {
  textDocument: TextDocument.TextDocument;
  ast: ParseResult<t.File>;
  platform: string;
  config: NativeTwinPluginConfiguration;
}
export const TwinDocumentCtx = Context.GenericTag<TwinDocumentCtx>(
  'compiler/TwinDocumentCtx',
);
