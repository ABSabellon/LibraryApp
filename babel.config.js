module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Support for .env file
      ["module:babel-plugin-inline-import", {
        "extensions": [".env"]
      }]
    ],
  };
};