// sort-imports-ignore
import * as vscode from 'vscode';
import 'vscode/localExtensionHost';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-npm-default-extension';
import '@codingame/monaco-vscode-standalone-languages';
import '@codingame/monaco-vscode-standalone-css-language-features';
import '@codingame/monaco-vscode-standalone-html-language-features';
import '@codingame/monaco-vscode-css-language-features-default-extension';
import '@codingame/monaco-vscode-markdown-language-features-default-extension';
import '@codingame/monaco-vscode-standalone-typescript-language-features';
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';
import * as monaco from 'monaco-editor';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TwinEditorService } from './editor/services/TwinEditorEditor.service';
import { LanguageClientService } from './editor/services/Language.Service';
import editorWorker from 'monaco-editor-wrapper/workers/module/editor?worker';
import jsonWorker from 'monaco-editor-wrapper/workers/module/json?worker';
import cssWorker from 'monaco-editor-wrapper/workers/module/css?worker';
import htmlWorker from 'monaco-editor-wrapper/workers/module/html?worker';
import tsWorker from 'monaco-editor-wrapper/workers/module/ts?worker';
import { FileSystemService } from './editor/services/FileSystem.service';
import { asArray } from '@native-twin/helpers';
import { TwinEditorConfigService } from './editor/services/EditorConfig.service';
import { VscodeHightLightsProvider } from './editor/services/DocumentHighLights.service';
import {
  Constants,
  NativeTwinManagerService,
  DocumentLanguageRegion,
  getSheetEntryStyles,
  completionRuleToQuickInfo,
} from '@native-twin/language-service';
import { TwinTextDocument } from './editor/models/TwinTextDocument.model';
import * as Option from 'effect/Option';
import { sheetEntriesToCss } from '@native-twin/css';
import { isRecord } from 'effect/Predicate';
import { TWIN_PACKAGES_TYPINGS } from './utils/constants.utils';
import { AppWorkersService } from './editor/services/AppWorkers.service';

let editorWorkerCache: Worker | null = null;

const MainLive = TwinEditorService.Live.pipe(
  Layer.provideMerge(LanguageClientService.Live),
  Layer.provideMerge(AppWorkersService.Live),
  Layer.provideMerge(FileSystemService.Live),
  Layer.provideMerge(TwinEditorConfigService.Live),
  Layer.provideMerge(VscodeHightLightsProvider.Live),
  Layer.provideMerge(NativeTwinManagerService.Live),
);

