import * as vscode from 'vscode';
import { useEffect, useRef, useState } from 'react';
// import { attachPart, Parts } from '@codingame/monaco-vscode-views-service-override';
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
        app.getDocumentPreview(initialDoc).then((data) => {
          setPreviewState({
            code: data.code,
            css: data.css,
          });
        });
      }
    }
  }, [app, isReady]);

  useEffect(() => {
    if (isReady) {
      addSubscription(
        vscode.workspace.onDidChangeTextDocument(async (doc) => {
          app.getDocumentPreview(doc.document).then((data) => {
            setPreviewState({
              code: data.code,
              css: data.css,
            });
          });
        }),
      );
    }
  }, [addSubscription, app, isReady]);

  useEffect(() => {
    if (editorRef.current) {
      bootEditor(editorRef.current);
      // app.wrapper.getMonacoEditorApp()?.updateHtmlContainer(editorRef.current);
    }
  }, [bootEditor]);

  return { editorRef, previewState, isReady };
};
