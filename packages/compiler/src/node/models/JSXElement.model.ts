import * as t from '@babel/types';
import * as Equal from 'effect/Equal';
import { pipe } from 'effect/Function';
import * as Hash from 'effect/Hash';
import * as Option from 'effect/Option';
import {
  getChildRuntimeEntries,
  type ChildsSheet,
  type RuntimeComponentEntry,
} from '@native-twin/css/jsx';
import type { TreeNode } from '@native-twin/helpers/tree';
import { getJSXElementName } from '../utils/babel/babel.jsx.js';
import { getJSXElementAttrs } from '../utils/babel/babel.utils.js';
import { JSXElementTree } from './Babel.models.js';
import type { JSXMappedAttribute } from './jsx.models.js';

const jsxElementHash = (path: t.JSXElement, filename: string): number => {
  const filenameHash = Hash.string(`${filename}`);
  return pipe(
    Hash.string(`${path.start}-${path.end}`),
    Hash.combine(filenameHash),
    Hash.combine(Hash.string(path.type)),
  );
};

export class JSXElementNodeKey implements Equal.Equal {
  constructor(
    readonly path: t.JSXElement,
    readonly filename: string,
  ) {}

  [Hash.symbol](): number {
    return jsxElementHash(this.path, this.filename);
  }

  [Equal.symbol](that: unknown): boolean {
    return (
      that instanceof JSXElementNodeKey &&
      this.path.loc === that.path.loc &&
      this.path.type === that.path.type &&
      this.path.start == that.path.start
    );
  }
}

export const jsxElementNodeKey = (path: t.JSXElement, filename: string) =>
  new JSXElementNodeKey(path, filename);

interface JSXElementNodeInit {
  leave: TreeNode<JSXElementTree>;
  order: number;
  filename: string;
  runtimeData: JSXMappedAttribute[];
  entries: RuntimeComponentEntry[];
}
export class JSXElementNode implements Equal.Equal {
  readonly _tag = 'JSXElementNode';
  readonly leave: TreeNode<JSXElementTree>;
  readonly order: number;
  readonly filename: string;
  readonly id: string;
  readonly runtimeData: JSXMappedAttribute[];
  readonly entries: RuntimeComponentEntry[];
  readonly childEntries: ChildsSheet;
  constructor({ filename, leave, order, runtimeData, entries }: JSXElementNodeInit) {
    this.leave = leave;
    this.filename = filename;
    this.order = order;
    this.runtimeData = runtimeData;
    // this.id = `${jsxElementHash(leave.value.babelNode, filename)}`;
    this.id = leave.value.uid;
    this.entries = entries;
    this.childEntries = getChildRuntimeEntries(this.entries);
  }

  get source() {
    return this.leave.value.source;
  }

  get parentSize(): number {
    return pipe(
      this.parentLeave,
      Option.map((x) => x.childrenCount),
      Option.getOrElse(() => 0),
    );
  }

  get parentLeave() {
    return Option.fromNullable(this.leave.parent);
  }

  get parentID() {
    return Option.fromNullable(this.leave.value.parentID);
  }

  get path() {
    return this.leave.value.babelNode;
  }

  get attributes() {
    return getJSXElementAttrs(this.path);
  }

  get openingElement() {
    return this.path.openingElement;
  }

  get elementName() {
    return pipe(
      getJSXElementName(this.path.openingElement),
      Option.getOrElse(() => 'UnknownJSX'),
    );
  }

  [Hash.symbol](): number {
    return Hash.hash(this.id);
  }

  [Equal.symbol](that: unknown): boolean {
    return that instanceof JSXElementNode && this.id === that.id;
  }
}
