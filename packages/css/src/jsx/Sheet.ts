import { type MaybeArray, asArray, hash } from '@native-twin/helpers';
import type { AnyStyle } from '../react-native/rn.types.js';
import type { RuntimeContext } from '../react-native/styles.context.js';
import type { SheetEntry } from '../sheets/sheet.types.js';
import { getRuleSelectorGroups } from '../tailwind/tailwind.utils.js';
import type { RuntimeJSXStyle } from './Component.js';
import { SheetEntryHandler } from './SheetEntry.js';
import type { CompilerContext } from './metro.runtime.js';
import * as Ord from './sheet.order.js';
import * as Predicate from './sheet.predicates.js';

export interface TwinSheetInput {
  index: number;
  parentSize: number;
}

export interface TwinCompilerSheet {
  insert: (input: MaybeArray<SheetEntry>, fromParent?: boolean) => void;
  getChildEntries: () => SheetEntry[];
  toEntryHandlers: (context: CompilerContext) => SheetEntryHandler[];
}

export const createSheetHandler = (data: TwinSheetInput): TwinCompilerSheet => {
  const { index, parentSize } = data;
  const isEven = index % 2 === 0;
  const localEntries: SheetEntry[] = [];
  const childEntries: SheetEntry[] = [];
  let compilerCache: SheetEntryHandler[] = [];
  let compilationHash = hash(getHashKey());

  return {
    insert,
    getChildEntries,
    toEntryHandlers,
  };

  function toEntryHandlers(context: CompilerContext) {
    const hashValue = hash(getHashKey());
    if (compilationHash === hashValue) {
      return compilerCache;
    }

    compilationHash = hashValue;
    compilerCache = localEntries
      .map((entry) => new SheetEntryHandler(entry, context))
      .sort(Ord.sortSheetEntries);

    return compilerCache;
  }

  function insert(insert: MaybeArray<SheetEntry>, fromParent = false) {
    if (!fromParent) {
      const splitted = filterEntries(asArray(insert));
      localEntries.push(...splitted.local);
      childEntries.push(...splitted.childs);
      return;
    }
    for (const entry of asArray(insert)) {
      const groups = getRuleSelectorGroups(entry.selectors);
      if (
        (groups.some((x) => x === 'first') && index === 0) ||
        (groups.some((x) => x === 'last') && index + 1 === parentSize) ||
        (groups.some((x) => x === 'even') && isEven) ||
        (groups.some((x) => x === 'odd') && !isEven)
      ) {
        localEntries.push(entry);
      }
    }
  }

  function getChildEntries() {
    return childEntries;
  }

  function getHashKey() {
    return `${index}-${parentSize}-${isEven}-${localEntries.length}-${childEntries.length}-${getClassnamesFromEntries(localEntries)}`;
  }
};

const getClassnamesFromEntries = (entries: SheetEntry[]) =>
  entries.map((x) => x.className).join(' ');

const filterEntries = (entries: SheetEntry[]) => {
  const childEntries: SheetEntry[] = [];
  const localEntries: SheetEntry[] = [];
  for (const entry of entries) {
    if (entry.selectors.some((selector) => Predicate.isChildSelector(selector))) {
      childEntries.push(entry);
      continue;
    }
    localEntries.push(entry);
  }
  return {
    childs: childEntries,
    local: localEntries,
  };
};

export class RuntimeStyleSheet {
  ctx: RuntimeContext;
  constructor(
    readonly styles: RuntimeJSXStyle[],
    ctx: RuntimeContext,
  ) {
    this.ctx = ctx;
  }

  compiledEntries() {
    const base: AnyStyle = {};
    const pointer: AnyStyle = {};
    const group: AnyStyle = {};
    for (const style of this.styles) {
      if (style.group === 'base') {
      }
    }
    return {
      base,
      pointer,
      group,
    };
  }
}

// export const groupEntriesBySelectorGroup = (
//   x: RuntimeSheetEntry[],
// ): Record<SelectorGroup, RuntimeSheetEntry[]> =>
//   x.groupBy((entry) => entry.selectorGroup());

// const combineRuntimeSheetEntries = (
//   a: RuntimeSheetEntry[],
//   b: RuntimeSheetEntry[],
// ): RuntimeSheetEntry[] => {
//   return [...[...a], ...[...b]];
// };

// export const getChildRuntimeEntries = (
//   runtimeEntries: RuntimeComponentEntry[],
// ): ChildsSheet => {
//   return runtimeEntries
//     .map((runtimeEntry) => runtimeEntry.rawSheet)
//     .reduce((prev, current) => Object.assign(prev, current), emptyChildsSheet);
// };

/** @category Filters */
// export function getSheetMetadata(
//   entries: RuntimeSheetEntry[],
// ): ComponentSheet['metadata'] {
//   return entries.reduce((prev, current) => {
//     const group = current.selectorGroup();
//     if (!prev.isGroupParent && current.className === 'group') {
//       prev.isGroupParent = true;
//     }
//     if (!prev.hasPointerEvents && group === 'pointer') {
//       prev.hasPointerEvents = true;
//     }
//     if (!prev.hasGroupEvents && group === 'group') {
//       prev.hasGroupEvents = true;
//     }
//     return prev;
//   }, defaultSheetMetadata);
// }

// export const runtimeEntriesToFinalSheet = (entries: RuntimeSheetEntry[]): FinalSheet =>
//   entries.reduce((prev, current) => {
//     const nextDecl = current.styles;
//     if (!nextDecl) return prev;

//     const group = current.selectorGroup();
//     if (nextDecl.transform && prev[group].transform) {
//       nextDecl.transform = [...(prev[group].transform as any), ...nextDecl.transform];
//     }
//     Object.assign(prev[group], nextDecl);
//     return prev;
//   }, defaultFinalSheet);

// export const getRawSheet = (sheets: RuntimeComponentEntry[]) =>
//   sheets.map((prop) => {
//     return {
//       ...prop,
//       rawSheet: {
//         ...prop.rawSheet,
//         even: [],
//         first: [],
//         last: [],
//         odd: [],
//       },
//     };
//   });
