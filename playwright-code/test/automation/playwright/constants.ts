export const LABELS = {
  // Labels for the "Display by" dropdown
  displayBy: 'Display by',
  dateRange: 'Date range',
  today: 'Today',
  thisWeek: 'This week',
  thisMonth: 'This month',
  lastWeek: 'Last week',
  lastMonth: 'Last month',
  custom: 'Custom',
  date: 'Date',
  customer: 'Customer',
  allTeamMembers: 'All team members',
  employee: 'Employee',
  contractor: 'Contractor',

  // Headers for the time entries table
  name: 'Name',
  time: 'Time',
  hours: 'Hours',
  billable: 'Billable',
  service: 'Service',
  details: 'Details',
  notes: 'Notes',
  status: 'Status',
  action: 'Action',
  flags: 'Flags',

  // Settings
  settings: 'Settings',
  class: 'Class',

  // Custom Field Settings
  customFields: 'Custom fields',
  createCustomFields: 'Create custom fields for time tracking',
  manageAllCustomFields: 'Manage all custom fields',
  editCustomFields: 'Edit',
  addCustomFields: 'Add custom fields',

  // Signature settings and team member permissions settings
  signatureSettings: 'Capture signatures for timesheets (mobile only)',
  /** View mode (read-only row). */
  teamMemberPermissionsView: 'Allow team member to create and edit timesheets',
  /** Edit mode (checkbox label). */
  teamMemberPermissionsEdit:
    'Allow team members to create and edit their own timesheets',
  mobileTimeTracking: 'Allow team members to track time on the mobile app',
};

export const USER_ROLES = {
  companyAdmin: 'Company Admin',
};

export const accountSettingsPageUrls = {
  customFieldSettings: 'app/accountsettings?p=time',
  accountSettings: 'app/accountsettings?p=time',
};

export const CUSTOM_FIELD_LABELS = {
  heading: 'Custom fields',
  createLabel: 'Create custom fields for time tracking',
  manageAllCustomFieldsText: 'Manage all custom fields',
  editButton: 'Edit',
  addCustomFieldsButton: 'Add custom fields',
  goToClassicQuickBooksTimeText:
    'Go to classic QuickBooks Time to assign customers',
  addUpToText:
    'Add up to 12 custom fields and choose which ones your team are required to fill out when they track time.',
  noCustomFieldsText: 'No custom fields for time tracking yet',
  getStartedText: 'Select Add custom fields to get started.',
};

export const CUSTOM_FIELD_DATA_TYPES = {
  textAndNumber: 'Text and number',
  number: 'Number',
  dropdownList: 'Dropdown list',
  string: 'String',
};

export const CUSTOM_FIELD_CATEGORY_OPTIONS = {
  customer: 'Customer',
  transaction: 'Transaction',
  time: 'Time',
};

export const CUSTOM_FIELDS_PAGE_ELEMENTS = {
  pageTitle: 'Custom fields',
  breadcrumb: 'All Lists',
  buttons: {
    seeHowItWorks: 'See how it works',
    giveFeedback: 'Give feedback',
    addField: 'Add field',
    edit: 'Edit',
  },
  videoDuration: '(3:03)',
  toggleText: 'Include inactive',
  pagination: '1-1 of 1',
  emptyState: {
    noFieldsFound: 'No custom fields found',
    createFieldsMessage: 'Create custom fields to track additional information',
  },
};

export const CUSTOM_FIELDS_TABLE_HEADERS = {
  sections: {
    customFields: 'CUSTOM FIELDS',
    sales: 'SALES',
    purchases: 'PURCHASES',
  },
  customFields: {
    name: 'NAME',
    category: 'CATEGORY',
  },
  sales: {
    salesReceipt: 'SALES RECEIPT',
    invoice: 'INVOICE',
    estimate: 'ESTIMATE',
    creditMemo: 'CREDIT MEMO',
    refundReceipt: 'REFUND RECEIPT',
    salesOrder: 'SALES ORDER',
  },
  purchases: {
    purchaseOrder: 'PURCHASE ORDER',
    expense: 'EXPENSE',
    bill: 'BILL',
    check: 'CHECK',
    vendorCredit: 'VENDOR CREDIT',
    creditCardCredit: 'CREDIT CARD CREDIT',
  },
  actions: 'ACTIONS',
};

export const testData = {
  // Options for the "Display by" dropdown
  expectedOptions: [
    'Today',
    'This week',
    'This month',
    'Last week',
    'Last month',
    'Custom',
  ],

  // Headers for the time entries table
  expectedHeaders: [
    'Name',
    'Time',
    'Hours',
    'Billable',
    'Customer',
    'Service',
    'Details',
    'Notes',
    'Status',
    'Action',
    'Mileage',
  ],

  // Time clock - customizeTimesheetFields
  customizeTimesheetFieldsforTimeClock: [
    'Billable',
    //'Rate per hour',
    // 'Require billable',
    'Service item',
    'Class',
    'Location',
    'Notes',
    //'Allow team members to edit existing notes',
  ],

  // Time settings - customizeTimesheetFields
  qbocustomizeTimesheetFields: [
    // 'Billable',
    // 'Rate per hour',
    // 'Require billable',
    'Service item',
    'Class',
    'Location',
    'Notes',
    //'Allow team members to edit existing notes',
  ],

  qbocustomizeTimesheetFieldsGB: [
    // 'Billable',
    // 'Rate per hour',
    // 'Require billable',
    'Service item',
    'Class',
    'Location',
    'Notes',
    //'Allow team members to edit existing notes',
  ],

  // Time settings - uncheck customizeTimesheetFields
  qbocustomizeTimesheetFieldsUnCheck: [
    'Billable',
    //'Rate per hour',
    //'Require billable',
    'Service item',
    'Class',
    'Location',
    'Notes',
    //'Allow team members to edit existing notes',
    //'Require notes',
  ],

  // Time sheet - Preferences - customizeTimesheetFields
  classicPreferencesCustomizeTimesheetFields: [
    'Service Items',
    // 'Billable yes/no choice',
    // 'Require Billable yes/no choice',
    // 'Billable Rate',
    'Class',
    'Location',
  ],

  // Time sheet - Company Settings - Time Options - Time Entry - Notes Fields - customizeTimesheetFields
  classicCompanySettingsCustomizeTimesheetFieldsNotes: [
    'Allow team members to enter notes on Time Clock and mobile app',
    'Allow team members to edit their past notes',
    'Make notes required',
  ],

  graphqlApiWildcard: '**/graphql',

  expectedHeadersCustomer: ['Name', 'Total', 'Billable'],

  customerName: 'Bakes and Beans',
  customTargetMonth: 'April 2025',
  customStartDate: '2025-04-01',
  customEndDate: '2025-04-30',

  customFieldTableHeaders: ['Custom field', 'Data type', 'Status', 'Required'],

  customFieldDataTypes: [
    'Text',
    'Number',
    'Date',
    'Checkbox',
    'Dropdown',
    'Radio',
    'Textarea',
  ],
};

export const timeEntriesTestData = {
  searchEmpName: 'testelite pw',
  validateEmpName: 'pw, testelite',
  invalidEmpName: 'invalid EMPrecord',
};
