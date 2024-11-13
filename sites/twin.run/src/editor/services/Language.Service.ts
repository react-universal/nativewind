import { updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { TwinEditorConfigService } from './EditorConfig.service';

const make = Effect.gen(function* () {
  const { vscodeConfig } = yield* TwinEditorConfigService;

  updateUserConfiguration(vscodeConfig);

  // extensionCtx.subscriptions.push(...highLightsProviders);

  return;
});

export class LanguageClientService extends Context.Tag(
  'editor/client/LanguageClientService',
)<LanguageClientService, Effect.Effect.Success<typeof make>>() {
  static Live = Layer.scoped(LanguageClientService, make);
}
