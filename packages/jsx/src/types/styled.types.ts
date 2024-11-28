import type {
  ClassicComponentClass,
  ComponentClass,
  ComponentProps,
  ForwardRefExoticComponent,
  FunctionComponent,
  JSXElementConstructor,
} from 'react';
import type {
  AnyStyle,
  CompleteStyle,
  ValidGroupPseudoSelector,
  ValidInteractionPseudoSelector,
} from '@native-twin/css';
import { Atom } from '@native-twin/helpers/react';
import { createComponentSheet } from '../sheet/StyleSheet.js';

export interface RegisteredComponent {
  id: string;
  groupID: string;
  interactionState: Record<
    ValidInteractionPseudoSelector | ValidGroupPseudoSelector,
    boolean
  >;
}

type InteractionState = RegisteredComponent['interactionState'];

export type ComponentInteractionState = {
  [K in keyof InteractionState]: Atom<InteractionState[K]>;
};

export type StyledComponentSheet = ReturnType<typeof createComponentSheet>;

//** Used */
export interface StyledComponentState {
  refs: {
    props: Record<string, any> | null;
    // variables: Record<string, any>;
  };
  interaction: Partial<ComponentInteractionState>;
  rerender(): void;
  // upgrades: {
  //   animated?: number;
  //   variables?: number;
  //   parents?: number;
  //   pressable?: number;
  //   canWarn?: boolean;
  // };
  // propStates: ReturnType<typeof createPropState>[];
}

export type StyledSubscription = 'vh' | 'vw' | 'rem' | 'em' | 'appearance';

export type ComponentConfig = {
  target: string;
  source: string;
  nativeStyleToProp?: NativeStyleToProp<any>;
};

/** Used */
export type ReactComponent<P = any> =
  | ClassicComponentClass<P>
  | ComponentClass<P>
  | FunctionComponent<P>
  | ForwardRefExoticComponent<P>;

export type StylableComponentConfigOptions<
  T extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>,
> = Record<string, ComponentClassNamePropConfig<ComponentProps<T>>>;

export type ComponentClassNamePropConfig<P> =
  | undefined
  | boolean
  | (keyof P & string)
  | {
      target: (keyof P & string) | boolean;
      nativeStyleToProp?: NativeStyleToProp<P>;
    };

export type NativeStyleToProp<P> = {
  [K in keyof CompleteStyle & string]?: K extends keyof P
    ? (keyof P & string) | true
    : keyof P & string;
};

export type PropState = ComponentConfig & {
  // upgrades: StyledComponentState['upgrades'];
  refs: StyledComponentState['refs'];
  interaction: StyledComponentState['interaction'];
  testID?: string;

  props?: Record<string, any>;

  classNames?: string;

  sheet: StyledComponentSheet | null;
  currentStyles: AnyStyle;

  // declarationEffect: Effect;
  // styleEffect: Effect;
};

export type NativeTwinGeneratedProps<T extends StylableComponentConfigOptions<any>> = {
  [K in keyof T as K extends string
    ? T[K] extends undefined | false
      ? never
      : T[K] extends true | string
        ? K
        : T extends {
              target: string | boolean;
            }
          ? T['target'] extends true | string
            ? K
            : never
          : never
    : never]?: string;
};
