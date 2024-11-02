import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import path from 'node:path';
import * as vscode from 'vscode';
import { ConfigManagerService, Constants } from '@native-twin/language-service';
import {
  VscodeFileSystem,
  VscodeFileSystemProviderManager,
} from '../file-system/FileSystem.service';
import { extensionConfigState, registerCommand } from './extension.utils';

const make = Effect.gen(function* () {
  const context = yield* VscodeContext;
  const configHandler = yield* ConfigManagerService;

  const fsProvider = yield* VscodeFileSystem;
  const cssFolderPath = fsProvider.pathToUri('css');

  const cssFilePath = cssFolderPath.with({
    path: path.posix.join(cssFolderPath.path, 'file.css'),
  });

  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(
      VscodeFileSystemProviderManager.meta.scheme,
      fsProvider,
      {
        isCaseSensitive: true,
      },
    ),
  );

  yield* registerCommand('nativeTwin.workspaceInit', (_) =>
    Effect.gen(function* () {
      fsProvider.createDirectory(
        vscode.Uri.parse(`${VscodeFileSystemProviderManager.meta.scheme}:/`, true),
      );
      fsProvider.createDirectory(
        vscode.Uri.parse(`${VscodeFileSystemProviderManager.meta.scheme}:/css`, true),
      );
      fsProvider.writeFile(
        vscode.Uri.parse(
          `${VscodeFileSystemProviderManager.meta.scheme}:/css/css.css`,
          true,
        ),
        new Buffer('Hola mundo'),
        { overwrite: true, create: true },
      );
      const updatedSpace = vscode.workspace.updateWorkspaceFolders(0, 0, {
        uri: vscode.Uri.parse(`${VscodeFileSystemProviderManager.meta.scheme}:/`, true),
        name: 'Native Twin - Workspace',
      });
      console.log('FOLDERS: ', vscode.workspace.workspaceFolders);
      yield* Effect.log('Updated workspace: ', updatedSpace);
    }),
  );

  yield* registerCommand('nativeTwin.init', (_) =>
    Effect.gen(function* () {
      yield* Effect.log('INIT: ', _);
      fsProvider.createDirectory(cssFolderPath);
      const cssFolder = fsProvider.readDirectory(cssFolderPath);
      fsProvider.writeFile(cssFilePath, Buffer.from('Hello'), {
        create: true,
        overwrite: true,
      });
      yield* Effect.log('READ_FOLDER_: ', cssFolder);
      yield* Effect.log('Created_File: ', cssFilePath.toString());

      yield* Effect.log('READ_FOLDER_: ', cssFolder);
    }),
  );

  yield* registerCommand('nativeTwin.reset', (_) =>
    Effect.gen(function* () {
      for (const [name] of fsProvider.readDirectory(fsProvider.root.uri)) {
        fsProvider.delete(fsProvider.root.uri.with({ path: name }), { recursive: true });
      }
    }),
  );
  yield* registerCommand('nativeTwin.addFile', (_) =>
    Effect.gen(function* () {
      const fileTxtUri = fsProvider.root.uri.with({ path: 'file.txt' });
      fsProvider.writeFile(fileTxtUri, Buffer.from('foo'), {
        create: true,
        overwrite: true,
      });
      yield* Effect.log('Created file', fileTxtUri.toString());
    }),
  );

  yield* registerCommand('nativeTwin.deleteFile', (_) =>
    Effect.gen(function* () {
      fsProvider.delete(fsProvider.root.uri.with({ path: 'file.txt' }), {
        recursive: false,
      });
      yield* Effect.log(
        'DeletedFile: ',
        fsProvider.root.uri.with({ path: 'file.txt' }).toString(),
      );
    }),
  );

  yield* pipe(
    extensionConfigState(Constants.DEFAULT_PLUGIN_CONFIG),
    Effect.flatMap((x) =>
      Stream.runForEach(x.changes, (config) =>
        Effect.sync(() =>
          configHandler.onUpdateConfig({
            ...configHandler,
            config,
          }),
        ).pipe(Effect.andThen(Effect.log('Config changed, reloading resources...'))),
      ),
    ),
  );

  return {};
});

export class ExtensionService extends Context.Tag('vscode/ExtensionService')<
  ExtensionService,
  {}
>() {
  static Live = Layer.scoped(ExtensionService, make);
}

export class VscodeContext extends Context.Tag('vscode/ExtensionCtx')<
  VscodeContext,
  vscode.ExtensionContext
>() {}
