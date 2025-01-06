import * as vscode from 'vscode';
import { LogLevel } from 'vscode/services';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getSecretStorageServiceOverride from '@codingame/monaco-vscode-secret-storage-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import type { LanguageClientConfig, WrapperConfig } from 'monaco-editor-wrapper';
import * as Effect from 'effect/Effect';
import type { VscodeApiConfig } from 'monaco-languageclient/vscode/services';
import { Constants } from '@native-twin/language-service/browser';
import twinWorkerUrl from '../editor/workers/twin.worker?worker&url';
import { WorkspaceConfig } from '../editor/models/EditorFixture.model';
import reactJSXRaw from '../fixtures/react/Basic.react?raw';
import editorUserConfigJSON from '../fixtures/editor-config/configuration.json?raw';
import twinConfigRaw from '../fixtures/tailwind-configs/tailwind-preset.config?raw';
import {
  getColorDecoration,
  onLanguageClientClosed,
  onLanguageClientError,
  onProvideDocumentColors,
} from './languageClient.utils';

export const getMonacoWrapperConfig: Effect.Effect<{
  workspace: WorkspaceConfig;
  config: WrapperConfig;
}> = Effect.gen(function* () {
  const workspace = new WorkspaceConfig({
    jsx: reactJSXRaw,
    twinConfig: twinConfigRaw,
  });

  const vscodeApiConfig = getVscodeApiConfig(
    workspace.rootFiles.workspaceFile.uri,
    editorUserConfigJSON,
  );
  const editorAppConfig = workspace.getExtendedAppConfig();

  const colorDecorations = yield* Effect.cachedFunction((_: number) =>
    Effect.sync(() => getColorDecoration()),
  );
  const languageClientConfig: LanguageClientConfig = {
    name: 'Native Twin LSP',
    connection: {
      options: {
        $type: 'WorkerDirect',
        worker: new Worker(twinWorkerUrl, {
          type: 'module',
          name: 'twin.worker',
        }),
      },
    },
    clientOptions: {
      workspaceFolder: {
        index: 0,
        name: 'workspace',
        uri: vscode.Uri.file(workspace.workspacePath),
      },
      middleware: {
        provideDocumentColors: async (document, token, next) =>
          onProvideDocumentColors(
            document,
            token,
            next,
            Effect.runSync(colorDecorations(0)),
          ),
      },
      errorHandler: {
        error: onLanguageClientError,
        closed: onLanguageClientClosed,
      },
      documentSelector: Constants.DOCUMENT_SELECTORS,
      markdown: {
        isTrusted: true,
        supportHtml: true,
      },
      initializationOptions: {
        twinConfigFile: {
          path: 'file:///tailwind.config.ts',
        },
        capabilities: {
          completion: {
            dynamicRegistration: false,
            completionItem: {
              snippetSupport: true,
            },
          },
        },
      },
    },
  };

  const monacoEditorConfig: WrapperConfig = {
    id: 'native.twin',
    $type: 'extended',
    extensions: [
      {
        config: {
          name: workspace.twinExtensionID,
          publisher: workspace.twinExtensionPublisher,
          version: '1.0.0',
          engines: {
            vscode: '*',
          },
        },
      },
    ],
    editorAppConfig: editorAppConfig,
    languageClientConfigs: {
      twin: languageClientConfig,
    },
    vscodeApiConfig,
    logLevel: LogLevel.Info,
  };

  return {
    config: monacoEditorConfig,
    workspace,
  };
});

const getVscodeApiConfig = (
  workspaceFile: vscode.Uri,
  /** @description must be a JSON string */
  editorUserConfig: string,
): VscodeApiConfig => {
  return {
    serviceOverrides: {
      ...getConfigurationServiceOverride(),
      ...getThemeServiceOverride(),
      ...getSecretStorageServiceOverride(),
    },
    enableExtHostWorker: true,
    userConfiguration: {
      json: editorUserConfig,
    },
    workspaceConfig: {
      enableWorkspaceTrust: true,
      windowIndicator: {
        label: 'workspace',
        tooltip: '',
        command: '',
      },
      workspaceProvider: {
        trusted: true,
        async open() {
          window.open(window.location.href);
          return true;
        },
        workspace: {
          workspaceUri: workspaceFile,
        },
      },
      configurationDefaults: {
        'window.title': 'native-twin-vscode${separator}${dirty}${activeEditorShort}',
      },
      productConfiguration: {
        nameShort: 'native-twin-vscode',
        nameLong: 'native-twin-vscode',
      },
    },
  };
};
