import { runMain } from '@effect/platform-browser/BrowserRuntime';
import * as Effect from 'effect/Effect';
import { install as setupTwin } from '@native-twin/core';
import { NativeTwinManagerService } from '@native-twin/language-service/browser';
import tailwindConfig from '../tailwind.config';
import { EditorMainRuntime } from './editor/editor.runtime';
import { AppWorkersService } from './editor/services/AppWorkers.service';
import * as programs from './programs';
import { TWIN_PACKAGES_TYPINGS } from './utils/constants.utils';

const program = Effect.gen(function* () {
  const workers = yield* AppWorkersService;
  const twin = yield* NativeTwinManagerService;

  twin.setupManualTwin();

  yield* programs.StartEditorProgram;
  yield* programs.StartHightLightsProvider;
  yield* programs.SetupWorkSpace;
  // yield* programs.SetupEditorUI;

  setupTwin(tailwindConfig, true);

  yield* workers.installPackagesTypings(TWIN_PACKAGES_TYPINGS);

  yield* Effect.fromNullable(document.getElementById('first-loading-status')).pipe(
    Effect.map((x) => x.remove()),
  );
});

export const runApp = () => runMain(EditorMainRuntime.runFork(program));
