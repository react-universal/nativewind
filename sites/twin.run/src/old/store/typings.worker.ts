/* eslint-disable no-var */
/// <reference lib="WebWorker" />
/**
 * Worker to fetch typescript definitions for dependencies.
 * Credits to @CompuIves
 * https://github.com/CompuIves/codesandbox-client/blob/dcdb4169bcbe3e5aeaebae19ff1d45940c1af834/packages/app/src/app/components/CodeEditor/Monaco/workers/fetch-dependency-typings.js
 *
 */

import type tsc from 'typescript';

self.importScripts(
  'https://cdnjs.cloudflare.com/ajax/libs/typescript/2.4.2/typescript.min.js',
);

declare global {
  var ts: typeof tsc;
}

const ROOT_URL = `https://cdn.jsdelivr.net/`;

const store = new Map<string, any>();
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

  fetchCache.set(url, promise);

  return promise;
};

const fetchFromDefinitelyTyped = (
  dependency: string,
  _version: string,
  fetchedPaths: Record<string, any>,
) =>
  doFetch(
    `${ROOT_URL}npm/@types/${dependency
      .replace('@', '')
      .replace(/\//g, '__')}/index.d.ts`,
  ).then((typings: any) => {
    fetchedPaths[`node_modules/${dependency}/index.d.ts`] = typings;
  });

const getRequireStatements = (title: string, code: string) => {
  const requires: string[] = [];

  const sourceFile = self.ts.createSourceFile(
    title,
    code,
    self.ts.ScriptTarget.Latest,
    true,
    self.ts.ScriptKind.TS,
  );

  self.ts.forEachChild(sourceFile, (node) => {
    if (
      self.ts.isImportDeclaration(node) &&
      self.ts.isStringLiteral(node.moduleSpecifier)
    ) {
      requires.push(node.moduleSpecifier.text);
      return;
    }

    if (
      self.ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      self.ts.isStringLiteral(node.moduleSpecifier)
    ) {
      requires.push(node.moduleSpecifier.text);
      return;
    }
  });

  return requires;
};

const tempTransformFiles = (files: any[]) => {
  const finalObj: Record<string, any> = {};

  files.forEach((d) => {
    finalObj[d.name] = d;
  });

  return finalObj;
};

// const transformFiles = (dir: any) =>
//   dir.files
//     ? dir.files.reduce((prev: any, next: any) => {
//         if (next.type === 'file') {
//           return { ...prev, [next.path]: next };
//         }

//         return { ...prev, ...transformFiles(next) };
//       }, {})
//     : {};

const getFileMetaData = (dependency: string, version: string, depPath: string) =>
  doFetch(`https://data.jsdelivr.com/v1/package/npm/${dependency}@${version}/flat`)
    .then((response: any) => JSON.parse(response))
    .then((response: any) =>
      response.files.filter((f: any) => f.name.startsWith(depPath)),
    )
    .then(tempTransformFiles);

const resolveAppropiateFile = (fileMetaData: any, relativePath: any) => {
  const absolutePath = `/${relativePath}`;

  if (fileMetaData[`${absolutePath}.d.ts`]) return `${relativePath}.d.ts`;
  if (fileMetaData[`${absolutePath}.ts`]) return `${relativePath}.ts`;
  if (fileMetaData[absolutePath]) return relativePath;
  if (fileMetaData[`${absolutePath}/index.d.ts`]) return `${relativePath}/index.d.ts`;

  return relativePath;
};

const getFileTypes = (
  depUrl: any,
  dependency: any,
  depPath: any,
  fetchedPaths: any,
  fileMetaData: any,
) => {
  const virtualPath = ['node_modules', dependency, depPath].join('/');

  if (fetchedPaths[virtualPath]) return null;

  return doFetch(`${depUrl}/${depPath}`).then((typings: any) => {
    if (fetchedPaths[virtualPath]) return null;

    fetchedPaths[virtualPath] = typings;

    // Now find all require statements, so we can download those types too
    return Promise.all(
      getRequireStatements(depPath, typings)
        .filter(
          // Don't add global deps
          (dep) => dep.startsWith('.'),
        )
        // .map((relativePath) => path.join(path.dirname(depPath), relativePath))
        .map((relativePath) => resolveAppropiateFile(fileMetaData, relativePath))
        .map((nextDepPath) =>
          getFileTypes(depUrl, dependency, nextDepPath, fetchedPaths, fileMetaData),
        ),
    );
  });
};

