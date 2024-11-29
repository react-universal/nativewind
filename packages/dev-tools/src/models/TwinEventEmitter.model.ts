import { DevToolsPluginClient, EventSubscription } from 'expo/devtools.js';
import { RawJSXElementTreeNode } from '@native-twin/css/jsx';
import { PLUGIN_EVENTS } from '../constants/event.constants.js';

export type EventSubscriptionFn<T> = (data: T) => void;
export type TwinEventsShape = typeof PLUGIN_EVENTS;
export type TwinEventKeys = keyof TwinEventsShape;

type TwinEvents = {
  [K in TwinEventKeys]: TwinEventsShape[K];
}[keyof TwinEventsShape];

type TwinEventHandlers = {
  'tree/node/selected': [id: string];
  'tree/node/unselected': [id: string];
  'tree/receive': [tree: RawJSXElementTreeNode];
  'tree/update': [tree: RawJSXElementTreeNode];
};

export class TwinEventEmitter {
  private readonly emitter: DevToolsPluginClient;
  constructor(client: DevToolsPluginClient) {
    this.emitter = client;
  }

  on<EventName extends TwinEvents & string>(
    eventName: EventName,
    cb: (...args: TwinEventHandlers[EventName]) => void,
  ) {
    this.emitter.addMessageListener(eventName, cb);
  }

  remove(event: EventSubscription) {
    event.remove();
  }

  emit<EventName extends TwinEvents & string>(
    event: TwinEvents,
    ...eventArgs: TwinEventHandlers[EventName]
  ) {
    this.emitter.sendMessage(event, eventArgs[0]);
  }

  getEventEmitter() {
    return this.emitter;
  }
}
