import * as vscode from 'vscode';
import * as Effect from 'effect/Effect';
import { useCallback } from 'react';
import type { TwinEditorConfigService } from '../editor/services/EditorConfig.service';
import type { MonacoContext } from '../editor/services/MonacoContext.service';

export const useEditorBoot = (
  app: MonacoContext['Type'],
  config: TwinEditorConfigService['Type'],
) => {

  const initMonaco = useCallback(
    async () => Effect.runPromise(app.initEditor(config.monacoEditorConfig)),
    [app, config.monacoEditorConfig],
  );

  const startMonaco = useCallback(async () => {
    // await app.wrapper.startLanguageClients();
    // app.wrapper.getMonacoEditorApp()?.updateHtmlContainer(editorRef.current);
    // console.log('asdasd',app.wrapper.getMonacoEditorApp())
    app.wrapper.getMonacoEditorApp()?.updateCodeResources({
      original: {
        text: app.workspace.projectFiles.jsx.contents,
        uri: app.workspace.projectFiles.jsx.uri.path,
      },
    });

  }, [app]);

  const bootEditor = useCallback(async () => {
    if (app.wrapper.isStarted()) {
      console.log('ALREADY_STARTED');
      // await app.wrapper.dispose();
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
    bootEditor,
  };
};
