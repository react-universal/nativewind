import { RenderPreview } from './RenderPreview';
import { useEditorApp } from './useEditorApp';

export const EditorApp = () => {
  const { editorRef, previewState } = useEditorApp();

  return (
    <div className='w-full h-full flex'>
      <div ref={editorRef} className='flex flex-1' />
      <RenderPreview {...previewState} />
    </div>
  );
};
