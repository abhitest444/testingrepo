import { useCallback, useState } from 'react';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { util as dataLayerUtil } from '@appfabric/ui-data-layer';
import { mapError } from 'src/js/service/utils/mapError';
import { getV4ApolloClient } from 'src/js/service/V4ApolloClientBuilder';
import {
  VendorByIdQuery,
  VendorByIdQueryResponse,
} from '../../queries/contactQueries';

interface VendorData {
  Vendor: {
    BillRate: number;
    CostRate: number;
    DisplayName: string;
    Id: string;
  };
}

interface UseLazyGetVendorDataResult {
  getVendorCallback: (vendorId: string) => void;
  loading: boolean;
  error?: string;
  data: VendorData | undefined;
  resetData: () => void;
}

export const useLazyGetVendorData = (): UseLazyGetVendorDataResult => {
  const sandbox = useSandbox();
  const intl = useIntl();

  const [data, setData] = useState<VendorData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const getVendorCallback = useCallback(
    async (vendorId: string) => {
      setLoading(true);
      setError(undefined);

      try {
        const realmId = sandbox.appContext.getRealmInfo()?.realmId ?? '';
        const vendorGlobalId = dataLayerUtil.GlobalId.convertToGlobalId(
          realmId,
          '/network/Contact',
          vendorId,
        );
        const client = getV4ApolloClient(sandbox);
        const vendorResponse = await client.query<VendorByIdQueryResponse>({
          query: VendorByIdQuery,
          variables: {
            id: vendorGlobalId,
          },
          fetchPolicy: 'network-only',
        });

        const vendorContact = vendorResponse?.data?.node;
        if (vendorContact) {
          sandbox.logger.info(
            `Component: useLazyGetVendorData V4 API responded with data for vendorId=${vendorId}`,
          );

          setData({
            Vendor: {
              BillRate: parseFloat(
                vendorContact?.profiles?.vendor?.jobCosting?.billRate,
              ),
              CostRate: parseFloat(
                vendorContact?.profiles?.vendor?.jobCosting?.costRate,
              ),
              DisplayName: vendorContact.displayName,
              Id: vendorContact.externalIds[0]?.localId,
            },
          });
        } else {
          sandbox.logger.error(
            'Component: useLazyGetVendorData V4 API responded without data',
            { error: vendorResponse?.error },
          );

          setError(
            mapError({
              sourceComponent: 'useLazyGetVendorData',
              sandbox,
              intl,
              error: vendorResponse.error,
            }),
          );
        }
      } catch (err) {
        // Type check and handle the error
        const errorToReport =
          err instanceof Error ? err : new Error(String(err));
        sandbox.logger.error(
          'Component: useLazyGetVendorData V4 API error fetching vendor',
          { error: err },
        );
        setError(
          mapError({
            sourceComponent: 'useLazyGetVendorData',
            sandbox,
            intl,
            error: errorToReport,
          }),
        );
      } finally {
        setLoading(false);
      }
    },
    [sandbox, intl],
  );

  const resetData = useCallback(() => {
    setData(undefined);
  }, []);

  return {
    getVendorCallback,
    loading,
    error,
    data,
    resetData,
  };
};
