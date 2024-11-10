// import * as RA from 'effect/Array';
// import * as Context from 'effect/Context';
// import * as Layer from 'effect/Layer';
// import * as Tuple from 'effect/Tuple';
// import * as path from 'node:path';
// import * as vscode from 'vscode';
// import * as Tree from '@native-twin/helpers/tree';
// import * as fsPredicates from '../fs.predicates';
// import * as fsUtils from '../fs.utils';
// import * as fsModels from '../models/FileSystem.models';

// export class VscodeFileSystemProviderManager implements vscode.FileSystemProvider {
//   static meta = {
//     scheme: 'native-twin',
//     initialized: false,
//   };

//   private _emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
//   private _bufferedEvents: vscode.FileChangeEvent[] = [];
//   private _fireSoonHandle?: NodeJS.Timeout;
//   readonly onDidChangeFile: vscode.Event<vscode.FileChangeEvent[]> = this._emitter.event;

//   get root() {
//     return this.fsTree.root.value;
//   }

//   constructor(readonly fsTree: fsModels.VirtualEntryTreeRoot) {
//     console.log('CONSTRUCT_FS_TREE');
//   }

//   pathToUri(...segments: string[]): vscode.Uri {
//     return this.root.uri.with({
//       path: path.posix.join(...segments.map((x) => x.replace('/', ''))),
//     });
//   }

//   createDirectory(uri: vscode.Uri): void {
//     const info = this.getUriInfo(uri);
//     const parentNode = fsUtils.findVirtualFolder(this.fsTree, info.parent.uri);
//     const newFolder = new fsModels.VirtualDirectory(uri);

//     parentNode.addChild(newFolder, parentNode);
//     parentNode.value.size += 1;
//     parentNode.value.mtime = Date.now();
//     this.fireChange(
//       { type: vscode.FileChangeType.Changed, uri: info.parent.uri },
//       { type: vscode.FileChangeType.Created, uri },
//     );
//   }

//   writeFile(
//     uri: vscode.Uri,
//     content: Uint8Array,
//     options: { readonly create: boolean; readonly overwrite: boolean },
//   ): void | Thenable<void> {
//     const info = this.getUriInfo(uri);
//     const parentNode = fsUtils.findVirtualFolder(this.fsTree, info.parent.uri);
//     const newFile = new fsModels.VirtualFile(uri, content);
//     const existingFile = parentNode.children.find((x) =>
//       fsPredicates.isSameEntry(newFile, x.value),
//     );
//     if (existingFile) {
//       if (!options.overwrite) {
//         throw vscode.FileSystemError.FileExists(uri);
//       }
//       existingFile.remove();
//     }

//     parentNode.addChild(newFile, parentNode);
//     parentNode.value.mtime = Date.now();
//     if (existingFile) {
//       this.fireChange({ type: vscode.FileChangeType.Changed, uri });
//     } else {
//       parentNode.value.size += 1;
//       this.fireChange({ type: vscode.FileChangeType.Created, uri: uri });
//     }
//   }

//   delete(
//     uri: vscode.Uri,
//     options: { readonly recursive: boolean },
//   ): void | Thenable<void> {
//     const info = this.getUriInfo(uri);
//     const parent = fsUtils.findVirtualFolder(this.fsTree, info.parent.uri);
//     const node = fsUtils.findEntryByUri(this.fsTree, uri);

//     if (fsPredicates.isVirtualDirectoryNode(node)) {
//       if (node.childrenCount > 0 && !options.recursive) {
//         throw vscode.FileSystemError.FileIsADirectory(
//           `You are trying to delete a folder that contains files`,
//         );
//       }
//       node.remove();
//     } else {
//       node.remove();
//     }
//     parent.value.size -= 1;
//     parent.value.mtime = Date.now();
//     this.fireChange(
//       { type: vscode.FileChangeType.Changed, uri: info.parent.uri },
//       { type: vscode.FileChangeType.Deleted, uri },
//     );
//   }

//   readDirectory(uri: vscode.Uri): [string, vscode.FileType][] {
//     const directory = fsUtils.findVirtualFolder(this.fsTree, uri);

//     return RA.map(directory.children, (nodeChild) =>
//       Tuple.make(nodeChild.value.uri.toString(), nodeChild.value.type),
//     );
//   }

