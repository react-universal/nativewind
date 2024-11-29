import { glob } from 'glob';
import Mocha from 'mocha';

export function run(): Promise<void> {
  // Create the mocha test
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
  });
  mocha.timeout(100000);

  const testsRoot = __dirname;

  return new Promise((resolve, reject) => {
    glob('./**/*/**.test.js', { cwd: testsRoot });
  });
}
