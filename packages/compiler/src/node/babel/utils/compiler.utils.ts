import { parse } from '@babel/parser';
import type { ParseResult } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { apply, pipe } from 'effect/Function';
import * as Hash from 'effect/Hash';
import * as Option from 'effect/Option';
import { Tree, TreeNode } from '@native-twin/helpers/tree';
import type { JSXElementNodePath, JSXElementTree } from '../models/jsx.models';
import * as babelPredicates from './babel.predicates';
import { getJSXElementName, getJSXElementSource } from './jsx.utils';

export const getBabelAST = (code: string, filename: string) => {
  const ast = parse(code, {
    sourceFilename: filename,
    plugins: ['jsx', 'typescript'],
    sourceType: 'module',
    errorRecovery: true,
    tokens: false,
    ranges: true,
  });
  return ast;
};

export const getAstTrees = (ast: ParseResult<t.File>, filename: string) => {
  return Effect.async<Tree<JSXElementTree>[]>((resolve) => {
    const cssImports: string[] = [];
    traverse(
      ast,
      {
        Program: {
          exit() {
            resolve(Effect.succeed(this.trees));
          },
        },
        ImportDeclaration(path) {
          if (path.node.source.value.endsWith('.css')) {
            cssImports.push(path.node.source.value);
          }
        },
        JSXElement(path) {
          const uid = path.scope.generateUidIdentifier();
          // console.log('UID: ', uid.name, uidUnNamed.name);
          const hash = pipe(
            Hash.combine(Hash.string(filename + uid.name)),
            apply(
              getJSXElementName(path.node.openingElement).pipe(
                Option.map((x) => Hash.string(x)),
                Option.getOrElse(() => Hash.string('unknown')),
              ),
            ),
          );

          const parentTree = new Tree<JSXElementTree>({
            order: -1,
            babelNode: path.node,
            uid: `${hash}:0`,
            source: getJSXElementSource(path),
            cssImports: cssImports,
            parentID: null,
          });
          gelBabelJSXElementChildLeaves(path, parentTree.root);
          this.trees.push(parentTree);
          path.skip();
        },
      },
      undefined,
      {
        trees: [] as Tree<JSXElementTree>[],
      },
    );
  });
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
    const childLeave = parent.addChild({
      order,
      babelNode: childPath.node,
      uid: `${parent.value.uid}:${order}`,
      source: getJSXElementSource(childPath),
      cssImports: parent.value.cssImports,
      parentID: parent.value.uid,
    });
    childLeave.parent = parent;
    gelBabelJSXElementChildLeaves(childPath, childLeave);
  }
};
