import type { SheetEntry } from '@native-twin/css';
import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import { TemplateTokenWithText } from './template-token.model.js';

export class TwinSheetEntry implements Equal.Equal {
  constructor(
    readonly entry: SheetEntry,
    readonly token: TemplateTokenWithText,
  ) {}

  get declarationProp() {
    return this.entry.declarations
      .flatMap((x) => x.prop)
      .sort()
      .join(',');
  }

  get selector() {
    return this.entry.selectors.sort().join(',');
  }

  [Equal.symbol](that: unknown): boolean {
    return (
      that instanceof TwinSheetEntry &&
      this.entry.className === that.entry.className &&
      this.declarationProp === that.declarationProp &&
      this.selector === that.selector
    );
  }

  [Hash.symbol](): number {
    return Hash.array([this.entry.className]);
  }
}
