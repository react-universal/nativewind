import type * as t from '@babel/types';
import * as RA from 'effect/Array';
import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import * as Option from 'effect/Option';
import * as VSCDocument from 'vscode-languageserver-textdocument';
import * as vscode from 'vscode-languageserver-types';
import { babelExtractors } from '@native-twin/compiler/babel';
import type { TemplateTokenWithText } from '../../native-twin/models/template-token.model';
import { NativeTwinPluginConfiguration } from '../../utils/constants.utils';
import { DocumentLanguageRegion } from './language-region.model';

const quotesRegex = /^['"`].*['"`]$/g;

export class TwinLSPDocument implements Equal.Equal {
  constructor(
    readonly textDocument: VSCDocument.TextDocument,
    readonly config: NativeTwinPluginConfiguration,
  ) {}

  get uri() {
    return this.textDocument.uri;
  }

  getLanguageRegions() {
    const regions = babelExtractors.extractLanguageRegions(
      this.getText(undefined),
      this.config,
    );
    return RA.map(regions, (x) => this.getRegionAt(x));
  }

  getTemplateAtPosition(position: VSCDocument.Position) {
    const positionOffset = this.positionToOffset(position);
    return Option.fromNullable(
      this.getLanguageRegions().find(
        (x) => positionOffset >= x.startOffset && positionOffset <= x.endOffset,
      ),
    );
  }

  getText(range?: VSCDocument.Range) {
    return this.textDocument.getText(range);
  }

  positionToOffset(position: VSCDocument.Position) {
    return this.textDocument.offsetAt(position);
  }

  offsetToPosition(offset: number) {
    return this.textDocument.positionAt(offset);
  }

  getRangeAtPosition(
    part: Pick<TemplateTokenWithText, 'loc' | 'text'>,
    templateRange: VSCDocument.Range,
  ): VSCDocument.Range {
    const realStart = this.textDocument.positionAt(
      part.loc.start + templateRange.start.character,
    );
    const realEnd = {
      ...realStart,
      character: realStart.character + part.text.length,
    };
    return {
      start: realStart,
      end: realEnd,
    };
  }

  babelLocationToRange(location: t.SourceLocation): vscode.Range {
    const startPosition = vscode.Position.create(
      location.start.line,
      location.start.column,
    );
    const endPosition = vscode.Position.create(location.end.line, location.end.column);

    const range = vscode.Range.create(startPosition, endPosition);
    const text = this.getText(range);

    if (quotesRegex.test(text)) {
      startPosition.character += 1;
      endPosition.character -= 1;
      return vscode.Range.create(startPosition, endPosition);
    }
    return range;
  }

  // MARK: Equality protocol
  [Equal.symbol](that: unknown) {
    return (
      that instanceof TwinLSPDocument &&
      this.textDocument.version === that.textDocument.version &&
      this.textDocument.uri === that.textDocument.uri
    );
  }

  [Hash.symbol](): number {
    return Hash.combine(Hash.hash(this.textDocument.uri))(this.textDocument.version);
  }

  // MARK: Private methods
  private getRegionAt(location: t.SourceLocation) {
    let range = this.babelLocationToRange(location);
    const text = this.getText(range);
    const startOffset = this.positionToOffset(range.start);
    const endOffset = this.positionToOffset(range.end);
    return new DocumentLanguageRegion(range, startOffset, endOffset, text);
  }
}
