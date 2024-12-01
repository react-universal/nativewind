import { Platform } from 'react-native';
import {
  compileSheetEntry,
  getGroupedEntries,
  sortSheetEntriesByPrecedence,
  type RuntimeGroupSheet,
} from '@native-twin/css/jsx';
import { componentsRegistry, StyleSheet } from '../sheet/StyleSheet.js';
import { remObs, styledContext } from '../store/observables/index.js';
import type { JSXInternalProps } from '../types/jsx.types.js';

export function jsxStyles(props: JSXInternalProps | null | undefined, type: any) {
  const componentSheet = props?.['_twinComponentSheet'];
  const componentID = props?.['_twinComponentID'];
  console.log('RUNTIME: ', componentSheet, componentID);
  if (componentID && componentSheet) {
    let finalEntries = componentSheet;
    if (
      finalEntries.some(
        (x) => Array.isArray(x.templateEntries) && x.templateEntries.length > 0,
      )
    ) {
      finalEntries = componentSheet.map((componentEntry) => {
        if (componentEntry.templateEntries) {
          const compiledTemplates = componentEntry.templateEntries.map((y) =>
            compileSheetEntry(y, {
              baseRem: remObs.get(),
              platform: Platform.OS,
            }),
          );

          const mergedEntries = [...componentEntry.entries, ...compiledTemplates];
          const templateRawSheet = getGroupedEntries(compiledTemplates);
          const rawSheet = mergeSheets(componentEntry.rawSheet, templateRawSheet);
          return {
            ...componentEntry,
            entries: mergedEntries,
            rawSheet: rawSheet,
          };
        }

        return componentEntry;
      });
      // console.log('BEFORE: ', props['_twinComponentSheet'].map(x => x.entries));

      props['_twinComponentSheet'] = finalEntries;
    }
    // console.log('AFTER: ', props['_twinComponentSheet'].map(x => x.entries));

    const component = StyleSheet.registerComponent(
      componentID,
      props['_twinComponentSheet'],
      styledContext.get(),
    );

    if (component) {
      componentsRegistry.set(componentID, {
        ...component,
        sheets: [...component.sheets],
      });
    }
  }
}

const mergeSheets = (a: RuntimeGroupSheet, b: RuntimeGroupSheet): RuntimeGroupSheet => {
  return {
    base: [...a.base, ...b.base].sort(sortSheetEntriesByPrecedence),
    pointer: [...a.pointer, ...b.pointer].sort(sortSheetEntriesByPrecedence),
    dark: [...a.dark, ...b.dark].sort(sortSheetEntriesByPrecedence),
    group: [...a.group, ...b.group].sort(sortSheetEntriesByPrecedence),
    first: [...a.first, ...b.first].sort(sortSheetEntriesByPrecedence),
    last: [...a.last, ...b.last].sort(sortSheetEntriesByPrecedence),
    even: [...a.even, ...b.even].sort(sortSheetEntriesByPrecedence),
    odd: [...a.odd, ...b.odd].sort(sortSheetEntriesByPrecedence),
  };
};
