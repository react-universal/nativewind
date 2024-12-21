// TODO: restore Keyframe types
// import type { ReanimatedKeyframe } from 'react-native-reanimated/lib/typescript/reanimated2/layoutReanimation/animationBuilder/Keyframe';
import type { MaybeArray } from '@native-twin/helpers';
import type { AnyStyle } from '../react-native/rn.types.js';

export type Preflight = false | MaybeArray<Record<string, any>>;

export interface Sheet<Target = unknown> {
  readonly target: Target;
  insert(entry: SheetEntry, index: number): void;
  snapshot(): () => void;
  /** Clears all CSS rules from the sheet. */
  clear(): void;
  destroy(): void;
  resume(
    addClassName: (className: string) => void,
    insert: (cssText: string) => void,
  ): void;
  insertPreflight(data: Preflight): string[];
  registry: Map<string, SheetEntryRegistry>;
}

export interface SheetEntryRegistry extends SheetEntry {
  index: number;
}

export type SortableEntry = {
  precedence: number;
  important: boolean;
};

export interface SheetEntry extends SortableEntry {
  className: string;
  declarations: SheetEntryDeclaration[];
  animations: any[];
  /** The rule sets (selectors and at-rules). expanded variants `@media ...`, `@supports ...`, `&:focus`, `.dark &` */
  selectors: string[];
  preflight: boolean;
}

export type SheetEntryDeclaration = {
  prop: string;
  value: number | string | AnyStyle | SheetEntryDeclaration[];
};

export interface SheetEntryCss extends Omit<SheetEntry, 'declarations'> {
  declarations: string;
}

export type SheetEntryTransformDeclaration = [
  prop: 'transform',
  transform: [transformProp: string, value: string][],
];

export interface SheetInteractionState {
  isPointerActive: boolean;
  isParentActive: boolean;
  dark?: boolean;
}
