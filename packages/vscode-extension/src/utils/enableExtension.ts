import * as vscode from 'vscode';
import type { NativeTwinPluginConfiguration } from '@native-twin/language-service';
import { Constants } from '@native-twin/language-service';
import { Logger, State } from '../types';

export async function __enableExtension(context: vscode.ExtensionContext, log: Logger) {
  const state: State = { hasConfigFile: undefined };

  const update = async () => {
    const localTailwindManifestFiles = await vscode.workspace.findFiles(
      '**/node_modules/@native-twin/preset-tailwind/package.json',
      null,
      1,
    );

    const configFiles = localTailwindManifestFiles.length
      ? []
      : await vscode.workspace.findFiles(
          '**/tailwind.config.{ts,js,mjs,cjs}',
          '**/node_modules/**',
          1,
        );

    let hasConfigFile = false;
    if (localTailwindManifestFiles.length) {
      log(`Using local tailwind config`);
      hasConfigFile = true;
    } else if (configFiles.length) {
      log(`Using builtin tailwind config`);
      hasConfigFile = true;
    } else {
      log(
        `No Native Tailwind package and no tailwind config file found. Not activating tailwind IntelliSense.`,
      );
      hasConfigFile = false;
    }

    if (hasConfigFile !== state.hasConfigFile) {
      state.hasConfigFile = hasConfigFile;
      synchronizeConfiguration(api, state, log);
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(
      `${Constants.configurationSection}.restart`,
      (...args) => {
        state.hasConfigFile = undefined;
        listener();
        console.log('ARGS: ', args);
      },
    ),
  );

  const api = await activateTypescriptPlugin(log);

  const listener = () => {
    update().catch((error) => {
      log(error.stacktrace);
    });
  };

  const replaceClassNameStrings = () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const selection = editor.selection;
      const word = document.getText(selection);
      const replaced = word.replaceAll(/className="([^"].*)"/g, `className={tw\`$1\`}`);
      editor.edit((editBuilder) => {
        editBuilder.replace(selection, replaced);
      });
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand(`${Constants.configurationSection}.className`, () => {
      replaceClassNameStrings();
    }),
  );

  const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  const disposable = vscode.commands.registerCommand(
    'nativeTwin.executeSleep',
    async () => {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve) => {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Searching...',
            cancellable: true,
          },
          async (progress, token) => {
            token.onCancellationRequested(async () => {
              return resolve(false);
            });

            await sleep(10000);

            return resolve(true);
          },
        );
      });
    },
  );
  context.subscriptions.push(disposable);

  await vscode.commands
    .getCommands(true)
    .then((x) => log('COMMANDS: ' + JSON.stringify(x, null)));

  const configWatcher = vscode.workspace.createFileSystemWatcher(
    '**/tailwind.config.{ts,js,mjs,cjs}',
  );

  context.subscriptions.push(configWatcher);
  context.subscriptions.push(configWatcher.onDidCreate(listener));
  context.subscriptions.push(configWatcher.onDidDelete(listener));

  const packageWatcher = vscode.workspace.createFileSystemWatcher(
    '**/{package,package-lock.json,yarn.lock,pnpm-lock.yaml}',
  );

  context.subscriptions.push(packageWatcher);
  context.subscriptions.push(packageWatcher.onDidCreate(listener));
  context.subscriptions.push(packageWatcher.onDidChange(listener));
  context.subscriptions.push(packageWatcher.onDidDelete(listener));

  log('COMMANDS: ' + JSON.stringify(await vscode.commands.getCommands(true), null, 2));
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      Constants.DOCUMENT_SELECTORS,
      {
        provideCompletionItems(document, position, token, context) {
          log('DOC: ' + JSON.stringify({ document, position, token, context }, null, 2));
          return undefined;
        },
        resolveCompletionItem(item, token) {
          log('RESOLVE' + JSON.stringify({ item, token }, null, 2));
          return undefined;
        },
      },
      '`',
    ),
  );

  await update();
}

async function activateTypescriptPlugin(log: Logger) {
  const extension = vscode.extensions.getExtension(Constants.typeScriptExtensionId);
  if (!extension) {
    log(
      `Extension ${Constants.typeScriptExtensionId} not found. No IntelliSense will be provided.`,
    );
    return;
  }

  const ext = await extension.activate();
  if (!ext) {
    log(`can not get the extension activated`);
  }

  const api = extension.exports?.getAPI?.(0);

  if (!api) {
    log(
      `Extension ${Constants.typeScriptExtensionId} did not export an API. No IntelliSense will be provided.`,
    );
    return;
  }

  return api;
}

function synchronizeConfiguration(api: any, state: State, log: Logger) {
  const config = getConfiguration();

  if (config.enable) {
    log(
      'Extension is enabled. To disable, change the `nativeTwin.enable` setting to `false`.',
    );

    if (state.hasConfigFile) {
      log(`Configuring ${Constants.pluginId} using: ${JSON.stringify(config, null, 2)}`);
    } else {
      config.enable = false;
    }
  } else {
    log(
      'Extension is disabled. No IntelliSense will be provided. To enable, change the `nativeTwin.enable` setting to `true`.',
    );
  }

  api.configurePlugin(Constants.pluginId, config);
}

function getConfiguration(): NativeTwinPluginConfiguration {
  const config = vscode.workspace.getConfiguration(Constants.configurationSection);
  const outConfig: NativeTwinPluginConfiguration = {
    functions: ['tw', 'apply', 'css', 'style', 'styled', 'variants', 'createVariants'],
    attributes: ['tw', 'class', 'className', 'variants'],
    debug: false,
    enable: true,
    trace: {
      server: 'off',
    },
  };

  withConfigValue<string[]>(config, 'functions', (tags) => {
    outConfig.functions = tags;
  });

  withConfigValue<string[]>(config, 'attributes', (attributes) => {
    outConfig.attributes = attributes;
  });

  withConfigValue<boolean>(config, 'debug', (debug) => {
    outConfig.debug = debug;
  });

  withConfigValue<boolean>(config, 'enable', (enable) => {
    outConfig.enable = enable;
  });

  return outConfig;
}

function withConfigValue<T>(
  config: vscode.WorkspaceConfiguration,
  key: string,
  withValue: (value: T) => void,
): void {
  const configSetting = config.inspect(key);
  if (!configSetting) {
    return;
  }

  // Make sure the user has actually set the value.
  // VS Code will return the default values instead of `undefined`, even if user has not don't set anything.
  if (
    typeof configSetting.globalValue === 'undefined' &&
    typeof configSetting.workspaceFolderValue === 'undefined' &&
    typeof configSetting.workspaceValue === 'undefined'
  ) {
    return;
  }

  const value = config.get<T | undefined>(key, undefined);
  if (typeof value !== 'undefined') {
    withValue(value);
  }
}
