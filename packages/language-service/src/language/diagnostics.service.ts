import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
// import * as KeyMap from '@native-twin/helpers/KeyMap';
import * as vscode from 'vscode-languageserver';
import { DocumentsService } from '../documents/documents.service';
import { NativeTwinManagerService } from '../native-twin/native-twin.service';
import { VscodeDiagnosticItem } from './models/diagnostic.model';
import { diagnosticTokensToDiagnosticItems } from './utils/diagnostic';

export class LanguageDiagnostics extends Context.Tag('lsp/diagnostics')<
  LanguageDiagnostics,
  {
    readonly getDocumentDiagnostics: (
      params: vscode.DocumentDiagnosticParams,
      _token: vscode.CancellationToken,
      _workDoneProgress: vscode.WorkDoneProgressReporter,
      _resultProgress?:
        | vscode.ResultProgressReporter<vscode.DocumentDiagnosticReportPartialResult>
        | undefined,
    ) => Effect.Effect<{
      kind: 'full';
      items: VscodeDiagnosticItem[];
    }>;
  }
>() {
  static Live = Layer.scoped(
    LanguageDiagnostics,
    Effect.gen(function* () {
      const twinService = yield* NativeTwinManagerService;
      const documentsHandler = yield* DocumentsService;
      // const diagnosticsCache = KeyMap.make<vscode.URI,Diagnos();
      return {
        getDocumentDiagnostics(params) {
          return Effect.gen(function* () {
            const document = documentsHandler
              .getDocument(params.textDocument.uri)
              .pipe(Option.getOrThrow);

            const diagnosticItems = diagnosticTokensToDiagnosticItems(
              document,
              twinService,
            );

            return {
              kind: 'full',
              items: diagnosticItems,
            } satisfies vscode.DocumentDiagnosticReport;
          });
        },
      };
    }),
  );
}
