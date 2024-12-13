import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Runtime from 'effect/Runtime';

type Listener<T extends Array<any>> = (...args: T) => void;

export class TwinEventEmitter<EventMap extends Record<string, Array<any>>> {
  private eventListeners: {
    [K in keyof EventMap]?: Set<Listener<EventMap[K]>>;
  } = {};

  on<K extends keyof EventMap>(eventName: K, listener: Listener<EventMap[K]>) {
    const listeners = this.eventListeners[eventName] ?? new Set();
    listeners.add(listener);
    this.eventListeners[eventName] = listeners;
    return () => {
      listeners.delete(listener);
    };
  }

  emit<K extends keyof EventMap>(eventName: K, ...args: EventMap[K]) {
    const listeners = this.eventListeners[eventName] ?? new Set();
    for (const listener of listeners) {
      listener(...args);
    }
  }
}

export interface IDisposable {
  dispose(): void;
}

export interface Event<T> {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  // biome-ignore lint/style/useShorthandFunctionType: <explanation>
  (listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[]): IDisposable;
}

export class DisposableEmitter<T> {
  private listeners?: Array<(data: T) => void> | ((data: T) => void);

  /**
   * Event<T> function.
   */
  public readonly event: Event<T> = (listener, thisArgs, disposables) => {
    const d = this.add(thisArgs ? listener.bind(thisArgs) : listener);
    disposables?.push(d);
    return d;
  };

  /**
   * Gets the number of event listeners.
   */
  public get size() {
    if (!this.listeners) {
      return 0;
    }
    if (typeof this.listeners === 'function') {
      return 1;
    }
    return this.listeners.length;
  }

  private add(listener: (data: T) => void): IDisposable {
    if (!this.listeners) {
      this.listeners = listener;
    } else if (typeof this.listeners === 'function') {
      this.listeners = [this.listeners, listener];
    } else {
      this.listeners.push(listener);
    }

    return { dispose: () => this.rm(listener) };
  }

  /**
   * Emits event data.
   */
  public fire(value: T) {
    if (!this.listeners) {
      // no-op
    } else if (typeof this.listeners === 'function') {
      this.listeners(value);
    } else {
      for (const listener of this.listeners) {
        listener(value);
      }
    }
  }

  /**
   * Disposes of the emitter.
   */
  public dispose() {
    this.listeners = undefined;
  }

  private rm(listener: (data: T) => void) {
    if (!this.listeners) {
      return;
    }

    if (typeof this.listeners === 'function') {
      if (this.listeners === listener) {
        this.listeners = undefined;
      }
      return;
    }

    const index = this.listeners.indexOf(listener);
    if (index === -1) {
      return;
    }

    if (this.listeners.length === 2) {
      this.listeners = index === 0 ? this.listeners[1] : this.listeners[0];
    } else {
      this.listeners = this.listeners
        .slice(0, index)
        .concat(this.listeners.slice(index + 1));
    }
  }
}

export interface Emitter<A> {
  readonly event: Event<A>;
  readonly fire: (data: A) => Effect.Effect<void>;
}

const listenDisposableEvent = <A, R>(
  event: Event<A>,
  f: (data: A) => Effect.Effect<void, never, R>,
): Effect.Effect<never, never, R> => {
  return Effect.flatMap(Effect.runtime<R>(), (runtime) =>
    Effect.async<never>((_resume) => {
      const run = Runtime.runFork(runtime);
      const d = event((data) =>
        run(
          Effect.catchAllCause(f(data), (_) =>
            Effect.log('unhandled defect in event listener', _),
          ),
        ),
      );
      return Effect.sync(() => {
        d.dispose();
      });
    }),
  );
};

export const listenForkEvent = <A, R>(
  event: Event<A>,
  f: (data: A) => Effect.Effect<void, never, R>,
) => Effect.forkScoped(listenDisposableEvent(event, f));

const emitter = <A>() =>
  Effect.gen(function* () {
    const emitter = new DisposableEmitter<A>();
    yield* Effect.addFinalizer(() => Effect.sync(() => emitter.dispose()));
    const fire = (data: A) => Effect.sync(() => emitter.fire(data));
    return {
      event: emitter.event,
      fire,
    } as Emitter<A>;
  });

export const emitterOptional = <A>() =>
  Effect.map(emitter<A | null | undefined | void>(), (emitter) => ({
    ...emitter,
    fire: (data: Option.Option<A>) => emitter.fire(Option.getOrUndefined(data)),
  }));