function fetchFromMeta(dependency: any, version: any, fetchedPaths: any) {
  const depUrl = `https://data.jsdelivr.com/v1/package/npm/${dependency}@${version}/flat`;

  return doFetch(depUrl)
    .then((response: any) => JSON.parse(response))
    .then((meta: any) => {
      const filterAndFlatten = (files: any, filter: any) =>
        files.reduce((paths: any, file: any) => {
          if (filter.test(file.name)) {
            paths.push(file.name);
          }
          return paths;
        }, []);

      let dtsFiles = filterAndFlatten(meta.files, /\.d\.ts$/);
      if (dtsFiles.length === 0) {
        // if no .d.ts files found, fallback to .ts files
        dtsFiles = filterAndFlatten(meta.files, /\.ts$/);
      }

      if (dtsFiles.length === 0) {
        throw new Error(`No inline typings found for ${dependency}@${version}`);
      }

      dtsFiles.forEach((file: any) => {
        doFetch(`https://cdn.jsdelivr.net/npm/${dependency}@${version}${file}`)
          .then((dtsFile: any) => {
            fetchedPaths[`node_modules/${dependency}${file}`] = dtsFile;
          })
          .catch(() => {});
      });
    });
}

function fetchFromTypings(dependency: any, version: any, fetchedPaths: any) {
  const depUrl = `${ROOT_URL}npm/${dependency}@${version}`;

  return doFetch(`${depUrl}/package.json`)
    .then((response: any) => JSON.parse(response))
    .then((packageJSON: any) => {
      const types = packageJSON.typings || packageJSON.types;
      if (types) {
        // Add package.json, since this defines where all types lie
        fetchedPaths[`node_modules/${dependency}/package.json`] =
          JSON.stringify(packageJSON);

        // get all files in the specified directory
        return getFileMetaData(dependency, version, ['/', types].join('')).then(
          (fileData: any) =>
            getFileTypes(
              depUrl,
              dependency,
              resolveAppropiateFile(fileData, types),
              fetchedPaths,
              fileData,
            ),
        );
      }

      throw new Error(`No typings field in package.json for ${dependency}@${version}`);
    });
}

function fetchDefinitions(name: any, version: any) {
  if (!version) {
    return Promise.reject(new Error(`No version specified for ${name}`));
  }

  // Query cache for the defintions
  const key = `${name}@${version}`;

  const definitions = store.get(key);

  if (!definitions) {
    console.error('An error occurred when getting definitions from cache');
  }

  if (definitions) {
    return definitions;
  }

  // If result is empty, fetch from remote
  const fetchedPaths = {};

  return fetchFromTypings(name, version, fetchedPaths)
    .catch(() =>
      // not available in package.json, try checking meta for inline .d.ts files
      fetchFromMeta(name, version, fetchedPaths),
    )
    .catch(() =>
      // Not available in package.json or inline from meta, try checking in @types/
      fetchFromDefinitelyTyped(name, version, fetchedPaths),
    )
    .then(() => {
      if (Object.keys(fetchedPaths).length) {
        // Also cache the definitions
        store.set(key, fetchedPaths);

        return fetchedPaths;
      } else {
        throw new Error(`Type definitions are empty for ${key}`);
      }
    });
}

self.addEventListener('message', (event) => {
  const { name, version } = event.data;

  fetchDefinitions(name, version).then(
    (result: any) =>
      self.postMessage({
        name,
        version,
        typings: result,
      }),
    (error: any) => {
      if (process.env['NODE_ENV'] !== 'production') {
        console.error(error);
      }
    },
  );
});
