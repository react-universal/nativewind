import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';

export const traceLayerLogs =
  (name: string) =>
  <In, Out, R>(layer: Layer.Layer<In, Out, R>) => {
    return pipe(
      layer,
      Layer.tap(() =>
        Effect.log(`[layer] ${name} - created`).pipe(Effect.withLogSpan(name)),
      ),
    );
  };
