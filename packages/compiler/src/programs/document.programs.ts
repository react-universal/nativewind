import type { TreeNode } from '@native-twin/helpers/tree';
import * as Chunk from 'effect/Chunk';
import * as Effect from 'effect/Effect';
import * as Stream from 'effect/Stream';
import { extractBabelPaths } from '../internal/TwinBabel';
import { jsxElementToTree } from '../internal/TwinTransforms';
import type { TwinElement } from '../models/Compiler.models';
import { TwinDocumentCtx } from '../services/TwinDocument.service';
import {
  TwinNodeContext,
  TwinNodeContextLive,
} from '../services/TwinNodeContext.service';
import { TWIN_DEFAULT_PLUGIN_CONFIG } from '../shared/compiler.constants';

export const transformTwinDocument = Effect.gen(function* () {
  const { getTwForPlatform } = yield* TwinNodeContext;
  const { ast, platform } = yield* TwinDocumentCtx;
  const compilerCtx = yield* getTwForPlatform(platform);

  yield* extractBabelPaths(ast, TWIN_DEFAULT_PLUGIN_CONFIG).pipe(
    Stream.mapEffect((tree) => jsxElementToTree(tree, compilerCtx)),
    Stream.flatMap((tree) =>
      Stream.async<TreeNode<TwinElement>>((emit) => {
        emit.chunk(Chunk.fromIterable(tree.all())).then(() => emit.end());
      }),
    ),
    Stream.runForEach((item) => Effect.log('NODE: ', item.id)),
  );
}).pipe(Effect.provide(TwinNodeContextLive));
