import { ApolloError } from '@apollo/client';
import dayjs from 'dayjs';
import {
  aMutation,
  aQuery,
  aTimeTracking_UpdateEmployerSettingsInput,
  aTimeTracking_UpdateEmployerSettingsPayload,
} from '__mocks__/__generated__/timeTracking';
import { TimeTrackingSettings } from 'src/js/service/hooks/settings/useGetSettings';
import {
  COMPANY_SETTINGS_QUERY,
  UPDATE_COMPANY_SETTINGS_MUTATION,
} from 'src/js/service/queries/timeTrackingQueries';

export const MOCK_TIME_TRACKING_SETTINGS: TimeTrackingSettings = {
  isClassEnabled: true,
  isLocationEnabled: true,
  isBillingFieldEnabled: true,
  isServiceFieldEnabled: true,
  isTaxableFieldEnabled: true,
  firstDayOfWeek: 1,
  entityVersion: '0',
  timezone: '',
  closeBookDate: dayjs(),
  isCloseBookPasswordEnabled: false,
  isCloseBookDateEnabled: false,
};

export const COMPANY_SETTINGS_SUCCESS_MOCKS = [
  {
    request: {
      query: UPDATE_COMPANY_SETTINGS_MUTATION,
      variables: {
        input: aTimeTracking_UpdateEmployerSettingsInput,
      },
    },
    result: {
      data: aMutation({
        timeTrackingUpdateEmployerSettings:
          aTimeTracking_UpdateEmployerSettingsPayload(),
      }),
    },
  },
  {
    request: {
      query: COMPANY_SETTINGS_QUERY,
    },
    result: {
      data: aQuery(),
    },
  },
];

export const COMPANY_SETTINGS_APOLLO_ERROR_MOCKS = [
  {
    request: {
      query: UPDATE_COMPANY_SETTINGS_MUTATION,
      variables: {
        input: aTimeTracking_UpdateEmployerSettingsInput,
      },
    },
    error: new ApolloError({ errorMessage: 'An error occurred' }),
  },
  {
    request: {
      query: COMPANY_SETTINGS_QUERY,
    },
    error: new ApolloError({ errorMessage: 'An error occurred' }),
  },
];
