import path from 'path';
import { expect, it, describe } from 'vitest';
import { getFirstResponseOfType, openMockFile } from './_helpers';
import createServer from './server-fixture';

const mockFileName = path.join(__dirname, 'project-fixture', 'main.ts');

const createServerWithMockFile = (fileContents: string) => {
  const server = createServer();
  openMockFile(server, mockFileName, fileContents);
  return server;
};

describe('Completions', () => {
  it('Completions for empty string', async () => {
    const server = createServerWithMockFile('const q = css``');
    server.sendCommand('completions', { file: mockFileName, offset: 15, line: 1 });

    await server.close();
    const completionsResponse = getFirstResponseOfType('completions', server);
    expect(completionsResponse.success).toBeTruthy();
  });

  // it('Completions for partial className', () => {
  //   const server = createServerWithMockFile('const q = css`bg-`');
  //   server.sendCommand('completions', { file: mockFileName, offset: 18, line: 1 });

  //   return server.close().then(() => {
  //     const completionsResponse = getFirstResponseOfType('completions', server);
  //     assert.isTrue(completionsResponse.success);
  //   });
  // });

  // it('Completions for string with some complete classNames', () => {
  //   const server = createServerWithMockFile('const q = css`bg-blue-200 absolute `');
  //   server.sendCommand('completions', { file: mockFileName, offset: 36, line: 1 });

  //   return server.close().then(() => {
  //     const completionsResponse = getFirstResponseOfType('completions', server);
  //     assert.isTrue(completionsResponse.success);
  //   });
  // });
});
