import { v4 as uuidv4 } from 'uuid';
import { Environment } from '@appfabric/sandbox-spec';
import { Sandbox } from 'src/js/common/sandbox';
import { ERROR_IDS } from 'src/js/common/constants';
import {
  buildHeaders,
  getEnvFromSandbox,
} from 'src/js/service/ApolloClientBuilderUtils';

/**
 * Interface for TSheets account information from my_realm endpoint
 */
export interface TSheetsAccountInfo {
  hasTSheetsAccount: boolean;
  isFreedata: boolean;
  isOII: boolean;
  accountCreationDate: string | null;
  accountType: string;
}

/**
 * Interface for my_realm API response
 */
interface MyRealmResponse {
  results: {
    my_realm: {
      account_type: string;
      is_oii: boolean;
      account_creation_date: string | null;
    } | null;
  };
  error?: {
    message: string;
  };
}

/**
 * Get the TSheets REST API base URL based on environment
 * @param sandbox The sandbox object to determine the environment
 * @returns The base URL for TSheets REST API
 */
export const getTSheetsRestApiUrl = (sandbox: Sandbox): string => {
  const env = getEnvFromSandbox(sandbox);
  switch (env) {
    case Environment.PROD:
      return 'https://tsheets.api.intuit.com';
    case Environment.E2E:
      return 'https://tsheets-e2e.api.intuit.com';
    case Environment.QA:
      return 'https://tsheets-qal.api.intuit.com';
    case Environment.PERF:
      return 'https://tsheets-prf.api.intuit.com';
    default:
      return 'https://tsheets-e2e.api.intuit.com';
  }
};

/**
 * Fetches TSheets account information for the current realm
 *
 * This makes a call to the TSheets microservice to determine if this account
 * has a TSheets account and what type it is.
 *
 * @param sandbox The sandbox object to extract context and make the API call
 * @returns Promise with account information
 * @throws Error if the API call fails or returns an error
 *
 * @example
 * ```typescript
 * const accountInfo = await getTSheetsAccountInfo(sandbox);
 * if (accountInfo.isFreedata) {
 *   // Handle freedata account
 * }
 * ```
 */
export const getTSheetsAccountInfo = async (
  sandbox: Sandbox,
): Promise<TSheetsAccountInfo> => {
  const baseUrl = getTSheetsRestApiUrl(sandbox);
  const apiUrl = `${baseUrl}/api/v1/my_realm?account_types=all`;
  const intuit_tid = uuidv4().toString();

  try {
    sandbox.logger.info(
      'Component=TSheetsApiClient Event=Fetching account info',
      {
        url: apiUrl,
        intuit_tid,
      },
    );

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        ...buildHeaders(sandbox),
        intuit_tid,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (response.status !== 200) {
      const error = await response.text();
      sandbox.logger.error('Component=TSheetsApiClient Event=API error', {
        status: response.status,
        error,
        intuit_tid,
      });
      throw new Error(`Error in my_realm response: ${error}`);
    }

    const myRealmResponse: MyRealmResponse = await response.json();

    if (myRealmResponse.error) {
      sandbox.logger.error('Component=TSheetsApiClient Event=Response error', {
        error: myRealmResponse.error.message,
        intuit_tid,
      });
      throw new Error(`Error in my_realm: ${myRealmResponse.error.message}`);
    }

    const myRealm = myRealmResponse?.results?.my_realm;
    const hasTSheetsAccount = myRealm !== null;
    const accountType = myRealm?.account_type || '';
    const isFreedata = accountType === 'freedata';
    const isOII = myRealm?.is_oii || false;
    const accountCreationDate = myRealm?.account_creation_date || null;

    sandbox.logger.info(
      'Component=TSheetsApiClient Event=Account info fetched',
      {
        hasTSheetsAccount,
        isFreedata,
        isOII,
        accountType,
        intuit_tid,
      },
    );

    return {
      hasTSheetsAccount,
      isFreedata,
      isOII,
      accountType,
      accountCreationDate,
    };
  } catch (error) {
    sandbox.logger.error(
      'Component=TSheetsApiClient Event=Failed to fetch account info',
      {
        exception: error instanceof Error ? error.message : String(error),
        intuit_tid,
      },
    );
    throw error;
  }
};

/**
 * Submit-time dates for the currently authenticated TSheets user.
 * `submittedTo` / `approvedTo` are exclusive ends (sourced from TSheets).
 */
export interface TSheetsCurrentUser {
  id: number | null;
  submittedTo: string | null;
  approvedTo: string | null;
}

interface CurrentUserRecord {
  id: number;
  submitted_to?: string | null;
  approved_to?: string | null;
}

interface CurrentUserResponse {
  results?: {
    users?: Record<string, CurrentUserRecord>;
  };
  error?: {
    message: string;
  };
}

/**
 * Fetches the current TSheets user via `GET /api/v1/current_user`.
 *
 * Shared REST helper so callers (approvals, calendar submit-time lock, etc.)
 * don't each inline the same fetch.
 *
 * @param sandbox The sandbox object to extract context and make the API call
 * @returns Promise with the current user's id and submit/approve dates
 * @throws Error if the API call fails or returns an error
 */
export const getTSheetsCurrentUser = async (
  sandbox: Sandbox,
): Promise<TSheetsCurrentUser> => {
  const apiUrl = `${getTSheetsRestApiUrl(sandbox)}/api/v1/current_user`;
  const intuit_tid = uuidv4().toString();

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        ...buildHeaders(sandbox),
        intuit_tid,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (response.status !== 200) {
      const error = await response.text();
      sandbox.logger.error(
        'Component=TSheetsApiClient Event=current_user API error',
        { status: response.status, error, intuit_tid },
      );
      throw new Error(`Error in current_user response: ${error}`);
    }

    const currentUserResponse: CurrentUserResponse = await response.json();

    if (currentUserResponse.error) {
      sandbox.logger.error(
        'Component=TSheetsApiClient Event=current_user response error',
        { error: currentUserResponse.error.message, intuit_tid },
      );
      throw new Error(
        `Error in current_user: ${currentUserResponse.error.message}`,
      );
    }

    const user = Object.values(currentUserResponse.results?.users || {})[0];

    // An empty `users` map is not "nothing submitted" — it means the current
    // user could not be resolved. Surface it explicitly instead of silently
    // returning all-null (which would disable the lock without a trace).
    if (!user) {
      sandbox.logger.error(
        'Component=TSheetsApiClient Event=current_user no user record',
        { intuit_tid },
      );
      throw new Error('Error in current_user: no user record returned');
    }

    return {
      id: user.id,
      submittedTo: user.submitted_to ?? null,
      approvedTo: user.approved_to ?? null,
    };
  } catch (error) {
    // Single Sentry emission point for every failure in this call — including
    // the non-200 and response-error branches above, which throw into here.
    // Tagged with a stable ERROR_IDS so it can be alerted/correlated in Sentry
    // (the repo convention; see ERROR_IDS in constants.ts). The per-branch
    // sandbox.logger.error calls remain as structured breadcrumbs.
    sandbox.logger.logException(
      ERROR_IDS.TSHEETS_CURRENT_USER_FAILED,
      error instanceof Error ? error : new Error(String(error)),
      { intuit_tid },
    );
    throw error;
  }
};
