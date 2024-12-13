import * as Effect from 'effect/Effect';
import * as Runtime from 'effect/Runtime';
import type * as vscode from 'vscode-languageserver/node.js';

export const runWithToken = <R>(runtime: Runtime.Runtime<R>) => {
  const runCallback = Runtime.runCallback(runtime);
  return <E, A>(effect: Effect.Effect<A, E, R>, token: vscode.CancellationToken) =>
    new Promise<A | undefined>((resolve) => {
      const cancel = runCallback(effect, {
        onExit: (exit) => {
          if (exit._tag === 'Success') {
            resolve(exit.value);
          } else {
            resolve(undefined);
          }
          // tokenDispose.dispose();
        },
      });
      token.onCancellationRequested(() => {
        cancel();
      });
    });
};
export const runWithTokenDefault = runWithToken(Runtime.defaultRuntime);

export const thenable = <A>(f: () => Thenable<A>) => {
  return Effect.async<A>((resume) => {
    f().then((_) => resume(Effect.succeed(_)));
  });
};
