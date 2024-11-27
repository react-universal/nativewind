import * as Effect from 'effect/Effect';
import * as Runtime from 'effect/Runtime';
import * as Stream from 'effect/Stream';

const listenStreamChanges = <A, E, R>(
  stream: Stream.Stream<A, E>,
  f: (data: A) => Effect.Effect<void, never, R>,
): Effect.Effect<void, never, R> => {
  return Effect.flatMap(Effect.runtime<R>(), (runtime) => {
    const run = Runtime.runFork(runtime);
    return stream.pipe(
      Stream.mapEffect(f),
      Stream.runDrain,
      Effect.catchAllCause((_) => Effect.log('unhandled defect in event listener', _)),
      run,
    );
  });
};

export const listenForkedStreamChanges = <A, E, R>(
  stream: Stream.Stream<A, E>,
  f: (data: A) => Effect.Effect<void, never, R>,
) => Effect.forkScoped(listenStreamChanges(stream, f));

// type ChokidarEventFn = chokidar.FSWatcher['on'];
// type ChokidarEventFnArgs<A extends (...args: any[]) => any> = A extends (
//   ...args: infer R
// ) => any
//   ? R
//   : never;

// type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
//   k: infer I,
// ) => void
//   ? I
//   : never;

// type AnyOn = UnionToIntersection<ChokidarEventFn>;

// const listenDisposableEvent = <A extends AnyOn, R>(
//   event: A,
//   f: (data: ChokidarEventFnArgs<A>) => Effect.Effect<void, never, R>,
// ): Effect.Effect<never, never, R> => {
//   return Effect.flatMap(Effect.runtime<R>(), (runtime) =>
//     Effect.async<never>((_resume) => {
//       const run = Runtime.runFork(runtime);
//       const d = event((data) =>
//         run(
//           Effect.catchAllCause(f(data), (_) =>
//             Effect.log('unhandled defect in event listener', _),
//           ),
//         ),
//       );
//       return Effect.sync(() => {
//         d.dispose();
//       });
//     }),
//   );
// };
