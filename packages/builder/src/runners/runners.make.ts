import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Layer from 'effect/Layer';
import { BuilderLoggerService } from '../services/BuildLogger.service.js';
import { EsbuildRunner } from './esbuild/index.js';
import { RollupRunner } from './rollup/index.js';

const nodeFS = Layer.merge(NodeFileSystem.layer, NodePath.layer);
const runners = Layer.merge(EsbuildRunner.Default, RollupRunner.Default);

export const BuildRunnersMainLive = runners
  .pipe(Layer.provideMerge(BuilderLoggerService.Default))
  .pipe(Layer.provideMerge(nodeFS));
