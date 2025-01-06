module.exports = function (api, options) {
  // Get the platform that Expo CLI is transforming for.
  const platform = api.caller((caller) => (caller ? caller.platform : 'ios')) ?? 'ios';

  // Detect if the bundling operation is for Hermes engine or not, e.g. `'hermes'` | `undefined`.
  const engine = api.caller((caller) => (caller ? caller.engine : 'jsc')) ?? '';

  // Is bundling for a server environment, e.g. API Routes.
  const isServer = api.caller((caller) => (caller ? caller.isServer : false)) ?? false;

  // Is bundling for development or production.
  const isDev =
    api.caller((caller) =>
      caller
        ? caller.isDev
        : process.env['BABEL_ENV'] === 'development' ||
          process.env['NODE_ENV'] === 'development',
    ) ?? false;

  api.cache(false);
  return {
    plugins: [require('./build')],
  };
};
