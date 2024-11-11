import * as ReadonlyArray from 'effect/Array';
import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import type { Range } from 'vscode-languageserver-textdocument';
import type { RuntimeTW } from '@native-twin/core';
import { getFlattenTemplateToken } from '../../utils/twin/native-twin.utils';
import { TwinSheetEntry } from './TwinSheetEntry.model';
import type {
  LocatedGroupToken,
  LocatedGroupTokenWithText,
  TemplateToken,
} from './parser.types';

export class TemplateTokenWithText implements Equal.Equal {
  readonly token: Exclude<TemplateToken, LocatedGroupToken> | LocatedGroupTokenWithText;
  loc: {
    readonly start: number;
    readonly end: number;
  };
  bodyLoc: {
    readonly start: number;
    readonly end: number;
  };
  text: string;
  templateStarts: number;

  get flattenToken(): TemplateTokenData[] {
    return ReadonlyArray.dedupe(getFlattenTemplateToken(this));
  }

  constructor(
    token: Exclude<TemplateToken, LocatedGroupToken> | LocatedGroupTokenWithText,
    text: string,
    templateStarts: number,
  ) {
    this.templateStarts = templateStarts;
    this.loc = {
      start: token.start,
      end: token.end,
    };
    this.bodyLoc = {
      start: token.start + templateStarts,
      end: token.end + templateStarts,
    };
    this.text = text;
    this.token = token;
  }

  [Equal.symbol](that: unknown): boolean {
    return (
      that instanceof TemplateTokenWithText &&
      this.text === that.text &&
      this.bodyLoc.start === that.bodyLoc.start &&
      this.bodyLoc.end === that.bodyLoc.end
    );
  }

  [Hash.symbol]() {
    return Hash.array([this.text, this.bodyLoc.start, this.bodyLoc.end]);
  }
}

export class TemplateTokenData implements Equal.Equal {
  private _entries: TwinSheetEntry[] | undefined = undefined;
  constructor(
    readonly token: TemplateTokenWithText,
    readonly base: TemplateTokenWithText | null,
  ) {}

  getSheetEntries(tw: RuntimeTW) {
    if (this._entries) this._entries;

    this._entries = tw(`${this.token.text}`).map(
      (x) => new TwinSheetEntry(x, this.token),
    );
    return this._entries;
  }

  /**
   * @description get token className
   * without variant(s) `md:` or important `!`
   */
  getTokenClassName() {
    let className = this.token.text;
    if (this.token.token.type === 'VARIANT_CLASS') {
      const variantText = `${this.token.token.value[0].value.map((x) => x.n).join(':')}:`;
      className = className.replace(variantText, '');
    }
    if (this.base) {
      if (this.base.token.type === 'VARIANT') {
        const variantText = `${this.base.token.value.map((x) => x.n).join(':')}:`;
        className = className.replace(variantText, '');
      }
      if (this.base.token.type === 'VARIANT_CLASS') {
        const variantText = `${this.base.token.value[0].value.map((x) => x.n).join(':')}:`;
        className = className.replace(variantText, '');
      }
    }

    return className;
  }

  getFullCLassName() {
    return this.token.text;
  }

  adjustTextInsert(insertText: string, range: Range) {
    if (this.base) {
      if (this.base.token.type === 'CLASS_NAME') {
        insertText = insertText.replace(`${this.base.token.value.n}-`, '');
      }
    }
    if (this.token.token.type === 'VARIANT') {
      insertText = `${this.token.token.value.map((x) => x.n).join(':')}:${insertText}`;
    }
    if (this.token.token.type === 'VARIANT_CLASS') {
      const variantText = `${this.token.token.value[0].value.map((x) => x.n).join(':')}:`;
      const newOffset = range.start.character + variantText.length;
      range.start.character = newOffset;
    }
    return { insertText, range };
  }

  adjustColorInfo(range: Range) {
    let className = this.token.text;

    if (this.base) {
      if (this.base.token.type === 'VARIANT') {
        const variantText = `${this.base.token.value.map((x) => x.n).join(':')}:`;
        className = className.replace(variantText, '');
      }
      if (this.base.token.type === 'VARIANT_CLASS') {
        const variantText = `${this.base.token.value[0].value.map((x) => x.n).join(':')}:`;
        className = className.replace(variantText, '');
      }
    }
    if (this.token.token.type === 'VARIANT_CLASS') {
      const variantText = `${this.token.token.value[0].value.map((x) => x.n).join(':')}:`;
      className = className.replace(variantText, '');
    }
    if (this.token.token.type === 'VARIANT_CLASS') {
      const variantText = `${this.token.token.value[0].value.map((x) => x.n).join(':')}:`;
      const newOffset = range.start.character + variantText.length;
      range.start.character = newOffset;
    }
    return { className, range };
  }

  [Equal.symbol](that: unknown): boolean {
    return (
      that instanceof TemplateTokenData &&
      this.token.text === that.token.text &&
      this.token.bodyLoc.start === that.token.bodyLoc.start &&
      this.token.bodyLoc.end === that.token.bodyLoc.end
    );
  }

  [Hash.symbol](): number {
    return Hash.array([
      this.token.text,
      this.token.bodyLoc.start,
      this.token.bodyLoc.end,
    ]);
  }
}
