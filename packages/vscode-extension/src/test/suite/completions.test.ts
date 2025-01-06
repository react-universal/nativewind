import * as assert from 'assert';
import { suiteTeardown } from 'mocha';
import * as vscode from 'vscode';
import { executeCompletionAtPosition } from '../commands.js';
import { type Fixture, createFixture } from '../fixtures.js';
import { sleep, startTestFile } from '../helpers.js';

suite('Should do completion', () => {
  suiteTeardown((done) => {
    vscode.window.showInformationMessage('All tests done!');
    sleep(2000).then(done);
  });

  const testFile = startTestFile('index.ts');
  test('Completes css`` helper', async () => {
    const document = await testFile;
    const fixture = await createFixture({
      document,
      position: new vscode.Position(0, 12),
      text: 'css`bg-red-2`',
    });
    return testCompletion(fixture, (list) => [
      assert.equal(list.items.length, 1),
      assert.ok(
        list.items.some(
          (x) => typeof x.label !== 'string' && x.label.label === 'bg-red-200',
        ),
      ),
    ]);
  });

  test('Completes full colors list', async () => {
    const document = await testFile;
    const fixture = await createFixture({
      document,
      position: new vscode.Position(0, 7),
      text: 'css`bg-`',
    });
    return testCompletion(fixture, (list) => {
      return [assert.equal(list.items.length, 354)];
    });
  });

  test('Completes full classNames list', async () => {
    const document = await testFile;
    const position = new vscode.Position(0, 4);
    const fixture = await createFixture({
      document,
      position,
      text: 'css``',
    });
    return testCompletion(fixture, (list) => {
      return [assert.equal(list.items.length, 5580)];
    });
  });
});

async function testCompletion(
  fixture: Fixture,
  assertions: (list: vscode.CompletionList) => void[],
) {
  // Executing the command `vscode.executeCompletionItemProvider` to simulate triggering completion
  const completionsList = await executeCompletionAtPosition(
    fixture.document.uri,
    fixture.position,
  );
  assertions(completionsList);
}
