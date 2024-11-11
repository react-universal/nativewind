import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';
import * as vscode from 'vscode-languageserver-types';
import { TwinSheetEntry } from '../twin/TwinSheetEntry.model';
import { diagnosticProviderSource } from '../../utils/constants.utils';
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

  constructor(data: {
    range: vscode.Range;
    code: TwinDiagnosticCodes;
    entries: TwinSheetEntry[];
    uri: string;
    text: string;
    relatedInfo: vscode.DiagnosticRelatedInformation[];
    message?: string;
  }) {
    this.code = data.code;
    this.message = data.message
      ? data.message
      : `${this.getDiagnosticMessage(data.code)} - '${data.text}'`;
    this.range = data.range;
    this.relatedInformation = data.relatedInfo;
    this.source = diagnosticProviderSource;
    this.severity = vscode.DiagnosticSeverity.Warning;
    this.tags = [];
  }

  //   return RA.join(RA.dedupe(RA.map(entries, (x) => x.declarationProp)), ', ');
  // }

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

  private getDiagnosticMessage(code: TwinDiagnosticCodes) {
    switch (code) {
      case TwinDiagnosticCodes.None:
        return '';
      case TwinDiagnosticCodes.DuplicatedDeclaration:
        return 'Duplicated NativeTwin Utility';
      case TwinDiagnosticCodes.DuplicatedClassName:
        return 'Duplicated NativeTwin ClassName';
    }
  }
}

export enum TwinDiagnosticCodes {
  None = '000',
  DuplicatedDeclaration = '001',
  DuplicatedClassName = '002',
}
