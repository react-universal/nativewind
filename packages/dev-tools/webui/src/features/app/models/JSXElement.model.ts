import type { JSXElementSheet, RawJSXElementTreeNode } from '@native-twin/css/jsx';
import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';

export class JSXElementNode implements Equal.Equal {
  readonly node: string;
  readonly id: string;
  readonly parent: RawJSXElementTreeNode | null;
  readonly order: number;
  readonly childs: RawJSXElementTreeNode[];
  _runtimeSheet: JSXElementSheet | null = null;

  constructor(params: RawJSXElementTreeNode) {
    this.childs = params.childs;
    this.order = params.order;
    this.parent = params.parentNode;

    this.id = params.id;
    this.node = params.jsxElementName;
  }

  [Hash.symbol](): number {
    return Hash.hash(this.id);
  }

  [Equal.symbol](that: unknown): boolean {
    return that instanceof JSXElementNode && this.id === that.id;
  }
}
