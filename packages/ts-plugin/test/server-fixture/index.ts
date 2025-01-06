import { fork } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const logFile = path.join(__dirname, 'log.log');

if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, '', 'utf-8');
}

class TSServer {
  responses: any[] = [];
  _exitPromise: Promise<any>;
  _pendingResponses: number;
  _isClosed: boolean;
  _server: any;
  _seq: number;
  constructor(project: any, pluginName: string) {
    const tsserverPath = path.join(
      __dirname,
      '..',
      '..',
      '..',
      '..',
      'node_modules',
      'typescript',
      'lib',
      'tsserver',
    );
    console.log('PRO: ', project);
    const server = fork(
      tsserverPath,
      [
        '--logVerbosity',
        'normal',
        '--logFile',
        logFile,
        '--pluginProbeLocations',
        project,
        '--globalPlugins',
        pluginName,
      ],
      {
        cwd: project,
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        execArgv: [`--inspect=${5999}`],
      },
    );
    this._exitPromise = new Promise((resolve, reject) => {
      server.on('exit', (code) => resolve(code));
      server.on('error', (reason) => reject(reason));
    });
    server.stdout?.setEncoding('utf-8');

    readline
      .createInterface({
        input: server.stdout!,
      })
      .on('line', (line) => {
        if (line[0] !== '{') {
          return;
        }
        try {
          const result = JSON.parse(line);
          if (result.type === 'response') {
            this.responses.push(result);
            --this._pendingResponses;

            if (this._pendingResponses <= 0 && this._isClosed) {
              this._shutdown();
            }
          }
        } catch {
          // noop
        }
      });

    this._isClosed = false;
    this._server = server;
    this._seq = 0;
    this.responses = [];
    this._pendingResponses = 0;
  }

  send(command: any, responseExpected: any) {
    if (this._isClosed) {
      throw new Error('server is closed');
    }
    if (responseExpected) {
      ++this._pendingResponses;
    }
    const seq = ++this._seq;
    const req = JSON.stringify(Object.assign({ seq: seq, type: 'request' }, command)) + '\n';
    this._server.stdin.write(req);
  }

  sendCommand(name: string, args: any) {
    this.send({ command: name, arguments: args }, true);
  }

  close() {
    if (!this._isClosed) {
      this._isClosed = true;
      if (this._pendingResponses <= 0) {
        this._shutdown();
      }
    }
    return this._exitPromise;
  }

  _shutdown() {
    this._server.stdin.end();
  }
}

export default function createServer(project?: any, pluginName = '@native-twin/ts-plugin') {
  return new TSServer(project || 'project-fixture', pluginName);
}
