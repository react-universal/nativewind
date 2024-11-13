import * as Layer from 'effect/Layer';
import * as ManagedRuntime from 'effect/ManagedRuntime';
import { NativeTwinManagerService } from '@native-twin/language-service';
import { AppWorkersService } from './services/AppWorkers.service';
import { TwinEditorConfigService } from './services/EditorConfig.service';
import { FileSystemService } from './services/FileSystem.service';
import { LanguageClientService } from './services/Language.Service';
import { TwinEditorService } from './services/TwinEditorEditor.service';

const EditorMainLive = TwinEditorService.Live.pipe(
  Layer.provideMerge(LanguageClientService.Live),
  Layer.provideMerge(AppWorkersService.Live),
  Layer.provideMerge(FileSystemService.Live),
  Layer.provideMerge(TwinEditorConfigService.Live),
  Layer.provideMerge(NativeTwinManagerService.Live),
);

export const EditorMainRuntime = ManagedRuntime.make(EditorMainLive);
