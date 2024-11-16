import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import {
  MonacoNativeTwinManager,
  NativeTwinManagerService,
} from '@native-twin/language-service/browser';
import { traceLayerLogs } from '@/utils/logger.utils';
import { AppWorkersService } from './services/AppWorkers.service';
import { TwinEditorConfigService } from './services/EditorConfig.service';
import { FileSystemService } from './services/FileSystem.service';
import { TwinEditorService } from './services/TwinEditor.service';

const loggerLayer = Logger.replace(
  Logger.defaultLogger,
  Logger.prettyLogger({
    colors: true,
    mode: 'browser',
  }),
);

// const baseLayers = Layer.mergeAll(
//   TwinEditorService.Live,
//   NativeTwinManagerService.Live,
//   FileSystemService.Live,
//   TwinEditorConfigService.Live,
// );

const EditorMainLive = NativeTwinManagerService.Live(new MonacoNativeTwinManager())
  .pipe(traceLayerLogs('twin manager'))
  .pipe(
    Layer.provideMerge(TwinEditorService.Live),
    Layer.provideMerge(AppWorkersService.Live),
    Layer.provideMerge(FileSystemService.Live),
    Layer.provideMerge(TwinEditorConfigService.Live),
    Layer.provide(loggerLayer),
  );

export const EditorMainRuntime = ManagedRuntime.make(EditorMainLive);
