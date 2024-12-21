import type * as t from '@babel/types';
import type { SheetEntry } from '@native-twin/css';

export type JSXChildElement = t.JSXElement['children'][number];

export type MapChildFn = (child: t.JSXElement) => t.JSXElement;

export interface StyledPropEntries {
  entries: SheetEntry[];
  prop: string;
  target: string;
  expression: string | null;
  classNames: string;
}
