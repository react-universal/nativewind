import { traverse } from '@babel/core';
import type { ParseResult } from '@babel/parser';
import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { apply, pipe } from 'effect/Function';
import * as Hash from 'effect/Hash';
import * as HashMap from 'effect/HashMap';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import { Tree, TreeNode } from '@native-twin/helpers/tree';
import {
  JSXElementNodePath,
  JSXElementTree,
  TransformedJSXElementTree,
} from '../../models/Babel.models';
import { JSXElementNode } from '../../models/JSXElement.model';
import {
  addTwinPropsToElement,
  getJSXCompiledTreeRuntime,
  getJSXElementSource,
} from './babel.jsx';
import * as babelPredicates from './babel.predicates';
import { getJSXElementName } from './babel.utils';

export const streamJsxElementTrees = (ast: ParseResult<t.File>, filename: string) => {
  return Stream.async<NodePath<t.JSXElement>>((emit) => {
    // const cssImports: string[] = [];
    traverse(ast, {
      Program: {
        exit() {
          emit.end();
        },
      },
      JSXElement(path) {
        emit.single(path);
        path.skip();
      },
    });
  }).pipe(
    Stream.map((parentPath) => {
      const uid = parentPath.scope.generateUidIdentifier();
      // console.log('UID: ', uid.name, uidUnNamed.name);
      Hash.array([Hash.string(filename + uid.name)]);
      const hash = pipe(
        Hash.combine(Hash.string(filename + uid.name)),
        apply(
          getJSXElementName(parentPath.node.openingElement).pipe(
            Option.map((x) => Hash.string(x)),
            Option.getOrElse(() => Hash.string('unknown')),
          ),
        ),
      );
      const elementTree = JSXElementTree({
        order: -1,
        babelNode: parentPath.node,
        uid: `${hash}:0`,
        source: getJSXElementSource(parentPath),
        cssImports: [],
        parentID: null,
      });
      const parentTree = new Tree<JSXElementTree>(elementTree);
      gelBabelJSXElementChildLeaves(parentPath, parentTree.root);
      return parentTree;
    }),

    Stream.runCollect,
    Effect.map((x) => RA.fromIterable(x)),
  );
};

const gelBabelJSXElementChildLeaves = (
  path: JSXElementNodePath,
  parent: TreeNode<JSXElementTree>,
) => {
  const childs = pipe(
    path.get('children'),
    RA.filterMap(Option.liftPredicate(babelPredicates.isJSXElementPath)),
  );

  for (const childPath of childs) {
    const order = parent.childrenCount;
    // const childUid = path.scope.generateUid();
    // console.log('CHILD_UID: ', childUid);
    const childLeave = parent.addChild(
      JSXElementTree({
        order,
        babelNode: childPath.node,
        uid: `${parent.value.uid}:${order}`,
        source: getJSXElementSource(childPath),
        cssImports: parent.value.cssImports,
        parentID: parent.value.uid,
      }),
    );
    childLeave.parent = parent;
    gelBabelJSXElementChildLeaves(childPath, childLeave);
  }
};

export const transformJSXElementTree = (
  trees: HashMap.HashMap<string, JSXElementNode>,
) => {
  return HashMap.map(trees, (node): TransformedJSXElementTree => {
    const { runtimeSheets } = getJSXCompiledTreeRuntime(
      node,
      Option.flatMap(node.parentID, (x) => HashMap.get(trees, x)),
    );
    const runtimeAST = Option.fromNullable(
      addTwinPropsToElement(node, runtimeSheets, {
        componentID: true,
        order: true,
        styledProps: true,
        templateStyles: true,
      }),
    );
    return { leave: node, runtimeSheets, runtimeAST };
  });
};

export const transformTrees = (
  registry: HashMap.HashMap<string, JSXElementNode>,
  platform: string,
) =>
  Effect.gen(function* () {
    if (platform === 'web') {
      return HashMap.empty<string, TransformedJSXElementTree>();
    }
    return transformJSXElementTree(registry);
  });
