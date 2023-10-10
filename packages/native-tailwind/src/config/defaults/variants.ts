import type { Variant } from '../../types/config.types';

export const defaultVariants: Variant[] = [
  ['focus-within', '&:focus-within'],
  ['hover', '&:hover'],
  ['focus', '&:focus'],
  ['(ios|android|web)', ({ 1: $1 }) => `&:${$1}`],
  ['focus-visible', '&:focus-visible'],
  ['active', '&:active'],
  ['enabled', '&:enabled'],
  ['disabled', '&:disabled'],
  ['(first-(letter|line)|placeholder|backdrop|before|after)', ({ 1: $1 }) => `&::${$1}`],
];
