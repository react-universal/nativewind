// sort-imports-ignore
import * as vscode from 'vscode';
// import getEditorOverride from '@codingame/monaco-vscode-editor-service-override';
// import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
// import getTextmateServiceOverride from '@codingame/monaco-vscode-textmate-service-override';
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import getSecretStorageServiceOverride from '@codingame/monaco-vscode-secret-storage-service-override';
// import getExplorerServiceOverride from '@codingame/monaco-vscode-explorer-service-override';
// import getLifecycleServiceOverride from '@codingame/monaco-vscode-lifecycle-service-override';
// import getStatusBarServiceOverride from '@codingame/monaco-vscode-view-status-bar-service-override';
// import getTitleBarServiceOverride from '@codingame/monaco-vscode-view-title-bar-service-override';
// import getLocalizationServiceOverride from '@codingame/monaco-vscode-localization-service-override';
// import getRemoteAgentServiceOverride from '@codingame/monaco-vscode-remote-agent-service-override';
// import getEnvironmentServiceOverride from '@codingame/monaco-vscode-environment-service-override';
// import { createDefaultLocaleConfiguration } from 'monaco-languageclient/vscode/services';
import { VscodeApiConfig } from 'monaco-languageclient/vscode/services';
// import { defaultViewsInit } from 'monaco-editor-wrapper/vscode/services';
// import { useOpenEditorStub } from 'monaco-editor-wrapper/vscode/services';
import { WrapperConfig, LanguageClientConfig } from 'monaco-editor-wrapper';
import {
  getColorDecoration,
  onLanguageClientClosed,
  onLanguageClientError,
  onProvideDocumentColors,
} from '@/utils/languageClient.utils';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { Constants } from '@native-twin/language-service/browser';
import { traceLayerLogs } from '@/utils/logger.utils';
import { LogLevel } from 'vscode/services';

import workerUrl from '@/editor/workers/twin.worker?worker&url';
import editorUserConfigJSON from '@/fixtures/editor-config/configuration.json?raw';
import { MonacoContext } from './MonacoContext.service';

const make = Effect.gen(function* () {
  const context = yield* MonacoContext;

  const colorDecorations = yield* Effect.cachedFunction((_: number) =>
    Effect.sync(() => getColorDecoration()),
  );

  const vscodeApiConfig = getVscodeApiConfig(
    context.workspace.rootFiles.workspaceFile.uri,
    editorUserConfigJSON,
  );
  const getEditorExtendedConfig = context.workspace.getExtendedAppConfig();

  const languageClientConfig: LanguageClientConfig = {
    name: 'Native Twin LSP',
    connection: {
      options: {
        $type: 'WorkerDirect',
        worker: new Worker(workerUrl, {
          type: 'module',
          name: 'twin.worker',
        }),
      },
    },
    clientOptions: {
      workspaceFolder: {
        index: 0,
        name: 'workspace',
        uri: vscode.Uri.file(context.workspace.workspacePath),
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
    editorAppConfig: getEditorExtendedConfig,
    languageClientConfigs: {
      twin: languageClientConfig,
    },
    vscodeApiConfig,
    logLevel: LogLevel.Info,
  };

  return {
    monacoEditorConfig,
    vscodeConfig: editorUserConfigJSON,
  };
});

export class TwinEditorConfigService extends Context.Tag('editor/config/service')<
  TwinEditorConfigService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(TwinEditorConfigService, make).pipe(
    traceLayerLogs('TwinEditorConfigService'),
  );
}

const getVscodeApiConfig = (
  workspaceFile: vscode.Uri,
  /** @description must be a JSON string */
  editorUserConfig: string,
): VscodeApiConfig => {
  return {
    userServices: {
      ...getConfigurationServiceOverride(),
      ...getThemeServiceOverride(),
      ...getSecretStorageServiceOverride(),
      // ...getLifecycleServiceOverride(),
      // ...getExplorerServiceOverride(),
      // ...getStatusBarServiceOverride(),
      // ...getRemoteAgentServiceOverride(),
      // ...getEnvironmentServiceOverride(),
      // ...getTitleBarServiceOverride(),
      // ...getLocalizationServiceOverride(createDefaultLocaleConfiguration()),
      // ...getEditorOverride(useOpenEditorStub),
      // ...getLanguagesServiceOverride(),
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
