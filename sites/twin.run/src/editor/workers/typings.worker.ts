/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference lib="WebWorker" />

/**
 * Worker to fetch typescript definitions for dependencies.
 * Credits to @CompuIves
 * https://github.com/CompuIves/codesandbox-client/blob/dcdb4169bcbe3e5aeaebae19ff1d45940c1af834/packages/app/src/app/components/CodeEditor/Monaco/workers/fetch-dependency-typings.js
 *
 */
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Stream from 'effect/Stream';
import { GetPackageTypings, TwinPackageTypings, TwinTyping } from './shared.schemas';
import * as BrowserRunner from '@effect/platform-browser/BrowserWorkerRunner';
import * as Runner from '@effect/platform/WorkerRunner';

const WorkerLive = Runner.layerSerialized(GetPackageTypings, {
  GetPackageTypings: (req) => {
    return Effect.Do.pipe(
      Effect.bind('packageJSON', () => fetchPackageJSON(req.name, req.version)),
      Effect.bind('files', ({ packageJSON }) => fetchPackageJSONFiles(packageJSON)),
      Effect.bind('contents', ({ files, packageJSON }) =>
        pipe(
          files.files,
          RA.map((x) => getFileContents(packageJSON, x)),
          Effect.allSuccesses,
          Effect.map((x) =>
            pipe(
              RA.fromIterable(x),
              RA.append({
                contents: JSON.stringify(packageJSON),
                filePath: '/package.json',
              }),
            ),
          ),
        ),
      ),
      Stream.fromEffect,
      Stream.map((x) => {
        return new TwinPackageTypings({
          name: req.name,
          typings: x.contents.map(
            (typing) =>
              new TwinTyping({
                contents: typing.contents,
                filePath: `/node_modules/${req.name}${typing.filePath.replace('/build', '')}`,
              }),
          ),
        });
      }),
    );
  },
}).pipe(Layer.provide(BrowserRunner.layer));

Effect.runFork(Layer.launch(WorkerLive));

const getFileContents = (pkg: IPackageJson, file: string) => {
  return Effect.promise(() =>
    doFetch(getDependencyURL(pkg.name, pkg.version, file)),
  ).pipe(
    Effect.map((x) => {
      return {
        contents: x as string,
        filePath: file,
      };
    }),
  );
};

interface IPackageJson {
  name: string;
  version: string;
  typings?: string;
  types?: string;
  main?: string;
  module?: string;
}

const ROOT_URL = `https://cdn.jsdelivr.net/`;

const getDependencyURL = (name: string, version: string, nestedPath: string = '') =>
  `${ROOT_URL}npm/${name}@${version}${nestedPath.startsWith('/') ? nestedPath : `/${nestedPath}`}`;

const fetchPackageJSON = (name: string, version: string) => {
  return Effect.gen(function* () {
    const depUrl = getDependencyURL(name, version, 'package.json');
    const response = yield* Effect.promise(() => doFetch(depUrl));
    const packageJSON: IPackageJson = JSON.parse(response as string);
    // yield* Console.debug(inspect(packageJSON, false, null, true));

    return packageJSON;
  });
};

interface IFlatPackage {
  default: string;
  files: {
    name: string;
    hash: string;
    size: number;
  }[];
}
const fetchPackageJSONFiles = (pkg: IPackageJson) => {
  return Effect.gen(function* () {
    const response = yield* Effect.promise(() =>
      doFetch(`https://data.jsdelivr.com/v1/package/npm/${pkg.name}@${pkg.version}/flat`),
    );
    const flattenPKG: IFlatPackage = JSON.parse(response as string);
    return {
      ...flattenPKG,
      files: pipe(
        flattenPKG.files,
        RA.map((x) => x.name),
        RA.filter((x) => x.endsWith('.ts')),
      ),
    };
  });
};

const fetchCache = new Map();

const doFetch = (url: string) => {
  const cached = fetchCache.get(url);

  if (cached) {
    return cached;
  }

  const promise = fetch(url)
    .then((response) => {
      if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response);
      }

      const error = new Error(response.statusText || String(response.status));

      return Promise.reject(error);
    })
    .then((response) => response.text());

  return promise;
};
