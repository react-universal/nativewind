import * as Effect from 'effect/Effect';
import { TwinEditorConfigService } from '../services/EditorConfig.service';
import { TwinEditorService } from '../services/TwinEditorEditor.service';
import { registerEditorLanguages } from '../utils/registerLanguages';

export const StartEditorProgram = Effect.gen(function* () {
  const domElement = document.getElementById('monaco-editor-root')!;
  const config = yield* TwinEditorConfigService;
  const editor = yield* TwinEditorService;

  yield* Effect.promise(() => editor.wrapper.init(config.monacoEditorConfig));

  // yield* Effect.promise(() => vscode.workspace.openTextDocument(files.component.uri));
  // yield* Effect.promise(() => vscode.workspace.openTextDocument(files.css.uri));
  // yield* Effect.promise(() => vscode.workspace.openTextDocument(files.twinConfig.uri));

  yield* Effect.promise(() => editor.wrapper.start(domElement)).pipe(
    Effect.andThen(Effect.log('Native Twin language wrapper started')),
  );

  yield* Effect.sync(() => registerEditorLanguages()).pipe(
    Effect.andThen(Effect.logDebug(Effect.log('Registered vscode languages'))),
  );
});
