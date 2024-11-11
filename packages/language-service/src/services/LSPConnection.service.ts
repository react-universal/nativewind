import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';
import type * as vscode from 'vscode-languageserver';

export class LSPConnectionService extends Context.Tag('connection/service')<
  LSPConnectionService,
  vscode.Connection
>() {
  static make = (connection: vscode.Connection) =>
    Layer.succeed(
      LSPConnectionService,
      connection,
    );
}
