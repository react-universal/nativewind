import type { RawJSXElementTreeNode } from '@native-twin/css/jsx';
import { createStore } from '@native-twin/helpers';
import * as KeyMap from '@native-twin/helpers/KeyMap';
import { apply, pipe } from 'effect/Function';
import * as Option from 'effect/Option';

export const componentsStore = createStore(KeyMap.make<string, RawJSXElementTreeNode>());

export const setTreeComponent = (node: RawJSXElementTreeNode) =>
  pipe(componentsStore.setState, apply(KeyMap.set(node.id, node)), () =>
    getStoredComponentTree(node),
  );

export const getTreeComponentByKey = (key: string) => {
  return pipe(componentsStore.getState(), KeyMap.get(key));
};

export const unsafeGetTreeComponentByKey = (key: string) => {
  return pipe(componentsStore.getState(), KeyMap.unsafeGet(key));
};

export const getStoredComponentTree = (node: RawJSXElementTreeNode) =>
  getTreeComponentByKey(node.id);

export const getOrSetTreeComponent = (node: RawJSXElementTreeNode) => {
  return pipe(
    getStoredComponentTree(node),
    Option.getOrElse(() =>
      pipe(
        componentsStore.setState,
        apply(KeyMap.set(node.id, node)),
        componentsStore.getState,
        KeyMap.unsafeGet(node.id),
      ),
    ),
  );
};

export const getComponentsSize = () => pipe(componentsStore.getState(), KeyMap.size);
