import { DevTools } from '@effect/experimental';
import { NodeSocket } from '@effect/platform-node';
import * as Layer from 'effect/Layer';
import { BabelCompiler } from './BabelCompiler.service.js';
import { TwinFileSystem } from './TwinFileSystem.service.js';
import { TwinNodeContext } from './TwinNodeContext.service.js';

const DevToolsLive = DevTools.layerWebSocket().pipe(
  Layer.provide(NodeSocket.layerWebSocketConstructor),
);

/**
 * @description Provide Compiler without FS watcher
 */
export const NodeMainLayerSync = BabelCompiler.Live.pipe(
  Layer.provideMerge(TwinNodeContext.Live),
);

// export const NodeMainLayer = BabelCompiler.Live.pipe(
//   Layer.provideMerge(TwinFileSystem.Live),
//   Layer.provideMerge(TwinNodeContext.Live),
//   Layer.provide(DevToolsLive),
// );

export const NodeMainLayerAsync = BabelCompiler.Live.pipe(
  Layer.provideMerge(TwinFileSystem.Live),
  Layer.provideMerge(TwinNodeContext.Live),
  Layer.provide(DevToolsLive),
);
