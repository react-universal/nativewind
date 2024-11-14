// sort-imports-ignore
import 'vscode';
import 'vscode/localExtensionHost';
import 'vscode/services';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-npm-default-extension';
import '@codingame/monaco-vscode-standalone-languages';
import '@codingame/monaco-vscode-standalone-css-language-features';
import '@codingame/monaco-vscode-standalone-html-language-features';
import '@codingame/monaco-vscode-css-language-features-default-extension';
import '@codingame/monaco-vscode-json-default-extension';
import '@codingame/monaco-vscode-markdown-language-features-default-extension';
import '@codingame/monaco-vscode-standalone-typescript-language-features';
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-css-default-extension';
import '@codingame/monaco-vscode-markdown-basics-default-extension';
import '@codingame/monaco-vscode-html-language-features-default-extension';
import '@codingame/monaco-vscode-html-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';
import * as monaco from 'monaco-editor';
import * as Effect from 'effect/Effect';
import editorWorker from 'monaco-editor-wrapper/workers/module/editor?worker';
import jsonWorker from 'monaco-editor-wrapper/workers/module/json?worker';
import cssWorker from 'monaco-editor-wrapper/workers/module/css?worker';
import htmlWorker from 'monaco-editor-wrapper/workers/module/html?worker';
import tsWorker from 'monaco-editor-wrapper/workers/module/ts?worker';
import { NativeTwinManagerService } from '@native-twin/language-service';
import * as programs from './programs';
import { EditorMainRuntime } from './editor/editor.runtime';
import { TWIN_PACKAGES_TYPINGS } from './utils/constants.utils';
import { AppWorkersService } from './editor/services/AppWorkers.service';
import { runMain } from '@effect/platform-browser/BrowserRuntime';
let editorWorkerCache: Worker | null = null;

const program = Effect.gen(function* () {
  const workers = yield* AppWorkersService;
  const twin = yield* NativeTwinManagerService;

  twin.setupManualTwin();

  yield* programs.StartEditorProgram;
  yield* programs.StartHightLightsProvider;
  yield* programs.SetupWorkSpace;
  yield* programs.SetupEditorUI;

  yield* workers.installPackagesTypings(TWIN_PACKAGES_TYPINGS);

  yield* Effect.fromNullable(document.getElementById('first-loading-status')).pipe(
    Effect.map((x) => x.remove()),
    Effect.orElse(() => Effect.void),
  );
});

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
        return new cssWorker();
      case 'editorWorkerService':
        if (editorWorkerCache) {
          console.log('Replacing editor worker...', _, label);
          editorWorkerCache.terminate();
        } else {
          console.log('Creating editor worker...', _, label);
        }
        editorWorkerCache = new Worker(
          new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
          { type: 'module' },
        );
        return editorWorkerCache;
      default:
        console.warn('OTHER_WORKER_LOAD: ', _, label);
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
  jsx: monaco.languages.typescript.JsxEmit.Preserve,
  // typeRoots: ['node_modules/@types'],
  isolatedModules: true,
  allowJs: false,
  strict: false,
  skipLibCheck: true,
  allowSyntheticDefaultImports: true,
  disableSourceOfProjectReferenceRedirect: true,
  esModuleInterop: true,
  declarationMap: false,
  types: ['react'],
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

runMain(EditorMainRuntime.runFork(program));
