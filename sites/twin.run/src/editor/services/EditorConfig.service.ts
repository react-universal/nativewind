import getLanguagesServiceOverride from '@codingame/monaco-vscode-languages-service-override';
import getThemeServiceOverride from '@codingame/monaco-vscode-theme-service-override';
import userConfig from '@/editor/config/user/configuration.json?raw';
import twinConfigRaw from '@/editor/content/tailwind.config?raw';
import workerUrl from '@/editor/workers/twin.worker?worker&url';
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
import { UserConfig, WrapperConfig, LanguageClientConfig } from 'monaco-editor-wrapper';
import { Constants } from '@native-twin/language-service/browser';

export class TwinEditorConfigService extends Context.Tag('editor/config/service')<
  TwinEditorConfigService,
  {
    config: UserConfig;
    vscodeConfig: string;
  }
>() {
  static Live = Layer.scoped(
    TwinEditorConfigService,
    Effect.gen(function* () {
      const monacoEditorConfig: monaco.editor.IStandaloneEditorConstructionOptions = {
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
      const wrapperConfig: WrapperConfig = {
        serviceConfig: {
          userServices: {
            ...getThemeServiceOverride(),
            // ...getConfigurationServiceOverride(),
            // ...getEditorServiceOverride(useOpenEditorStub),
            ...getLanguagesServiceOverride(),
          },
          enableExtHostWorker: true,
          debugLogging: true,
        },
        editorAppConfig: {
          $type: 'extended',
          editorOptions: monacoEditorConfig,
          codeResources: {
            main: {
              text: twinConfigRaw,
              uri: '/tailwind.config.ts',
              fileExt: 'ts',
            },
          },
          useDiffEditor: false,
          overrideAutomaticLayout: false,
          userConfiguration: {
            json: userConfig,
          },
        },
      };

      const colorDecorations = yield* Effect.cachedFunction((_: number) =>
        Effect.sync(() => getColorDecoration()),
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

      const monacoEditorUserConfig: UserConfig = {
        wrapperConfig: wrapperConfig,
        languageClientConfig: languageClientConfig,
        loggerConfig: {
          enabled: true,
          debugEnabled: false,
        },
      };

      return {
        config: monacoEditorUserConfig,
        vscodeConfig: userConfig,
      };
    }),
  );
}
