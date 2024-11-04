import * as RA from 'effect/Array';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as vscode from 'vscode';
import { asArray } from '@native-twin/helpers';
import {
  parseTemplate,
  TemplateTokenWithText,
  Constants,
} from '@native-twin/language-service';
import { extensionConfigState } from '../../extension/extension.utils';
import { TwinTextDocument } from '../models/TwinTextDocument.model';

const getParsedNodeAtOffset = (nodes: TemplateTokenWithText[], offset: number) =>
  RA.findFirst(nodes, (x) => offset >= x.bodyLoc.start && offset <= x.bodyLoc.end);

export class VscodeHightLightsProvider extends Context.Tag(
  'vscode/client/VscodeHightLightsProvider',
)<VscodeHightLightsProvider, vscode.DocumentHighlightProvider>() {
  static Live = Layer.scoped(
    VscodeHightLightsProvider,
    Effect.gen(function* () {
      const { get } = yield* extensionConfigState(Constants.DEFAULT_PLUGIN_CONFIG);
      const config = yield* get;
      return {
        async provideDocumentHighlights(document, position, _token) {
          const twinDocument = new TwinTextDocument(document);
          const cursorOffset = twinDocument.document.offsetAt(position);
          const foundToken = twinDocument.findTokenLocationAt(position, config);

          const highlights = pipe(
            Option.map(foundToken, (x) => {
              return parseTemplate(x.text, x.offset.start);
            }),
            Option.flatMap((tokens) => getParsedNodeAtOffset(tokens, cursorOffset)),
            Option.map(
              (node): vscode.DocumentHighlight => ({
                range: new vscode.Range(
                  document.positionAt(node.bodyLoc.start),
                  document.positionAt(node.bodyLoc.end),
                ),
                kind: vscode.DocumentHighlightKind.Text,
              }),
            ),
            Option.map(asArray),
          );

          return Option.getOrUndefined(highlights);
        },
      };
    }),
  );
}
