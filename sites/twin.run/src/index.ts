// sort-imports-ignore
import 'vscode';
import 'vscode/localExtensionHost';
// import 'vscode/services';
import '@codingame/monaco-vscode-theme-defaults-default-extension';
import '@codingame/monaco-vscode-npm-default-extension';
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
import editorWorker from 'monaco-editor-wrapper/workers/module/editor?worker';
import jsonWorker from 'monaco-editor-wrapper/workers/module/json?worker';
import cssWorker from 'monaco-editor-wrapper/workers/module/css?worker';
import htmlWorker from 'monaco-editor-wrapper/workers/module/html?worker';
import tsWorker from 'monaco-editor-wrapper/workers/module/ts?worker';

export const setup = () => {
  let editorWorkerCache: Worker | null = null;
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
          editorWorkerCache = new editorWorker();
          // new Worker(
          //   new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
          //   { type: 'module' },
          // );
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
};
