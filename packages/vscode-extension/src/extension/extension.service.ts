import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import * as vscode from 'vscode';
import { ConfigManagerService, Constants } from '@native-twin/language-service';
import { extensionConfigState } from './extension.utils';

const make = Effect.gen(function* () {
  const configHandler = yield* ConfigManagerService;

  yield* Effect.flatMap(extensionConfigState(Constants.DEFAULT_PLUGIN_CONFIG), (x) =>
    Stream.runForEach(x.changes, (config) =>
      Effect.sync(() =>
        configHandler.onUpdateConfig({
          ...configHandler,
          config,
        }),
      ).pipe(Effect.andThen(Effect.log('Config changed, reloading resources...'))),
    ),
  ).pipe(Effect.fork);

  return {};
});

export class __ExtensionService extends Context.Tag('vscode/ExtensionService')<
  __ExtensionService,
  {}
>() {
  static Live = Layer.scoped(__ExtensionService, make);
}

export class VscodeContext extends Context.Tag('vscode/ExtensionCtx')<
  VscodeContext,
  vscode.ExtensionContext
>() {}
