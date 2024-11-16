import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as vscode from 'vscode-languageserver';
import { LSPDocumentsService } from '../services/LSPDocuments.service';

export const getDocumentHighLightsProgram = (
  params: vscode.DocumentHighlightParams,
  _token: vscode.CancellationToken,
  _workDone: vscode.WorkDoneProgressReporter,
  _resultProgress: vscode.ResultProgressReporter<vscode.DocumentHighlight[]> | undefined,
): Effect.Effect<vscode.DocumentHighlight[], never, LSPDocumentsService> =>
  Effect.gen(function* () {
    const documentsHandler = yield* LSPDocumentsService;
    const document = yield* documentsHandler
      .getDocument(params.textDocument.uri)
      .pipe(Effect.map(Option.getOrNull));

    if (!document) return [];

    const cursorOffset = document.offsetAt(params.position);
    const highlights: vscode.DocumentHighlight[] = document
      .getTemplateAtPosition(params.position)
      .pipe(
        Option.flatMap((x) => x.getParsedNodeAtOffset(cursorOffset)),
        Option.map((node) => {
          const highLights: vscode.DocumentHighlight[] = [];
          if (node.token.type === 'CLASS_NAME') {
            highLights.push({
              range: vscode.Range.create(
                document.positionAt(node.bodyLoc.start),
                document.positionAt(node.bodyLoc.end),
              ),
              kind: vscode.DocumentHighlightKind.Text,
            });
          }
          return highLights;
        }),
        Option.getOrElse(() => []),
      );

    return highlights;
  });
