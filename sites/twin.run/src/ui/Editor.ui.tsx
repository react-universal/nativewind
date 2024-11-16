import { EditorAppParams, useEditorApp } from './useEditorApp';

export const EditorApp = (props: EditorAppParams) => {
  const { editorRef } = useEditorApp(props);

  return <div ref={editorRef} className='w-full h-full' />;
};
