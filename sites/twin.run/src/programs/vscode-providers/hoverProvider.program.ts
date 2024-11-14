import * as vscode from 'vscode';
import { sheetEntriesToCss } from '@native-twin/css';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import { isRecord } from 'effect/Predicate';
import {
  completionRuleToQuickInfo,
  Constants,
  DocumentLanguageRegion,
  getSheetEntryStyles,
  NativeTwinManagerService,
} from '@native-twin/language-service';
import { TwinTextDocument } from '@/editor/models/TwinTextDocument.model';

export const InstallHoverProvider = Effect.gen(function* () {
  const twin = yield* NativeTwinManagerService;
  vscode.languages.registerHoverProvider(Constants.DOCUMENT_SELECTORS, {
    provideHover: async (document, position) => {
      const twinDocument = new TwinTextDocument(document);
      const tokenAtPosition = twinDocument.findTokenLocationAt(
        position,
        Constants.DEFAULT_PLUGIN_CONFIG,
      );

      const cursorOffset = document.offsetAt(position);

      const hoverInfo = Option.map(
        tokenAtPosition,
        (x) => new DocumentLanguageRegion(x.range, x.offset.start, x.offset.end, x.text),
      ).pipe(
        Option.flatMap((nodeAdPosition) =>
          nodeAdPosition.getParsedNodeAtOffset(cursorOffset),
        ),
        Option.flatMap((flattenCompletions) => {
          return RA.findFirst(
            flattenCompletions.flattenToken,
            (x) =>
              cursorOffset >= x.token.bodyLoc.start &&
              cursorOffset <= x.token.bodyLoc.end,
          ).pipe(
            Option.map((x): { range: vscode.Range; text: string } => ({
              range: new vscode.Range(
                document.positionAt(x.token.bodyLoc.start),
                document.positionAt(x.token.bodyLoc.end),
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
                    range: new vscode.Range(
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
        Option.map((tokenAtPosition) => {
          const cx = twin.cx`${tokenAtPosition.text}`;
          const entries = twin.tw(`${cx}`);
          const sheet = {
            rn: getSheetEntryStyles(entries, twin.getCompilerContext()),
            css: sheetEntriesToCss(entries),
          };
          return completionRuleToQuickInfo(sheet.rn, sheet.css, tokenAtPosition.range);
        }),
        Option.getOrUndefined,
      );

      if (!hoverInfo) return undefined;

      let contents: vscode.MarkdownString | undefined = undefined;
      if (isRecord(hoverInfo.contents)) {
        contents = new vscode.MarkdownString(hoverInfo.contents.value);
        contents.isTrusted = true;
        contents.supportHtml = true;

        // contents.baseUri = vscode.Uri.file('/hover.css');
      } else {
        contents = new vscode.MarkdownString('');
      }

      const start = new vscode.Position(
        hoverInfo.range?.start.line ?? 0,
        hoverInfo.range?.start.character ?? 0,
      );
      const end = new vscode.Position(
        hoverInfo.range?.end.line ?? 0,
        hoverInfo.range?.end.character ?? 0,
      );
      const hover: vscode.Hover = {
        contents: [contents],
        range: new vscode.Range(start, end),
      };

      console.log('HOVER: ', hover);
      return Promise.resolve(hover);
    },
  });
});
