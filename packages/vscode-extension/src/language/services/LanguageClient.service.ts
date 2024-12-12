import path from 'node:path';
import { Constants, NativeTwinManagerService } from '@native-twin/language-service';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import * as vscode from 'vscode';
import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node.js';
import { VscodeContext } from '../../extension/extension.service.js';
import { registerCommand } from '../../extension/extension.utils.js';
import {
  getDefaultLanguageClientOptions,
  onLanguageClientClosed,
  onLanguageClientError,
  onProvideDocumentColors,
} from '../language.fn.js';
import {
  createFileWatchers,
  getColorDecoration,
  getConfigFiles,
} from '../language.utils.js';
import { VscodeHightLightsProvider } from './DocumentHighLights.service.js';

export const LanguageClientLive = Effect.gen(function* () {
  const twin = yield* NativeTwinManagerService;
  const extensionCtx = yield* VscodeContext;
  const { provideDocumentHighlights } = yield* VscodeHightLightsProvider;

  const highLightsProviders = Constants.DOCUMENT_SELECTORS.map((x) =>
    vscode.languages.registerDocumentHighlightProvider(
      {
        language: x.language,
        scheme: x.scheme,
      },
      {
        provideDocumentHighlights,
      },
    ),
  );
  extensionCtx.subscriptions.push(...highLightsProviders);

  const fileEvents = yield* createFileWatchers;

  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  const serverConfig: ServerOptions = {
    run: {
      module: extensionCtx.asAbsolutePath(path.join('build', 'servers', 'lsp.node.js')),
      transport: TransportKind.ipc,
    },
    debug: {
      module: extensionCtx.asAbsolutePath(path.join('build', 'servers', 'lsp.node.js')),
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const configFiles = yield* getConfigFiles;
  const colorDecorationType = yield* getColorDecoration;
  extensionCtx.subscriptions.push(colorDecorationType);
  Option.fromNullable(configFiles.at(0)).pipe(
    Option.map((x) => twin.loadUserFile(x.path)),
  );

  const clientConfig: LanguageClientOptions = {
    ...getDefaultLanguageClientOptions({
      twinConfigFile: twin.configFile,
      workspaceRoot: twin.configFileRoot,
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
      workspace: {
        workspaceFolders: (token, next) => {
          return next(token);
        },
      },
      provideDocumentColors: async (document, token, next) => {
        return onProvideDocumentColors(document, token, next, colorDecorationType);
      },
    },
  };
  const languageClient = yield* Effect.acquireRelease(
    Effect.sync(
      () =>
        new LanguageClient(
          Constants.extensionServerChannelName,
          serverConfig,
          clientConfig,
        ),
    ),
    (x) =>
      Effect.promise(() => x.dispose()).pipe(
        Effect.flatMap(() => Effect.logDebug('Language Client Disposed')),
      ),
  );

  const response = yield* Effect.tryPromise({
    try: () => languageClient.sendRequest<string>('hello', { params: 'hello_response' }),
    catch(error) {
      console.error('ERROR_sendRequest_hole', error);
    },
  });

  console.log('SERVER_RESPONSE: ', response);

  yield* Effect.promise(() => languageClient.start()).pipe(
    Effect.andThen(Effect.log('Language client started!')),
  );

  yield* registerCommand(`${Constants.configurationSection}.restart`, () =>
    Effect.gen(function* () {
      yield* Effect.promise(() => languageClient.restart());
      yield* Effect.log('Client restarted');
    }),
  );
}).pipe(Layer.scopedDiscard);
