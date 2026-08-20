import React, { useMemo, useState } from 'react';
import { useIntl } from '@payroll/quicksand';
import dayjs from 'dayjs';
import Button from '@ids-ts/button';
import DatePicker, { ChangeEventType } from '@ids-ts/date-picker';
import Typography from '@ids-ts/typography';
import { Activity } from '@ids-ts/loader';
import PageMessage from '@ids-ts/page-message';
import {
  Drawer,
  DrawerHeader,
  DrawerContent,
  DrawerFooter,
} from '@ids-ts/drawer';
import { ChevronDown, ChevronUp } from '@design-systems/icons';

import { useSubmitTimeDatesContext } from 'src/js/widgets/common/submitTimeDates/SubmitTimeDatesProvider';
import type {
  SubmitTimePanelProps,
  WeekTimeGroup,
  DayTimeEntry,
} from '../../types/Approvals.types';
import {
  ContentSection,
  DescriptionText,
  DatePickerSection,
  SummaryText,
  DataGridContainer,
  WeekRowButton,
  WeekRowContent,
  WeekLabelContent,
  WeekRowLabel,
  WeekRowHours,
  DayRow,
  DayLabelGroup,
  DayLabel,
  DaySubLabel,
  DayHoursGroup,
  DayHours,
  TableHeaderRow,
  EmptyStateContainer,
  LoadingContainer,
  FooterActions,
} from '../../styles/SubmitTimePanel.styled';
import SubmitTimeConfirmationModal from './SubmitTimeConfirmationModal';
import { formatHoursMinutes } from '../../constants';

const DATE_DISPLAY_FORMAT = 'M/D/YYYY';
const ISO_DATE_FORMAT = 'YYYY-MM-DD';
const MONTH_SHORT_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * SubmitTimePanel - Presentational component for submitting unapproved time
 * up to a chosen "submit through" date.

 */
