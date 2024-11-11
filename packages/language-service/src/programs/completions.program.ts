import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import type * as vscode from 'vscode-languageserver';
import { Range } from 'vscode-languageserver-types';
import { VscodeCompletionItem } from '../models/language/completion.model';
import { NativeTwinManagerService } from '../services/NativeTwinManager.service';
import { LSPDocumentsService } from '../services/LSPDocuments.service';
import { getCompletionsForTokens } from '../utils/language/completion.pipes';
import * as Completions from '../utils/language/completions.maps';

export const getCompletionsAtPosition = (
  params: vscode.CompletionParams,
  _cancelToken: vscode.CancellationToken,
  _progress: vscode.WorkDoneProgressReporter,
  _resultProgress: vscode.ResultProgressReporter<vscode.CompletionItem[]> | undefined,
) =>
  Effect.gen(function* () {
    const documentsHandler = yield* LSPDocumentsService;
    const twinService = yield* NativeTwinManagerService;
    const document = yield* documentsHandler.getDocument(params.textDocument.uri);

    const extracted = Option.Do.pipe(
      Option.bind('document', () => document),
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
  });
