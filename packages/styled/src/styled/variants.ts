import type { OmitUndefined, StyledComponentProps } from '../types/styled.types.js';

type StringToBoolean<T> = T extends 'true' | 'false' ? boolean : T;

type ConfigSchema = Record<string, Record<string, string>>;

export type VariantProps<Component extends (...args: any) => any> = Omit<
  OmitUndefined<Parameters<Component>[0]>,
  'tw' | 'className'
>;

export type VariantsConfig<T = unknown> = T extends ConfigSchema
  ? {
      base?: string;
      variants?: T;
      defaultVariants?: ConfigVariants<T>;
    }
  : never;

export type ConfigVariants<T> = T extends ConfigSchema
  ? {
      [Variant in keyof T]?: StringToBoolean<keyof T[Variant]> | null;
    }
  : unknown;

type VariantsFnProps<T> = T extends ConfigSchema
  ? ConfigVariants<T> & StyledComponentProps
  : StyledComponentProps;

export const createVariants = <T>(config: VariantsConfig<T>) => {
  return (props?: VariantsFnProps<T>) => {
    if (!config || !config?.variants || config.variants === null) {
      let composed = config.base ?? '';
      if (props?.className) {
        composed += `${composed === '' ? '' : ' '}${props.className}`;
      }
      if (props?.tw) {
        composed += `${composed === '' ? '' : ' '}${props.tw}`;
      }
      return composed.trim();
    }
    const { variants, defaultVariants } = config;
    let variantClassNames = config.base ?? '';
    for (const v in variants ?? {}) {
      const variantProp = props?.[v as keyof typeof props];
      const defaultVariantProp = defaultVariants?.[v];
      const variantKey = (falsyToString(variantProp) ||
        falsyToString(defaultVariantProp)) as keyof (typeof variants)[typeof v];

      const data = variants[v]![variantKey];
      if (data) {
        variantClassNames += ` ${data} `;
      }
    }
    variantClassNames = variantClassNames.trim();

    if (props?.className) {
      variantClassNames += `${variantClassNames === '' ? '' : ' '}${props.className}`;
    }
    if (props?.tw) {
      variantClassNames += `${variantClassNames === '' ? '' : ' '}${props.tw}`;
    }
    return variantClassNames.trim();
  };
};

const falsyToString = <T extends unknown>(value: T) =>
  typeof value === 'boolean' ? `${value}` : value === 0 ? '0' : value;
