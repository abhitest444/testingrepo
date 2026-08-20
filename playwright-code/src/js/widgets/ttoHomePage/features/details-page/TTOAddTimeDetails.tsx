import React, { useEffect, useState } from 'react';
import Typography from '@ids-ts/typography';
import { useIntl } from '@payroll/quicksand';
import { ReactComponent as CalendarIcon } from 'src/assets/images/Calendar.svg';
import { ReactComponent as TimeIcon } from 'src/assets/images/Time.svg';
import { ReactComponent as ReportIcon } from 'src/assets/images/Report.svg';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import {
  PageContainer,
  BackLink,
  Card,
  CardHeader,
  TimeSummary,
  TimeBlock,
  OptionList,
  Option,
  OptionIcon,
  OptionContent,
  OptionButton,
} from './TTOAddTimeDetails.styled';
import { useTTOContext } from '../../context/TTOContext';
import {
  NAVIGATION_ROUTES,
  DEFAULT_USER,
  DEFAULT_DURATION_PLACEHOLDER,
} from '../../constants';
import { formatDuration } from '../../utils';

interface TTOAddTimeDetailsProps {
  onBack?: () => void;
  sandbox: any;
}

const TTOAddTimeDetails: React.FC<TTOAddTimeDetailsProps> = ({
  onBack,
  sandbox,
}) => {
  const [userName, setUserName] = useState<string>('');
  const [company, setCompany] = useState<string>('');
  const {
    weekDuration,
    monthDuration,
    weekDurationLoading,
    monthDurationLoading,
    weekRange,
    monthLabel,
  } = useTTOContext();
  const intl = useIntl();
  const logger = useLoggingConfig();

  useEffect(() => {
    sandbox.appContext.getUserProfile().then((userProfile: any) => {
      setUserName(
        userProfile?.firstName && userProfile?.lastName
          ? `${userProfile.firstName} ${userProfile.lastName}`
          : userProfile?.userName || userProfile?.email || DEFAULT_USER,
      );
    });
    setCompany(sandbox.extensions.qbo.context.getCompanyInfo().name);
  }, [sandbox]);

  React.useEffect(() => {
    logger.info('TTOAddTimeDetails rendered');
  }, [logger]);

  const handleWeekly = () => {
    sandbox.navigation.navigate(NAVIGATION_ROUTES.TIMETRACKING);
  };
  const handleTimeActivity = () => {
    sandbox.navigation.navigate(NAVIGATION_ROUTES.TIME_ACTIVITY);
  };
  const handleReport = () => {
    // Add back navigation parameters so users can return to Time Tracking homepage
    const backLinkText = encodeURIComponent('homepage');
    const backLinkRoute = encodeURIComponent(NAVIGATION_ROUTES.HOME);
    // Note: NAVIGATION_ROUTES.REPORT already includes '?' and ends with '&'
    const reportUrl = `${NAVIGATION_ROUTES.REPORT}backLinkRoute=${backLinkRoute}&backLinkText=${backLinkText}`;
    sandbox.navigation.navigate(reportUrl);
  };

  return (
    <PageContainer data-testid="tto-add-time-details-page-container">
      {onBack && (
        <BackLink onClick={onBack} data-testid="tto-add-time-details-back-link">
          &larr;{' '}
          <Typography variant="body-2" as="span">
            {intl.formatMessage({ id: 'back' })}
          </Typography>
        </BackLink>
      )}
      <Card data-testid="tto-add-time-details-card">
        <CardHeader data-testid="tto-add-time-details-card-header">
          <Typography
            variant="body-1"
            style={{ fontWeight: 700, display: 'block', marginBottom: 2 }}
          >
            Hi, {userName}
          </Typography>
          <Typography
            variant="body-3"
            style={{
              color: 'var(--color-text-secondary)',
              display: 'block',
              marginBottom: 18,
            }}
          >
            {intl.formatMessage({ id: 'track.time.for' })} {company}
          </Typography>
          <div style={{ marginTop: 16 }}>
            <Typography
              variant="body-2"
              style={{
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                display: 'block',
              }}
            >
              {intl.formatMessage({ id: 'total.time.reported' })}
            </Typography>
            <TimeSummary data-testid="tto-add-time-details-time-summary">
              <TimeBlock data-testid="tto-add-time-details-week-time-block">
                <Typography
                  variant="headline-4"
                  style={{ fontWeight: 700, marginBottom: 0 }}
                >
                  {weekDurationLoading
                    ? DEFAULT_DURATION_PLACEHOLDER
                    : formatDuration(weekDuration)}
                </Typography>
                <Typography
                  variant="body-3"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {intl.formatMessage({ id: 'this.week.range' })}: {weekRange}
                </Typography>
              </TimeBlock>
              <TimeBlock data-testid="tto-add-time-details-month-time-block">
                <Typography
                  variant="headline-4"
                  style={{ fontWeight: 700, marginBottom: 0 }}
                >
                  {monthDurationLoading
                    ? DEFAULT_DURATION_PLACEHOLDER
                    : formatDuration(monthDuration)}
                </Typography>
                <Typography
                  variant="body-3"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {intl.formatMessage({ id: 'this.month.range' })}: {monthLabel}
                </Typography>
              </TimeBlock>
            </TimeSummary>
          </div>
        </CardHeader>
      </Card>
      <OptionList data-testid="tto-add-time-details-option-list">
        <Option data-testid="tto-add-time-details-option-weekly">
          <OptionIcon data-testid="tto-add-time-details-option-weekly-icon">
            <CalendarIcon />
          </OptionIcon>
          <OptionContent data-testid="tto-add-time-details-option-weekly-content">
            <Typography
              variant="body-1"
              style={{ fontWeight: 600, marginBottom: 0 }}
            >
              {intl.formatMessage({ id: 'weekly.timesheet' })}
            </Typography>
            <Typography
              variant="body-2"
              style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}
            >
              {intl.formatMessage({ id: 'enter.hours.for.week' })}
            </Typography>
            <OptionButton
              onClick={handleWeekly}
              data-testid="tto-add-time-details-option-weekly-button"
            >
              {intl.formatMessage({ id: 'weekly' })}
            </OptionButton>
          </OptionContent>
        </Option>
        <Option data-testid="tto-add-time-details-option-time-activity">
          <OptionIcon data-testid="tto-add-time-details-option-time-activity-icon">
            <TimeIcon />
          </OptionIcon>
          <OptionContent data-testid="tto-add-time-details-option-time-activity-content">
            <Typography
              variant="body-1"
              style={{ fontWeight: 600, marginBottom: 0 }}
            >
              {intl.formatMessage({ id: 'time.activity' })}
            </Typography>
            <Typography
              variant="body-2"
              style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}
            >
              {intl.formatMessage({ id: 'enter.hours.for.day' })}
            </Typography>
            <OptionButton
              onClick={handleTimeActivity}
              data-testid="tto-add-time-details-option-time-activity-button"
            >
              {intl.formatMessage({ id: 'single.activity' })}
            </OptionButton>
          </OptionContent>
        </Option>
        <Option data-testid="tto-add-time-details-option-report">
          <OptionIcon data-testid="tto-add-time-details-option-report-icon">
            <ReportIcon />
          </OptionIcon>
          <OptionContent data-testid="tto-add-time-details-option-report-content">
            <Typography
              variant="body-1"
              style={{ fontWeight: 600, marginBottom: 0 }}
            >
              {intl.formatMessage({ id: 'report' })}
            </Typography>
            <Typography
              variant="body-2"
              style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}
            >
              {intl.formatMessage({ id: 'view.report' })}
            </Typography>
            <OptionButton
              onClick={handleReport}
              data-testid="tto-add-time-details-option-report-button"
            >
              {intl.formatMessage({ id: 'go.to.report' })}
            </OptionButton>
          </OptionContent>
        </Option>
      </OptionList>
    </PageContainer>
  );
};

export default TTOAddTimeDetails;
