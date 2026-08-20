import React from 'react';
import { Typography } from '@ids-ts/typography';
import { Button } from '@ids-ts/button';
import { useIntl } from '@payroll/quicksand';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { ReactComponent as TimeIcon } from 'src/assets/images/Time.svg';
import { useLoggingConfig } from 'src/js/providers/LoggingConfigProvider';
import { useTTOContext } from '../../context/TTOContext';
import {
  Wrapper,
  CardWrapper,
  StyledCard,
  CardContent,
  StyledDivider,
  LowerSection,
  HoursHeaderRow,
  Hours,
  HourBlock,
  HourValue,
  AddTimeCard,
  AddTimeIcon,
  AddTimeText,
} from './TTOHomePage.styled';
import SubscriptionCancellationModal from './SubscriptionCancellationModal';
import { formatDuration } from '../../utils';
import { DEFAULT_DURATION_PLACEHOLDER } from '../../constants';

interface TTOHomePageProps {
  onAddTime: () => void;
  onView: () => void;
  sandbox: any;
}

const TTOHomePage: React.FC<TTOHomePageProps> = ({
  onAddTime,
  onView,
  sandbox,
}) => {
  const {
    userName,
    companyName,
    weekDuration,
    monthDuration,
    weekDurationLoading,
    monthDurationLoading,
    canSubmitExpense,
  } = useTTOContext();
  const intl = useIntl();
  const logger = useLoggingConfig();
  const subtitle = `${intl.formatMessage({
    id: 'track.work.for',
  })} ${companyName}`;

  React.useEffect(() => {
    logger.info('TTOHomePage rendered', { userName, companyName });
  }, [userName, companyName, logger]);

  return (
    <Wrapper data-testid="tto-homepage-wrapper">
      <SubscriptionCancellationModal />
      <Typography
        variant="headline-4"
        style={{ fontWeight: 700, marginBottom: 8 }}
        data-testid="tto-homepage-headline"
      >
        {intl.formatMessage({ id: 'welcome.user' }, { userName })}
      </Typography>
      <Typography
        variant="body-1"
        style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}
        data-testid="tto-homepage-subtitle"
      >
        {subtitle}
      </Typography>
      <CardWrapper data-testid="tto-homepage-card-wrapper">
        <StyledCard data-testid="tto-homepage-card">
          <CardContent data-testid="tto-homepage-card-content">
            <HoursHeaderRow data-testid="tto-homepage-hours-header-row">
              <div
                style={{
                  fontWeight: 600,
                  color:
                    'var(--color-text-secondary)' /* (SemanticContextMatchOnly) */,
                }}
                data-testid="tto-homepage-hours-label"
              >
                {intl.formatMessage({ id: 'hours' })}
              </div>
              <Button
                priority="tertiary"
                onClick={onView}
                style={{ minWidth: 0, padding: 0 }}
                data-testid="tto-homepage-view-button"
              >
                {intl.formatMessage({ id: 'view' })}
              </Button>
            </HoursHeaderRow>
            <Hours data-testid="tto-homepage-hours">
              <HourBlock data-testid="tto-homepage-week-hour-block">
                <HourValue data-testid="tto-homepage-week-hour-value">
                  {weekDurationLoading
                    ? DEFAULT_DURATION_PLACEHOLDER
                    : formatDuration(weekDuration)}
                </HourValue>
                <div
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '1rem' /* (NoTokenFound) */,
                  }}
                >
                  <Typography
                    variant="body-3"
                    style={{ color: 'var(--color-text-secondary)' }}
                    data-testid="tto-homepage-week-label"
                  >
                    {intl.formatMessage({ id: 'this.week' })}
                  </Typography>
                </div>
              </HourBlock>
              <HourBlock data-testid="tto-homepage-month-hour-block">
                <HourValue data-testid="tto-homepage-month-hour-value">
                  {monthDurationLoading
                    ? DEFAULT_DURATION_PLACEHOLDER
                    : formatDuration(monthDuration)}
                </HourValue>
                <div
                  style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '1rem',
                  }}
                >
                  <Typography
                    variant="body-3"
                    style={{ color: 'var(--color-text-secondary)' }}
                    data-testid="tto-homepage-month-label"
                  >
                    {intl.formatMessage({ id: 'this.month' })}
                  </Typography>
                </div>
              </HourBlock>
            </Hours>
          </CardContent>
          <StyledDivider data-testid="tto-homepage-divider" />
          <LowerSection data-testid="tto-homepage-lower-section">
            <AddTimeCard
              onClick={onAddTime}
              role="button"
              tabIndex={0}
              data-testid="add-time-card"
            >
              <AddTimeIcon data-testid="add-time-icon">
                <TimeIcon />
              </AddTimeIcon>
              <AddTimeText data-testid="add-time-text">
                <Typography
                  variant="body-1"
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                  }}
                  data-testid="add-time-label"
                >
                  {intl.formatMessage({ id: 'add.time' })}
                </Typography>
                <Typography
                  variant="body-3"
                  style={{ color: 'var(--color-text-secondary)' }}
                  data-testid="add-time-desc"
                >
                  {intl.formatMessage({ id: 'enter.your.hours' })}
                </Typography>
              </AddTimeText>
            </AddTimeCard>
          </LowerSection>
        </StyledCard>
      </CardWrapper>
      {canSubmitExpense && (
        <div data-testid="tto-homepage-expense-tile-wrapper">
          <Widget
            widgetId="eem/expense-tile"
            key="time-tracking-ui:eem/expense-tile"
            sandbox={sandbox}
          />
        </div>
      )}
    </Wrapper>
  );
};

export default TTOHomePage;
