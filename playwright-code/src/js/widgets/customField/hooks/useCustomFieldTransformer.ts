import { useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import UID from '@appfabric/ui-data-layer';
import { CustomField } from '../store/customFieldsSlice';
import { CustomFieldData } from '../../timeTrackingSettings/types';
import { CUSTOM_FIELD_DATA_FIELDS } from '../utils/constants';

/**
 * Custom hook for transforming CustomField to CustomFieldData
 * @returns Object containing transformCustomField function
 */
export const useCustomFieldTransformer = () => {
  const sandbox = useSandbox();

  const transformCustomField = useCallback(
    (customField: CustomField): CustomFieldData | null => {
      try {
        const currentRealmId = sandbox.appContext.getRealmInfo()?.realmId;

        if (!currentRealmId) {
          sandbox.logger.error(
            'Realm ID not found when transforming custom field',
          );
          return null;
        }

        const legacyId = customField.id.split('_')[1];
        const customFieldId = UID.util.GlobalId.convertToGlobalId(
          currentRealmId,
          CUSTOM_FIELD_DATA_FIELDS.CUSTOM_FIELD_DEFINITION_PATH,
          legacyId,
          CUSTOM_FIELD_DATA_FIELDS.GLOBAL_ID_VERSION,
        );

        return {
          id: customFieldId,
          name: customField.id,
          title: customField.name,
          type:
            customField.options.length > 0
              ? CUSTOM_FIELD_DATA_FIELDS.DROPDOWN_TYPE
              : customField.type.toUpperCase(),
          format: null,
          allowedOperations: [],
          allowedValues:
            customField.options?.map((option) => ({
              deleted: option.deleted,
              __typename: CUSTOM_FIELD_DATA_FIELDS.SCHEMA_TYPENAME,
              id: option.id || '',
              value: option.name,
              order: parseInt((option.id || '').split('_')[1] || '0', 10),
            })) || [],
          associatedEntityTypes: [
            {
              deleted: false,
              allowedOperations: [],
              entityConditions: [
                {
                  deleted: false,
                  allowedOperations: [],
                  subtype: CUSTOM_FIELD_DATA_FIELDS.TIME_ENTRY_SUBTYPE,
                },
              ],
              type: CUSTOM_FIELD_DATA_FIELDS.TIME_ENTITY,
            },
          ],
          active: customField.isActive,
        };
      } catch (error) {
        sandbox.logger.error('Error transforming custom field data:', {
          error: String(error),
        });
        return null;
      }
    },
    [sandbox],
  );

  return { transformCustomField };
};
