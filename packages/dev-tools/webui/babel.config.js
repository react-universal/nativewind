module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: '@native-twin/jsx',
        },
      ],
    ],
    plugins: ['react-native-reanimated/plugin'],
  };
};
