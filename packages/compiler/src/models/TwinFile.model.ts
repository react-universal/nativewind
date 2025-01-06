import { type NodePath, traverse } from '@babel/core';
import { CodeGenerator } from '@babel/generator';
import { addNamed } from '@babel/helper-module-imports';
import type { ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { cx } from '@native-twin/core';
import { SheetEntryHandler } from '@native-twin/css/jsx';
import { Tree, type TreeNode } from '@native-twin/helpers/tree';
import * as RA from 'effect/Array';
import * as Chunk from 'effect/Chunk';
import * as Effect from 'effect/Effect';
import * as Iterable from 'effect/Iterable';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import {
  extractMappedAttributes,
  templateLiteralToStringLike,
} from '../utils/babel/babel.utils';
import {
  type CompiledMappedProp,
  type JSXMappedAttribute,
  type JSXMappedAttributeWithText,
  TwinBabelError,
} from './Babel.models';
import { TwinElement } from './Compiler.models';
import type { CompilerStyleSheet } from './CompilerSheet';
import { BaseTwinTextDocument } from './TwinDocument.model';

/**
 * UPDATE
 */
export class TwinFileTree extends BaseTwinTextDocument {
  get babelNodePaths() {
    return extractBabelPaths(this.ast);
  }

  /**
   * @category mappers
   * @description map jsx element to twin babel element extracting recursively its childs
   */
  transformBabelPaths(ctx: CompilerStyleSheet) {
    return this.babelNodePaths.pipe(
      Stream.mapEffect((tree) => jsxElementToTree(tree, ctx)),
      Stream.tap((tree) => Effect.logDebug('Extracted element: ', tree.root.value.name)),
      Stream.flatMap((tree) =>
        Stream.async<TreeNode<TwinElement>>((emit) => {
          emit.chunk(Chunk.fromIterable(tree.all())).then(() => emit.end());
        }),
      ),
      Stream.runCollect,
      Effect.andThen((trees) =>
        Effect.gen(this, function* () {
          const astProps = RA.fromIterable(trees).map((x) => x.value.toAst());
          this.ast.program.body.push(
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.identifier('__Twin___StyleSheet'),
                  t.identifier('inject'),
                ),
                [t.arrayExpression(astProps)],
              ),
            ),
          );
          return yield* Effect.all({
            trees: Effect.succeed(trees),
            output: this.generateCode(),
          });
        }),
      ),
    );
  }

  /**
   * @description Emit this document code (normally after being modified)
   */
  generateCode() {
    return Effect.sync(() => {
      const generate = new CodeGenerator(this.ast);
      return Option.fromNullable(generate.generate());
    });
  }
}

const extractBabelPaths = (ast: ParseResult<t.File>) =>
  Stream.async<NodePath<t.JSXElement>>((emit) => {
    const data: NodePath<t.JSXElement>[] = [];
    traverse(ast, {
      Program: {
        exit(path) {
          addNamed(path, 'StyleSheet222', '@native-twin/jsx/sheet', {
            importedInterop: 'compiled',
            blockHoist: 1,
            importingInterop: 'babel',
            importedType: 'commonjs',
            importPosition: 'after',
            importedSource: '@native-twin/jsx/sheet',
            nameHint: '__Twin___StyleSheet',
          });
          emit.chunk(Chunk.fromIterable(data)).then(() => emit.end());
        },
      },
      JSXElement(path) {
        data.push(path);
        path.skip();
      },
    });
  });

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

const jsxElementToTree = (
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
