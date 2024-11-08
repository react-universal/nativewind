import { pipe } from 'effect';
import * as RA from 'effect/Array';
import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import * as vscode from 'vscode-languageserver';
import { DiagnosticRelatedInformation } from 'vscode-languageserver-types';
import { DocumentLanguageRegion, TwinLSPDocument } from '../../documents';
import { TwinSheetEntry } from '../../native-twin/models/TwinSheetEntry.model';
import { isSameRange } from '../../utils/vscode.utils';
// import { isSameRange } from '../../utils/vscode.utils';
import { bodyLocToRange, getEntriesDuplicates } from '../utils/diagnostic';
import { VscodeDiagnosticItem } from './diagnostic.model';

export class TwinDiagnosticHandler implements Equal.Equal {
  constructor(
    readonly region: DocumentLanguageRegion,
    readonly entries: TwinSheetEntry[],
    readonly document: TwinLSPDocument,
  ) {}

  get groupByDeclaration() {
    const toRange = bodyLocToRange(this.document);
    const entries = getEntriesDuplicates(this.entries, (x) => x.declarationProp);
    return RA.map(entries, (entry) => {
      const range = toRange(entry.token.bodyLoc);
      let relatedInfo: DiagnosticRelatedInformation[] = [];
      relatedInfo = pipe(
        RA.map(entries, (x): DiagnosticRelatedInformation => {
          const otherRange = toRange(x.token.bodyLoc);
          return {
            location: vscode.Location.create(this.document.uri, otherRange),
            message: x.token.text,
          };
        }),
        RA.filter((x) => !isSameRange(range, x.location.range)),
        RA.dedupeWith((a, b) => a.message === b.message),
      );
      return new VscodeDiagnosticItem({
        entries,
        kind: 'DUPLICATED_DECLARATION',
        range,
        relatedInfo,
        text: entry.token.text,
        uri: this.document.uri,
      });
    });
  }

  get groupByClassName() {
    const toRange = bodyLocToRange(this.document);
    const entries = getEntriesDuplicates(this.entries, (x) => x.entry.className);
    return RA.map(entries, (entry) => {
      const range = toRange(entry.token.bodyLoc);
      return new VscodeDiagnosticItem({
        entries,
        kind: 'DUPLICATED_CLASS_NAME',
        range: range,
        relatedInfo: entries.map((x): DiagnosticRelatedInformation => {
          const otherRange = toRange(x.token.bodyLoc);
          return {
            location: vscode.Location.create(this.document.uri, otherRange),
            message: x.token.text,
          };
        }),
        text: entry.token.text,
        uri: this.document.uri,
      });
    });
  }

  get diagnostics(): VscodeDiagnosticItem[] {
    const merged = [...this.groupByDeclaration, ...this.groupByClassName];
    // return RA.dedupeWith(
    //   merged,
    //   (a, b) => a. === b.code,
    // );
    return merged;
  }

  get count() {
    return this.groupByClassName.length + this.groupByDeclaration.length;
  }

  [Equal.symbol](that: unknown): boolean {
    return (
      that instanceof TwinDiagnosticHandler &&
      this.document.uri === that.document.uri &&
      this.region.text === that.region.text
    );
  }

  [Hash.symbol](): number {
    return Hash.array([
      this.count,
      Hash.string(this.region.text),
      Hash.string(this.document.uri),
    ]);
  }
}
