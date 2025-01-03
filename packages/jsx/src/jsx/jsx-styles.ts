// import { Platform } from 'react-native';
import type { JSXInternalProps } from '../types/jsx.types.js';

export function jsxStyles(props: JSXInternalProps | null | undefined, type: any) {
  const componentSheet = props?.['_twinInjected'] as any[] | undefined;
  // console.log('RUNTIME: ', componentSheet, componentID);
  if (componentSheet) {
    console.log("SHEET: ", componentSheet);
    let finalEntries = componentSheet;
    if (
      finalEntries.some(
        (x) => Array.isArray(x.templateEntries) && x.templateEntries.length > 0,
      )
    ) {
      finalEntries = componentSheet.map((componentEntry) => {
        // if (componentEntry.templateEntries) {
        //   const compiledTemplates = componentEntry.templateEntries.map(
        //     (y: any) =>
        //       new SheetEntryHandler(y, {
        //         baseRem: remObs.get(),
        //         platform: Platform.OS,
        //       }),
        //   );

        //   const mergedEntries = [...componentEntry.entries, ...compiledTemplates];
        //   const templateRawSheet = SheetOrders.sortSheetEntriesArray(compiledTemplates);
        //   const rawSheet = mergeSheets(componentEntry.rawSheet, templateRawSheet);
        //   return {
        //     ...componentEntry,
        //     entries: mergedEntries,
        //     rawSheet: rawSheet,
        //   };
        // }

        return componentEntry;
      });
      // console.log('BEFORE: ', props['_twinComponentSheet'].map(x => x.entries));

      // props['_twinComponentSheet'] = finalEntries;
    }
    // console.log('AFTER: ', props['_twinComponentSheet'].map(x => x.entries));

    // const component = StyleSheet.registerComponent(
    //   componentID,
    //   props['_twinComponentSheet'],
    //   styledContext.get(),
    // );

    // if (component) {
    //   componentsRegistry.set(componentID, {
    //     ...component,
    //     sheets: [...component.sheets],
    //   });
    // }
  }
}

// const mergeSheets = (a: any, b: any): any => {
//   return {
//     base: [...a.base, ...b.base].sort(SheetOrders.sortSheetEntries),
//     pointer: [...a.pointer, ...b.pointer].sort(SheetOrders.sortSheetEntries),
//     dark: [...a.dark, ...b.dark].sort(SheetOrders.sortSheetEntries),
//     group: [...a.group, ...b.group].sort(SheetOrders.sortSheetEntries),
//     first: [...a.first, ...b.first].sort(SheetOrders.sortSheetEntries),
//     last: [...a.last, ...b.last].sort(SheetOrders.sortSheetEntries),
//     even: [...a.even, ...b.even].sort(SheetOrders.sortSheetEntries),
//     odd: [...a.odd, ...b.odd].sort(SheetOrders.sortSheetEntries),
//   };
// };
