import * as ReadonlyArray from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import * as vscode from 'vscode-languageserver/node';
import { DocumentsService } from '../documents/documents.service';
import { NativeTwinManagerService } from '../native-twin/native-twin.models';
import { extractDocumentAndPositions } from './utils/completion.pipes';
import * as Completions from './utils/completions.maps';
import { getFlattenTemplateToken, getTokensAtOffset } from './utils/language.utils';

export const getCompletionsAtPosition = (
  params: vscode.CompletionParams,
  _cancelToken: vscode.CancellationToken,
  _progress: vscode.WorkDoneProgressReporter,
  _resultProgress: vscode.ResultProgressReporter<vscode.CompletionItem[]> | undefined,
) => {
  return Effect.gen(function* () {
    const { completions: twinStore } = yield* NativeTwinManagerService;
    const documentsHandler = yield* DocumentsService;

    return Option.Do.pipe(
      () =>
        extractDocumentAndPositions(
          documentsHandler.getDocument(params.textDocument),
          params.position,
        ),

      Option.let('ruleCompletions', ({ nodeAtPosition }) =>
        Completions.createCompletionsWithToken(nodeAtPosition, twinStore),
      ),

      Option.let('flattenCompletions', ({ cursorOffset, nodeAtPosition }) =>
        pipe(
          getTokensAtOffset(nodeAtPosition, cursorOffset)
            .flatMap((x) => getFlattenTemplateToken(x))
            .filter(
              (x) => cursorOffset >= x.bodyLoc.start && cursorOffset <= x.bodyLoc.end,
            ),
          ReadonlyArray.dedupe,
        ),
      ),

      Option.let(
        'filteredCompletions',
        ({ ruleCompletions, flattenCompletions, document }) =>
          pipe(
            ReadonlyArray.fromIterable(flattenCompletions),
            ReadonlyArray.flatMap((x) => {
              const range = vscode.Range.create(
                document.handler.positionAt(x.bodyLoc.start),
                document.handler.positionAt(x.bodyLoc.end),
              );
              return pipe(
                ReadonlyArray.fromIterable(ruleCompletions),
                ReadonlyArray.filter((y) => y.completion.className.startsWith(x.text)),
                ReadonlyArray.map((z) => Completions.completionRuleToEntry(z, z.order)),
                ReadonlyArray.dedupe,
                ReadonlyArray.map((zz) => ({
                  ...zz,
                  textEdit: {
                    insert: range,
                    range: range,
                    newText: zz.label,
                    replace: range,
                  },
                })),
              );
            }),
          ),
      ),
      Option.match({
        onSome: ({ filteredCompletions }) => filteredCompletions,
        onNone: () => [],
      }),
    );
  });
};
