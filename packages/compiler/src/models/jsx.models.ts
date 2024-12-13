import type * as t from '@babel/types';
import type { SheetEntry } from '@native-twin/css';
import type { RuntimeComponentEntry } from '@native-twin/css/jsx';
import type { JSXElementNode } from './JSXElement.model.js';

export type JSXChildElement = t.JSXElement['children'][number];

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

export interface JSXElementTreeMinimal {
  path: t.JSXElement;
  childs: JSXElementTreeMinimal[];
}

export interface RuntimeTreeNode {
  leave: JSXElementNode;
  runtimeSheet: RuntimeComponentEntry[];
  childs: RuntimeTreeNode[];
}
