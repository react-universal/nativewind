import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Option from 'effect/Option';
import type * as vscode from 'vscode-languageserver';
import { Range } from 'vscode-languageserver-types';
import { DocumentsService } from '../../documents';
import { NativeTwinManagerService } from '../../native-twin';
import { VscodeCompletionItem } from '../models/completion.model';
import { getCompletionsForTokens } from '../utils/completion.pipes';
import * as Completions from '../utils/completions.maps';

export const getCompletionsAtPosition = (input: {
  params: vscode.CompletionParams;
  cancelToken: vscode.CancellationToken;
  progress: vscode.WorkDoneProgressReporter;
  resultProgress: vscode.ResultProgressReporter<vscode.CompletionItem[]> | undefined;
}) =>
  Effect.acquireRelease(
    Effect.gen(function* () {
      const { params } = input;
      const documentsHandler = yield* DocumentsService;
      const twinService = yield* NativeTwinManagerService;

      const extracted = Option.Do.pipe(
        Option.bind('document', () =>
          documentsHandler.getDocument(params.textDocument.uri),
        ),
        Option.let('cursorOffset', ({ document }) =>
          document.positionToOffset(params.position),
        ),
        Option.bind('languageRegionAtPosition', ({ document }) =>
          document.getTemplateAtPosition(params.position),
        ),
        Option.let(
          'parsedText',
          ({ languageRegionAtPosition }) => languageRegionAtPosition.regionNodes,
        ),
      );

      const completionEntries = Option.flatMap(extracted, (meta) => {
        const text = meta.document.getText(
          Range.create(
            meta.document.offsetToPosition(meta.cursorOffset - 1),
            meta.document.offsetToPosition(meta.cursorOffset + 1),
          ),
        );
        if (text === '``') {
          return Option.some(
            Completions.getAllCompletionRules(
              twinService.completions,
              Range.create(
                meta.document.offsetToPosition(meta.cursorOffset),
                meta.document.offsetToPosition(meta.cursorOffset + 1),
              ),
            ),
          );
        }
        return Option.map(
          meta.languageRegionAtPosition.getParsedNodeAtOffset(meta.cursorOffset),
          (x) => {
            const tokens = getCompletionsForTokens(x.flattenToken, twinService);
            return Completions.completionRulesToEntries(
              x.flattenToken,
              tokens,
              meta.document,
            );
          },
        );
      });
      return Option.getOrElse(completionEntries, (): VscodeCompletionItem[] => []);
    }),
    (completion) => Exit.succeed(completion),
  );
