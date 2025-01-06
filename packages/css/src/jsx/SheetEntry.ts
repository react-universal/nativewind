import type { SelectorGroup } from '../css/css.types.js';
import type { AnyStyle, CompleteStyle } from '../react-native/rn.types.js';
import type { SheetEntry, SheetEntryDeclaration } from '../sheets/sheet.types.js';
import { getRuleSelectorGroup } from '../tailwind/tailwind.utils.js';
import {
  RuntimeSheetDeclaration,
  compileEntryDeclaration,
} from './SheetEntryDeclaration.js';
import type { CompilerContext } from './metro.runtime.js';
import *  as Predicates from './sheet.predicates.js';

// const OwnSelectorSymbol = Symbol('css/OwnSelector');
// const InheritedSymbol = Symbol('css/InheritedSymbol');

/** @category — CSS Parsers */
export class SheetEntryHandler implements Omit<SheetEntry, 'declarations'> {
  readonly animations: any[] = [];
  readonly className: string;
  readonly important: boolean;
  readonly precedence: number;
  readonly preflight: boolean;
  selectors: string[];
  private readonly declarations: SheetEntryDeclaration[];
  constructor(
    rawEntry: SheetEntry,
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
    return this.declarations.map((decl) => compileEntryDeclaration(decl, this.ctx));
  }

  isChildEntry(): boolean {
    return Predicates.isChildEntry(this);
  }

  get isPointerEntry(): boolean {
    return Predicates.isPointerEntry(this);
  }

  get isGroupEventEntry(): boolean {
    return Predicates.isGroupEventEntry(this);
  }

  get isDarkEntry(): boolean {
    return this.selectorGroup() === 'dark';
  }

  selectorGroup(): SelectorGroup {
    const group = getRuleSelectorGroup(this.selectors);
    if (this.inherited) {
      if (group === 'pointer' || group === 'group') return group;
      if (Predicates.isGroupEventEntry(this)) return 'group';
      if (Predicates.isPointerEntry(this)) return 'pointer';
      return 'base';
    }

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

  applyChildEntry(index: number, parentSize: number): SheetEntryHandler | undefined {
    if (!this.shouldApplyEntry(index, parentSize)) return undefined;

    return new SheetEntryHandler(
      {
        animations: [],
        className: this.className,
        declarations: this.declarations,
        important: this.important,
        precedence: this.precedence,
        preflight: this.preflight,
        selectors: this.selectors,
      },
      this.ctx,
      true,
    );
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

export const mergeCompiledDeclarations = (entries: RuntimeSheetDeclaration[]) =>
  entries.reduce((prev, current) => {
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

/**
 * @description merge a list of runtime sheet entries
 * @see `WARNING` (this does not discriminate entries by group)
 */
export const sheetEntriesToStyles = (entries: SheetEntryHandler[]): CompleteStyle => {
  return entries.reduce((prev, current) => {
    const style = mergeCompiledDeclarations(current.runtimeDeclarations);
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
