import * as RA from 'effect/Array';
import { pipe } from 'effect/Function';
import * as Record from 'effect/Record';
import type { SelectorGroup } from '../css/css.types.js';
import type { FinalSheet } from '../react-native/rn.types.js';
import type { ComponentSheet, RuntimeComponentEntry } from './Component.js';
import { type RuntimeSheetEntry, sortSheetEntries } from './SheetEntry.js';
import {
  defaultFinalSheet,
  defaultSheetMetadata,
  emptyChildsSheet,
} from './constants.js';

/** @category MetroBundler */
export type ChildsSheet = Record<'first' | 'last' | 'even' | 'odd', RuntimeSheetEntry[]>;

/** @category MetroBundler */
export interface JSXElementSheet {
  propEntries: RuntimeComponentEntry[];
  childEntries: ChildsSheet;
}

export type RuntimeGroupSheet = Record<SelectorGroup, RuntimeSheetEntry[]>;

export const groupEntriesBySelectorGroup = (
  x: RuntimeSheetEntry[],
): Record<SelectorGroup, RuntimeSheetEntry[]> =>
  RA.groupBy(x, (entry) => entry.selectorGroup());

const combineRuntimeSheetEntries = (
  a: RuntimeSheetEntry[],
  b: RuntimeSheetEntry[],
): RuntimeSheetEntry[] => {
  return RA.union([...a], [...b]);
};

export const getChildRuntimeEntries = (
  runtimeEntries: RuntimeComponentEntry[],
): ChildsSheet => {
  return pipe(
    runtimeEntries,
    RA.map((runtimeEntry) => runtimeEntry.rawSheet),
    RA.reduce(emptyChildsSheet, (prev, current) =>
      Record.union(prev, current, combineRuntimeSheetEntries),
    ),
  );
};

export const getGroupedEntries = (runtime: RuntimeSheetEntry[]): RuntimeGroupSheet => {
  return pipe(
    runtime,
    sortSheetEntries,
    RA.filter((entry) => entry.declarations.length > 0),
    groupEntriesBySelectorGroup,
    (entry) => {
      return {
        base: entry.base ?? [],
        dark: entry.dark ?? [],
        pointer: entry.pointer ?? [],
        group: entry.group ?? [],
        even: entry.even ?? [],
        first: entry.first ?? [],
        last: entry.last ?? [],
        odd: entry.odd ?? [],
      };
    },
  );
};

/** @category Filters */
export const applyParentEntries = (
  currentEntries: RuntimeComponentEntry[],
  parentEntries: ChildsSheet,
  order: number,
  parentChildsNumber: number,
): RuntimeComponentEntry[] => {
  return pipe(
    currentEntries,
    RA.map((entry): RuntimeComponentEntry => {
      const newSheet = entry.rawSheet;
      if (order === 0) {
        newSheet.base.push(...parentEntries.first);
      }
      if (order + 1 === parentChildsNumber) newSheet.base.push(...parentEntries.last);
      if ((order + 1) % 2 === 0) newSheet.base.push(...parentEntries.even);
      if ((order + 1) % 2 !== 0) newSheet.base.push(...parentEntries.odd);
      return {
        ...entry,
        rawSheet: { ...newSheet },
      };
    }),
  );
};

/** @category Filters */
export function getSheetMetadata(
  entries: RuntimeSheetEntry[],
): ComponentSheet['metadata'] {
  return pipe(
    entries,
    RA.reduce(defaultSheetMetadata, (prev, current) => {
      const group = current.selectorGroup();
      if (!prev.isGroupParent && current.className === 'group') {
        prev.isGroupParent = true;
      }
      if (!prev.hasPointerEvents && group === 'pointer') {
        prev.hasPointerEvents = true;
      }
      if (!prev.hasGroupEvents && group === 'group') {
        prev.hasGroupEvents = true;
      }
      return prev;
    }),
  );
}

export const runtimeEntriesToFinalSheet = (entries: RuntimeSheetEntry[]): FinalSheet =>
  pipe(
    entries,
    RA.reduce(defaultFinalSheet, (prev, current) => {
      const nextDecl = current.styles;
      if (!nextDecl) return prev;

      const group = current.selectorGroup();
      if (nextDecl.transform && prev[group].transform) {
        nextDecl.transform = [...(prev[group].transform as any), ...nextDecl.transform];
      }
      Object.assign(prev[group], nextDecl);
      return prev;
    }),
  );

export const getRawSheet = (sheets: RuntimeComponentEntry[]) =>
  pipe(
    sheets,
    RA.map((prop) => {
      return {
        ...prop,
        rawSheet: {
          ...prop.rawSheet,
          even: [],
          first: [],
          last: [],
          odd: [],
        },
      };
    }),
  );
