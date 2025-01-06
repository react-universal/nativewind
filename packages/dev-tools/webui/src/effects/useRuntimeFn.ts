import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import * as FiberId from 'effect/FiberId';
import { pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
/* eslint-disable react-hooks/exhaustive-deps */
import { useContext, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { RuntimeContext } from '../effects/context/runtime.context';

/*
This hook returns a function that can be called to trigger an effect.
It returns a promise that resolves to the value of the effect.
*/

// TODO: accept a function without arguments
export function useRuntimeFn<A, E, R, T>(
  context: RuntimeContext<R>,
  fn: ((value: T) => Effect.Effect<A, E, NoInfer<R>>) | Effect.Effect<A, E, NoInfer<R>>,
) {
  // TODO: find out why fast refresh breaks LightBulb (it only works once, then it stops working). Endpoint keeps working.

  const emitter = useMemo(() => new EventEmitter<T, A>(), [fn]);

  // TODO: consider if using a straem is a good idea, because we can also pass a reference of the effect to Effect.runPromise to run it. There might be no real benefit, except for usecases that involve delays inside the effect (since the stream would buffer the events).

  const stream = useMemo(
    () =>
      pipe(
        Stream.fromAsyncIterable(createAsyncIterator(emitter), () => {}),
        Stream.mapEffect(({ data, eventId }) => {
          return pipe(
            Effect.sync(() => (Effect.isEffect(fn) ? fn : fn(data))),
            Effect.andThen(Effect.tap(emitter.resolve(eventId))),
          );
        }),
        Stream.runDrain,
      ),
    [fn],
  );

  useRuntime(context, stream);
  return emitter.emit;
}

/*
This hook is used to run an effect in a runtime.
It takes a context and an effect and runs the effect in the runtime provided by the context. It is used by useRuntimeFn.
*/

const noRuntimeMessage = `No runtime available. 
  Did you forget to wrap your component using WithRuntime?
  `;

export const useRuntime = <A, E, R>(
  context: RuntimeContext<R>,
  task: Effect.Effect<A, E, NoInfer<R>>,
) => {
  const runtime = useContext(context);
  if (Layer.isLayer(runtime)) throw new Error(noRuntimeMessage);

  //
  useEffect(() => {
    const f = task.pipe(runtime!.runFork);
    return () => Effect.runSync(f.pipe(Fiber.interruptAsFork(FiberId.none)));
  }, [runtime, task]);
};

interface EventType<T> {
  data: T;
  eventId: string;
}
class EventEmitter<T, A> {
  private listeners: Array<(data: T, eventId: string) => void> = [];
  private eventQueue: Array<EventType<T>> = [];
  private resolvers: Map<string, (result: A) => void> = new Map();

  // TODO: instead of using null, and casting it back to T,
  // TODO: create an override that allows zero arguments
  emit: ((data: T) => Promise<A>) | (() => Promise<A>) = (data) => {
    const eventId = uuidv4();
    let resolver: (result: A) => void;
    const promise = new Promise<A>((resolve) => (resolver = resolve));
    this.eventQueue.push({ data, eventId });
    this.notifyListeners();
    this.resolvers.set(eventId, resolver!);
    return promise;
  };

  subscribe(listener: (data: T, eventId: string) => void): void {
    this.listeners.push(listener);
    this.notifyListeners();
  }

  async waitForEvent(): Promise<EventType<T>> {
    if (this.eventQueue.length > 0) {
      return Promise.resolve(this.eventQueue.shift()!);
    }

    return new Promise((resolve) => {
      const oneTimeListener = (data: T, eventId: string) => {
        resolve({ data, eventId });
        this.listeners = this.listeners.filter((l) => l !== oneTimeListener);
      };
      this.subscribe(oneTimeListener);
    });
  }

  resolve(eventId: string) {
    return (result: A) => {
      const resolver = this.resolvers.get(eventId);
      if (resolver) {
        resolver(result);
        this.resolvers.delete(eventId);
      }
    };
  }

  private notifyListeners(): void {
    while (this.eventQueue.length > 0 && this.listeners.length > 0) {
      const event = this.eventQueue.shift()!;
      this.listeners.forEach((listener) => listener(event.data, event.eventId));
    }
  }
}

async function* createAsyncIterator<T, A>(
  emitter: EventEmitter<T, A>,
): AsyncGenerator<EventType<T>> {
  do {
    yield await emitter.waitForEvent();
  } while (true);
}
