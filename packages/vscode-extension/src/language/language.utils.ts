import * as Effect from 'effect/Effect';
import * as vscode from 'vscode';
import { thenable } from '../extension/extension.utils';

export const createFileWatchers = Effect.gen(function* () {
  return yield* Effect.acquireRelease(
    Effect.sync(() =>
      vscode.workspace.createFileSystemWatcher(
        '**/tailwind.config.*',
        false,
        false,
      ),
    ),
    (watcher) =>
      Effect.sync(() => {
        console.log('WATCH_FILES_DISPOSED');
        return watcher.dispose();
      }),
  );
});

export const getConfigFiles = Effect.gen(function* () {
  const files = yield* thenable(() =>
    vscode.workspace.findFiles(
      '**/tailwind.config.{ts,js,mjs,cjs}',
      '**/node_modules/**',
      1,
    ),
  );
  if (files.length === 0) {
    yield* Effect.logWarning('Cant find a native-twin configuration file');
  }

  return files;
});

export const getColorDecoration = Effect.sync(() =>
  vscode.window.createTextEditorDecorationType({
    before: {
      width: '0.8em',
      height: '0.8em',
      contentText: ' ',
      border: '0.1em solid',
      margin: '0.1em 0.2em 0',
    },
    dark: {
      before: {
        borderColor: '#eeeeee',
      },
    },
    light: {
      before: {
        borderColor: '#000000',
      },
    },
  }),
);
