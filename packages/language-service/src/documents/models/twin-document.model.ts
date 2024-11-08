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

export abstract class DocumentClass implements Equal.Equal {
  constructor(
    readonly textDocument: VSCDocument.TextDocument,
    readonly config: NativeTwinPluginConfiguration,
  ) {}
  abstract offsetToPosition(offset: number): VSCDocument.Position;
  abstract positionToOffset(position: VSCDocument.Position): number;
  abstract getText(range: VSCDocument.Range | undefined): string;

  get uri() {
    return this.textDocument.uri;
  }

  [Equal.symbol](that: unknown) {
    return (
      that instanceof DocumentClass &&
      this.textDocument.version === that.textDocument.version &&
      this.textDocument.uri === that.textDocument.uri
    );
  }

  [Hash.symbol](): number {
    return Hash.combine(Hash.hash(this.textDocument.uri))(this.textDocument.version);
  }
}

export class TwinLSPDocument extends DocumentClass {
  constructor(document: VSCDocument.TextDocument, config: NativeTwinPluginConfiguration) {
    super(document, config);
  }

  offsetToPosition(offset: number) {
    return this.textDocument.positionAt(offset);
  }

  positionToOffset(position: VSCDocument.Position) {
    return this.textDocument.offsetAt(position);
  }

  getText(range: VSCDocument.Range | undefined = undefined) {
    return this.textDocument.getText(range);
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

  private getRegionAt(location: t.SourceLocation) {
    let range = this.babelLocationToRange(location);
    const text = this.getText(range);
    const startOffset = this.positionToOffset(range.start);
    const endOffset = this.positionToOffset(range.end);
    return new DocumentLanguageRegion(range, startOffset, endOffset, text);
  }
}
