import { createStore } from '@native-twin/helpers';
import { useSyncExternalStore } from 'react';
import { createEditorService } from '../services/Editor.service';

export const startEditor = async () => {
  const editorService = createEditorService();

  await editorService.setup();

  editorService.registerLanguages();

  editorStore.setState((x) => ({
    ...x,
    isReady: true,
  }));
};

export const editorStore = createStore({
  isReady: false,
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
