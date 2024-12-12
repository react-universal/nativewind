import * as Context from 'effect/Context';
import type * as vscode from 'vscode';

export class VscodeContext extends Context.Tag('vscode/ExtensionCtx')<
  VscodeContext,
  vscode.ExtensionContext
>() {}
