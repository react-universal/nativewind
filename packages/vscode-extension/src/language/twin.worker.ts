/* eslint-disable @typescript-eslint/no-empty-function */
/// <reference lib="WebWorker" />
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import { TextDocument } from 'vscode-languageserver-textdocument';
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
  TextDocuments,
} from 'vscode-languageserver/browser.js';
import {
  NativeTwinManagerService,
  createDocumentsLayer,
  DocumentsService,
  ConnectionService,
  ConfigManagerService,
  initializeConnection,
  languagePrograms,
} from '@native-twin/language-service/browser';

const messageReader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const messageWriter = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);
const connection = createConnection(messageReader, messageWriter);
export const documentsHandler = new TextDocuments(TextDocument);

const ConnectionLayer = ConnectionService.make(connection);
const DocumentsLayer = createDocumentsLayer(documentsHandler);
const MainLive = Layer.mergeAll(ConnectionLayer).pipe(
  Layer.provideMerge(DocumentsLayer),
  Layer.provideMerge(NativeTwinManagerService.Live),
  Layer.provideMerge(ConfigManagerService.Live),
);

const program = Effect.gen(function* () {
  const connectionService = yield* ConnectionService;
  const Connection = connectionService;
  const configService = yield* ConfigManagerService;
  yield* DocumentsService;
  const nativeTwinManager = yield* NativeTwinManagerService;
  const Runtime = ManagedRuntime.make(MainLive);

  Connection.onInitialize(async (...args) => {
    const init = initializeConnection(...args, nativeTwinManager, configService);
    return init;
  });

  Connection.onCompletion(async (...args) => {
    const completions = await Runtime.runPromise(
      languagePrograms.getCompletionsAtPosition(...args),
    );
    console.log('COMPLETIONS: ', completions);

    return {
      isIncomplete: completions.length > 0,
      items: completions,
    };
  });

  Connection.onCompletionResolve(async (...args) =>
    Runtime.runPromise(languagePrograms.getCompletionEntryDetails(...args)),
  );

  Connection.onHover(async (...args) =>
    Runtime.runPromise(languagePrograms.getHoverDetails(...args)),
  );

  Connection.onDocumentColor(async (...params) =>
    Runtime.runPromise(languagePrograms.getDocumentColors(...params)),
  );

  Connection.languages.diagnostics.on(async (...args) =>
    Runtime.runPromise(languagePrograms.getDocumentDiagnosticsProgram(...args)),
  );

  // documentsHandler.listen(connection);
  // connection.listen();
});

const runnable = Effect.provide(program, MainLive);

Effect.runFork(runnable);

documentsHandler.listen(connection);
connection.listen();
