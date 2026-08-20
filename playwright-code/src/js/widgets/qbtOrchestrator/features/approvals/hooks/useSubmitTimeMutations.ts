import { useCallback } from 'react';
import { useSandbox } from '@payroll/quicksand';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { buildHeaders } from 'src/js/service/ApolloClientBuilderUtils';
import {
  createCustomerInteraction,
  endInteractionWithFailure,
  endInteractionWithSuccess,
  getCustomerInteraction,
  getCustomerInteractionPropagationHeaders,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';
import { getTSheetsRestApiUrl } from 'src/js/service/rest/TSheetsApiClient';
import { Sandbox } from 'src/js/common/sandbox';

const ISO_DATE_FORMAT = 'YYYY-MM-DD';
const SUBMIT_TIME_ENTRY_SUBMITTED_CUSTOMER_INTERACTION =
  TimeCustomerInteraction.SUBMIT_TIME_PANEL_ENTRY_SUBMITTED;

interface UserRecord {
  id: number;
}

interface UsersResponse {
  results?: {
    users?: Record<string, UserRecord>;
  };
}

interface UserUpdateResponse {
  results?: {
    users?: Record<
      string,
      {
        _status_code?: number;
        _status_message?: string;
      }
    >;
  };
}

const buildRequestHeaders = (sandbox: Sandbox, interactionName: string) => ({
  ...buildHeaders(sandbox),
  ...getCustomerInteractionPropagationHeaders(sandbox, interactionName),
  intuit_tid: uuidv4(),
  'Content-Type': 'application/json',
});

const apiGet = async <T>(
  sandbox: Sandbox,
  endpoint: string,
  interactionName: string,
): Promise<T> => {
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: buildRequestHeaders(sandbox, interactionName),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`GET ${endpoint} failed (${response.status})`);
  }

  return (await response.json()) as T;
};

const apiPut = async <T>(
  sandbox: Sandbox,
  endpoint: string,
  body: unknown,
  interactionName: string,
): Promise<T> => {
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: buildRequestHeaders(sandbox, interactionName),
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`PUT ${endpoint} failed (${response.status})`);
  }

  return (await response.json()) as T;
};

interface SubmitTimeInput {
  throughDateIso: string;
  userId?: number;
}

/**
 * Mutations hook for submit-time actions.
 */
export const useSubmitTimeMutations = () => {
  const sandbox = useSandbox();

  const submitTime = useCallback(
    async ({ throughDateIso, userId }: SubmitTimeInput): Promise<void> => {
      const baseUrl = `${getTSheetsRestApiUrl(sandbox)}/api/v1`;
      let resolvedUserId = userId;
      // Primary owner for this interaction is the trowser submit handler.
      // Keep a fallback here for any non-trowser callers.
      if (
        !getCustomerInteraction(
          sandbox,
          SUBMIT_TIME_ENTRY_SUBMITTED_CUSTOMER_INTERACTION,
        )
      ) {
        createCustomerInteraction(
          sandbox,
          SUBMIT_TIME_ENTRY_SUBMITTED_CUSTOMER_INTERACTION,
        );
      }
      try {
        if (!resolvedUserId) {
          const userResponse = await apiGet<UsersResponse>(
            sandbox,
            `${baseUrl}/current_user`,
            SUBMIT_TIME_ENTRY_SUBMITTED_CUSTOMER_INTERACTION,
          );
          const user = Object.values(userResponse.results?.users || {})[0];
          resolvedUserId = user?.id;
        }

        if (!resolvedUserId) {
          throw new Error('Unable to resolve current user id for submission');
        }

        const submittedToIso = dayjs(throughDateIso)
          .add(1, 'day')
          .format(ISO_DATE_FORMAT);

        const submitResponse = await apiPut<UserUpdateResponse>(
          sandbox,
          `${baseUrl}/users`,
          {
            data: [
              {
                id: resolvedUserId,
                submitted_to: submittedToIso,
              },
            ],
          },
          SUBMIT_TIME_ENTRY_SUBMITTED_CUSTOMER_INTERACTION,
        );

        const updateStatuses = submitResponse.results?.users || {};
        const updateStatus =
          Object.values(updateStatuses)[0] ||
          (resolvedUserId ? updateStatuses[String(resolvedUserId)] : undefined);

        if (!updateStatus) {
          throw new Error('Missing user update status in /users response');
        }

        if (
          updateStatus._status_code &&
          Number(updateStatus._status_code) >= 400
        ) {
          throw new Error(
            updateStatus._status_message || 'Failed to submit time entries',
          );
        }

        endInteractionWithSuccess(
          sandbox,
          SUBMIT_TIME_ENTRY_SUBMITTED_CUSTOMER_INTERACTION,
        );
      } catch (err) {
        endInteractionWithFailure(
          sandbox,
          SUBMIT_TIME_ENTRY_SUBMITTED_CUSTOMER_INTERACTION,
          err instanceof Error ? err.message : String(err),
          err,
        );
        throw err;
      }
    },
    [sandbox],
  );

  return { submitTime };
};
