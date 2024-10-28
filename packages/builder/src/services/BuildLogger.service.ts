import { Console, Effect, Queue } from 'effect';

export class BuilderLoggerService extends Effect.Service<BuilderLoggerService>()(
  'BuilderLoggerService',
  {
    effect: Effect.gen(function* () {
      const logger = yield* Queue.unbounded<string>();

      yield* Queue.take(logger).pipe(
        Effect.map(Console.log),
        Effect.flatten,
        Effect.forever,
        Effect.fork,
      );

      return {
        log: (message: string) => Queue.unsafeOffer(logger, message),
      };
    }),
  },
) {}
