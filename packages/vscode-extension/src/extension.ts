import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as vscode from 'vscode';
import { logger } from './client/debug/debug.context';
import { extensionChannelName } from './client/extension/extension.constants';
import { activateExtension, ExtensionContext } from './client/extension/vscode.context';
import { LanguageClientLive } from './client/language/language.provider';

const MainLive = Layer.empty.pipe(Layer.provide(logger(extensionChannelName)));

export function activate(context: vscode.ExtensionContext) {
  activateExtension(MainLive).pipe(
    Effect.provideService(ExtensionContext, context),
    Effect.provide(LanguageClientLive),
    Effect.runFork,
  );
}
