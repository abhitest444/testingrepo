import { useState } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { getV4ApolloClient } from 'src/js/service/V4ApolloClientBuilder';
import {
  UpdateCompanySettingsMutation,
  UpdateCompanySettingsResponse,
} from 'src/js/service/queries/settingsQueries';
import { mapError } from 'src/js/service/utils/mapError';

export interface SetSettingsMutationArgs {
  entityVersion: string;
  isServiceFieldEnabled: boolean;
  isBillingFieldEnabled: boolean;
}

export interface UseSetSettingsArgs {
  onCompleted: (data: UpdateCompanySettingsResponse) => void;
  onError: (error: string) => void;
}

export type UseSetSettingsState = [
  (args: SetSettingsMutationArgs) => Promise<void>,
  { loading: boolean },
];

export const useSetSettings = ({
  onCompleted,
  onError,
}: UseSetSettingsArgs): UseSetSettingsState => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const client = getV4ApolloClient(sandbox);

  const [loading, setLoading] = useState<boolean>(false);

  const handleSuccess = (result: UpdateCompanySettingsResponse) => {
    onCompleted(result);
  };

  const handleError = (error: string) => {
    const mappedError = mapError({
      sourceComponent: 'useSetSettings',
      sandbox,
      intl,
      error: error as string,
    });
    if (mappedError) {
      onError(mappedError);
    }
  };

  const setSettings = async (args: SetSettingsMutationArgs) => {
    setLoading(true);
    let retried = false;
    const apiCall = async (args: SetSettingsMutationArgs) => {
      try {
        const result = await client.mutate<UpdateCompanySettingsResponse>({
          mutation: UpdateCompanySettingsMutation,
          variables: {
            input: {
              clientMutationId: '0',
              companySettings: {
                accountingPrefs: {
                  entityVersion: args.entityVersion,
                  timeTrackingPrefs: {
                    timeTrackingEnabled: args.isServiceFieldEnabled,
                    billingForTimeEnabled: args.isBillingFieldEnabled,
                  },
                },
              },
            },
          },
        });

        if (result.data == null) {
          handleError('Null response');
        } else {
          handleSuccess(result.data);
        }
      } catch (error: any) {
        if (
          error.graphQLErrors?.[0]?.type === 'STALE_STATE_ERROR' &&
          !retried
        ) {
          apiCall({
            ...args,
            entityVersion: (Number(args.entityVersion) + 1).toString(),
          });
          retried = true;
        } else {
          handleError(error as string);
        }
      } finally {
        setLoading(false);
      }
    };
    apiCall(args);
  };

  return [setSettings, { loading }];
};
