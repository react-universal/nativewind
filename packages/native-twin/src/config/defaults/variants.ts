import { normalize } from '@native-twin/css';
import type { Variant } from '../../types/config.types.js';

export const defaultVariants: Variant[] = [
  ['focus-within', '&:focus-within'],
  ['hover', '&:hover'],
  ['focus', '&:focus'],
  ['(ios|android|web)', ({ 1: $1 }) => `&:${$1}`],
  ['focus-visible', '&:focus-visible'],
  [
    '((group|peer)(~[^-[]+)?)(-\\[(.+)]|[-[].+?)(\\/.+)?',
    ({ 2: type, 3: name = '', 4: $4, 5: $5 = '', 6: label = name }, { v }) => {
      const selector = normalize($5) || ($4![0] == '[' ? $4 : (v($4!.slice(1)) as string));
      return `${(selector!.includes('&') ? selector : '&' + selector)!.replace(
        /&/g,
        `.${type + label}`,
      )}${type![0] == 'p' ? '~' : ' '}&`;
    },
  ],
  ['active', '&:active'],
  ['enabled', '&:enabled'],
  ['disabled', '&:disabled'],
  ['(first-(letter|line)|placeholder|backdrop|before|after)', ({ 1: $1 }) => `&::${$1}`],
];
