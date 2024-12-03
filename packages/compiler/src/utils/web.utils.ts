import { sheetEntriesToCss, SheetEntry } from '@native-twin/css';

export const getTwinWebOutput = (entries: SheetEntry[]) => sheetEntriesToCss(entries, false);
