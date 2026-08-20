/**
 * This file allows you to override certain functionality that Plugin CLI provides.
 * For more info on the options, see https://github.intuit.com/pages/UX-Infra/plugin-cli/docs/config-files
 * For more info on lint config, see https://github.intuit.com/pages/UX-Infra/plugin-cli/docs/config-linting
 */
const eslintConfig = require('./.eslintrc');
const webpackConfig = require('./webpack.config');
const jestConfig = require('./jest.config');

module.exports = {
  lint: {
    js: {
      localConfig: true,
    },
    ts: {
      rules: eslintConfig.rules,
    },
  },
  build: {
    babel: {
      plugins: [],
    },
    webpack: webpackConfig,
    styleLoaders: {
      css: {
        test: [/\.css$/],
      },
      cssModules: {
        test: [/\.module\.css$/],
        options: {
          modules: {
            localIdentName: '[name]__[local]-time-tracking-ui-[hash:base64:5]',
          },
        },
      },
     sass: {
       test: [/\.(scss|sass)$/],
     },
    },    
    // enableTypeCheck: true, // is recommended, but takes very long time
  },
  test: {
    jest: jestConfig,
  },
};
