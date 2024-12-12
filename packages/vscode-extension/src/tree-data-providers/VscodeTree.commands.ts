import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as vscode from 'vscode';
import { registerCommand } from '../extension/extension.utils.js';
import type { TreeInfoNode } from './models/VscodeTree.models.js';

export const VscodeTreeCommandsLive = Effect.gen(function* () {
  yield* registerCommand('nativeTwin.createTwinFiles', (infoNode: TreeInfoNode) =>
    Effect.promise(() => vscode.env.clipboard.writeText(infoNode.description)),
  );
}).pipe(Layer.effectDiscard);
