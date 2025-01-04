import type { __Theme__ } from '@native-twin/core';
import { StyleSheetAdapter } from '@native-twin/core';
import { type AnyStyle, type SheetEntry, getRuleSelectorGroup } from '@native-twin/css';
import {
  type RuntimeJSXStyle,
  type RuntimeSheetDeclaration,
  SheetOrders,
  type TwinInjectedObject,
  type TwinInjectedProp,
  compileEntryDeclaration,
} from '@native-twin/css/jsx';
import { type Atom, atom } from '@native-twin/helpers/react';
import { StyleSheet as NativeSheet, Platform } from 'react-native';
import type { ComponentState } from '../store/components.store.js';
import { tw } from './native-tw.js';

export const componentsState: Map<string, Atom<ComponentState>> = new Map();

class JSXStyleSheet extends StyleSheetAdapter<__Theme__> {
  create = NativeSheet.create;
  absoluteFill = NativeSheet.absoluteFill;
  absoluteFillObject = NativeSheet.absoluteFillObject;
  compose = NativeSheet.compose;
  flatten = NativeSheet.flatten;
  hairlineWidth = NativeSheet.hairlineWidth;
  twinFn = tw;

  constructor(debug: boolean) {
    super(debug);
  }

  toNativeStyles(entries: SheetEntry[]): AnyStyle {
    return {};
  }

  toRuntimeDecls(entries: SheetEntry[]): RuntimeSheetDeclaration[] {
    return [];
  }

  getComponentByID(id: string, templates: TwinInjectedProp['templateEntries'] = []) {
    const component = this.get(id) ?? getGenericComponent(id);

    const props = component.props.map(({ prop, entries, target }) => {
      const config = this.twinFn.config;
      const twinFn = this.twinFn;
      const composedEntries = templates
        .flatMap((x) => (x.prop === prop ? twinFn(x.value) : []))
        .map(
          (x): RuntimeJSXStyle => ({
            className: x.className,
            declarations: x.declarations.map((decl) =>
              compileEntryDeclaration(decl, {
                baseRem: config.root.rem,
                platform: Platform.OS,
              }),
            ),
            group: getRuleSelectorGroup(x.selectors),
            important: x.important,
            inherited: false,
            precedence: x.precedence,
          }),
        );

      return {
        prop,
        target,
        entries: [...entries, ...composedEntries].sort((a, b) =>
          SheetOrders.sortSheetEntries(a as any, b as any),
        ),
      };
    });

    return {
      id,
      props,
      metadata: component.metadata,
    };
  }

  getComponentState(id: string) {
    const state = componentsState.get(id);
    if (!state) {
      componentsState.set(
        id,
        atom({
          interactions: { isGroupActive: false, isLocalActive: false },
          meta: {
            hasGroupEvents: false,
            hasPointerEvents: false,
            isGroupParent: false,
          },
        }),
      );
      return componentsState.get(id)!;
    }
    return state;
  }
}

export const StyleSheet = new JSXStyleSheet(true);

const getGenericComponent = (id: string): TwinInjectedObject => ({
  childStyles: [],
  id,
  index: -1,
  metadata: {
    hasGroupEvents: false,
    hasPointerEvents: false,
    isGroupParent: false,
  },
  parentID: 'NO_PARENT',
  parentSize: -1,
  props: [],
});
