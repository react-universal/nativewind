import * as CodeBlockWriter from 'code-block-writer';
import type { RuntimeComponentEntry } from '@native-twin/css/jsx';
import { expressionFactory } from './writer.factory.js';

const runtimeEntryToCode = (
  id: string,
  entry: RuntimeComponentEntry,
  produceTemplateFn = false,
) => {
  const w = expressionFactory(new CodeBlockWriter.default());
  let templateEntries: null | string = null;
  if (
    entry.templateLiteral !== null &&
    entry.templateLiteral.length > 0 &&
    entry.templateLiteral.replaceAll(/`/g, '').length > 0
  ) {
    if (produceTemplateFn) {
      templateEntries = `(x) => runtimeTW(x)`;
    } else {
      templateEntries = `runtimeTW(${entry.templateLiteral})`;
    }
  }

  w.writer.block(() => {
    w.writer.writeLine(`id: "${id}",`);
    w.writer.writeLine(`target: "${entry.target}",`);
    w.writer.writeLine(`prop: "${entry.prop}",`);
    w.writer.write(`entries: `);
    w.array(entry.entries).write(',');
    if (produceTemplateFn) {
      w.writer.writeLine(`templateLiteral: (x) => x,`);
    } else {
      w.writer.writeLine(`templateLiteral: ${entry.templateLiteral},`);
    }
    w.writer.writeLine(`templateEntries: ${templateEntries},`);
    w.writer.write(`rawSheet: `);
    w.object(entry.rawSheet).write(',');
  });
  return w.writer.toString();
};

const runtimeEntriesToCode = (
  id: string,
  entries: RuntimeComponentEntry[],
  produceTemplateFn = false,
) => {
  const result = entries
    .map((x) => runtimeEntryToCode(id, x, produceTemplateFn))
    .join(',');
  // console.log('RESULT: ', result);
  return `[${result}]`;
};

export const entriesToComponentData = (
  id: string,
  entries: RuntimeComponentEntry[],
  produceTemplateFn = false,
) => {
  return runtimeEntriesToCode(id, entries, produceTemplateFn);
};
