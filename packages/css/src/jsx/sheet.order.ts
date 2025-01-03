import type { SheetEntryHandler } from './SheetEntry';

/**
 * @description internal
 * @category Orders
 * */
const sheetEntriesOrderByPrecedence = (a: SheetEntryHandler, b: SheetEntryHandler) =>
  a.precedence === b.precedence ? 0 : a.precedence < b.precedence ? -1 : 1;

/**
 * @description internal
 * @category Orders
 * */
/** @category Orders */
const sheetEntriesByImportant = (a: SheetEntryHandler, b: SheetEntryHandler) =>
  a.important === b.important ? 0 : a.important < b.important ? -1 : 1;

/** @category Orders */
export const sortSheetEntries = (a: SheetEntryHandler, b: SheetEntryHandler) => {
  const first = sheetEntriesOrderByPrecedence(a, b);
  if (first !== 0) return first;
  return sheetEntriesByImportant(a, b);
};

/** @category Orders */
export const sortSheetEntriesArray = (entries: SheetEntryHandler[]) =>
  entries.sort(sortSheetEntries);
