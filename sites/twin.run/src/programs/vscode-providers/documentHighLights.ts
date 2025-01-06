import * as vscode from 'vscode';
import { Constants, parseTemplate } from '@native-twin/language-service/browser';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import { TwinTextDocument } from '../../editor/models/TwinTextDocument.model';

const provideDocumentHightLight = (selector: vscode.DocumentSelector) =>
  Effect.gen(function* () {
    const provider: vscode.DocumentHighlightProvider = {
      async provideDocumentHighlights(document, position, _token) {
        const twinDocument = new TwinTextDocument(document);
        // const cursorOffset = twinDocument.document.offsetAt(position);
        const foundToken = twinDocument.findTokenLocationAt(
          position,
          Constants.DEFAULT_PLUGIN_CONFIG,
        );

        const highlights = pipe(
          Option.map(foundToken, (x) => {
            return parseTemplate(x.text, x.offset.start);
          }),
          // Option.flatMap((tokens) => getParsedNodeAtOffset(tokens, cursorOffset)),
          Option.getOrElse(() => []),
          RA.map(
            (node): vscode.DocumentHighlight => ({
              range: new vscode.Range(
                document.positionAt(node.bodyLoc.start),
                document.positionAt(node.bodyLoc.end),
              ),
              kind: vscode.DocumentHighlightKind.Text,
            }),
          ),
          // Option.map(asArray),
        );

        return highlights;
      },
    };

    return {
      provider,
      selector,
    };
  });

export const StartHightLightsProvider = Effect.gen(function* () {
  yield* Stream.fromIterable(Constants.DOCUMENT_SELECTORS).pipe(
    Stream.mapEffect((selector) => provideDocumentHightLight(selector)),
    Stream.runDrain,
  );
});
