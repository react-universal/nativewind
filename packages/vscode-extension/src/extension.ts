import * as vscode from 'vscode';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { NativeTwinManagerService } from '@native-twin/language-service';
import { launchExtension } from './extension/extension.program';
import { VscodeContext } from './extension/extension.service';
import { LanguageClientLive, VscodeHightLightsProvider } from './language';
import { TwinTreeDataFilesProvider } from './tree-data-providers';
import { ClientCustomLogger } from './utils/logger.service';

const MainLive = Layer.mergeAll(LanguageClientLive, TwinTreeDataFilesProvider).pipe(
  Layer.provide(VscodeHightLightsProvider.Live),
  Layer.provide(NativeTwinManagerService.Live),
  Layer.provide(ClientCustomLogger),
);

export function activate(context: vscode.ExtensionContext) {
  launchExtension(MainLive).pipe(
    Effect.provideService(VscodeContext, context),

    Effect.runFork,
  );
}
