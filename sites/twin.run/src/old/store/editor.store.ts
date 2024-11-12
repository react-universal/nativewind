import { createStore } from '@native-twin/helpers';
import { useSyncExternalStore } from 'react';
import { createEditorService } from '@/editor/services/Editor.service';

export const startEditor = async () => {
  const editorService = createEditorService();

  await editorService.setup();

  editorService.registerLanguages();

  editorStore.setState((x) => ({
    ...x,
    isReady: true,
    editor: editorService,
  }));
};

export const editorStore = createStore({
  isReady: false,
  editor: null as null | ReturnType<typeof createEditorService>,
  activeTap: '',
});

export const useEditorStore = <T>(
  selector: (state: ReturnType<typeof editorStore.getState>) => T,
): T => {
  return useSyncExternalStore(
    editorStore.subscribe,
    () => selector(editorStore.getState()),
    () => selector(editorStore.getState()),
  );
};
