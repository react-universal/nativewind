import * as RA from 'effect/Array';
import * as Equal from 'effect/Equal';
import { pipe } from 'effect/Function';
import * as Hash from 'effect/Hash';
import * as vscode from 'vscode-languageserver';
import { DiagnosticRelatedInformation } from 'vscode-languageserver-types';
import { DocumentLanguageRegion, TwinLSPDocument } from '../../documents';
import { TwinSheetEntry } from '../../native-twin/models/TwinSheetEntry.model';
import { isSameRange } from '../../utils/vscode.utils';
// import { isSameRange } from '../../utils/vscode.utils';
import {
  bodyLocToRange,
  isSameTwinSheetEntryDeclaration,
  twinEntryClassNameEquivalence,
  twinSheetEntryGroupByDuplicates,
} from '../utils/diagnostic';
import { DIAGNOSTIC_ERROR_KIND, VscodeDiagnosticItem } from './diagnostic.model';

export class TwinDiagnosticHandler implements Equal.Equal {
  constructor(
    readonly region: DocumentLanguageRegion,
    readonly entries: TwinSheetEntry[],
    readonly document: TwinLSPDocument,
  ) {}

  get groupByDeclaration() {
    const toRange = bodyLocToRange(this.document);
    const entries = twinSheetEntryGroupByDuplicates(this.entries);
    const flattenEntries = RA.flatten(entries);
    return RA.map(flattenEntries, (entry) => {
      const range = toRange(entry.token.bodyLoc);
      let relatedInfo: DiagnosticRelatedInformation[] = [];
      relatedInfo = pipe(
        RA.map(flattenEntries, (x): DiagnosticRelatedInformation => {
          const otherRange = toRange(x.token.bodyLoc);
          return {
            location: vscode.Location.create(this.document.uri, otherRange),
            message: x.token.text,
          };
        }),
        RA.filter((x) => !isSameRange(range, x.location.range)),
        RA.dedupeWith(
          (a, b) =>
            a.message === b.message && isSameRange(a.location.range, b.location.range),
        ),
      );
      return new VscodeDiagnosticItem({
        entries: flattenEntries,
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
    const entries = twinSheetEntryGroupByDuplicates(this.entries);
    const flattenEntries = RA.flatten(entries);
    return RA.map(flattenEntries, (entry) => {
      const range = toRange(entry.token.bodyLoc);
      return new VscodeDiagnosticItem({
        entries: flattenEntries,
        kind: 'DUPLICATED_CLASS_NAME',
        range: range,
        relatedInfo: flattenEntries.map((x): DiagnosticRelatedInformation => {
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
    return this.getDuplicateDiagnostics();
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

  private getDuplicateDiagnostics() {
    const toRange = bodyLocToRange(this.document);
    const diagnostics: VscodeDiagnosticItem[] = [];

    RA.forEach(this.entries, (aEntry, ai) => {
      const currentEntryRange = toRange(aEntry.token.bodyLoc);
      const relatedInfo: DiagnosticRelatedInformation[] = [];
      let diagnostic: keyof DIAGNOSTIC_ERROR_KIND | null = null;
      const entries: TwinSheetEntry[] = [];

      RA.forEach(this.entries, (bEntry, bi) => {
        if (ai === bi) return;

        const duplicatedTokenRange = toRange(bEntry.token.bodyLoc);
        if (isSameTwinSheetEntryDeclaration(aEntry, bEntry)) {
          relatedInfo.push({
            location: vscode.Location.create(this.document.uri, duplicatedTokenRange),
            message: bEntry.token.text,
          });
          diagnostic = 'DUPLICATED_DECLARATION';
          entries.push(bEntry);
          return;
        }

        if (twinEntryClassNameEquivalence(aEntry, bEntry)) {
          relatedInfo.push({
            location: vscode.Location.create(this.document.uri, duplicatedTokenRange),
            message: bEntry.token.text,
          });
          diagnostic = 'DUPLICATED_CLASS_NAME';
          entries.push(bEntry);
          return;
        }
      });
      if (diagnostic !== null) {
        diagnostics.push(
          new VscodeDiagnosticItem({
            entries,
            kind: diagnostic,
            range: currentEntryRange,
            relatedInfo: RA.dedupeWith(relatedInfo, (a, b) => a.message === b.message),
            text: aEntry.token.text,
            uri: this.document.uri,
          }),
        );
      }
    });

    return RA.dedupeWith(diagnostics, (a, b) => a.message === b.message);
  }
}
