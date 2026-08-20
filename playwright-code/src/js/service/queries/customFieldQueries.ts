import gql from 'graphql-tag';

export const CustomFieldsQuery = gql`
  query CustomFieldsQueryCES {
    customFieldDefinitions(limit: 1000) {
      edges {
        node {
          id
          schema {
            type
            title
            format
            allowedOperations
            allowedValues {
              id
              value
              deleted
              order
            }
            uiValidations {
              mandatory
              defaultValue
            }
            metadataProperties
          }
          name
          deleted
          associatedEntityTypes {
            type
            deleted
            allowedOperations
            entityConditions {
              subtype
              deleted
              allowedOperations
            }
          }
          colorCode
          customFieldDefinitionMetaModel {
            suggested
          }
        }
      }
    }
  }
`;

interface AllowedValue {
  id: string;
  value: string;
  deleted: boolean;
  order: number;
}

interface UiValidation {
  mandatory: boolean;
  defaultValue: string;
}

interface EntityCondition {
  subtype: string;
  deleted: boolean;
  allowedOperations: string[];
}

interface AssociatedEntityType {
  type: string;
  deleted: boolean;
  allowedOperations: string[];
  entityConditions: EntityCondition[];
}

interface CustomFieldSchema {
  type: string;
  title: string;
  format: string;
  allowedOperations: string[];
  allowedValues: AllowedValue[];
  uiValidations: UiValidation;
  metadataProperties: string[];
}

interface CustomFieldDefinitionMetaModel {
  suggested: boolean;
}

interface CustomFieldDefinition {
  id: string;
  schema: CustomFieldSchema;
  name: string;
  deleted: boolean;
  associatedEntityTypes: AssociatedEntityType[];
  colorCode: string;
  customFieldDefinitionMetaModel: CustomFieldDefinitionMetaModel;
}

export interface CustomFieldsQueryResponse {
  customFieldDefinitions: {
    edges: {
      node: CustomFieldDefinition;
    }[];
  };
}
