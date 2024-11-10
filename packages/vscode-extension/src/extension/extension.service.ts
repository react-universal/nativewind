import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as vscode from 'vscode';
import { Constants } from '@native-twin/language-service';
import { extensionConfigState } from './extension.utils';

const make = Effect.gen(function* () {
  const data = yield* extensionConfigState(Constants.DEFAULT_PLUGIN_CONFIG);

  return yield* data.get;
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
