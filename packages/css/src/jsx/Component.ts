import type { SelectorGroup } from '../css/css.types.js';
import type { SheetEntry } from '../sheets/sheet.types.js';
import type { SheetEntryHandler } from './SheetEntry.js';
import type { RuntimeSheetDeclaration } from './SheetEntryDeclaration.js';

/** @category jsxComponent */
export interface RuntimeComponentEntry {
  classNames: string;
  prop: string;
  target: string;
  templateLiteral: string | null;
  templateEntries: SheetEntry[];
  // childEntries: RuntimeSheetEntry[];
  entries: SheetEntryHandler[];
  // precompiled: FinalSheet;
}

/**
 * @version 7.0.0
 */
export interface RuntimeJSXStyle {
  group: SelectorGroup;
  className: string;
  important: boolean;
  inherited: boolean;
  precedence: number;
  declarations: RuntimeSheetDeclaration[];
}
/**
 * @version 7.0.0
 */
export interface RuntimeTwinMappedProp {
  target: string;
  prop: string;
  // templateEntries: string | null;
  entries: RuntimeJSXStyle[];
}

export interface TwinInjectedProp {
  id: string;
  index: number;
  parentID: 'NO_PARENT' | (string & {});
  parentSize: number;
  templateEntries: {
    prop: string;
    target: string;
    value: string;
  }[];
}

/**
 * @version 7.0.0
 */
export interface TwinInjectedObject {
  id: string;
  index: number;
  parentSize: number;
  parentID: string;
  metadata: {
    isGroupParent: boolean;
    hasGroupEvents: boolean;
    hasPointerEvents: boolean;
  };
  props: RuntimeTwinMappedProp[];
  childStyles: RuntimeJSXStyle[];
}
/**
 * @version 7.0.0
 */
export interface RuntimeTwinComponentProps {
  _twinInjected?: TwinInjectedProp;
}
