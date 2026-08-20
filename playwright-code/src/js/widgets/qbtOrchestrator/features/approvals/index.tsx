import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSandbox, useIntl } from '@payroll/quicksand';
import { Activity } from '@ids-ts/loader';
import Typography from '@ids-ts/typography';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import { SubmitTimeDatesProvider } from 'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider';
import { storeManager } from '../../store/storeManager';
import { approvalsReducer } from './store';
import { APPROVALS_LOGGING, APPROVALS_FUNCTIONALITY } from './constants';
import {
  SUCCESS_TOAST_CLOSE_DELAY_MS,
  formatHoursMinutes,
} from './constants/approvalsConstants';
import { ORCHESTRATOR_LOGGING } from '../../constants';
import { LoadingContainer } from './styles/SubmitTimePanel.styled';

const SubmitTimePanelContainer = lazy(
  () => import('./components/SubmitTimePanel/SubmitTimePanelContainer'),
);

interface ApprovalsFeatureProps {
  functionality?: string;
  onClose?: () => void;
  onSubmitSuccess?: () => void;
}

/**
 * Approvals Feature - Handles time approval-related functionality
 * Includes: Submit Time Panel
 */
const ApprovalsFeature: React.FC<ApprovalsFeatureProps> = ({
  functionality = APPROVALS_FUNCTIONALITY.SUBMIT_TIME_PANEL,
  onClose,
  onSubmitSuccess,
}) => {
  const sandbox = useSandbox();
  const intl = useIntl();
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastMessage, setSuccessToastMessage] = useState('');
  const submitSuccessCallbackTimeoutRef = useRef<number | null>(null);

  const handleSubmitSuccess = useCallback(
    (submittedMinutes: number = 0) => {
      setSuccessToastMessage(
        intl.formatMessage(
          {
            id: 'approvals.submitTimePanel.submitSuccessToast',
            defaultMessage: '{duration} submitted',
          },
          { duration: formatHoursMinutes(submittedMinutes) },
        ),
      );
      setShowSuccessToast(true);

      if (submitSuccessCallbackTimeoutRef.current) {
        window.clearTimeout(submitSuccessCallbackTimeoutRef.current);
      }

      // Keep toast visible before allowing host-level success handling/close.
      submitSuccessCallbackTimeoutRef.current = window.setTimeout(() => {
        onSubmitSuccess?.();
      }, SUCCESS_TOAST_CLOSE_DELAY_MS);
    },
    [intl, onSubmitSuccess],
  );

  // Inject reducer on mount
  useEffect(() => {
    if (!storeManager.hasReducer('approvals')) {
      storeManager.inject('approvals', approvalsReducer);
      sandbox.logger.info(ORCHESTRATOR_LOGGING.REDUCER_INJECTED, {
        feature: 'approvals',
      });
    }
  }, [sandbox]);

  // Log component mount
  useEffect(() => {
    sandbox.logger.info(APPROVALS_LOGGING.FEATURE_MOUNTED, {
      functionality,
    });
  }, [sandbox, functionality]);

  useEffect(
    () => () => {
      if (submitSuccessCallbackTimeoutRef.current) {
        window.clearTimeout(submitSuccessCallbackTimeoutRef.current);
      }
    },
    [],
  );

  const renderContent = () => {
    switch (functionality) {
      case APPROVALS_FUNCTIONALITY.SUBMIT_TIME_PANEL:
        return (
          <SubmitTimeDatesProvider>
            <SubmitTimePanelContainer
              onClose={onClose}
              onSubmitSuccess={handleSubmitSuccess}
            />
          </SubmitTimeDatesProvider>
        );
      default:
        sandbox.logger.error(APPROVALS_LOGGING.UNKNOWN_FUNCTIONALITY, {
          functionality,
        });
        return (
          <Typography variant="body-2" weight="regular">
            {intl.formatMessage(
              {
                id: 'approvals.feature.unknownFunctionality',
                defaultMessage:
                  'Unknown approvals functionality: {functionality}',
              },
              { functionality },
            )}
          </Typography>
        );
    }
  };

  const loadingFallback = (
    <LoadingContainer>
      <Activity
        shape="dots"
        size="large"
        data-testid="approvals-feature-loader"
      />
    </LoadingContainer>
  );

  return (
    <>
      <Suspense fallback={loadingFallback}>{renderContent()}</Suspense>
      {showSuccessToast && (
        <SuccessToast
          message={successToastMessage}
          open={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </>
  );
};

export default ApprovalsFeature;
