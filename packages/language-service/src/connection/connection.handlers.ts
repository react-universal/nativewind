import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as vscode from 'vscode-languageserver';
import { NativeTwinManagerService } from '../native-twin/native-twin.service';
import { ConfigManagerService } from './client.config';

export const initializeConnection = (
  params: vscode.InitializeParams,
  _token: vscode.CancellationToken,
  _workDoneProgress: vscode.WorkDoneProgressReporter,
  _resultProgress: vscode.ResultProgressReporter<never> | undefined,
  manager: NativeTwinManagerService['Type'],
  configManager: ConfigManagerService['Type'],
) => {
  const configOptions = params.initializationOptions;

  if (configOptions) {
    const twinConfigFile = Option.fromNullable<vscode.URI>(
      configOptions?.twinConfigFile?.path,
    );
    Option.map(twinConfigFile, (x) => {
      manager.loadUserFile(x);
    });
  }

  const capabilities = getClientCapabilities(params.capabilities);
  configManager.onUpdateConfig({
    config: configOptions,
    ...configOptions,
  });
  return capabilities;
};

export const getClientCapabilities = (capabilities: vscode.ClientCapabilities) => {
  const setup = {
    hasConfigurationCapability: !!(
      capabilities.workspace && !!capabilities.workspace.configuration
    ),
    hasWorkspaceFolderCapability: !!(
      capabilities.workspace && !!capabilities.workspace.workspaceFolders
    ),
    hasDiagnosticRelatedInformationCapability: !!(
      capabilities.textDocument &&
      capabilities.textDocument.publishDiagnostics &&
      capabilities.textDocument.publishDiagnostics.relatedInformation
    ),
  };
  const result: vscode.InitializeResult = {
    capabilities: {
      textDocumentSync: 2,
      colorProvider: true,
      hoverProvider: true,
      documentHighlightProvider: false,
      codeActionProvider: true,
      workspaceSymbolProvider: {
        resolveProvider: true,
      },
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
        completionItem: {
          labelDetailsSupport: true,
        },
        triggerCharacters: ['`'],
      },
      workspace: {
        workspaceFolders: {
          supported: setup.hasConfigurationCapability,
        },
      },
      diagnosticProvider: {
        interFileDependencies: false,
        workspaceDiagnostics: false,
      },
    },
  };
  return result;
};

export const addServerRequestHandler = <Params, Result, Error>(
  event: (
    handler: vscode.ServerRequestHandler<Params, Result, never, Error>,
  ) => vscode.Disposable,
  handler: vscode.ServerRequestHandler<Params, Result, never, Error>,
) => {
  return Effect.sync(() => {
    let result: Option.Option<vscode.HandlerResult<Result, Error>> = Option.none();
    return event((...args) => {
      result = Option.fromNullable(handler(...args));
      return result.pipe(Option.getOrThrow);
    });
  });
};

export const addConnectionRequestHandler = <Params, Result, Error>(
  event: (handler: vscode.RequestHandler<Params, Result, Error>) => vscode.Disposable,
  handler: vscode.RequestHandler<Params, Result, Error>,
) => {
  return Effect.sync(() => {
    return event((...args) => {
      return handler(...args);
    });
  });
};
