import { useEffect, useState } from 'react';
import { useSandbox } from '@payroll/quicksand';
import { UserProfileInfo } from '@appfabric/sandbox-spec/lib/core/SandboxAppContext';

export interface GetUserInfoState {
  data?: UserProfileInfo;
  loading: boolean;
  error?: string;
}

export const useGetUserInfo = (skip = false): GetUserInfoState => {
  const sandbox = useSandbox();
  const [data, setData] = useState<UserProfileInfo | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(!skip);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    // if skip is true, set loading as false and directly return
    if (skip) {
      setLoading(false);
      return;
    }

    // if skip is false, fetch user info
    const fetchUserInfo = async () => {
      try {
        const result = await sandbox.appContext.getUserProfile();
        setData(result as UserProfileInfo);
      } catch (err) {
        setError(err as string);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [sandbox, skip]);

  return {
    data,
    loading,
    error,
  };
};
