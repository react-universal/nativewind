import {
  MonacoNativeTwinManager,
  NativeTwinManagerService,
} from '@native-twin/language-service/browser';
import * as Layer from 'effect/Layer';
import * as Logger from 'effect/Logger';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import { traceLayerLogs } from '../utils/logger.utils';
import { AppWorkersService } from './services/AppWorkers.service';
import { FileSystemService } from './services/FileSystem.service';
import { MonacoContextLive } from './services/MonacoContext.service';
import { TwinEditorStateCtxLive } from './services/TwinEditorState.service';

const loggerLayer = Logger.replace(
  Logger.defaultLogger,
  Logger.prettyLogger({
    colors: true,
    mode: 'browser',
  }),
);

export const EditorMainLive = Layer.empty.pipe(
  Layer.provideMerge(AppWorkersService.Live),
  Layer.provideMerge(FileSystemService.Live),
  Layer.provideMerge(MonacoContextLive),
  Layer.provideMerge(TwinEditorStateCtxLive),
  Layer.provideMerge(
    Layer.succeed(NativeTwinManagerService, new MonacoNativeTwinManager()).pipe(
      traceLayerLogs('twin manager'),
    ),
  ),
  Layer.provide(loggerLayer),
);

export const EditorMainRuntime = ManagedRuntime.make(EditorMainLive);
