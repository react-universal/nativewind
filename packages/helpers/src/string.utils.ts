/* eslint-disable no-control-regex */
/**
 * @description Returns the given value converted to camel-case.
 * @example toCamelCase('padding-top') => 'paddingTop'
 * */
export const toCamelCase = (value: string) =>
  !/[A-Z]/.test(value)
    ? value.replace(/-[^]/g, (capital) => capital.charAt(1).toUpperCase())
    : value;

/**
 * @description Returns the given value converted to kebab-case.
 * @example toHyphenCase('paddingTop') => 'padding-top'
 * */
export const toHyphenCase = (value: string) => {
  if (value.startsWith('Webkit')) {
    value.replace('Webkit', '-webkit');
  }
  if (value.startsWith('Moz')) {
    value.replace('Moz', '-moz');
  }
  if (value.startsWith('Ms')) {
    value.replace('Ms', '-ms');
  }
  return value.includes('-')
    ? value
    : // replace any upper-case letter with a dash and the lower-case variant
      value.replace(/[A-Z]/g, (capital) => `-${capital.toLowerCase()}`);
};

/**
 * @description Returns a filled value with a dash prefix.
 * @param {string} value - The input to be converted to a tail dashed format.
 * @example
 * toTailDashed('padding') => 'padding-'
 * */
export const toTailDashed = (value: string) => (value ? `${value}-` : '');

// Copyright (c) 2016-present Glen Maddern and Maximilian Stoiber

const AD_REPLACER_R = /(a)(d)/gi;

/* This is the "capacity" of our alphabet i.e. 2x26 for all letters plus their capitalised
 * counterparts */
const charsLength = 52;

/* start at 75 for 'a' until 'z' (25) and then start at 65 for capitalised letters */
const getAlphabeticChar = (code: number) =>
  String.fromCharCode(code + (code > 25 ? 39 : 97));

/* input a number, usually a hash and convert it to base-52 */
export function generateAlphabeticName(code: number) {
  let name = '';
  let x;

  /* get a char and divide by alphabet-length */
  for (x = Math.abs(code); x > charsLength; x = (x / charsLength) | 0) {
    name = getAlphabeticChar(x % charsLength) + name;
  }

  return (getAlphabeticChar(x % charsLength) + name).replace(AD_REPLACER_R, '$1-$2');
}

/** Taken from expo */
export function escapeBackticksAndOctals(str: string) {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/[\0-\x07]/g, (match) => `\\0${match.charCodeAt(0).toString(8)}`);
}

export const splitBySpace = (classes: string) => classes.split(/\s+/g);

export function assertString(x: unknown): asserts x is string {
  if (typeof x !== 'string') throw new Error('Value is not defined');
}
