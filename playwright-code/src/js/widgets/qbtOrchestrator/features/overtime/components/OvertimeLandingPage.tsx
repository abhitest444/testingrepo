import React, { useEffect, useCallback } from 'react';
import Trowser from '@ids-ts/trowser';
import { useIntl } from '@payroll/quicksand';
import Button from '@ids-ts/button';
import Typography from '@ids-ts/typography';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  setPolicies,
  setPoliciesPageInfo,
  setLoadingPolicies,
  setError,
  setTrowserOpen,
  setRefetchPolicies,
  selectOvertimePolicies,
  selectIsTrowserOpen,
  selectHasPolicies,
  selectPoliciesPageInfo,
  selectRefetchPolicies,
} from '../store';
import { useOvertimePolicies } from '../hooks';
import { OvertimeFilledState } from './OvertimeFilledState';
import {
  TrowserContent,
  HeaderTextGroup,
  EmptyStateContainer,
} from '../styles/OvertimeLandingPage.styled';
import { OVERTIME_LOGGING } from '../constants/overtimeLoggingConstants';
import { OVERTIME_URLS } from '../constants/overtimeTableConstants';

interface OvertimeLandingPageProps {
  onClose?: () => void;
}

const OvertimeLandingPage: React.FC<OvertimeLandingPageProps> = ({
  onClose,
}) => {
  const intl = useIntl();
  const logger = useLoggingConfig();
  const dispatch = useAppDispatch();

  // Redux state
  const policies = useAppSelector(selectOvertimePolicies);
  const open = useAppSelector(selectIsTrowserOpen);
  const hasPolicies = useAppSelector(selectHasPolicies);
  const pageInfo = useAppSelector(selectPoliciesPageInfo);
  const refetchPolicies = useAppSelector(selectRefetchPolicies);

  // Hook for fetching policies from GraphQL API
  const { fetchPolicies, fetchPage } = useOvertimePolicies();

  // Initialize component: log mount, open trowser, and load policies from API
  useEffect(() => {
    logger.info(OVERTIME_LOGGING.LANDING_PAGE_MOUNTED);
    dispatch(setTrowserOpen(true));

    const loadPolicies = async () => {
      try {
        dispatch(setLoadingPolicies(true));
        const result = await fetchPolicies();
        dispatch(setPolicies(result.policies));
        dispatch(setPoliciesPageInfo(result.pageInfo));
      } catch (error) {
        logger.error(OVERTIME_LOGGING.API_FETCH_POLICIES_FAILED, {
          error,
        });
        dispatch(setError('Failed to load overtime policies'));
      } finally {
        dispatch(setLoadingPolicies(false));
      }
    };

    loadPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch policies when refetchPolicies flag is set (e.g., after deletion)
  useEffect(() => {
    if (refetchPolicies) {
      const refetch = async () => {
        try {
          dispatch(setLoadingPolicies(true));
          const result = await fetchPolicies();
          dispatch(setPolicies(result.policies));
          dispatch(setPoliciesPageInfo(result.pageInfo));
        } catch (error) {
          logger.error(OVERTIME_LOGGING.API_FETCH_POLICIES_FAILED, {
            error,
          });
          dispatch(setError('Failed to load overtime policies'));
        } finally {
          dispatch(setLoadingPolicies(false));
          dispatch(setRefetchPolicies(false));
        }
      };

      refetch();
    }
  }, [refetchPolicies, dispatch, logger, fetchPolicies]);

  // Handle page change for server-side pagination
  const handlePageChange = useCallback(
    async (page: number) => {
      try {
        dispatch(setLoadingPolicies(true));
        const result = await fetchPage(page);
        dispatch(setPolicies(result.policies));
        dispatch(setPoliciesPageInfo(result.pageInfo));
      } catch (error) {
        logger.error(OVERTIME_LOGGING.API_FETCH_POLICIES_FAILED, {
          error,
          page,
        });
        dispatch(setError('Failed to load overtime policies'));
      } finally {
        dispatch(setLoadingPolicies(false));
      }
    },
    [dispatch, fetchPage, logger],
  );

  const handleClose = () => {
    dispatch(setTrowserOpen(false));
    if (onClose) {
      onClose();
    }
  };

  const handleCreatePolicy = () => {
    logger.info(OVERTIME_LOGGING.LANDING_PAGE_CREATE_POLICY_CLICKED);
    // TODO: Navigate to setup policy wizard
    // This will be implemented when setup-policy functionality is ready
  };

  const handleEditPolicy = (policyId: string) => {
    logger.info(OVERTIME_LOGGING.LANDING_PAGE_EDIT_POLICY_CLICKED, {
      policyId,
    });
    // TODO: Navigate to policy details page
  };

  const handleLearnMoreClick = () => {
    logger.info(OVERTIME_LOGGING.LANDING_PAGE_LEARN_MORE_CLICKED);
  };

  const handleCheckLawsClick = () => {
    logger.info(OVERTIME_LOGGING.LANDING_PAGE_CHECK_LAWS_CLICKED);
  };

  return (
    <Trowser
      dismissible
      open={open}
      onClose={handleClose}
      title={intl.formatMessage({
        id: 'overtime.landing.title',
        defaultMessage: 'Overtime',
      })}
      stepFlow
      data-testid="overtime-landing-page-trowser"
      automationId="overtime-landing-page-trowser"
    >
      {open ? (
        <TrowserContent>
          <Typography variant="headline-3" weight="medium">
            {intl.formatMessage({
              id: 'overtime.landing.header.title',
              defaultMessage: 'Manage overtime policies for your company',
            })}
          </Typography>
          <HeaderTextGroup>
            <Typography variant="body-2" weight="regular">
              {intl.formatMessage({
                id: 'overtime.landing.header.description',
                defaultMessage:
                  'Create and manage overtime rates, pay rates and payroll calculations.',
              })}{' '}
              <a
                href={OVERTIME_URLS.LEARN_MORE}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLearnMoreClick}
              >
                {intl.formatMessage({
                  id: 'overtime.landing.header.learn.more',
                  defaultMessage: 'Learn more about overtime',
                })}
              </a>
            </Typography>
            <Typography variant="body-2" weight="regular">
              {intl.formatMessage({
                id: 'overtime.landing.header.link.text',
                defaultMessage: "Don't know your overtime laws?",
              })}{' '}
              <a
                href={OVERTIME_URLS.CHECK_LAWS_BY_STATE}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCheckLawsClick}
              >
                {intl.formatMessage({
                  id: 'overtime.landing.header.link.action',
                  defaultMessage: 'Check out overtime laws by state',
                })}
              </a>
            </Typography>
          </HeaderTextGroup>

          {/* Conditional Rendering: Empty State or Filled State */}
          {!hasPolicies ? (
            <EmptyStateContainer>
              <Typography variant="headline-5" weight="medium">
                {intl.formatMessage({
                  id: 'overtime.landing.empty.title',
                  defaultMessage: 'Set up your overtime policies',
                })}
              </Typography>
              <Typography variant="body-2" weight="regular">
                {intl.formatMessage({
                  id: 'overtime.landing.empty.description',
                  defaultMessage:
                    'Create overtime policies and assign overtime rules to your team to customize how they accumulate overtime.',
                })}
              </Typography>
              <Button
                priority="primary"
                purpose="standard"
                size="medium"
                onClick={handleCreatePolicy}
                data-testid="setup-overtime-policy-button"
              >
                {intl.formatMessage({
                  id: 'overtime.landing.empty.button',
                  defaultMessage: 'Set up overtime policies',
                })}
              </Button>
            </EmptyStateContainer>
          ) : (
            <OvertimeFilledState
              policies={policies}
              pageInfo={pageInfo}
              onCreatePolicy={handleCreatePolicy}
              onEditPolicy={handleEditPolicy}
              onPageChange={handlePageChange}
            />
          )}
        </TrowserContent>
      ) : (
        <></>
      )}
    </Trowser>
  );
};

export default OvertimeLandingPage;
