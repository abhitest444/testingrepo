import {CodegenConfig} from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'codegen/gas/schema.graphql',
  documents: 'src/js/service/queries/gasQueries.ts',
  generates: {
    'src/__generated__/gas/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
        {
          add: {
            content: '/* eslint-disable */',
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
    '__mocks__/__generated__/gas/index.ts': {
      plugins: [
        'graphql-codegen-typescript-mock-data',
        {
          add: {
            content: '/* eslint-disable */',
          },
        },
      ],
      config: {
        typesFile: 'src/__generated__/gas/graphql.ts',
        transformUnderscore: false, // keep the underscores
        addTypename: true,
      },
    },
  },
};

export default config;
