import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import type { Connection, TextDocuments } from 'vscode-languageserver';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { ConfigManagerService } from '../connection';
import { TwinLSPDocument } from './models/twin-document.model';

export interface DocumentsServiceShape {
  handler: TextDocuments<TextDocument>;
  getDocument: (uri: string) => Option.Option<TwinLSPDocument>;
  setupConnection(connection: Connection): void;
}

const getDocument =
  (handler: TextDocuments<TextDocument>, config: ConfigManagerService['Type']) =>
  (uri: string): Option.Option<TwinLSPDocument> =>
    Option.map(
      Option.fromNullable(handler.get(uri)),
      (x) => new TwinLSPDocument(x, config.config),
    );

const setupConnection =
  (handler: TextDocuments<TextDocument>) => (connection: Connection) =>
    handler.listen(connection);

const make = (handler: TextDocuments<TextDocument>) =>
  Effect.gen(function* () {
    const config = yield* ConfigManagerService;
    const acquireDocument = getDocument(handler, config);

    return {
      handler,
      getDocument: acquireDocument,
      setupConnection: setupConnection(handler),
    };
  });

export const createDocumentsLayer = (handler: TextDocuments<TextDocument>) => {
  return Layer.scoped(DocumentsService, make(handler));
};

export class DocumentsService extends Context.Tag('language-service/documents')<
  DocumentsService,
  DocumentsServiceShape
>() {
  static make = createDocumentsLayer;
}
