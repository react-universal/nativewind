// import getEditorOverride from '@codingame/monaco-vscode-editor-service-override';
import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
// import getLayoutOverride from '@codingame/monaco-vscode-layout-service-override';
// import getMonarchOverride from '@codingame/monaco-vscode-monarch-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
// import getExplorerOverride from '@codingame/monaco-vscode-explorer-service-override';
import getHostOverride from '@codingame/monaco-vscode-host-service-override';
// import getViewsOverride from '@codingame/monaco-vscode-views-service-override';
// import getExtOverride from '@codingame/monaco-vscode-extensions-service-override';
// import getBaseOverride from '@codingame/monaco-vscode-base-service-override';
import workerUrl from '@/editor/workers/twin.worker?worker&url';
import editorUserConfigJSON from '@/fixtures/editor-config/configuration.json?raw';
import tailwindConfig from '@/fixtures/tailwind-configs/tailwind-preset.config?raw';
import {
  getColorDecoration,
  onLanguageClientClosed,
  onLanguageClientError,
  onProvideDocumentColors,
} from '@/utils/languageClient.utils';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as monaco from 'monaco-editor';
import {
  UserConfig,
  WrapperConfig,
  LanguageClientConfig,
  CodeResources,
} from 'monaco-editor-wrapper';
import { Constants } from '@native-twin/language-service/browser';

const make = Effect.gen(function* () {
  const colorDecorations = yield* Effect.cachedFunction((_: number) =>
    Effect.sync(() => getColorDecoration()),
  );

  const initialFile: CodeResources['main'] = {
    text: tailwindConfig,
    uri: '/tailwind.config.ts',
    fileExt: 'ts',
  };
  const defaults = getMonacoDefaultConfig();
  const wrapperConfig = createWrapperConfig(
    defaults.defaultMonacoEditorConfig,
    initialFile,
    editorUserConfigJSON,
  );

  const languageClientConfig: LanguageClientConfig = {
    languageId: 'native.twin',
    options: {
      $type: 'WorkerDirect',
      worker: new Worker(workerUrl, {
        type: 'module',
        name: 'twin.worker',
      }),
    },
    name: 'Native Twin LSP',
    clientOptions: {
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

  const monacoEditorConfig: UserConfig = {
    wrapperConfig: wrapperConfig,
    languageClientConfig: languageClientConfig,
    loggerConfig: {
      enabled: true,
    },
  };

  return {
    config: monacoEditorConfig,
    vscodeConfig: editorUserConfigJSON,
  };
});

export class TwinEditorConfigService extends Context.Tag('editor/config/service')<
  TwinEditorConfigService,
  {
    config: UserConfig;
    vscodeConfig: string;
  }
>() {
  static Live = Layer.scoped(TwinEditorConfigService, make);
}

const getMonacoDefaultConfig = () => {
  const defaultMonacoEditorConfig: monaco.editor.IStandaloneEditorConstructionOptions = {
    glyphMargin: false,
    guides: {
      bracketPairs: true,
    },
    automaticLayout: false,
    minimap: { enabled: false },
    disableMonospaceOptimizations: false,
    fontFamily: 'Fira Code',
    fontWeight: '450',
    fontLigatures: false,
    colorDecorators: true,
    defaultColorDecorators: true,
  };

  return {
    defaultMonacoEditorConfig,
  };
};

const createWrapperConfig = (
  editorOptions: monaco.editor.IStandaloneEditorConstructionOptions,
  initialFile: CodeResources['main'],
  /** @description must be a JSON string */
  editorUserConfig: string,
): WrapperConfig => {
  return {
    serviceConfig: {
      userServices: {
        ...getThemeServiceOverride(),
        // ...getConfigurationServiceOverride(),
        // ...getEditorOverride(useOpenEditorStub),
        // ...getLayoutOverride(),
        // ...getViewsOverride(useOpenEditorStub),
        // ...getBaseOverride(),
        ...getHostOverride(),
        // ...getMonarchOverride(),
        // ...getExplorerOverride(),
        // ...getViewOverride(),
        // ...getExtOverride(),
        ...getLanguagesServiceOverride(),
      },
      enableExtHostWorker: true,
      debugLogging: true,
    },
    editorAppConfig: {
      $type: 'extended',
      editorOptions,
      codeResources: {
        main: initialFile,
      },
      useDiffEditor: false,
      overrideAutomaticLayout: false,
      userConfiguration: {
        json: editorUserConfig,
      },
    },
  };
};
