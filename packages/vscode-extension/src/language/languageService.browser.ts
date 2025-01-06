import { Constants } from '@native-twin/language-service';
import * as Ctx from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import * as vscode from 'vscode';
import {
  LanguageClient,
  type LanguageClientOptions,
} from 'vscode-languageclient/browser.js';
import { VscodeContext } from '../extension/extension.service.js';
import { extensionConfigValue, registerCommand } from '../extension/extension.utils.js';
import {
  getDefaultLanguageClientOptions,
  onLanguageClientClosed,
  onLanguageClientError,
  onProvideDocumentColors,
} from './language.fn.js';
import {
  createFileWatchers,
  getColorDecoration,
  getConfigFiles,
} from './language.utils.js';

// import TwinWorker from './twin.worker.js.js';

const make = Effect.gen(function* () {
  const extensionCtx = yield* VscodeContext;
  const workspace = vscode.workspace.workspaceFolders;

  const fileEvents = yield* createFileWatchers;

  // const serverConfig: ServerOptions = {
  //   run: {
  //     module: path.resolve(__dirname, './native-twin.server'),
  //     transport: TransportKind.ipc,
  //   },
  //   debug: {
  //     module: path.resolve(__dirname, './native-twin.server'),
  //     transport: TransportKind.ipc,
  //   },
  // };

  const configFiles = yield* getConfigFiles;
  const colorDecorationType = yield* getColorDecoration;
  extensionCtx.subscriptions.push(colorDecorationType);

  const clientConfig: LanguageClientOptions = {
    ...getDefaultLanguageClientOptions({
      twinConfigFile: configFiles.at(0)?.path,
      workspaceRoot: workspace?.at(0)?.uri.path,
    }),
    synchronize: {
      fileEvents: fileEvents,
      configurationSection: Constants.configurationSection,
    },
    errorHandler: {
      error: onLanguageClientError,
      closed: onLanguageClientClosed,
    },
    middleware: {
      provideDocumentColors: async (document, token, next) =>
        onProvideDocumentColors(document, token, next, colorDecorationType),
    },
  };

  const client = yield* Effect.acquireRelease(
    Effect.sync(
      () =>
        new LanguageClient(
          'native-twin-vscode',
          Constants.extensionServerChannelName,
          clientConfig,
          new Worker(
            vscode.Uri.joinPath(extensionCtx.extensionUri, 'twin.worker.js').toString(
              true,
            ),
          ),
        ),
    ),
    (x) =>
      Effect.promise(() => x.dispose()).pipe(
        Effect.flatMap(() => Effect.logDebug('Language Client Disposed')),
      ),
  );

  yield* Effect.promise(() => client.start()).pipe(
    Effect.andThen(Effect.log('Language client started!')),
  );

  client.onRequest('nativeTwinInitialized', () => {
    return { t: true };
  });

  yield* registerCommand(`${Constants.configurationSection}.restart`, () =>
    Effect.gen(function* () {
      yield* Effect.promise(() => client.stop());
      yield* Effect.promise(() => client.start());
      yield* Effect.logInfo('Client restarted');
    }),
  );

  const functionsConfig = yield* extensionConfigValue(
    'functions',
    Constants.DEFAULT_PLUGIN_CONFIG.functions,
  );
  const debugConfig = yield* extensionConfigValue(
    'debug',
    Constants.DEFAULT_PLUGIN_CONFIG.debug,
  );

  yield* functionsConfig.changes.pipe(
    Stream.runForEach((x) => Effect.log('FUNCTIONS: ', x)),
    Effect.fork,
  );
  yield* debugConfig.changes.pipe(
    Stream.runForEach((x) => Effect.log('DEBUG: ', x)),
    Effect.fork,
  );

  return client;
});

export class LanguageClientContextBrowser extends Ctx.Tag('vscode/LanguageClientContext')<
  LanguageClientContextBrowser,
  LanguageClient
>() {
  static Live = Layer.scoped(LanguageClientContextBrowser, make);
}
