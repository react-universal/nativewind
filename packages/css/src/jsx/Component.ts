import type {
  AnyStyle,
  FinalSheet,
  GetChildStylesArgs,
} from '../react-native/rn.types.js';
import type { SheetEntry, SheetInteractionState } from '../sheets/sheet.types.js';
import type { RuntimeGroupSheet } from './Sheet.js';
import type { RuntimeSheetEntry } from './SheetEntry.js';

/** @category jsxComponent */
export interface RegisteredComponent {
  id: string;
  sheets: ComponentSheet[];
  metadata: {
    isGroupParent: boolean;
    hasGroupEvents: boolean;
    hasPointerEvents: boolean;
    hasAnimations: boolean;
  };
}

/** @category jsxComponent */
export interface ComponentSheet {
  prop: string;
  target: string;
  sheet: FinalSheet;
  getChildStyles(input: Partial<GetChildStylesArgs>): AnyStyle;
  getStyles: (
    input: Partial<SheetInteractionState>,
    templateEntries?: RuntimeSheetEntry[],
  ) => AnyStyle;
  compiledSheet: RuntimeComponentEntry;
  metadata: {
    isGroupParent: boolean;
    hasGroupEvents: boolean;
    hasPointerEvents: boolean;
    hasAnimations: boolean;
  };
  recompute(compiledSheet: RuntimeComponentEntry): ComponentSheet;
}

/** @category jsxComponent */
export interface RuntimeComponentEntry {
  classNames: string;
  prop: string;
  target: string;
  templateLiteral: string | null;
  templateEntries: SheetEntry[];
  rawSheet: RuntimeGroupSheet;
  // childEntries: RuntimeSheetEntry[];
  entries: RuntimeSheetEntry[];
  // precompiled: FinalSheet;
}
