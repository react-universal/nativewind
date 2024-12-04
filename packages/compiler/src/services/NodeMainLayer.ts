import { DevTools } from '@effect/experimental';
import { NodeSocket } from '@effect/platform-node';
import * as Layer from 'effect/Layer';

export const DevToolsLive = DevTools.layerWebSocket().pipe(
  Layer.provide(NodeSocket.layerWebSocketConstructor),
);
