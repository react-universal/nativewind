import * as Ctx from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { TextDocuments } from 'vscode-languageserver/node';
import { ConnectionContext } from '../connection/connection.context';

export class DocumentsService extends Ctx.Tag('vscode/DocumentsService')<
  DocumentsService,
  TextDocuments<TextDocument>
>() {}

export const DocumentsServiceLive = Layer.effect(
  DocumentsService,
  Effect.gen(function* ($) {
    const connection = yield* $(ConnectionContext);
    const handler = new TextDocuments(TextDocument);

    // handler.onDidChangeContent((change) => {
    //   validateTextDocument(change.document);
    // });

    handler.listen(connection);

    return handler;
  }).pipe(Effect.tap(() => Effect.log('Documents Initialized'))),
);
