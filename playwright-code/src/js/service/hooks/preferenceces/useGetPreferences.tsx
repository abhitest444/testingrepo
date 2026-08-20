import { useState, useEffect } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { V3ApiConnector } from 'src/js/service/rest/V3ApiConnector';
import { PREFERENCES_ENDPOINT } from 'src/js/common/constants';
import { isWorkforceEnvironment } from 'src/js/service/utils/sandboxUtils';

// TODO: {{Customer}} and DepartmentTerminology will be resolved via getToken or preferences API once available for Workforce
// Note: ShowBillRateToAll is handled via billingRateForTimeEnabled in SingleTimeHOC and WeeklyTimeTable
const WORKFORCE_PREFERENCES = {
  Preferences: {
    AccountingInfoPrefs: {
      DepartmentTerminology: 'Department',
      CustomerTerminology: 'Customer',
    },
  },
};

// Custom hook to fetch preferences data
const useGetPreferences = () => {
  const sandbox = useSandbox(); // Initialize your sandbox instance
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    // TODO: {{Customer}} and DepartmentTerminology will be resolved via getToken or preferences API once available for Workforce
    if (isWorkforceEnvironment(sandbox)) {
      setData(WORKFORCE_PREFERENCES);
      setLoading(false);
      return;
    }

    // Function to fetch data with retry logic
    const fetchData = async (retry = 1) => {
      try {
        // Fetch data using V3ApiConnector
        const responseData = await V3ApiConnector(
          PREFERENCES_ENDPOINT,
          sandbox,
        );
        sandbox.logger.info(
          `Component: useGetPreferences Endpoint ${PREFERENCES_ENDPOINT} API responded with data`,
        );
        setData(responseData);
        setLoading(false);
      } catch (err) {
        // Retry fetching data if retry attempts are left
        if (retry > 0) {
          sandbox.logger.warn(
            `Component: useGetPreferences Endpoint ${PREFERENCES_ENDPOINT} retrying... Attempts left: ${retry}`,
          );
          fetchData(retry - 1);
        } else {
          sandbox.logger.error(
            `Component: useGetPreferences Endpoint ${PREFERENCES_ENDPOINT} error fetching preferences data: ${err}`,
          );
          setError(true);
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [sandbox]);

  return { data, loading, error };
};

export default useGetPreferences;
