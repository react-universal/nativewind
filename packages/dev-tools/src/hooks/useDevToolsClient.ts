import { pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import { type EventSubscription, useDevToolsPluginClient } from 'expo/devtools.js';
import { useEffect, useMemo } from 'react';
import { TwinEventEmitter } from '../models/TwinEventEmitter.model.js';

type EventSubscriptionFn<T> = (data: T) => void;

export const useDevToolsClient = () => {
  const clientI = useDevToolsPluginClient('@native-twin/dev-tools');

  return useMemo(() => Option.fromNullable(clientI), [clientI]);
};

export const useDevToolsClientEvents = () => {
  const clientI = useDevToolsPluginClient('@native-twin/dev-tools');

  return useMemo(
    () =>
      pipe(
        Option.fromNullable(clientI),
        Option.map((x) => new TwinEventEmitter(x)),
      ),
    [clientI],
  );
};

export const useClientSubscription = <Shape>(
  event: string,
  cb: EventSubscriptionFn<Shape>,
) => {
  const client = useDevToolsClient();

  useEffect(() => {
    const sb: Option.Option<EventSubscription> = pipe(
      client,
      Option.map((x) => x.addMessageListener(event, cb)),
    );
    return () => {
      Option.map(sb, (x) => x.remove());
    };
  }, [event, cb, client]);
};
