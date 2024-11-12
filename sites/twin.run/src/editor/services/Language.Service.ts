import { updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';
import { GetPackageTypings } from '@/utils/twin.schemas';
import * as WorkerError from '@effect/platform/WorkerError';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { ParseError } from 'effect/ParseResult';
import { UserConfig } from 'monaco-editor-wrapper';
import { TwinEditorConfigService } from './EditorConfig.service';
import { FileSystemService } from './FileSystem.service';

const make = Effect.gen(function* () {
  const { config, vscodeConfig } = yield* TwinEditorConfigService;

  const fileSystem = yield* FileSystemService;

  updateUserConfiguration(vscodeConfig);

  // extensionCtx.subscriptions.push(...highLightsProviders);

  return {
    config: Effect.succeed(config),
  };
});

export class LanguageClientService extends Context.Tag(
  'editor/client/LanguageClientService',
)<LanguageClientService, Effect.Effect.Success<typeof make>>() {
  static Live = Layer.scoped(LanguageClientService, make);
}