const SubmitTimePanel: React.FC<SubmitTimePanelProps> = ({
  title,
  submitThroughDate,
  summaryThroughDate,
  showFullWeekSubmissionText,
  periodStartDate,
  weekGroups,
  expandedWeekIds,
  totalUnapprovedMinutes,
  isLoading,
  isSubmitting,
  error,
  onClose,
  onSubmitThroughDateChange,
  onToggleWeekExpanded,
  onOpenSubmitConfirmation,
  onSubmit,
  onDismissError,
  submitConfirmationMessage,
}) => {
  const intl = useIntl();
  const { minSelectableDate } = useSubmitTimeDatesContext();
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const panelTitle =
    title ||
    intl.formatMessage({
      id: 'approvals.submitTimePanel.title',
      defaultMessage: 'Submit time',
    });

  const submitThroughValue = useMemo(() => {
    if (!submitThroughDate) return '';
    return dayjs(submitThroughDate).format(DATE_DISPLAY_FORMAT);
  }, [submitThroughDate]);

  const periodLabel = useMemo(() => {
    const periodEndDate = summaryThroughDate || submitThroughDate;
    if (!periodStartDate || !periodEndDate) return '';
    const start = dayjs(periodStartDate);
    const end = dayjs(periodEndDate);
    const startMonth = MONTH_SHORT_LABELS[start.month()];
    const endMonth = MONTH_SHORT_LABELS[end.month()];
    return `${startMonth} ${start.date()} - ${endMonth} ${end.date()}, ${end.year()}`;
  }, [periodStartDate, submitThroughDate, summaryThroughDate]);

  const summaryDuration = formatHoursMinutes(totalUnapprovedMinutes);

  const handleDateChange = (event: ChangeEventType) => {
    const value = (event.target as HTMLInputElement)?.value?.toString() || '';
    if (!value) return;
    const parsed = dayjs(value, DATE_DISPLAY_FORMAT);
    if (parsed.isValid()) {
      onSubmitThroughDateChange(parsed.format(ISO_DATE_FORMAT));
    }
  };

  const formatDayLabel = (day: DayTimeEntry): string => {
    const date = dayjs(day.date);
    return date.format('dddd, MMMM D');
  };

  const formatWeekLabel = (week: WeekTimeGroup): string => {
    const start = dayjs(week.weekStart);
    const end = dayjs(week.weekEnd);
    const range = start.isSame(end, 'month')
      ? `${start.format('MMMM D')} - ${end.format('D')}`
      : `${start.format('MMMM D')} - ${end.format('MMMM D')}`;
    if (week.isCurrentWeek) {
      return intl.formatMessage(
        {
          id: 'approvals.submitTimePanel.week.currentWeekLabel',
          defaultMessage: '{range} (this week)',
        },
        { range },
      );
    }
    return range;
  };

  const formatDaySubLabel = (day: DayTimeEntry): string => {
    if (day.minutes === 0) {
      return intl.formatMessage({
        id: 'approvals.submitTimePanel.day.noTimesheets',
        defaultMessage: 'No timesheets',
      });
    }
    return intl.formatMessage(
      {
        id: 'approvals.submitTimePanel.day.timesheetCount',
        defaultMessage:
          '{count, plural, one {# timesheet} other {# timesheets}}',
      },
      { count: day.timesheetCount },
    );
  };

  const isToday = (isoDate: string): boolean =>
    dayjs(isoDate).isSame(dayjs(), 'day');

  const renderTableContent = () => {
    if (isLoading) {
      return (
        <LoadingContainer>
          <Activity
            shape="dots"
            size="large"
            data-testid="submit-time-panel-loader"
          />
        </LoadingContainer>
      );
    }

    if (weekGroups.length === 0) {
      return (
        <EmptyStateContainer>
          <Typography variant="body-2" weight="regular">
            {intl.formatMessage({
              id: 'approvals.submitTimePanel.noEntries',
              defaultMessage:
                'No time entries found for the selected date range.',
            })}
          </Typography>
        </EmptyStateContainer>
      );
    }

    return (
      <div data-testid="submit-time-week-table">
        <TableHeaderRow aria-hidden>
          <DayLabel>
            {intl.formatMessage({
              id: 'approvals.submitTimePanel.table.date',
              defaultMessage: 'Date',
            })}
          </DayLabel>
          <DayLabel>
            {intl.formatMessage({
              id: 'approvals.submitTimePanel.table.hours',
              defaultMessage: 'Hours',
            })}
          </DayLabel>
        </TableHeaderRow>
        {weekGroups.map((week) => {
          const isExpanded = expandedWeekIds.includes(week.id);
          const ChevronIcon = isExpanded ? ChevronDown : ChevronUp;
          const weekHoursDisplay = week.isSubmitted
            ? intl.formatMessage(
                {
                  id: 'approvals.submitTimePanel.week.submittedHours',
                  defaultMessage: '{hours} (submitted)',
                },
                { hours: formatHoursMinutes(week.totalMinutes) },
              )
            : formatHoursMinutes(week.totalMinutes);

          return (
            <React.Fragment key={week.id}>
              <WeekRowButton
                type="button"
                $submitted={week.isSubmitted}
                aria-expanded={isExpanded}
                aria-controls={`week-${week.id}-days`}
                onClick={() => onToggleWeekExpanded(week.id)}
                data-testid={`week-row-${week.id}`}
              >
                <WeekRowContent>
                  <WeekLabelContent>
                    <ChevronIcon size="small" />
                    <WeekRowLabel $submitted={week.isSubmitted}>
                      {formatWeekLabel(week)}
                    </WeekRowLabel>
                  </WeekLabelContent>
                  <WeekRowHours $submitted={week.isSubmitted}>
                    {weekHoursDisplay}
                  </WeekRowHours>
                </WeekRowContent>
              </WeekRowButton>
              {isExpanded && (
                <div id={`week-${week.id}-days`}>
                  {week.days.map((day) => {
                    const isDaySubmitted = day.status === 'submitted';
                    const dayHoursDisplay =
                      day.minutes === 0
                        ? null
                        : formatHoursMinutes(day.minutes);
                    return (
                      <DayRow
                        key={day.id}
                        $submitted={isDaySubmitted}
                        data-testid={`day-row-${day.id}`}
                      >
                        <DayLabelGroup>
                          <DayLabel>{formatDayLabel(day)}</DayLabel>
                          {isToday(day.date) && (
                            <DaySubLabel data-testid={`day-${day.id}-today`}>
                              {intl.formatMessage({
                                id: 'approvals.submitTimePanel.day.today',
                                defaultMessage: 'Today',
                              })}
                            </DaySubLabel>
                          )}
                        </DayLabelGroup>
                        <DayHoursGroup>
                          {dayHoursDisplay && (
                            <DayHours>
                              {isDaySubmitted
                                ? intl.formatMessage(
                                    {
                                      id: 'approvals.submitTimePanel.day.submittedHours',
                                      defaultMessage: '{hours} (submitted)',
                                    },
                                    { hours: dayHoursDisplay },
                                  )
                                : dayHoursDisplay}
                            </DayHours>
                          )}
                          <DaySubLabel>{formatDaySubLabel(day)}</DaySubLabel>
                        </DayHoursGroup>
                      </DayRow>
                    );
                  })}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Drawer
        backdrop
        open
        size="medium"
        onClose={onClose}
        data-testid="submit-time-panel"
      >
        <DrawerHeader title={panelTitle} onClose={onClose} />
        <DrawerContent>
          {error && (
            <PageMessage
              type="error"
              open
              dismissible
              onClose={onDismissError}
              data-testid="submit-time-panel-error"
            >
              {error}
            </PageMessage>
          )}
          <ContentSection>
            <DescriptionText data-testid="submit-time-panel-description">
              {showFullWeekSubmissionText
                ? intl.formatMessage({
                    id: 'approvals.submitTimePanel.description.fullWeek',
                    defaultMessage:
                      'Submit unapproved time up to a chosen date for the past month. Time submissions will be for the entire week of the selected date.',
                  })
                : intl.formatMessage({
                    id: 'approvals.submitTimePanel.description.partialWeek',
                    defaultMessage:
                      'Submit unapproved time up to a chosen date for the past month.',
                  })}
            </DescriptionText>

            <DatePickerSection>
              <DatePicker
                label={intl.formatMessage({
                  id: 'approvals.submitTimePanel.submitThrough',
                  defaultMessage: 'Submit through',
                })}
                value={submitThroughValue}
                dateFormat={DATE_DISPLAY_FORMAT.toLowerCase()}
                minDate={minSelectableDate?.format(ISO_DATE_FORMAT)}
                onChange={handleDateChange}
                data-testid="submit-through-date-picker"
              />
            </DatePickerSection>

            <SummaryText data-testid="submit-time-panel-summary">
              <strong>{formatHoursMinutes(totalUnapprovedMinutes)}</strong>{' '}
              {intl.formatMessage({
                id: 'approvals.submitTimePanel.summaryConnector',
                defaultMessage: 'to submit through',
              })}{' '}
              <strong>{periodLabel}</strong>
            </SummaryText>

            <DataGridContainer>{renderTableContent()}</DataGridContainer>
          </ContentSection>
        </DrawerContent>
        <DrawerFooter>
          <FooterActions>
            <Button
              priority="tertiary"
              size="medium"
              onClick={onClose}
              disabled={isSubmitting}
              data-testid="submit-time-panel-cancel-button"
            >
              {intl.formatMessage({
                id: 'approvals.submitTimePanel.cancel',
                defaultMessage: 'Cancel',
              })}
            </Button>
            <Button
              priority="primary"
              purpose="standard"
              size="medium"
              onClick={() => {
                onOpenSubmitConfirmation();
                setIsConfirmationModalOpen(true);
              }}
              disabled={totalUnapprovedMinutes === 0 || isSubmitting}
              data-testid="submit-time-panel-submit-button"
            >
              {isSubmitting
                ? intl.formatMessage({
                    id: 'approvals.submitTimePanel.submitting',
                    defaultMessage: 'Submitting...',
                  })
                : intl.formatMessage({
                    id: 'approvals.submitTimePanel.submit',
                    defaultMessage: 'Submit',
                  })}
            </Button>
          </FooterActions>
        </DrawerFooter>
      </Drawer>

      <SubmitTimeConfirmationModal
        open={isConfirmationModalOpen}
        onCancel={() => setIsConfirmationModalOpen(false)}
        onConfirm={() => {
          setIsConfirmationModalOpen(false);
          onSubmit();
        }}
        message={submitConfirmationMessage}
        periodLabel={periodLabel}
        summaryDuration={summaryDuration}
      />
    </>
  );
};

export default SubmitTimePanel;
