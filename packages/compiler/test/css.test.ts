// import { Array, HashMap, pipe } from 'effect';
// import { describe, expect, it } from 'vitest';
// import { TwinCSSExtractor } from '../src/programs/css.extractor';
// import { TestRuntime } from './test.utils';

// describe('TwinCSSExtractor program', () => {
//   it('TwinCSSExtractor', async () => {
//     const result = await TestRuntime.runPromise(
//       TwinCSSExtractor(`() => <div className='flex-1' />`, 'test.tsx'),
//     );

//     const treeNodes = pipe(
//       HashMap.values(result.treeNodes),
//       Array.fromIterable,
//       Array.flatMap((x) => x.entries),
//     );

//     console.log('TREE_NODES: ', treeNodes);

//     expect(result.cssOutput).toBe('');
//   });
// });