//   readFile(uri: vscode.Uri): Uint8Array {
//     const file = fsUtils.findVirtualFile(this.fsTree, uri);
//     return file.value.contents ?? new Uint8Array();
//   }

//   rename(
//     _oldUri: vscode.Uri,
//     _newUri: vscode.Uri,
//     _options: { readonly overwrite: boolean },
//   ): void | Thenable<void> {
//     console.warn('FS:rename Not Implemented');
//     return;
//   }

//   stat(uri: vscode.Uri): vscode.FileStat {
//     const entry = fsUtils.findEntryByUri(this.fsTree, uri);

//     return entry.value;
//   }

//   watch(
//     _uri: vscode.Uri,
//     _options: { readonly recursive: boolean; readonly excludes: readonly string[] },
//   ): vscode.Disposable {
//     // ignore, fires for all changes...
//     return new vscode.Disposable(() => void {});
//   }

//   copy(
//     _source: vscode.Uri,
//     _destination: vscode.Uri,
//     _options: { readonly overwrite: boolean },
//   ): void | Thenable<void> {
//     console.warn('FS:copy Not Implemented');
//     return;
//   }

//   // private addFileToFolder = (
//   //   folder: fsModels.VirtualEntryTreeNode<fsModels.VirtualEntryType>,
//   //   file: fsModels.VirtualFile,
//   //   options: fsModels.VirtualFileWriteOptions,
//   // ) => {
//   //   return pipe(
//   //     RA.map(folder.children, (node) => node.value),
//   //     RA.flatMap(RA.liftPredicate(fsPredicates.isVirtualFile)),
//   //     RA.findFirst((fsEntry) => fsPredicates.isSameEntryID(folder.value.id, fsEntry.id)),
//   //     Option.map((fileEntry) => {
//   //       if (options.overwrite) {
//   //         fileEntry.contents = file.contents;
//   //         fileEntry.mtime = Date.now();
//   //         fileEntry.size = file.contents?.byteLength ?? 0;
//   //         this.fireChange({ type: vscode.FileChangeType.Changed, uri: fileEntry.uri });
//   //       }
//   //       return fileEntry;
//   //     }),
//   //     Option.getOrElse(() => folder.addChild(file).value),
//   //     (x) => {
//   //       this.fireChange({ type: vscode.FileChangeType.Created, uri: file.uri });
//   //       return x;
//   //     },
//   //   );
//   // };

//   private getUriInfo(uri: vscode.Uri): fsModels.UriRelatedInfo {
//     const basename = path.posix.basename(uri.path);
//     const parentPath = path.posix.dirname(uri.path);
//     const parentUri = uri.with({ path: path.posix.dirname(uri.path) });
//     const parentID = fsModels.createVirtualEntryID(parentUri);
//     const parentBasename = path.posix.basename(parentPath);
//     return {
//       id: fsModels.createVirtualEntryID(uri),
//       uri,
//       basename,
//       path: uri.path,
//       parent: {
//         id: parentID,
//         uri: parentUri,
//         path: parentPath,
//         basename: parentBasename,
//       },
//     };
//   }

//   private fireChange(...events: vscode.FileChangeEvent[]) {
//     console.debug('Fire Change: ', ...events);
//     console.debug('Current _bufferedEvents', ...this._bufferedEvents);
//     this._bufferedEvents.push(...events);

//     if (this._fireSoonHandle) {
//       console.debug('Has a fireSoonHandle, clearing....');
//       clearTimeout(this._fireSoonHandle);
//     }

//     this._fireSoonHandle = setTimeout(() => {
//       console.debug('Firing events: ', ...this._bufferedEvents);
//       this._emitter.fire(this._bufferedEvents);
//       this._bufferedEvents.length = 0;
//     }, 5);
//   }
// }

// export class VscodeFileSystem extends Context.Tag('vscode/fs')<
//   VscodeFileSystem,
//   VscodeFileSystemProviderManager
// >() {
//   static Live = (fsTree: Tree.Tree<fsModels.VirtualEntryType>) =>
//     Layer.succeed(VscodeFileSystem, new VscodeFileSystemProviderManager(fsTree));
// }
