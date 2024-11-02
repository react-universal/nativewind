import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as vscode from 'vscode';
import { Tree } from '@native-twin/helpers/tree';
import {
  ConfigManagerService,
  NativeTwinManagerService,
} from '@native-twin/language-service';
import { launchExtension } from './extension/extension.program';
import { VscodeContext, ExtensionService } from './extension/extension.service';
import { VirtualDirectory, VirtualEntryType } from './file-system/FileSystem.models';
import {
  VscodeFileSystem,
  VscodeFileSystemProviderManager,
} from './file-system/FileSystem.service';
import { LanguageClientContext, VscodeCompletionsProvider } from './language';
import { VscodeHightLightsProvider } from './language/services/DocumentHighLights.service';
import { ClientCustomLogger } from './utils/logger.service';

const providersLive = Layer.mergeAll(
  VscodeCompletionsProvider.Live,
  VscodeHightLightsProvider.Live,
);
const completions = providersLive
  .pipe(Layer.provideMerge(NativeTwinManagerService.Live))
  .pipe(Layer.provideMerge(ConfigManagerService.Live));

const languageLive = LanguageClientContext.Live.pipe(
  Layer.provideMerge(completions),
  Layer.provideMerge(
    VscodeFileSystem.Live(
      new Tree<VirtualEntryType>(
        new VirtualDirectory(
          vscode.Uri.parse(`${VscodeFileSystemProviderManager.meta.scheme}:/`, true),
        ),
      ),
    ),
  ),
);

const MainLive = ExtensionService.Live.pipe(Layer.provideMerge(languageLive)).pipe(
  Layer.provideMerge(ClientCustomLogger),
);

export function activate(context: vscode.ExtensionContext) {
  launchExtension(MainLive).pipe(
    Effect.provideService(VscodeContext, context),
    Effect.runFork,
  );
}