const program = Effect.gen(function* () {
  const { makeEditor, getMonacoApp } = yield* TwinEditorService;
  // const { getPackageTypings } = yield* LanguageClientService;
  const workers = yield* AppWorkersService;
  const twin = yield* NativeTwinManagerService;
  twin.setupManualTwin();

  yield* makeEditor;
  yield* workers.installPackagesTypings(TWIN_PACKAGES_TYPINGS);

  yield* getMonacoApp().pipe(
    Effect.flatMap((x) => Effect.promise(() => x.awaitReadiness())),
    Effect.map((x) => asArray(x)),
    Effect.orElse(() => Effect.succeed([] as void[])),
  );

  const { provideDocumentHighlights } = yield* VscodeHightLightsProvider;
  Constants.DOCUMENT_SELECTORS.map((x) =>
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

  vscode.languages.registerHoverProvider(Constants.DOCUMENT_SELECTORS, {
    provideHover: async (document, position) => {
      const twinDocument = new TwinTextDocument(document);
      const tokenAtPosition = twinDocument.findTokenLocationAt(
        position,
        Constants.DEFAULT_PLUGIN_CONFIG,
      );

      const cursorOffset = document.offsetAt(position);

      console.log('AT_POS: ', tokenAtPosition);

      const hoverInfo = Option.map(
        tokenAtPosition,
        (x) => new DocumentLanguageRegion(x.range, x.offset.start, x.offset.end, x.text),
      ).pipe(
        Option.flatMap((nodeAdPosition) =>
          nodeAdPosition.getParsedNodeAtOffset(cursorOffset),
        ),
        Option.flatMap((flattenCompletions) => {
          return RA.findFirst(
            flattenCompletions.flattenToken,
            (x) =>
              cursorOffset >= x.token.bodyLoc.start &&
              cursorOffset <= x.token.bodyLoc.end,
          ).pipe(
            Option.map((x): { range: vscode.Range; text: string } => ({
              range: new vscode.Range(
                document.positionAt(x.token.bodyLoc.start),
                document.positionAt(x.token.bodyLoc.end),
              ),
              text: x.token.text,
            })),
            Option.match({
              onSome(a) {
                return Option.some(a);
              },
              onNone() {
                const token = flattenCompletions.token;
                if (
                  token.type === 'GROUP' &&
                  cursorOffset >= token.value.base.bodyLoc.start &&
                  cursorOffset <= token.value.base.bodyLoc.end
                ) {
                  return Option.some({
                    range: new vscode.Range(
                      document.positionAt(flattenCompletions.bodyLoc.start),
                      document.positionAt(flattenCompletions.bodyLoc.end),
                    ),
                    text: flattenCompletions.text,
                  });
                }
                return Option.none();
              },
            }),
          );
        }),
        Option.map((tokenAtPosition) => {
          const cx = twin.cx`${tokenAtPosition.text}`;
          const entries = twin.tw(`${cx}`);
          const sheet = {
            rn: getSheetEntryStyles(entries, twin.getCompilerContext()),
            css: sheetEntriesToCss(entries),
          };
          return completionRuleToQuickInfo(sheet.rn, sheet.css, tokenAtPosition.range);
        }),
        Option.getOrUndefined,
      );

      if (!hoverInfo) return undefined;

      let contents: vscode.MarkdownString | undefined = undefined;
      if (isRecord(hoverInfo.contents)) {
        contents = new vscode.MarkdownString('#Docs');
        contents.isTrusted = true;
        contents.supportHtml = true;
        contents.appendCodeblock(
          '.asd { color: blue }',
          monaco.languages.css.cssDefaults.languageId,
        );

        // contents.baseUri = vscode.Uri.file('/hover.css');
      } else {
        contents = new vscode.MarkdownString('asdasd');
      }
      const languages = await vscode.languages.getLanguages();
      console.log('LANGS: ', languages);
      console.log('CONTENTS: ', contents);
      const start = new vscode.Position(
        hoverInfo.range?.start.line ?? 0,
        hoverInfo.range?.start.character ?? 0,
      );
      const end = new vscode.Position(
        hoverInfo.range?.end.line ?? 0,
        hoverInfo.range?.end.character ?? 0,
      );
      const hover: vscode.Hover = {
        contents: [contents],
        range: new vscode.Range(start, end),
      };

      console.log('HOVER: ', hover);
      return Promise.resolve(hover);
    },
  });

  yield* Effect.fromNullable(document.getElementById('first-loading-status')).pipe(
    Effect.map((x) => x.remove()),
    Effect.orElse(() => Effect.void),
  );
});

const runnable = Effect.provide(program, MainLive);

export const main = () => {
  return Effect.runFork(runnable);
};

self.MonacoEnvironment = {
  getWorker: function (_, label) {
    switch (label) {
      case 'json':
        return new jsonWorker();
      case 'typescript':
        return new tsWorker();
      case 'html':
        return new htmlWorker();
      case 'css':
        console.log('REQUESTED_CSS_LANG: ');
        return new cssWorker();
      case 'editorWorkerService':
        if (!editorWorkerCache) {
          editorWorkerCache = new Worker(
            new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
            { type: 'module' },
          );
        } else {
          console.debug('attempt to recreate the editor worker');
        }
        return editorWorkerCache;
      default:
        return new editorWorker();
    }
  },
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);
monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
  module: monaco.languages.typescript.ModuleKind.ESNext,
  target: monaco.languages.typescript.ScriptTarget.ESNext,
  moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  lib: ['ESNext', 'DOM'],
  isolatedModules: true,
  allowJs: true,
  strict: false,
  skipLibCheck: true,
  allowSyntheticDefaultImports: true,
  disableSourceOfProjectReferenceRedirect: true,
  esModuleInterop: true,
  declarationMap: false,
  skipDefaultLibCheck: true,
});

monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSuggestionDiagnostics: true,
  // noSemanticValidation: true,
});
monaco.languages.css.cssDefaults.setModeConfiguration({
  hovers: true,
  colors: true,
  completionItems: true,
  documentHighlights: true,
});
monaco.languages.html.razorLanguageService.defaults.setModeConfiguration({
  hovers: true,
  completionItems: true,
  colors: true,
  documentHighlights: true,
});
