import { GetPackageTypings } from '../editor/workers/shared.schemas';

export const MONACO_BASE_FILE_URI = 'file:///';

export const TWIN_PACKAGES_TYPINGS = [
  new GetPackageTypings({
    name: 'react',
    version: '18.2.0',
  }),
  new GetPackageTypings({
    name: '@native-twin/core',
    version: '6.4.0',
  }),
  // new GetPackageTypings({
  //   name: '@native-twin/css',
  //   version: '6.4.0',
  // }),
  new GetPackageTypings({
    name: '@native-twin/preset-tailwind',
    version: '6.4.0',
  }),
  // new GetPackageTypings({
  //   name: '@native-twin/arc-parser',
  //   version: '6.4.0',
  // }),
  // new GetPackageTypings({
  //   name: '@native-twin/helpers',
  //   version: '6.4.0',
  // }),
];
