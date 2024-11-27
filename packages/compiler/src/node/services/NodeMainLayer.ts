// import { DevTools } from '@effect/experimental';
// import { NodeSocket } from '@effect/platform-node';
import * as Layer from 'effect/Layer';
import { BabelCompiler } from './BabelCompiler.service.js';
// import { twinLoggerLayer } from './Logger.service.js';
import { TwinFileSystem } from './TwinFileSystem.service.js';
import { TwinNodeContext } from './TwinNodeContext.service.js';

// const DevToolsLive = DevTools.layerWebSocket().pipe(
//   Layer.provide(NodeSocket.layerWebSocketConstructor),
// );

export const NodeMainLayer = BabelCompiler.Live.pipe(
  Layer.provideMerge(TwinFileSystem.Live),
  Layer.provideMerge(TwinNodeContext.Live),
  // Layer.provideMerge(FSLive),
  // Layer.provide(twinLoggerLayer),
  // Layer.provide(DevToolsLive),
);
