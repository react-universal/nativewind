import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';
import { NativeTwinManager } from './NativeTwin.manager';

/**
 * @runtime node
 * @category NativeTwin
 * @dependencies None
 */
export class NativeTwinServiceNode extends Context.Tag('node/twin/service')<
  NativeTwinServiceNode,
  NativeTwinManager
>() {
  static Live = (
    twinConfigPath: string,
    projectRoot: string,
    platform = 'native',
    inputCSS = '',
  ) => {
    return Layer.succeed(
      NativeTwinServiceNode,
      new NativeTwinManager(twinConfigPath, projectRoot, platform, inputCSS),
    );
  };
}
