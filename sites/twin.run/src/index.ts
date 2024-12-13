// sort-imports-ignore
import 'vscode';
import 'vscode/services';
import 'vscode/localExtensionHost';
// import 'vscode/services';
// MARK: VSCode
import '@codingame/monaco-vscode-theme-defaults-default-extension';

// MARK: NPM
import '@codingame/monaco-vscode-npm-default-extension';

// MARK: Markdown
import '@codingame/monaco-vscode-json-default-extension';

// MARK: CSS
import '@codingame/monaco-vscode-standalone-css-language-features';
import '@codingame/monaco-vscode-css-language-features-default-extension';
import '@codingame/monaco-vscode-css-default-extension';

// MARK: Markdown
import '@codingame/monaco-vscode-markdown-language-features-default-extension';
import '@codingame/monaco-vscode-markdown-basics-default-extension';

// MARK: HTML
import '@codingame/monaco-vscode-standalone-html-language-features';
import '@codingame/monaco-vscode-html-language-features-default-extension';
import '@codingame/monaco-vscode-html-default-extension';

// MARK: Typescript
import '@codingame/monaco-vscode-standalone-typescript-language-features';
import '@codingame/monaco-vscode-typescript-basics-default-extension';
import '@codingame/monaco-vscode-typescript-language-features-default-extension';

import textMateWorker from '@codingame/monaco-vscode-textmate-service-override/worker?worker';
import * as monaco from 'monaco-editor';
import cssWorker from 'monaco-editor-wrapper/workers/module/css?worker';
import htmlWorker from 'monaco-editor-wrapper/workers/module/html?worker';
import jsonWorker from 'monaco-editor-wrapper/workers/module/json?worker';
import tsWorker from 'monaco-editor-wrapper/workers/module/ts?worker';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

export const setup = () => {
  let editorWorkerCache: Worker | null = null;
  self.MonacoEnvironment = {
    getWorker: (_, label) => {
      switch (label) {
        case 'json':
          return new jsonWorker();
        case 'typescript':
        case 'javascript':
          return new tsWorker();
        case 'html':
          return new htmlWorker();
        case 'css':
          return new cssWorker();
        case 'TextMateWorker':
          return new textMateWorker();
        case 'editorWorkerService':
        case 'TextEditorWorker':
          if (editorWorkerCache) {
            console.warn('Replacing editor worker...', _, label);
            editorWorkerCache.terminate();
          } else {
            console.log('Creating editor worker...', _, label);
          }
          editorWorkerCache = new editorWorker();
          return editorWorkerCache;
        default:
          console.warn('OTHER_WORKER_LOAD: ', _, label);
          return new editorWorker();
      }
    },
  };

  monaco.languages.typescript.typescriptDefaults.setEagerModelSync(false);
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
    module: monaco.languages.typescript.ModuleKind.ESNext,
    target: monaco.languages.typescript.ScriptTarget.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    lib: ['ESNext', 'DOM'],
    jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
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
    onlyVisible: true,
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
