module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Add any babel plugins here if needed for specific functionalities
    ],
  };
};