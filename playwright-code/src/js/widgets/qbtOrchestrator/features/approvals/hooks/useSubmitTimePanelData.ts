import { useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { Common_SortOrder } from 'src/__generated__/oigql/graphql';
import {
  TimeTracking_TimeEntryOrderOn,
  useSearchTimeEntriesLazyQuery,
} from 'src/__generated__/timeTracking/graphql';
import {
  ApolloClientNames,
  buildHeaders,
} from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { getTSheetsRestApiUrl } from 'src/js/service/rest/TSheetsApiClient';
import { Sandbox } from 'src/js/common/sandbox';

import type { WeekTimeGroup } from '../types/Approvals.types';

const ISO_DATE_FORMAT = 'YYYY-MM-DD';
const SUBMIT_TIME_SUMMARY_CUSTOMER_INTERACTION =
  TimeCustomerInteraction.SUBMIT_TIME_PANEL_SUMMARY_LISTED;

interface UserRecord {
  id: number;
  submitted_to?: string | null;
  approved_to?: string | null;
}

interface UsersResponse {
  results?: {
    users?: Record<string, UserRecord>;
  };
}

interface TimeEntryRecord {
  date?: string | null;
  duration?: number | null;
  isOpen?: boolean | null;
  timeBreakId?: string | null;
}

interface FetchSubmitTimePanelDataInput {
  throughDateIso: string;
  weekStartDay: number;
  includeFullSelectedWeek?: boolean;
}

interface FetchSubmitTimePanelDataResult {
  weekGroups: WeekTimeGroup[];
  periodStartDate: string;
  currentUserId: number;
}

const formatIso = (value: dayjs.Dayjs) => value.format(ISO_DATE_FORMAT);

const getWeekStartDate = (date: dayjs.Dayjs, weekStartDay: number) => {
  const dayOfWeek = date.day(); // 0=Sun...6=Sat
  const offset = (dayOfWeek - weekStartDay + 7) % 7;
  return date.subtract(offset, 'day').startOf('day');
};

const deriveDayStatus = (
  isoDate: string,
  approvedTo: string | null | undefined,
  submittedTo: string | null | undefined,
) => {
  if (approvedTo && dayjs(isoDate).isBefore(dayjs(approvedTo), 'day')) {
    return 'submitted' as const;
  }
  if (submittedTo && dayjs(isoDate).isBefore(dayjs(submittedTo), 'day')) {
    return 'submitted' as const;
  }
  return 'pending' as const;
};

const apiGet = async <T>(
  sandbox: Sandbox,
  endpoint: string,
  interactionName: string,
): Promise<T> => {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      ...buildHeaders(sandbox),
      ...getCustomerInteractionPropagationHeaders(sandbox, interactionName),
      intuit_tid: uuidv4(),
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`GET ${endpoint} failed (${response.status})`);
  }

  return (await response.json()) as T;
};

/**
 * API + aggregation hook for submit-time weekly summary data.
 * Mirrors the overtime pattern where container orchestration is separate from API logic.
 */
