import {CodegenConfig} from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'codegen/timetracking/schema.graphql',
  documents: [
    'src/js/service/queries/timeTrackingQueries.ts',
    'src/js/service/queries/timeTrackingAssignmentQueries.ts',
    'src/js/service/queries/userSettingsQueries.ts',
    'src/js/service/queries/timeTrackingGroupMutations.ts',
    'src/js/service/queries/timeTrackingGroupQueries.ts',
    'src/js/service/queries/workerPermissionsQueries.ts',
  ],
  generates: {
    'src/__generated__/timeTracking/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
        {
          add: {
            content: '/* eslint-disable */', // skip any linting
          },
        },
      ],
      config: {
        maybeValue: 'T',
        inputMaybeValue: 'T', // simplify how the Maybe type is generated
        gqlImport: 'graphql-tag', // should use apollo3.gql, but there is issue with webpack and .cjs files it uses ?
        reactApolloVersion: 3,
        // onlyOperationTypes: true, // Only the fields used documents,
        extractAllFieldsToTypes: true,
        dedupeFragments: true,
        preResolveTypes: true,
      },
    },
    '__mocks__/__generated__/timeTracking/index.ts': {
      plugins: [
        'graphql-codegen-typescript-mock-data',
        {
          add: {
            content: '/* eslint-disable */', // skip any linting
          },
        },
      ],
      config: {
        typesFile: 'src/__generated__/timeTracking/graphql.ts',
        transformUnderscore: false, // keep the underscores
        addTypename: true,
        terminateCircularRelationships: true, // Stop infinite recursion
      },
    },
  },
};

export default config;
