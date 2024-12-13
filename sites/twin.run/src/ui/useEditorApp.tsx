import { useEffect, useRef, useState } from 'react';
// import { attachPart, Parts } from '@codingame/monaco-vscode-views-service-override';
import * as vscode from 'vscode';
import { useTwinEditor } from './Editor.context';

export const useEditorApp = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const { app, addSubscription, isReady, bootEditor } = useTwinEditor();
  const [previewState, setPreviewState] = useState({
    code: '',
    css: '',
  });

  useEffect(() => {
    if (isReady) {
      const initialDoc = vscode.workspace.textDocuments.find(
        (x) => x.uri.path === app.workspace.projectFiles.jsx.uri.path,
      );

      if (initialDoc) {
        const data = app.getDocumentPreview(initialDoc);
        setPreviewState({
          code: data.code,
          css: data.css,
        });
      }
    }
  }, [app, isReady]);

  useEffect(() => {
    if (isReady) {
      addSubscription(
        vscode.workspace.onDidChangeTextDocument(async (doc) => {
          const data = app.getDocumentPreview(doc.document);
          setPreviewState({
            code: data.code,
            css: data.css,
          });
        }),
      );
    }
  }, [addSubscription, app, isReady]);

  useEffect(() => {
    if (editorRef.current) {
      bootEditor();
      app.wrapper.getMonacoEditorApp()?.updateHtmlContainer(editorRef.current);
    }
  }, [app.wrapper, bootEditor]);

  return { editorRef, previewState, isReady };
};
