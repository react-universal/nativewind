import { useEffect, useMemo } from 'react';
import {
  getGroupedEntries,
  RuntimeComponentEntry,
  RuntimeSheetDeclaration,
  RuntimeSheetEntry,
} from '@native-twin/css/jsx';
import { asArray } from '@native-twin/helpers';
import { useAtomValue } from '@native-twin/helpers/react';
import { StyleSheet } from '../../sheet/StyleSheet.js';
import { tw } from '../../sheet/native-tw.js';
import { styledContext } from '../../store/observables/index.js';
// import { ComponentTemplateEntryProp } from '../../types/jsx.types.js';
import { ComponentConfig } from '../../types/styled.types.js';
import { INTERNAL_RESET } from '../../utils/constants.js';
import { composeDeclarations } from '../../utils/sheet.utils.js';

// import { templatePropsToSheetEntriesObject } from '../native/utils/native.maps.js';

export const useStyledProps = (
  id: string,
  props: Record<string, any>,
  configs: ComponentConfig[],
) => {
  const compiledSheet: RuntimeComponentEntry[] | null =
    props?.['_twinComponentSheet'] ?? null;

  // const templateEntries: ComponentTemplateEntryProp[] = props?.[
  //   '_twinComponentTemplateEntries'
  // ] as ComponentTemplateEntryProp[];
  // const _debug: boolean = props?.['debug'] ?? false;

  // const templateEntriesObj = templatePropsToSheetEntriesObject(templateEntries ?? []);

  const styledCtx = useAtomValue(styledContext);

  const componentStyles = useMemo(() => {
    if (compiledSheet) {
      const registered = StyleSheet.registerComponent(
        id,
        compiledSheet,
        styledCtx,
        false,
      );

      if (registered) {
        return registered;
      }
    }
    const entries = configs.flatMap((config): RuntimeComponentEntry[] => {
      const source = props[config.source];

      if (!source) {
        return [];
      }
      const compiledEntries = tw(`${source}`).map((entry): RuntimeSheetEntry => {
        return {
          animations: [],
          className: entry.className,
          preflight: false,
          declarations: entry.declarations.map(
            (decl): RuntimeSheetDeclaration => ({
              _tag: 'NOT_COMPILED',
              prop: decl.prop,
              value: composeDeclarations([decl], styledCtx),
            }),
          ),
          important: entry.important,
          precedence: entry.precedence,
          selectors: entry.selectors,
        };
      });
      return asArray({
        classNames: source,
        entries: compiledEntries,
        prop: config.source,
        rawSheet: getGroupedEntries(compiledEntries),
        templateEntries: [],
        target: config.target,
        templateLiteral: null,
      });
    });

    const component = StyleSheet.registerComponent(id, entries, styledCtx, false);
    return component;
  }, [styledCtx, id, configs, props, compiledSheet]);

  useEffect(() => {
    if (StyleSheet.getFlag('STARTED') === 'NO') {
      if (tw.config) {
        StyleSheet[INTERNAL_RESET](tw.config);
      }
      const obs = tw.observeConfig((c) => {
        if (!c?.root) return;
        StyleSheet[INTERNAL_RESET](c);
      });
      return () => obs();
    }
    return () => {};
  }, []);

  return { componentStyles, styledCtx };
};
