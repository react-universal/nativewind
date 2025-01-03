import {
  type RuntimeSheetDeclaration,
  SheetEntryHandler,
  type TwinInjectedProp,
} from '@native-twin/css/jsx';
import { asArray } from '@native-twin/helpers';
import { useAtomValue } from '@native-twin/helpers/react';
import { useMemo } from 'react';
import { StyleSheet } from '../../sheet/StyleSheet.js';
import { tw } from '../../sheet/native-tw.js';
import { styledContext } from '../../store/observables';
import type { JSXInternalProps } from '../../types/jsx.types.js';
// import { ComponentTemplateEntryProp } from '../../types/jsx.types.js';
import type { ComponentConfig } from '../../types/styled.types.js';
import { composeDeclarations } from '../../utils/sheet.utils.js';

// import { templatePropsToSheetEntriesObject } from '../native/utils/native.maps.js';

export const useStyledProps = (
  id: string,
  props: JSXInternalProps,
  configs: ComponentConfig[],
) => {
  const compiledSheet: TwinInjectedProp | null = props?.['_twinInjected'] ?? null;

  // const templateEntries: ComponentTemplateEntryProp[] = props?.[
  //   '_twinComponentTemplateEntries'
  // ] as ComponentTemplateEntryProp[];
  // const _debug: boolean = props?.['debug'] ?? false;

  // const templateEntriesObj = templatePropsToSheetEntriesObject(templateEntries ?? []);

  const styledCtx = useAtomValue(styledContext);

  const componentStyles = useMemo(() => {
    if (compiledSheet) {
      console.log('COMPILED_SHEET: ', compiledSheet);
      const registered = StyleSheet.registerComponent(
        id,
        compiledSheet,
        styledCtx,
        false,
      );

      // @ts-expect-error
      if (registered) {
        return registered;
      }
    }
    const entries = configs.flatMap((config): any[] => {
      const source = props[config.source];

      if (!source) {
        return [];
      }
      const compiledEntries = tw(`${source}`).map((entry): SheetEntryHandler => {
        return new SheetEntryHandler(
          {
            animations: [],
            className: entry.className,
            preflight: false,
            declarations: entry.declarations.map(
              (decl): RuntimeSheetDeclaration => ({
                _tag: 'NOT_COMPILED',
                prop: decl.prop,
                value: composeDeclarations([decl], styledCtx),
                isUnitLess: false,
                reason: 'Unknown',
                valueType: 'RAW',
              }),
            ),
            important: entry.important,
            precedence: entry.precedence,
            selectors: entry.selectors,
          },
          {
            baseRem: styledCtx.units.rem,
            platform: styledCtx.platform,
          },
        );
      });
      return asArray({
        classNames: source,
        entries: compiledEntries,
        prop: config.source,
        // rawSheet: getGroupedEntries(compiledEntries),
        templateEntries: [],
        target: config.target,
        templateLiteral: null,
      });
    });

    // @ts-expect-error
    const component = StyleSheet.registerComponent(id, entries, styledCtx, false);
    return component;
  }, [styledCtx, id, configs, props, compiledSheet]);

  // useEffect(() => {
  //   // @ts-expect-error
  //   if (StyleSheet.getFlag('STARTED') === 'NO') {
  //     if (tw.config) {
  //       // @ts-expect-error
  //       StyleSheet[INTERNAL_RESET](tw.config);
  //     }
  //     const obs = tw.observeConfig((c) => {
  //       if (!c?.root) return;
  //       // @ts-expect-error
  //       StyleSheet[INTERNAL_RESET](c);
  //     });
  //     return () => obs();
  //   }
  //   return () => {};
  // }, []);

  return { componentStyles, styledCtx };
};
