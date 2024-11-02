import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Iterable from 'effect/Iterable';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as String from 'effect/String';
import { inspect } from 'util';
import {
  NativeTwinManagerService,
  DocumentsService,
  ConnectionService,
  initializeConnection,
  ConfigManagerService,
  createLanguageService,
  getDocumentHighLightsProgram,
} from '@native-twin/language-service';
import { LspMainLive } from './lsp.layer';

const program = Effect.gen(function* () {
  const connectionService = yield* ConnectionService;
  const Connection = connectionService;
  const configService = yield* ConfigManagerService;
  const documentService = yield* DocumentsService;
  const nativeTwinManager = yield* NativeTwinManagerService;
  const languageService = yield* createLanguageService;

  const Runtime = ManagedRuntime.make(LspMainLive);

  Connection.onInitialize(async (...args) =>
    initializeConnection(...args, nativeTwinManager, configService),
  );

  Connection.onCompletion(async (...args) =>
    Runtime.runPromise(
      languageService.completions.getCompletionsAtPosition(...args).pipe(
        Effect.andThen((items) => ({
          isIncomplete: true,
          items,
        })),
      ),
    ),
  );

  Connection.onDidChangeConfiguration((config) => {
    Connection.console.debug(`Configuration changes received: `);
    if ('nativeTwin' in config.settings) {
      configService.onUpdateConfig({
        ...configService,
        config: {
          ...configService.config,
          ...config.settings['nativeTwin'],
        },
      });
    }
    pipe(
      inspect(config, {
        depth: null,
        sorted: true,
        compact: true,
      }),
      String.linesIterator,
      Iterable.map(String.padStart(5)),
      Iterable.forEach((x) => {
        Connection.console.debug(x);
      }),
    );
  });

  Connection.onCompletionResolve(async (...args) =>
    Runtime.runPromise(languageService.completions.getCompletionEntryDetails(...args)),
  );

  Connection.onHover(async (...args) =>
    Effect.runPromise(languageService.documentation.getHover(...args)),
  );

  Connection.onShutdown(() => {
    Connection.console.log('shootDown');
    Connection.dispose();
  });

  Connection.languages.diagnostics.on(async (...args) =>
    Effect.runPromise(languageService.diagnostics.getDocumentDiagnostics(...args)),
  );

  Connection.onDocumentColor(async (...params) =>
    Effect.runPromise(languageService.documentation.getDocumentColors(...params)),
  );

  Connection.onDocumentHighlight(async (...args) => {
    return Runtime.runPromise(getDocumentHighLightsProgram(...args));
  });

  Connection.listen();
  const listener = documentService.handler.listen(Connection);

  Effect.addFinalizer((exit) => {
    Connection.console.debug('Disposing Connection');
    Connection.dispose();
    Connection.console.debug('Disposing Documents Handler');
    listener.dispose();
    Connection.console.debug(`Closing reason: ${exit.toJSON()}`);
    return Effect.void;
  });
});

const runnable = Effect.provide(program, LspMainLive);

Effect.runFork(runnable);
