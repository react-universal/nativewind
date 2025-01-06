import { type SheetEntry, getRuleSelectorGroup } from '@native-twin/css';
import { SheetEntryHandler, SheetOrders } from '@native-twin/css/jsx';
import { Platform } from 'react-native';
import { remObs } from '../../../store/observables/index.js';

export const composeTemplateSheets = (entries: SheetEntry[]): any => {
  return entries
    .map(
      (x) =>
        new SheetEntryHandler(x, {
          baseRem: remObs.get(),
          platform: Platform.OS,
        }),
    )
    .reduce(
      (prev, current) => {
        const group = getRuleSelectorGroup(current.selectors);
        prev[group].push(current);
        // console.log('BEFORE: ', prev[group].map((x) => x.className).join(', '));
        prev[group].sort(SheetOrders.sortSheetEntries);
        // console.log('AFTER: ', prev[group].map((x) => x.className).join(', '));

        return prev;
      },
      {
        base: [],
        group: [],
        pointer: [],
        first: [],
        last: [],
        odd: [],
        even: [],
        dark: [],
      } as any,
    );
};

export const templatePropsToSheetEntriesObject = (templates: any[]) => {
  return templates.reduce(
    (prev, current) => {
      if (prev[current.target]) {
        prev[current.target]?.push(...current.entries);
      }
      if (!prev[current.target]) {
        prev[current.target] = current.entries;
      }
      return prev;
    },
    {} as Record<string, any[]>,
  );
};
