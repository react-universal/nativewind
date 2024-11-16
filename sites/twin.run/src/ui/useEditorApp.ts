import { useCallback, useEffect, useRef } from 'react';
import { TwinEditorConfigService } from '@/editor/services/EditorConfig.service';
import { FileSystemService } from '@/editor/services/FileSystem.service';
import { TwinEditorService } from '@/editor/services/TwinEditor.service';

export interface EditorAppParams {
  editor: TwinEditorService['Type'];
  config: TwinEditorConfigService['Type'];
  fs: FileSystemService['Type'];
}
export const useEditorApp = ({ editor, config }: EditorAppParams) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const initMonaco = useCallback(async () => {
    await editor.wrapper.init(config.monacoEditorConfig);
  }, [editor]);

  const destroyMonaco = useCallback(async () => {
    try {
      await editor.wrapper.dispose();
    } catch {
      // The language client may throw an error during disposal.
      // This should not prevent us from continue working.
    }
    // disposeOnTextChanged();
  }, []);

  const startMonaco = useCallback(async () => {
    if (editorRef.current) {
      try {
        editor.wrapper.getMonacoEditorApp()?.updateLayout();

        // editor.wrapper.registerModelUpdate((textModels: TextModels) => {
        //   if (textModels.text || textModels.textOriginal) {
        //     const newSubscriptions: monaco.IDisposable[] = [];

        //     if (textModels.text) {
        //       newSubscriptions.push(
        //         textModels.text.onDidChangeContent(() => {
        //           didModelContentChange(
        //             textModels,
        //             wrapperConfig.editorAppConfig.codeResources,
        //             onTextChanged,
        //           );
        //         }),
        //       );
        //     }

        //     if (textModels.textOriginal) {
        //       newSubscriptions.push(
        //         textModels.textOriginal.onDidChangeContent(() => {
        //           didModelContentChange(
        //             textModels,
        //             wrapperConfig.editorAppConfig.codeResources,
        //             onTextChanged,
        //           );
        //         }),
        //       );
        //     }
        //     setOnTextChangedSubscriptions(newSubscriptions);
        //     // do it initially
        //     didModelContentChange(
        //       textModels,
        //       wrapperConfig.editorAppConfig.codeResources,
        //       onTextChanged,
        //     );
        //   }
        // });

        await editor.wrapper.start(editorRef.current);
        // onLoad?.(editor.wrapper);
        // handleOnTextChanged();
        console.log('START_MONACO_SUCCESS');
      } catch (e) {
        console.log('START_MONACO_FAIL: ', e);
      }
    } else {
      throw new Error('No htmlContainer found');
    }
  }, []);

  useEffect(() => {
    const bootEditor = async () => {
      await initMonaco();
      await startMonaco();
    };
    if (editorRef.current) {
      bootEditor();
    }
  }, []);

  return { editorRef };
};
