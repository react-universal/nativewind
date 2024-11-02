import { sheetEntriesToCss } from '@native-twin/css';
import * as ReadonlyArray from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as HashSet from 'effect/HashSet';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import type * as vscode from 'vscode-languageserver';
import { Range } from 'vscode-languageserver-types';
import { DocumentsService } from '../documents/documents.service';
import { NativeTwinManagerService } from '../native-twin/native-twin.service';
import { getSheetEntryStyles } from '../utils/sheet.utils';
import { VscodeCompletionItem } from './models/completion.model';
import { getCompletionsForTokens } from './utils/completion.pipes';
import * as Completions from './utils/completions.maps';

const getCompletionsAtPosition = (
  params: vscode.CompletionParams,
  _cancelToken: vscode.CancellationToken,
  _progress: vscode.WorkDoneProgressReporter,
  _resultProgress: vscode.ResultProgressReporter<vscode.CompletionItem[]> | undefined,
): Effect.Effect<
  vscode.CompletionItem[],
  never,
  NativeTwinManagerService | DocumentsService
> =>
  Effect.gen(function* () {
    const twinService = yield* NativeTwinManagerService;
    const documentsHandler = yield* DocumentsService;
    const maybeDocument = documentsHandler.getDocument(params.textDocument.uri);

    if (Option.isNone(maybeDocument)) return [];

    const { value: document } = maybeDocument;
    const cursorOffset = document.positionToOffset(params.position);
    const textRange = Range.create(
      document.offsetToPosition(cursorOffset - 1),
      document.offsetToPosition(cursorOffset + 1),
    );
    const positionText = document.getText(textRange);

    if (positionText === '``') {
      Completions.getAllCompletionRules(
        twinService.completions,
        Range.create(
          document.offsetToPosition(cursorOffset),
          document.offsetToPosition(cursorOffset + 1),
        ),
      );
    }

    return Option.Do.pipe(
      Option.bind('node', () => document.getTemplateAtPosition(params.position)),
      Option.bind('tokenAtPosition', ({ node }) =>
        node.getParsedNodeAtOffset(cursorOffset),
      ),
      Option.map(({ tokenAtPosition }) => {
        const tokens = getCompletionsForTokens(tokenAtPosition.flattenToken, twinService);
        return Completions.completionRulesToEntries(
          tokenAtPosition.flattenToken,
          tokens,
          document,
        );
      }),
      Option.getOrElse((): VscodeCompletionItem[] => []),
    );
  });

const getCompletionEntryDetails = (
  entry: vscode.CompletionItem,
  _cancelToken: vscode.CancellationToken,
) => {
  return Effect.map(NativeTwinManagerService, (twinService) => {
    const context = twinService.getCompilerContext();
    const completionRules = HashSet.filter(
      twinService.getTwinRules(),
      (x) => x.completion.className === entry.label,
    );
    const completionEntries = HashSet.map(completionRules, (x) => {
      const sheet = twinService.tw(x.completion.className);
      const finalSheet = getSheetEntryStyles(sheet, context);
      const css = sheetEntriesToCss(sheet);

      return Completions.createCompletionEntryDetails(entry, css, finalSheet);
    });

    return completionEntries.pipe(
      ReadonlyArray.fromIterable,
      ReadonlyArray.head,
      Option.getOrElse(() => entry),
    );
  });
};

const make = Effect.gen(function* () {
  yield* NativeTwinManagerService;
  yield* DocumentsService;
  return {
    getCompletionsAtPosition,
    getCompletionEntryDetails,
  };
});

export class LanguageCompletions extends Context.Tag('lsp/completions')<
  LanguageCompletions,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(LanguageCompletions, make);
}
