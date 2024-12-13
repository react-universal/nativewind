import * as Effect from 'effect/Effect';
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback } from 'react';
import { AppRuntime, type Message, MessageBus } from '../effects/context/plugin.context';
import { useRuntimeFn } from './useRuntimeFn';
import { useStable } from './useStable';

/**
 * The idea here is to bring the bus into react land,
 * so that we can use it in a more react-y way
 * without littering the code with `pipe` and `Effect` calls.
 */
/**
 * TODO: we might need to think about an abstraction if this becomes to repetitive, but
 * for now it can cristalize a bit more.
 * It is likely that the pattern will be the same for all hooks that interact with the runtime
 * because we use service properties.
 */

export const useMessageBus = (deps: unknown[]) => {
  const publishFn = useCallback(
    (message: Message) => MessageBus.pipe(Effect.andThen((bus) => bus.publish(message))),
    deps,
  );

  const registerFn = useCallback(
    (callback: <T>(message: T) => void) =>
      MessageBus.pipe(Effect.andThen((bus) => bus.register(callback))),
    deps,
  );

  /**
   * TODO: consider using both an action bus and state bus,
   * or a way to individually set the replay count for a subscription,
   * such that we can replay on demand, but not replay actions such as delete etc.
   */

  const publish = useRuntimeFn(AppRuntime, publishFn);
  const register = useRuntimeFn(AppRuntime, registerFn);
  return useStable({ publish, register });
};
