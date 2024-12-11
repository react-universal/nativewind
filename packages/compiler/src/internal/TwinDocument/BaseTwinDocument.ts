import type * as t from '@babel/types';
import * as Data from 'effect/Data';
import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import * as VSCDocument from 'vscode-languageserver-textdocument';

interface TwinTokenLocation {
  _tag: 'TwinTokenLocation';
  range: VSCDocument.Range;
  offset: {
    start: number;
    end: number;
  };
  text: string;
}

const quotesRegex = /^['"`].*['"`]$/g;

export const TwinTokenLocation = Data.tagged<TwinTokenLocation>('TwinTokenLocation');

export interface TwinBaseDocument {
  getText: (range?: VSCDocument.Range) => string;
  offsetAt: (position: VSCDocument.Position) => number;
  positionAt: (offset: number) => VSCDocument.Position;
  isPositionAtOffset: (bounds: TwinTokenLocation['offset'], offset: number) => boolean;
}

export abstract class BaseTwinTextDocument implements Equal.Equal, TwinBaseDocument {
  readonly textDocument: VSCDocument.TextDocument;

  constructor(path: string, content: string) {
    this.textDocument = VSCDocument.TextDocument.create(path, 'twin', 1, content);
    this.isPositionAtOffset.bind(this);
  }

  get uri() {
    return this.textDocument.uri;
  }

  get version() {
    return this.textDocument.version;
  }

  getText(range?: VSCDocument.Range) {
    return this.textDocument.getText(range);
  }

  offsetAt(position: VSCDocument.Position) {
    return this.textDocument.offsetAt(position);
  }

  positionAt(offset: number) {
    return this.textDocument.positionAt(offset);
  }

  isPositionAtOffset(bounds: TwinTokenLocation['offset'], offset: number) {
    return offset >= bounds.start && offset <= bounds.end;
  }

  babelLocationToRange(location: t.SourceLocation): VSCDocument.Range {
    const startPosition: VSCDocument.Position = {
      line: location.start.line,
      character: location.start.column,
    };
    const endPosition: VSCDocument.Position = {
      line: location.end.line,
      character: location.end.column,
    };

    const range: VSCDocument.Range = {
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
