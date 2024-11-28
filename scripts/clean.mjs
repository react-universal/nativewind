import * as Glob from 'glob';
import * as Fs from 'node:fs';
import path from 'node:path';
import { inspect } from 'node:util';

const dirs = ['.', ...Glob.sync('packages/*/'), ...Glob.sync('packages/dev-tools/*/')];

const filesToDelete = dirs.flatMap((pkg) => {
  const files = [
    '.tsbuildinfo',
    'docs',
    'build',
    'dist',
    '.turbo',
    '.nx',
    '.expo',
    '.rollup.cache',
  ];

  return files.flatMap((file) => {
    if (pkg === '.' && file === 'docs') return [];
    const toDelete = path.join(pkg, file);
    if (!Fs.existsSync(toDelete)) {
      console.warn('NOT_EXISTS: ', toDelete);
      return [];
    }
    // Fs.rmSync(toDelete, { recursive: true, force: true }, () => {
    // });
    return [toDelete];
  });
});

console.log('FILES_TO_DELETE: ');
console.debug(inspect(filesToDelete, false, null, true));

filesToDelete.forEach((x) => Fs.rmSync(x, { recursive: true, force: true }));
