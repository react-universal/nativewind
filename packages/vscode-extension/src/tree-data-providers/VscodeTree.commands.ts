import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as vscode from 'vscode';
import { registerCommand } from '../extension/extension.utils';
import { TreeInfoNode } from './models/VscodeTree.models';

export const VscodeTreeCommandsLive = Effect.gen(function* () {
  yield* registerCommand('nativeTwin.createTwinFiles', (infoNode: TreeInfoNode) =>
    Effect.promise(() => vscode.env.clipboard.writeText(infoNode.description)),
  );
}).pipe(Layer.effectDiscard);
