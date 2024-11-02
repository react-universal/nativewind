import type * as t from '@babel/types';
import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import * as RA from 'effect/Array';
import * as Option from 'effect/Option';
import * as VSCDocument from 'vscode-languageserver-textdocument';
import * as vscode from 'vscode-languageserver-types';
import type { TemplateTokenWithText } from '../../native-twin/models/template-token.model';
import { NativeTwinPluginConfiguration } from '../../utils/constants.utils';
import { getDocumentLanguageLocations } from '../utils/document.ast';
import { DocumentLanguageRegion } from './language-region.model';

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
    return getDocumentLanguageLocations(this.getText(undefined), this.config).map((x) =>
      DocumentLanguageRegion.create(this.textDocument, x),
    );
  }

  getTemplateAtPosition(position: VSCDocument.Position) {
    const positionOffset = this.positionToOffset(position);
    return Option.fromNullable(
      this.getLanguageRegions().find(
        (x) => positionOffset >= x.offset.start && positionOffset <= x.offset.end,
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
}

interface TwinTokenLocation {
  _tag: 'TwinTokenLocation';
  range: vscode.Range;
  offset: {
    start: number;
    end: number;
  };
  text: string;
}

export class TwinLspDocument {
  constructor(readonly document: VSCDocument.TextDocument) {}
  getLanguageRegions(config: NativeTwinPluginConfiguration) {
    return getDocumentLanguageLocations(this.document.getText(), config);
  }
  babelLocationToVscode(location: t.SourceLocation) {
    const range = vscode.Range.create(
      this.document.positionAt(location.start.index),
      this.document.positionAt(location.end.index),
    );
    const start = this.document.offsetAt(range.start);
    const end = this.document.offsetAt(range.end);
    const text = this.document.getText(range);
    return {
      text,
      range,
      offset: {
        start,
        end,
      },
    };
  }
  isPositionAtOffset(bounds: TwinTokenLocation['offset'], offset: number) {
    return offset >= bounds.start && offset <= bounds.end;
  }

  findTokenLocationAt(position: vscode.Position, config: NativeTwinPluginConfiguration) {
    const regions = this.getLanguageRegions(config);
    const ranges = regions.map((x) => this.babelLocationToVscode(x));
    const positionOffset = this.document.offsetAt(position);
    return RA.findFirst(ranges, (x) => this.isPositionAtOffset(x.offset, positionOffset));
  }
}
