import { RuntimeSheetEntry } from '@native-twin/css/jsx';
import { Tree, type TreeNode } from '@native-twin/helpers/tree';
import * as Array from 'effect/Array';
import * as Chunk from 'effect/Chunk';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Iterable from 'effect/Iterable';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import { FSUtils, TwinPath } from '../internal/fs';
import type { CompiledMappedProp, TwinBabelJSXElement } from '../models/Babel.models.js';
import { TwinCompiledElement } from '../models/Compiler.models';
import { TwinFile } from '../models/TwinFile.model.js';
import { TwinNodeContext, TwinNodeContextLive } from './TwinNodeContext.service.js';

const make = Effect.gen(function* () {
  const { getTwinRuntime } = yield* TwinNodeContext;
  const fs = yield* FSUtils.FsUtils;

  const transformFile = (file: TwinFile, platform: string) =>
    Effect.gen(function* () {
      const elements = yield* file.getBabelTwinElements();
      yield* Stream.fromIterable(elements).pipe(
        Stream.mapEffect((node) =>
          Effect.suspend(() => compileTwinElement(node, platform)),
        ),
        Stream.flatMap((compiled) =>
          Stream.fromIterableEffect(
            Effect.suspend(() => Effect.suspend(() => collectTwinElements(compiled))),
          ),
        ),
        Stream.mapEffect((compiled) => Effect.sync(() => compiled.mutateBabelAST())),
        Stream.runCollect,
      );
      const output = yield* file.generateCode(file.ast);
      return Option.fromNullable(output);
    });

  return {
    getTwinFile,
    compileTwinElement,
    collectTwinElements,
    transformFile,
    twinElementToTree,
  };

  function getTwinFile(filename: TwinPath.AbsoluteFilePath, code: Option.Option<string>) {
    return Effect.fromNullable(code.pipe(Option.getOrNull)).pipe(
      Effect.catchAll(() => fs.readFile(filename)),
      Effect.map((code) => new TwinFile(filename, code)),
    );
  }

  /**
   * @category mappers
   * @description map jsx element to twin babel element extracting recursively its childs
   */
  function compileTwinElement(
    currentElement: TwinBabelJSXElement,
    platform: string,
  ): Effect.Effect<TwinCompiledElement> {
    return Effect.gen(function* () {
      const compiledProps = yield* mappedPropsToRuntime(
        currentElement.mappedProps,
        platform,
      );
      const childEntries = Iterable.flatMap(compiledProps, (entry) => entry.childEntries);

      const childs = yield* Effect.suspend(() =>
        getTwinElementChilds(currentElement, platform, childEntries),
      ).pipe(
        Effect.map(
          Iterable.filter((x) => Iterable.contains(currentElement.childs, x.babel)),
        ),
      );

      return new TwinCompiledElement(currentElement, compiledProps, childs);
    });
  }

  function getTwinElementChilds(
    parent: TwinBabelJSXElement,
    platform: string,
    parentEntries: Iterable<RuntimeSheetEntry>,
  ): Effect.Effect<Iterable<TwinCompiledElement>> {
    return Stream.fromIterable(parent.childs).pipe(
      Stream.mapEffect((child) =>
        Effect.suspend(() => compileTwinElement(child, platform)),
      ),
      Stream.map(({ props, babel, childs }) =>
        pipe(
          Array.filterMap(Array.fromIterable(parentEntries), (x) =>
            Option.fromNullable(
              x.applyChildEntry(babel.index, Iterable.size(parent.childs)),
            ),
          ),
          (injectEntries) =>
            new TwinCompiledElement(
              babel,
              mergeMappedPropsWithParent(props, injectEntries),
              childs,
            ),
        ),
      ),
      Stream.runCollect,
    );
  }

  function mergeMappedPropsWithParent(
    props: Iterable<CompiledMappedProp>,
    parentEntries: Iterable<RuntimeSheetEntry>,
  ) {
    return Array.map(Array.fromIterable(props), (prop) => ({
      ...prop,
      entries: Array.appendAll(prop.entries, parentEntries),
    }));
  }

  function mappedPropsToRuntime(
    mappedProps: TwinBabelJSXElement['mappedProps'],
    platform: string,
  ): Effect.Effect<Iterable<CompiledMappedProp>> {
    return Effect.gen(function* () {
      const { compilerContext, tw } = yield* getTwinRuntime(platform);
      const result = Stream.fromIterable(mappedProps).pipe(
        Stream.map((attr): CompiledMappedProp => {
          const entries = pipe(
            tw(attr.value).map((entry) => new RuntimeSheetEntry(entry, compilerContext)),
            Array.partition((x) => x.isChildEntry()),
          );
          return {
            ...attr,
            entries: entries[0],
            childEntries: entries[1],
          };
        }),
        Stream.runCollect,
      );
      return yield* result;
    });
  }
});

const twinElementToTree = (element: TwinCompiledElement) => {
  const treeNode = new Tree(element);
  extractChildLeaves(treeNode.root);

  return treeNode;

  function extractChildLeaves(parent: TreeNode<TwinCompiledElement>) {
    for (const child of parent.value.childs) {
      const childLeave = parent.addChild(child, parent);
      extractChildLeaves(childLeave);
    }
  }
};

const collectTwinElements = (
  parent: TwinCompiledElement,
): Effect.Effect<Iterable<TwinCompiledElement>> =>
  Stream.async<TwinCompiledElement>((emit) => {
    const tree = twinElementToTree(parent);
    const list = tree.all().map((x) => x.value);
    emit.chunk(Chunk.fromIterable(list)).then(() => emit.end());
  }).pipe(Stream.runCollect);

export class TwinFileContext extends Effect.Service<TwinFileContext>()(
  'compiler/TwinFileContext',
  {
    accessors: true,
    effect: make,
    dependencies: [TwinNodeContextLive, FSUtils.FsUtilsLive, TwinPath.TwinPathLive],
  },
) {}
