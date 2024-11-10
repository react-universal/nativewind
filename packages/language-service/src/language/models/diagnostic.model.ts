import * as RA from 'effect/Array';
import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import * as vscode from 'vscode-languageserver-types';
// import { toHyphenCase } from '@native-twin/helpers';
import { TwinSheetEntry } from '../../native-twin/models/TwinSheetEntry.model';
import { isSameRange } from '../../utils/vscode.utils';

export class VscodeDiagnosticItem implements vscode.Diagnostic, Equal.Equal {
  readonly message: string;
  readonly code: string;
  readonly range: vscode.Range;
  readonly relatedInformation: vscode.DiagnosticRelatedInformation[];
  readonly source: string;
  readonly severity: vscode.DiagnosticSeverity;
  readonly tags: vscode.DiagnosticTag[];
  readonly codeDescription?: vscode.CodeDescription | undefined;
  // codeDescription: vscode.CodeDescription | undefined;
  constructor(data: {
    range: vscode.Range;
    kind: keyof typeof DIAGNOSTIC_ERROR_KIND;
    entries: TwinSheetEntry[];
    uri: string;
    text: string;
    relatedInfo: vscode.DiagnosticRelatedInformation[];
  }) {
    const meta = DIAGNOSTIC_ERROR_KIND[data.kind];
    this.message = `${meta.message} - '${data.text}'`;
    this.range = data.range;
    this.relatedInformation = data.relatedInfo;
    this.code = this.getSourceCode(data.kind, data.entries);
    this.source = meta.source;
    this.severity = vscode.DiagnosticSeverity.Warning;
    this.tags = [];
  }

  private getSourceCode(
    kind: keyof typeof DIAGNOSTIC_ERROR_KIND,
    entries: TwinSheetEntry[],
  ) {
    // this.codeDescription = {
    //   href: `https://developer.mozilla.org/en-US/docs/Web/CSS/${toHyphenCase(declarationProp)}`,
    // };
    if (kind === 'DUPLICATED_CLASS_NAME') {
      return RA.join(RA.dedupe(RA.map(entries, (x) => x.entry.className)), ', ');
    }

    return RA.join(RA.dedupe(RA.map(entries, (x) => x.declarationProp)), ', ');
  }

  [Equal.symbol](that: unknown): boolean {
    return (
      that instanceof VscodeDiagnosticItem &&
      this.message === that.message &&
      this.code === that.code &&
      isSameRange(this.range, that.range)
    );
  }

  [Hash.symbol](): number {
    return Hash.array([this.message, this.code]);
  }
}

export const DIAGNOSTIC_ERROR_KIND = {
  DUPLICATED_DECLARATION: {
    code: 'DUPLICATED_DECLARATION',
    source: 'Native Twin',
    message: 'Duplicated NativeTwin Utility',
    description: 'You are using various ClassNames that modifies the same style prop',
  },
  DUPLICATED_CLASS_NAME: {
    code: 'DUPLICATED_CLASSNAME',
    source: 'Native Twin',
    message: 'Duplicated NativeTwin ClassName',
    description: 'You have duplicated ClassName utilities',
  },
};

export type DIAGNOSTIC_ERROR_KIND = typeof DIAGNOSTIC_ERROR_KIND;
