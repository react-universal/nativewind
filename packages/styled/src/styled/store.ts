import {
  type ValidGroupPseudoSelector,
  type ValidInteractionPseudoSelector,
  createStyledContext,
  defaultGroupState,
} from '@native-twin/css';
import { createStore } from '@native-twin/helpers';
import { Appearance, Dimensions, PixelRatio, Platform } from 'react-native';
import type { RegisteredComponent } from '../types/styled.types.js';

const createComponent = (id: string, groupID: string) => {
  return new Proxy<RegisteredComponent>(
    {
      interactionState: {
        'group-active': false,
        'group-focus': false,
        'group-hover': false,
        group: false,
        active: false,
        focus: false,
        hover: false,
      },
      groupID,
      id,
    },
    {
      get(target, key: keyof RegisteredComponent) {
        return target[key];
      },
      set(target, key: keyof RegisteredComponent, value) {
        target[key] = value;
        return true;
      },
    },
  );
};

const { width, height } = Dimensions.get('screen');

export const globalStore = createStore({
  components: {} as Record<string, RegisteredComponent>,
  context: createStyledContext(
    {
      rem: 16,
      vh: height,
      vw: width,
    },
    Appearance.getColorScheme(),
    PixelRatio.getPixelSizeForLayoutSize(width),
    PixelRatio.getFontScale(),
    Platform.OS,
  ),
});

export type GlobalStore = ReturnType<(typeof globalStore)['getState']>;

export const registerComponent = (input: { id: string; groupID: string }) => {
  const check = globalStore.getState().components[input.id];
  if (check) {
    return check;
  }
  const component = createComponent(input.id, input.groupID);
  globalStore.setState((prevState) => {
    prevState.components[component.id] = {
      ...component,
    };
    return prevState;
  });
  return globalStore.getState().components[input.id]!;
};

export const getParentComponentState = (parentID: string) => {
  const check = globalStore.getState().components[parentID];
  if (check) {
    return check.interactionState;
  }
  return defaultGroupState;
};

export function setComponentInteractionState(
  id: string,
  interaction: ValidInteractionPseudoSelector | ValidGroupPseudoSelector,
  value: boolean,
) {
  const components = globalStore.getState().components;
  const check = components[id];
  if (check) {
    globalStore.setState((prevState) => {
      prevState.components[id] = {
        ...check,
        interactionState: {
          ...check.interactionState,
          [interaction]: value,
        },
      };
      return prevState;
    });
  }
}
