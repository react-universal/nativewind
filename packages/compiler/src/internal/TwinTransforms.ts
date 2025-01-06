import type { NodePath } from '@babel/core';
import { CodeGenerator } from '@babel/generator';
import * as t from '@babel/types';
import { cx } from '@native-twin/core';
import { SheetEntryHandler } from '@native-twin/css/jsx';
import { Tree, type TreeNode } from '@native-twin/helpers/tree';
import * as RA from 'effect/Array';
import type * as Chunk from 'effect/Chunk';
import * as Effect from 'effect/Effect';
import * as Iterable from 'effect/Iterable';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import {
  type CompiledMappedProp,
  type JSXMappedAttribute,
  type JSXMappedAttributeWithText,
  TwinBabelError,
} from '../models/Babel.models';
import { TwinElement } from '../models/Compiler.models';
import type { CompilerStyleSheet } from '../models/CompilerSheet';
import {
  extractMappedAttributes,
  templateLiteralToStringLike,
} from '../utils/babel/babel.utils';

export const jsxElementToTree = (
  element: NodePath<t.JSXElement>,
  ctx: CompilerStyleSheet,
): Effect.Effect<Tree<TwinElement>, TwinBabelError> => {
  return Effect.gen(function* () {
    const mappedProps = yield* getTreeNodeMappedProps(element.node);
    const treeNode = new Tree(
      new TwinElement(element, mappedProps, {
        index: -1,
        parentID: 'NO_PARENT',
        parentSize: -1,
        parentStyles: Iterable.empty(),
      }),
    );
    yield* extractChildLeaves(treeNode.root);

    return treeNode;
  });

  function getTreeNodeMappedProps(node: t.JSXElement) {
    return Effect.andThen(
      mappedPropsWithText(extractMappedAttributes(node)),
      (mappedProps) => mappedPropsToRuntime(mappedProps, ctx),
    );
  }

  function extractChildLeaves(
    parent: TreeNode<TwinElement>,
  ): Effect.Effect<void, TwinBabelError> {
    return Effect.gen(function* ($) {
      const childs = RA.filterMap(
        parent.value.babelPath.get('children'),
        Option.liftPredicate((x) => x.isJSXElement()),
      );
      yield* $(
        RA.map(childs, (element, index) =>
          mappedPropsWithText(extractMappedAttributes(element.node)).pipe(
            Effect.andThen((mapped) => mappedPropsToRuntime(mapped, ctx)),
            Effect.andThen((compiledProps) =>
              parent.addChild(
                new TwinElement(element, compiledProps, {
                  index,
                  parentSize: childs.length,
                  parentID: `${parent.value.id}`,
                  parentStyles: Iterable.filterMap(parent.value.childEntries, (x) =>
                    Option.fromNullable(x.applyChildEntry(index, childs.length)),
                  ),
                }),
                parent,
              ),
            ),
          ),
        ),
        (effects) =>
          Effect.suspend(() => Effect.all(effects, { concurrency: 'inherit' })),
        Effect.andThen((childs) =>
          Effect.suspend(() =>
            Effect.all(
              childs.map((node) => extractChildLeaves(node)),
              {
                concurrency: 'inherit',
              },
            ),
          ),
        ),
      );
    }).pipe(Effect.withLogSpan('TwinFileTree.jsxElementToTree'));
  }
};

const mappedPropsToRuntime = (
  mappedProps: Iterable<JSXMappedAttributeWithText>,
  ctx: CompilerStyleSheet,
): Effect.Effect<Chunk.Chunk<CompiledMappedProp>> =>
  Stream.fromIterable(mappedProps).pipe(
    Stream.map((attr): CompiledMappedProp => {
      const runtime = RA.map(
        ctx.twinFn(attr.value),
        (entry) => new SheetEntryHandler(entry, ctx.ctx),
      );
      const entries = RA.partition(runtime, (x) => x.isChildEntry());
      return {
        ...attr,
        entries: entries[0],
        childEntries: entries[1],
      };
    }),
    Stream.runCollect,
  );

const mappedPropsWithText = (
  mappedProps: Iterable<JSXMappedAttribute>,
): Effect.Effect<Iterable<JSXMappedAttributeWithText>, TwinBabelError> =>
  Stream.fromIterable(mappedProps).pipe(
    Stream.map((attr): JSXMappedAttributeWithText => {
      let classNames = '';
      let templateExpression: Option.Option<string> = Option.none();

      if (t.isTemplateLiteral(attr.value)) {
        const cooked = templateLiteralToStringLike(attr.value);
        classNames = cooked.strings;
        const generate = new CodeGenerator(cooked.expressions);
        if (attr.value.expressions.length > 0) {
          templateExpression = Option.some(generate.generate().code);
        }
      }

      if (t.isStringLiteral(attr.value)) {
        classNames = attr.value.value;
      }

      return {
        prop: attr.prop,
        target: attr.target,
        value: cx`${classNames}`,
        templateExpression,
      };
    }),
    Stream.mapError(
      (error) =>
        new TwinBabelError({
          cause: new Error('Mapped props parsing error'),
          message: error,
        }),
    ),
    Stream.catchAll(() => Stream.make()),
    Stream.runCollect,
  );
