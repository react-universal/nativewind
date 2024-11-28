import type {
  AnyStyle,
  FinalSheet,
  GetChildStylesArgs,
  SelectorGroup,
  SheetInteractionState,
} from '@native-twin/css';
import { StyleSheet as NativeSheet } from 'react-native';
import type { __Theme__, TailwindConfig } from '@native-twin/core';
import type {
  ComponentSheet,
  RegisteredComponent,
  RuntimeComponentEntry,
  RuntimeSheetEntry,
} from '@native-twin/css/jsx';
import { Atom, atom } from '@native-twin/helpers/react';
import { type StyledContext, remObs, styledContext } from '../store/observables/index.js';
import { globalStyles } from '../store/styles.store.js';
import type { ComponentConfig } from '../types/styled.types.js';
import { INTERNAL_FLAGS, INTERNAL_RESET } from '../utils/constants.js';
import { getSheetEntryStyles, sheetEntriesToStyles } from '../utils/sheet.utils.js';
import { tw } from './native-tw.js';

export const componentsRegistry: Map<string, RegisteredComponent> = new Map();
const componentsState: Map<string, Atom<ComponentState>> = new Map();

export interface TwinStyleSheet {
  [INTERNAL_RESET](tw?: TailwindConfig<__Theme__>): void;
  [INTERNAL_FLAGS]: Record<string, string>;
  getFlag(name: string): string | undefined;
  getGlobalStyle(name: string): Atom<RuntimeSheetEntry> | undefined;
  entriesToFinalSheet(entries: RuntimeSheetEntry[]): FinalSheet;
  getComponentByID(id: string): RegisteredComponent | undefined;
  registerComponent(
    id: string,
    props: RuntimeComponentEntry[],
    context: StyledContext,
    sameClasses?: boolean,
  ): RegisteredComponent;
  getComponentState(id: string): Atom<ComponentState>;
}

export interface ComponentState {
  isGroupActive: boolean;
  isLocalActive: boolean;
}

export interface ComponentConfigProps extends ComponentConfig {
  className: string;
}

const internalSheet: TwinStyleSheet = {
  [INTERNAL_FLAGS]: {
    STARTED: 'NO',
  },
  [INTERNAL_RESET](twConfig) {
    globalStyles.clear();
    const config = twConfig ?? tw.config;
    // twinConfigObservable.set(config);
    const rootConfig = config.root ?? tw.config.root;
    if (rootConfig) {
      remObs.set(rootConfig.rem ?? 16);
    }
    this[INTERNAL_FLAGS]['STARTED'] = 'YES';
  },
  getFlag(name: string) {
    return this[INTERNAL_FLAGS][name];
  },
  getGlobalStyle(name) {
    return globalStyles.get(name);
  },
  entriesToFinalSheet(entries) {
    return getSheetEntryStyles(entries, styledContext.get());
  },
  getComponentByID(id: string) {
    return componentsRegistry.get(id);
  },
  registerComponent(id, props, context, sameClasses = true) {
    const component = componentsRegistry.get(id);

    if (component && sameClasses) {
      component.sheets = component.sheets.map((x) => x.recompute(x.compiledSheet));
      return component;
    }

    const sheets: ComponentSheet[] = [];
    for (const style of props ?? []) {
      sheets.push(
        createComponentSheet(
          style.target,
          style,
          context ?? styledContext.get(),
          style.prop,
        ),
      );
    }

    const registerComponent: RegisteredComponent = {
      id,
      prevProps: {},
      sheets,
      metadata: {
        isGroupParent: sheets.some((x) => x.metadata.isGroupParent),
        hasGroupEvents: sheets.some((x) => x.metadata.hasGroupEvents),
        hasPointerEvents: sheets.some((x) => x.metadata.hasPointerEvents),
        hasAnimations: sheets.some((x) => x.metadata.hasAnimations),
      },
    } as RegisteredComponent;
    componentsRegistry.set(id, registerComponent);
    if (!componentsState.has(id)) {
      componentsState.set(id, atom({ isGroupActive: false, isLocalActive: false }));
    }
    return componentsRegistry.get(id)!;
  },
  getComponentState(id) {
    const component = componentsState.get(id);

    return component!;
  },
};

export const StyleSheet = Object.assign({}, internalSheet, NativeSheet);

export function createComponentSheet(
  prop: string,
  compiledSheet: RuntimeComponentEntry,
  ctx?: StyledContext,
  target?: string,
): ComponentSheet {
  const rawEntries = compiledSheet.entries ?? [];
  const context = ctx ?? styledContext.get();
  const tuples = Object.entries(compiledSheet.rawSheet).map(
    ([group, entry]) =>
      [group as SelectorGroup, sheetEntriesToStyles(entry, context)] as const,
  );
  const tuplesObject = Object.fromEntries(tuples) as FinalSheet;
  const sheet = { ...tuplesObject };
  const base = sheet.base;
  if (context.colorScheme === 'dark') {
    Object.assign({ ...base }, { ...sheet.dark });
  }

  let metadata = {
    isGroupParent: compiledSheet.entries.some((x) => x.className === 'group'),
    hasGroupEvents: Object.keys(sheet.group)?.length > 0,
    hasPointerEvents: Object.keys(sheet.pointer)?.length > 0,
    hasAnimations: rawEntries.some((x) => x.animations.length > 0),
  };
  return {
    prop,
    target: target ?? prop,
    getStyles,
    sheet,
    compiledSheet,
    getChildStyles,
    recompute: (compiledSheet$) => {
      compiledSheet = { ...compiledSheet$ };
      return createComponentSheet(
        prop,
        compiledSheet$,
        styledContext.get(),
        target ?? prop,
      );
    },
    metadata: { ...metadata },
  };

  function getStyles(
    input: Partial<SheetInteractionState>,
    templateEntries: RuntimeSheetEntry[] = [],
  ) {
    const templateFinal = StyleSheet.entriesToFinalSheet(templateEntries);
    const styles: AnyStyle = { ...sheet.base, ...templateFinal.base };
    if (input.dark) {
      Object.assign(styles, { ...sheet.dark, ...templateFinal.dark });
    }
    if (input.isPointerActive) {
      Object.assign(styles, { ...sheet.pointer, ...templateFinal.pointer });
    }
    if (input.isParentActive) {
      Object.assign(styles, { ...sheet.group, ...templateFinal.group });
    }

    return styles;
  }

  function getChildStyles(input: Partial<GetChildStylesArgs>) {
    const result: AnyStyle = {};
    if (input.isFirstChild) {
      Object.assign(result, sheet.first);
    }
    if (input.isLastChild) {
      Object.assign(result, sheet.last);
    }
    if (input.isEven) {
      Object.assign(result, sheet.even);
    }
    if (input.isOdd) {
      Object.assign(result, sheet.odd);
    }
    return Object.freeze(result);
  }
}

export type ComponentSheetHandler = ReturnType<typeof createComponentSheet>;

export const intersectConfigProps = (
  props: Record<string, any>,
  configs: ComponentConfig[],
): ComponentConfigProps[] => {
  const styledProps: ComponentConfigProps[] = [];
  if (props && configs) {
    for (const config of configs) {
      const source = props?.[config.source];
      if (!source) continue;

      if (source) {
        styledProps.push({
          ...config,
          className: source,
        });
      }
    }
  }
  return styledProps;
};
