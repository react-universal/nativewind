import * as Context from 'effect/Context';
import * as Layer from 'effect/Layer';
import type { NativeTwinManager } from '../utils/twin/twin.manager';
import type { MonacoNativeTwinManager } from '../utils/twin/twin.manager.web';

// export const make = Effect.gen(function* () {
//   const config = yield* LSPConfigService.pipe(Effect.flatMap((x) => x.get));
//   const configFileRoot = yield* Effect.sync(() =>
//     config.workspaceRoot.pipe(
//       // Option.getOrThrowWith(() => new Error('Did not provide any config file')),
//       Option.getOrElse(() => ''),
//     ),
//   );
//   const configFile = yield* Effect.sync(() =>
//     config.twinConfigFile.pipe(
//       // Option.getOrThrowWith(() => new Error('Did not provide any config file')),
//       Option.getOrElse(() => ''),
//     ),
//   );

//   const userConfig = maybeLoadJS<InternalTwinConfig>(configFile).pipe(
//     // Option.getOrThrowWith(() => new Error('Cant find any native twin config file..…')),
//     Option.getOrElse(() => DEFAULT_TWIN_CONFIG),
//   );

//   const allowedPathsGlob = RA.map(userConfig.content, (x) =>
//     path.join(configFileRoot, x),
//   );

//   const isAllowedPath = (filePath: string) => {
//     return (
//       micromatch.isMatch(path.join(configFileRoot, filePath), allowedPathsGlob) ||
//       micromatch.isMatch(filePath, allowedPathsGlob)
//     );
//   };

//   const sheet = createVirtualSheet();
//   const tw: InternalTwFn = createTailwind(userConfig, sheet);

//   const themeContext = createThemeContext(userConfig);

//   const completions: TwinStore = createTwinStore({
//     config: userConfig,
//     context: themeContext,
//     tw: tw,
//   });

//   const compilerContext = createStyledContext(userConfig.root.rem);

//   return {
//     isAllowedPath,
//     configFile,
//     configFileRoot,
//     userConfig,
//     tw,
//     cx,
//     compilerContext,
//     themeContext,
//     completions,
//     getTwinRules() {
//       return completions.twinRules;
//     },
//   };
// });

export class NativeTwinManagerService extends Context.Tag('NativeTwinManager')<
  NativeTwinManagerService,
  Omit<NativeTwinManager | MonacoNativeTwinManager, '_configFile'>
>() {
  static Live = (
    manager: Omit<NativeTwinManager | MonacoNativeTwinManager, '_configFile'>,
  ) => Layer.succeed(NativeTwinManagerService, manager);
}
