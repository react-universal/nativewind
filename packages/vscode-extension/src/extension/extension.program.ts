import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Scope from 'effect/Scope';
import { VscodeContext } from './extension.service';

export const launchExtension = <E>(layer: Layer.Layer<never, E, VscodeContext>) => {
  return Effect.gen(function* () {
    const context = yield* VscodeContext;
    const scope = yield* Scope.make();

    context.subscriptions.push({
      dispose: () => Effect.runFork(Scope.close(scope, Exit.void)),
    });

    yield* Layer.buildWithScope(layer, scope);
  }).pipe(Effect.catchAllCause(Effect.logFatal));
};
