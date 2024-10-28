import type { SheetEntry } from '@native-twin/css';
import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';
import type { RuntimeComponentEntry } from '@native-twin/css/jsx';
import type { Tree } from '@native-twin/helpers/tree';
import type { JSXElementNode } from './JSXElement.model';

export type JSXChildElement = t.JSXElement['children'][number];

export type JSXElementNodePath = NodePath<t.JSXElement>;

export type MapChildFn = (child: t.JSXElement) => t.JSXElement;

export interface JSXMappedAttribute {
  prop: string;
  value: t.StringLiteral | t.TemplateLiteral;
  target: string;
}

export interface StyledPropEntries {
  entries: SheetEntry[];
  prop: string;
  target: string;
  expression: string | null;
  classNames: string;
}

export interface JSXFileTree {
  filePath: string;
  parents: Tree<JSXElementTree>[];
}

export interface JSXElementTree {
  babelNode: JSXElementNodePath['node'];
  order: number;
  uid: string;
  parentID: string | null;
  cssImports: string[];
  source: {
    kind: string;
    source: string;
  };
}

export interface JSXElementTreeMinimal {
  path: t.JSXElement;
  childs: JSXElementTreeMinimal[];
}

export interface RuntimeTreeNode {
  leave: JSXElementNode;
  runtimeSheet: RuntimeComponentEntry[];
  childs: RuntimeTreeNode[];
}
