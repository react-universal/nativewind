import type { __Theme__ } from '@native-twin/core';
import { StyleSheetAdapter } from '@native-twin/core';
import type { AnyStyle, SheetEntry } from '@native-twin/css';
import type { RuntimeSheetDeclaration, TwinInjectedProp } from '@native-twin/css/jsx';
import type { Atom } from '@native-twin/helpers/react';
import { StyleSheet as NativeSheet } from 'react-native';
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
  twinFn = tw as any;

  constructor(debug: boolean) {
    super(debug);
  }

  toNativeStyles(entries: SheetEntry[]): AnyStyle {
    return {};
  }
  toRuntimeDecls(entries: SheetEntry[]): RuntimeSheetDeclaration[] {
    return [];
  }

  registerComponent(id: string, injected: TwinInjectedProp, _: any, __: any) {
    if (!injected) return;
    if (Array.isArray(injected)) return;

    console.log('StyleSheet.registerComponent args: ', injected);
    const result = this.get(injected.id);
    console.debug('RESULT: ', result);
  }
}

export const StyleSheet = new JSXStyleSheet(true);
