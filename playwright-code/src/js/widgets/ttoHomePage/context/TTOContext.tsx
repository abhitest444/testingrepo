import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  isExpenseManagementAddonEnabled,
  canSubmitExpenseClaim as canSubmitExpenseClaimFn,
} from '@wfexpmgmt-explifemgmt/expense-mgmt-utils';
import {
  useTimeTrackingBatchAuthorization,
  computeTimeTrackingOnlyUser,
} from 'src/js/service/utils/useTimeTrackingAuthorization';
import { useTTOTimeWindowDuration } from 'src/js/widgets/ttoHomePage/features/details-page/useTTOTimeWindowDuration';
import {
  TimeTracking_TotalDurationTimeWindow,
  TimeTracking_TotalDurationByTimeWindowInput,
} from 'src/__generated__/timeTracking/graphql';
import { useCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { Sandbox } from 'src/js/common/sandbox';
import { getWeekRangeAndMonthLabel } from '../utils';

interface TTOContextType {
  userName: string;
  isExpenseEnabled: boolean;
  canSubmitExpense: boolean;
  companyName: string;
  weekDuration: number | null;
  weekDurationLoading: boolean;
  monthDuration: number | null;
  monthDurationLoading: boolean;
  weekRange: string;
  monthLabel: string;
  isAuthorized: boolean;
  authLoading: boolean;
}

interface TTOProviderProps {
  children: React.ReactNode;
  sandbox: Sandbox;
  routeInfo?: any;
}

const TTOContext = createContext<TTOContextType | undefined>(undefined);

export const TTOProvider: React.FC<TTOProviderProps> = ({
  children,
  sandbox,
  routeInfo,
}) => {
  const [userName, setUserName] = useState<string>('');
  const [isExpenseEnabled, setIsExpenseEnabled] = useState<boolean>(false);
  const [canSubmitExpense, setCanSubmitExpense] = useState<boolean>(false); // used to show expense tile
  const [companyName, setCompanyName] = useState<string>('');
  const [weekDuration, setWeekDuration] = useState<number | null>(null);
  const [weekDurationLoading, setWeekDurationLoading] =
    useState<boolean>(false);
  const [monthDuration, setMonthDuration] = useState<number | null>(null);
  const [monthDurationLoading, setMonthDurationLoading] =
    useState<boolean>(false);
  const { settingsData } = useCompanySettings();
  const [weekRange, setWeekRange] = useState('');
  const [monthLabel, setMonthLabel] = useState('');
  const logger = useLoggingConfig();

  // Get time tracking only employee id
  const { data: timeTrackingAuth, loading: authLoading } =
    useTimeTrackingBatchAuthorization();
  const timeTrackingOnlyId = useMemo(
    () => computeTimeTrackingOnlyUser(timeTrackingAuth),
    [timeTrackingAuth],
  );
  const isAuthorized = useMemo(
    () => !!timeTrackingOnlyId,
    [timeTrackingOnlyId],
  );

  useEffect(() => {
    logger.info(`Computed timeTrackingOnlyId: ${timeTrackingOnlyId}`, {
      timeTrackingOnlyId,
      isAuthorized,
    });
  }, [timeTrackingOnlyId, isAuthorized, logger]);

  // Lazy duration queries
  const [fetchWeekDuration, weekResult] = useTTOTimeWindowDuration();
  const [fetchMonthDuration, monthResult] = useTTOTimeWindowDuration();

  // Trigger queries when we have the id
  useEffect(() => {
    if (timeTrackingOnlyId) {
      const weekInput: TimeTracking_TotalDurationByTimeWindowInput = {
        timeForEntityId: timeTrackingOnlyId,
        timeWindow: TimeTracking_TotalDurationTimeWindow.Week,
        timeWindowOffset: 0,
      };
      const monthInput: TimeTracking_TotalDurationByTimeWindowInput = {
        timeForEntityId: timeTrackingOnlyId,
        timeWindow: TimeTracking_TotalDurationTimeWindow.Month,
        timeWindowOffset: 0,
      };
      logger.info('Triggering week and month duration API calls', {
        weekInput,
        monthInput,
      });
      fetchWeekDuration({ variables: { input: weekInput } });
      fetchMonthDuration({ variables: { input: monthInput } });
    }
  }, [
    timeTrackingOnlyId,
    fetchWeekDuration,
    fetchMonthDuration,
    routeInfo?.path,
    logger,
  ]);

  useEffect(() => {
    setWeekDuration(weekResult.duration);
    setWeekDurationLoading(weekResult.loading);
    if (weekResult.error) {
      logger.error('Week duration API call failed', {
        error: weekResult.error,
      });
    } else if (weekResult.duration !== null && !weekResult.loading) {
      logger.info('Week duration API call succeeded', {
        duration: weekResult.duration,
      });
    }
  }, [weekResult.duration, weekResult.loading, weekResult.error, logger]);

  useEffect(() => {
    setMonthDuration(monthResult.duration);
    setMonthDurationLoading(monthResult.loading);
    if (monthResult.error) {
      logger.error('Month duration API call failed', {
        error: monthResult.error,
      });
    } else if (monthResult.duration !== null && !monthResult.loading) {
      logger.info('Month duration API call succeeded', {
        duration: monthResult.duration,
      });
    }
  }, [monthResult.duration, monthResult.loading, monthResult.error, logger]);

  useEffect(() => {
    // Get user profile
    sandbox.appContext
      .getUserProfile()
      .then((userProfile: any) => {
        const name =
          userProfile?.firstName && userProfile?.lastName
            ? `${userProfile.firstName} ${userProfile.lastName}`
            : userProfile?.userName || userProfile?.email || 'user';
        setUserName(name);
      })
      .catch((error) => {
        logger.error('Failed to get user profile', { error });
        setUserName('user');
      });

    // Get company info
    const company = sandbox.extensions.qbo.context.getCompanyInfo();
    setCompanyName(company?.name || '');

    // Check if expense management is enabled
    const expenseEnabled = isExpenseManagementAddonEnabled(sandbox as any);
    setIsExpenseEnabled(expenseEnabled);
    if (expenseEnabled) {
      canSubmitExpenseClaimFn(sandbox as any)
        .then((result) => {
          setCanSubmitExpense(result);
        })
        .catch((error) => {
          logger.error('Failed to check canSubmitExpenseClaim', { error });
          setCanSubmitExpense(false);
        });
    } else {
      setCanSubmitExpense(false);
    }
  }, [sandbox, logger]);

  useEffect(() => {
    if (settingsData && settingsData.firstDayOfWeek !== undefined) {
      const { weekRange, monthLabel } = getWeekRangeAndMonthLabel(
        settingsData.firstDayOfWeek,
      );
      setWeekRange(weekRange);
      setMonthLabel(monthLabel);
    }
  }, [settingsData]);

  const value = {
    userName,
    isExpenseEnabled,
    canSubmitExpense,
    companyName,
    weekDuration,
    weekDurationLoading,
    monthDuration,
    monthDurationLoading,
    weekRange,
    monthLabel,
    isAuthorized,
    authLoading,
  };

  return <TTOContext.Provider value={value}>{children}</TTOContext.Provider>;
};

export const useTTOContext = () => {
  const context = useContext(TTOContext);
  if (context === undefined) {
    throw new Error('useTTOContext must be used within a TTOProvider');
  }
  return context;
};
