// import editorUserConfigJSON from '@/fixtures/editor-config/configuration.json?raw';
// import nativeTwinCustomTheme from '@/fixtures/tailwind-configs/custom-theme.config?raw';
// import nativeTwinEmpty from '@/fixtures/tailwind-configs/empty.config?raw';
// import nativeTwinPresetTw from '@/fixtures/tailwind-configs/tailwind-preset.config?raw';
import { createEditorFileModel, pathToMonacoURI } from '@/utils/editor.utils';
import { TwinTyping } from '@/utils/twin.schemas';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as monaco from 'monaco-editor';
import { TypescriptRegisteredTyping } from '../models/FileManager';

const make = Effect.gen(function* () {
  return {
    registerTypescriptTyping,
  };
});

export class FileSystemService extends Context.Tag('editor/files/FileSystemService')<
  FileSystemService,
  Effect.Effect.Success<typeof make>
>() {
  static Live = Layer.scoped(FileSystemService, make);
}

const registerTypescriptTyping = (typing: TwinTyping) =>
  Effect.sync<TypescriptRegisteredTyping>(() => ({
    disposable: monaco.languages.typescript.typescriptDefaults.addExtraLib(
      typing.contents,
      typing.filePath,
    ),
    model: createEditorFileModel(pathToMonacoURI(typing.filePath), typing.contents),
  }));
