import * as vscode from 'vscode';
import { useCallback, useState } from 'react';
import * as Effect from 'effect/Effect';
import { EditorMainRuntime } from '@/editor/editor.runtime';
import { TwinEditorConfigService } from '@/editor/services/EditorConfig.service';
import { MonacoContext } from '@/editor/services/MonacoContext.service';


export const useEditorBoot = (
  app: MonacoContext['Type'],
  config: TwinEditorConfigService['Type'],
) => {
  const [isReady, setIsReady] = useState(false);

  const initMonaco = useCallback(
    async () => Effect.runPromise(app.initEditor(config.monacoEditorConfig)),
    [app, config.monacoEditorConfig],
  );

  const startMonaco = useCallback(async () => {
    // app.wrapper.getMonacoEditorApp()?.updateHtmlContainer(editorRef.current);
    app.wrapper.getMonacoEditorApp()?.updateCodeResources({
      main: {
        text: app.workspace.projectFiles.jsx.contents,
        uri: app.workspace.projectFiles.jsx.uri.path,
      },
    });

    await Effect.gen(function* () {
      yield* app.startEditor();
      setIsReady(true);
    }).pipe(EditorMainRuntime.runPromise);
  }, [app]);

  const bootEditor = useCallback(async () => {
    if (app.wrapper.isStarted()) {
      console.log('ALREADY_STARTED');
      return;
    }
    await initMonaco();
    await vscode.workspace.openTextDocument(app.workspace.projectFiles.twinConfig.uri);
    await vscode.workspace.openTextDocument(app.workspace.rootFiles.inputCSS.uri);
    await vscode.workspace.openTextDocument(app.workspace.projectFiles.jsx.uri);
    await startMonaco();
  }, [
    app.workspace.projectFiles.jsx.uri,
    app.workspace.projectFiles.twinConfig.uri,
    app.workspace.rootFiles.inputCSS.uri,
    app.wrapper,
    initMonaco,
    startMonaco,
  ]);

  return {
    isReady,
    bootEditor,
  };
};
