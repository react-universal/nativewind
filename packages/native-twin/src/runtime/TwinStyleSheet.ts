import type { AnyStyle, SheetEntry } from '@native-twin/css';
import type { RuntimeSheetDeclaration, TwinInjectedObject } from '@native-twin/css/jsx';
import { hash } from '@native-twin/helpers';
import type { RuntimeTW, __Theme__ } from '../types/theme.types';

export type StyleSheetProcessor = (entries: SheetEntry[]) => RuntimeSheetDeclaration[];

export abstract class StyleSheetAdapter<Theme extends __Theme__ = __Theme__> {
  abstract twinFn: RuntimeTW<Theme>;
  abstract toRuntimeDecls(entries: SheetEntry[]): RuntimeSheetDeclaration[];
  abstract toNativeStyles(entries: SheetEntry[]): AnyStyle;

  private registry = new Map<string, TwinInjectedObject>();
  private injected = new Map<string, string>();

  constructor(readonly debug: boolean) {}

  get(recordID: string) {
    const injectionID = this.injected.get(recordID);
    if (!injectionID) return undefined;

    return this.registry.get(injectionID);
  }

  target() {
    return this.twinFn.target;
  }

  inject(data: TwinInjectedObject[]) {
    for (const component of data) {
      const key = this.getTwinObjectKey(component);
      const recordID = this.injected.get(component.id);
      if (!this.registry.has(key)) {
        if (recordID) {
          this.remove(component.id);
        }
        this.injected.set(component.id, key);
        this.registry.set(key, component);
      }
    }
  }

  reset() {
    this.injected.clear();
    this.registry.clear();
  }

  remove(injectionID: string) {
    const data = this.injected.get(injectionID);
    if (data) {
      this.injected.delete(injectionID);
      this.registry.delete(data);
      if (this.debug) {
        console.debug('StyleSheet: deleted record', data);
      }
    }
  }

  getTwinObjectKey(data: TwinInjectedObject) {
    const classnames = data.props.map((x) => x.target).join(' ');
    const entries = data.props
      .flatMap((x) => x.entries)
      .map((x) => x.className)
      .join(' ');
    return hash(`${data.id}-${data.index}-${data.parentSize}-${classnames}-${entries}`);
  }
}
