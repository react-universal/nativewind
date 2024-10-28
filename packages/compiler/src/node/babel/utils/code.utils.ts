import CodeBlockWriter from 'code-block-writer';
import type { RuntimeComponentEntry } from '@native-twin/css/jsx';
import { expressionFactory } from './writer.factory';

const runtimeEntryToCode = (
  id: string,
  entry: RuntimeComponentEntry,
  produceTemplateFn = false,
) => {
  const w = expressionFactory(new CodeBlockWriter());
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

// const templateEntryToCode = (id: string, entry: RuntimeComponentEntry) => {
//   if (!entry.templateLiteral) return '';

//   const templateEntries = expressionFactory(new CodeBlockWriter());
//   templateEntries.writer.block(() => {
//     templateEntries.writer.writeLine(`id: "${id}",`);
//     templateEntries.writer.writeLine(`target: "${entry.target}",`);
//     templateEntries.writer.writeLine(`prop: "${entry.prop}",`);
//     templateEntries.writer.writeLine(`entries: runtimeTW(${entry.templateLiteral}),`);
//     templateEntries.writer.writeLine(`templateLiteral: ${entry.templateLiteral},`);
//   });

//   return templateEntries.writer.toString();
// };
// const getTemplateEntriesCode = (id: string, entries: RuntimeComponentEntry[]) => {
//   const w = new CodeBlockWriter();
//   const runtimeEntries = entries
//     .filter((x) => x.templateLiteral !== null && x.templateLiteral.length > 0)
//     .map((x) => templateEntryToCode(id, x))
//     .join(',\n');

//   w.writeLine('[');
//   w.hangingIndent(() => w.write(runtimeEntries));
//   w.writeLine(']');
//   return w.toString();
// };

// return templateEntries.writer.block(() => {
//   templateEntries.writer.write('[');
//   entries
//     .filter((x) => x.templateLiteral !== null)
//     .forEach((x) => {
//       templateEntries.writer.block(() => {
//         templateEntries.writer.writeLine(`id: "${id}",`);
//         templateEntries.writer.writeLine(`target: "${x.target}",`);
//         templateEntries.writer.writeLine(`prop: "${x.prop}",`);
//         templateEntries.writer.writeLine(`entries: runtimeTW(${x.templateLiteral}),`);
//         templateEntries.writer.write(`templateLiteral: ${x.templateLiteral},`);
//       });
//     });
//   templateEntries.writer.write(']');
// });
