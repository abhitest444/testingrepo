/**
 * Cucumber.js profiles (Cucumber 8+).
 * @see https://github.com/cucumber/cucumber-js/blob/main/docs/configuration.md
 */
module.exports = {
  default: {
    paths: ['cucumber/features/**/*.feature'],
    requireModule: ['tsx/cjs'],
    require: [
      'cucumber/support/world.ts',
      'cucumber/support/hooks.ts',
      'cucumber/support/parameter-types.ts',
      'cucumber/steps/**/*.ts',
    ],
    format: [
      'progress-bar',
      'summary',
      'html:cucumber-report/index.html',
      'json:cucumber-report/report.json',
    ],
    formatOptions: {
      snippetInterface: 'async-await',
    },
  },
};
