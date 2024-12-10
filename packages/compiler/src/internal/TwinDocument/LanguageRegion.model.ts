import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import type * as VSCDocument from 'vscode-languageserver-textdocument';

export class DocumentLanguageRegion implements Equal.Equal {
  constructor(
    readonly range: VSCDocument.Range,
    readonly startOffset: number,
    readonly endOffset: number,
    readonly text: string,
  ) {}

  [Equal.symbol](that: unknown): boolean {
    return (
      that instanceof DocumentLanguageRegion &&
      this.startOffset === that.startOffset &&
      this.endOffset === that.endOffset &&
      this.range.start.character === that.range.start.character
    );
  }

  [Hash.symbol](): number {
    return Hash.array([this.startOffset, this.endOffset, this.range.start.character]);
  }
}
