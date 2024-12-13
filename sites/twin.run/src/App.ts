import 'vscode';
import { install as setupLocalTwin } from '@native-twin/core';
import { NativeTwinManagerService } from '@native-twin/language-service/browser';
import * as Effect from 'effect/Effect';
import tailwindConfig from '../tailwind.config';
import { EditorMainRuntime } from './editor/editor.runtime';
import { StartEditorUIProgram, StartHightLightsProvider } from './programs';
import { setTypescriptDefaults } from './utils/editor.utils';

const program = Effect.gen(function* () {
  const twin = yield* NativeTwinManagerService;
  twin.setupManualTwin();

  yield* StartHightLightsProvider;
  yield* StartEditorUIProgram;
  setupLocalTwin(tailwindConfig, false);

  setTypescriptDefaults();
});

export const runApp = () => {
  return program.pipe(Effect.catchAll(Effect.logFatal), EditorMainRuntime.runFork);
};
