import * as ReadonlyArray from 'effect/Array';
import * as Equal from 'effect/Equal';
import { pipe } from 'effect/Function';
import * as Hash from 'effect/Hash';
import type * as VSCDocument from 'vscode-languageserver-textdocument';
import type { RuntimeTW } from '@native-twin/core';
import { parseTemplate } from '../../utils/twin/native-twin.parser.js';

export class DocumentLanguageRegion implements Equal.Equal {
  constructor(
    readonly range: VSCDocument.Range,
    readonly startOffset: number,
    readonly endOffset: number,
    readonly text: string,
  ) {}

  get regionNodes() {
    return parseTemplate(this.text, this.startOffset);
  }

  get flatRegionNodes() {
    return pipe(
      this.regionNodes,
      ReadonlyArray.flatMap((x) => x.flattenToken),
      ReadonlyArray.dedupe,
    );
  }

  getFullSheetEntries(tw: RuntimeTW) {
    return this.flatRegionNodes.flatMap((x) => x.getSheetEntries(tw));
  }

  getParsedNodeAtOffset(offset: number) {
    return ReadonlyArray.findFirst(
      this.regionNodes,
      (x) => offset >= x.bodyLoc.start && offset <= x.bodyLoc.end,
    );
  }

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
