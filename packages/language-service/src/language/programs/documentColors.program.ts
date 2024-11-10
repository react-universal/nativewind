import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import type * as vscode from 'vscode-languageserver';
import { DocumentsService } from '../../documents';
import { NativeTwinManagerService } from '../../native-twin';
import { getDocumentTemplatesColors } from '../utils/colorInfo.utils';

export const getDocumentColors = (
  params: vscode.DocumentColorParams,
  _cancelToken: vscode.CancellationToken,
  _progress: vscode.WorkDoneProgressReporter,
  _resultProgress: vscode.ResultProgressReporter<vscode.ColorInformation[]> | undefined,
) => {
  return Effect.gen(function* () {
    const documentsHandler = yield* DocumentsService;
    const twinService = yield* NativeTwinManagerService;
    const document = yield* documentsHandler.getDocument(params.textDocument.uri);

    return Option.map(document, (x) => getDocumentTemplatesColors(twinService, x)).pipe(
      Option.match({
        onSome: (result): vscode.ColorInformation[] => result,
        onNone: () => [],
      }),
    );
  });
};
