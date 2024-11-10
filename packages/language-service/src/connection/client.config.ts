import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';
import * as Option from 'effect/Option';
import type * as vscode from 'vscode';
import { NativeTwinPluginConfiguration } from '../utils/constants.utils';
import { DEFAULT_PLUGIN_CONFIG } from '../utils/constants.utils';

export class _____ConfigManager {
  tsconfig: Option.Option<vscode.Uri>;
  twinConfigFile: Option.Option<vscode.Uri>;
  workspaceRoot: Option.Option<vscode.WorkspaceFolder>;
  config: NativeTwinPluginConfiguration;
  constructor(config: {
    readonly tsconfig: Option.Option<vscode.Uri>;
    readonly twinConfigFile: Option.Option<vscode.Uri>;
    readonly workspaceRoot: Option.Option<vscode.WorkspaceFolder>;
    readonly config: NativeTwinPluginConfiguration;
  }) {
    this.config = config.config;
    this.tsconfig = config.tsconfig;
    this.twinConfigFile = config.twinConfigFile;
    this.workspaceRoot = config.workspaceRoot;
  }

  onUpdateConfig(config: {
    readonly tsconfig: Option.Option<vscode.Uri>;
    readonly twinConfigFile: Option.Option<vscode.Uri>;
    readonly workspaceRoot: Option.Option<vscode.WorkspaceFolder>;
    readonly config: NativeTwinPluginConfiguration;
  }) {
    this.config = config.config;
    this.tsconfig = config.tsconfig;
    this.twinConfigFile = config.twinConfigFile;
    this.workspaceRoot = config.workspaceRoot;
  }
}

export class ____ConfigManagerService extends Context.Tag('ConfigManagerService')<
  ____ConfigManagerService,
  _____ConfigManager
>() {
  static Live = Layer.succeed(
    ____ConfigManagerService,
    new _____ConfigManager({
      config: DEFAULT_PLUGIN_CONFIG,
      tsconfig: Option.none(),
      twinConfigFile: Option.none(),
      workspaceRoot: Option.none(),
    }),
  );
}
