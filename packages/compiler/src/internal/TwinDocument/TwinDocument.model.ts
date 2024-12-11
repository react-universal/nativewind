import { CodeGenerator } from '@babel/generator';
import type { ParseResult } from '@babel/parser';
import type * as t from '@babel/types';
import type { TreeNode } from '@native-twin/helpers/tree';
import * as Effect from 'effect/Effect';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import type { JSXElementTree } from '../../models/Babel.models.js';
import type { JSXMappedAttribute } from '../../models/jsx.models.js';
import { streamJsxElementTrees } from '../../utils/babel/babel.transform.js';
import { extractMappedAttributes, getBabelAST } from '../../utils/babel/babel.utils.js';
import { BaseTwinTextDocument } from './BaseTwinDocument.js';

export interface NodeWithMappedAttributes {
  runtimeData: JSXMappedAttribute[];
  node: TreeNode<JSXElementTree>;
}

export class TwinFileDocument extends BaseTwinTextDocument {
  get ast() {
    return getBabelAST(this.getText(), this.uri);
  }

  get JSXElementNodes() {
    return Effect.gen(this, function* () {
      const ast = this.ast;
      const mappedElements = yield* streamJsxElementTrees(ast, this.uri).pipe(
        Stream.fromIterableEffect,
        Stream.flatMap((tree) =>
          Stream.async<NodeWithMappedAttributes>((emit) => {
            tree.traverse((leave) => {
              emit.single({
                node: leave,
                runtimeData: extractMappedAttributes(leave.value.babelNode),
              });
              // const model = jsxTreeNodeToJSXElementNode(leave, entries, fileName);
            }, 'breadthFirst');

            emit.end();
          }),
        ),
        Stream.runCollect,
      );

      return {
        mappedElements,
        ast,
      };
    });
  }

  generateCode(ast: ParseResult<t.File>) {
    return Effect.sync(() => {
      const generate = new CodeGenerator(ast);
      return Option.fromNullable(generate.generate()).pipe(Option.getOrNull);
    });
  }
}
