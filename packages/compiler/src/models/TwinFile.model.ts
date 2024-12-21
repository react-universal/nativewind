import { type NodePath, traverse } from '@babel/core';
import { CodeGenerator } from '@babel/generator';
import type { ParseResult } from '@babel/parser';
import * as t from '@babel/types';
import { cx } from '@native-twin/core';
import * as Effect from 'effect/Effect';
import * as Iterable from 'effect/Iterable';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import {
  extractMappedAttributes,
  templateLiteralToStringLike,
} from '../utils/babel/babel.utils';
import {
  type JSXMappedAttribute,
  type JSXMappedAttributeWithText,
  TwinBabelError,
  type TwinBabelJSXElement,
} from './Babel.models';
import { BaseTwinTextDocument } from './TwinDocument.model';

export class TwinElement {
  constructor(readonly babelPath: NodePath<t.JSXElement>) {}
}

export class TwinFile extends BaseTwinTextDocument {
  get isTwinElement() {
    return this.getBabelTwinElements().pipe(
      Effect.map((elements) => Iterable.isEmpty(elements)),
      Effect.catchAll(() => Effect.succeed(false)),
    );
  }

  /**
   * @category babel extractors
   * @description get root (aka parent elements) babel JSX elements from a file
   */
  getBabelTwinElements(): Effect.Effect<Iterable<TwinBabelJSXElement>, TwinBabelError> {
    return Effect.async<NodePath<t.JSXElement>[], TwinBabelError>((emit) => {
      const data: NodePath<t.JSXElement>[] = [];
      traverse(this.ast, {
        Program: {
          exit() {
            emit(Effect.succeed(data));
          },
        },
        JSXElement(path) {
          data.push(path);
          path.skip();
        },
      });
    }).pipe(
      Effect.flatMap((elements) =>
        Effect.all(
          elements.map((x) => mapToBabelTwinElement(x.node)),
          { concurrency: 'inherit' },
        ),
      ),
    );
  }

  /**
   * @description Emit this document code (normally after being modified)
   */
  generateCode(ast: ParseResult<t.File>) {
    return Effect.sync(() => {
      const generate = new CodeGenerator(ast);
      return Option.fromNullable(generate.generate()).pipe(Option.getOrNull);
    });
  }
}

/**
 * @category mappers
 * @description map jsx element to twin babel element extracting recursively its childs
 */
const mapToBabelTwinElement = (
  babelNode: t.JSXElement,
  index = 0,
): Effect.Effect<TwinBabelJSXElement, TwinBabelError> =>
  Effect.gen(function* () {
    const childs = yield* Effect.suspend(() => getTwinElementChilds(babelNode));
    const mappedAttributes = extractMappedAttributes(babelNode);
    const mappedProps = yield* mappedPropsWithText(mappedAttributes);
    return {
      babelNode,
      childs,
      mappedProps,
      index,
      jsxName: Option.liftPredicate(babelNode.openingElement.name, t.isJSXIdentifier),
      location: Option.fromNullable(babelNode.loc).pipe(
        Option.map((x) =>
          Object.assign(x, { identifierName: Option.fromNullable(x.identifierName) }),
        ),
      ),
    };
  });

const getTwinElementChilds = (
  babelNode: t.JSXElement,
): Effect.Effect<Iterable<TwinBabelJSXElement>, TwinBabelError> =>
  Stream.fromIterable(babelNode.children).pipe(
    Stream.filterMap(Option.liftPredicate(t.isJSXElement)),
    Stream.zipWithIndex,
    Stream.mapEffect(([childPath, index]) =>
      Effect.suspend(() => mapToBabelTwinElement(childPath, index)),
    ),
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

/**
 * UPDATE
 */

// const extractBabelPaths = (ast: ParseResult<t.File>) =>
//   Stream.async<NodePath<t.JSXElement>>((emit) => {
//     const data: NodePath<t.JSXElement>[] = [];
//     traverse(ast, {
//       Program: {
//         exit() {
//           emit.chunk(Chunk.fromIterable(data));
//         },
//       },
//       JSXElement(path) {
//         data.push(path);
//         path.skip();
//       },
//     });
//   }).pipe(Stream.map(jsxElementToTree));

// const jsxElementToTree = (element: NodePath<t.JSXElement>): Tree<TwinElement> => {
//   const mappedProps = extractMappedAttributes(element.node);
//   const treeNode = new Tree(new TwinElement(element));
//   extractChildLeaves(treeNode.root);

//   return treeNode;

//   function extractChildLeaves(parent: TreeNode<TwinElement>) {
//     for (const child of parent.value.babelPath.get('children')) {
//       if (!child.isJSXElement()) continue;

//       const childLeave = parent.addChild(new TwinElement(element), parent);
//       extractChildLeaves(childLeave);
//     }
//   }
// };
