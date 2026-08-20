/**
 * Defaults are provided by Plugin-CLI.
 * Use this as a place to specify your overrides, then import it into `plugin-cli.config.js` and pass it there.
 */
module.exports = {
  testTimeout: 15000,
  maxWorkers: '50%',
  transform: {
    '^.+\\.(tsx|ts)?$': 'ts-jest',
  },
  transformIgnorePatterns: [`/node_modules/(?!@appfabric/*|react-hotkeys-hook/*|@work-timecapture/qbtime-sdk/*)`],
  setupFiles: ['<rootDir>/__mocks__/matchMedia.mock.js'],
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: [
    '@testing-library/jest-dom/extend-expect',
    '<rootDir>/test/setup.ts',
    // '<rootDir>/test/unit/setup.js',
  ],
  collectCoverageFrom: [],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  testMatch: ['test/unit/**/*.[jt]s?(x)'],
  testPathIgnorePatterns: ['/node_modules/', '/\\.claude/'],
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.ts',
      '^src/(.*)$': '<rootDir>/src/$1',
      '^@ids-ts/table$': '<rootDir>/__mocks__/@ids-ts/table.ts',
      '^@cgds/lottie$': '<rootDir>/__mocks__/@cgds/lottie.ts',
  },
  coveragePathIgnorePatterns: [
    './src/nls/index.js',
    './src/js/service/queries/*',
    './src/js/service/hooks/timeActivities',
    './src/__generated__/*',
    './__mocks__/*',
    './src/js/widgets/singleTimeTrowser/components/SingleTimeHOC.tsx',
    './src/js/widgets/weeklyTimeTrowser/components/*',
    './src/js/widgets/common/addTimeFormComponents/*',
    '!./src/js/widgets/common/addTimeFormComponents/FormCheckbox.tsx',
    '!./src/js/widgets/common/addTimeFormComponents/FormSwitch.tsx',
    '!./src/js/widgets/common/addTimeFormComponents/ToggleBreak.tsx',
    './src/js/service/ApolloClientBuilder.ts',
    './src/js/service/ApolloClientBuilderUtils.ts',
    './src/js/common/UserVoiceUtils.js',
    './src/js/widgets/weeklyTimeTrowser/utils/printWeeklyTimeTable.tsx',
    './src/js/widgets/timetrackingui',
    './src/js/service/utils/useUXPreferences.ts',
    '.src/js/widgets/whatsNewBannerPanel/Widget.jsx',
    '.src/js/widgets/timeEntryView/*',
    './src/js/widgets/breaks',
    './src/js/widgets/weeklyTimeEntry/store*',
    './src/js/widgets/timeImportAgentic/*',
    './src/js/widgets/weeklyTimeEntry/components/KeyboardShortcutsWrapper.tsx',
    './src/js/widgets/userSettings/components/cards/NotificationsCard/types',
    './src/js/widgets/.*/styles',
    './src/js/widgets/assignments/types',
    '.*/index\\.ts$',
    './src/js/widgets/weeklyTimeEntry/hooks/useWTEGlobalOptions.ts',
    './src/js/widgets/weeklyTimeEntry/hooks/useWTEAssignmentManager.tsx'
  ],
};
