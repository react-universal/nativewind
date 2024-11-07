import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Iterable from 'effect/Iterable';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import * as String from 'effect/String';
import { inspect } from 'util';
import * as LanguageService from '@native-twin/language-service';
import { LspMainLive } from './lsp.layer';

const program = Effect.gen(function* () {
  const Connection = yield* LanguageService.ConnectionService;
  const configService = yield* LanguageService.ConfigManagerService;
  const documentService = yield* LanguageService.DocumentsService;
  const nativeTwinManager = yield* LanguageService.NativeTwinManagerService;
  const languageService = yield* LanguageService.createLanguageService;

  const Runtime = ManagedRuntime.make(LspMainLive);

  Connection.onInitialize(async (...args) =>
    LanguageService.initializeConnection(...args, nativeTwinManager, configService),
  );

  Connection.onCompletion(async (...args) =>
    languageService.completions
      .getCompletionsAtPosition(...args)
      .pipe(
        Effect.andThen((items) => ({
          isIncomplete: true,
          items,
        })),
      )
      .pipe(Runtime.runPromise),
  );

  Connection.onCompletionResolve(async (...args) =>
    languageService.completions
      .getCompletionEntryDetails(...args)
      .pipe(Runtime.runPromise),
  );

  Connection.onHover(async (...args) =>
    languageService.documentation.getHover(...args).pipe(Effect.runPromise),
  );

  Connection.languages.diagnostics.on(async (...args) =>
    languageService.diagnostics.getDocumentDiagnostics(...args).pipe(Effect.runPromise),
  );

  Connection.onDocumentColor(async (...params) =>
    languageService.documentation.getDocumentColors(...params).pipe(Effect.runPromise),
  );

  Connection.onDocumentHighlight(async (...args) => {
    return LanguageService.getDocumentHighLightsProgram(...args).pipe(Runtime.runPromise);
  });

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
      Iterable.forEach((x) => Connection.console.debug(x)),
    );
  });

  Connection.onShutdown(() => {
    Connection.console.log('shootDown');
    Connection.dispose();
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
