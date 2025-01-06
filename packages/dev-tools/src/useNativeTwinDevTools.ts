import type { RawJSXElementTreeNode } from '@native-twin/css/jsx';
import * as Option from 'effect/Option';
import { PLUGIN_EVENTS } from './constants/event.constants.js';
import { useDevToolsClient } from './hooks/useDevToolsClient.js';
import { useEventEmitter } from './hooks/useEventEmitter.js';

export function useNativeTwinDevTools() {
  const client = useDevToolsClient();
  const { addListener } = useEventEmitter();

  return {
    registerTree: (tree: RawJSXElementTreeNode) => {
      Option.map(client, (pluginClient) =>
        pluginClient.sendMessage(PLUGIN_EVENTS.receiveTree, tree),
      );
    },
    addListener,
  };
}
