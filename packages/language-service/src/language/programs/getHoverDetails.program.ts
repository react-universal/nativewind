import { sheetEntriesToCss } from '@native-twin/css';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as vscode from 'vscode-languageserver';
import { DocumentsService } from '../../documents';
import { NativeTwinManagerService } from '../../native-twin';
import { getSheetEntryStyles } from '../../utils/sheet.utils';
import { completionRuleToQuickInfo } from '../utils/quickInfo.utils';

export const getHoverDetails = (
  params: vscode.HoverParams,
  _cancelToken: vscode.CancellationToken,
  _progress: vscode.WorkDoneProgressReporter,
  _resultProgress: vscode.ResultProgressReporter<vscode.CompletionItem[]> | undefined,
) => {
  return Effect.gen(function* () {
    const twinService = yield* NativeTwinManagerService;
    const documentsHandler = yield* DocumentsService;
    const context = twinService.getCompilerContext();
    const extracted = yield* documentsHandler.getDocument(params.textDocument.uri);

    const hoverEntry = Option.Do.pipe(
      Option.bind('document', () => extracted),
      Option.bind('nodeAdPosition', ({ document }) =>
        document.getTemplateAtPosition(params.position),
      ),

      Option.bind('flattenCompletions', ({ document, nodeAdPosition }) =>
        nodeAdPosition.getParsedNodeAtOffset(document.positionToOffset(params.position)),
      ),
      Option.let('cursorOffset', ({ document }) =>
        document.positionToOffset(params.position),
      ),
      Option.bind('tokenAtPosition', ({ flattenCompletions, cursorOffset, document }) => {
        return RA.findFirst(
          flattenCompletions.flattenToken,
          (x) =>
            cursorOffset >= x.token.bodyLoc.start && cursorOffset <= x.token.bodyLoc.end,
        ).pipe(
          Option.map((x): { range: vscode.Range; text: string } => ({
            range: vscode.Range.create(
              document.offsetToPosition(x.token.bodyLoc.start),
              document.offsetToPosition(x.token.bodyLoc.end),
            ),
            text: x.token.text,
          })),
          Option.match({
            onSome(a) {
              return Option.some(a);
            },
            onNone() {
              const token = flattenCompletions.token;
              if (
                token.type === 'GROUP' &&
                cursorOffset >= token.value.base.bodyLoc.start &&
                cursorOffset <= token.value.base.bodyLoc.end
              ) {
                return Option.some({
                  range: vscode.Range.create(
                    document.offsetToPosition(flattenCompletions.bodyLoc.start),
                    document.offsetToPosition(flattenCompletions.bodyLoc.end),
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
