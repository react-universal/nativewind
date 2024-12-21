import * as RA from 'effect/Array';
import * as Order from 'effect/Order';
import type * as Predicate from 'effect/Predicate';
import { OwnSheetSelectors } from '../css/css.constants.js';
import type { SelectorGroup, ValidChildPseudoSelector } from '../css/css.types.js';
import type { AnyStyle, CompleteStyle } from '../react-native/rn.types.js';
import type { SheetEntry, SheetEntryDeclaration } from '../sheets/sheet.types.js';
import { getRuleSelectorGroup } from '../tailwind/tailwind.utils.js';
import {
  RuntimeSheetDeclaration,
  compileEntryDeclaration,
} from './SheetEntryDeclaration.js';
import type { CompilerContext } from './metro.runtime.js';

interface ChildSelectorBrand {
  readonly ChildSelector: unique symbol;
}
type ChildSelector = ValidChildPseudoSelector & ChildSelectorBrand;

interface OwnSelectorBrand {
  readonly OwnSelector: unique symbol;
}
type OwnSelector = (typeof OwnSheetSelectors)[number] & OwnSelectorBrand;

// const OwnSelectorSymbol = Symbol('css/OwnSelector');
// const InheritedSymbol = Symbol('css/InheritedSymbol');

/** @category — CSS Parsers */
export class RuntimeSheetEntry implements SheetEntry {
  readonly animations: any[] = [];
  readonly className: string;
  readonly important: boolean;
  readonly precedence: number;
  readonly preflight: boolean;
  selectors: string[];
  readonly declarations: SheetEntryDeclaration[];
  constructor(
    private readonly rawEntry: SheetEntry,
    private readonly ctx: CompilerContext,
    readonly inherited = false,
  ) {
    this.animations = rawEntry.animations;
    this.className = rawEntry.className;
    this.important = rawEntry.important;
    this.precedence = rawEntry.precedence;
    this.preflight = rawEntry.preflight;
    this.selectors = rawEntry.selectors;
    this.declarations = rawEntry.declarations;
  }

  get runtimeDeclarations(): RuntimeSheetDeclaration[] {
    return RA.map(this.declarations, (decl) => compileEntryDeclaration(decl, this.ctx));
  }

  isChildEntry(): boolean {
    return isChildEntry(this);
  }

  get isPointerEntry(): boolean {
    return isPointerEntry(this);
  }

  get isGroupEventEntry(): boolean {
    return isGroupEventEntry(this);
  }

  get isDarkEntry(): boolean {
    return this.selectorGroup() === 'dark';
  }

  selectorGroup(): SelectorGroup {
    const group = getRuleSelectorGroup(this.selectors);
    if (this.inherited && (group === 'pointer' || group === 'group')) return group;
    if (this.inherited) return 'base';

    return group;
  }

  filterDeclarations(by: RuntimeSheetDeclaration['_tag']) {
    return this.runtimeDeclarations.filter(RuntimeSheetDeclaration.$is(by));
  }

  shouldApplyEntry(index: number, parentSize: number) {
    const isEven = (index + 1) % 2 === 0;
    return (
      (this.isChildEntry() && this.selectorGroup() === 'first' && index === 0) ||
      (this.selectorGroup() === 'last' && index + 1 === parentSize) ||
      (this.selectorGroup() === 'even' && isEven) ||
      (this.selectorGroup() === 'odd' && !isEven)
    );
  }

  applyChildEntry(index: number, parentSize: number): RuntimeSheetEntry | undefined {
    if (!this.shouldApplyEntry(index, parentSize)) return undefined;

    return new RuntimeSheetEntry(
      {
        ...this.rawEntry,
      },
      this.ctx,
      true,
    );
  }

  get styles(): AnyStyle {
    return this.runtimeDeclarations.reduce((prev, current) => {
      if (RuntimeSheetDeclaration.$is('NOT_COMPILED')(current)) {
        return prev;
      }
      let value: any = current.value;
      if (Array.isArray(current.value)) {
        value = [];
        for (const t of current.value) {
          if (typeof t.value === 'string') {
            if (t.value) {
              value.push({
                [t.prop]: t.value,
              });
            }
          }
        }
        Object.assign(prev, {
          transform: [...(prev['transform'] ?? []), ...value],
        });
        return prev;
      }
      if (typeof value === 'object') {
        Object.assign(prev, value);
      } else {
        Object.assign(prev, {
          [current.prop]: value,
        });
      }

      return prev;
    }, {} as AnyStyle);
  }

  toJSON() {
    return JSON.stringify({
      animations: this.animations,
      className: this.className,
      important: this.important,
      precedence: this.precedence,
      preflight: this.preflight,
      selectors: this.selectors,
      declarations: this.runtimeDeclarations,
    });
  }
}

/**
 * @description merge a list of runtime sheet entries
 * @see `WARNING` (this does not discriminate entries by group)
 */
export const sheetEntriesToStyles = (entries: RuntimeSheetEntry[]): CompleteStyle => {
  return entries.reduce((prev, current) => {
    const style = current.styles;
    if (!style) return prev;

    if (style && style.transform) {
      style.transform = [...(style.transform as any), ...style.transform];
    }
    return {
      ...prev,
      ...style,
    };
  }, {} as AnyStyle);
};

/** @category Orders */
export const orders = {
  sheetEntriesOrderByPrecedence: Order.mapInput(
    Order.number,
    (a: RuntimeSheetEntry) => a.precedence,
  ),
  sheetEntriesByImportant: Order.mapInput(
    Order.boolean,
    (a: RuntimeSheetEntry) => a.important,
  ),
};

export const sortSheetEntriesByPrecedence = Order.mapInput(
  Order.combine(orders.sheetEntriesOrderByPrecedence, orders.sheetEntriesByImportant),
  (a: RuntimeSheetEntry) => a,
);

/** @category Orders */
export const sortSheetEntries = (x: RuntimeSheetEntry[]) =>
  RA.sort(
    x,
    Order.combine(orders.sheetEntriesOrderByPrecedence, orders.sheetEntriesByImportant),
  );

/** @category Predicates */
export const isChildEntry: Predicate.Predicate<RuntimeSheetEntry> = (entry) =>
  isChildSelector(getRuleSelectorGroup(entry.selectors));

const childTest = new RegExp(/^(&:)?(first|last|odd|even).*/g);

/** @category Predicates */
export const isChildSelector: Predicate.Refinement<string, ChildSelector> = (
  group,
): group is ChildSelector => {
  return (
    group === 'first' ||
    group === 'last' ||
    group === 'even' ||
    group === 'odd' ||
    group.includes('first') ||
    group.includes('last') ||
    group.includes('even') ||
    group.includes('odd') ||
    childTest.exec(group) !== null
  );
};

/** @category Predicates */
export const isOwnSelector: Predicate.Refinement<string, OwnSelector> = (
  group,
): group is OwnSelector => OwnSheetSelectors.includes(group as OwnSelector);

/** @category Predicates */
export const isPointerEntry: Predicate.Predicate<RuntimeSheetEntry> = (entry) => {
  const group = getRuleSelectorGroup(entry.selectors);
  return group === 'group' || group === 'pointer';
};

/** @category Predicates */
export const isGroupEventEntry: Predicate.Predicate<RuntimeSheetEntry> = (entry) =>
  getRuleSelectorGroup(entry.selectors) === 'group';

/** @category Predicates */
export const isGroupParent: Predicate.Predicate<RuntimeSheetEntry> = (entry) =>
  entry.selectors.includes('group');
