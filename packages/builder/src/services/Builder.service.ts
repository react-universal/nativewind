import * as NodeFileSystem from '@effect/platform-node/NodeFileSystem';
import * as NodePath from '@effect/platform-node/NodePath';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import { makeBuilderConfig } from '../config/cli.config.js';
import { CliBuildConfigInput } from '../config/config.types.js';

const FSContext = Layer.merge(NodePath.layer, NodeFileSystem.layer);

export class BuilderConfig extends Effect.Tag('common/builder/config')<
  BuilderConfig,
  Effect.Effect.Success<ReturnType<typeof makeBuilderConfig>>
>() {
  static Live = (params: CliBuildConfigInput) =>
    Layer.scoped(
      BuilderConfig,
      makeBuilderConfig(params).pipe(Effect.provide(FSContext)),
    );
}

export interface RunnerService {
  build: Effect.Effect<Stream.Stream<string>, never, BuilderConfig>;
  watch: Effect.Effect<Stream.Stream<string>, never, BuilderConfig>;
}
