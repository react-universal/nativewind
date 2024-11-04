import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as vscode from 'vscode';
import { NativeTwinManagerService } from '@native-twin/language-service';
import { launchExtension } from './extension/extension.program';
import { VscodeContext } from './extension/extension.service';
import { LanguageClientLive } from './language';
import { VscodeHightLightsProvider } from './language/services/DocumentHighLights.service';
import { ClientCustomLogger } from './utils/logger.service';
import { TwinTreeDataFilesProvider } from './vscode-tree/TwinTreeView.provider';

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
