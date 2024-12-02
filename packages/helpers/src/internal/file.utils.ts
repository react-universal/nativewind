import { compose } from 'effect/Function';

export function ensureBuffer(file: Buffer | string): Buffer {
  return Buffer.isBuffer(file) ? file : Buffer.from(file);
}

export function matchCss(filename: string): boolean {
  return /\.(s?css|sass)$/.test(filename);
}

export function bufferToString(
  input: Buffer,
  _encoding = 'utf-8',
): string {
  return input.toString('utf-8');
}

export const toBufferThenString = compose(ensureBuffer, bufferToString);

/**
 *  @description Used by expo to create filepaths on the HMR css data-prop
 * */
export function pathToHtmlSafeName(path: string) {
  return path.replace(/[^a-zA-Z0-9_]/g, '_');
}

const newlineRegex = /\r\n?|\n|\u2028|\u2029/g;

export const countLines = (string: string) =>
  (string.match(newlineRegex) || []).length + 1;
