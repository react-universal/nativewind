import { useCallback } from 'react';
import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import { EventSubscription } from 'expo/devtools.js';
import { EventSubscriptionFn } from '../models/TwinEventEmitter.model.js';
import { useDevToolsClient } from './useDevToolsClient.js';

export const useEventEmitter = () => {
  const maybeClient = useDevToolsClient();

  const addListener = useCallback(
    <T>(event: string, cb: EventSubscriptionFn<T>) => {
      const sb: Option.Option<EventSubscription> = pipe(
        maybeClient,
        Option.map((x) =>
          x.addMessageListener(event, (data) => {
            cb(data);
          }),
        ),
      );
      return () => {
        Option.map(sb, (x) => x.remove());
      };
    },
    [maybeClient],
  );
  return {
    addListener,
  };
};
