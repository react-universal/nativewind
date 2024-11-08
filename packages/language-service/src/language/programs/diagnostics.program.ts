import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
// import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import * as vscode from 'vscode-languageserver';
import { DocumentsService } from '../../documents';
import { NativeTwinManagerService } from '../../native-twin';
import { TwinDiagnosticHandler } from '../models/diagnostic.cache';

export const getDocumentDiagnosticsProgram = (
  params: vscode.DocumentDiagnosticParams,
  _token: vscode.CancellationToken,
  _workDoneProgress: vscode.WorkDoneProgressReporter,
  _resultProgress?:
    | vscode.ResultProgressReporter<vscode.DocumentDiagnosticReportPartialResult>
    | undefined,
) => {
  return Effect.gen(function* () {
    const twinService = yield* NativeTwinManagerService;
    const documentsHandler = yield* DocumentsService;
    const document = documentsHandler
      .getDocument(params.textDocument.uri)
      .pipe(Option.getOrThrow);

    const regions = document.getLanguageRegions();

    const results = RA.map(
      regions,
      (region) =>
        new TwinDiagnosticHandler(
          region,
          region.getFullSheetEntries(twinService.tw),
          document,
        ),
    );

    const diagnosticItems = results.flatMap((x) => x.diagnostics);

    console.log(results, diagnosticItems);
    return {
      kind: 'full',
      items: diagnosticItems,
    } satisfies vscode.DocumentDiagnosticReport;
  });
};
