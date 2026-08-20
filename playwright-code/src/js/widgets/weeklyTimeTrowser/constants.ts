import { AuthorizationRequest } from '@payroll/quicksand';

export const WEEKLY_TIME_ENTRY_BATCH_AUTHORIZATION_REQUESTS: AuthorizationRequest[] =
  [
    {
      resource: { id: 'irn:intuit::accounting_accounting:klass' },
      action: { id: 'create' },
    },
    {
      resource: { id: 'irn:intuit::accounting_accounting:department' },
      action: { id: 'create' },
    },
    // add settings later
    // {
    //   resource: { id: 'irn:intuit::platform:settings:v4' },
    //   action: { id: 'read' },
    // }
  ];
