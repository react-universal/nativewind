import type { SheetEntry } from '../sheets/sheet.types.js';

export interface StyledPropEntries {
  entries: SheetEntry[];
  prop: string;
  target: string;
  expression: string | null;
  classNames: string;
}

/** @category MetroBundler */
export interface CompilerContext {
  baseRem: number;
  platform: string;
}

export interface RawJSXElementTreeNode {
  jsxElementName: string;
  order: number;
  parentNode: null;
  id: string;
  filename: string;
  childs: RawJSXElementTreeNode[];
  source: string;
  importKind: string;
}
