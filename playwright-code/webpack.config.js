/**
 * Below are the default set or rules a plugin can override
 * Pass this config into `plugin-cli.config.js` to have it picked up by the build system
 * Overrides are additive, they will not overwrite what the build brings.
 * To learn more see https://github.intuit.com/pages/UX-Infra/plugin-cli/docs/config-files
 */


// Core webpack functionality
const webpack = require('webpack');

// Plugin for copying static assets to build output
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  rules: [
    {
      test: /\.png$/,
      type: 'asset/resource'
    },
    {
      test: /\.gif$/,
      type: 'asset/resource'
    },
    {
      test: /\.svg$/,
      type: 'asset/resource'
    }
  ],
  plugins: [
    // Copy static assets to build output directory
    new CopyPlugin({
      patterns: [
        { from: './assets/images', to: 'assets/images/', noErrorOnMissing: true },
        {
          from: './src/assets/animations/',
          to: 'assets/animations/',
          noErrorOnMissing: true,
        }
      ],
    })
  ],
  silent: false,
  // performance,
  resolve: {
    extensions: [],  // File extensions to resolve automatically
    modules: [],     // Module search directories
  },
};
