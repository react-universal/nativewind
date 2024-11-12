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
  LSPDocumentsService,
  LSPConnectionService,
  languagePrograms,
  LSPConfigService,
} from '@native-twin/language-service/browser';

const messageReader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const messageWriter = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);
const connectionHandler = createConnection(messageReader, messageWriter);
export const documentsHandler = new TextDocuments(TextDocument);

export const LspMainLive = LSPDocumentsService.make(documentsHandler).pipe(
  Layer.provideMerge(LSPConfigService.Live),
  Layer.provideMerge(NativeTwinManagerService.Live),
  Layer.provideMerge(LSPConnectionService.make(connectionHandler)),
);

const program = Effect.gen(function* () {
  const connectionService = yield* LSPConnectionService;
  const Connection = connectionService;
  const Runtime = ManagedRuntime.make(LspMainLive);

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

  Connection.onCodeAction(() => undefined);

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

  documentsHandler.listen(connectionHandler);
  connectionHandler.listen();
});

const runnable = Effect.provide(program, LspMainLive);

Effect.runFork(runnable);
