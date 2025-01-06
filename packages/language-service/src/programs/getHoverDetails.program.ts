import { sheetEntriesToCss } from '@native-twin/css';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import type * as vscode from 'vscode-languageserver';
import { Range } from 'vscode-languageserver-types';
import { LSPDocumentsService } from '../services/LSPDocuments.service.js';
import { NativeTwinManagerService } from '../services/NativeTwinManager.service.js';
import { completionRuleToQuickInfo } from '../utils/language/quickInfo.utils.js';
import { getSheetEntryStyles } from '../utils/sheet.utils.js';

export const getHoverDetails = (
  params: vscode.HoverParams,
  _cancelToken: vscode.CancellationToken,
  _progress: vscode.WorkDoneProgressReporter,
  _resultProgress: vscode.ResultProgressReporter<vscode.CompletionItem[]> | undefined,
) => {
  return Effect.gen(function* () {
    const twinService = yield* NativeTwinManagerService;
    const documentsHandler = yield* LSPDocumentsService;
    const context = twinService.getCompilerContext();
    const extracted = yield* documentsHandler.getDocument(params.textDocument.uri);

    const hoverEntry = Option.Do.pipe(
      Option.bind('document', () => extracted),
      Option.bind('nodeAdPosition', ({ document }) =>
        document.getTemplateAtPosition(params.position),
      ),
      Option.let('cursorOffset', ({ document }) => document.offsetAt(params.position)),

      Option.bind('flattenCompletions', ({ nodeAdPosition, cursorOffset }) => {
        return nodeAdPosition.getParsedNodeAtOffset(cursorOffset);
      }),

      Option.bind('tokenAtPosition', ({ flattenCompletions, cursorOffset, document }) => {
        return RA.findFirst(
          flattenCompletions.flattenToken,
          (x) =>
            cursorOffset >= x.token.bodyLoc.start && cursorOffset <= x.token.bodyLoc.end,
        ).pipe(
          Option.map((x): { range: vscode.Range; text: string } => ({
            range: Range.create(
              document.positionAt(x.token.bodyLoc.start),
              document.positionAt(x.token.bodyLoc.end),
            ),
            text: x.token.text,
          })),
          Option.match({
            onSome: (a) => Option.some(a),
            onNone() {
              const token = flattenCompletions.token;
              if (
                token.type === 'GROUP' &&
                cursorOffset >= token.value.base.bodyLoc.start &&
                cursorOffset <= token.value.base.bodyLoc.end
              ) {
                return Option.some({
                  range: Range.create(
                    document.positionAt(flattenCompletions.bodyLoc.start),
                    document.positionAt(flattenCompletions.bodyLoc.end),
                  ),
                  text: flattenCompletions.text,
                });
              }
              return Option.none();
            },
          }),
        );
      }),
      Option.map(({ tokenAtPosition }) => {
        const cx = twinService.cx`${tokenAtPosition.text}`;
        const entries = twinService.tw(`${cx}`);
        const sheet = {
          rn: getSheetEntryStyles(entries, context),
          css: sheetEntriesToCss(entries),
        };
        return completionRuleToQuickInfo(sheet.rn, sheet.css, tokenAtPosition.range);
      }),
    );

    return Option.getOrUndefined(hoverEntry);
  });
};