export const useSubmitTimePanelData = () => {
  const sandbox = useSandbox();
  const [searchTimeEntries] = useSearchTimeEntriesLazyQuery({
    context: {
      clientName: ApolloClientNames.TIME_TRACKING,
    },
    fetchPolicy: 'network-only',
  });

  const fetchSubmitTimePanelData = useCallback(
    async ({
      throughDateIso,
      weekStartDay,
      includeFullSelectedWeek = false,
    }: FetchSubmitTimePanelDataInput): Promise<FetchSubmitTimePanelDataResult> => {
      const baseUrl = `${getTSheetsRestApiUrl(sandbox)}/api/v1`;
      const handleFailure = (err: unknown) => {
        endInteractionWithFailure(
          sandbox,
          SUBMIT_TIME_SUMMARY_CUSTOMER_INTERACTION,
          err instanceof Error ? err.message : String(err),
          err,
        );
        throw err;
      };
      createCustomerInteraction(
        sandbox,
        SUBMIT_TIME_SUMMARY_CUSTOMER_INTERACTION,
      );

      const userResponse = await apiGet<UsersResponse>(
        sandbox,
        `${baseUrl}/current_user`,
        SUBMIT_TIME_SUMMARY_CUSTOMER_INTERACTION,
      ).catch(handleFailure);

      const user = Object.values(userResponse.results?.users || {})[0];
      if (!user?.id) {
        handleFailure(
          new Error(
            'Unable to resolve current user from /current_user response',
          ),
        );
      }

      const selectedThroughDate = dayjs(throughDateIso).startOf('day');
      const effectiveThroughDate = includeFullSelectedWeek
        ? getWeekStartDate(selectedThroughDate, weekStartDay).add(6, 'day')
        : selectedThroughDate;

      const oneMonthLookbackDate = selectedThroughDate
        .subtract(1, 'month')
        .startOf('day');
      const periodStartDate = getWeekStartDate(
        oneMonthLookbackDate,
        weekStartDay,
      );

      // Prevent invalid API ranges (start_date must be <= end_date).
      const timesheetQueryStart = periodStartDate.isAfter(
        effectiveThroughDate,
        'day',
      )
        ? effectiveThroughDate.startOf('day')
        : periodStartDate;

      const timeEntries: TimeEntryRecord[] = [];
      const fetchAllTimeEntryPages = async (after?: string): Promise<void> => {
        const response = await searchTimeEntries({
          variables: {
            first: 250,
            after,
            input: {
              orderBy: [
                {
                  orderOn: TimeTracking_TimeEntryOrderOn.Date,
                  orderDirection: Common_SortOrder.Desc,
                },
                {
                  orderOn: TimeTracking_TimeEntryOrderOn.TimeEntryId,
                  orderDirection: Common_SortOrder.Desc,
                },
              ],
              timeEntryFilter: {
                isExported: false,
                date: {
                  onOrAfter: formatIso(timesheetQueryStart),
                  onOrBefore: formatIso(effectiveThroughDate),
                },
              },
            },
          },
          context: {
            clientName: ApolloClientNames.TIME_TRACKING,
            headers: getCustomerInteractionPropagationHeaders(
              sandbox,
              SUBMIT_TIME_SUMMARY_CUSTOMER_INTERACTION,
            ),
          },
          fetchPolicy: 'network-only',
        }).catch(handleFailure);

        const connection = response.data?.timeTrackingTimeEntries;
        const edges = connection?.edges || [];
        edges.forEach((edge) => {
          if (edge?.node) {
            timeEntries.push(edge.node as unknown as TimeEntryRecord);
          }
        });

        if (
          connection?.pageInfo?.hasNextPage &&
          connection?.pageInfo?.endCursor
        ) {
          await fetchAllTimeEntryPages(connection.pageInfo.endCursor);
        }
      };
      await fetchAllTimeEntryPages();

      const dayAggregates = new Map<
        string,
        { seconds: number; count: number }
      >();
      timeEntries.forEach((entry) => {
        if (!entry.date) return;
        if (entry.isOpen) return;
        // Preserve current behavior that excludes break entries from summary totals.
        if (entry.timeBreakId) return;
        const aggregate = dayAggregates.get(entry.date) || {
          seconds: 0,
          count: 0,
        };
        aggregate.seconds += entry.duration || 0;
        aggregate.count += 1;
        dayAggregates.set(entry.date, aggregate);
      });

      const weekMap = new Map<string, WeekTimeGroup>();
      let cursor = periodStartDate.clone();
      while (
        cursor.isBefore(effectiveThroughDate, 'day') ||
        cursor.isSame(effectiveThroughDate, 'day')
      ) {
        const dayIso = formatIso(cursor);
        const weekStart = getWeekStartDate(cursor, weekStartDay);
        const weekEnd = weekStart.add(6, 'day');
        const displayWeekEnd =
          !includeFullSelectedWeek &&
          (effectiveThroughDate.isSame(weekStart, 'day') ||
            effectiveThroughDate.isAfter(weekStart, 'day')) &&
          (effectiveThroughDate.isSame(weekEnd, 'day') ||
            effectiveThroughDate.isBefore(weekEnd, 'day'))
            ? effectiveThroughDate
            : weekEnd;
        const weekKey = formatIso(weekStart);
        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, {
            id: weekKey,
            weekStart: weekKey,
            weekEnd: formatIso(displayWeekEnd),
            totalMinutes: 0,
            isSubmitted: false,
            isCurrentWeek:
              (effectiveThroughDate.isSame(weekStart, 'day') ||
                effectiveThroughDate.isAfter(weekStart, 'day')) &&
              (effectiveThroughDate.isSame(weekEnd, 'day') ||
                effectiveThroughDate.isBefore(weekEnd, 'day')),
            days: [],
          });
        }

        const aggregate = dayAggregates.get(dayIso);
        const minutes = aggregate ? Math.floor(aggregate.seconds / 60) : 0;
        const dayStatus = deriveDayStatus(
          dayIso,
          user.approved_to,
          user.submitted_to,
        );
        const week = weekMap.get(weekKey)!;
        week.days.push({
          id: dayIso,
          date: dayIso,
          minutes,
          timesheetCount: aggregate?.count || 0,
          status: dayStatus,
        });
        week.totalMinutes += minutes;

        cursor = cursor.add(1, 'day');
      }

      const weekGroups = Array.from(weekMap.values())
        .map((week) => ({
          ...week,
          isSubmitted: week.days.every((day) => day.status === 'submitted'),
          days: week.days.sort((a, b) => b.date.localeCompare(a.date)),
        }))
        .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
      endInteractionWithSuccess(
        sandbox,
        SUBMIT_TIME_SUMMARY_CUSTOMER_INTERACTION,
      );

      return {
        weekGroups,
        periodStartDate: formatIso(periodStartDate),
        currentUserId: user.id,
      };
    },
    [sandbox, searchTimeEntries],
  );

  return { fetchSubmitTimePanelData };
};
