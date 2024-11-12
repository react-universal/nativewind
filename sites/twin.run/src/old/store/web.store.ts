import { editorStore } from './editor.store';

export const LOCAL_STORAGE_KEYS = {
  ACTIVE_TAB_LOCAL_STORAGE_KEY: 'monaco-lsp-active-tab',
} as const;

export type LocalStorageKey = keyof typeof LOCAL_STORAGE_KEYS;

export const setStorageValue = (key: LocalStorageKey, value: string) => {
  if (key === 'ACTIVE_TAB_LOCAL_STORAGE_KEY') {
    editorStore.setState((x) => ({ ...x, activeTap: value }));
  }
  localStorage.setItem(key, value);
};

export const getStorageValue = (key: LocalStorageKey) => {
  return localStorage.getItem(key);
};
