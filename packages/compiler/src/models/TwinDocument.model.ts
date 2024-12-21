import type { ParseResult } from '@babel/parser';
import type * as t from '@babel/types';
import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import {
  type Position,
  type Range,
  TextDocument,
} from 'vscode-languageserver-textdocument';
import type { TwinPath } from '../internal/fs';
import { getBabelAST } from '../utils/babel/babel.utils.js';

const quotesRegex = /^['"`].*['"`]$/g;

export interface TwinBaseDocument {
  getText: (range?: Range) => string;
  offsetAt: (position: Position) => number;
  positionAt: (offset: number) => Position;
}

export abstract class BaseTwinTextDocument implements Equal.Equal, TwinBaseDocument {
  textDocument: TextDocument;
  private _ast: ParseResult<t.File>;

  constructor(
    readonly uri: TwinPath.AbsoluteFilePath,
    content: string,
  ) {
    this.textDocument = TextDocument.create(uri, 'twin', 1, content);
    this._ast = getBabelAST(this.textDocument.getText(), uri);
  }

  get ast() {
    return this._ast;
  }

  get version() {
    return this.textDocument.version;
  }

  getText(range?: Range) {
    return this.textDocument.getText(range);
  }

  offsetAt(position: Position) {
    return this.textDocument.offsetAt(position);
  }

  positionAt(offset: number) {
    return this.textDocument.positionAt(offset);
  }

  babelLocationToRange(location: t.SourceLocation): Range {
    const startPosition: Position = {
      line: location.start.line,
      character: location.start.column,
    };
    const endPosition: Position = {
      line: location.end.line,
      character: location.end.column,
    };

    const range: Range = {
      start: startPosition,
      end: endPosition,
    };
    const text = this.getText(range);

    if (quotesRegex.test(text)) {
      range.start.character += 1;
      range.end.character -= 1;
      return { ...range };
    }
    return range;
  }

  refreshDoc(content: string) {
    if (Hash.string(content) !== Hash.string(this.getText())) {
      this.textDocument = TextDocument.update(
        this.textDocument,
        [
          {
            range: {
              start: this.positionAt(0),
              end: this.positionAt(this.getText().length - 1),
            },
            text: content,
          },
        ],
        this.version,
      );
    }

    this._ast = getBabelAST(this.textDocument.getText(), this.uri);

    return this;
  }

  get key(): DocumentKey {
    return new DocumentKey(this.uri);
  }

  // MARK: Equality protocol
  [Equal.symbol](that: unknown) {
    return (
      that instanceof BaseTwinTextDocument &&
      this.textDocument.version === that.textDocument.version &&
      this.textDocument.uri === that.textDocument.uri
    );
  }

  [Hash.symbol](): number {
    return Hash.combine(Hash.hash(this.textDocument.uri))(this.textDocument.version);
  }
}

export class TwinFileDocument extends BaseTwinTextDocument {
  
}

export class DocumentKey implements Equal.Equal {
  constructor(readonly uri: string) {}

  static getDocumentCacheKey(uri: string): DocumentKey {
    return new DocumentKey(uri);
  }

  [Hash.symbol](): number {
    return Hash.hash(this.uri);
  }

  [Equal.symbol](u: unknown): boolean {
    return u instanceof DocumentKey && this.uri === u.uri;
  }
}
