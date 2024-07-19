import { StyleSheet as NativeSheet } from 'react-native';
import {
  AnyStyle,
  GetChildStylesArgs,
  SheetEntry,
  SheetInteractionState,
} from '@native-twin/css';
import { Atom, atom } from '@native-twin/helpers';
import {
  StyledContext,
  remObs,
  styledContext,
  twinConfigObservable,
} from '../store/observables';
import { globalStyles } from '../store/styles.store';
import { ComponentConfig } from '../types/styled.types';
import { INTERNAL_FLAGS, INTERNAL_RESET } from '../utils/constants';
import { getSheetEntryStyles } from '../utils/sheet.utils';
import { tw } from './native-tw';
import {
  ComponentConfigProps,
  ComponentSheet,
  RegisteredComponent,
  TwinStyleSheet,
  ComponentState,
} from './sheet.types';

const componentsRegistry: Map<string, RegisteredComponent> = new Map();
const componentsState: Map<string, Atom<ComponentState>> = new Map();

const internalSheet: TwinStyleSheet = {
  [INTERNAL_FLAGS]: {
    STARTED: 'NO',
  },
  [INTERNAL_RESET](twConfig) {
    console.log('INTERNAL_RESET');
    globalStyles.clear();
    const config = twConfig ?? tw.config;
    twinConfigObservable.set(config);
    remObs.set(config.root.rem);
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
  registerComponent(id, props, context) {
    const component = componentsRegistry.get(id);
    if (component) {
      component.sheets = component.sheets.map((x) => x.recompute());
      return component;
    }
    const sheets: ComponentSheet[] = [];
    for (const style of props) {
      if (style.templateLiteral) {
        style.entries.push(...tw(`${style.templateLiteral}`));
      }
      sheets.push(
        createComponentSheet(style.target, style.entries, context ?? styledContext.get()),
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
  entries: SheetEntry[] = [],
  ctx?: StyledContext,
): ComponentSheet {
  const context = ctx ?? styledContext.get();
  const sheet = StyleSheet.create(getSheetEntryStyles(entries, context));
  const base = sheet.base;
  if (context.colorScheme === 'dark') {
    Object.assign({ ...base }, { ...sheet.dark });
  }
  return {
    prop,
    getStyles,
    sheet,
    getChildStyles,
    recompute: () => {
      return createComponentSheet(prop, entries, styledContext.get());
    },
    metadata: {
      isGroupParent: entries.some((x) => x.className == 'group'),
      hasGroupEvents: Object.keys(sheet.group).length > 0,
      hasPointerEvents: Object.keys(sheet.pointer).length > 0,
      hasAnimations: entries.some((x) => x.animations.length > 0),
    },
  };

  function getStyles(input: Partial<SheetInteractionState>) {
    const styles: AnyStyle = { ...sheet.base };
    if (input.dark) Object.assign(styles, { ...sheet.dark });
    if (input.isPointerActive) Object.assign(styles, { ...sheet.pointer });
    if (input.isParentActive) Object.assign(styles, { ...sheet.group });

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
