import * as Effect from 'effect/Effect';
import { FileSystemService } from '@/editor/services/FileSystem.service';
import { TwinEditorService } from '@/editor/services/TwinEditor.service';

export const SetupWorkSpace = Effect.gen(function* () {
  const fs = yield* FileSystemService;
  const app = yield* TwinEditorService;

  // monaco.editor.onDidCreateModel((model) => {
  //   console.log('CREATED_MODEL: ', model);
  //   fs.fsProvider.registerFile(fs.createFileInMemory(model.uri, model.getValue()));
  // });

  yield* app.createMonacoFileModel(fs.files.tsconfig.uri, fs.files.tsconfig.contents);
  yield* app.createMonacoFileModel(fs.files.npmPackage.uri, fs.files.npmPackage.contents);
  yield* app.createMonacoFileModel(fs.files.css.uri, fs.files.css.contents);

  yield* app.createMonacoFileModel(fs.files.component.uri, fs.files.component.contents);
  yield* app.createMonacoFileModel(fs.files.twinConfig.uri, fs.files.twinConfig.contents);
});
// .pipe(Effect.onError((cause) => Effect.log(Cause.prettyErrors(cause))));
