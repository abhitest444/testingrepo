/* eslint-disable */
import gql from 'graphql-tag';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T;
export type InputMaybe<T> = T;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  Decimal: { input: any; output: any; }
  /** The id of the jurisdiction. Jurisdiction IDs are unique. For example, ID 'CUS' represents US Federal. 'CUS_L1MD' represents Maryland State */
  JurisdictionID: { input: any; output: any; }
  /** A money value, without currency specified, represented as a string. The precision will vary based upon the use case, e.g. "1752.19" or "-75375.234157" */
  Money: { input: any; output: any; }
};

export type AccessFilter = {
  /** Filter for if access invitation has been sent or accepted for this employee */
  hasAccess?: InputMaybe<BooleanFilter>;
  /** Filter for if an invitation has been sent to this employee */
  hasInvite?: InputMaybe<BooleanFilter>;
};

export type AccountingCategorizationClass = {
  __typename?: 'AccountingCategorizationClass';
  externalIds: Array<Common_ExternalId>;
  name: Scalars['String']['output'];
};

/** Payslips data can be filtered by accounting categorization class */
export type AccountingCategorizationClassFilter = {
  name: StringFilter;
};

/** Enum of available export modes */
export enum AccountingExportMode {
  /**
   * Download data in an IIF file. Intuit Interchange Format (.IIF) files are ASCII text, TSV (Tab-Separated Value) files that QuickBooks Desktop uses to import or export lists or transactions.
   * @deprecated Use QB_WIN_IIF_DOWNLOAD or QB_MAC_IIF_DOWNLOAD instead
   */
  IifDownload = 'IIF_DOWNLOAD',
  /** Transfer data directly to Quickbooks Online via API integration. */
  QboApi = 'QBO_API',
  /** Download data in an IIF file for importing into QuickBooks Desktop for Mac. Intuit Interchange Format (.IIF) files are ASCII text, TSV (Tab-Separated Value) files that QuickBooks Desktop uses to import or export lists or transactions. */
  QbMacIifDownload = 'QB_MAC_IIF_DOWNLOAD',
  /** Download data in an IIF file for importing into QuickBooks Desktop for Windows. Intuit Interchange Format (.IIF) files are ASCII text, TSV (Tab-Separated Value) files that QuickBooks Desktop uses to import or export lists or transactions. */
  QbWinIifDownload = 'QB_WIN_IIF_DOWNLOAD',
  /** Download data in a QIF file for importing into Quicken. */
  QuickenQifDownload = 'QUICKEN_QIF_DOWNLOAD'
}

/** Preferences related to exporting Payroll data to an external accounting solution. */
export type AccountingExportPreferences = {
  __typename?: 'AccountingExportPreferences';
  /** The default export mode for the company. A null value means that there is no accounting export setup for the company. */
  defaultExportMode?: Maybe<AccountingExportMode>;
  metaModel: AccountingExportPreferencesMetaModel;
  /**
   * The name of the company that is the destination to export accounting transactions to when export mode is QBO_API.
   * Null when export mode is anything other than QBO_API.
   */
  qboApiCompanyName?: Maybe<Scalars['String']['output']>;
};

/** Meta model for AccountingExportPreferences */
export type AccountingExportPreferencesMetaModel = MetaModel & {
  __typename?: 'AccountingExportPreferencesMetaModel';
  applicable: Scalars['Boolean']['output'];
  defaultExportMode: MetaEnum;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type AccountingPreferences = {
  __typename?: 'AccountingPreferences';
  accountingExportPreferences?: Maybe<AccountingExportPreferences>;
  /** Currently selected account name preferences for exporting transactions to accounting software */
  transactionsToAccountMappingPreferences?: Maybe<TransactionsToAccountMappingPreferences>;
  /** Specifies the mode of class mapping setup and class name for transactions if classes are assigned to transactions. */
  transactionsToClassMappingPreferences?: Maybe<TransactionsToClassMappingPreferences>;
};

export enum AccrualResetFrequency {
  /** Accrual balances will reset and unused time will carry over on a date set by customer */
  CustomDate = 'CUSTOM_DATE',
  /** Accrual balances will reset and unused time will carry over on hire date */
  HireDate = 'HIRE_DATE'
}

/** Provides current and total accumulated monetary amounts for a date period */
export type AccumulationAmount = {
  /** Current monetary amount */
  currentAmount: Scalars['Money']['output'];
  /** Total monetary amount accumulated */
  toDateAmounts: Array<ToDateAmount>;
};

/** Describes the failing or shortcoming that is contributing to the lack of readiness, and optionally an action that can be taken to correct it. */
export type AcuteReadinessDeficiency = ReadinessDeficiency & {
  __typename?: 'AcuteReadinessDeficiency';
  /** Describes this failing or shortcoming that is contributing to the lack of readiness, e.g. 'Tax setup incomplete for employee John' */
  description: Scalars['String']['output'];
  remediation?: Maybe<UserActionable>;
};

/** Input for assigning an employee to a department */
export type AddEmployeeToDepartmentInput = {
  companyId: Scalars['ID']['input'];
  /** Department id */
  departmentId: Scalars['ID']['input'];
  /** Employee id */
  employeeId: Scalars['ID']['input'];
};

/** Type for add employee to department response */
export type AddEmployeeToDepartmentPayload = {
  __typename?: 'AddEmployeeToDepartmentPayload';
  userError?: Maybe<EmploymentRelationshipError>;
};

/** Input for assigning a reportee to manager */
export type AddReporteeInput = {
  companyId: Scalars['ID']['input'];
  /** Manager employee id */
  managerId: Scalars['ID']['input'];
  /** Reportee employee id */
  reporteeId: Scalars['ID']['input'];
};

/** Type for add reportee response */
export type AddReporteePayload = {
  __typename?: 'AddReporteePayload';
  /** Represents the total number of reportees employee currently has. */
  reporteeCount?: Maybe<Scalars['Int']['output']>;
  userError?: Maybe<EmploymentRelationshipError>;
};

/** Input type for adding a new work location which creates a CompanyAddress */
export type AddWorkLocationInput = {
  workLocation: CreateCompanyAddressInput;
};

export type AddWorkLocationPayload = {
  __typename?: 'AddWorkLocationPayload';
  workLocation?: Maybe<CompanyAddress>;
};

export enum AddressTypeEnum {
  BusinessOffice = 'BUSINESS_OFFICE',
  HomeOffice = 'HOME_OFFICE',
  ServiceCenter = 'SERVICE_CENTER',
  Warehouse = 'WAREHOUSE'
}

/** Input for the default paid status for current period after adjusting date periods. */
export type AdjustPriorPayrollInput = {
  /** Represents the company the employees belong to */
  companyId: Scalars['ID']['input'];
  /** Specifies if the employee was paid after resetting the per period date periods */
  defaultCurrentPeriodEmployeePaidStatus: EmployeePaidStatus;
};

/** Error object with details for pay history adjustment errors */
export type AdjustPriorPayrollMutationError = {
  __typename?: 'AdjustPriorPayrollMutationError';
  /** Error code for mutation */
  code: Scalars['String']['output'];
  /** Error message for the mutation */
  message: Scalars['String']['output'];
  /** Type of error for the mutation */
  type?: Maybe<Scalars['String']['output']>;
};

export type AdjustPriorPayrollPayload = {
  __typename?: 'AdjustPriorPayrollPayload';
  /** Error for the mutation */
  userErrors?: Maybe<Array<AdjustPriorPayrollMutationError>>;
};

/** Details of the form fields adjustment */
export type AdjustableFilingFieldInput = {
  /** Name of the field */
  name: Scalars['String']['input'];
  /** New value for the field */
  value: Scalars['String']['input'];
  /** XPath of the field in the document */
  xpath: Scalars['String']['input'];
};

export type Agency = {
  __typename?: 'Agency';
  /** The credentials used by the employer to communicate with the Tax agency. E.g. used by UK companies for tax filing submissions */
  agencyCredential?: Maybe<AgencyCredential>;
  /** The unique identifier that represents this tax agency. A company will have have multiple EmployerTaxSetups where each one describes one of the tax agencies they belong to. */
  agencyId: Scalars['String']['output'];
  /** The name of the tax agency */
  agencyName?: Maybe<Scalars['String']['output']>;
};

export type AgencyCredential = {
  __typename?: 'AgencyCredential';
  password?: Maybe<Scalars['String']['output']>;
  username?: Maybe<Scalars['String']['output']>;
};


export type AgencyCredentialPasswordArgs = {
  sensitized?: InputMaybe<Scalars['Boolean']['input']>;
};


export type AgencyCredentialUsernameArgs = {
  sensitized?: InputMaybe<Scalars['Boolean']['input']>;
};

export type AgencyCredentialFieldMetaModel = MetaModel & {
  __typename?: 'AgencyCredentialFieldMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type AgencyCredentialInput = {
  password: Scalars['String']['input'];
  username: Scalars['String']['input'];
};

export type AgencyCredentialMetaModel = MetaModel & {
  __typename?: 'AgencyCredentialMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  password: AgencyCredentialFieldMetaModel;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
  username: AgencyCredentialFieldMetaModel;
};

export type AllowedValue = {
  __typename?: 'AllowedValue';
  value?: Maybe<Scalars['String']['output']>;
};

/** Input for the `approveAndScheduleTaxPayment` mutation. */
export type ApproveAndScheduleTaxPaymentInput = {
  /** If true, then this payment is an amendment payment. */
  amendmentPayment?: InputMaybe<Scalars['Boolean']['input']>;
  /** The user-entered check number that was used to pay the tax payment */
  checkNumber?: InputMaybe<Scalars['String']['input']>;
  /** The bank account name, aginst which the tax payment is recorded against for ledger purposes */
  ledgerBankAccountName: Scalars['String']['input'];
  /** Any memos that are to be tagged to the scheduled tax payment */
  memo?: InputMaybe<Scalars['String']['input']>;
  /** The date the payment is to be paid on */
  paymentDate: Scalars['Date']['input'];
  /** Payment method chosen for the tax payment */
  paymentMethod: Scalars['String']['input'];
  /** The tax payment that is to be approved and scheduled to be paid. */
  taxPaymentId: Scalars['ID']['input'];
  /** If true, this payment will be added to the QuickBooks check print queue. */
  toBePrinted: Scalars['Boolean']['input'];
};

/** Result of `approveAndScheduleTaxPayment` mutation. */
export type ApproveAndScheduleTaxPaymentPayload = {
  __typename?: 'ApproveAndScheduleTaxPaymentPayload';
  /** The error that occurred while approving and scheduling the payment via the mutation. */
  error?: Maybe<TaxPaymentError>;
  /** The mutation will result in either a new taxPayment being created that replaces the original that is deleted, or the original payment will be updated directly. */
  result?: Maybe<ApproveAndScheduleTaxPaymentResult>;
};

export type ApproveAndScheduleTaxPaymentResult = CreatedAndDeletedTaxPayment | UpdatedTaxPayment;

export type ArchiveManualTaxFilingInput = {
  companyId: Scalars['ID']['input'];
  /** Optional employee ID of tax filing to archive */
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  taxFilingId: Scalars['ID']['input'];
};

export type ArchiveManualTaxFilingPayload = {
  __typename?: 'ArchiveManualTaxFilingPayload';
  /** A Tax Filing that was successfully archived as a result of the mutation. This could either be the pending filing that was specified as input (and has been updated), or a newly created filing. */
  archivedFiling?: Maybe<TaxFiling>;
  /** ID of a Tax Filing that was deleted as a result of the mutation. This value will be defined if by recording a pending Tax Payment as paid, that payment was deleted and replaced by a newly created payment. */
  deletedFilingId?: Maybe<Scalars['ID']['output']>;
  error?: Maybe<TaxFilingError>;
};

export type ArchiveManualTaxFormInput = {
  companyId: Scalars['ID']['input'];
  taxFormId: Scalars['ID']['input'];
};

export type ArchiveManualTaxFormPayload = {
  __typename?: 'ArchiveManualTaxFormPayload';
  /** A Tax Form that was successfully archived as a result of the mutation. */
  archivedTaxForm?: Maybe<TaxForm>;
  /** ID of a Tax Form that was deleted as a result of the mutation. */
  deletedTaxFormId?: Maybe<Scalars['ID']['output']>;
  error?: Maybe<TaxFilingError>;
};

/** Input type to assign a list of time off policies to an employee */
export type AssignBatchEmployeeTimeOffPoliciesInput = {
  /** List of employee time off policy assignment details */
  assignEmployeeTimeOffPoliciesDetails: Array<AssignEmployeeTimeOffPolicyDetailsInput>;
  /** ID of the employee */
  employeeId: Scalars['ID']['input'];
};

/** Input type provides the timeoff policy details to be assigned to an employee */
export type AssignEmployeeTimeOffPolicyDetailsInput = {
  /** EmployerTimeOffPolicy details */
  employerTimeOffPolicy: EmployerTimeOffPolicyAssignmentInput;
};

/** Input for the assignEmployeeWorkersCompensation mutation. */
export type AssignEmployeeWorkersCompensationInput = {
  /** Flag to retroactively apply rates to paychecks for WC liability. Required true if paychecks exist during effective date time period. */
  applyRateRetroactively: Scalars['Boolean']['input'];
  /** The ID of the company */
  companyId: Scalars['ID']['input'];
  /** Effective date of employee workers' compensation to be assigned. */
  effectiveDate: Scalars['Date']['input'];
  /** The ID of the employee for whom the workers' compensation policy has to be assigned. */
  employeeId: Scalars['ID']['input'];
  /** Id of employer workers' compensation class to be assigned to employee. */
  employerManagedWorkersCompensationClassId: Scalars['ID']['input'];
};

/** Result payload of assignEmployeeWorkersCompensation mutation. */
export type AssignEmployeeWorkersCompensationPayload = {
  __typename?: 'AssignEmployeeWorkersCompensationPayload';
  /** Employee workers' compensation policy that was assigned as a result of the mutation. */
  employeeManagedWorkersCompensationClass?: Maybe<EmployeeManagedWorkersCompensationClass>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<WorkersCompensationError>;
};

export type AssignPayScheduleToEmployeeInput = {
  companyId: Scalars['ID']['input'];
  /** ID of the employee to assign to this pay schedule */
  employeeId: Scalars['ID']['input'];
  /** The id of the pay schedule to be assigned to the employee */
  payScheduleId: Scalars['ID']['input'];
};

export type AssignPayScheduleToEmployeePayload = {
  __typename?: 'AssignPayScheduleToEmployeePayload';
  /** Employee that was successfully assigned to the schedule */
  employee?: Maybe<Employee>;
  userError?: Maybe<PayScheduleError>;
};

/** Person whom employer has paid to prepare tax returns. */
export type AssignedPreparer = {
  __typename?: 'AssignedPreparer';
  /** Determines if the employer has assigned preparer (Active or Not Active) */
  allowed: Scalars['Boolean']['output'];
  /** Preparer Information */
  preparer?: Maybe<Preparer>;
};

/** Error object with details for updating assigned preparer */
export type AssignedPreparerUserError = {
  __typename?: 'AssignedPreparerUserError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Person whom employer has allowed to represent them to a government agency. */
export type AssignedRepresentative = {
  __typename?: 'AssignedRepresentative';
  /** Determines if the assigned designee is allowed to represent the employer (Active or Not Active) */
  allowed: Scalars['Boolean']['output'];
  /** Representative Information */
  representative?: Maybe<Representative>;
};

/** Error object with details for updating assigned representative */
export type AssignedRepresentativeUserError = {
  __typename?: 'AssignedRepresentativeUserError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Input to auto fill payslip check number */
export type AutoFillPayslipCheckNumberInput = {
  /** Id of the company */
  companyId: Scalars['ID']['input'];
  /** Payslip check number for the first payslip id in input list, this would be used to update check numbers in increasing order of 1 for the rest of the payslips */
  initialCheckNumber: Scalars['Int']['input'];
  /** List of payslip ids */
  payslipIds: Array<Scalars['ID']['input']>;
};

/** Result of AutoFillPayslipCheckNumber mutation */
export type AutoFillPayslipCheckNumberPayload = {
  __typename?: 'AutoFillPayslipCheckNumberPayload';
  /** List of payslips with updated paycheck numbers */
  payslips?: Maybe<Array<Payslip>>;
  /** User error generated as a result of auto fill payslip check number mutation */
  userError?: Maybe<PayslipMutationError>;
};

/** Provides preview of PayrollRunDates for next unscheduled AutoPayroll run */
export type AutoPayrollRunDateSummaryPreview = {
  __typename?: 'AutoPayrollRunDateSummaryPreview';
  /** Cutoff dates for actions/events on the next unscheduled AutoPayroll run. e.g submit cutoff date */
  cutoffDateSummary: CutoffDateSummary;
  /** Pay date for the next unscheduled AutoPayroll run */
  payDate: Scalars['Date']['output'];
  /** Pay period for the next unscheduled AutoPayroll run */
  payPeriod: PayPeriod;
};

/** A message encountered during auto payroll setup */
export type AutoPayrollSetupMessage = Message & {
  __typename?: 'AutoPayrollSetupMessage';
  /** Code to identify message */
  code: Scalars['String']['output'];
  /** Short description */
  message?: Maybe<Scalars['String']['output']>;
  /** Defines the type of message (Info, Warning, Blocker) */
  type: MessageType;
};

/** Status of the Auto Tax toggle, and the date this status is effective from */
export type AutoTaxFeatureToggle = {
  __typename?: 'AutoTaxFeatureToggle';
  effectiveDate: Scalars['Date']['output'];
  enabled: Scalars['Boolean']['output'];
};

/** Input to toggle the Auto Tax feature to be enabled or disabled effective on the date specified. */
export type AutoTaxFeatureToggleInput = {
  effectiveDate: Scalars['Date']['input'];
  enabled: Scalars['Boolean']['input'];
};

export type AutoTaxPreferences = {
  __typename?: 'AutoTaxPreferences';
  /** Current status of the Auto Tax preference feature */
  autoTaxEnabled: Scalars['Boolean']['output'];
  /** @deprecated Use the current featureToggles.effectiveDate instead */
  effectiveDate?: Maybe<Scalars['Date']['output']>;
  /** Preferences and other details of Escrow (Impounding). */
  escrowTax?: Maybe<AutoTaxPreferencesEscrowTax>;
  /**
   * Represents the feature for deducting taxes from the employer early on (Impounding).
   * @deprecated Use escrowTax.enabled instead
   */
  escrowTaxEnabled: Scalars['Boolean']['output'];
  /** Represents the timeline of toggles of the Auto Tax feature between enabled and disabled, in chronological ascending order. Each toggle's value is effective until the next effectiveDate (exclusive) in the list. */
  featureToggles: Array<AutoTaxFeatureToggle>;
  paymentTiming?: Maybe<PaymentTimingPreference>;
};

/** Preferences and other details of Escrow (Impounding) */
export type AutoTaxPreferencesEscrowTax = {
  __typename?: 'AutoTaxPreferencesEscrowTax';
  /** Represents when Escrow (Impounding) will be effective for the customer company */
  effectiveDate?: Maybe<Scalars['Date']['output']>;
  /** Represents if Escrow (Impounding) is enabled for the customer company */
  enabled: Scalars['Boolean']['output'];
};

export type AutoTaxPreferencesInput = {
  /** deprecated. reason: use featureToggle instead */
  autoTaxEnabled?: InputMaybe<Scalars['Boolean']['input']>;
  paymentTiming?: InputMaybe<PaymentTimingPreference>;
  /** Toggle the Auto Tax feature to be enabled or disabled */
  toggleFeature?: InputMaybe<AutoTaxFeatureToggleInput>;
};

export type AutoTaxPreferencesMetaModel = MetaModel & {
  __typename?: 'AutoTaxPreferencesMetaModel';
  applicable: Scalars['Boolean']['output'];
  autoTaxEnabled: MetaBoolean;
  label: Scalars['String']['output'];
  paymentTiming: MetaEnum;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Union of the two possible sources for company bank info */
export type BankInfo = PayrollBankAccount | Wallet;

export type BatchAssignPayScheduleError = {
  __typename?: 'BatchAssignPayScheduleError';
  code?: Maybe<Scalars['String']['output']>;
  employeeId: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type BatchAssignPayScheduleToEmployeeInput = {
  companyId: Scalars['ID']['input'];
  paySchedules: Array<EmployeePayScheduleAssignmentInput>;
};

export type BatchAssignPayScheduleToEmployeePayload = {
  __typename?: 'BatchAssignPayScheduleToEmployeePayload';
  employees: Array<Employee>;
  userErrors?: Maybe<Array<BatchAssignPayScheduleError>>;
};

export type BatchCreateEmployeeBenefitsAndPolicyInput = {
  /**
   * The deduction policy detail from user input. If this policy is being created for
   * multiple employees, it will create one policy and mapped to all of the provided employee IDs.
   */
  employeeDeductionDetails: Array<CreateEmployeeBenefitAndPolicyInput>;
  /** Imported name of the deduction */
  importedName: Scalars['String']['input'];
};

export type BatchCreateEmployeeBenefitsAndPolicyPayload = {
  __typename?: 'BatchCreateEmployeeBenefitsAndPolicyPayload';
  /** The employee benefit that was successfully created as a result of the mutation. */
  deductions?: Maybe<Array<EmployeeBenefit>>;
  /** The benefit policy that was successfully created as a result of the mutation. */
  policy?: Maybe<BenefitPolicy>;
  /** User errors generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchCreateEmployeeBenefitsInput = {
  /** The benefit will use existing deduction policy Id and create deduction at the employee level. */
  employeeDeductionDetails: Array<CreateEmployeeBenefitInput>;
  /** Imported name of the deduction */
  importedName?: InputMaybe<Scalars['String']['input']>;
};

export type BatchCreateEmployeeBenefitsPayload = {
  __typename?: 'BatchCreateEmployeeBenefitsPayload';
  /** The employee benefits that were successfully created as a result of the mutation. */
  deductions?: Maybe<Array<EmployeeBenefit>>;
  /** User errors generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchCreateEmployeeContractDetailsInput = {
  contractDetails: Array<CreateEmployeeContractDetailsInput>;
};

export type BatchCreateEmployeeContractDetailsPayload = {
  __typename?: 'BatchCreateEmployeeContractDetailsPayload';
  contractDetails?: Maybe<Array<EmployeeContractDetails>>;
  userErrors?: Maybe<Array<EmployeeContractError>>;
};

export type BatchCreateEmployeeGarnishmentsInput = {
  /** Company ID that the employees belong to */
  companyId: Scalars['ID']['input'];
  /** List of garnishments details mapped to employeeIds to be created. */
  employeeGarnishmentDetails: Array<CreateEmployeeGarnishmentInput>;
};

export type BatchCreateEmployeeGarnishmentsPayload = {
  __typename?: 'BatchCreateEmployeeGarnishmentsPayload';
  /** List of garnishments that were created. */
  garnishments?: Maybe<Array<EmployeeGarnishment>>;
  /** List of error for each failed creation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchCreateEmployeeMiscDeductionsAndPolicyInput = {
  /**
   * The deduction policy detail from user input. If this policy is being created for
   * multiple employees, it will create one policy and mapped to all of the provided employee IDs.
   */
  employeeDeductionDetails: Array<CreateEmployeeMiscDeductionAndPolicyInput>;
  /** Imported name of the deduction */
  importedName: Scalars['String']['input'];
};

export type BatchCreateEmployeeMiscDeductionsAndPolicyPayload = {
  __typename?: 'BatchCreateEmployeeMiscDeductionsAndPolicyPayload';
  /** The employee miscDeduction that was successfully created as a result of the mutation. */
  deductions?: Maybe<Array<EmployeeMiscDeduction>>;
  /** The miscDeduction policy that was successfully created as a result of the mutation. */
  policy?: Maybe<MiscDeductionPolicy>;
  /** User error generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchCreateEmployeeMiscDeductionsInput = {
  /** The miscDeduction will use existing deduction policy Id and create deduction at the employee level. */
  employeeDeductionDetails: Array<CreateEmployeeMiscDeductionInput>;
  /** Imported name of the deduction */
  importedName?: InputMaybe<Scalars['String']['input']>;
};

export type BatchCreateEmployeeMiscDeductionsPayload = {
  __typename?: 'BatchCreateEmployeeMiscDeductionsPayload';
  /** The employee miscDeductions that were successfully created as a result of the mutation. */
  deductions?: Maybe<Array<EmployeeMiscDeduction>>;
  /** User error generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

/** Input to batch create employee payroll runs */
export type BatchCreateEmployeePayrollRunInput = {
  /** Id of the company */
  companyId: Scalars['ID']['input'];
  /** Id of company payroll run to be associated with */
  companyPayrollRunId: Scalars['ID']['input'];
  /** List of employee Ids */
  employeeIds: Array<Scalars['ID']['input']>;
};

/** Result of BatchCreateEmployeePayrollRun mutation */
export type BatchCreateEmployeePayrollRunPayload = {
  __typename?: 'BatchCreateEmployeePayrollRunPayload';
  /** Employee payroll runs created as result of the mutation */
  employeePayrollRuns?: Maybe<Array<EmployeePayrollRun>>;
  /** User error generated as a result of the mutation */
  errors?: Maybe<Array<BatchPayrollRunError>>;
};

export type BatchCreateEmployeePensionsAndPolicyInput = {
  /**
   * The deduction policy detail from user input. If this policy is being created for
   * multiple employees, it will create one policy and mapped to all of the provided employee IDs.
   */
  employeeDeductionDetails: Array<CreateEmployeePensionAndPolicyInput>;
  /** Imported name of the deduction */
  importedName: Scalars['String']['input'];
};

export type BatchCreateEmployeePensionsAndPolicyPayload = {
  __typename?: 'BatchCreateEmployeePensionsAndPolicyPayload';
  /** The employee pension that was successfully created as a result of the mutation. */
  deductions?: Maybe<Array<EmployeePension>>;
  /** The pension policy that was successfully created as a result of the mutation. */
  policy?: Maybe<PensionPolicy>;
  /** User error generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchCreateEmployeePensionsInput = {
  /** The pension will use existing deduction policy Id and create deduction at the employee level. */
  employeeDeductionDetails: Array<CreateEmployeePensionInput>;
  /** Imported name of the deduction */
  importedName?: InputMaybe<Scalars['String']['input']>;
};

export type BatchCreateEmployeePensionsPayload = {
  __typename?: 'BatchCreateEmployeePensionsPayload';
  /** The employee pensions that were successfully created as a result of the mutation. */
  deductions?: Maybe<Array<EmployeePension>>;
  /** User error generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchCreateMiscTaxReportingOfferedEmployeeBenefitsInput = {
  offeredBenefits: Array<MiscTaxReportingOfferedEmployeeBenefitInput>;
};

export type BatchCreateMiscTaxReportingOfferedEmployeeBenefitsPayload = {
  __typename?: 'BatchCreateMiscTaxReportingOfferedEmployeeBenefitsPayload';
  offeredBenefits: Array<MiscTaxReportingOfferedEmployeeBenefit>;
  /** User error generated as a result of the mutation. */
  userErrors?: Maybe<Array<MiscTaxReportingOfferedEmployeeBenefitError>>;
};

export type BatchCreateOrUpdateEmployeeCompensationsInput = {
  /** If provided, this employerCompensation will be used for all the corresponding employeeCompensations */
  defaultEmployerCompensation?: InputMaybe<CreateEmployeeCompensationEmployerCompensationInput>;
  /** This is an array of all the employee compensations that need to be created or updated */
  employeeCompensations?: InputMaybe<Array<CreateOrUpdateEmployeeCompensationInput>>;
};

export type BatchCreateOrUpdateEmployeeCompensationsPayload = {
  __typename?: 'BatchCreateOrUpdateEmployeeCompensationsPayload';
  /** A list of the created/updated employee compensations */
  employeeCompensations?: Maybe<Array<EmployeeCompensation>>;
  /** A list of the created/updated employer compensations */
  employerCompensations?: Maybe<Array<EmployerCompensation>>;
  /** Multiple errors may occur due to multiple compensations being created */
  userErrors?: Maybe<Array<CompensationMutationError>>;
};

export type BatchCreateTasksInput = {
  /** Represents the company the tasks belong to */
  companyId: Scalars['ID']['input'];
  /** Represents the tasks to be created */
  tasks: Array<CreateTaskInput>;
};

export type BatchCreateTasksPayload = {
  __typename?: 'BatchCreateTasksPayload';
  /** Error for the mutation */
  errors?: Maybe<Array<TaskError>>;
  /** Created tasks */
  tasks?: Maybe<Array<Task>>;
};

export type BatchDeleteAdjustmentPayslipsInput = {
  companyId: Scalars['ID']['input'];
  /**
   * When false, if a warning is generated during the deletion of a given payslip,
   * it will not be deleted and a warning will instead be returned.
   * If true, the mutation will happen regardless of any generated warnings.
   */
  ignoreWarnings: Scalars['Boolean']['input'];
  payslipIds: Array<Scalars['ID']['input']>;
};

export type BatchDeleteAdjustmentPayslipsPayload = {
  __typename?: 'BatchDeleteAdjustmentPayslipsPayload';
  /** A list of payslipIds that were deleted as a result of the mutation. */
  deletedPayslipIds: Array<Scalars['ID']['output']>;
  /** User errors generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeleteAdjustmentPayslipError>>;
};

export type BatchDeleteAdjustmentsError = {
  __typename?: 'BatchDeleteAdjustmentsError';
  code?: Maybe<Scalars['String']['output']>;
  employeeId: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type BatchDeleteAdjustmentsInput = {
  companyId: Scalars['ID']['input'];
  deleteAdjustmentTimeRangeChoice: DeleteAdjustmentTimeRangeChoices;
  employeeIds: Array<Scalars['ID']['input']>;
  overrides: Array<YearToDateOverrideInput>;
  year: Scalars['Int']['input'];
};

export type BatchDeleteAdjustmentsMessage = Message & {
  __typename?: 'BatchDeleteAdjustmentsMessage';
  /** Code to identify message */
  code: Scalars['String']['output'];
  /** Status message regarding update existing transactions */
  message?: Maybe<Scalars['String']['output']>;
  /** Type of the message (Info, Warning, Blocker) */
  type: MessageType;
};

export type BatchDeleteAdjustmentsPayload = {
  __typename?: 'BatchDeleteAdjustmentsPayload';
  message?: Maybe<BatchDeleteAdjustmentsMessage>;
  userErrors?: Maybe<Array<BatchDeleteAdjustmentsError>>;
};

export type BatchDeleteEmployeeBenefitsInput = {
  /** An array of employee deductions to be deleted. */
  employeeBenefits: Array<DeleteEmployeeBenefitInput>;
};

export type BatchDeleteEmployeeBenefitsPayload = {
  __typename?: 'BatchDeleteEmployeeBenefitsPayload';
  /** An array of IDs of the employee benefit that was deleted as a result of the mutation. */
  ids?: Maybe<Array<Scalars['ID']['output']>>;
  /** User error generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchDeleteEmployeeGarnishmentsInput = {
  /** Company ID that the employee garnishments belong to */
  companyId: Scalars['ID']['input'];
  /** An array of employee garnishments to be deleted. */
  employeeGarnishments: Array<DeleteEmployeeGarnishmentInput>;
};

export type BatchDeleteEmployeeGarnishmentsPayload = {
  __typename?: 'BatchDeleteEmployeeGarnishmentsPayload';
  /** An array of IDs of the employee garnishments that was deleted as a result of the mutation. */
  ids?: Maybe<Array<Scalars['ID']['output']>>;
  /** User errors generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchDeleteEmployeeMiscDeductionsInput = {
  /** An array of employee deductions to be deleted. */
  employeeMiscDeductions: Array<DeleteEmployeeMiscDeductionInput>;
};

export type BatchDeleteEmployeeMiscDeductionsPayload = {
  __typename?: 'BatchDeleteEmployeeMiscDeductionsPayload';
  /** An array of IDs of the employee misc deductions that was deleted as a result of the mutation. */
  ids?: Maybe<Array<Scalars['ID']['output']>>;
  /** User error generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchDeleteEmployeePensionsInput = {
  /** An array of employee deductions to be deleted. */
  employeePensions: Array<DeleteEmployeePensionInput>;
};

export type BatchDeleteEmployeePensionsPayload = {
  __typename?: 'BatchDeleteEmployeePensionsPayload';
  /** An array of IDs of the employee pensions that was deleted as a result of the mutation. */
  ids?: Maybe<Array<Scalars['ID']['output']>>;
  /** User error generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchDeleteEmployeeTimeOffPoliciesInput = {
  /** List of employee time off policies to be deleted. */
  timeOffPolicies: Array<DeleteEmployeeTimeOffPoliciesInput>;
};

export type BatchDeleteEmployeeTimeOffPoliciesPayload = {
  __typename?: 'BatchDeleteEmployeeTimeOffPoliciesPayload';
  /** List of timeoff policy ids that were deleted successfully */
  employeeTimeOffPolicyIds?: Maybe<Array<Scalars['ID']['output']>>;
  /** List of errors for each deletion that has failed. */
  userErrors?: Maybe<Array<TimeOffPolicyError>>;
};

export type BatchDeleteTasksInput = {
  /** Represents the company the tasks belong to */
  companyId: Scalars['ID']['input'];
  /** Represents the tasks to be deleted */
  tasks: Array<DeleteTaskInput>;
};

export type BatchDeleteTasksPayload = {
  __typename?: 'BatchDeleteTasksPayload';
  /** Errors for the mutation */
  errors?: Maybe<Array<TaskError>>;
  /** Id of the deleted tasks */
  ids?: Maybe<Array<Scalars['ID']['output']>>;
};

export type BatchEmploymentStatusError = {
  __typename?: 'BatchEmploymentStatusError';
  code?: Maybe<Scalars['String']['output']>;
  employeeId: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Payload type for each employee with Evaluated prior payroll totals */
export type BatchEvaluateEmployeePriorPayrollTotalsPayload = {
  __typename?: 'BatchEvaluateEmployeePriorPayrollTotalsPayload';
  /** Employee Id */
  employeeId: Scalars['ID']['output'];
  /** Evaluated Prior Payroll Period Totals */
  periods: Array<PriorPayrollPeriod>;
};

/** Input for calculating the expected prior payroll totals */
export type BatchEvaluateEmployeePriorPayrollsInput = {
  /** Represents the company the employees belong to */
  companyId: Scalars['ID']['input'];
  /** List of employees with prior payroll period totals to evaluate expected totals */
  employeePriorPayrolls: Array<EmployeePriorPayrollInput>;
};

export type BatchEvaluateEmployeePriorPayrollsPayload = {
  __typename?: 'BatchEvaluateEmployeePriorPayrollsPayload';
  /** Evaluated Prior Payroll Period Totals */
  totals: Array<BatchEvaluateEmployeePriorPayrollTotalsPayload>;
  /** Error for the mutation */
  userErrors?: Maybe<Array<PriorPayrollMutationError>>;
};

/** Error generated as a result of a batch payroll run mutation */
export type BatchPayrollRunError = {
  __typename?: 'BatchPayrollRunError';
  /** error code */
  code?: Maybe<Scalars['String']['output']>;
  /** employee id associated with the error */
  employeeId?: Maybe<Scalars['ID']['output']>;
  /** A description of the error */
  message: Scalars['String']['output'];
  /** error type */
  type?: Maybe<Scalars['String']['output']>;
};

/** Create a batch of employee time off policy given the employee ids and the new time off policy inputs. */
export type BatchSetupEmployeeTimeOffPoliciesInput = {
  /** A list of employee Ids and their time off policy details */
  timeOffPolicies?: InputMaybe<Array<SetupEmployeeTimeOffPoliciesInput>>;
};

export type BatchSetupEmployeeTimeOffPoliciesPayload = {
  __typename?: 'BatchSetupEmployeeTimeOffPoliciesPayload';
  /** The employee time off policies that were successfully created as a result of the mutation. */
  employeeTimeOffPolicies?: Maybe<Array<EmployeeTimeOffPolicy>>;
  /** The employer time off policies that were successfully created as a result of the mutation. */
  employerTimeOffPolicies?: Maybe<Array<EmployerTimeOffPolicy>>;
  /**
   * Any errors during the batch creation process.
   * There could be multiple errors due to the request having multiple employees and time off policies.
   */
  userErrors?: Maybe<Array<TimeOffPolicyError>>;
};

/** Updates a batch of AutoPayroll setup details for batchUpdateEmployeeAutoPayrollSetup mutation */
export type BatchUpdateEmployeeAutoPayrollSetupInput = {
  /** Id of the company */
  companyId: Scalars['ID']['input'];
  updateEmployeeAutoPayrollSetupInput: Array<UpdateEmployeeAutoPayrollSetupInput>;
};

/** Result payload of batchUpdateEmployeeAutoPayrollSetup mutation */
export type BatchUpdateEmployeeAutoPayrollSetupPayload = {
  __typename?: 'BatchUpdateEmployeeAutoPayrollSetupPayload';
  /** The EmployeeAutoPayrollSetup that was updated as a result of the mutation */
  employeesAutoPayrollSetup?: Maybe<Array<EmployeeAutoPayrollSetup>>;
  /** List of user errors for each failed update generated as a result of mutation */
  userErrors?: Maybe<Array<BatchPayrollRunError>>;
};

export type BatchUpdateEmployeeBenefitsInput = {
  /** The list of existing employee benefits to be updated. */
  employeeBenefits: Array<UpdateEmployeeBenefitInput>;
};

export type BatchUpdateEmployeeBenefitsPayload = {
  __typename?: 'BatchUpdateEmployeeBenefitsPayload';
  /** The benefits that were successfully updated as a result of the mutation. */
  benefits?: Maybe<Array<EmployeeBenefit>>;
  /** User error generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchUpdateEmployeeGarnishmentsInput = {
  /** Company ID that the employees belong to. */
  companyId: Scalars['ID']['input'];
  /** List of garnishments to update. */
  employeeGarnishmentDetails: Array<UpdateEmployeeGarnishmentInput>;
};

export type BatchUpdateEmployeeGarnishmentsPayload = {
  __typename?: 'BatchUpdateEmployeeGarnishmentsPayload';
  /** List of garnishments that were updated. */
  garnishments?: Maybe<Array<EmployeeGarnishment>>;
  /** List of error for each failed update. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchUpdateEmployeeMiscDeductionsInput = {
  /** The list of existing employee misc deductions to be updated. */
  employeeMiscDeductions: Array<UpdateEmployeeMiscDeductionInput>;
};

export type BatchUpdateEmployeeMiscDeductionsPayload = {
  __typename?: 'BatchUpdateEmployeeMiscDeductionsPayload';
  /** The misc deductions that were successfully updated as a result of the mutation. */
  miscDeductions?: Maybe<Array<EmployeeMiscDeduction>>;
  /** User error generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchUpdateEmployeePensionsInput = {
  /** The list of existing employee pensions to be updated. */
  employeePensions: Array<UpdateEmployeePensionInput>;
};

export type BatchUpdateEmployeePensionsPayload = {
  __typename?: 'BatchUpdateEmployeePensionsPayload';
  /** The pensions that were successfully updated as a result of the mutation. */
  pensions?: Maybe<Array<EmployeePension>>;
  /** User error generated as a result of the mutation. */
  userErrors?: Maybe<Array<DeductionError>>;
};

export type BatchUpdateEmployeePriorPayrollInput = {
  /** Represents the company the employees belong to */
  companyId: Scalars['ID']['input'];
  /** Represents list of employees prior payroll period totals to be updated */
  employeePriorPayrolls: Array<EmployeePriorPayrollInput>;
};

/** Payload type for updated employee prior payroll */
export type BatchUpdateEmployeePriorPayrollTotalsPayload = {
  __typename?: 'BatchUpdateEmployeePriorPayrollTotalsPayload';
  /** Updated Prior Payroll Period Totals */
  totals: Array<EmployeePriorPayrollTotalsPayload>;
  /** Error for the mutation */
  userErrors?: Maybe<Array<PriorPayrollMutationError>>;
};

/** Update a batch of employee time off policy given the employee ids and the time off policy inputs. */
export type BatchUpdateEmployeeTimeOffPoliciesInput = {
  /** A list of employee Ids and their time off policy details */
  timeOffPolicies: Array<EditEmployeeTimeOffPoliciesInput>;
};

export type BatchUpdateEmployeeTimeOffPoliciesPayload = {
  __typename?: 'BatchUpdateEmployeeTimeOffPoliciesPayload';
  /** The employee time off policies that were successfully updated as a result of the mutation. */
  employeeTimeOffPolicies?: Maybe<Array<EmployeeTimeOffPolicy>>;
  /** The employer time off policies that were successfully created as a result of the mutation. */
  employerTimeOffPolicies?: Maybe<Array<EmployerTimeOffPolicy>>;
  /**
   * Any errors during the batch update process.
   * There could be multiple errors due to the request having multiple employees and time off policies.
   */
  userErrors?: Maybe<Array<TimeOffPolicyError>>;
};

export type BatchUpdateEmployeesYearToDateError = {
  __typename?: 'BatchUpdateEmployeesYearToDateError';
  code?: Maybe<Scalars['String']['output']>;
  employeeId: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type BatchUpdateEmployeesYearToDateInput = {
  companyId: Scalars['ID']['input'];
  employeeIds: Array<Scalars['String']['input']>;
  overrides: Array<YearToDateOverrideInput>;
  year: Scalars['Int']['input'];
};

export type BatchUpdateEmployeesYearToDateMessage = Message & {
  __typename?: 'BatchUpdateEmployeesYearToDateMessage';
  /** Code to identify message */
  code: Scalars['String']['output'];
  /** Status message regarding update existing transactions */
  message?: Maybe<Scalars['String']['output']>;
  /** Type of the message (Info, Warning, Blocker) */
  type: MessageType;
};

export type BatchUpdateEmployeesYearToDatePayload = {
  __typename?: 'BatchUpdateEmployeesYearToDatePayload';
  message?: Maybe<BatchUpdateEmployeesYearToDateMessage>;
  userErrors?: Maybe<Array<BatchUpdateEmployeesYearToDateError>>;
};

export type BatchUpdateEmployerPriorPayrollRunsInput = {
  /** Represents the company the input belongs to */
  companyId: Scalars['ID']['input'];
  /** Represents employer prior payroll run totals to be added or removed */
  priorPayrollRuns: EmployerPriorPayrollRunsInput;
};

/** Payload type for updated employer prior payroll */
export type BatchUpdateEmployerPriorPayrollRunsPayload = {
  __typename?: 'BatchUpdateEmployerPriorPayrollRunsPayload';
  /** Updated Employer Prior Payroll Period Totals */
  priorPayrollRuns: Array<EmployerPriorPayrollRunsPayload>;
  /** Error for the mutation */
  userErrors?: Maybe<Array<EmployerPriorPayrollRunMutationError>>;
};

export type BatchUpdateEmploymentStatusInput = {
  companyId: Scalars['ID']['input'];
  employmentStatuses: Array<UpdateEmploymentStatusInput>;
};

export type BatchUpdateEmploymentStatusPayload = {
  __typename?: 'BatchUpdateEmploymentStatusPayload';
  /** List of employee Ids and the employment status that was updated */
  updatedEmployees: Array<Employee>;
  userErrors?: Maybe<Array<BatchEmploymentStatusError>>;
};

export type BatchUpdateMiscTaxReportingOfferedEmployeeBenefitsInput = {
  offeredBenefits: Array<MiscTaxReportingOfferedEmployeeBenefitInput>;
};

export type BatchUpdateMiscTaxReportingOfferedEmployeeBenefitsPayload = {
  __typename?: 'BatchUpdateMiscTaxReportingOfferedEmployeeBenefitsPayload';
  offeredBenefits: Array<MiscTaxReportingOfferedEmployeeBenefit>;
  /** User error generated as a result of the mutation. */
  userErrors?: Maybe<Array<MiscTaxReportingOfferedEmployeeBenefitError>>;
};

export type BatchUpdateTasksInput = {
  /** Represents the company the tasks belong to */
  companyId: Scalars['ID']['input'];
  /** Represents the tasks to be updated */
  tasks: Array<UpdateTaskInput>;
};

export type BatchUpdateTasksPayload = {
  __typename?: 'BatchUpdateTasksPayload';
  /** Errors for the mutation */
  errors?: Maybe<Array<TaskError>>;
  /** Updated tasks */
  tasks?: Maybe<Array<Task>>;
};

export type BatchUpdateTaxFilingDocumentEmployeeViewableError = {
  __typename?: 'BatchUpdateTaxFilingDocumentEmployeeViewableError';
  code?: Maybe<Scalars['String']['output']>;
  employeeId?: Maybe<Scalars['ID']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type BatchUpdateTaxFilingDocumentEmployeeViewableInput = {
  companyId: Scalars['ID']['input'];
  employeeViewableStatuses: Array<EmployeeViewableStatus>;
  formId: Scalars['String']['input'];
  year: Scalars['Int']['input'];
};

export type BatchUpdateTaxFilingDocumentEmployeeViewablePayload = {
  __typename?: 'BatchUpdateTaxFilingDocumentEmployeeViewablePayload';
  errors?: Maybe<Array<BatchUpdateTaxFilingDocumentEmployeeViewableError>>;
};

export type BenefitEmployeeConnection = {
  __typename?: 'BenefitEmployeeConnection';
  edges?: Maybe<Array<Maybe<EmployeeEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** Filings for a company that may or may not have been submitted. */
export type BenefitFiling = Node & {
  __typename?: 'BenefitFiling';
  /** Is/was the platform responsible for automatically making this filing. False indicates that this filing will be/was made manually by the user. */
  automatic: Scalars['Boolean']['output'];
  /** Employee to which this filing belongs to */
  employee: Employee;
  /** Current status of the filing */
  filingStatus: BenefitFilingStatus;
  id: Scalars['ID']['output'];
  /** The date on which the payroll associated with this filing was paid */
  payDate?: Maybe<Scalars['Date']['output']>;
  /** Pension provider name associated with this filing, when applicable */
  pensionProviderName?: Maybe<Scalars['String']['output']>;
  /** The period of time this benefit filing belongs to */
  period: DatePeriod;
};

/** A connection to a list of items. */
export type BenefitFilingConnection = {
  __typename?: 'BenefitFilingConnection';
  edges: Array<BenefitFilingEdge>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type BenefitFilingConnectionFilter = {
  /** Optional filter to only include filings whose pension provider name matches exactly */
  pensionProviderName?: InputMaybe<Scalars['String']['input']>;
  period: DateFilter;
};

/** An edge in a connection. */
export type BenefitFilingEdge = {
  __typename?: 'BenefitFilingEdge';
  /** The item at the end of the edge */
  node?: Maybe<BenefitFiling>;
};

export enum BenefitFilingState {
  Accepted = 'ACCEPTED',
  Deleted = 'DELETED',
  Pending = 'PENDING',
  PendingSubmission = 'PENDING_SUBMISSION',
  ReadyToFile = 'READY_TO_FILE',
  Rejected = 'REJECTED',
  Submitted = 'SUBMITTED'
}

export type BenefitFilingStatus = {
  __typename?: 'BenefitFilingStatus';
  /** Provides the reason/code for a filing in REJECTED state */
  rejectionReason?: Maybe<Scalars['String']['output']>;
  status: BenefitFilingState;
  /** The date on which the form has been submitted to the agency */
  submissionDate?: Maybe<Scalars['Date']['output']>;
};

/**
 * A benefit an employer offers to employees
 * Examples includes health insurance and taxable non-cash benefits like meals and lodging
 */
export type BenefitPolicy = DeductionPolicy & Node & {
  __typename?: 'BenefitPolicy';
  /** Whether this policy is currently active */
  active: Scalars['Boolean']['output'];
  /** Determines this deduction category */
  category: Scalars['String']['output'];
  /** Provides the list of employees related to the current benefit */
  employees?: Maybe<BenefitEmployeeConnection>;
  id: Scalars['ID']['output'];
  /** A deduction name/description */
  name: Scalars['String']['output'];
  /** Name of the benefit provider */
  providerName?: Maybe<Scalars['String']['output']>;
  /** Defines the exact types (including taxability) that are supported by region (e.g. CUS_DED_MEDICAL_INSURANCE_PRE_TAX) */
  statutoryType: Scalars['String']['output'];
  /** SubCategory of this deduction */
  subCategory: Scalars['String']['output'];
  /** Defines if a deduction is pre tax */
  taxOption: TaxOption;
};


/**
 * A benefit an employer offers to employees
 * Examples includes health insurance and taxable non-cash benefits like meals and lodging
 */
export type BenefitPolicyCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/**
 * A benefit an employer offers to employees
 * Examples includes health insurance and taxable non-cash benefits like meals and lodging
 */
export type BenefitPolicyEmployeesArgs = {
  filterBy?: InputMaybe<PayrollPolicyEmployeesFilter>;
  orderBy?: InputMaybe<Array<EmployeesWithContributionOrderBy>>;
  pagination?: InputMaybe<PaginationInput>;
};


/**
 * A benefit an employer offers to employees
 * Examples includes health insurance and taxable non-cash benefits like meals and lodging
 */
export type BenefitPolicyProviderNameArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/**
 * A benefit an employer offers to employees
 * Examples includes health insurance and taxable non-cash benefits like meals and lodging
 */
export type BenefitPolicyStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/**
 * A benefit an employer offers to employees
 * Examples includes health insurance and taxable non-cash benefits like meals and lodging
 */
export type BenefitPolicySubCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type BirthdayRangeFilter = {
  /** Format: MM-DD */
  end: Scalars['String']['input'];
  /** Format: MM-DD */
  start: Scalars['String']['input'];
};

export type BooleanFilter = {
  eq?: InputMaybe<Scalars['Boolean']['input']>;
  ne?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Employee details for bulk invitation input */
export type BulkUpdateEmployeeFeatureGroupEmployeeInput = {
  /** Employee ID */
  id: Scalars['ID']['input'];
  /** Employee Email Address */
  primaryEmailAddress: EmailAddressInput;
};

/** Employee bulk invitation feature set input */
export type BulkUpdateEmployeeFeatureGroupInput = {
  /** Company ID */
  companyId: Scalars['ID']['input'];
  /** set of Employees with ID and Email Address */
  employees: Array<BulkUpdateEmployeeFeatureGroupEmployeeInput>;
  /** The feature group input that applies to all employees specified in employeeIds */
  featureGroup: EmployeeFeatureGroupInput;
};

export type BulkUpdateEmployeeFeatureGroupPayload = {
  __typename?: 'BulkUpdateEmployeeFeatureGroupPayload';
  employeeFeatureGroups?: Maybe<Array<EmployeeFeatureGroupAndProductInvitations>>;
  error?: Maybe<EmployeeFeatureGroupError>;
};

/** Name detail for business contractor */
export type BusinessContractorNameDetail = {
  __typename?: 'BusinessContractorNameDetail';
  businessName?: Maybe<Scalars['String']['output']>;
};

/** Represents a specific compensation calculated to be paid (for e.g. during a specific payroll run or on payslip) */
export type CalculatedCompensation = {
  /** Includes current and total amounts for a compensation */
  calculatedCompensationAccumulationAmount: CalculatedCompensationAccumulationAmount;
  /** Includes rate and hours used to compute compensation amount to be paid */
  calculatedCompensationDetail?: Maybe<CalculatedCompensationDetail>;
  /** CompensationSplits specifies how a singular calculated compensation breaks down across different compensationSplitDetail. If the total (of the compensationSpilts) is below the the value of hours or amount in the CalculatedCompensation, the remainder is unallocated. If compensationSplits is null, there is no allocation of this CalculatedCompensation across any employeeCompensationSplitData. */
  compensationSplits: Array<EmployeeCompensationSplit>;
  /** Compliance id for the compensation */
  complianceId?: Maybe<Scalars['String']['output']>;
  /** Compensation of the employee */
  employeeCompensation: EmployeeCompensation;
};

/** Includes calcluated amount details for a compensation */
export type CalculatedCompensationAccumulationAmount = AccumulationAmount & {
  __typename?: 'CalculatedCompensationAccumulationAmount';
  /** Monetary amount paid for the compensation (for e.g. during a specific payroll run or payslip) */
  currentAmount: Scalars['Money']['output'];
  /** Total monetary amount paid for the compensation for given time period */
  toDateAmounts: Array<ToDateAmount>;
};

/** Metamodel to include calcluated amount details for a compensation */
export type CalculatedCompensationAccumulationAmountMetaModel = MetaModel & {
  __typename?: 'CalculatedCompensationAccumulationAmountMetaModel';
  applicable: Scalars['Boolean']['output'];
  currentAmount: MetaMoney;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  toDateAmounts: Array<ToDateAmountMetaModel>;
  typeRef: Scalars['String']['output'];
};

/** Rate and hours used to compute compensation amount to be paid */
export type CalculatedCompensationDetail = {
  __typename?: 'CalculatedCompensationDetail';
  /** hours worked for this compensation */
  hours?: Maybe<Scalars['Float']['output']>;
  /** The money rate this compensation is paid with */
  rate?: Maybe<PayRate>;
  /** Determines where the hours/rate is being pulled from */
  source?: Maybe<Scalars['String']['output']>;
};

export type CalculatedCompensationDetailInput = {
  /** Monetary amount paid for the compensation */
  currentAmount?: InputMaybe<Scalars['Money']['input']>;
  /** Hours worked for the compensation */
  hours?: InputMaybe<Scalars['Float']['input']>;
  /** Pay rate associated with the compensation detail */
  rate?: InputMaybe<PayRateInput>;
  /** Specify where the hours/rate is being pulled from */
  source?: InputMaybe<Scalars['String']['input']>;
};

/** The metamodel for rate and hours used to compute compensation amount to be paid */
export type CalculatedCompensationDetailMetaModel = MetaModel & {
  __typename?: 'CalculatedCompensationDetailMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** Metamodel for hours worked for this compensation */
  hours: MetaFloat;
  label: Scalars['String']['output'];
  /** Metamodel representing the PayRate associated to the compensation detail */
  rate: PayRateMetaModel;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Represents a specific deduction calculated to be included (for e.g. in a specific payroll run or on payslip) */
export type CalculatedDeduction = {
  /** Compliance id for the deduction */
  complianceId?: Maybe<Scalars['String']['output']>;
  /** Employee's current and total contribution amount to a deduction */
  employeeContributionAccumulationAmount?: Maybe<EmployeeContributionAccumulationAmount>;
  /** Deduction of the employee */
  employeeDeduction: EmployeeDeduction;
  /** Employer's current and total contribution amount to a deduction */
  employerContributionAccumulationAmount?: Maybe<EmployerContributionAccumulationAmount>;
};

/** Represents a specific tax calculated to be withheld (for e.g. during a specific payroll run or on payslip) */
export type CalculatedTax = {
  /** Includes current and total amounts for a tax */
  accumulationAmount: TaxAccumulationAmount;
  /** Compliance id for the tax */
  complianceId?: Maybe<Scalars['String']['output']>;
  /** Defines the exact tax type */
  statutoryType: Scalars['String']['output'];
};

/**
 * Monetary amount accrued, used and remaining balance calculated for employee's time off policy for a specific payroll run
 * This detail is available for Canada only.
 */
export type CalculatedTimeOffAmountDetail = {
  __typename?: 'CalculatedTimeOffAmountDetail';
  /** Amount accrued for the given time off policy */
  accrued: Scalars['Money']['output'];
  /** Amount remaining for the given time off policy */
  balance: Scalars['Money']['output'];
  /** Amount used for the given time off policy */
  used: Scalars['Money']['output'];
};

/** Hours accrued, used and remaining balance calculated for employee's time off policy for a specific of payroll run */
export type CalculatedTimeOffHoursDetail = {
  __typename?: 'CalculatedTimeOffHoursDetail';
  /** Hours accrued for the given time off policy */
  accrued: UnitOfTime;
  /** Hours remaining for the given time off policy */
  balance: UnitOfTime;
  /** Hours used for the given time off policy */
  used: UnitOfTime;
};

/** Represents a specific time off policy calculated (for e.g. during a specific payroll run or on payslip) */
export type CalculatedTimeOffPolicy = {
  /** Includes calculated accrued, used and available amounts for employee's time off policy */
  calculatedTimeOffAmountDetail: CalculatedTimeOffAmountDetail;
  /** Includes calculated accrued, used and available hours for employee's time off policy */
  calculatedTimeOffHoursDetail: CalculatedTimeOffHoursDetail;
  /** Timeoff policy of the employee */
  employeeTimeOffPolicy: EmployeeTimeOffPolicy;
};

export type CancelEmployeeCompensationEffectiveDatedChangeInput = {
  effectiveStart: Scalars['Date']['input'];
  employeeId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
};

export type CancelEmployeeCompensationEffectiveDatedChangePayload = {
  __typename?: 'CancelEmployeeCompensationEffectiveDatedChangePayload';
  /** The ID of the cancelled entity, if successful */
  id?: Maybe<Scalars['ID']['output']>;
  userError?: Maybe<CompensationMutationError>;
};

export type CancelEmployeeContractDetailsEffectiveDatedChangeInput = {
  companyId: Scalars['ID']['input'];
  effectiveStart: Scalars['Date']['input'];
  id: Scalars['ID']['input'];
};

export type CancelEmployeeContractDetailsEffectiveDatedChangePayload = {
  __typename?: 'CancelEmployeeContractDetailsEffectiveDatedChangePayload';
  /** The ID of the cancelled entity, if successful */
  id?: Maybe<Scalars['ID']['output']>;
  userError?: Maybe<EmployeeContractError>;
};

/** Input for cancelling an employee's effective dated change */
export type CancelEmployeeEffectiveDatedChangeInput = {
  /** Company ID of the employee */
  companyId: Scalars['ID']['input'];
  /** The effective start date for the deletion */
  effectiveStart: Scalars['Date']['input'];
  /** ID of the employee being updated */
  employeeId: Scalars['ID']['input'];
};

/** Payload for cancelling an employee's effective dated change */
export type CancelEmployeeEffectiveDatedChangePayload = {
  __typename?: 'CancelEmployeeEffectiveDatedChangePayload';
  userError?: Maybe<EmployeeError>;
};

/** Describes the deduction/contribution capping amount and frequency */
export type Capping = {
  __typename?: 'Capping';
  /** Capping amount */
  amount: Rate;
  /** Capping frequency */
  frequency?: Maybe<CappingFrequency>;
};

export enum CappingFrequency {
  ByCalendarYear = 'BY_CALENDAR_YEAR'
}

export type CappingInput = {
  amount: RateInput;
};

export type CappingMetaModel = MetaModel & {
  __typename?: 'CappingMetaModel';
  /** The metamodels for capping amount */
  amount: RateMetaModel;
  applicable: Scalars['Boolean']['output'];
  /** The allowed frequency for cappings for contribution */
  frequency: MetaEnum;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Any messages that have a greater shared grouping */
export type CategorizedMessage = Message & {
  __typename?: 'CategorizedMessage';
  /** The category that the message belongs to (TAX_INFO, DEDUCTIONS, etc.) */
  category: Scalars['String']['output'];
  /** Code to identify message */
  code: Scalars['String']['output'];
  /** Short description */
  message?: Maybe<Scalars['String']['output']>;
  /** Type of the message (Info, Warning, Blocker) */
  type: MessageType;
};


/** Any messages that have a greater shared grouping */
export type CategorizedMessageCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type CategorizedMessageFilter = {
  category?: InputMaybe<StringFilter>;
};

export type CertifiedPayrollReport = {
  __typename?: 'CertifiedPayrollReport';
  /** Certified payroll report with report data rendering detail */
  renderings?: Maybe<CertifiedPayrollReportRenderings>;
};

export type CertifiedPayrollReportDateFilter = {
  dateRange: DateFilter;
};

export type CertifiedPayrollReportFilter = {
  payPeriod: CertifiedPayrollReportDateFilter;
  /** Project filter by id, name and addresses */
  project: ProjectFilter;
};

export type CertifiedPayrollReportInput = {
  filterBy: CertifiedPayrollReportFilter;
};

/** Provides details for certified payroll report renderings e.g. excel */
export type CertifiedPayrollReportRenderings = {
  __typename?: 'CertifiedPayrollReportRenderings';
  excel: FileRendering;
};

/** Enum of options to track classes for payroll transactions in accounting. */
export enum ClassTrackingMode {
  /** Specifies different classes are used to track different workers. */
  DifferentClasses = 'DIFFERENT_CLASSES',
  /** Specifies classes are not used to track payroll transactions. */
  NoClasses = 'NO_CLASSES',
  /** Specifies same class is used to track all workers. */
  OneClass = 'ONE_CLASS'
}

/** [/common/Address](https://schema.intuit.com/#data:/common/Address) */
export type Common_Address = {
  __typename?: 'Common_Address';
  addressComponents?: Maybe<Array<Maybe<Common_NameValue>>>;
  addressId?: Maybe<Scalars['String']['output']>;
  formattedAddress?: Maybe<Scalars['String']['output']>;
};

export type Common_AddressInput = {
  addressComponents?: InputMaybe<Array<InputMaybe<Common_NameValueInput>>>;
};

/** Common_Address meta model */
export type Common_AddressMetaModel = MetaModel & {
  __typename?: 'Common_AddressMetaModel';
  /** Address components */
  addressComponents: Array<Common_NameValueMetaModel>;
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type Common_Contact = {
  __typename?: 'Common_Contact';
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  primaryEmail?: Maybe<Scalars['String']['output']>;
  /** Login name of the primary contact person of the company */
  primaryLoginName?: Maybe<Scalars['String']['output']>;
  primaryTelephone?: Maybe<Common_Telephone>;
};

/** Country alpha-3 code from international standards: https://en.wikipedia.org/wiki/ISO_3166-1 */
export enum Common_CountryCode {
  Abw = 'ABW',
  Afg = 'AFG',
  Ago = 'AGO',
  Aia = 'AIA',
  Ala = 'ALA',
  Alb = 'ALB',
  And = 'AND',
  Are = 'ARE',
  Arg = 'ARG',
  Arm = 'ARM',
  Asm = 'ASM',
  Ata = 'ATA',
  Atf = 'ATF',
  Atg = 'ATG',
  Aus = 'AUS',
  Aut = 'AUT',
  Aze = 'AZE',
  Bdi = 'BDI',
  Bel = 'BEL',
  Ben = 'BEN',
  Bes = 'BES',
  Bfa = 'BFA',
  Bgd = 'BGD',
  Bgr = 'BGR',
  Bhr = 'BHR',
  Bhs = 'BHS',
  Bih = 'BIH',
  Blm = 'BLM',
  Blr = 'BLR',
  Blz = 'BLZ',
  Bmu = 'BMU',
  Bol = 'BOL',
  Bra = 'BRA',
  Brb = 'BRB',
  Brn = 'BRN',
  Btn = 'BTN',
  Bvt = 'BVT',
  Bwa = 'BWA',
  Caf = 'CAF',
  Can = 'CAN',
  Cck = 'CCK',
  Che = 'CHE',
  Chl = 'CHL',
  Chn = 'CHN',
  Civ = 'CIV',
  Cmr = 'CMR',
  Cod = 'COD',
  Cog = 'COG',
  Cok = 'COK',
  Col = 'COL',
  Com = 'COM',
  Cpv = 'CPV',
  Cri = 'CRI',
  Cub = 'CUB',
  Cuw = 'CUW',
  Cxr = 'CXR',
  Cym = 'CYM',
  Cyp = 'CYP',
  Cze = 'CZE',
  Deu = 'DEU',
  Dji = 'DJI',
  Dma = 'DMA',
  Dnk = 'DNK',
  Dom = 'DOM',
  Dza = 'DZA',
  Ecu = 'ECU',
  Egy = 'EGY',
  Eri = 'ERI',
  Esh = 'ESH',
  Esp = 'ESP',
  Est = 'EST',
  Eth = 'ETH',
  Fin = 'FIN',
  Fji = 'FJI',
  Flk = 'FLK',
  Fra = 'FRA',
  Fro = 'FRO',
  Fsm = 'FSM',
  Gab = 'GAB',
  Gbr = 'GBR',
  Geo = 'GEO',
  Ggy = 'GGY',
  Gha = 'GHA',
  Gib = 'GIB',
  Gin = 'GIN',
  Glp = 'GLP',
  Gmb = 'GMB',
  Gnb = 'GNB',
  Gnq = 'GNQ',
  Grc = 'GRC',
  Grd = 'GRD',
  Grl = 'GRL',
  Gtm = 'GTM',
  Guf = 'GUF',
  Gum = 'GUM',
  Guy = 'GUY',
  Hkg = 'HKG',
  Hmd = 'HMD',
  Hnd = 'HND',
  Hrv = 'HRV',
  Hti = 'HTI',
  Hun = 'HUN',
  Idn = 'IDN',
  Imn = 'IMN',
  Ind = 'IND',
  Iot = 'IOT',
  Irl = 'IRL',
  Irn = 'IRN',
  Irq = 'IRQ',
  Isl = 'ISL',
  Isr = 'ISR',
  Ita = 'ITA',
  Jam = 'JAM',
  Jey = 'JEY',
  Jor = 'JOR',
  Jpn = 'JPN',
  Kaz = 'KAZ',
  Ken = 'KEN',
  Kgz = 'KGZ',
  Khm = 'KHM',
  Kir = 'KIR',
  Kna = 'KNA',
  Kor = 'KOR',
  Kwt = 'KWT',
  Lao = 'LAO',
  Lbn = 'LBN',
  Lbr = 'LBR',
  Lby = 'LBY',
  Lca = 'LCA',
  Lie = 'LIE',
  Lka = 'LKA',
  Lso = 'LSO',
  Ltu = 'LTU',
  Lux = 'LUX',
  Lva = 'LVA',
  Mac = 'MAC',
  Maf = 'MAF',
  Mar = 'MAR',
  Mco = 'MCO',
  Mda = 'MDA',
  Mdg = 'MDG',
  Mdv = 'MDV',
  Mex = 'MEX',
  Mhl = 'MHL',
  Mkd = 'MKD',
  Mli = 'MLI',
  Mlt = 'MLT',
  Mmr = 'MMR',
  Mne = 'MNE',
  Mng = 'MNG',
  Mnp = 'MNP',
  Moz = 'MOZ',
  Mrt = 'MRT',
  Msr = 'MSR',
  Mtq = 'MTQ',
  Mus = 'MUS',
  Mwi = 'MWI',
  Mys = 'MYS',
  Myt = 'MYT',
  Nam = 'NAM',
  Ncl = 'NCL',
  Ner = 'NER',
  Nfk = 'NFK',
  Nga = 'NGA',
  Nic = 'NIC',
  Niu = 'NIU',
  Nld = 'NLD',
  Nor = 'NOR',
  Npl = 'NPL',
  Nru = 'NRU',
  Nzl = 'NZL',
  Omn = 'OMN',
  Pak = 'PAK',
  Pan = 'PAN',
  Pcn = 'PCN',
  Per = 'PER',
  Phl = 'PHL',
  Plw = 'PLW',
  Png = 'PNG',
  Pol = 'POL',
  Pri = 'PRI',
  Prk = 'PRK',
  Prt = 'PRT',
  Pry = 'PRY',
  Pse = 'PSE',
  Pyf = 'PYF',
  Qat = 'QAT',
  Reu = 'REU',
  Rou = 'ROU',
  Rus = 'RUS',
  Rwa = 'RWA',
  Sau = 'SAU',
  Sdn = 'SDN',
  Sen = 'SEN',
  Sgp = 'SGP',
  Sgs = 'SGS',
  Shn = 'SHN',
  Sjm = 'SJM',
  Slb = 'SLB',
  Sle = 'SLE',
  Slv = 'SLV',
  Smr = 'SMR',
  Som = 'SOM',
  Spm = 'SPM',
  Srb = 'SRB',
  Ssd = 'SSD',
  Stp = 'STP',
  Sur = 'SUR',
  Svk = 'SVK',
  Svn = 'SVN',
  Swe = 'SWE',
  Swz = 'SWZ',
  Sxm = 'SXM',
  Syc = 'SYC',
  Syr = 'SYR',
  Tca = 'TCA',
  Tcd = 'TCD',
  Tgo = 'TGO',
  Tha = 'THA',
  Tjk = 'TJK',
  Tkl = 'TKL',
  Tkm = 'TKM',
  Tls = 'TLS',
  Ton = 'TON',
  Tto = 'TTO',
  Tun = 'TUN',
  Tur = 'TUR',
  Tuv = 'TUV',
  Twn = 'TWN',
  Tza = 'TZA',
  Uga = 'UGA',
  Ukr = 'UKR',
  Umi = 'UMI',
  Unknown = 'UNKNOWN',
  Ury = 'URY',
  Usa = 'USA',
  Uzb = 'UZB',
  Vat = 'VAT',
  Vct = 'VCT',
  Ven = 'VEN',
  Vgb = 'VGB',
  Vir = 'VIR',
  Vnm = 'VNM',
  Vut = 'VUT',
  Wlf = 'WLF',
  Wsm = 'WSM',
  Xkx = 'XKX',
  Yem = 'YEM',
  Zaf = 'ZAF',
  Zmb = 'ZMB',
  Zwe = 'ZWE'
}

/**
 * Currency code from international standard: https://www.iban.com/currency-codes,
 * plus extension for crypto currencies
 */
export enum Common_CurrencyCode {
  Aed = 'AED',
  Afn = 'AFN',
  All = 'ALL',
  Amd = 'AMD',
  Ang = 'ANG',
  Aoa = 'AOA',
  Ars = 'ARS',
  Aud = 'AUD',
  Awg = 'AWG',
  Azn = 'AZN',
  Bam = 'BAM',
  Bbd = 'BBD',
  Bdt = 'BDT',
  Bgn = 'BGN',
  Bhd = 'BHD',
  Bif = 'BIF',
  Bmd = 'BMD',
  Bnd = 'BND',
  Bob = 'BOB',
  Brl = 'BRL',
  Bsd = 'BSD',
  Btc = 'BTC',
  Btn = 'BTN',
  Bwp = 'BWP',
  Byn = 'BYN',
  Byr = 'BYR',
  Bzd = 'BZD',
  Cad = 'CAD',
  Cdf = 'CDF',
  Chf = 'CHF',
  Clp = 'CLP',
  Cny = 'CNY',
  Cop = 'COP',
  Crc = 'CRC',
  Cup = 'CUP',
  Cve = 'CVE',
  Cyp = 'CYP',
  Czk = 'CZK',
  Djf = 'DJF',
  Dkk = 'DKK',
  Dop = 'DOP',
  Dzd = 'DZD',
  Eek = 'EEK',
  Egp = 'EGP',
  Ern = 'ERN',
  Etb = 'ETB',
  Eth = 'ETH',
  Eur = 'EUR',
  Fjd = 'FJD',
  Fkp = 'FKP',
  Gbp = 'GBP',
  Gbr = 'GBR',
  Gel = 'GEL',
  Ghs = 'GHS',
  Gip = 'GIP',
  Gmd = 'GMD',
  Gnf = 'GNF',
  Gtq = 'GTQ',
  Gyd = 'GYD',
  Hkd = 'HKD',
  Hnl = 'HNL',
  Hrk = 'HRK',
  Htg = 'HTG',
  Huf = 'HUF',
  Idr = 'IDR',
  Ils = 'ILS',
  Inr = 'INR',
  Iqd = 'IQD',
  Irr = 'IRR',
  Isk = 'ISK',
  Jmd = 'JMD',
  Jod = 'JOD',
  Jpy = 'JPY',
  Kes = 'KES',
  Kgs = 'KGS',
  Khr = 'KHR',
  Kmf = 'KMF',
  Kpw = 'KPW',
  Krw = 'KRW',
  Kwd = 'KWD',
  Kyd = 'KYD',
  Kzt = 'KZT',
  Lak = 'LAK',
  Lbp = 'LBP',
  Lkr = 'LKR',
  Lrd = 'LRD',
  Lsl = 'LSL',
  Ltc = 'LTC',
  Ltl = 'LTL',
  Lvl = 'LVL',
  Lyd = 'LYD',
  Mad = 'MAD',
  Mdl = 'MDL',
  Mga = 'MGA',
  Mkd = 'MKD',
  Mmk = 'MMK',
  Mnt = 'MNT',
  Mop = 'MOP',
  Mro = 'MRO',
  Mur = 'MUR',
  Mvr = 'MVR',
  Mwk = 'MWK',
  Mxn = 'MXN',
  Myr = 'MYR',
  Mzn = 'MZN',
  Nad = 'NAD',
  Ngn = 'NGN',
  Nio = 'NIO',
  Nok = 'NOK',
  Npr = 'NPR',
  Nzd = 'NZD',
  Omr = 'OMR',
  Pab = 'PAB',
  Pen = 'PEN',
  Pgk = 'PGK',
  Php = 'PHP',
  Pkr = 'PKR',
  Pln = 'PLN',
  Pyg = 'PYG',
  Qar = 'QAR',
  Ron = 'RON',
  Rsd = 'RSD',
  Rub = 'RUB',
  Rwf = 'RWF',
  Sar = 'SAR',
  Sbd = 'SBD',
  Scr = 'SCR',
  Sdg = 'SDG',
  Sek = 'SEK',
  Sgd = 'SGD',
  Shp = 'SHP',
  Skk = 'SKK',
  Sll = 'SLL',
  Sos = 'SOS',
  Srd = 'SRD',
  Std = 'STD',
  Svc = 'SVC',
  Syp = 'SYP',
  Szl = 'SZL',
  Thb = 'THB',
  Tjs = 'TJS',
  Tmt = 'TMT',
  Tnd = 'TND',
  Top = 'TOP',
  Try = 'TRY',
  Ttd = 'TTD',
  Twd = 'TWD',
  Tzs = 'TZS',
  Uah = 'UAH',
  Ugx = 'UGX',
  Unknown = 'UNKNOWN',
  Usd = 'USD',
  Uyu = 'UYU',
  Uzs = 'UZS',
  Ved = 'VED',
  Vef = 'VEF',
  Ves = 'VES',
  Vnd = 'VND',
  Vuv = 'VUV',
  Wst = 'WST',
  Xaf = 'XAF',
  Xcd = 'XCD',
  Xof = 'XOF',
  Xpf = 'XPF',
  Yer = 'YER',
  Zar = 'ZAR',
  Zmk = 'ZMK',
  Zmw = 'ZMW',
  Zwd = 'ZWD'
}

/** [/common/DatePeriod](https://schema.intuit.com/#data:/common/DatePeriod) */
export type Common_DatePeriod = {
  beginDate?: Maybe<Scalars['Date']['output']>;
  endDate?: Maybe<Scalars['Date']['output']>;
};

/**
 * [/common/ExternalId](https://schema.intuit.com/#data:/common/ExternalId)
 * 	contains alternate ID keys. Use this field to communicate alternate primary IDs
 * that the entity may have used to expose in API or referencing from external sources.
 */
export type Common_ExternalId = {
  __typename?: 'Common_ExternalId';
  localId?: Maybe<Scalars['String']['output']>;
  namespaceId?: Maybe<Scalars['String']['output']>;
  realmId?: Maybe<Scalars['String']['output']>;
};

export type Common_ExternalIdInput = {
  localId?: InputMaybe<Scalars['String']['input']>;
  namespaceId?: InputMaybe<Scalars['String']['input']>;
  realmId?: InputMaybe<Scalars['String']['input']>;
};

/** [/common/Metadata](https://schema.intuit.com/#data:/common/Metadata) */
export type Common_Metadata = {
  __typename?: 'Common_Metadata';
  created?: Maybe<Scalars['String']['output']>;
  updated?: Maybe<Scalars['String']['output']>;
};

/**
 * Money Amount
 * FIXME: reference IEDM
 * FIXME: derive GraphQL and IEDM from the same source
 */
export type Common_MoneyAmount = {
  __typename?: 'Common_MoneyAmount';
  /** currency code, e.g. USD */
  currency: Common_CurrencyCode;
  /** special decimal, with restriction on number of digits after decimal point */
  value: Scalars['Decimal']['output'];
};

/**
 * [/common/NameValue](https://schema.intuit.com/#data:/common/NameValue)
 * 	Name value
 */
export type Common_NameValue = {
  __typename?: 'Common_NameValue';
  name?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type Common_NameValueInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

/** Common_NameValue meta model */
export type Common_NameValueMetaModel = MetaModel & {
  __typename?: 'Common_NameValueMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  /** Name of the object */
  name: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
  /** Value of the object */
  value: MetaString;
};

/** [/common/Telephone](https://schema.intuit.com/#data:/common/Telephone) */
export type Common_Telephone = {
  __typename?: 'Common_Telephone';
  extension?: Maybe<Scalars['String']['output']>;
  number?: Maybe<Scalars['String']['output']>;
};

export type Common_TelephoneInput = {
  extension?: InputMaybe<Scalars['String']['input']>;
  number?: InputMaybe<Scalars['String']['input']>;
};

export type Company = EntityInterface & Node & {
  __typename?: 'Company';
  /** Represents company's auto payroll enrollment details */
  autoPayrollSetup: CompanyAutoPayrollSetup;
  companyInfo?: Maybe<Company_CompanyInfo>;
  /** Represents company's payroll run */
  companyPayrollRuns: Array<CompanyPayrollRun>;
  contractors?: Maybe<CompanyContractorConnection>;
  departments?: Maybe<DepartmentConnection>;
  employee?: Maybe<Employee>;
  employees?: Maybe<EmployeeConnection>;
  externalIds?: Maybe<Array<Maybe<Common_ExternalId>>>;
  id: Scalars['ID']['output'];
  meta?: Maybe<Common_Metadata>;
  /** Metamodel representing fields with allowed values for Company */
  metaModel: CompanyMetaModel;
  payrollEmployees?: Maybe<PayrollEmployeeConnection>;
  preferences?: Maybe<CompanyPreferences>;
  primaryContact?: Maybe<Common_Contact>;
  /** Represents data specific to the company source, used as a place holder until company capability can provide the information */
  source: Source;
  tasks: Array<Task>;
  /** Tax setup acknowledgements stored in TSS */
  taxSetupAcknowledgements: Array<TaxSetupAcknowledgement>;
  workLocation: CompanyAddress;
  /** Company work locations */
  workLocations: Array<CompanyAddress>;
};


export type CompanyCompanyPayrollRunsArgs = {
  filterBy?: InputMaybe<CompanyPayrollRunFilter>;
};


export type CompanyContractorsArgs = {
  filterBy?: InputMaybe<CompanyContractorConnectionFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


export type CompanyDepartmentsArgs = {
  filterBy?: InputMaybe<DepartmentConnectionFilter>;
  pagination?: InputMaybe<PaginationInput>;
  sortBy?: InputMaybe<DepartmentConnectionOrderBy>;
};


export type CompanyEmployeeArgs = {
  id: Scalars['ID']['input'];
};


export type CompanyEmployeesArgs = {
  filterBy?: InputMaybe<EmployeeConnectionFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  pagination?: InputMaybe<PaginationInput>;
  sortBy?: InputMaybe<EmployeeConnectionOrderBy>;
};


export type CompanyPayrollEmployeesArgs = {
  filterBy?: InputMaybe<EmployeeConnectionFilter>;
  pagination?: InputMaybe<PaginationInput>;
  sortBy?: InputMaybe<EmployeeConnectionOrderBy>;
};


export type CompanyTasksArgs = {
  filterBy?: InputMaybe<TaskFilter>;
  orderBy?: InputMaybe<TaskOrderBy>;
};


export type CompanyTaxSetupAcknowledgementsArgs = {
  flowType?: InputMaybe<TaxSetupAcknowledgementFlowType>;
  type?: InputMaybe<TaxSetupAcknowledgementType>;
};


export type CompanyWorkLocationArgs = {
  id: Scalars['ID']['input'];
};

/** Define type for CompanyAddress */
export type CompanyAddress = Node & {
  __typename?: 'CompanyAddress';
  /** Boolean to indicate whether a work location is active */
  active: Scalars['Boolean']['output'];
  /**
   * Array of key value pair composed of different address fields
   * such as addressLine, state, zip, county, city
   */
  addressComponents: Array<VariableStringField>;
  /** details of employees on a particular company address */
  employees: CompanyAddressEmployeeConnection;
  /**
   * Boolean to indicate whether a worklocation has paychecks associated with it
   * @deprecated The usage of hasPaySlips is now eliminated for Work Location Decomp
   */
  hasPayslips: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  /** Meta model for company address */
  metaModel: CompanyAddressMetaModel;
  /** Political subdivision code for a work location required to identify the tax collector for Pennsylvania */
  politicalSubdivisionCode?: Maybe<VariableStringField>;
  /** Boolean to indicate whether a work location is primary */
  primary: Scalars['Boolean']['output'];
  /** Work location reporting unit number which may be required for MN, MA and IA */
  unitNumber?: Maybe<Scalars['String']['output']>;
};


/** Define type for CompanyAddress */
export type CompanyAddressEmployeesArgs = {
  filterBy?: InputMaybe<CompanyAddressEmployeeConnectionFilter>;
};

/** A connection to a list of employees. */
export type CompanyAddressEmployeeConnection = {
  __typename?: 'CompanyAddressEmployeeConnection';
  edges: Array<EmployeeEdge>;
  totalCount: Scalars['Int']['output'];
};

/** Input type for filtering EmployeeConnection */
export type CompanyAddressEmployeeConnectionFilter = {
  employmentStatus?: InputMaybe<EmploymentStatusFilter>;
};

/** meta model for company address */
export type CompanyAddressMetaModel = MetaModel & {
  __typename?: 'CompanyAddressMetaModel';
  /** Array of valid fields for address properties */
  addressComponents: Array<MetaVariableStringField>;
  applicable: Scalars['Boolean']['output'];
  deletable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  /** List of applicable Political Subdivision Codes for the given address */
  politicalSubdivisionCodes: MetaEnum;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};


/** meta model for company address */
export type CompanyAddressMetaModelPoliticalSubdivisionCodesArgs = {
  input: PoliticalSubdivisionCodesInput;
};

/** Represents company's auto payroll enrollment details */
export type CompanyAutoPayrollSetup = {
  __typename?: 'CompanyAutoPayrollSetup';
  /** Determines if company is currently enrolled for AutoPayroll */
  enrolled: Scalars['Boolean']['output'];
  /** Info/Warning/Blocker messages encountered for AutoPayroll eg. dd lead time change */
  messages: Array<AutoPayrollSetupMessage>;
  /** Determines if company has ever been enrolled for AutoPayroll */
  previouslyEnrolled: Scalars['Boolean']['output'];
};

/** A connection to a list of items. */
export type CompanyContractorConnection = {
  __typename?: 'CompanyContractorConnection';
  edges?: Maybe<Array<Maybe<CompanyContractorEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** Input to filter contractors */
export type CompanyContractorConnectionFilter = {
  /**
   * Filter by the status of the contractor - true indicates an active
   * contractor, false indicates an inactive contractor.
   */
  active?: InputMaybe<BooleanFilter>;
  id?: InputMaybe<IdFilter>;
};

/** An edge in a connection. */
export type CompanyContractorEdge = {
  __typename?: 'CompanyContractorEdge';
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge */
  node?: Maybe<Contractor>;
};

/** Meta model for Company Info */
export type CompanyInfoMetaModel = MetaModel & {
  __typename?: 'CompanyInfoMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** The type of the company. This impacts the tax forms that the company files. (e.g. Sole Proprietor, Corporation) */
  companyType: MetaEnum;
  label: Scalars['String']['output'];
  partnerSubscription: PartnerSubscriptionMetaModel;
  /** The primary officer of a company, usually the highest ranking officer at that company */
  principalOfficer: PrincipalOfficerMetaModel;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};


/** Meta model for Company Info */
export type CompanyInfoMetaModelPartnerSubscriptionArgs = {
  filterBy?: InputMaybe<PartnerSubscriptionsFilter>;
};

/** Meta model for Company */
export type CompanyMetaModel = MetaModel & {
  __typename?: 'CompanyMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** Metamodel for creating department */
  department: DepartmentMetaModel;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** Metamodel for creating a task */
  task: TaskMetaModel;
  typeRef: Scalars['String']['output'];
  /** Worklocation metamodel for zero state worklocations */
  workLocation: CompanyAddressMetaModel;
};

export type CompanyMigrationStatus = {
  __typename?: 'CompanyMigrationStatus';
  /** Migration verified after migration */
  migrationVerified: Scalars['Boolean']['output'];
  /** Company migration status */
  status: MigrationStatus;
};

/** Represents company's payroll run */
export type CompanyPayrollRun = {
  __typename?: 'CompanyPayrollRun';
  employeePayrollRuns: Array<EmployeePayrollRun>;
  /** Ledger account used to fund this payroll run */
  fundingLedgerAccount?: Maybe<LedgerAccount>;
  id: Scalars['ID']['output'];
  /** Info/Warning/Blocker messages encountered while running this payroll */
  messages: Array<PayrollRunMessage>;
  metaModel?: Maybe<CompanyPayrollRunMetaModel>;
  /** Mode of payroll run e.g. manual/automated */
  mode: PayrollRunMode;
  /** PaySchedule for this payroll run; can be null for non-regular flow types */
  paySchedule?: Maybe<EmployerPaySchedule>;
  /** Company's cost distribution for this payroll run */
  payrollCostDistributions: Array<PayrollCostDistribution>;
  /** Includes relevant dates like pay period dates and paydate for this payroll run */
  payrollRunDateSummary: PayrollRunDateSummary;
  /**
   * Options to configure payslip calculation of this payroll run
   * For e.g. `includeDeductions` used to configure Bonus payroll run to include deductions
   * as part of payslip
   */
  payrollRunOptions: Array<VariableTypeField>;
  /** Payroll run type e.g. regular, bonus, fringe etc. */
  payrollRunType: PayrollRunType;
  /** Source Id that can be used to track payroll run from client side */
  sourceId?: Maybe<Scalars['String']['output']>;
  /** Current state of payroll run e.g. preview/submitted */
  status: PayrollRunStatus;
};

export type CompanyPayrollRunFilter = {
  id?: InputMaybe<IdFilter>;
  mode?: InputMaybe<PayrollRunMode>;
  payDate?: InputMaybe<DateFilter>;
  payPeriod?: InputMaybe<DateFilter>;
  payScheduleId?: InputMaybe<IdFilter>;
  payrollRunType?: InputMaybe<PayrollRunType>;
  preset?: InputMaybe<CompanyPayrollRunFilterPreset>;
  status?: InputMaybe<PayrollRunStatus>;
};

/** Predefined filters for company payroll runs */
export enum CompanyPayrollRunFilterPreset {
  /** Returns only the latest company payroll run */
  LatestCompanyPayrollRun = 'LATEST_COMPANY_PAYROLL_RUN'
}

/** Metamodel to represent company payroll run */
export type CompanyPayrollRunMetaModel = MetaModel & {
  __typename?: 'CompanyPayrollRunMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  payrollRunOptions: Array<MetaVariableTypeField>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type CompanyPreferences = {
  __typename?: 'CompanyPreferences';
  accountingPreferences?: Maybe<AccountingPreferences>;
  employerPreferences?: Maybe<EmployerPreferences>;
};

/** Connection for a list of companies returned as a result of the search. Also contains page information */
export type CompanySearchConnection = {
  __typename?: 'CompanySearchConnection';
  edges?: Maybe<Array<Company>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type CompanySearchCriteria = {
  searchField: CompanySearchField;
  searchText: Scalars['String']['input'];
};

/** List of fields that can be used to run a search for the company. */
export enum CompanySearchField {
  /** Search for companies having an accountant with this realmId */
  AccountantRealmId = 'ACCOUNTANT_REALM_ID',
  BusinessName = 'BUSINESS_NAME',
  CompanyEmail = 'COMPANY_EMAIL',
  CompanyId = 'COMPANY_ID',
  ContactEmail = 'CONTACT_EMAIL',
  ContactName = 'CONTACT_NAME',
  ContactPhone = 'CONTACT_PHONE',
  Ein = 'EIN',
  LegalName = 'LEGAL_NAME',
  RealmId = 'REALM_ID'
}

export type CompanySearchInput = {
  orderBy?: InputMaybe<CompanySearchOrderBy>;
  pagination?: InputMaybe<PaginationInput>;
  searchCriteria: CompanySearchCriteria;
};

/** Specifies the sort order for the companies to be used for sorting */
export enum CompanySearchOrderBy {
  BusinessNameAsc = 'businessName_ASC',
  BusinessNameDesc = 'businessName_DESC'
}

/** A tax form included in a filing that is related to the company */
export type CompanyTaxFormDocument = TaxFormDocument & {
  __typename?: 'CompanyTaxFormDocument';
  /** Attributes specific to the document will be returned as name value pairs */
  attributes: Array<VariableTypeField>;
  /** Company the filing is associated with */
  company?: Maybe<Company>;
  /** File rendering for the associated taxForm, it includes the generated file url */
  rendering: FileRendering;
  /** The associated tax form for the document/rendering */
  taxForm: TaxForm;
};

/** Termination preferences data returned from the service */
export type CompanyTerminationTaxPreferences = {
  __typename?: 'CompanyTerminationTaxPreferences';
  /** Indicates whether annual tax forms should be generated as part of the termination process */
  isAnnualFilingsNeeded?: Maybe<Scalars['Boolean']['output']>;
  /** Indicates whether the business is permanently closing vs. staying open but switching payroll providers */
  isBusinessClosing?: Maybe<Scalars['Boolean']['output']>;
  /** Last quarter to file as number (1, 2, 3, 4) */
  lastQuarterToPayAndFile?: Maybe<Scalars['Int']['output']>;
  /** Last year to file as number (e.g., 2020) */
  lastYearToPayAndFile?: Maybe<Scalars['Int']['output']>;
};

/** Error object for company subscription operations */
export type CompanyTerminationTaxPreferencesError = {
  __typename?: 'CompanyTerminationTaxPreferencesError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type CompanyTerminationTaxPreferencesInput = {
  /** Indicates whether annual tax forms should be generated as part of the termination process */
  isAnnualFilingsNeeded?: InputMaybe<Scalars['Boolean']['input']>;
  /** Indicates whether the business is permanently closing vs. staying open but switching payroll providers */
  isBusinessClosing?: InputMaybe<Scalars['Boolean']['input']>;
  /** Last quarter to file as number (1, 2, 3, 4) */
  lastQuarterToPayAndFile?: InputMaybe<Scalars['Int']['input']>;
  /** Last year to file as number (e.g., 2020) */
  lastYearToPayAndFile?: InputMaybe<Scalars['Int']['input']>;
};

/** Response payload for company subscription operations */
export type CompanyTerminationTaxPreferencesResponse = {
  __typename?: 'CompanyTerminationTaxPreferencesResponse';
  /** Response data from the service */
  data?: Maybe<CompanyTerminationTaxPreferences>;
  /** Error details if the operation failed */
  error?: Maybe<CompanyTerminationTaxPreferencesError>;
};

export type Company_CompanyInfo = EntityInterface & Node & {
  __typename?: 'Company_CompanyInfo';
  businessName?: Maybe<Scalars['String']['output']>;
  companyAddress?: Maybe<Common_Address>;
  /** The type of the company. This impacts the tax forms that the company files. (e.g. Sole Proprietor, Corporation) */
  companyType?: Maybe<Scalars['String']['output']>;
  /**
   * Support information for the company at this moment. The object returned is a read-only copy based on time and company state.
   * The values returned depend on the server time which clients must be aware of before caching.
   */
  currentSupportInfo?: Maybe<Company_SupportInfo>;
  employerInfo?: Maybe<Company_EmployerInfo>;
  externalIds?: Maybe<Array<Maybe<Common_ExternalId>>>;
  id: Scalars['ID']['output'];
  legalAddress?: Maybe<Common_Address>;
  legalName?: Maybe<Scalars['String']['output']>;
  meta?: Maybe<Common_Metadata>;
  /** Metamodel representing fields with multiple allowed values for CompanyInfo */
  metaModel: CompanyInfoMetaModel;
  partnerSubscriptions: Array<PartnerSubscription>;
  principalOfficer?: Maybe<PrincipalOfficer>;
};


export type Company_CompanyInfoPartnerSubscriptionsArgs = {
  filterBy?: InputMaybe<PartnerSubscriptionsFilter>;
};

/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfo = {
  __typename?: 'Company_EmployerInfo';
  /** start date of the active tax year for which the company wants to run payroll */
  activeTaxYearStartDate?: Maybe<Scalars['Date']['output']>;
  assignedPreparer?: Maybe<AssignedPreparer>;
  assignedRepresentative?: Maybe<AssignedRepresentative>;
  /** Employer's money movement bank account information */
  bankInfo?: Maybe<BankInfo>;
  /** Company benefit filings */
  benefitFilings?: Maybe<BenefitFilingConnection>;
  /** The benefit policy details associated with this company */
  benefits?: Maybe<Array<BenefitPolicy>>;
  /**
   * The data consents associated with this company for sharing payroll data.  If empty list return, there is no consent found for this company.
   * If null is returned, it is an indication of error during consent retrieval.
   */
  consents?: Maybe<Array<EmployerDataConsent>>;
  /**
   * Company's setup to enable contractor payments.
   * Null if this setup does not apply to this company.
   */
  contractorPaymentsSetup?: Maybe<Payroll_Employer_ContractorPaymentsSetup>;
  /** The miscellaneous deduction policy details associated with this company */
  deductions?: Maybe<Array<MiscDeductionPolicy>>;
  /** The default pay schedule new employees are created with */
  defaultPaySchedule?: Maybe<Payroll_Employer_PaySchedule>;
  /**
   * The default time off policy set for the company.
   * When an employee selects a time off policy and select to make it default to all employees, the selected time off policy becomes default.
   * Currently only applicable in Canada
   */
  defaultTimeOffPolicy?: Maybe<EmployerTimeOffPolicy>;
  /** The compensations associated with this company */
  employerCompensations?: Maybe<Array<EmployerCompensation>>;
  employerPaySchedules?: Maybe<Array<EmployerPaySchedule>>;
  /** List of workers compensation classes for an employer. */
  employerWorkersCompensationClasses?: Maybe<Array<WorkersCompensationClass>>;
  /** This company's (current) first-time setup. Null indicates that the company has not begun its process of setting up for the first time. */
  firstTimePayrollSetup?: Maybe<Payroll_Employer_FirstTimePayrollSetup>;
  /**
   * The flavorType describes the type of company that the customer is subscribed
   * (e.g., QBOP_ENHANCED, QBFSP, IOP4A, IOP_PLUS). It wraps certain attributes from Company
   * (such as Partner, FeatureSet, CompanyType, ServiceType and BillingType) to
   * simplify in a single field making it more readable and easier to operate with
   * different offers. The values here are dynamic type
   */
  flavorType?: Maybe<Scalars['String']['output']>;
  formTemplates: Array<FormTemplate>;
  /** The hold types for the company indicating if payments are currently on hold */
  holdTypes?: Maybe<Array<HoldType>>;
  /** Company liability adjustments in ascending order of liability period, filterable by tax item key and liability period. */
  liabilityAdjustments: Array<PayrollLiabilityAdjustment>;
  /** Company level Info/Warning/Blocker messages */
  messages: Array<Message>;
  metaModel: EmployerInfoMetaModel;
  /** This will return the company migration status */
  migrationStatus?: Maybe<CompanyMigrationStatus>;
  /** Information about upcoming payroll runs for all pay schedules' next pay period. */
  nextPayrollRunInfos: Array<Payroll_Employer_PaySchedulePeriod_PayrollRunInfo>;
  /** Company's direct deposit funding Details. Also called Direct deposit lead time or prefunddays. */
  payDistributionDetails?: Maybe<EmployerPayDistributionDetails>;
  payHistory?: Maybe<EmployerPayHistory>;
  /** Provides a preview of what the pay periods will be for the specified pay schedule configuration. */
  paySchedulePayPeriodsPreview: PaySchedulePayPeriodsPreviewResult;
  /** @deprecated Use `employerPaySchedules` field instead */
  paySchedules?: Maybe<Array<Maybe<Payroll_Employer_PaySchedule>>>;
  /** Get the contractor payments from IOP for payroll first companies. Will not work for QB*P companies. */
  payrollContractorPayments: Array<ContractorPayment>;
  /**
   * The status of this company's payroll Tax Penalty Protection. This is automatically updated when
   * payrollExpertReviewStatus is changed. Will be FEATURE_NOT_APPLICABLE if not elibile for expert review.
   * If OFF, the company has not yet passed expert review. If ON_HOLD, it will automatically change to ON
   * once the company re-enables Automatic Taxes & Forms.
   */
  payrollTaxPenaltyProtectionStatus?: Maybe<PayrollTaxPenaltyProtectionStatus>;
  /** Fetch a payslip for a company by its ID */
  payslip?: Maybe<Payslip>;
  payslips?: Maybe<EmployerPayslipConnection>;
  /** Attributes for a pension enrollment during company setup */
  pensionEnrollment?: Maybe<PensionEnrollment>;
  /** The pension providers setup associated with this company */
  pensionProvidersSetup?: Maybe<Array<ProviderAgencySetup>>;
  /** The pensions policy details associated with this company */
  pensions?: Maybe<Array<PensionPolicy>>;
  /** Company Cutover Date to PTP for payments */
  ptpCutoverDate?: Maybe<Scalars['Date']['output']>;
  readiness?: Maybe<EmployerReadiness>;
  /** Employer tax debit information */
  recordedEmployerDebits?: Maybe<RecordedEmployerDebitConnection>;
  /**
   * Tax Payments, Refunds, Overpayments Applied to Next Quarter and Overpayments Applied to Prior Quarter types of tax
   * transactions which are recorded in the system. This does not include Payment Dues because those are not yet recorded.
   */
  recordedTaxTransactions?: Maybe<RecordedTaxTransactionConnection>;
  /** entry point to Payroll related reports */
  reports?: Maybe<PayrollReports>;
  signUpDate?: Maybe<Scalars['Date']['output']>;
  taxFiling?: Maybe<TaxFiling>;
  /** Company filings */
  taxFilings?: Maybe<TaxFilingConnection>;
  /** Fetch a tax payment for a company by its ID. */
  taxPayment?: Maybe<Payroll_Payments_TaxPayment>;
  /**
   * Company tax payments, filterable by less than and greater than. If no filters are passed, it returns a default date range of 30 days forward and 30 days back.
   * See schema: https://schema.intuit.com/#data:/company/EmployerInfo
   */
  taxPayments?: Maybe<Payroll_Payments_TaxPaymentConnection>;
  /** Employer tax registration information which contains the tax registration orders for the employer */
  taxRegistration: TaxRegistration;
  /** Employer tax information */
  taxSetups: Array<EmployerTaxSetup>;
  /** Tax transactions involving Employer Debits, Agency Credits and Dispute */
  taxTransactions?: Maybe<PaymentsTaxTransactionConnection>;
  /** Tax transactions involving Tax Withdrawals and Refunds */
  taxWithdrawals?: Maybe<PayrollPaymentsTaxWithdrawalsConnection>;
  /** Company termination tax preferences */
  terminationTaxPreferences?: Maybe<CompanyTerminationTaxPreferences>;
  /** The list of all time off custom categories available to the company */
  timeOffCategories?: Maybe<Array<TimeOffCategoryDetail>>;
  /**
   * The list of time off policies that belong to the company.
   * The policies dictate the frequency, rate at which sick, vacation, etc. hours accrue
   */
  timeOffPolicies?: Maybe<Array<EmployerTimeOffPolicy>>;
  /**
   * Class tracking information associated with the Employer.
   * Empty array if no class list available for this employer.
   */
  trackingClassList: Array<TrackingClass>;
  usageDate?: Maybe<Scalars['Date']['output']>;
  /** Validates whether an EIN based on the validation types */
  validateEin?: Maybe<ValidateEinResult>;
  /** Workers compensation set up information. */
  workersCompensationClasses: Array<EmployerWorkersCompensationClass>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoBenefitFilingsArgs = {
  filterBy?: InputMaybe<BenefitFilingConnectionFilter>;
  pagination?: InputMaybe<PaginationInput>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoBenefitsArgs = {
  filterBy?: InputMaybe<DeductionPolicyFilter>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoDeductionsArgs = {
  filterBy?: InputMaybe<DeductionPolicyFilter>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoEmployerCompensationsArgs = {
  filterBy?: InputMaybe<EmployerCompensationsFilter>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoEmployerPaySchedulesArgs = {
  filterBy?: InputMaybe<PayScheduleFilter>;
  input?: InputMaybe<EmployerPaySchedulesQueryInput>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoEmployerWorkersCompensationClassesArgs = {
  filterBy?: InputMaybe<EmployerWorkersCompensationClassFilter>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoFormTemplatesArgs = {
  filterBy: FormTemplateDocumentConnectionFilter;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoLiabilityAdjustmentsArgs = {
  filterBy?: InputMaybe<PayrollLiabilityAdjustmentFilter>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoMessagesArgs = {
  filterBy?: InputMaybe<CategorizedMessageFilter>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoNextPayrollRunInfosArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<PayrollRunInfoOrderBy>>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoPaySchedulePayPeriodsPreviewArgs = {
  input: PaySchedulePayPeriodsPreviewInput;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoPayrollContractorPaymentsArgs = {
  input?: InputMaybe<ContractorPaymentsReportInput>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoPayslipArgs = {
  id: Scalars['ID']['input'];
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoPayslipsArgs = {
  filterBy?: InputMaybe<PayslipsFilter>;
  orderBy?: InputMaybe<Array<EmployerPayslipsOrderBy>>;
  pagination?: InputMaybe<PaginationInput>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoPensionsArgs = {
  filterBy?: InputMaybe<DeductionPolicyFilter>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoRecordedEmployerDebitsArgs = {
  input: RecordedEmployerDebitInput;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoRecordedTaxTransactionsArgs = {
  input: RecordedTaxTransactionInput;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoTaxFilingArgs = {
  id: Scalars['ID']['input'];
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoTaxFilingsArgs = {
  filterBy?: InputMaybe<TaxFilingConnectionFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoTaxPaymentArgs = {
  filterBy?: InputMaybe<PayrollPaymentsTaxPaymentIDsFilter>;
  id?: InputMaybe<Scalars['ID']['input']>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoTaxPaymentsArgs = {
  filterBy?: InputMaybe<Payroll_Payments_TaxPaymentFilter>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoTaxSetupsArgs = {
  filterBy?: InputMaybe<EmployerInfoTaxSetupsFilter>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoTaxTransactionsArgs = {
  filterBy: PaymentsTaxTransactionFilter;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoTaxWithdrawalsArgs = {
  filterBy?: InputMaybe<PayrollPaymentsTaxWithdrawalFilter>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoTimeOffPoliciesArgs = {
  filterBy?: InputMaybe<EmployerTimeOffPolicyFilter>;
};


/** [/company/EmployerInfo](https://schema.intuit.com/#data:/company/EmployerInfo) */
export type Company_EmployerInfoValidateEinArgs = {
  input: ValidateEinInput;
};

export type Company_Employer_PaySchedulePayload = {
  __typename?: 'Company_Employer_PaySchedulePayload';
  paySchedule?: Maybe<Payroll_Employer_PaySchedule>;
};

export type Company_Employer_PaySchedule_InitialSetupDatesInput = {
  payDate: Scalars['Date']['input'];
  payPeriodEndDate: Scalars['Date']['input'];
};

/** Support information for the company based on the company state (skus, data, etc.) */
export type Company_SupportInfo = {
  __typename?: 'Company_SupportInfo';
  /**
   * Information about different chat skills.
   * Skills in this list will indicate valid chats that could be enabled for this company.
   */
  chatSkills?: Maybe<Array<Maybe<Company_SupportInfo_ChatSkill>>>;
};

/** Chat support information for a particular skill. */
export type Company_SupportInfo_ChatSkill = {
  __typename?: 'Company_SupportInfo_ChatSkill';
  /**
   * This is an informative text to understand what are the business hours of the experts having the skill defined
   * previously
   */
  businessHours?: Maybe<Scalars['String']['output']>;
  /** Whether it is currently within business hours for chat */
  isNowBusinessHours?: Maybe<Scalars['Boolean']['output']>;
  /**
   * The skill describes a unique type or group of skills that the agents will need to help this company
   * (e.g., QBFSP_SETUP, QBOPSETUP, Skill1099).
   * This also identifies a valid chat for the company
   */
  skill?: Maybe<Scalars['String']['output']>;
};

export type CompensationEmployeeConnection = {
  __typename?: 'CompensationEmployeeConnection';
  edges?: Maybe<Array<Maybe<EmployeeEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type CompensationMutationError = {
  __typename?: 'CompensationMutationError';
  code?: Maybe<Scalars['String']['output']>;
  employeeCompensationId?: Maybe<Scalars['String']['output']>;
  employeeId?: Maybe<Scalars['String']['output']>;
  employerCompensationId?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** List of accounting related datatypes that can be used to allocate calculated compensations against. */
export enum CompensationSplitType {
  Class = 'CLASS',
  Dimension = 'DIMENSION',
  Project = 'PROJECT'
}

/** CompanyId for which tax items mapping is marked as completed */
export type CompleteMappingImportedTaxItemInput = {
  /** Company ID that is being updated */
  companyId: Scalars['ID']['input'];
};

export type CompleteMappingImportedTaxItemPayload = {
  __typename?: 'CompleteMappingImportedTaxItemPayload';
  userError?: Maybe<ImportedPayHistoryError>;
};

/** Input for completing the employee self setup */
export type CompletePayrollEmployeeSelfSetupInput = {
  /** The unique identifier of the company (realmId) */
  companyId: Scalars['ID']['input'];
  /** The unique identifier of the employee */
  employeeId: Scalars['ID']['input'];
};

/** Payload returned after completing the employee self setup */
export type CompletePayrollEmployeeSelfSetupPayload = {
  __typename?: 'CompletePayrollEmployeeSelfSetupPayload';
  /** The updated employee self setup status */
  payrollSelfSetup?: Maybe<PayrollEmployeeSelfSetup>;
  /** Error details if the mutation failed */
  userError?: Maybe<EmployeeSelfSetupUserError>;
};

/**
 * Describes employee/employer's contribution to a particular deduction along with
 * the date when the contributions are effective. There is also an optional field
 * to specify a composite type that the contribution is applicable to.
 */
export type CompositeContributiveDeduction = {
  /** The composite type this contribution is applicable to */
  compositeContributionType?: Maybe<Scalars['String']['output']>;
  /** Date on which these contribution rates will become active/ be active from */
  effectiveDate: Scalars['Date']['output'];
  /** Employee's contribution to this deduction */
  employeeContribution?: Maybe<EmployeeContribution>;
  /** Company's contribution to this deduction */
  employerContribution?: Maybe<EmployerContribution>;
};


/**
 * Describes employee/employer's contribution to a particular deduction along with
 * the date when the contributions are effective. There is also an optional field
 * to specify a composite type that the contribution is applicable to.
 */
export type CompositeContributiveDeductionCompositeContributionTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export enum ContractPayType {
  CommissionOnly = 'COMMISSION_ONLY',
  Hourly = 'HOURLY',
  Salary = 'SALARY'
}

/** Contractor Details */
export type Contractor = Node & Worker & {
  __typename?: 'Contractor';
  /**
   * The status of the contractor - true indicates an active
   * contractor, false indicates an inactive contractor.
   */
  active: Scalars['Boolean']['output'];
  company: Company;
  displayName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** @deprecated Use individual fields in the Contractor entity */
  nameDetail?: Maybe<ContractorNameDetail>;
  /**
   * Tax Identifier will be EIN for Business Contractor, SSN for US
   * Individual Contractor, and SIN for Canada Individual Contractor.
   */
  taxIdentifier?: Maybe<TaxIdentifier>;
};

export type ContractorNameDetail = BusinessContractorNameDetail | IndividualContractorNameDetail;

/** Contractor payments made by a company */
export type ContractorPayment = Node & {
  __typename?: 'ContractorPayment';
  /**
   * This is a chart of account of type Bank created in QuickBooks. It represents
   * the source bank account in QuickBooks from which the payment is made.
   */
  accountingBankAccount?: Maybe<LedgerAccount>;
  /** Contractor information associated with this contractor payment. */
  contractorDetail: Contractor;
  /** Specifies if this ContractorPayment has been exported to any external system. The return value will be null if data is not present. */
  exportedToExternal?: Maybe<Scalars['Boolean']['output']>;
  externalIds: Array<Common_ExternalId>;
  id: Scalars['ID']['output'];
  /** Details for the line items in a contractor payment */
  lineItems: Array<ContractorPaymentLineItem>;
  memo?: Maybe<Scalars['String']['output']>;
  payDate: Scalars['Date']['output'];
  /**
   * The details for the different payment method types, check or direct deposit.
   * It will be null when payment method is unknown.
   */
  paymentMethodDetail?: Maybe<ContractorPaymentMethodDetail>;
  /** It denotes the type of the payment. */
  paymentType: ContractorPaymentType;
  /** The total amount of the line items. */
  totalAmount: Scalars['Money']['output'];
};

/** Contractor payment method details for check */
export type ContractorPaymentCheckDetail = ContractorPaymentMethodDetail & {
  __typename?: 'ContractorPaymentCheckDetail';
  checkNumber?: Maybe<Scalars['String']['output']>;
  paymentMethod: ContractorPaymentMethod;
};

/** Contractor payment method details for direct deposit */
export type ContractorPaymentDirectDepositDetail = ContractorPaymentMethodDetail & {
  __typename?: 'ContractorPaymentDirectDepositDetail';
  paymentMethod: ContractorPaymentMethod;
  paymentStatus: ContractorPaymentStatus;
};

/** An edge in a connection. */
export type ContractorPaymentEdge = {
  __typename?: 'ContractorPaymentEdge';
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge */
  node: ContractorPaymentsReportNode;
};

export type ContractorPaymentExportToAccountingError = ExportTransactionsToAccountingError & {
  __typename?: 'ContractorPaymentExportToAccountingError';
  code: Scalars['String']['output'];
  /** The contractor payment which failed with this error */
  contractorPayment: ContractorPayment;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type ContractorPaymentLineItem = {
  __typename?: 'ContractorPaymentLineItem';
  amount: Scalars['Money']['output'];
  description?: Maybe<Scalars['String']['output']>;
  /**
   * Category is a ledger account of type expense and is only present for expense, it will be null for
   * type bill payment. This is the category that the contractor payment is being made under. The two
   * standard categories are contractor payments and reimbursement, but QBOP users will have access to
   * multiple categories.
   */
  expenseCategory?: Maybe<LedgerAccount>;
  id: Scalars['ID']['output'];
};

/** The two supported payment methods for contractor payments */
export enum ContractorPaymentMethod {
  Check = 'CHECK',
  DirectDeposit = 'DIRECT_DEPOSIT'
}

/** Details on the payment method for the contractor payment */
export type ContractorPaymentMethodDetail = {
  /**
   * The payment method eg. Check, DirectDeposit.
   * There can only be either check or direct deposit.
   */
  paymentMethod: ContractorPaymentMethod;
};

/** The payment status options for contractor payments */
export enum ContractorPaymentStatus {
  Cancelled = 'CANCELLED',
  Created = 'CREATED',
  CreditReturned = 'CREDIT_RETURNED',
  DebitAndCreditReturned = 'DEBIT_AND_CREDIT_RETURNED',
  DebitExecuted = 'DEBIT_EXECUTED',
  DebitReturned = 'DEBIT_RETURNED',
  LimitExceededError = 'LIMIT_EXCEEDED_ERROR',
  /** The value is OTHER when the status of the payment is unknown */
  Other = 'OTHER',
  Processed = 'PROCESSED',
  ProcessingError = 'PROCESSING_ERROR',
  Reversed = 'REVERSED'
}

/** The supported payment types for contractor payments */
export enum ContractorPaymentType {
  Bill = 'BILL',
  BillPayment = 'BILL_PAYMENT',
  Check = 'CHECK',
  /** EXPENSE is the default value for contractor payment type */
  Expense = 'EXPENSE',
  VendorCredit = 'VENDOR_CREDIT'
}

/** A connection to a list of contractor payments */
export type ContractorPaymentsConnection = {
  __typename?: 'ContractorPaymentsConnection';
  edges?: Maybe<Array<Maybe<ContractorPaymentEdge>>>;
  pageInfo: PageInfo;
  /** The total of the payments */
  totalAmount: Scalars['Money']['output'];
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type ContractorPaymentsReport = {
  __typename?: 'ContractorPaymentsReport';
  /**
   * List of contractor payments containing drilled down information about the payments.
   * Optional input contains limit and offset that may be used for pagination.
   */
  contractorPayments?: Maybe<ContractorPaymentsConnection>;
  renderings?: Maybe<ContractorPaymentsReportRenderings>;
  /**
   * The total of the payments
   * @deprecated Use contractorPayments.totalAmount instead
   */
  totalContractorPayment: Scalars['Money']['output'];
};


export type ContractorPaymentsReportContractorPaymentsArgs = {
  pagination?: InputMaybe<PaginationInput>;
};

/**
 * Filter contractor payments by paydates that fall within a
 * date range.
 */
export type ContractorPaymentsReportDateFilter = {
  dateRange?: InputMaybe<DateFilter>;
};

export type ContractorPaymentsReportExcelRenderInput = {
  /**
   * Specifies optional data to exclude while generating the excel report.
   * If not specified, all the data will be included by default
   */
  excludedData?: InputMaybe<Array<ContractorPaymentsReportRenderingOptionalData>>;
};

/**
 * Filter by pay date range, contractor id, and the status of
 * the contractor.
 */
export type ContractorPaymentsReportFilter = {
  contractorFilter?: InputMaybe<PayrollReportContractorFilter>;
  /** Contractor payment exported filter used for payroll first companies. */
  exportedToExternalFilter?: InputMaybe<BooleanFilter>;
  /** Filter to get contractor payments that fall in the given date range. */
  payDateFilter: ContractorPaymentsReportDateFilter;
};

export type ContractorPaymentsReportInput = {
  filterBy: ContractorPaymentsReportFilter;
};

/**
 * Node containing contractor details and payment details for each
 * contractor payment.
 */
export type ContractorPaymentsReportNode = {
  __typename?: 'ContractorPaymentsReportNode';
  contractorDetail: Contractor;
  /**
   * The details for the total transaction, then the breakdown of the
   * individual line items for the transaction.
   */
  paymentDetail: ContractorPayment;
};

export type ContractorPaymentsReportPdfRenderInput = {
  /**
   * Specifies optional data to exclude while generating the pdf report.
   * If not specified, all the data will be included by default
   */
  excludedData?: InputMaybe<Array<ContractorPaymentsReportRenderingOptionalData>>;
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum ContractorPaymentsReportRenderingOptionalData {
  BankAccount = 'BANK_ACCOUNT',
  CheckNumber = 'CHECK_NUMBER',
  Memo = 'MEMO',
  PaymentAccount = 'PAYMENT_ACCOUNT',
  PaymentAmount = 'PAYMENT_AMOUNT',
  PaymentStatus = 'PAYMENT_STATUS',
  PaymentType = 'PAYMENT_TYPE',
  PayMethod = 'PAY_METHOD'
}

/** Contractor Payment report data rendering detail */
export type ContractorPaymentsReportRenderings = {
  __typename?: 'ContractorPaymentsReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/** Contractor Payment report data rendering detail */
export type ContractorPaymentsReportRenderingsExcelArgs = {
  input?: InputMaybe<ContractorPaymentsReportExcelRenderInput>;
};


/** Contractor Payment report data rendering detail */
export type ContractorPaymentsReportRenderingsPdfArgs = {
  input?: InputMaybe<ContractorPaymentsReportPdfRenderInput>;
};

/** The frequency for contributions */
export enum ContributionFrequency {
  PerHour = 'PER_HOUR',
  PerPayslip = 'PER_PAYSLIP'
}

/** Describes employee/employer's contribution to a particular deduction */
export type ContributiveDeduction = {
  /** Employee's contribution to a particular deduction */
  employeeContribution?: Maybe<EmployeeContribution>;
  /** Company's contribution to a particular deduction */
  employerContribution?: Maybe<EmployerContribution>;
};

/** This input type provides the options for specifying contribution details, which consists of an employee contribution and/or employer contribution. At least one of these two input fields must exist, but both are not required. */
export type ContributiveDeductionInput = {
  employeeContributionInput?: InputMaybe<CreateEmployeeContributionInput>;
  employeeExternalContributionInput?: InputMaybe<CreateEmployeeExternalContributionInput>;
  employerContributionInput?: InputMaybe<CreateEmployerContributionInput>;
};

/** Details of validation of a payslip for a correction action. */
export type CorrectionActionEligibilityDetails = {
  /**
   * Boolean to represent whether performing this correction action on this payslip will result in recalculation of year to
   * date wages and associated taxes. Typically necessary for a payslip that is not the most recently created.
   */
  causesYearToDateRecalculation: Scalars['Boolean']['output'];
  /** Boolean to represent whether the payslip has associated approved tax payment. */
  hasApprovedTaxPayments: Scalars['Boolean']['output'];
  /** Boolean to represent whether the payslip has associated tax form filings. */
  hasTaxFilings: Scalars['Boolean']['output'];
  /** Boolean to represent if the correction action is valid on the payslip. */
  isEligible: Scalars['Boolean']['output'];
};

export type CorrectionActionEligible = CorrectionActionEligibilityDetails & {
  __typename?: 'CorrectionActionEligible';
  /**
   * Boolean to represent whether performing this correction action on this payslip will result in recalculation of year to
   * date wages and associated taxes. Typically necessary for a payslip that is not the most recently created.
   */
  causesYearToDateRecalculation: Scalars['Boolean']['output'];
  /** Boolean to represent whether the payslip has associated approved tax payment. */
  hasApprovedTaxPayments: Scalars['Boolean']['output'];
  /** Boolean to represent whether the tax payments is past due for the payslip. */
  hasDueDatePassedForTaxPayments: Scalars['Boolean']['output'];
  /** Boolean to represent whether the payslip has associated tax form filings. */
  hasTaxFilings: Scalars['Boolean']['output'];
  /** Boolean to represent whether the paycheck belongs to a closed quarter . */
  isClosedQuarterCorrection: Scalars['Boolean']['output'];
  /** Boolean to represent if the correction action is valid on the payslip. */
  isEligible: Scalars['Boolean']['output'];
};

export type CorrectionActionIneligible = CorrectionActionEligibilityDetails & {
  __typename?: 'CorrectionActionIneligible';
  /**
   * Boolean to represent whether performing this correction action on this payslip will result in recalculation of year to
   * date wages and associated taxes. Typically necessary for a payslip that is not the most recently created.
   */
  causesYearToDateRecalculation: Scalars['Boolean']['output'];
  /**
   * Represents the eligible alternative to the correction action if the value is not null.
   * Value will be null if isEligible is true or if there's no eligible alternate action.
   */
  eligibleAlternateAction?: Maybe<PayslipCorrectionAction>;
  /** Boolean to represent whether the payslip has associated approved tax payment. */
  hasApprovedTaxPayments: Scalars['Boolean']['output'];
  /** Boolean to represent whether the payslip has associated tax form filings. */
  hasTaxFilings: Scalars['Boolean']['output'];
  /**
   * Represents a list of reasons that makes the respective correction action ineligible on the payslip.
   * This value will be null if the correction action is eligible on the payslip.
   */
  ineligibilityReasons?: Maybe<Array<Scalars['String']['output']>>;
  /** Boolean to represent if the correction action is valid on the payslip. */
  isEligible: Scalars['Boolean']['output'];
};

/** Input for the createAndAssignEmployerManagedWorkersCompensation mutation. */
export type CreateAndAssignEmployerManagedWorkersCompensationInput = {
  /** The ID of the employee to whom this workers' compensation will be assigned. */
  employeeId: Scalars['ID']['input'];
  workersCompensationClass: CreateEmployerManagedWorkersCompensationInput;
};

/** Result payload of createAndAssignEmployerManagedWorkersCompensation mutation. */
export type CreateAndAssignEmployerManagedWorkersCompensationPayload = {
  __typename?: 'CreateAndAssignEmployerManagedWorkersCompensationPayload';
  /** The new policy that was assigned to the employee. */
  employeeWorkersCompensationClass?: Maybe<EmployeeManagedWorkersCompensationClass>;
  /** The new EmployerManagedWorkersCompensationClass that was created as a result of the mutation. */
  employerWorkersCompensationClass?: Maybe<EmployerManagedWorkersCompensationClass>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<WorkersCompensationError>;
};

export type CreateAndAssignPayScheduleInput = {
  /** The details for the payschedule that will be assigned to this employee and also optionally updated */
  createEmployerPaySchedule: CreateEmployerPayScheduleInput;
  /** ID of the employee to assign to this pay schedule */
  employeeId: Scalars['ID']['input'];
};

export type CreateAndAssignPaySchedulePayload = {
  __typename?: 'CreateAndAssignPaySchedulePayload';
  /** Employee that was successfully assigned to the schedule */
  employee?: Maybe<Employee>;
  paySchedule?: Maybe<EmployerPaySchedule>;
  /** The previous default pay schedule for the employer. This will be non-null only in the case that the mutation changed which pay schedule is the employer's default. */
  priorDefaultPaySchedule?: Maybe<EmployerPaySchedule>;
  userError?: Maybe<PayScheduleError>;
};

/** A benefit deduction policy input used for creating a benefit deduction at a company level. */
export type CreateBenefitPolicyInput = {
  /** Imported name of the deduction */
  importedName?: InputMaybe<Scalars['String']['input']>;
  /** Determines if this is the default benefitPolicy */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  /** Name of the provider (e.g. NEST, AVIVA) */
  providerName?: InputMaybe<Scalars['String']['input']>;
  /** Provider Reference ID which is a unique identifier given to the employer by the provider */
  providerReferenceId?: InputMaybe<Scalars['String']['input']>;
  /** Exact types (including taxability) that are supported by region (e.g. CUS_DED_401K_PRE_TAX) */
  statutoryType: Scalars['String']['input'];
};

export type CreateBenefitPolicyPayload = {
  __typename?: 'CreateBenefitPolicyPayload';
  /** The benefitPolicy that was successfully created as a result of the mutation. */
  policy?: Maybe<BenefitPolicy>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

/** Input type for creating a CompanyAddress */
export type CreateCompanyAddressInput = {
  addressComponents: Array<VariableStringFieldInput>;
  /** Political subdivision code for a work location required to identify the tax collector for Pennsylvania */
  politicalSubdivisionCode?: InputMaybe<Scalars['String']['input']>;
};

/** Input to create company and employee payroll runs */
export type CreateCompanyAndEmployeePayrollRunsInput = {
  /** Realm id of the company */
  companyId: Scalars['ID']['input'];
  /** Mode of payroll run e.g. manual/automated */
  mode: PayrollRunMode;
  /** Payschedule id (required for regular payroll run type) */
  payScheduleId?: InputMaybe<Scalars['ID']['input']>;
  /** Includes relevant dates like pay period dates for this payroll run */
  payrollDateSummary?: InputMaybe<PayrollDateSummaryInput>;
  /** Payroll run type e.g. regular, bonus, fringe etc. */
  payrollRunType: PayrollRunType;
  /** Source id that can be used to track payroll run from client side */
  sourceId?: InputMaybe<Scalars['String']['input']>;
};

/** Result of CreateCompanyAndEmployeePayrollRuns mutation */
export type CreateCompanyAndEmployeePayrollRunsPayload = {
  __typename?: 'CreateCompanyAndEmployeePayrollRunsPayload';
  /** Company payroll runs created as a result of mutation */
  companyPayrollRun?: Maybe<CompanyPayrollRun>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<PayrollRunUserError>;
};

export type CreateCompany_Employer_PayScheduleInput = {
  frequency: Scalars['String']['input'];
  initialSetupDates: Company_Employer_PaySchedule_InitialSetupDatesInput;
  /** Name will be set on creation, if not specified. */
  name?: InputMaybe<Scalars['String']['input']>;
};

export type CreateDeductionPolicyInput = {
  /** Imported name of the deduction */
  importedName?: InputMaybe<Scalars['String']['input']>;
  /** Determines if this is the default pensionPolicy */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  /** Attributes to setup specific characteristics of pensions in different jurisdictions */
  pensionSetup?: InputMaybe<PensionSetupInput>;
  /** Name of the Pension provider (e.g. NEST, AVIVA) */
  providerName?: InputMaybe<Scalars['String']['input']>;
  /** Provider Reference ID which is a unique identifier given to the employer by the provider */
  providerReferenceId?: InputMaybe<Scalars['String']['input']>;
  /** Exact types (including taxability) that are supported by region (e.g. CUS_DED_401K_PRE_TAX) */
  statutoryType: Scalars['String']['input'];
};

export type CreateDepartmentInput = {
  companyId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateDepartmentPayload = {
  __typename?: 'CreateDepartmentPayload';
  department?: Maybe<Department>;
  userError?: Maybe<DepartmentError>;
};

export type CreateEmployeeBenefitAndPolicyInput = {
  employeeDeductionDetails: CreateEmployeeDeductionAndPolicyDetailsInput;
  /** ID of the employee to assign to this benefitPolicy */
  employeeId: Scalars['ID']['input'];
};

export type CreateEmployeeBenefitAndPolicyPayload = {
  __typename?: 'CreateEmployeeBenefitAndPolicyPayload';
  /** The employee benefit that was successfully created as a result of the mutation. */
  deduction?: Maybe<EmployeeBenefit>;
  /** The benefit policy that was successfully created as a result of the mutation. */
  policy?: Maybe<BenefitPolicy>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type CreateEmployeeBenefitInput = {
  employeeDeductionDetails: CreateEmployeeDeductionDetailsInput;
  /** ID of the employee to assign to this benefitPolicy */
  employeeId: Scalars['ID']['input'];
};

export type CreateEmployeeBenefitPayload = {
  __typename?: 'CreateEmployeeBenefitPayload';
  /** The employee benefit that was successfully created as a result of the mutation. */
  deduction?: Maybe<EmployeeBenefit>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

/**
 * This input type provides the option for specifying the information related to employer compensation
 * that has to be assigned to the employee compensation being created, and all of the options are mutually exclusive.
 * The client can either create a new employer compensation or assign an existing one.
 * Must specify one and only one of the fields in the input, i.e. only one of the input fields should be non-null.
 */
export type CreateEmployeeCompensationEmployerCompensationInput = {
  existingEmployerCompensationId?: InputMaybe<Scalars['ID']['input']>;
  /** This is the name that has been previously used if this employer compensation has been imported. */
  importedName?: InputMaybe<Scalars['String']['input']>;
  newEmployerCompensation?: InputMaybe<CreateEmployerCompensationInput>;
};

export type CreateEmployeeContractDetailsInput = {
  companyId: Scalars['ID']['input'];
  contractPayType: ContractPayType;
  employeeId: Scalars['ID']['input'];
  employeeWeeklyWorkSchedule?: InputMaybe<CreateEmployeeWeeklyWorkScheduleInput>;
  payRate?: InputMaybe<PayRateInput>;
  weeklyContractedTime?: InputMaybe<WeeklyContractedTimeInput>;
};

export type CreateEmployeeContractDetailsPayload = {
  __typename?: 'CreateEmployeeContractDetailsPayload';
  contractDetail?: Maybe<EmployeeContractDetails>;
  userError?: Maybe<EmployeeContractError>;
};

export type CreateEmployeeContributionInput = {
  amount: RateInput;
  /** Capping is optional in employee contribution. */
  capping?: InputMaybe<CappingInput>;
  frequency?: InputMaybe<ContributionFrequency>;
};

export type CreateEmployeeDeductionAndPolicyDetailsInput = {
  contribution: ContributiveDeductionInput;
  deductionPolicyDetails: CreateDeductionPolicyInput;
};

export type CreateEmployeeDeductionDetailsInput = {
  contribution: ContributiveDeductionInput;
  existingDeductionPolicyId: Scalars['ID']['input'];
  groupName?: InputMaybe<Scalars['String']['input']>;
};

export type CreateEmployeeExternalContributionInput = {
  amount: Scalars['Money']['input'];
};

/**
 * This input type provides the options for specifying amount details based on garnishment type.
 * Must specify atleast one of the fields in the input.
 * The fields definition and restrictions of what types are allowed based on garnishment type
 * are driven with metamodel.
 */
export type CreateEmployeeGarnishmentInput = {
  amount?: InputMaybe<RateInput>;
  /** ID of the employee to create garnishment */
  employeeId: Scalars['ID']['input'];
  exemptAmount?: InputMaybe<Scalars['Money']['input']>;
  garnishmentPolicyDetails: CreateDeductionPolicyInput;
  limitAmount?: InputMaybe<RateInput>;
  totalAmountOwed?: InputMaybe<Scalars['Money']['input']>;
  vendorId?: InputMaybe<Scalars['String']['input']>;
};

export type CreateEmployeeGarnishmentPayload = {
  __typename?: 'CreateEmployeeGarnishmentPayload';
  garnishment?: Maybe<EmployeeGarnishment>;
  userError?: Maybe<DeductionError>;
};

export type CreateEmployeeInput = {
  birthDate?: InputMaybe<Scalars['Date']['input']>;
  companyId: Scalars['ID']['input'];
  contactInfo?: InputMaybe<Payroll_Employee_ContactInfoInput>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  employerNotes?: InputMaybe<Scalars['String']['input']>;
  employmentDetail?: InputMaybe<Payroll_Employee_EmploymentDetailInput>;
  employmentStatus?: InputMaybe<Payroll_Employee_EmploymentStatus_Input>;
  firstName: Scalars['String']['input'];
  gender?: InputMaybe<Payroll_Employee_GenderEnumInput>;
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  honorific?: InputMaybe<Scalars['String']['input']>;
  lastName: Scalars['String']['input'];
  legalSex?: InputMaybe<Scalars['String']['input']>;
  middleInitial?: InputMaybe<Scalars['String']['input']>;
  otherLastNames?: InputMaybe<Array<Scalars['String']['input']>>;
  payslipDisplayName?: InputMaybe<Scalars['String']['input']>;
  preferredFirstName?: InputMaybe<Scalars['String']['input']>;
  taxIdentifiers?: InputMaybe<Array<VariableStringFieldInput>>;
};

export type CreateEmployeeMiscDeductionAndPolicyInput = {
  employeeDeductionDetails: CreateEmployeeDeductionAndPolicyDetailsInput;
  /** ID of the employee to assign to this miscDeductionPolicy */
  employeeId: Scalars['ID']['input'];
  policyPlan?: InputMaybe<Scalars['String']['input']>;
};

export type CreateEmployeeMiscDeductionAndPolicyPayload = {
  __typename?: 'CreateEmployeeMiscDeductionAndPolicyPayload';
  /** The employee miscDeduction that was successfully created as a result of the mutation. */
  deduction?: Maybe<EmployeeMiscDeduction>;
  /** The miscDeduction policy that was successfully created as a result of the mutation. */
  policy?: Maybe<MiscDeductionPolicy>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type CreateEmployeeMiscDeductionInput = {
  employeeDeductionDetails: CreateEmployeeDeductionDetailsInput;
  /** ID of the employee to assign to this miscDeductionPolicy */
  employeeId: Scalars['ID']['input'];
  policyPlan?: InputMaybe<Scalars['String']['input']>;
};

export type CreateEmployeeMiscDeductionPayload = {
  __typename?: 'CreateEmployeeMiscDeductionPayload';
  /** The employee misc deduction that was successfully created as a result of the mutation. */
  deduction?: Maybe<EmployeeMiscDeduction>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type CreateEmployeePayload = {
  __typename?: 'CreateEmployeePayload';
  employee?: Maybe<Employee>;
  userError?: Maybe<EmployeeError>;
};

/** Input to create employee payroll run */
export type CreateEmployeePayrollRunInput = {
  /** Id of the company */
  companyId: Scalars['ID']['input'];
  /** Id of company payroll run to be associated with */
  companyPayrollRunId: Scalars['ID']['input'];
  /** Id of the employee */
  employeeId: Scalars['ID']['input'];
};

export type CreateEmployeePayrollRunPayload = {
  __typename?: 'CreateEmployeePayrollRunPayload';
  /** Employee payroll run created as result of the mutation */
  employeePayrollRun?: Maybe<EmployeePayrollRun>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<PayrollRunUserError>;
};

export type CreateEmployeePensionAndPolicyInput = {
  employeeDeductionDetails: CreateEmployeeDeductionAndPolicyDetailsInput;
  /** ID of the employee to assign to this pensionPolicy */
  employeeId: Scalars['ID']['input'];
};

export type CreateEmployeePensionAndPolicyPayload = {
  __typename?: 'CreateEmployeePensionAndPolicyPayload';
  /** The employee pension that was successfully created as a result of the mutation. */
  deduction?: Maybe<EmployeePension>;
  /** The pension policy that was successfully created as a result of the mutation. */
  policy?: Maybe<PensionPolicy>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type CreateEmployeePensionAutoEnrollmentInput = {
  companyId: Scalars['ID']['input'];
  employeeCategory: Scalars['String']['input'];
  employeeId: Scalars['ID']['input'];
  status: Scalars['String']['input'];
  statusDate?: InputMaybe<Scalars['Date']['input']>;
};

export type CreateEmployeePensionEnrollmentPayload = {
  __typename?: 'CreateEmployeePensionEnrollmentPayload';
  pensionEnrollment?: Maybe<EmployeePensionEnrollment>;
  /** User errors generated as a result of the mutation. */
  userErrors?: Maybe<Array<PensionEnrollmentError>>;
};

export type CreateEmployeePensionInput = {
  employeeDeductionDetails: CreateEmployeeDeductionDetailsInput;
  /** ID of the employee to assign to this pensionPolicy */
  employeeId: Scalars['ID']['input'];
};

export type CreateEmployeePensionPayload = {
  __typename?: 'CreateEmployeePensionPayload';
  /** The employee pension that was successfully created as a result of the mutation. */
  deduction?: Maybe<EmployeePension>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type CreateEmployeeTaxDeductionInput = {
  /** Flag to retroactively apply this update to affected paychecks. Required true if paychecks exist during effective date time period. */
  applyRetroactively?: InputMaybe<Scalars['Boolean']['input']>;
  /** Company ID that the employee tax deduction belongs to */
  companyId: Scalars['ID']['input'];
  /** Date on which the employee's assignment to the policy will become active/is active from */
  effectiveDate: Scalars['Date']['input'];
  /** The ID of the employee tax deduction assignment */
  employeeId: Scalars['ID']['input'];
  /** The tax deduction policy ID that the employee will be assigned to */
  policyId: Scalars['ID']['input'];
};

/**
 * WeeklyContractedHours is a union and currently GraphQL doesn't support union of inputs.
 * Ref: https://github.com/graphql/graphql-spec/blob/inputUnionRFC-priorArt/rfcs/InputUnion.md
 *
 * Only one of the fields (WeeklyContractedHoursPerDay or WeeklyContractedHoursPerWeek) in an input type may be provided.
 */
export type CreateEmployeeWeeklyWorkScheduleInput = {
  irregularWorkingDays?: InputMaybe<Scalars['Boolean']['input']>;
  typicalWorkingDays?: InputMaybe<Array<DayOfWeek>>;
  weeklyContractedHoursPerDay?: InputMaybe<WeeklyContractedHoursPerDayInput>;
  weeklyContractedHoursPerWeek?: InputMaybe<WeeklyContractedHoursPerWeekInput>;
};

export type CreateEmployerCompensationInput = {
  name?: InputMaybe<Scalars['String']['input']>;
  subjectedToCalculation?: InputMaybe<SubjectedToCalculationInput>;
  type: Scalars['String']['input'];
};

export type CreateEmployerCompensationPayload = {
  __typename?: 'CreateEmployerCompensationPayload';
  compensation?: Maybe<EmployerCompensation>;
  userError?: Maybe<CompensationMutationError>;
};

export type CreateEmployerContributionInput = {
  amount: RateInput;
  /** Capping is optional in employer contribution. */
  capping?: InputMaybe<CappingInput>;
  frequency?: InputMaybe<ContributionFrequency>;
};

/** Input class for createEmployerManagedWorkersCompensation and createAndAssignEmployerManagedWorkersCompensation mutations. */
export type CreateEmployerManagedWorkersCompensationInput = {
  /** Flag to retroactively apply rates to paychecks for WC liability. Required true if paychecks exist during effective date time period. */
  applyRateRetroactively: Scalars['Boolean']['input'];
  classification?: InputMaybe<WorkersCompensationClassificationInput>;
  companyId: Scalars['ID']['input'];
  description: Scalars['String']['input'];
  /** If omitted, workers' compensation will be created for default jurisdiction of the employer. */
  jurisdictionId?: InputMaybe<Scalars['String']['input']>;
  workersCompensationCost: EmployerManagedWorkersCompensationCostInput;
};

/** Result payload of createEmployerManagedWorkersCompensation mutation */
export type CreateEmployerManagedWorkersCompensationPayload = {
  __typename?: 'CreateEmployerManagedWorkersCompensationPayload';
  /** The EmployerManagedWorkersCompensationClass that was created as a result of the mutation. */
  employerWorkersCompensationClass?: Maybe<EmployerManagedWorkersCompensationClass>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<WorkersCompensationError>;
};

export type CreateEmployerPayScheduleDetailsInput = {
  frequency: PayScheduleFrequency;
  /** Name will be set on creation, if not specified. */
  name?: InputMaybe<Scalars['String']['input']>;
  referenceDates: PayScheduleReferenceDatesInput;
};

export type CreateEmployerPayScheduleInput = {
  paySchedule: CreateEmployerPayScheduleDetailsInput;
  /** Set payschedule as default for the employer in addition to create payschedule. Can affect other payschedule which is employer's default. */
  useAsDefault: Scalars['Boolean']['input'];
};

/** The response payload for creating an employer pay schedule. */
export type CreateEmployerPaySchedulePayload = {
  __typename?: 'CreateEmployerPaySchedulePayload';
  /** The pay schedule that an employer has created. */
  paySchedule?: Maybe<EmployerPaySchedule>;
  /** Errors that occurred during the operation. */
  userError?: Maybe<PayScheduleError>;
};

export type CreateEmployerTimeOffPolicyDetailsInput = {
  category: TimeOffCategory;
  /**
   * Category details required when creating a custom time off category.
   * Must be provided when category is CUSTOM_PAID or CUSTOM_UNPAID.
   */
  categoryDetail?: InputMaybe<TimeOffCategoryInput>;
  /** Description will be set on creation, if not specified. */
  description?: InputMaybe<Scalars['String']['input']>;
  /**
   * Specifies the details of the time off policy itself.
   * Will be set to null if timeOffMethod is UNLIMITED_TIME.
   */
  policyDetail?: InputMaybe<TimeOffPolicyDetailInput>;
  /** Policy name will be set on creation, if not specified. */
  policyName?: InputMaybe<Scalars['String']['input']>;
  timeOffMethod: TimeOffMethod;
};

export type CreateEmployerTimeOffPolicyInput = {
  timeOffPolicy: CreateEmployerTimeOffPolicyDetailsInput;
  /** Set time off policy as default for the employer in addition to create policy. Can affect other policy which is employer's default. */
  useAsDefault?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CreateEmployerTimeOffPolicyPayload = {
  __typename?: 'CreateEmployerTimeOffPolicyPayload';
  /** The previous default time off policy for the employer. This will be non-null only in the case that the mutation changed which time off policy is the employer's default. */
  priorDefaultTimeOffPolicy?: Maybe<EmployerTimeOffPolicy>;
  /** The policy that was successfully created as a result of the create mutation. */
  timeOffPolicy?: Maybe<EmployerTimeOffPolicy>;
  userError?: Maybe<TimeOffPolicyError>;
};

/**
 * Input class for the createEmployerWorkersCompClass mutation.
 * This class is deprecated, use CreateEmployerManagedWorkersCompensationInput instead.
 */
export type CreateEmployerWorkersCompensationClassInput = {
  companyId: Scalars['ID']['input'];
  employeeClass: Scalars['String']['input'];
  jurisdictionId: Scalars['String']['input'];
  rates: Array<EmployerWorkersCompensationRateInput>;
};

/** Result payload of creatEmployerWorkersCompClass mutation */
export type CreateEmployerWorkersCompensationClassPayload = {
  __typename?: 'CreateEmployerWorkersCompensationClassPayload';
  /** The new EmployerWorkersCompensationClass that was created as a result of the mutation. */
  workersCompensationClass: EmployerWorkersCompensationClass;
};

export type CreateMaternalLeavePeriodInput = {
  /** Baby's birth date for maternity leave */
  babyBirthDate?: InputMaybe<Scalars['Date']['input']>;
  /** Baby's due date for maternity leave */
  babyDueDate: Scalars['Date']['input'];
  /** Used to determine the type of leave */
  category: LeaveCategory;
  companyId: Scalars['ID']['input'];
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['input'];
  employeeId: Scalars['ID']['input'];
  /** End date of the employee leave which is optional */
  endDate?: InputMaybe<Scalars['Date']['input']>;
  /**
   * The wage reference to compute employee wages during the leave period.
   * It is a temporal value that could potentially change for every leave period
   * e.g. average weekly earnings of the employee at the time of taking the leave.
   */
  leaveWageReference?: InputMaybe<Scalars['Money']['input']>;
};

export type CreateMaternalLeavePeriodPayload = {
  __typename?: 'CreateMaternalLeavePeriodPayload';
  leavePeriod?: Maybe<MaternalLeavePeriod>;
  userError?: Maybe<LeavePeriodError>;
};

/** A misc deduction policy input used for creating a misc deduction at a company level. */
export type CreateMiscDeductionPolicyInput = {
  /** Imported name of the deduction */
  importedName?: InputMaybe<Scalars['String']['input']>;
  /** Determines if this is the default miscDeductionPolicy */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  /** Name of the provider (e.g. NEST, AVIVA) */
  providerName?: InputMaybe<Scalars['String']['input']>;
  /** Provider Reference ID which is a unique identifier given to the employer by the provider */
  providerReferenceId?: InputMaybe<Scalars['String']['input']>;
  /** Exact types (including taxability) that are supported by region (e.g. CUS_DED_401K_PRE_TAX) */
  statutoryType: Scalars['String']['input'];
};

export type CreateMiscDeductionPolicyPayload = {
  __typename?: 'CreateMiscDeductionPolicyPayload';
  /** The misc deduction policy that was successfully created as a result of the mutation. */
  policy?: Maybe<MiscDeductionPolicy>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type CreateNeonatalCareLeavePeriodInput = {
  /** Baby's birth date for neonatal care leave */
  babyBirthDate: Scalars['Date']['input'];
  /** Baby's due date for neonatal care leave */
  babyDueDate: Scalars['Date']['input'];
  /** Used to determine the type of leave */
  category: LeaveCategory;
  companyId: Scalars['ID']['input'];
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['input'];
  employeeId: Scalars['ID']['input'];
  /** End date of the employee leave which is optional */
  endDate?: InputMaybe<Scalars['Date']['input']>;
  /**
   * The wage reference to compute employee wages during the leave period.
   * It is a temporal value that could potentially change for every leave period
   * e.g. average weekly earnings of the employee at the time of taking the leave.
   */
  leaveWageReference?: InputMaybe<Scalars['Money']['input']>;
  /** Number of weeks for Employee leave period */
  numberOfWeeks: Scalars['Int']['input'];
  /** Tier type for Employee leave period */
  tierType: Scalars['Int']['input'];
};

export type CreateNeonatalCareLeavePeriodPayload = {
  __typename?: 'CreateNeonatalCareLeavePeriodPayload';
  leavePeriod?: Maybe<NeonatalCareLeavePeriod>;
  userError?: Maybe<LeavePeriodError>;
};

export type CreateOrUpdateEmployeeCompensationInput = {
  /** Details of the employee compensation we're creating */
  employeeCompensation?: InputMaybe<EmployeeCompensationInput>;
  /** The id of the employee this compensation is associated with */
  employeeId: Scalars['ID']['input'];
  /** The id of the existing employee compensation if it already exists */
  existingEmployeeCompensationId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateOrUpdateLiabilityAdjustmentInput = {
  /** Realm id of the company */
  companyId: Scalars['ID']['input'];
  /**
   * Liability adjustment id. If this is present then the mutation will be used to update the existing liability adjustment,
   * else the mutation will be used to create a new liability adjustment and its liability adjustment details.
   */
  id?: InputMaybe<Scalars['ID']['input']>;
  /** Liability adjustment details */
  liabilityAdjustmentDetails: Array<PayrollLiabilityAdjustmentDetailInput>;
  /** Liability adjustment period */
  liabilityAdjustmentPeriod: PayrollLiabilityAdjustmentPeriodInput;
  /** Date for liability adjustment */
  liabilityDate: Scalars['Date']['input'];
  /** Net amount for the liability adjustment */
  netAmount: Scalars['Money']['input'];
};

export type CreateOrUpdateLiabilityAdjustmentPayload = {
  __typename?: 'CreateOrUpdateLiabilityAdjustmentPayload';
  /** Liability adjustment created as a result of the mutation */
  liabilityAdjustment?: Maybe<PayrollLiabilityAdjustment>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<PayrollLiabilityAdjustmentUserError>;
};

export type CreateOrUpdatePartnerSubscriptionInput = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  partnerName: Scalars['String']['input'];
  sourceCode?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  status: Scalars['String']['input'];
  subscriptionName: Scalars['String']['input'];
};

export type CreateOrUpdatePartnerSubscriptionPayload = {
  __typename?: 'CreateOrUpdatePartnerSubscriptionPayload';
  partnerSubscription?: Maybe<PartnerSubscription>;
  /** User errors generated as a result of the mutation. */
  userErrors?: Maybe<Array<PartnerSubscriptionError>>;
};

/** createOrUpdatePensionProviderSetup mutation input type */
export type CreateOrUpdatePensionProviderSetupInput = {
  /** Provider agency credential */
  agencyCredential?: InputMaybe<AgencyCredentialInput>;
  /** Authorization code for OAuth-enabled providers */
  authCode?: InputMaybe<Scalars['String']['input']>;
  /** Is the platform responsible for automatically making this filing. False indicates that this filing will be made manually by the user. */
  autoSyncEnabled: Scalars['Boolean']['input'];
  /** Is provider integration enabled */
  enabled: Scalars['Boolean']['input'];
  /** ProviderSetup Id */
  id?: InputMaybe<Scalars['ID']['input']>;
  /** Provider name */
  name: Scalars['String']['input'];
};

/** createOrUpdatePensionProviderSetup mutation output type */
export type CreateOrUpdatePensionProviderSetupPayload = {
  __typename?: 'CreateOrUpdatePensionProviderSetupPayload';
  /** PensionProviderSetup entity */
  pensionProviderSetup?: Maybe<PensionProviderSetup>;
  /** Errors during mutation */
  userError?: Maybe<ProviderAgencyError>;
};

export type CreatePaternalLeavePeriodInput = {
  /** Baby's birth date for paternity leave */
  babyBirthDate: Scalars['Date']['input'];
  /** Baby's due date for paternity leave */
  babyDueDate: Scalars['Date']['input'];
  /** Used to determine the type of leave */
  category: LeaveCategory;
  companyId: Scalars['ID']['input'];
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['input'];
  employeeId: Scalars['ID']['input'];
  /** End date of the employee leave which is optional */
  endDate?: InputMaybe<Scalars['Date']['input']>;
  /**
   * The wage reference to compute employee wages during the leave period.
   * It is a temporal value that could potentially change for every leave period
   * e.g. average weekly earnings of the employee at the time of taking the leave.
   */
  leaveWageReference?: InputMaybe<Scalars['Money']['input']>;
};

export type CreatePaternalLeavePeriodPayload = {
  __typename?: 'CreatePaternalLeavePeriodPayload';
  leavePeriod?: Maybe<PaternalLeavePeriod>;
  userError?: Maybe<LeavePeriodError>;
};

export type CreatePayrollBankAccountInput = {
  accountNumber: Scalars['String']['input'];
  accountType: Scalars['String']['input'];
  bankCode: Scalars['String']['input'];
};

export type CreatePayrollFirstRefreshTokenForExportError = {
  __typename?: 'CreatePayrollFirstRefreshTokenForExportError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/**
 * The input to create a refreshToken for Payroll First export ```
 * create the OAuth refresh token in the backend.
 */
export type CreatePayrollFirstRefreshTokenForExportInput = {
  companyId: Scalars['ID']['input'];
};

export type CreatePayrollFirstRefreshTokenForExportPayload = {
  __typename?: 'CreatePayrollFirstRefreshTokenForExportPayload';
  errors?: Maybe<Array<Maybe<CreatePayrollFirstRefreshTokenForExportError>>>;
};

export type CreatePayroll_Employee_EmployeeContractDetailsInput = {
  companyId: Scalars['ID']['input'];
  contractPayType: Scalars['String']['input'];
  /** The employee ID of an employee [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) whose contract this is */
  employeeId: Scalars['ID']['input'];
  frequencyType?: InputMaybe<Scalars['String']['input']>;
  rate: Scalars['String']['input'];
};

export type CreatePayroll_Employee_EmployeeContractDetailsPayload = {
  __typename?: 'CreatePayroll_Employee_EmployeeContractDetailsPayload';
  contractDetail?: Maybe<Payroll_Employee_EmployeeContractDetails>;
};

export type CreatePensionEnrollmentInput = {
  allowComputingStagingDate: Scalars['Boolean']['input'];
  companyId: Scalars['ID']['input'];
  pensionReenrollment: PensionReenrollmentInput;
  stagingDate?: InputMaybe<Scalars['Date']['input']>;
};

export type CreatePensionEnrollmentPayload = {
  __typename?: 'CreatePensionEnrollmentPayload';
  pensionEnrollment?: Maybe<PensionEnrollment>;
  /** User errors generated as a result of the mutation. */
  userErrors?: Maybe<Array<PensionEnrollmentError>>;
};

/** A pension policy input used for creating a pension at a company level. */
export type CreatePensionPolicyInput = {
  /** Imported name of the deduction */
  importedName?: InputMaybe<Scalars['String']['input']>;
  /** Determines if this is the default pensionPolicy */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  /** Attributes to setup specific characteristics of pensions in different jurisdictions */
  pensionSetup?: InputMaybe<PensionSetupInput>;
  /** Name of the Pension provider (e.g. NEST, AVIVA) */
  providerName?: InputMaybe<Scalars['String']['input']>;
  /** Provider Reference ID which is a unique identifier given to the employer by the provider */
  providerReferenceId?: InputMaybe<Scalars['String']['input']>;
  /** Exact types (including taxability) that are supported by region (e.g. CUS_DED_401K_PRE_TAX) */
  statutoryType: Scalars['String']['input'];
};

export type CreatePensionPolicyPayload = {
  __typename?: 'CreatePensionPolicyPayload';
  /** The pension policy that was successfully created as a result of the mutation. */
  policy?: Maybe<PensionPolicy>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type CreateSickLeavePeriodInput = {
  /** Used to determine the type of leave */
  category: LeaveCategory;
  companyId: Scalars['ID']['input'];
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['input'];
  employeeId: Scalars['ID']['input'];
  /** End date of the employee leave which is optional */
  endDate?: InputMaybe<Scalars['Date']['input']>;
  /**
   * The wage reference to compute employee wages during the leave period.
   * It is a temporal value that could potentially change for every leave period
   * e.g. average weekly earnings of the employee at the time of taking the leave.
   */
  leaveWageReference?: InputMaybe<Scalars['Money']['input']>;
  /** Specifies the number of days from another leave that should be linked to this leave. */
  linkedLeaveDays?: InputMaybe<Scalars['Int']['input']>;
};

export type CreateSickLeavePeriodPayload = {
  __typename?: 'CreateSickLeavePeriodPayload';
  leavePeriod?: Maybe<SickLeavePeriod>;
  userError?: Maybe<LeavePeriodError>;
};

/** Input for creating a signatory */
export type CreateSignatoryInput = {
  /** Business title of the signatory */
  businessTitle: Scalars['String']['input'];
  /** Company ID of the company */
  companyId: Scalars['ID']['input'];
  /** User ID of the signatory */
  userId: Scalars['String']['input'];
};

/** Payload for creating a signatory */
export type CreateSignatoryPayload = {
  __typename?: 'CreateSignatoryPayload';
  /** Error details if the operation failed */
  error?: Maybe<SignatoryError>;
  /** The created signatory */
  signatory?: Maybe<ElectronicServiceSignatory>;
};

export type CreateTaskInput = {
  /** Actions for the task */
  actions: Array<TaskActionInput>;
  /**
   * Category of the task.
   * Eg: IFSP_ONBOARDING, PAY_TAXES, FORM_FILING, PRIOR_HISTORY
   */
  category: Scalars['String']['input'];
  /** Description for the task */
  description?: InputMaybe<Scalars['String']['input']>;
  /** Due date for the task */
  dueDate?: InputMaybe<Scalars['Date']['input']>;
  /** Employee(s) for whom the task is related to */
  employees?: InputMaybe<Array<Scalars['ID']['input']>>;
  /** Expiry date for the task */
  expiryDate?: InputMaybe<Scalars['Date']['input']>;
  /** Pre-defined type of the task */
  itemType?: InputMaybe<Scalars['String']['input']>;
  /** Name for the task */
  name: Scalars['String']['input'];
  /** Priority of the task. Varies from 0 to 10 with 10 being the highest priority */
  priority?: InputMaybe<Scalars['Int']['input']>;
  /** Source data for the task */
  sourceVersion?: InputMaybe<TaskSourceVersionInput>;
  /** Status of the task */
  status?: InputMaybe<TaskStatus>;
};

export type CreateTaxDeductionPolicyInput = {
  /** Category of this deduction policy */
  category: Scalars['String']['input'];
  /** Company ID that the tax deduction policy belongs to */
  companyId: Scalars['ID']['input'];
  /** The deduction contributions associated with this policy */
  contributions: Array<TaxDeductionContributionInput>;
  /** A deduction policy name/description */
  name: Scalars['String']['input'];
  /**
   * Unique identifier for this tax deduction policy
   * E.g. CUS_L1MA_PFML | Massachusetts Paid Family and Medical Leave
   */
  statutoryType: Scalars['String']['input'];
  /** SubCategory of this deduction policy */
  subCategory: Scalars['String']['input'];
};

export type CreateTaxExemptionInput = {
  /** Flag to retroactively apply this update to affected paychecks. Required true if paychecks exist during effective date time period. */
  applyRetroactively?: InputMaybe<Scalars['Boolean']['input']>;
  /** Company ID of the company being updated */
  companyId: Scalars['ID']['input'];
  /** The date that the exemption will be effective */
  effectiveDate: Scalars['Date']['input'];
  /** The tax id that is being created e.g. TTAX_CUS_L1MA_EXEMPT_104 */
  exemptionCode: Scalars['String']['input'];
  /** Flag indicating if you are exempt from this tax */
  isExempt: Scalars['Boolean']['input'];
};

/** Input object for creating a tax registration order for a specific jurisdiction */
export type CreateTaxRegistrationOrderInput = {
  /** The business information required for creating the tax registration order with vendor (Information required by agency to provide SUI/WH account number) */
  businessInfo: TaxRegistrationOrderBusinessInfoInput;
  /** Company ID of the company being updated */
  companyId: Scalars['ID']['input'];
  /** The jurisdiction information required for the tax registration order with vendor (Information required by agency to provide SUI/WH account number) */
  jurisdictionInfo: TaxRegistrationOrderJurisdictionInfoInput;
};

export type CreateTaxRegistrationOrderPayload = {
  __typename?: 'CreateTaxRegistrationOrderPayload';
  error?: Maybe<TaxRegistrationError>;
  /** The tax registration order */
  order?: Maybe<TaxRegistrationOrder>;
};

/** input type for creating a new custom time off category */
export type CreateTimeOffCategoryInput = {
  /** The name for the custom time off category */
  name: Scalars['String']['input'];
  /** Indicates whether the timeOff type is paid or unpaid */
  type: TimeOffType;
};

/** Tax payment that was created, and the original tax payment that was deleted as result of the mutation */
export type CreatedAndDeletedTaxPayment = {
  __typename?: 'CreatedAndDeletedTaxPayment';
  /** Tax payment that was created a result of the approveAndScheduleTaxPayment mutation */
  createdTaxPayment: Payroll_Payments_TaxPayment;
  /** Tax old tax payment that was deleted a result of the approveAndScheduleTaxPayment mutation */
  deletedTaxPayment: Payroll_Payments_TaxPayment;
};

/** Dates that represents the time limit for specific actions and events in the payroll run */
export type CutoffDateSummary = {
  __typename?: 'CutoffDateSummary';
  /** Represents the cutoff date for the customer modifications to be completed */
  customerCutoffDate: Scalars['DateTime']['output'];
  /** Represents the cutoff date by which direct deposit needs to be offloaded for payroll run */
  directDepositCutoffDate: Scalars['DateTime']['output'];
  /** Represents the cutoff date for the customer to complete previewing the payroll run */
  previewCutoffDate: Scalars['DateTime']['output'];
  /** Represents the cutoff date for the customer to complete submitting the payroll run */
  submitCutoffDate: Scalars['DateTime']['output'];
};

export type DateFilter = {
  gte?: InputMaybe<Scalars['Date']['input']>;
  lte?: InputMaybe<Scalars['Date']['input']>;
};

/** Represents a date period with begin and end dates */
export type DatePeriod = PeriodicDate & {
  __typename?: 'DatePeriod';
  beginDate?: Maybe<Scalars['Date']['output']>;
  endDate?: Maybe<Scalars['Date']['output']>;
};

/** Metamodel for date period */
export type DatePeriodMetaModel = MetaModel & {
  __typename?: 'DatePeriodMetaModel';
  applicable: Scalars['Boolean']['output'];
  beginDate: MetaDate;
  endDate: MetaDate;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export enum DayOfMonth {
  Eighteenth = 'EIGHTEENTH',
  Eighth = 'EIGHTH',
  Eleventh = 'ELEVENTH',
  EndOfMonth = 'END_OF_MONTH',
  Fifteenth = 'FIFTEENTH',
  Fifth = 'FIFTH',
  First = 'FIRST',
  Fourteenth = 'FOURTEENTH',
  Fourth = 'FOURTH',
  Nineteenth = 'NINETEENTH',
  Ninth = 'NINTH',
  Second = 'SECOND',
  Seventeenth = 'SEVENTEENTH',
  Seventh = 'SEVENTH',
  Sixteenth = 'SIXTEENTH',
  Sixth = 'SIXTH',
  Tenth = 'TENTH',
  Third = 'THIRD',
  Thirteenth = 'THIRTEENTH',
  Thirtieth = 'THIRTIETH',
  Twelfth = 'TWELFTH',
  Twentieth = 'TWENTIETH',
  TwentyEighth = 'TWENTY_EIGHTH',
  TwentyFifth = 'TWENTY_FIFTH',
  TwentyFirst = 'TWENTY_FIRST',
  TwentyFourth = 'TWENTY_FOURTH',
  TwentyNinth = 'TWENTY_NINTH',
  TwentySecond = 'TWENTY_SECOND',
  TwentySeventh = 'TWENTY_SEVENTH',
  TwentySixth = 'TWENTY_SIXTH',
  TwentyThird = 'TWENTY_THIRD'
}

export enum DayOfWeek {
  Friday = 'FRIDAY',
  Monday = 'MONDAY',
  Saturday = 'SATURDAY',
  Sunday = 'SUNDAY',
  Thursday = 'THURSDAY',
  Tuesday = 'TUESDAY',
  Wednesday = 'WEDNESDAY'
}

export type DeductionCategoryToAccountMapping = {
  __typename?: 'DeductionCategoryToAccountMapping';
  /** Account selected for export of company contribution for the deduction category */
  account: LedgerAccount;
  deductionCategoryId: Scalars['String']['output'];
};


export type DeductionCategoryToAccountMappingDeductionCategoryIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type DeductionError = {
  __typename?: 'DeductionError';
  code?: Maybe<Scalars['String']['output']>;
  employeeDeductionId?: Maybe<Scalars['String']['output']>;
  employeeId?: Maybe<Scalars['String']['output']>;
  employerDeductionId?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Includes the details for a deduction specific to a company */
export type DeductionPolicy = {
  /** Determines this deduction category */
  category: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** A deduction name/description */
  name: Scalars['String']['output'];
  /** Defines the exact types (including taxability) that are supported by region (e.g. CUS_DED_MEDICAL_INSURANCE_PRE_TAX) */
  statutoryType: Scalars['String']['output'];
  /** SubCategory of this deduction */
  subCategory: Scalars['String']['output'];
  /** Indicates deduction is a pre-tax or post-tax */
  taxOption: TaxOption;
};


/** Includes the details for a deduction specific to a company */
export type DeductionPolicyCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/** Includes the details for a deduction specific to a company */
export type DeductionPolicyStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/** Includes the details for a deduction specific to a company */
export type DeductionPolicySubCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type DeductionPolicyFilter = {
  active?: InputMaybe<BooleanFilter>;
  id?: InputMaybe<IdFilter>;
};

/** Metamodel for all types implementing DeductionPolicy */
export type DeductionPolicyMetaModel = MetaModel & {
  __typename?: 'DeductionPolicyMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** This deduction is only applicable for the given category/subcategory */
  categoryDetails: MetaDeductionPolicyApplicable;
  label: Scalars['String']['output'];
  /** The metamodel for deduction name/description */
  name: MetaString;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** The metamodel for statutoryType */
  statutoryType: MetaEnum;
  typeRef: Scalars['String']['output'];
};

/** Interface for the deduction policy meta model */
export type DeductionPolicyMetaModelV2 = {
  /** This deduction is only applicable for the given category/subcategory */
  categoryDetails: MetaDeductionPolicyApplicable;
  /** The metamodel for deduction name/description */
  name: MetaString;
  /** The metamodel for statutoryType */
  statutoryType: MetaEnum;
};

export type DeductionsAndContributionsAggregationDetail = {
  __typename?: 'DeductionsAndContributionsAggregationDetail';
  /** List of deduction/contribution/garnishment details aggregated by policy */
  aggregatedByPolicy?: Maybe<PayrollReportAggregationDeductionPolicyConnection>;
  /** Total aggregation of deduction data across all deduction, contribution and garnishment types */
  totalAggregation: PayrollReportDeductionDetail;
};

export type DeductionsAndContributionsAggregationInput = {
  /** Category of a deduction */
  deductionCategory?: InputMaybe<Scalars['String']['input']>;
  deductionId?: InputMaybe<Scalars['ID']['input']>;
};

export type DeductionsAndContributionsAggregationRenderingInput = {
  /** Category of a deduction */
  deductionCategory?: InputMaybe<Scalars['String']['input']>;
  deductionId?: InputMaybe<Scalars['ID']['input']>;
};

export type DeductionsAndContributionsReport = {
  __typename?: 'DeductionsAndContributionsReport';
  aggregations?: Maybe<DeductionsAndContributionsAggregationDetail>;
  /** Deductions and Contributions Report with report data rendering detail */
  renderings?: Maybe<DeductionsAndContributionsReportRenderings>;
};


export type DeductionsAndContributionsReportAggregationsArgs = {
  filterBy?: InputMaybe<DeductionsAndContributionsAggregationInput>;
};

export type DeductionsAndContributionsReportAggregatedByPolicyPdfRenderInput = {
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /**
   * Specifies if a header such as company name, date etc. should be repeated for each page of the pdf or not.
   * If not specified, it will be false by default
   */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

export type DeductionsAndContributionsReportAggregatedByPolicyRenderings = {
  __typename?: 'DeductionsAndContributionsReportAggregatedByPolicyRenderings';
  excel?: Maybe<FileRendering>;
  pdf?: Maybe<FileRendering>;
};


export type DeductionsAndContributionsReportAggregatedByPolicyRenderingsPdfArgs = {
  input: DeductionsAndContributionsReportAggregatedByPolicyPdfRenderInput;
};

export type DeductionsAndContributionsReportEmployeeBreakdownInput = {
  employeeId?: InputMaybe<Scalars['ID']['input']>;
};

export type DeductionsAndContributionsReportEmployeeBreakdownPdfRenderInput = {
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /**
   * Specifies if a header such as company name, date etc. should be repeated for each page of the pdf or not.
   * If not specified, it will be false by default
   */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

export type DeductionsAndContributionsReportEmployeeBreakdownRenderingInput = {
  deductionPolicyId: IdFilter;
};

export type DeductionsAndContributionsReportEmployeeBreakdownRenderings = {
  __typename?: 'DeductionsAndContributionsReportEmployeeBreakdownRenderings';
  excel?: Maybe<FileRendering>;
  pdf?: Maybe<FileRendering>;
};


export type DeductionsAndContributionsReportEmployeeBreakdownRenderingsPdfArgs = {
  input: DeductionsAndContributionsReportEmployeeBreakdownPdfRenderInput;
};

export type DeductionsAndContributionsReportInput = {
  payDate: PayslipPayDateFilter;
};

export type DeductionsAndContributionsReportPayslipBreakdownPdfRenderInput = {
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /**
   * Specifies if a header such as company name, date etc. should be repeated for each page of the pdf or not.
   * If not specified, it will be false by default
   */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

export type DeductionsAndContributionsReportPayslipBreakdownRenderingInput = {
  deductionPolicyId: Scalars['ID']['input'];
  employeeId: Scalars['ID']['input'];
};

export type DeductionsAndContributionsReportPayslipBreakdownRenderings = {
  __typename?: 'DeductionsAndContributionsReportPayslipBreakdownRenderings';
  excel?: Maybe<FileRendering>;
  pdf?: Maybe<FileRendering>;
};


export type DeductionsAndContributionsReportPayslipBreakdownRenderingsPdfArgs = {
  input: DeductionsAndContributionsReportPayslipBreakdownPdfRenderInput;
};

/**
 * Deductions and Contributions Report supports various renderings for
 * aggregatedByPolicy, employeeBreakdown and payslipBreakdown views. Note that
 * each rendering also includes aggregated totals for the report
 */
export type DeductionsAndContributionsReportRenderings = {
  __typename?: 'DeductionsAndContributionsReportRenderings';
  aggregatedByPolicy?: Maybe<DeductionsAndContributionsReportAggregatedByPolicyRenderings>;
  employeeBreakdown?: Maybe<DeductionsAndContributionsReportEmployeeBreakdownRenderings>;
  payslipBreakdown?: Maybe<DeductionsAndContributionsReportPayslipBreakdownRenderings>;
};


/**
 * Deductions and Contributions Report supports various renderings for
 * aggregatedByPolicy, employeeBreakdown and payslipBreakdown views. Note that
 * each rendering also includes aggregated totals for the report
 */
export type DeductionsAndContributionsReportRenderingsAggregatedByPolicyArgs = {
  filterBy?: InputMaybe<DeductionsAndContributionsAggregationRenderingInput>;
};


/**
 * Deductions and Contributions Report supports various renderings for
 * aggregatedByPolicy, employeeBreakdown and payslipBreakdown views. Note that
 * each rendering also includes aggregated totals for the report
 */
export type DeductionsAndContributionsReportRenderingsEmployeeBreakdownArgs = {
  filterBy: DeductionsAndContributionsReportEmployeeBreakdownRenderingInput;
};


/**
 * Deductions and Contributions Report supports various renderings for
 * aggregatedByPolicy, employeeBreakdown and payslipBreakdown views. Note that
 * each rendering also includes aggregated totals for the report
 */
export type DeductionsAndContributionsReportRenderingsPayslipBreakdownArgs = {
  filterBy: DeductionsAndContributionsReportPayslipBreakdownRenderingInput;
};

export type DeleteAdjustmentPayslipError = {
  __typename?: 'DeleteAdjustmentPayslipError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  payslipId: Scalars['ID']['output'];
  type: Scalars['String']['output'];
};

export enum DeleteAdjustmentTimeRangeChoices {
  All = 'ALL',
  Past_10Minutes = 'PAST_10_MINUTES',
  PastHour = 'PAST_HOUR',
  Today = 'TODAY'
}

export type DeleteDepartmentInput = {
  companyId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
};

export type DeleteDepartmentPayload = {
  __typename?: 'DeleteDepartmentPayload';
  id?: Maybe<Scalars['ID']['output']>;
  userError?: Maybe<DepartmentError>;
};

export type DeleteEmployeeBenefitInput = {
  /** The ID of the employee deduction to be de-activated. */
  employeeDeductionId: Scalars['ID']['input'];
  /** The ID of the employee whose benefit to be de-activated. */
  employeeId: Scalars['ID']['input'];
};

export type DeleteEmployeeBenefitPayload = {
  __typename?: 'DeleteEmployeeBenefitPayload';
  /** ID of the employee benefit that was disabled as a result of the mutation. */
  id?: Maybe<Scalars['ID']['output']>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type DeleteEmployeeGarnishmentInput = {
  /** The ID of the employee garnishment to be deleted. */
  employeeGarnishmentId: Scalars['ID']['input'];
  /** ID of the employee with the employee garnishment to be deleted. */
  employeeId: Scalars['ID']['input'];
};

export type DeleteEmployeeGarnishmentPayload = {
  __typename?: 'DeleteEmployeeGarnishmentPayload';
  /** ID of the employee garnishment that was deleted as a result of the mutation. */
  id?: Maybe<Scalars['ID']['output']>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type DeleteEmployeeInput = {
  companyId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
};

export type DeleteEmployeeMiscDeductionInput = {
  /** The ID of the employee misc deduction to be deleted. */
  employeeDeductionId: Scalars['ID']['input'];
  /** The ID of the employee whose miscDeduction to be deleted. */
  employeeId: Scalars['ID']['input'];
};

export type DeleteEmployeeMiscDeductionPayload = {
  __typename?: 'DeleteEmployeeMiscDeductionPayload';
  /** ID of the employee deduction that was deleted as a result of the mutation. */
  id?: Maybe<Scalars['ID']['output']>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type DeleteEmployeePayload = {
  __typename?: 'DeleteEmployeePayload';
  id?: Maybe<Scalars['ID']['output']>;
  userError?: Maybe<EmployeeError>;
};

export type DeleteEmployeePensionInput = {
  /** The ID of the employee pension to be deleted. */
  employeeDeductionId: Scalars['ID']['input'];
  /** The ID of the employee whose pension to be deleted. */
  employeeId: Scalars['ID']['input'];
};

export type DeleteEmployeePensionPayload = {
  __typename?: 'DeleteEmployeePensionPayload';
  /** ID of the employee pension that was deleted as a result of the mutation. */
  id?: Maybe<Scalars['ID']['output']>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type DeleteEmployeeTaxDeductionInput = {
  /** Flag to retroactively apply this update to affected paychecks. Required true if paychecks exist during effective date time period. */
  applyRetroactively?: InputMaybe<Scalars['Boolean']['input']>;
  /** Company ID that the employee tax deduction belongs to */
  companyId: Scalars['ID']['input'];
  /** The ID of the employee tax deduction to be deleted */
  id: Scalars['ID']['input'];
};

export type DeleteEmployeeTaxDeductionPayload = {
  __typename?: 'DeleteEmployeeTaxDeductionPayload';
  /** ID of the employee tax deduction assignment that was deleted as a result of the mutation */
  id?: Maybe<Scalars['ID']['output']>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<TaxDeductionError>;
};

export type DeleteEmployeeTimeOffPoliciesInput = {
  /** The ID of the employee whose timeoff policies to be deleted. */
  employeeId: Scalars['ID']['input'];
  /** The list of employee timeoff policy IDs to be deleted. */
  employeeTimeOffPolicyIds: Array<Scalars['ID']['input']>;
};

/** Result of the 'deleteEmployeeTimeOffPolicies' mutation. Provides a list of successful timeoff policies deleted for an employee. */
export type DeleteEmployeeTimeOffPoliciesPayload = {
  __typename?: 'DeleteEmployeeTimeOffPoliciesPayload';
  /** List of timeoff policy ids that were deleted successfully */
  employeeTimeOffPolicyIds?: Maybe<Array<Scalars['ID']['output']>>;
  /**
   * The error that occurred if deleting timeoff policies failed.
   * This is null if deletion was successful.
   */
  userError?: Maybe<TimeOffPolicyError>;
};

/** Input for the deleteEmployeeWorkersCompensation mutation. */
export type DeleteEmployeeWorkersCompensationInput = {
  /** The ID of the company */
  companyId: Scalars['ID']['input'];
  /** The ID of the employee workers' compensation to be deleted. */
  id: Scalars['ID']['input'];
};

/** Result payload of deleteEmployeeWorkersCompensation mutation. */
export type DeleteEmployeeWorkersCompensationPayload = {
  __typename?: 'DeleteEmployeeWorkersCompensationPayload';
  /** ID of the employee workers' compensation that was deleted as a result of the mutation. */
  id?: Maybe<Scalars['ID']['output']>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<WorkersCompensationError>;
};

/** Result payload of deleteEmployerManagedWorkersCompensationClass mutation */
export type DeleteEmployerManagedWorkersCompensationClassPayload = {
  __typename?: 'DeleteEmployerManagedWorkersCompensationClassPayload';
  /** The ID of the EmployerManagedWorkersCompensationClass that was deleted as a result of the mutation. */
  id?: Maybe<Scalars['ID']['output']>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<WorkersCompensationError>;
};

/** Input for the deleteEmployerManagedWorkersCompensation mutation */
export type DeleteEmployerManagedWorkersCompensationInput = {
  companyId: Scalars['ID']['input'];
  /** id of EmployerManagedWorkersCompensationClass */
  id: Scalars['ID']['input'];
};

/** Input for the deleteWorkersComp mutation. */
export type DeleteEmployerWorkersCompensationClassInput = {
  companyId: Scalars['ID']['input'];
  /** id of EmployerWorkersCompensationClass */
  id: Scalars['ID']['input'];
};

/** Result payload of deleteEmployerWorkersCompClass mutation */
export type DeleteEmployerWorkersCompensationClassPayload = {
  __typename?: 'DeleteEmployerWorkersCompensationClassPayload';
  /** The ID of the EmployerWorkersCompensationClass that was deleted as a result of the mutation. */
  id: Scalars['ID']['output'];
};

export type DeleteLeavePeriodInput = {
  companyId: Scalars['ID']['input'];
  employeeId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
};

export type DeleteLeavePeriodPayload = {
  __typename?: 'DeleteLeavePeriodPayload';
  id?: Maybe<Scalars['ID']['output']>;
  userError?: Maybe<LeavePeriodError>;
};

/** Input details (companyID, imported tax item name) for which mapping of the imported tax item is being deleted */
export type DeleteMappingImportedTaxItemInput = {
  /** Company ID that is being updated */
  companyId: Scalars['ID']['input'];
  /** Name of the imported tax item */
  name: Scalars['String']['input'];
};

export type DeleteMappingImportedTaxItemPayload = {
  __typename?: 'DeleteMappingImportedTaxItemPayload';
  userError?: Maybe<ImportedPayHistoryError>;
};

export type DeletePayslipsInput = {
  companyId: Scalars['ID']['input'];
  payslipIds: Array<Scalars['ID']['input']>;
};

/** Result of the 'deletePayslips' mutation. Provides a list of successful and errored delete actions on a batch of payslips. */
export type DeletePayslipsPayload = {
  __typename?: 'DeletePayslipsPayload';
  /** List of payslips that weren't able to be deleted and associated list of errors as to why delete was unsuccessful */
  failures?: Maybe<Array<PayslipCorrectionFailure>>;
  /** List of payslip ids that were deleted successfully */
  payslipIds?: Maybe<Array<Scalars['ID']['output']>>;
  /** Boolean to represent if any of the deleted payslips have an associated approved tax payments. If a customer has already paid their payroll taxes for at least one of the payslips, deleting these payslips may result in an overpayment or underpayment of taxes. If this boolean returns as true, the customer's tax liabilities have changed, and a corrective action may be required.. */
  taxPaymentsImpacted?: Maybe<Scalars['Boolean']['output']>;
};

export type DeleteTaskInput = {
  /** Category of the task */
  category?: InputMaybe<Scalars['String']['input']>;
  /** Id of the task */
  id: Scalars['ID']['input'];
};

export type DeleteTaxExemptionInput = {
  /** Flag to retroactively apply this update to affected paychecks. Required true if paychecks exist during effective date time period. */
  applyRetroactively?: InputMaybe<Scalars['Boolean']['input']>;
  /** The id of the exemption that is being deleted */
  id: Scalars['ID']['input'];
};

export type DeleteTaxExemptionPayload = {
  __typename?: 'DeleteTaxExemptionPayload';
  /** ID of the tax exemption that was deleted as a result of the mutation */
  id: Scalars['ID']['output'];
  /** User error generated as a result of the mutation */
  userError?: Maybe<TaxExemptionError>;
};

export type DeleteTaxFilingInput = {
  /** The ID of the company */
  companyId: Scalars['ID']['input'];
  /** The ID of the tax filing to be deleted. */
  taxFilingId: Scalars['ID']['input'];
};

export type DeleteTaxFilingPayload = {
  __typename?: 'DeleteTaxFilingPayload';
  /** ID of the tax filing that was deleted. */
  id?: Maybe<Scalars['ID']['output']>;
  /**
   * The error that occurred during the process of deletion of the tax filing.
   * This is null if deletion was successful.
   */
  userError?: Maybe<TaxFilingError>;
};

/** Input for the `deleteTaxPayment` mutation. */
export type DeleteTaxPaymentInput = {
  /** The ID of a Tax Payment that is to be deleted. */
  id: Scalars['ID']['input'];
};

/**
 * Result of `deleteTaxPayment` mutation.
 * Includes successfully deleted tax payment, as well as any error that caused failures to do so.
 */
export type DeleteTaxPaymentPayload = {
  __typename?: 'DeleteTaxPaymentPayload';
  /**
   * The error that occurred if deleting tax payment failed.
   * This is null if deletion was successful.
   */
  error?: Maybe<TaxPaymentError>;
  /**
   * The ID of the Tax Payment that was deleted.
   * This is null if deleting the Tax Payment failed.
   */
  id?: Maybe<Scalars['ID']['output']>;
};

/** input type for deleting a custom time off category */
export type DeleteTimeOffCategoryInput = {
  /** The unique identifier of the category to delete */
  categoryId: Scalars['ID']['input'];
};

/** Response payload for deleting a time off category */
export type DeleteTimeOffCategoryPayload = {
  __typename?: 'DeleteTimeOffCategoryPayload';
  /** The ID of the category that was successfully deleted */
  categoryId?: Maybe<Scalars['ID']['output']>;
  /** Any errors that occurred during the deletion */
  userError?: Maybe<TimeOffCategoryUserError>;
};

export type DeleteWorkLocationError = {
  __typename?: 'DeleteWorkLocationError';
  /** error code */
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  /** error type */
  type?: Maybe<Scalars['String']['output']>;
};

/** Input type for deleting a work location */
export type DeleteWorkLocationInput = {
  addressID: Scalars['ID']['input'];
  companyID: Scalars['ID']['input'];
};

export type DeleteWorkLocationPayload = {
  __typename?: 'DeleteWorkLocationPayload';
  addressID?: Maybe<Scalars['ID']['output']>;
  userError?: Maybe<DeleteWorkLocationError>;
};

export type Department = Node & {
  __typename?: 'Department';
  description?: Maybe<Scalars['String']['output']>;
  /** Id of the Department */
  id: Scalars['ID']['output'];
  /** Metamodel for updating department */
  metaModel: DepartmentMetaModel;
  name: Scalars['String']['output'];
};

/** A connection to a list of departments. */
export type DepartmentConnection = {
  __typename?: 'DepartmentConnection';
  edges?: Maybe<Array<Maybe<DepartmentEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type DepartmentConnectionFilter = {
  /** Filter to find departments whose name contains input string (case-insenstive search). */
  departmentName?: InputMaybe<NameFilter>;
};

/** Departments can be sorted based on the below fields */
export enum DepartmentConnectionOrderBy {
  NameAsc = 'name_ASC',
  NameDesc = 'name_DESC'
}

/** An edge in a connection. */
export type DepartmentEdge = {
  __typename?: 'DepartmentEdge';
  cursor: Scalars['String']['output'];
  /** The department item at the edge */
  node: Department;
};

export type DepartmentError = {
  __typename?: 'DepartmentError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** A connection for list of departments an employee is historically assigned to */
export type DepartmentHistoryConnection = {
  __typename?: 'DepartmentHistoryConnection';
  edges: Array<DepartmentHistoryEdge>;
  pageInfo: PageInfo;
};

/** An edge for an employee's department assignment */
export type DepartmentHistoryEdge = {
  __typename?: 'DepartmentHistoryEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<DepartmentHistoryNode>;
};

/** A node for an employee's department assignment effective during a specific period */
export type DepartmentHistoryNode = HistoryNode & {
  __typename?: 'DepartmentHistoryNode';
  /** end date when the department assignment is effective till */
  effectiveEndDate?: Maybe<Scalars['Date']['output']>;
  /** start date when the department assignment is effective from */
  effectiveStartDate: Scalars['Date']['output'];
  /** Date when the assignment was made */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** who made the assignment */
  updatedBy?: Maybe<HistoryNodeUpdatedBy>;
  /** Name of the department */
  value?: Maybe<Scalars['String']['output']>;
};

export type DepartmentMetaModel = MetaModel & {
  __typename?: 'DepartmentMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  name: MetaString;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type DependsOn = {
  __typename?: 'DependsOn';
  /** Reference to the dependency field, e.g: EmployerTaxSetup#agencyId */
  fieldRef: Scalars['String']['output'];
  /** The value of the fieldRef needs to match at least one of these values to meet the dependency */
  values: Array<Scalars['String']['output']>;
};

export type DirectDepositAccountHistory = {
  __typename?: 'DirectDepositAccountHistory';
  /** Flag to determine if the account is being currently used for direct deposit */
  active: Scalars['Boolean']['output'];
  /** Allocation of distribution based off of type and rate */
  allocation: EmployeePayDistributionAllocation;
  /**
   * The destination used for direct deposit. Type is intentionally set to Wallet instead of DistributionDestination
   * We don't want to expose bank info via this entity.
   */
  destination: Wallet;
};

/** Dates that represent the time of direct deposit events in the payroll run */
export type DirectDepositDateSummary = {
  __typename?: 'DirectDepositDateSummary';
  /** Represents the date when direct deposits withdrawal starts for the payroll run */
  initiationDate: Scalars['DateTime']['output'];
  /** Represents the date when direct deposits are deposited for the payroll run */
  settlementDate: Scalars['DateTime']['output'];
};

export type DirectDepositPayslipReversalDetail = {
  /** Payslip Id */
  payslipId: Scalars['ID']['input'];
  /** Reason for direct deposit payslip reversal */
  reversalReason: Scalars['String']['input'];
};

/** Union of possible types that DistributionDestination can return PayrollBankAccount or Wallet */
export type DistributionDestination = PayrollBankAccount | Wallet;

/** This input type provides the options for specifying a DistributionDestination, and all of the options are mutually exclusive. Must specify one and only one of the fields in the input, i.e. only one of the input fields should be non-null. */
export type DistributionDestinationInput = {
  /** Input for updating distribution to use an existing bank account, null otherwise */
  existingPayrollBankAccountId?: InputMaybe<Scalars['ID']['input']>;
  /** Input for updating distribution with a new bank account, null otherwise. Specifying this will create a new PayrollBankAccount for the associated employee. */
  newPayrollBankAccount?: InputMaybe<CreatePayrollBankAccountInput>;
  /** Input for updating distribution to use Wallet, null otherwise. */
  wallet?: InputMaybe<WalletInput>;
};

export type DistributionDestinationMetaModel = PayrollBankAccountMetaModel | WalletMetaModel;

/** Represents a document that is being stored in the system */
export type Document = {
  id: Scalars['ID']['output'];
  /** Identifies the type of the document. Eg: PASSPORT, I-94, SOCIAL_SECURITY_CARD */
  type: Scalars['String']['output'];
};

/** Input type for specifying which document to extract data from and which fields to extract */
export type DocumentAndFieldsToExtract = {
  /** The id for the document to be extracted */
  documentId: Scalars['ID']['input'];
  /** The extraction fields from the document */
  fieldsToExtract: Array<Scalars['String']['input']>;
};

/** Error for the document extraction */
export type DocumentExtractionError = {
  __typename?: 'DocumentExtractionError';
  /** Error code for mutation */
  code: Scalars['String']['output'];
  /** Error message for the mutation */
  message: Scalars['String']['output'];
  /** Type of error for the mutation */
  type: Scalars['String']['output'];
};

/**
 * Employer preferences related to Early Wage Access (EWA).
 * EWA is a product offered to employees so that they can access a percentage of their wages before their pay date
 */
export type EarlyWageAccessPreferences = {
  __typename?: 'EarlyWageAccessPreferences';
  /**
   * Employers are able to enable/disable Early Wage Access offers for their employees
   * @deprecated Use `newOffersAllowed` instead
   */
  enabled: Scalars['Boolean']['output'];
  /** Employers are able to enable/disable the ability to give new Early Wage Access offers for their employees */
  newOffersAllowed: Scalars['Boolean']['output'];
};

export type EditEmployeeTimeOffPoliciesInput = {
  editEmployeeTimeOffPolicyDetails: Array<EditEmployeeTimeOffPolicyDetailsInput>;
  employeeId: Scalars['ID']['input'];
};

export type EditEmployeeTimeOffPoliciesPayload = {
  __typename?: 'EditEmployeeTimeOffPoliciesPayload';
  /** The employer time off policies that were successfully created as a result of the mutation. */
  employerTimeOffPolicies?: Maybe<Array<EmployerTimeOffPolicy>>;
  /** The employee time off policies that were successfully updated as a result of the mutation. */
  timeOffPolicies?: Maybe<Array<EmployeeTimeOffPolicy>>;
  userError?: Maybe<TimeOffPolicyError>;
};

/** Input type to update an existing employee time off policy or create an employer policy and assign it to the employee policy. */
export type EditEmployeeTimeOffPolicyDetailsInput = {
  /** EmployerTimeOffPolicy details */
  employerTimeOffPolicy?: InputMaybe<EmployerTimeOffPolicyDetailsInput>;
  id: Scalars['ID']['input'];
  /** The total monetary amount that an employee has available to use for the given time off policy */
  monetaryBalance?: InputMaybe<MonetaryBalanceInput>;
  /** The total time that an employee has available to use for the given time off policy */
  timeBalance?: InputMaybe<TimeBalanceInput>;
};

/** Reusable filter for all requests that require data's state at a particular date. */
export type EffectiveDateFilter = {
  /** filters for record that were considered valid at the specific date */
  effectiveDate?: InputMaybe<Scalars['Date']['input']>;
};

/** Request parameters for defining the effective date range of an entity record. */
export type EffectiveDateRange = {
  /** The effective end date of the entity record. */
  effectiveEnd?: InputMaybe<Scalars['Date']['input']>;
  /** The effective start date of the entity record. */
  effectiveStart?: InputMaybe<Scalars['Date']['input']>;
};

/** Input for defining the effective date range of an entity. */
export type EffectiveDateRangeInput = {
  /** The effective end date of the entity record. If not provided, defaults to 01/01/3000. */
  effectiveEnd?: InputMaybe<Scalars['Date']['input']>;
  /** The effective start date of the entity record. If not provided, the change takes effect immediately. */
  effectiveStart?: InputMaybe<Scalars['Date']['input']>;
};

/** Response parameter to indicate in what date range the entity row is active */
export type EffectiveRange = {
  __typename?: 'EffectiveRange';
  /** The effective end date of the entity record. */
  endDate?: Maybe<Scalars['Date']['output']>;
  /** The effective start date of the entity record. */
  startDate?: Maybe<Scalars['Date']['output']>;
};

/** Defines Signing Status of a document */
export enum ElectronicServiceDocumentSignStatus {
  /** Form is signed */
  Complete = 'COMPLETE',
  /** Form is pending to be signed */
  Incomplete = 'INCOMPLETE',
  /** Form is not required for the tax payment group */
  NotRequired = 'NOT_REQUIRED'
}

export type ElectronicServiceDocumentSigningDetails = {
  __typename?: 'ElectronicServiceDocumentSigningDetails';
  /** List of forms to be signed */
  forms: Array<ElectronicServiceForm>;
  /** List of all signatories for the forms */
  signatories: Array<ElectronicServiceSignatory>;
  /** Status of the document type */
  status: ElectronicServiceDocumentSignStatus;
  /** Type of documents to be signed */
  type: ElectronicServiceDocumentType;
};

export enum ElectronicServiceDocumentType {
  /** Power of attorney related documents */
  PowerOfAttorney = 'POWER_OF_ATTORNEY'
}

export type ElectronicServiceForm = {
  __typename?: 'ElectronicServiceForm';
  /** Attributes associated with the form which varies from document. */
  attributes: Array<VariableTypeField>;
  /** Description of the document */
  description: Scalars['String']['output'];
  /** Name of the document */
  name: Scalars['String']['output'];
  /** URL to load the pdf document/image */
  url: Scalars['String']['output'];
};

/** Signatory information for the electronic service documents */
export type ElectronicServiceSignatory = {
  __typename?: 'ElectronicServiceSignatory';
  /** Business title of the signatory */
  businessTitle?: Maybe<Scalars['String']['output']>;
  /** Contact number of the signatory */
  contactNumber?: Maybe<Scalars['String']['output']>;
  /** Email of the signatory */
  email?: Maybe<Scalars['String']['output']>;
  /** Name of the signatory */
  firstName?: Maybe<Scalars['String']['output']>;
  /** Last name of the signatory */
  lastName?: Maybe<Scalars['String']['output']>;
  /** Unique identifier for the signatory */
  signatoryId?: Maybe<Scalars['String']['output']>;
  /** User ID of the signatory */
  userId?: Maybe<Scalars['String']['output']>;
};

export type ElectronicTaxFilingDetails = {
  __typename?: 'ElectronicTaxFilingDetails';
  /** The cutoff dateTime for Intuit to be able to make the e-filing to the agency, on time */
  cutoffDateTime?: Maybe<Scalars['DateTime']['output']>;
  /** Required by UK companies that are submitting a filing late to HMRC */
  lateReason?: Maybe<Scalars['String']['output']>;
};

export type ElectronicTaxPaymentDetails = {
  __typename?: 'ElectronicTaxPaymentDetails';
  /** The cutoff dateTime for Intuit to be able to make the e-payment on time to the agency */
  cutoffDateTime?: Maybe<Scalars['DateTime']['output']>;
  /** The soonest date on which this payment can be made electronically */
  earliestAvailablePaymentDate?: Maybe<Scalars['Date']['output']>;
  /** The latest date on which this payment can be made electronically */
  latestAvailablePaymentDate?: Maybe<Scalars['Date']['output']>;
  /**
   * A list of specific dates that the payment cannot be made,
   * falling between the earliest and latest available dates, i.e bank holidays.
   */
  unavailablePaymentDates: Array<Scalars['Date']['output']>;
  /** The date the customer's bank account will be debited/was debited */
  withdrawalDate?: Maybe<Scalars['Date']['output']>;
  /** Provides a preview of when would a customer's bank account will be debited for the specified payment date */
  withdrawalDatePreview?: Maybe<WithdrawalDatePreviewResult>;
};


export type ElectronicTaxPaymentDetailsWithdrawalDatePreviewArgs = {
  input: WithdrawalDatePreviewInput;
};

/** Define the structure for the Email Address object */
export type EmailAddress = {
  __typename?: 'EmailAddress';
  email?: Maybe<Scalars['String']['output']>;
};

export type EmailAddressInput = {
  email?: InputMaybe<Scalars['String']['input']>;
};

export type EmailAddressMetaModel = MetaModel & {
  __typename?: 'EmailAddressMetaModel';
  applicable: Scalars['Boolean']['output'];
  email: MetaString;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
  usageType: MetaEnum;
};

/** Identifies the type of email notification and if it is enabled or disabled */
export type EmailNotification = {
  __typename?: 'EmailNotification';
  /** Whether the notification is enabled or disabled */
  enabled: Scalars['Boolean']['output'];
  /** Type of notification. Ex. AutoPayroll, DirectDeposit */
  notificationType: Scalars['String']['output'];
};


/** Identifies the type of email notification and if it is enabled or disabled */
export type EmailNotificationNotificationTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** Email notification channel used for email notifications */
export type EmailNotificationChannel = {
  __typename?: 'EmailNotificationChannel';
  /** Different email notifications attached to this notification channel. Ex. DirectDeposit, AutoPayroll */
  emailNotifications: Array<EmailNotification>;
  /** Email address to be used for the notifications */
  primaryEmail: Scalars['String']['output'];
};

/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type Employee = EntityInterface & Node & Worker & {
  __typename?: 'Employee';
  /** EmployeeAccess represents the user that is associated with the employee */
  access?: Maybe<EmployeeAccess>;
  /** Accounting preferences for this employee. */
  accountingPreference: EmployeeAccountingPreference;
  /** Represents employee's auto payroll enrollment details */
  autoPayrollSetup: EmployeeAutoPayrollSetup;
  /** The benefits associated with this employee */
  benefits?: Maybe<Array<EmployeeBenefit>>;
  /** @deprecated Use dateOfBirth with sensitized argument instead of birthDate */
  birthDate?: Maybe<Scalars['Date']['output']>;
  company: Company;
  /** The compensations associated with this employee */
  compensations?: Maybe<Array<EmployeeCompensation>>;
  /** Contact information for an employee */
  contactInfo?: Maybe<Payroll_Employee_ContactInfo>;
  /** Contractual information about an employee (salary, contract pay type contracted hours, pay fequency) */
  contractDetail?: Maybe<Payroll_Employee_EmployeeContractDetails>;
  /** Current leave that the employee is on */
  currentLeavePeriod?: Maybe<EmployeeLeavePeriod>;
  dateOfBirth?: Maybe<SensitizableDate>;
  /** The miscellaneous deductions associated with this employee */
  deductions?: Maybe<Array<EmployeeMiscDeduction>>;
  /**
   * Determine whether the employee is marked as deleted
   * Allows for soft deletion of employees
   */
  deleted?: Maybe<Scalars['Boolean']['output']>;
  /** Departments that an employee works for */
  departments: Array<Department>;
  /**
   * Employee's direct deposit account history.
   * This lists the accounts/wallets used for direct deposit.
   * The active flag indicates if the account/wallet is currently being used for direct deposit.
   * At present, IOP can accommodate a maximum of two direct deposit accounts per employee.
   */
  directDepositAccounts?: Maybe<Array<Maybe<DirectDepositAccountHistory>>>;
  displayName?: Maybe<Scalars['String']['output']>;
  /** A list of all of an employees pay distributions */
  distributions: Array<Payroll_Employee_EmployeePayDistribution>;
  /** EmergencyContacts for this employee */
  emergencyContacts: Array<EmployeeEmergencyContact>;
  employeeContractDetail?: Maybe<EmployeeContractDetails>;
  /** Represents an employee's payroll run */
  employeePayrollRuns: Array<EmployeePayrollRun>;
  /** Type representing fields pretaining to employee setup */
  employeeSetup?: Maybe<EmployeeSetup>;
  /** Notes maintained by employer for each employee */
  employerNotes?: Maybe<Scalars['String']['output']>;
  employerPaySchedule?: Maybe<EmployerPaySchedule>;
  /** This field defines details related to the employee's most recent employment, whether they are still employed or not. */
  employmentDetail?: Maybe<Payroll_Employee_EmploymentDetail>;
  /** Represents the employment eligibility of the employee */
  employmentEligibility?: Maybe<EmploymentEligibility>;
  /** Active or Inactive Status of the employee and detailed status */
  employmentStatus?: Maybe<Payroll_Employee_EmploymentStatus>;
  externalIds?: Maybe<Array<Maybe<Common_ExternalId>>>;
  /** @deprecated Feature groups as a concept is being deprecated in favor of explicit modeling of features. EX: EmployeeAccess */
  featureGroups?: Maybe<Array<EmployeeFeatureGroup>>;
  firstName?: Maybe<Scalars['String']['output']>;
  /** The garnishments associated with this employee */
  garnishmentDetails?: Maybe<EmployeeGarnishmentDetails>;
  /**
   * Gender of the employee, supported by payroll and Fedrally recognized
   * Male,
   * Female,
   * Other
   */
  gender?: Maybe<Scalars['String']['output']>;
  /** Determine whether the employee will be returned only if specifically queried for */
  hidden?: Maybe<Scalars['Boolean']['output']>;
  history?: Maybe<History>;
  /** @deprecated Use `Payroll_Employee_ContactInfo.homeAddress` instead */
  homeAddress?: Maybe<Common_Address>;
  honorific?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Determine whether the employee is 18 yrs old or not */
  isEighteenYearsOld?: Maybe<Scalars['Boolean']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  /** Fetch a leave period by its ID */
  leavePeriod?: Maybe<EmployeeLeavePeriod>;
  /** List of all the employee leave periods */
  leavePeriods?: Maybe<Array<EmployeeLeavePeriod>>;
  /** Legal sex of the employee, used for benefits */
  legalSex?: Maybe<Scalars['String']['output']>;
  /** Manager of an employee */
  manager?: Maybe<Employee>;
  /** Employee level Info/Warning/Blocker messages */
  messages: Array<Message>;
  meta?: Maybe<Common_Metadata>;
  /** Metamodel representing fields with multiple allowed values for Employee Setup */
  metaModel: EmployeeMetaModel;
  middleInitial?: Maybe<Scalars['String']['output']>;
  /** Additional tax information thats reported on at an employee level */
  miscTaxReporting: MiscTaxReporting;
  otherLastNames: Array<Scalars['String']['output']>;
  payDistributions: Array<EmployeePayDistribution>;
  payHistory?: Maybe<EmployeePayHistory>;
  /**
   * [/payroll/employer/EmployerPaySchedule](https://schema.intuit.com/#data:/payroll/employer/EmployerPaySchedule)
   * A definition of when employees are paid
   * @deprecated Use `employerPaySchedule` field instead
   */
  paySchedule?: Maybe<Payroll_Employer_PaySchedule>;
  /** The payroll corrections associated with this employee */
  payrollCorrections?: Maybe<Array<EmployeePayrollCorrection>>;
  /**
   * Employment active period information for payroll processing.
   * Provides essential information about when an employee was active.
   * This field works in conjunction with the activeInDateRange filter.
   */
  payrollEmploymentActivePeriod?: Maybe<PayrollEmploymentActivePeriod>;
  payslipDisplayName?: Maybe<Scalars['String']['output']>;
  payslips?: Maybe<EmployeePayslipConnection>;
  /** Attributes for employee pension details */
  pensionEnrollment?: Maybe<EmployeePensionEnrollment>;
  /** The pensions associated with this employee */
  pensions?: Maybe<Array<EmployeePension>>;
  preferences: EmployeePreferences;
  preferredFirstName?: Maybe<Scalars['String']['output']>;
  /** This field defines the information related to the employee's previous employment */
  previousEmployment?: Maybe<EmployeePreviousEmployment>;
  /** @deprecated Invitation status will no longer be modeled in GAS, interaction with invitations will be made with EmployeeAccessInvitation invitationId and IUS directly */
  productInvitations?: Maybe<Array<EmployeeProductInvitation>>;
  /** Employee's profile picture documents */
  profilePictures?: Maybe<Array<Picture>>;
  /** Show readiness in relation with different payroll stages like be able to pay or include the employee in filings */
  readiness?: Maybe<Payroll_Employee_EmployeeReadiness>;
  taxFilings?: Maybe<EmployeeTaxFilingConnection>;
  /**
   * The identifiers for this employee that are used when filing taxes, e.g. Social Security Number (SSN) for US, or
   * Social Insurance Number (SIN) for CA. By default the values are sensitized (partially obfuscated) to protect privacy,
   * but the full plain text value can be requested by specifying through the argument.
   */
  taxIdentifiers?: Maybe<Array<VariableStringField>>;
  /** Employee's tax setup related information for each jurisdiction. */
  taxSetups: Array<EmployeeTaxSetup>;
  /** Employee time off policies dictate the available balances of time an employee can take towards each time off policies set by the employer */
  timeOffPolicies?: Maybe<Array<EmployeeTimeOffPolicy>>;
  version?: Maybe<Scalars['String']['output']>;
  /** Current workers compensation class for an employee */
  workersCompensationClass?: Maybe<EmployeeWorkersCompensationClass>;
  /** List representing workers' compensation policies assigned to an employee */
  workersCompensationClasses?: Maybe<Array<Maybe<EmployeeWorkersCompensationClass>>>;
};


/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type EmployeeCompensationsArgs = {
  filterBy?: InputMaybe<EffectiveDateFilter>;
};


/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type EmployeeDateOfBirthArgs = {
  sensitized?: InputMaybe<Scalars['Boolean']['input']>;
};


/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type EmployeeEmployeeContractDetailArgs = {
  filterBy?: InputMaybe<EffectiveDateFilter>;
};


/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type EmployeeEmployeePayrollRunsArgs = {
  filterBy?: InputMaybe<EmployeePayrollRunFilter>;
};


/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type EmployeeEmploymentEligibilityArgs = {
  input?: InputMaybe<EmploymentEligibilityInput>;
};


/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type EmployeeHistoryArgs = {
  filterBy?: InputMaybe<HistoryFilter>;
};


/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type EmployeeLeavePeriodArgs = {
  id: Scalars['ID']['input'];
};


/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type EmployeeMessagesArgs = {
  filterBy?: InputMaybe<CategorizedMessageFilter>;
};


/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type EmployeePayslipsArgs = {
  filterBy?: InputMaybe<EmployeePayslipConnectionFilter>;
  orderBy?: InputMaybe<Array<EmployeePayslipsOrderBy>>;
  pagination?: InputMaybe<PaginationInput>;
};


/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type EmployeeTaxFilingsArgs = {
  filterBy?: InputMaybe<EmployeeTaxFilingConnectionFilter>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type EmployeeTaxIdentifiersArgs = {
  sensitized?: InputMaybe<Scalars['Boolean']['input']>;
};


/** [/Employee](https://schema.intuit.com/#data:/network/relationships/Employee) */
export type EmployeeTimeOffPoliciesArgs = {
  filterBy?: InputMaybe<TimeOffPolicyFilter>;
};

/** EmployeeAccess represents the user that is associated with the employee */
export type EmployeeAccess = {
  __typename?: 'EmployeeAccess';
  /**
   * digitalIdentityId associated with the employee
   * This is populated when an invitation is accepted for the worker portal
   */
  digitalIdentityId?: Maybe<Scalars['String']['output']>;
  /**
   * legacyAuthId is the userId associated with the employee
   * This is populated when an invitation is accepted for the worker portal
   * @deprecated Use digitalIdentityId instead
   */
  legacyAuthId?: Maybe<Scalars['String']['output']>;
  /**
   * profileId of the user, this profileId is used to determine which profile and roles are associated with the user
   * This is populated when an invitation is sent
   */
  profileId?: Maybe<Scalars['String']['output']>;
};

/** Contains information on payroll accounting preferences for an employee to track payroll transactions. */
export type EmployeeAccountingPreference = {
  __typename?: 'EmployeeAccountingPreference';
  /** Indicates the class preference for the employee. */
  class?: Maybe<AccountingCategorizationClass>;
};

/**
 * Filter for employees who are active for  at least one day in the given date range.
 * This filter is designed for effective dating active employee list for run payroll and does not work in conjunction with other filters in the target state.
 */
export type EmployeeActiveDateRangeFilter = {
  /**
   * The end date of the range to check for active employees (inclusive).
   * On the last day of termination, employee is considered as active.
   * If not provided, defaults to the latest possible date.
   */
  endDate?: InputMaybe<Scalars['Date']['input']>;
  /**
   * The start date of the range to check for active employees (inclusive).
   * If not provided, defaults to the earliest possible date.
   */
  startDate?: InputMaybe<Scalars['Date']['input']>;
};

/**
 * Employee Annual Payroll Summary report to show taxes and deductions for the employee in a given tax year
 * (eg: UK P11 report)
 */
export type EmployeeAnnualPayrollSummaryReport = {
  __typename?: 'EmployeeAnnualPayrollSummaryReport';
  renderings?: Maybe<EmployeeAnnualPayrollSummaryReportRenderings>;
};

/** Employee Annual Payroll Summary report employee filter which takes in a employee id to generate the document. */
export type EmployeeAnnualPayrollSummaryReportEmployeeFilter = {
  employeeId: IdFilter;
};

/** Employee Annual Payroll Summary report is filtered by employee id and tax year because this report is a per employee per tax year report. */
export type EmployeeAnnualPayrollSummaryReportFilter = {
  dateFilter: ReportTaxYearRangeFilter;
  employee: EmployeeAnnualPayrollSummaryReportEmployeeFilter;
};

/** Input fields for Employee Annual Payroll Summary report */
export type EmployeeAnnualPayrollSummaryReportInput = {
  /** Specifies the fields required to generate the document */
  filterBy: EmployeeAnnualPayrollSummaryReportFilter;
};

/** Employee Annual Payroll Summary report rendering detail */
export type EmployeeAnnualPayrollSummaryReportRenderings = {
  __typename?: 'EmployeeAnnualPayrollSummaryReportRenderings';
  excel: FileRendering;
};

/** Defines if the employee is ready to be paid automatically or not. */
export type EmployeeAutoPayrollReadiness = Readiness & {
  __typename?: 'EmployeeAutoPayrollReadiness';
  deficiencies: Array<AcuteReadinessDeficiency>;
  ready: Scalars['Boolean']['output'];
};

/** Represents employee's auto payroll enrollment details */
export type EmployeeAutoPayrollSetup = {
  __typename?: 'EmployeeAutoPayrollSetup';
  /** Provides preview of PayrollRunDates for next unscheduled AutoPayroll run */
  autoPayrollRunDateSummaryPreview?: Maybe<AutoPayrollRunDateSummaryPreview>;
  /** Employee associated with this auto payroll */
  employee: Employee;
  /** Determines if an employee is currently enrolled for AutoPayroll */
  enrolled: Scalars['Boolean']['output'];
  /** Determines if employee has ever been enrolled for AutoPayroll */
  previouslyEnrolled: Scalars['Boolean']['output'];
  /** Represents the date when employee's AutoPayroll would start */
  startDate?: Maybe<Scalars['DateTime']['output']>;
};

/** A benefit associated with this employee */
export type EmployeeBenefit = ContributiveDeduction & EmployeeDeduction & Node & {
  __typename?: 'EmployeeBenefit';
  /** Whether this benefit is currently active */
  active: Scalars['Boolean']['output'];
  /** The employer deduction item associated with this benefit */
  deductionPolicy: DeductionPolicy;
  /** Employee's contribution to benefits */
  employeeContribution?: Maybe<EmployeeContribution>;
  /** Company's contribution to benefits */
  employerContribution?: Maybe<EmployerContribution>;
  id: Scalars['ID']['output'];
  /**
   * Information related to tax reporting for employee's benefit. For example, in US, use this for reporting
   * fields on employee's W-2 that are not derivable from existing benefits data.
   */
  taxReportingInfo?: Maybe<TaxReportingInfo>;
};

/** Additional ways of providing pay to employees */
export type EmployeeCompensation = {
  __typename?: 'EmployeeCompensation';
  /** Whether this compensation is currently active */
  active: Scalars['Boolean']['output'];
  /** Effective range for which this record is active */
  effective?: Maybe<EffectiveRange>;
  /** The employer compensation item associated with this compensation */
  employerCompensation: EmployerCompensation;
  id: Scalars['ID']['output'];
  /** The money rate this compensation is paid with */
  rate?: Maybe<PayRate>;
};

/**
 * Account selected for export of employee compensation expenses. Input can be specified as one of the following:
 * Account selected may be specified as a single account for all transactions, or by employee, or by pay type.
 * This is a one-of tagged union type acting as an input union, one and only one of these fields must be non-null.
 */
export type EmployeeCompensationExpensesAccountMappingCurrentPreferenceInput = {
  /** updates the mode to BY_EMPLOYEE and sets the account mapping for each employee. */
  accountsByEmployee?: InputMaybe<Array<EmployeeToAccountMappingInput>>;
  /** updates the mode to BY_PAY_TYPE and sets the account mapping for each pay type. */
  accountsByPayType?: InputMaybe<Array<EmployerCompensationToAccountMappingInput>>;
  /** updates the mode to ONE_ACCOUNT and sets the same account for all employee compensation expense transactions. */
  singleAccountName?: InputMaybe<Scalars['String']['input']>;
};

export type EmployeeCompensationExpensesAccountMappingSelectedDetail = {
  __typename?: 'EmployeeCompensationExpensesAccountMappingSelectedDetail';
  /** specifies the account mapping for the selected mode which can be any one of - one account, by employee or by pay type. */
  accountMapping: EmployeeCompensationExpensesToAccountMappingPreference;
  /** employee compensation account mapping may be to one account, or categorized by employee or by pay type. */
  mode: EmployeeCompensationExpensesToAccountMappingMode;
};

/**
 * Account selected for export of employee compensation expenses.
 * Account mapping may be chosen as one account for all expenses, or categorized as by employee or by pay type.
 */
export type EmployeeCompensationExpensesToAccountMapping = {
  __typename?: 'EmployeeCompensationExpensesToAccountMapping';
  byEmployee?: Maybe<EmployeeCompensationExpensesToAccountMappingByEmployee>;
  byPayType?: Maybe<EmployeeCompensationExpensesToAccountMappingByPayType>;
  /** specifies the account mapping mode selected and expense to account mappings for the selected mode. */
  currentPreference: EmployeeCompensationExpensesAccountMappingSelectedDetail;
  oneAccount?: Maybe<EmployeeCompensationExpensesToAccountMappingOneAccount>;
};

export type EmployeeCompensationExpensesToAccountMappingByEmployee = {
  __typename?: 'EmployeeCompensationExpensesToAccountMappingByEmployee';
  /** Account selected for export of employee compensation expenses categorized by employee. */
  accountsByEmployee: Array<EmployeeToAccountMapping>;
};

export type EmployeeCompensationExpensesToAccountMappingByPayType = {
  __typename?: 'EmployeeCompensationExpensesToAccountMappingByPayType';
  /** Account selected for export of employee compensation expenses categorized by pay type. */
  accountsByPayType: Array<EmployerCompensationToAccountMapping>;
};

/** Account selected for export of employee compensation expenses. */
export type EmployeeCompensationExpensesToAccountMappingInput = {
  currentPreference: EmployeeCompensationExpensesAccountMappingCurrentPreferenceInput;
};

/** Employee Compensation account mapping may be to one account, or categorized by employee or by pay type. */
export enum EmployeeCompensationExpensesToAccountMappingMode {
  ByEmployee = 'BY_EMPLOYEE',
  ByPayType = 'BY_PAY_TYPE',
  OneAccount = 'ONE_ACCOUNT'
}

export type EmployeeCompensationExpensesToAccountMappingOneAccount = {
  __typename?: 'EmployeeCompensationExpensesToAccountMappingOneAccount';
  /** Account selected for export of employee compensation expenses */
  account: LedgerAccount;
};

export type EmployeeCompensationExpensesToAccountMappingPreference = EmployeeCompensationExpensesToAccountMappingByEmployee | EmployeeCompensationExpensesToAccountMappingByPayType | EmployeeCompensationExpensesToAccountMappingOneAccount;

/** A connection for list of a compensation history for an employee */
export type EmployeeCompensationHistoryConnection = {
  __typename?: 'EmployeeCompensationHistoryConnection';
  edges: Array<EmployeeCompensationHistoryEdge>;
  pageInfo: PageInfo;
};

/** An edge for an employee's compensations assignment */
export type EmployeeCompensationHistoryEdge = {
  __typename?: 'EmployeeCompensationHistoryEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<EmployeeCompensationHistoryNode>;
};

/** A node for an employee's compensation effective during a specific period */
export type EmployeeCompensationHistoryNode = HistoryNode & {
  __typename?: 'EmployeeCompensationHistoryNode';
  /** end date when the pay contract assignment is effective till */
  effectiveEndDate?: Maybe<Scalars['Date']['output']>;
  /** start date when the pay contract assignment is effective from */
  effectiveStartDate: Scalars['Date']['output'];
  /** Date when the assignment was made */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** User or the system who made the assignment */
  updatedBy?: Maybe<HistoryNodeUpdatedBy>;
  /** details of the employee compensation */
  value?: Maybe<EmployeeCompensation>;
};

/**
 * Eventually we could add employerCompensation in the EmployeeCompensationInput,
 * so that we could support creating/updating multiple employerCompensations in one request.
 */
export type EmployeeCompensationInput = {
  /**
   * Whether this compensation is currently active.
   *
   * Note: With the batch create and update employee compensation mutation being one mutation,
   * we need to avoid the scenario of creating an employee compensation with active being false.
   * In the case where the existingEmployeeCompensationId is not present (indicating a create) AND active is false,
   * an error will be thrown back to the user of the mutation that creating an inactive compensation is not allowed.
   */
  active?: InputMaybe<Scalars['Boolean']['input']>;
  /** The associated rate for this compensation */
  rate?: InputMaybe<PayRateInput>;
};

export type EmployeeCompensationMetaModel = MetaModel & {
  __typename?: 'EmployeeCompensationMetaModel';
  applicable: Scalars['Boolean']['output'];
  dependsOn: Array<DependsOn>;
  employerCompensation: EmployerCompensationMetaModel;
  label: Scalars['String']['output'];
  rate: PayRateMetaModel;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Represents a singular grouping of EmployeeCompensationSplitDetail and the associated hours and/or amount associated with it. */
export type EmployeeCompensationSplit = {
  __typename?: 'EmployeeCompensationSplit';
  /** Split amount of Money for this single EmployeeCompensationSplit of compensation. */
  amount?: Maybe<Scalars['Money']['output']>;
  /** Number of hours for this single EmployeeCompensationSplit of compensation. */
  hours?: Maybe<Scalars['Float']['output']>;
  id: Scalars['ID']['output'];
  /** The list of splitDetails specified here compose a singular EmployeeCompensationSplit. The hours and/or amount associated with this singular EmployeeCompensationSplit are allocated to every single splitDetails in this list of EmployeeCompensationSplitDetail. */
  splitDetails: Array<EmployeeCompensationSplitDetail>;
  /** Split percentage of the employeeCompensationSplit is the weight of this employeeCompensationSplit within a list of employeeCompensationSplits. The total sum of % across a list of employeeCompensationSplits should not exceed 100. If the total sum of % is below 100, then the remaining % is deemed unallocated. */
  splitPercentage?: Maybe<Scalars['Float']['output']>;
};

/** Represents a specific spiltDetails to be used in the accounting. Examples of spiltType in accounting are project, customer, service, class, etc. Not all EmployeeCompensationSplitData in accounting are supported - please see DataType enum for list of supported dattypes. */
export type EmployeeCompensationSplitDetail = {
  __typename?: 'EmployeeCompensationSplitDetail';
  /** Alternate ID for the compensation split data */
  compensationSplitAlternateId?: Maybe<Scalars['String']['output']>;
  /** ID of the dimension */
  dimensionId?: Maybe<Scalars['String']['output']>;
  /** External ids of this employeeCompensationSplitData */
  externalId: Array<Common_ExternalId>;
  splitType: CompensationSplitType;
};

/** Represents the necessary input for to store a singular EmployeeCompensationSplitData. */
export type EmployeeCompensationSplitDetailInput = {
  /** Alternate ID for the compensation split data */
  compensationSplitAlternateId?: InputMaybe<Scalars['String']['input']>;
  /** ID of the dimension */
  dimensionId?: InputMaybe<Scalars['String']['input']>;
  /** This is external id for the tag */
  externalId: Array<Common_ExternalIdInput>;
  /** CompensationSplitType is an enum that specifies the field. Please see CompensationSplitType for full list of supported types. */
  splitType: CompensationSplitType;
};

/** Represents a spilt of employeeCompensationSplitData of the employeeCompensationSplitInput(for e.g. during a specific payroll run or on payslip) */
export type EmployeeCompensationSplitInput = {
  /** Split amount of Money for this single EmployeeCompensationSplit of compensation. */
  amount?: InputMaybe<Scalars['Money']['input']>;
  /** The list of employeeCompensationSplitData specified here compose a singular employeeCompensationSplit. The hours and/or amount associated with this singular employeeCompensationSplit are allocated to every single employeeCompensationSplitData in this list of employeeCompensationSplitDatas. */
  compensationSplitDetails: Array<EmployeeCompensationSplitDetailInput>;
  /** Number of hours for this single employeeCompensationSplit of compensation. */
  hours?: InputMaybe<Scalars['Float']['input']>;
  /** Id field is required when upating existing compensationSpilt but if it is a new spilt that is getting assigned then we won't need this field. */
  id?: InputMaybe<Scalars['ID']['input']>;
  /** Split percentage of the employeeCompensationSplit is the weight of this employeeCompensationSplit within a list of employeeCompensationSplits. The total sum of % across a list of EmployeeCompensationSplits should not exceed 100. If the total sum of % is below 100, then the remaining % is deemed unallocated. */
  splitPercentage?: InputMaybe<Scalars['Float']['input']>;
};

/** A connection for list of compensations and their history for an employee historically assigned to */
export type EmployeeCompensationsHistory = {
  __typename?: 'EmployeeCompensationsHistory';
  history?: Maybe<EmployeeCompensationHistoryConnection>;
  id: Scalars['ID']['output'];
};


/** A connection for list of compensations and their history for an employee historically assigned to */
export type EmployeeCompensationsHistoryHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

export type EmployeeConnection = {
  __typename?: 'EmployeeConnection';
  edges: Array<EmployeeEdge>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type EmployeeConnectionFilter = {
  /**
   * "
   * Filter for employees that have a user associated with them
   */
  access?: InputMaybe<AccessFilter>;
  /**
   * Filter to find employees who are active for at least one day in the given date range.
   * Note: This filter is designed for effective dating active employee list for run payroll use case and does not work in conjunction with other filters in the target state.
   */
  activeInDateRange?: InputMaybe<EmployeeActiveDateRangeFilter>;
  /** Filter employees whose birthday (month+day) falls within the given date range. */
  birthdayRange?: InputMaybe<BirthdayRangeFilter>;
  /** If not provided, employees will not be filtered by contract pay type */
  contractPayType?: InputMaybe<ContractPayType>;
  employeeId?: InputMaybe<IdFilter>;
  /** Filter to find employees whose firstname / lastname contains input string (case-insenstive search). */
  employeeName?: InputMaybe<NameFilter>;
  employmentStatus?: InputMaybe<EmploymentStatusFilter>;
  /**
   * Filter employees whose hire date anniversary (month+day) falls within the given date range.
   * Excludes employees hired less than one year ago.
   */
  hireDateRange?: InputMaybe<HireDateRangeFilter>;
  /** Filter to find employees in EMS with isHidden set to true/false */
  isHidden?: InputMaybe<Scalars['Boolean']['input']>;
  paySchedule?: InputMaybe<PayScheduleFilter>;
  preset?: InputMaybe<EmployeesForChecksFilterPreset>;
  workLocation?: InputMaybe<WorkLocationFilter>;
};

/** Employees can be sorted based on the below fields */
export enum EmployeeConnectionOrderBy {
  BirthDateAsc = 'birthDate_ASC',
  BirthDateDesc = 'birthDate_DESC',
  DisplayNameAsc = 'displayName_ASC',
  DisplayNameDesc = 'displayName_DESC',
  EmploymentDetailHireDateAsc = 'employmentDetail__hireDate_ASC',
  EmploymentDetailHireDateDesc = 'employmentDetail__hireDate_DESC',
  FirstNameAsc = 'firstName_ASC',
  FirstNameDesc = 'firstName_DESC',
  LastNameAsc = 'lastName_ASC',
  LastNameDesc = 'lastName_DESC',
  /** sort by manager's first name in descending alphabetical order with unassigned manager being sorted first */
  ManagerFirstNameUnassignedFirstAsc = 'manager__firstName_unassignedFirst_ASC',
  ManagerFirstNameUnassignedFirstDesc = 'manager__firstName_unassignedFirst_DESC'
}

export type EmployeeContractDetails = {
  __typename?: 'EmployeeContractDetails';
  /** Statutory type (e.g. SALARY) for the main way in which the employee is contracted to earn pay, e.g. as a condition of the employment itself (a salary), or based on hours worked or some other condition. */
  contractPayType: ContractPayType;
  /** Effective range for which this record is active */
  effective?: Maybe<EffectiveRange>;
  /** Defines the contracted time values such as hours per week and working days of the week */
  employeeWeeklyWorkSchedule?: Maybe<EmployeeWeeklyWorkSchedule>;
  /** The employer compensation id associated with the assigned contract */
  employerCompensationId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  /** Metamodel representing fields with multiple allowed values for EmployeeContractDetails */
  metaModel: EmployeeContractDetailsMetaModel;
  /** The pay rate this contract is paid with */
  payRate?: Maybe<PayRate>;
  /**
   * Defines the contracted time values such as hours per day and days per week
   * @deprecated Use `EmployeeWeeklyWorkSchedule > WeeklyContractedHours` field instead
   */
  weeklyContractedTime?: Maybe<WeeklyContractedTime>;
};

export type EmployeeContractDetailsMetaModel = MetaModel & {
  __typename?: 'EmployeeContractDetailsMetaModel';
  applicable: Scalars['Boolean']['output'];
  contractPayType: MetaEnum;
  label: Scalars['String']['output'];
  payRate: PayRateMetaModel;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
  /** @deprecated Use `EmployeeWeeklyWorkScheduleMetaModel > WeeklyContractedHoursMetaModel` field instead */
  weeklyContractedTime?: Maybe<WeeklyContractedTimeMetaModel>;
};

export type EmployeeContractError = {
  __typename?: 'EmployeeContractError';
  code?: Maybe<Scalars['String']['output']>;
  employeeId?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Describes the contribution amount and cappings contributed by employee i.e. deducted from employee's paycheck */
export type EmployeeContribution = {
  __typename?: 'EmployeeContribution';
  /** Amount that is contributed by employee for any given deduction */
  amount: Rate;
  /** Capping details that is contributed by employee for any given deduction */
  capping?: Maybe<Capping>;
  /** The frequency for the employee contribution */
  frequency: ContributionFrequency;
};

/** Includes current and total amounts contributed by employee to a deduction for the specific time period */
export type EmployeeContributionAccumulationAmount = AccumulationAmount & {
  __typename?: 'EmployeeContributionAccumulationAmount';
  /** Monetary amount contributed by the employee for a deduction (for e.g. during a specific payroll run or payslip) */
  currentAmount: Scalars['Money']['output'];
  /** Total monetary amount contributed by the employee for a deduction */
  toDateAmounts: Array<ToDateAmount>;
};

/** Metamodel to represent current and total amounts contributed by employee to a deduction for time period */
export type EmployeeContributionAccumulationAmountMetaModel = MetaModel & {
  __typename?: 'EmployeeContributionAccumulationAmountMetaModel';
  applicable: Scalars['Boolean']['output'];
  currentAmount: MetaMoney;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  toDateAmounts: Array<ToDateAmountMetaModel>;
  typeRef: Scalars['String']['output'];
};

export type EmployeeContributionMetaModel = MetaModel & {
  __typename?: 'EmployeeContributionMetaModel';
  /** The metamodels for amount contributed by the employee */
  amount: RateMetaModel;
  applicable: Scalars['Boolean']['output'];
  /** The metamodels for cappings in employee contribution */
  capping: CappingMetaModel;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Includes the details for a deduction specific to an employee */
export type EmployeeDeduction = {
  /** Whether this deduction is currently active */
  active: Scalars['Boolean']['output'];
  /** The employer deduction item associated with this deduction */
  deductionPolicy: DeductionPolicy;
};

export type EmployeeDeductionMetaModel = MetaModel & {
  __typename?: 'EmployeeDeductionMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** The metamodels for this deduction policy */
  deductionPolicy: DeductionPolicyMetaModel;
  /** The metamodels for employee contribution */
  employeeContribution: EmployeeContributionMetaModel;
  /** The metamodels for employer contribution */
  employerContribution: EmployerContributionMetaModel;
  label: Scalars['String']['output'];
  policyPlan?: Maybe<MetaEnum>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type EmployeeDepartmentMetaModel = MetaModel & {
  __typename?: 'EmployeeDepartmentMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Employee Details Report with report data rendering detail */
export type EmployeeDetailsReport = {
  __typename?: 'EmployeeDetailsReport';
  employees?: Maybe<PayrollReportEmployeeConnection>;
  renderings?: Maybe<EmployeeDetailsReportRenderings>;
};


/** Employee Details Report with report data rendering detail */
export type EmployeeDetailsReportEmployeesArgs = {
  pagination?: InputMaybe<PaginationInput>;
};

/** Optional fields can be excluded for employee details report excel rendering */
export enum EmployeeDetailsReportExcelOptionalField {
  BirthDate = 'BIRTH_DATE',
  Gender = 'GENDER',
  HireDate = 'HIRE_DATE',
  HomeAddress = 'HOME_ADDRESS',
  Notes = 'NOTES',
  PayInfo = 'PAY_INFO',
  TaxInfo = 'TAX_INFO',
  WorkLocation = 'WORK_LOCATION'
}

/** Input fields for employee details report excel rendering */
export type EmployeeDetailsReportExcelRenderInput = {
  /** Specifies the optional fields that can additionally be excluded in the excel file rendering */
  excludedFields?: InputMaybe<Array<EmployeeDetailsReportExcelOptionalField>>;
  /**
   * Specifies the fields with order for sorting the records in the excel document
   * When no order by is provided, employees will be sorted by last name in ascending order
   */
  orderBy?: InputMaybe<EmployeeDetailsReportOrderBy>;
};

/** Employee details report can be filtered by employee id, employment status and work location */
export type EmployeeDetailsReportFilter = {
  employeeId?: InputMaybe<IdFilter>;
  employmentStatus?: InputMaybe<EmploymentStatusFilter>;
  workLocationId?: InputMaybe<IdFilter>;
  workersCompensationClass?: InputMaybe<StringFilter>;
};

/** Input filter for employee directory report */
export type EmployeeDetailsReportInput = {
  filterBy: EmployeeDetailsReportFilter;
  orderBy?: InputMaybe<EmployeeDetailsReportOrderBy>;
};

export enum EmployeeDetailsReportOrderBy {
  BirthDateAsc = 'birthDate_ASC',
  BirthDateDesc = 'birthDate_DESC',
  EmploymentDetailEmploymentStatusActiveAsc = 'employmentDetail__employmentStatus__active_ASC',
  EmploymentDetailEmploymentStatusActiveDesc = 'employmentDetail__employmentStatus__active_DESC',
  EmploymentDetailHireDateAsc = 'employmentDetail__hireDate_ASC',
  EmploymentDetailHireDateDesc = 'employmentDetail__hireDate_DESC',
  FirstNameAsc = 'firstName_ASC',
  FirstNameDesc = 'firstName_DESC',
  LastNameAsc = 'lastName_ASC',
  LastNameDesc = 'lastName_DESC'
}

/** Optional fields can be excluded for employee details report pdf rendering */
export enum EmployeeDetailsReportPdfOptionalField {
  BirthDate = 'BIRTH_DATE',
  Gender = 'GENDER',
  HireDate = 'HIRE_DATE',
  HomeAddress = 'HOME_ADDRESS',
  Notes = 'NOTES',
  PayInfo = 'PAY_INFO',
  TaxInfo = 'TAX_INFO',
  WorkLocation = 'WORK_LOCATION'
}

/** Input fields for employee details report pdf rendering */
export type EmployeeDetailsReportPdfRenderInput = {
  /** Specifies the optional fields that can additionally be excluded in the pdf file rendering */
  excludedFields?: InputMaybe<Array<EmployeeDetailsReportPdfOptionalField>>;
  /**
   * Specifies the fields with order for sorting the records in the pdf document
   * When no order by is provided, employees will be sorted by last name in ascending order
   */
  orderBy?: InputMaybe<EmployeeDetailsReportOrderBy>;
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/**
 * The report renderind types are not specified as mutations because these do not make any DB change
 * and just render the report in the required format by using the inputs provided.
 * Provides details for report rendering, e.g. excel, pdf
 */
export type EmployeeDetailsReportRenderings = {
  __typename?: 'EmployeeDetailsReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/**
 * The report renderind types are not specified as mutations because these do not make any DB change
 * and just render the report in the required format by using the inputs provided.
 * Provides details for report rendering, e.g. excel, pdf
 */
export type EmployeeDetailsReportRenderingsExcelArgs = {
  input?: InputMaybe<EmployeeDetailsReportExcelRenderInput>;
};


/**
 * The report renderind types are not specified as mutations because these do not make any DB change
 * and just render the report in the required format by using the inputs provided.
 * Provides details for report rendering, e.g. excel, pdf
 */
export type EmployeeDetailsReportRenderingsPdfArgs = {
  input?: InputMaybe<EmployeeDetailsReportPdfRenderInput>;
};

/** Employee Directory Report with report data rendering detail */
export type EmployeeDirectoryReport = {
  __typename?: 'EmployeeDirectoryReport';
  renderings?: Maybe<EmployeeDirectoryReportRenderings>;
};

/** Optional fields can be excluded for employee directory report excel rendering */
export enum EmployeeDirectoryReportExcelOptionalField {
  BirthDate = 'BIRTH_DATE',
  Email = 'EMAIL',
  HireDate = 'HIRE_DATE',
  HomeAddress = 'HOME_ADDRESS',
  HomePhone = 'HOME_PHONE',
  MobilePhone = 'MOBILE_PHONE',
  WorkLocation = 'WORK_LOCATION',
  WorkPhone = 'WORK_PHONE'
}

/** Input fields for employee directory report excel rendering */
export type EmployeeDirectoryReportExcelRenderInput = {
  /** Specifies the optional fields that can additionally be excluded in the excel file rendering */
  excludedFields?: InputMaybe<Array<EmployeeDirectoryReportExcelOptionalField>>;
  /**
   * Specifies the fields with order for sorting the records in the excel document
   * When no order by is provided, employees will be sorted by last name in ascending order
   */
  orderBy?: InputMaybe<EmployeeDirectoryReportOrderBy>;
};

/** Employee directory report can be filtered by employee id, employment status and work location */
export type EmployeeDirectoryReportFilter = {
  employeeId?: InputMaybe<IdFilter>;
  employmentStatus?: InputMaybe<EmploymentStatusFilter>;
  workLocationId?: InputMaybe<IdFilter>;
};

/** Input filter for employee directory report */
export type EmployeeDirectoryReportInput = {
  filterBy: EmployeeDirectoryReportFilter;
  orderBy?: InputMaybe<EmployeeDirectoryReportOrderBy>;
};

export enum EmployeeDirectoryReportOrderBy {
  BirthDateAsc = 'birthDate_ASC',
  BirthDateDesc = 'birthDate_DESC',
  EmploymentDetailEmploymentStatusActiveAsc = 'employmentDetail__employmentStatus__active_ASC',
  EmploymentDetailEmploymentStatusActiveDesc = 'employmentDetail__employmentStatus__active_DESC',
  EmploymentDetailHireDateAsc = 'employmentDetail__hireDate_ASC',
  EmploymentDetailHireDateDesc = 'employmentDetail__hireDate_DESC',
  FirstNameAsc = 'firstName_ASC',
  FirstNameDesc = 'firstName_DESC',
  LastNameAsc = 'lastName_ASC',
  LastNameDesc = 'lastName_DESC'
}

/** Optional fields can be excluded for employee directory report pdf rendering */
export enum EmployeeDirectoryReportPdfOptionalField {
  BirthDate = 'BIRTH_DATE',
  Email = 'EMAIL',
  HireDate = 'HIRE_DATE',
  HomeAddress = 'HOME_ADDRESS',
  HomePhone = 'HOME_PHONE',
  MobilePhone = 'MOBILE_PHONE',
  WorkLocation = 'WORK_LOCATION',
  WorkPhone = 'WORK_PHONE'
}

/** Input fields for employee directory report pdf rendering */
export type EmployeeDirectoryReportPdfRenderInput = {
  /** Specifies the optional fields that can additionally be excluded in the pdf file rendering, fields are refering to payslip schema type */
  excludedFields?: InputMaybe<Array<EmployeeDirectoryReportPdfOptionalField>>;
  /**
   * Specifies the fields with order for sorting the records in the pdf document
   * When no order by is provided, employees will be sorted by last name in ascending order
   */
  orderBy?: InputMaybe<EmployeeDirectoryReportOrderBy>;
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/**
 * The report renderind types are not specified as mutations because these do not make any DB change
 * and just render the report in the required format by using the inputs provided.
 * Provides directory for report rendering, e.g. excel, pdf
 */
export type EmployeeDirectoryReportRenderings = {
  __typename?: 'EmployeeDirectoryReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/**
 * The report renderind types are not specified as mutations because these do not make any DB change
 * and just render the report in the required format by using the inputs provided.
 * Provides directory for report rendering, e.g. excel, pdf
 */
export type EmployeeDirectoryReportRenderingsExcelArgs = {
  input?: InputMaybe<EmployeeDirectoryReportExcelRenderInput>;
};


/**
 * The report renderind types are not specified as mutations because these do not make any DB change
 * and just render the report in the required format by using the inputs provided.
 * Provides directory for report rendering, e.g. excel, pdf
 */
export type EmployeeDirectoryReportRenderingsPdfArgs = {
  input?: InputMaybe<EmployeeDirectoryReportPdfRenderInput>;
};

/** An edge in a connection. */
export type EmployeeEdge = {
  __typename?: 'EmployeeEdge';
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge */
  node?: Maybe<Employee>;
};

export type EmployeeEmergencyContact = {
  __typename?: 'EmployeeEmergencyContact';
  firstName: Scalars['String']['output'];
  /** EmergencyContact record id */
  id: Scalars['ID']['output'];
  lastName?: Maybe<Scalars['String']['output']>;
  phoneNumber: PhoneNumber;
  primaryEmailAddress?: Maybe<EmailAddress>;
  /** Relationship with the employee like Parent, Spouse, etc */
  relationship: Scalars['String']['output'];
};

export type EmployeeEmergencyContactCreateInput = {
  companyId: Scalars['ID']['input'];
  /** The employee ID of an employee whose emergency contact this is */
  employee_id: Scalars['ID']['input'];
  firstName: Scalars['String']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  phoneNumber: PhoneNumberInput;
  primaryEmailAddress?: InputMaybe<EmailAddressInput>;
  relationship: Scalars['String']['input'];
};

export type EmployeeEmergencyContactMetaModel = MetaModel & {
  __typename?: 'EmployeeEmergencyContactMetaModel';
  applicable: Scalars['Boolean']['output'];
  firstName: MetaString;
  label: Scalars['String']['output'];
  lastName: MetaString;
  phoneNumber: PhoneNumberMetaModel;
  primaryEmailAddress: EmailAddressMetaModel;
  readOnly: Scalars['Boolean']['output'];
  relationship: MetaString;
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type EmployeeEmergencyContactPayload = {
  __typename?: 'EmployeeEmergencyContactPayload';
  emergencyContact?: Maybe<EmployeeEmergencyContact>;
  userError?: Maybe<EmployeeError>;
};

export type EmployeeEmergencyContactUpdateInput = {
  companyId: Scalars['ID']['input'];
  /** The employee ID of an employee whose emergency contact this is */
  employee_id: Scalars['ID']['input'];
  firstName: Scalars['String']['input'];
  /** EmergencyContact record id */
  id: Scalars['ID']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  phoneNumber: PhoneNumberInput;
  primaryEmailAddress?: InputMaybe<EmailAddressInput>;
  relationship: Scalars['String']['input'];
};

export type EmployeeEmployerPayScheduleFilter = {
  employmentStatus?: InputMaybe<EmploymentStatusFilter>;
};

export type EmployeeEmploymentDetailError = {
  __typename?: 'EmployeeEmploymentDetailError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type EmployeeEmploymentDetailInput = {
  employeeIdentifier?: InputMaybe<Scalars['String']['input']>;
  employmentClassification?: InputMaybe<EmploymentClassification>;
  employmentType?: InputMaybe<EmploymentType>;
  healthInsuranceEligibility?: InputMaybe<Scalars['Boolean']['input']>;
  hireDate?: InputMaybe<Scalars['Date']['input']>;
  jobDeclaration?: InputMaybe<Scalars['String']['input']>;
  jobTitle?: InputMaybe<Scalars['String']['input']>;
  occupationalClassification?: InputMaybe<Scalars['String']['input']>;
  paidIrregularly?: InputMaybe<Scalars['Boolean']['input']>;
  payrollNumber?: InputMaybe<PayrollNumberInput>;
  reportingUnit?: InputMaybe<ReportingUnitInput>;
  statusReason?: InputMaybe<Scalars['String']['input']>;
  terminationDate?: InputMaybe<Scalars['Date']['input']>;
  /** @deprecated Use primaryWorkLocation field instead */
  workLocation?: InputMaybe<WorkLocationInput>;
};

export type EmployeeError = {
  __typename?: 'EmployeeError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Describes the contribution amount  contributed by employee outside of the company */
export type EmployeeExternalContribution = {
  __typename?: 'EmployeeExternalContribution';
  /** Outside Contribution Amount by employee for current tax year */
  amount: Scalars['Money']['output'];
};

export type EmployeeExternalContributionMetaModel = MetaModel & {
  __typename?: 'EmployeeExternalContributionMetaModel';
  /** The metamodels for external contribution amount */
  amount: MetaMoney;
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type EmployeeFeature = {
  __typename?: 'EmployeeFeature';
  featureId: Scalars['String']['output'];
};


export type EmployeeFeatureFeatureIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** Feature group employee has */
export type EmployeeFeatureGroup = {
  __typename?: 'EmployeeFeatureGroup';
  /** Feature of a given type. e.g time tracking, update pay distribution */
  features: Array<EmployeeFeature>;
  /** The feature group that the employee access is representing. e.g workforce, tsheets */
  group: Scalars['String']['output'];
  /** Meta model of the feature */
  metaModel: EmployeeFeatureGroupMetaModel;
};


/** Feature group employee has */
export type EmployeeFeatureGroupGroupArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type EmployeeFeatureGroupAndProductInvitations = {
  __typename?: 'EmployeeFeatureGroupAndProductInvitations';
  createdProductInvitations?: Maybe<Array<EmployeeProductInvitation>>;
  employeeId: Scalars['ID']['output'];
  featureGroup?: Maybe<EmployeeFeatureGroup>;
  updatedProductInvitations?: Maybe<Array<EmployeeProductInvitation>>;
};

export type EmployeeFeatureGroupError = {
  __typename?: 'EmployeeFeatureGroupError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type EmployeeFeatureGroupInput = {
  /** features of the feature group */
  features: Array<EmployeeFeatureInput>;
  /** Group of the feature group */
  group: Scalars['String']['input'];
};

export type EmployeeFeatureGroupMetaModel = MetaModel & {
  __typename?: 'EmployeeFeatureGroupMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** The features that can be added */
  features: EmployeeFeatureMetaModel;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type EmployeeFeatureInput = {
  featureId: Scalars['String']['input'];
};

export type EmployeeFeatureMetaModel = {
  __typename?: 'EmployeeFeatureMetaModel';
  featureId: MetaEnum;
};

/** Information about an employee's filing adjustment */
export type EmployeeFilingAdjustmentInfoInput = {
  /** Adjustment details for the form fields */
  adjustment: FormFieldsAdjustmentInput;
  /** UUID of the employee in formml */
  employeeFormmlUUID: Scalars['String']['input'];
  /** Name of the employee who's form value was adjusted, Backend Service will use this attribute to compose an audit event. */
  employeeName: Scalars['String']['input'];
};

export type EmployeeFormFilingAdjustmentCreationInput = {
  /** Unique identifier for the company. */
  companyId: Scalars['ID']['input'];
  /** period information. */
  filingPeriod: TaxFilingPeriod;
  /** Code representing the tax form. */
  formId: Scalars['String']['input'];
  /** List of employees with their respective filing adjustments. */
  updatedEmployees: Array<EmployeeFilingAdjustmentInfoInput>;
};

export type EmployeeFormFilingAdjustmentCreationPayload = {
  __typename?: 'EmployeeFormFilingAdjustmentCreationPayload';
  /** List of errors encountered during the creation process, if any. */
  errors?: Maybe<TaxFilingError>;
  /** Indicates whether the form filing adjustment was successfully created. */
  success: Scalars['Boolean']['output'];
};

/** A garnishment associated with this employee */
export type EmployeeGarnishment = EmployeeDeduction & Node & {
  __typename?: 'EmployeeGarnishment';
  /** Whether this garnishment is currently active */
  active: Scalars['Boolean']['output'];
  /** Amount garnished in this current period */
  amount?: Maybe<Rate>;
  /** The employer deduction item associated with this garnishment */
  deductionPolicy: DeductionPolicy;
  /** Amount of money in the employee's salary that is exempted from garnishment */
  exemptAmount?: Maybe<Scalars['Money']['output']>;
  id: Scalars['ID']['output'];
  /** Max amount that can be collected from employee's salary */
  limitAmount?: Maybe<Rate>;
  /** Total amount due to garnishor */
  totalAmountOwed?: Maybe<Scalars['Money']['output']>;
  /** Vendor Id for deduction payments */
  vendorId?: Maybe<Scalars['String']['output']>;
};

/**
 * Garnishments associated with this employee and the priority of
 * how those garnishments are deducted from the employee's pay
 */
export type EmployeeGarnishmentDetails = {
  __typename?: 'EmployeeGarnishmentDetails';
  /** Garnishments associated with this employee */
  garnishments: Array<EmployeeGarnishment>;
  /**
   * Garnishments associated with this employee and the priority of
   * how those garnishments are deducted from the employee's pay
   */
  priority?: Maybe<GarnishmentPriority>;
};

export type EmployeeGarnishmentDetailsMetaModel = MetaModel & {
  __typename?: 'EmployeeGarnishmentDetailsMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** The metamodel for garnishments */
  garnishments: Array<EmployeeGarnishmentMetaModel>;
  label: Scalars['String']['output'];
  /** The metamodel for priority */
  priority: GarnishmentPriorityMetaModel;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type EmployeeGarnishmentMetaModel = MetaModel & {
  __typename?: 'EmployeeGarnishmentMetaModel';
  /** The metamodel for amount garnished */
  amount: RateMetaModel;
  applicable: Scalars['Boolean']['output'];
  /** The metamodel for this deduction policy */
  deductionPolicy: DeductionPolicyMetaModel;
  /** The metamodel for amount of money in the employee's salary that is exempted from garnishment */
  exemptAmount: MetaMoney;
  label: Scalars['String']['output'];
  /** The metamodel for limit amount */
  limitAmount: RateMetaModel;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** The metamodel for total amount due to garnishor */
  totalAmountOwed: MetaMoney;
  typeRef: Scalars['String']['output'];
};

/** Represents state of the employee's pay history */
export enum EmployeeHistoryStatus {
  /** Represents that pay history has been entered for that employee */
  HistoryComplete = 'HISTORY_COMPLETE',
  /** Represents that the employee is not ready to enter pay history */
  NotReadyToEnterHistory = 'NOT_READY_TO_ENTER_HISTORY',
  /** Represents the employee does not have any pay history */
  NoHistory = 'NO_HISTORY',
  /** Represents that the employee has not yet had pay history entered */
  ReadyNotStarted = 'READY_NOT_STARTED',
  /** Represents that the employee pay history is incomplete */
  StartedNotComplete = 'STARTED_NOT_COMPLETE'
}

/** How the employee's time worked is billed to customers */
export type EmployeeJobCosting = {
  __typename?: 'EmployeeJobCosting';
  /** Billing rate per hour for the employee that the employer charges customers for products and services */
  billRate?: Maybe<Scalars['Money']['output']>;
  /** Indicates whether the employee is billable */
  billable: Scalars['Boolean']['output'];
  /** The per hour cost for an employee to do work for the employer. This typically includes wages, benefits, overhead and taxes */
  costRate?: Maybe<Scalars['Money']['output']>;
};

export type EmployeeJobCostingInput = {
  billRate?: InputMaybe<Scalars['Money']['input']>;
  billable: Scalars['Boolean']['input'];
  costRate?: InputMaybe<Scalars['Money']['input']>;
};

export type EmployeeLeavePeriod = {
  /** Used to determine the type of leave */
  category: LeaveCategory;
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['output'];
  /** End date of the employee leave which is optional */
  endDate?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
};

export type EmployeeManagedWorkersCompensationClass = {
  __typename?: 'EmployeeManagedWorkersCompensationClass';
  /** Date for workers' compensation policy to go into effect for an employee. */
  effectiveDate: Scalars['Date']['output'];
  employerWorkersCompensationClass: EmployerManagedWorkersCompensationClass;
  id: Scalars['ID']['output'];
};

export type EmployeeManagerMetaModel = MetaModel & {
  __typename?: 'EmployeeManagerMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Metamodel for employee setup */
export type EmployeeMetaModel = MetaModel & {
  __typename?: 'EmployeeMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** The metamodels for employee benefits */
  benefits: Array<EmployeeDeductionMetaModel>;
  /** The birth date of the employee */
  birthDate: MetaDate;
  /** Contact information for an employee */
  contactInfo: Payroll_Employee_ContactInfoMetaModel;
  /** The metamodels for employee deductions */
  deductions: Array<EmployeeDeductionMetaModel>;
  /** Metamodel to determine if department field is applicable for region/product */
  department: EmployeeDepartmentMetaModel;
  /** Metamodel for creating an emergency contact */
  emergencyContact: EmployeeEmergencyContactMetaModel;
  employeeContractDetail?: Maybe<EmployeeContractDetailsMetaModel>;
  /** The first name of the employee */
  firstName: MetaString;
  /** The metamodels for employee garnishments */
  garnishmentDetails: EmployeeGarnishmentDetailsMetaModel;
  /** The gender of the employee */
  gender: MetaEnum;
  /** The preferred personal title of the employee. */
  honorific?: Maybe<MetaEnum>;
  label: Scalars['String']['output'];
  /** The last name of the employee */
  lastName: MetaString;
  /** The legal sex of the employee */
  legalSex?: Maybe<MetaEnum>;
  /** Metamodel to determine if manager field is applicable for region/product */
  manager: EmployeeManagerMetaModel;
  /** The middle initial of the employee */
  middleInitial: MetaString;
  /** Pay Distributions for an employee */
  payDistributions: EmployeePayDistributionMetaModel;
  /** Meta model for employee pay history */
  payHistory: EmployeePayHistoryMetaModel;
  /** The metamodels for employee payroll corrections */
  payrollCorrections: Array<EmployeePayrollCorrectionMetaModel>;
  /**
   * The metamodels for employee pensions
   * @deprecated Use pensionV2 instead
   */
  pensions: Array<EmployeeDeductionMetaModel>;
  /** The metamodels for */
  pensionsV2: Array<EmployeePensionMetaModel>;
  /** The preferred name of the employee */
  preferredFirstName: MetaString;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** Tax identifiers an employee has to tax setups */
  taxIdentifiers: Array<MetaVariableStringField>;
  typeRef: Scalars['String']['output'];
};

/** A miscellaneous deduction associated with this employee */
export type EmployeeMiscDeduction = ContributiveDeduction & EmployeeDeduction & Node & {
  __typename?: 'EmployeeMiscDeduction';
  /** Whether this deduction is currently active */
  active: Scalars['Boolean']['output'];
  /** The employer deduction item associated with this deduction */
  deductionPolicy: DeductionPolicy;
  /** Employee's contribution to this deduction */
  employeeContribution?: Maybe<EmployeeContribution>;
  /** Company's contribution to this deduction */
  employerContribution?: Maybe<EmployerContribution>;
  id: Scalars['ID']['output'];
  /** Policy plan for employee contribution to this deduction */
  policyPlan?: Maybe<Scalars['String']['output']>;
};


/** A miscellaneous deduction associated with this employee */
export type EmployeeMiscDeductionPolicyPlanArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** Represents employee's paid status in a given period */
export enum EmployeePaidStatus {
  /** Represents that the employee paid status has not yet been answered */
  NotAnswered = 'NOT_ANSWERED',
  /** Represents that the employee was not paid */
  NotPaid = 'NOT_PAID',
  /** Represents that the employee was paid */
  Paid = 'PAID'
}

export type EmployeePayDistribution = {
  __typename?: 'EmployeePayDistribution';
  /** If pay distribution is active */
  active: Scalars['Boolean']['output'];
  /** Allocation of distribution */
  allocation?: Maybe<EmployeePayDistributionAllocation>;
  /** Destination where pay will go */
  destination?: Maybe<DistributionDestination>;
  /** Meta model of the pay distribution */
  metaModel: EmployeePayDistributionMetaModel;
  /** The destination type of this distribution eg. Check, Cash, MoneyMovement. There can only be at most one of either cash or check. */
  method: Scalars['String']['output'];
};

/** Allocation of distribution based off of type and rate */
export type EmployeePayDistributionAllocation = {
  __typename?: 'EmployeePayDistributionAllocation';
  rate?: Maybe<Rate>;
  type: EmployeePayDistributionAllocationType;
};

export type EmployeePayDistributionAllocationInput = {
  rate?: InputMaybe<RateInput>;
  type: EmployeePayDistributionAllocationType;
};

export type EmployeePayDistributionAllocationMetaModel = {
  __typename?: 'EmployeePayDistributionAllocationMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  rate: RateMetaModel;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  type: MetaEnum;
  typeRef: Scalars['String']['output'];
};

/** Distribution amount type, either Balance or AmountType */
export enum EmployeePayDistributionAllocationType {
  Amount = 'AMOUNT',
  Balance = 'BALANCE'
}

export type EmployeePayDistributionInput = {
  /** Allocation of distribution */
  allocation: EmployeePayDistributionAllocationInput;
  /** The destination of the distribution */
  destination?: InputMaybe<DistributionDestinationInput>;
  method: EmployeePayDistributionMethod;
};

export type EmployeePayDistributionMetaModel = MetaModel & {
  __typename?: 'EmployeePayDistributionMetaModel';
  allocation: EmployeePayDistributionAllocationMetaModel;
  applicable: Scalars['Boolean']['output'];
  destination: DistributionDestinationMetaModel;
  label: Scalars['String']['output'];
  method: MetaEnum;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Allowed values for pay distribution method */
export enum EmployeePayDistributionMethod {
  BankTransfer = 'BANK_TRANSFER',
  Cash = 'CASH',
  Check = 'CHECK',
  DirectDeposit = 'DIRECT_DEPOSIT'
}

/** The history of an employee's pay information for all compensations paid and all withheld taxes */
export type EmployeePayHistory = {
  __typename?: 'EmployeePayHistory';
  /**
   * Payroll information for an employee paid within the most recent year by the same company when company is switching
   * from a different product
   */
  priorPayroll?: Maybe<PriorPayroll>;
};

/** Meta model for history of an employee's pay information for all compensations paid and all withheld taxes */
export type EmployeePayHistoryMetaModel = MetaModel & {
  __typename?: 'EmployeePayHistoryMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  /**
   * Payroll information for an employee paid within the most recent year by the same company when company is switching
   * from a different product
   */
  priorPayroll: PriorPayrollMetaModel;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Payable item such as netPay or taxablePay. */
export type EmployeePayItemDetail = {
  amount: Scalars['Money']['output'];
};

export type EmployeePayItemDetailForEmployee = EmployeePayItemDetail & {
  __typename?: 'EmployeePayItemDetailForEmployee';
  amount: Scalars['Money']['output'];
  employeeDetail: PayslipAggregationReportEmployeeDetail;
};

export type EmployeePayItemDetailForPeriod = EmployeePayItemDetail & {
  __typename?: 'EmployeePayItemDetailForPeriod';
  amount: Scalars['Money']['output'];
  periodDetail: PayslipAggregationReportPeriodDetail;
};

export type EmployeePayScheduleAssignmentInput = {
  employeeId: Scalars['ID']['input'];
  payScheduleId: Scalars['ID']['input'];
};

/** A payroll correction associated with this employee */
export type EmployeePayrollCorrection = EmployeeDeduction & Node & {
  __typename?: 'EmployeePayrollCorrection';
  /** Whether this correction is currently active */
  active: Scalars['Boolean']['output'];
  /** Amount per paycheck that employee owes to employer or employer owes to employee */
  amount: Scalars['Money']['output'];
  /** Max amount that employee owes to employer or employer owes to employee */
  balance: Scalars['Money']['output'];
  /** The employer deduction item associated with this correction */
  deductionPolicy: DeductionPolicy;
  id: Scalars['ID']['output'];
  /** Determines how the correction item should be deducted from paycheck */
  payDownType: PayDownType;
};

export type EmployeePayrollCorrectionMetaModel = MetaModel & {
  __typename?: 'EmployeePayrollCorrectionMetaModel';
  /** The metamodel for amount */
  amount: MetaMoney;
  applicable: Scalars['Boolean']['output'];
  /** The metamodel for balance */
  balance: MetaMoney;
  /** The metamodels for this deduction policy */
  deductionPolicy: DeductionPolicyMetaModel;
  label: Scalars['String']['output'];
  /** The metamodel for payDownType */
  payDownType: MetaEnum;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Represents an employee's payroll run */
export type EmployeePayrollRun = {
  __typename?: 'EmployeePayrollRun';
  /** Employee's compensations calculated to be paid as part of this payroll run */
  calculatedCompensations: Array<PayrollRunCalculatedCompensation>;
  /** Employee's deductions calculated during this payroll run */
  calculatedDeductions: Array<PayrollRunCalculatedDeduction>;
  /** Employee taxes calculated to be withheld as part of this payroll run */
  calculatedEmployeeTaxes: Array<PayrollRunCalculatedTax>;
  /** Employer taxes calculated to be withheld as part of this payroll run */
  calculatedEmployerTaxes: Array<PayrollRunCalculatedTax>;
  /** Employee's timeoff policies calculated  during this payroll run */
  calculatedTimeOffPolicies: Array<PayrollRunCalculatedTimeOffPolicy>;
  /** Company payroll run associated with this employee payroll run */
  companyPayrollRun: CompanyPayrollRun;
  /** Employee associated with this payroll run */
  employee: Employee;
  /** Total pay for this employee payroll run */
  grossPay?: Maybe<Scalars['Money']['output']>;
  id: Scalars['ID']['output'];
  /** Memo note for this employee payroll run */
  memo?: Maybe<Scalars['String']['output']>;
  /** Info/Warning/Blocker messages encountered while running this payroll */
  messages: Array<PayrollRunMessage>;
  metaModel: EmployeePayrollRunMetaModel;
  /** Net pay to be paid to the employee for this payroll run */
  netPay?: Maybe<Scalars['Money']['output']>;
  /** Net pay distribution for this employee payroll run */
  netPayDistributions: Array<PayrollRunNetPayDistribution>;
  /** Employee's pay distribution for this payroll run */
  payDistributions: Array<EmployeePayDistribution>;
  /** Options to configure payslip calculation of this employee payroll run */
  payrollRunOptions: Array<VariableTypeField>;
  /** Payslip that's created as a result of this payroll run */
  payslip?: Maybe<Payslip>;
};

export type EmployeePayrollRunFilter = {
  id?: InputMaybe<Scalars['ID']['input']>;
};

/** Metamodel to represent an employee payroll run */
export type EmployeePayrollRunMetaModel = MetaModel & {
  __typename?: 'EmployeePayrollRunMetaModel';
  applicable: Scalars['Boolean']['output'];
  calculatedCompensations: Array<PayrollRunCalculatedCompensationMetaModel>;
  calculatedDeductions: Array<PayrollRunCalculatedDeductionMetaModel>;
  calculatedEmployeeTaxes: Array<PayrollRunCalculatedTaxMetaModel>;
  calculatedEmployerTaxes: Array<PayrollRunCalculatedTaxMetaModel>;
  label: Scalars['String']['output'];
  memo: MetaString;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** A connection to a list of payslips for an employee. */
export type EmployeePayslipConnection = {
  __typename?: 'EmployeePayslipConnection';
  edges?: Maybe<Array<Maybe<EmployeePayslipEdge>>>;
  renderings?: Maybe<EmployeePayslipsRenderings>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};


/** A connection to a list of payslips for an employee. */
export type EmployeePayslipConnectionRenderingsArgs = {
  input?: InputMaybe<EmployeePayslipsRenderingsInput>;
};

/**
 * Filtering options for payslips for an employee.
 * Currently it allows filtering by the payslip type, correction reason, pay date and pay period.
 */
export type EmployeePayslipConnectionFilter = {
  correctionDetails?: InputMaybe<PayslipCorrectionDetailsFilter>;
  payDate?: InputMaybe<PayslipPayDateFilter>;
  payPeriod?: InputMaybe<PayslipPayPeriodFilter>;
  payslipId?: InputMaybe<Scalars['String']['input']>;
  preset?: InputMaybe<PayslipPresetFilter>;
  status?: InputMaybe<PayslipNetPayDirectDepositStatusFilter>;
  type?: InputMaybe<PayslipTypeFilter>;
};

/** An edge in a connection. */
export type EmployeePayslipEdge = {
  __typename?: 'EmployeePayslipEdge';
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge */
  node?: Maybe<Payslip>;
};

/**
 * Returns payslip items related to employee section, applicable to more than one employee or period. Each drilled down
 * item has a list associated to it.
 */
export type EmployeePayslipItemsAggregation = {
  __typename?: 'EmployeePayslipItemsAggregation';
  /**
   * Earnings received by employee separately not through a payslip
   * such as cash tips and employee award but reported on the payslip for future taxing purposes.
   */
  additionalReportedEarningDetail?: Maybe<PayslipCompensationAggregations>;
  /**
   * Deductions applied on gross earnings after taxes are withheld from an employee's payslip
   * such as Roth 401k, disability insurance etc. and has no effect on taxable income
   */
  afterTaxDeductionDetail?: Maybe<PayslipDeductionAggregations>;
  /**
   * Different types of wages paid by an employer to an employee such as salary, commission etc.
   * before taxes and deductions are taken out
   */
  grossPayDetail: PayslipCompensationAggregations;
  /**
   * Net earning is the amount of money an employee takes home after all deductions and taxes have been taken out.
   * This is the money they have in their pocket on payday.
   */
  netPays: Array<EmployeePayItemDetail>;
  /**
   * Deductions taken from an employee's gross earnings before
   * taxes are withheld from the payslip such as Health insurance, HSA etc.
   * These deductions help reduce an employee's taxable income amount
   */
  preTaxDeductionDetail?: Maybe<PayslipDeductionAggregations>;
  /** Taxes that employers pay or withhold on behalf of employees on their taxable gross earnings */
  taxDetail: PayslipTaxAggregations;
  /** This is calculated by subtracting pre-tax deductions from total gross earnings on a paycheck */
  taxablePays: Array<EmployeePayItemDetail>;
};

export type EmployeePayslipItemsAggregationDetail = {
  __typename?: 'EmployeePayslipItemsAggregationDetail';
  /**
   * Earnings received by employee separately not through a payslip
   * such as cash tips, employee award but reported on the payslip for future taxing purposes.
   */
  additionalReportedEarningDetail?: Maybe<PayslipCompensationAggregationDetail>;
  /**
   * Deductions applied on gross earnings after taxes are withheld from an employee's payslip
   * such as Roth 401k, disability insurance etc. and has no effect on taxable income
   */
  afterTaxDeductionDetail?: Maybe<PayslipDeductionAggregationDetail>;
  /** Total of all compensations including grossPayDetail and additionalReportedEarningDetail */
  compensationsTotal?: Maybe<Scalars['Money']['output']>;
  /**
   * Different types of wages paid by an employer to an employee such as salary, commission etc.
   * before taxes and deductions are taken out
   */
  grossPayDetail: PayslipCompensationAggregationDetail;
  /**
   * Net earning is the amount of money an employee takes home after all deductions and taxes have been taken out.
   * This is the money they have in their pocket on payday.
   */
  netPay: Scalars['Money']['output'];
  /**
   * Deductions taken from an employee's gross earnings before
   * taxes are withheld from the payslip such as Health insurance, HSA etc.
   * These deductions help reduce an employee's taxable income amount
   */
  preTaxDeductionDetail?: Maybe<PayslipDeductionAggregationDetail>;
  /** Taxes that employers pay or withhold on behalf of employees on their taxable gross earnings */
  taxDetail: PayslipTaxAggregationDetail;
  /** This is calculated by subtracting pre-tax deductions from total gross earnings on a paycheck */
  taxablePay: Scalars['Money']['output'];
};

/** Currently the payslips for employee can be sorted based on the below fields */
export enum EmployeePayslipsOrderBy {
  GrossPayCurrentAmountAsc = 'grossPay__currentAmount_ASC',
  GrossPayCurrentAmountDesc = 'grossPay__currentAmount_DESC',
  NetPayDistributionsCheckNumberAsc = 'netPayDistributions__checkNumber_ASC',
  NetPayDistributionsCheckNumberDesc = 'netPayDistributions__checkNumber_DESC',
  NetPayCurrentAmountAsc = 'netPay__currentAmount_ASC',
  NetPayCurrentAmountDesc = 'netPay__currentAmount_DESC',
  PayDateAsc = 'payDate_ASC',
  PayDateDesc = 'payDate_DESC'
}

/** Provides payslips list details in pdf format */
export type EmployeePayslipsRenderings = {
  __typename?: 'EmployeePayslipsRenderings';
  pdf: FileRendering;
};

export type EmployeePayslipsRenderingsInput = {
  /** Boolean specifying is it for printing the paycheck */
  isPrintPaycheck?: InputMaybe<Scalars['Boolean']['input']>;
  /** Boolean specifying whether to use print preference */
  usePrintPreferences?: InputMaybe<Scalars['Boolean']['input']>;
  /** Boolean specifying whether to include the employer signature on the printed paycheck */
  withSignature?: InputMaybe<Scalars['Boolean']['input']>;
};

/** A pension associated with this employee */
export type EmployeePension = ContributiveDeduction & EmployeeDeduction & Node & {
  __typename?: 'EmployeePension';
  /** Whether this pension is currently active */
  active: Scalars['Boolean']['output'];
  /** The employer deduction item associated with this pension */
  deductionPolicy: DeductionPolicy;
  /** Employee's contribution to pension */
  employeeContribution?: Maybe<EmployeeContribution>;
  /** Employee's external contribution to pension */
  employeeExternalContribution?: Maybe<EmployeeExternalContribution>;
  /** Company's contribution to pension */
  employerContribution?: Maybe<EmployerContribution>;
  groupName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Metamodel representing EmployeePension */
  metaModel: EmployeePensionMetaModel;
  /**
   * Tax reporting related information related to the pension benefit.For example, in US, use this for reporting
   * retirement related information on employee's W-2 that are not derivable from existing pensions data.
   */
  taxReportingInfo?: Maybe<TaxReportingInfo>;
};

/** Defines the attributes for employee pension auto enrollment */
export type EmployeePensionAutoEnrollment = EmployeePensionEnrollment & Node & {
  __typename?: 'EmployeePensionAutoEnrollment';
  /** Defines the assessment date of the employee with respect to pension */
  assessmentDate?: Maybe<Scalars['Date']['output']>;
  /** Defines the employee category to define eligibility for pension enrollment */
  employeeCategory: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** Flag that determines if the postponement for pension auto-enrollment is allowed */
  postponable: Scalars['Boolean']['output'];
  /** Defines the employee pension status (eg: Opt-out / Cease Membership date) */
  status: Scalars['String']['output'];
  /** Defines the reporting date of the pension status */
  statusDate?: Maybe<Scalars['Date']['output']>;
};


/** Defines the attributes for employee pension auto enrollment */
export type EmployeePensionAutoEnrollmentEmployeeCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/** Defines the attributes for employee pension auto enrollment */
export type EmployeePensionAutoEnrollmentStatusArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type EmployeePensionEnrollment = {
  id: Scalars['ID']['output'];
  /** Defines the employee pension status */
  status: Scalars['String']['output'];
};


export type EmployeePensionEnrollmentStatusArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type EmployeePensionMetaModel = MetaModel & {
  __typename?: 'EmployeePensionMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** The metamodels for this deduction policy */
  deductionPolicy: PensionPolicyMetaModel;
  /** The metamodels for employee contribution */
  employeeContribution: EmployeeContributionMetaModel;
  /** The metamodels for employee external contribution */
  employeeExternalContribution: EmployeeExternalContributionMetaModel;
  /** The metamodels for employer contribution */
  employerContribution: EmployerContributionMetaModel;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/**
 * Optional fields that affects how the product/platform operates, that are
 * set by the employer and are specific to the given employee
 */
export type EmployeePreferences = {
  __typename?: 'EmployeePreferences';
  /**
   * These delivery preferences will determine whether a specific tax form will be delivered digitally
   * or be printed and mailed to the employee.
   */
  digitalTaxFormDeliveries: Array<VariableBooleanField>;
  /**
   * Early wage access preferences that directly impact how the product/platform
   * operates for employees
   * @deprecated early wage access is currently unsupported
   */
  earlyWageAccessPreferences?: Maybe<EarlyWageAccessPreferences>;
  /** Different email notification preferences for employee that determines if employee receives an email */
  emailNotifications: Array<EmailNotification>;
  /**
   * If true, this employee will not be included in accounting lists outside of payroll.
   * For example, if this employee is terminated or on a leave of absence,
   * you may not want them showing up elsewhere e.g. in an accounting list.
   */
  hideFromListsWhenInactive: Scalars['Boolean']['output'];
};

export type EmployeePreferencesError = {
  __typename?: 'EmployeePreferencesError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type EmployeePreferencesInput = {
  hideFromListsWhenInactive?: InputMaybe<Scalars['Boolean']['input']>;
};

export type EmployeePreviousEmployment = {
  __typename?: 'EmployeePreviousEmployment';
  metaModel: EmployeePreviousEmploymentMetaModel;
  /** Payroll information for an employee paid within the current tax year by the previous employer */
  payrollSummary?: Maybe<EmployeePreviousEmploymentPayrollSummary>;
};

export type EmployeePreviousEmploymentInput = {
  payrollSummary?: InputMaybe<EmployeePreviousEmploymentPayrollSummaryInput>;
};

export type EmployeePreviousEmploymentMetaModel = MetaModel & {
  __typename?: 'EmployeePreviousEmploymentMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  payrollSummary: EmployeePreviousEmploymentPayrollSummaryMetaModel;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type EmployeePreviousEmploymentPayrollSummary = {
  __typename?: 'EmployeePreviousEmploymentPayrollSummary';
  /** The field for total amount of all compensations paid to employee within the current tax year by the previous employer */
  earnings: Scalars['Money']['output'];
  /** The field for total amount of all taxes deducted from employee's pay within the current tax year by the previous employer */
  taxes: Scalars['Money']['output'];
};

export type EmployeePreviousEmploymentPayrollSummaryInput = {
  earnings: Scalars['Money']['input'];
  taxes: Scalars['Money']['input'];
};

export type EmployeePreviousEmploymentPayrollSummaryMetaModel = MetaModel & {
  __typename?: 'EmployeePreviousEmploymentPayrollSummaryMetaModel';
  applicable: Scalars['Boolean']['output'];
  earnings: MetaMoney;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  taxes: MetaMoney;
  typeRef: Scalars['String']['output'];
};

export type EmployeePriorPayrollInput = {
  /** Represents Employee ID for employee for which the totals are provided */
  employeeId: Scalars['ID']['input'];
  /** Employee's prior Payroll information for current and previous date periods. */
  periods: Array<PriorPayrollPeriodInput>;
};

/** Payload type for each employee prior payroll totals with employee id */
export type EmployeePriorPayrollTotalsPayload = {
  __typename?: 'EmployeePriorPayrollTotalsPayload';
  /** Employee Id */
  employeeId: Scalars['ID']['output'];
  /** Updated Prior Payroll Period Totals */
  periods: Array<PriorPayrollPeriod>;
};

export type EmployeeProductInvitation = {
  __typename?: 'EmployeeProductInvitation';
  /** Meta model of the invitation */
  metaModel: EmployeeProductInvitationMetaModel;
  /** Status of the invitation */
  status: EmployeeProductInvitationStatus;
  /** Type of the invitation */
  type: Scalars['String']['output'];
};


export type EmployeeProductInvitationTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type EmployeeProductInvitationError = {
  __typename?: 'EmployeeProductInvitationError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Meta model on how to update the invitation */
export type EmployeeProductInvitationMetaModel = MetaModel & {
  __typename?: 'EmployeeProductInvitationMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export enum EmployeeProductInvitationStatus {
  Accepted = 'ACCEPTED',
  NotSent = 'NOT_SENT',
  Revoked = 'REVOKED',
  Sent = 'SENT'
}

/**
 * Account selected for employee reimbursement expenses. Input can be specified as one of the following:
 * Account selected may be specified as a single account for all transactions, or by pay type.
 * This is a one-of tagged union type acting as an input union, one and only one of these fields must be non-null.
 */
export type EmployeeReimbursementExpensesAccountMappingCurrentPreferenceInput = {
  /** updates the mode to BY_EMPLOYEE and sets the account mapping for each employee. */
  accountsByEmployee?: InputMaybe<Array<EmployeeToAccountMappingInput>>;
  /** updates the mode to BY_PAY_TYPE and sets the account mapping for each pay type. */
  accountsByPayType?: InputMaybe<Array<EmployerCompensationToAccountMappingInput>>;
  /** updates the mode to ONE_ACCOUNT and sets the same account for all employee reimbursement expense transactions. */
  singleAccountName?: InputMaybe<Scalars['String']['input']>;
};

export type EmployeeReimbursementExpensesAccountMappingSelectedDetail = {
  __typename?: 'EmployeeReimbursementExpensesAccountMappingSelectedDetail';
  /** specifies the account mapping for the selected mode which can be any one of - one account, or by pay type. */
  accountMapping: EmployeeReimbursementExpensesToAccountMappingPreference;
  /** Account mapping may be to one account, or categorized by pay type. */
  mode: EmployeeReimbursementExpensesToAccountMappingMode;
};

/**
 * Account selected for export of employee reimbursement expenses.
 * Account mapping may be to one account, or categorized by pay type.
 */
export type EmployeeReimbursementExpensesToAccountMapping = {
  __typename?: 'EmployeeReimbursementExpensesToAccountMapping';
  byEmployee?: Maybe<EmployeeReimbursementExpensesToAccountMappingByEmployee>;
  byPayType?: Maybe<EmployeeReimbursementExpensesToAccountMappingByPayType>;
  /** specifies the account mapping mode selected and expense to account mappings for the selected mode. */
  currentPreference?: Maybe<EmployeeReimbursementExpensesAccountMappingSelectedDetail>;
  oneAccount?: Maybe<EmployeeReimbursementExpensesToAccountMappingOneAccount>;
};

export type EmployeeReimbursementExpensesToAccountMappingByEmployee = {
  __typename?: 'EmployeeReimbursementExpensesToAccountMappingByEmployee';
  /** Account selected for export of employee reimbursement expenses categorized by employee type */
  accountsByEmployee: Array<EmployeeToAccountMapping>;
};

export type EmployeeReimbursementExpensesToAccountMappingByPayType = {
  __typename?: 'EmployeeReimbursementExpensesToAccountMappingByPayType';
  /** Account selected for export of employee reimbursement expenses categorized by pay type */
  accountsByPayType: Array<EmployerCompensationToAccountMapping>;
};

/** Account selected for employee reimbursement expenses. */
export type EmployeeReimbursementExpensesToAccountMappingInput = {
  currentPreference: EmployeeReimbursementExpensesAccountMappingCurrentPreferenceInput;
};

/** Employee Reimbursement account mapping may be to one account, or categorized by pay type. */
export enum EmployeeReimbursementExpensesToAccountMappingMode {
  ByEmployee = 'BY_EMPLOYEE',
  ByPayType = 'BY_PAY_TYPE',
  OneAccount = 'ONE_ACCOUNT'
}

export type EmployeeReimbursementExpensesToAccountMappingOneAccount = {
  __typename?: 'EmployeeReimbursementExpensesToAccountMappingOneAccount';
  /** Account selected for export of employee reimbursement expenses */
  account: LedgerAccount;
};

export type EmployeeReimbursementExpensesToAccountMappingPreference = EmployeeReimbursementExpensesToAccountMappingByEmployee | EmployeeReimbursementExpensesToAccountMappingByPayType | EmployeeReimbursementExpensesToAccountMappingOneAccount;

/** Define the structure to store employee payday readiness details. */
export type EmployeeRunPayrollReadinessDetails = Readiness & {
  __typename?: 'EmployeeRunPayrollReadinessDetails';
  /** @deprecated Use employee.readiness.autoPayroll instead */
  autoPayroll?: Maybe<EmployeeAutoPayrollReadiness>;
  deficiencies: Array<EntityReadinessDeficiency>;
  ready: Scalars['Boolean']['output'];
};

export type EmployeeSelfSetupUserError = {
  __typename?: 'EmployeeSelfSetupUserError';
  /** error code */
  code?: Maybe<Scalars['String']['output']>;
  /** A description of the error */
  message: Scalars['String']['output'];
  /** error type */
  type?: Maybe<Scalars['String']['output']>;
};

/** Type representing fields pretaining to employee setup */
export type EmployeeSetup = {
  __typename?: 'EmployeeSetup';
  /** Type representing the state of employee self setup in regards to payroll */
  payrollSelfSetup?: Maybe<PayrollEmployeeSelfSetup>;
};

/** An employee deduction that is mandated as a tax and associated with a deduction policy */
export type EmployeeTaxDeduction = EmployeeDeduction & Node & {
  __typename?: 'EmployeeTaxDeduction';
  /** Whether this deduction is currently active */
  active: Scalars['Boolean']['output'];
  /** The tax deduction policy the employee is assigned to */
  deductionPolicy: TaxDeductionPolicy;
  /** Date on which the employee's assignment to the policy will become active/is active from */
  effectiveDate: Scalars['Date']['output'];
  /** The employee associated with this tax deduction */
  employee: Employee;
  /** Employee tax deduction entity ID */
  id: Scalars['ID']['output'];
  /** The meta model for this employee tax deduction */
  metaModel: EmployeeTaxDeductionMetaModel;
};

export type EmployeeTaxDeductionMetaModel = MetaModel & {
  __typename?: 'EmployeeTaxDeductionMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** The metamodels for this deduction policy */
  deductionPolicy: TaxDeductionPolicyMetaModel;
  /** Allowed effective dates for this tax deduction */
  effectiveDate: MetaDate;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** A connection to a list of items. */
export type EmployeeTaxFilingConnection = {
  __typename?: 'EmployeeTaxFilingConnection';
  edges?: Maybe<Array<Maybe<EmployeeTaxFilingEdge>>>;
};

export type EmployeeTaxFilingConnectionFilter = {
  formId?: InputMaybe<Scalars['String']['input']>;
  period: TaxFilingDatePeriodFilter;
};

export type EmployeeTaxFilingEdge = {
  __typename?: 'EmployeeTaxFilingEdge';
  /** The item at the end of the edge */
  node?: Maybe<TaxFiling>;
};

/** A tax form included in a filing that is for an employee */
export type EmployeeTaxFormDocument = TaxFormDocument & {
  __typename?: 'EmployeeTaxFormDocument';
  /** Attributes specific to the document will be returned as name value pairs */
  attributes: Array<VariableTypeField>;
  /** Employee the filing is associated with */
  employee?: Maybe<Employee>;
  /** File rendering for the associated taxForm, it includes the generated file url */
  rendering: FileRendering;
  /** The associated tax form for the document/rendering */
  taxForm: TaxForm;
};

export type EmployeeTaxRoleDetail = {
  __typename?: 'EmployeeTaxRoleDetail';
  /** Effective date of the payee type */
  effectiveDate: Scalars['Date']['output'];
  /**
   * Employee role to indicate if any implications on tax liability calculations
   * e.g. Role will indicate if the employee is a director or a non-director
   */
  role: Scalars['String']['output'];
};


export type EmployeeTaxRoleDetailRoleArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type EmployeeTaxRoleDetailInput = {
  effectiveDate: Scalars['Date']['input'];
  role: Scalars['String']['input'];
};

export type EmployeeTaxRoleDetailMetaModel = MetaModel & {
  __typename?: 'EmployeeTaxRoleDetailMetaModel';
  applicable: Scalars['Boolean']['output'];
  effectiveDate: MetaDate;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  role: MetaEnum;
  typeRef: Scalars['String']['output'];
};

/**
 * Define the structure for employee's tax information for a specific jurisdiction.
 * Ref - https://schema.intuit.com/#data:/payroll/employee/EmployeeTaxSetup
 */
export type EmployeeTaxSetup = EntityInterface & Node & {
  __typename?: 'EmployeeTaxSetup';
  /** Allowances for this employee */
  allowances: Array<EmployeeTaxSetupAllowance>;
  /** Date on which this employee tax setup configuration will become active/is active from */
  effectiveDate: Scalars['Date']['output'];
  /** Exemptions for this employee */
  exemptions: Array<VariableTypeField>;
  externalIds?: Maybe<Array<Maybe<Common_ExternalId>>>;
  /** Filing status that the employee has in this jurisdiction representing the core family situation as the agency defines it e.g. Single, Married, Head of Household */
  filingStatus?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** The id or the label for the jurisdiction that other details like filing status, allowances etc applies to. */
  jurisdictionId: Scalars['String']['output'];
  meta?: Maybe<Common_Metadata>;
  /** Metamodel representing fields with multiple allowed values for Employee Tax Setup */
  metaModel: EmployeeTaxSetupMetaModel;
  /**
   * Employee role details if any implications on tax liability calculations
   * e.g. if the employee is declared as director, based on the effective/end dates taxes are calculated using director tax calculation method
   */
  roleDetails: Array<EmployeeTaxRoleDetail>;
  /** To define on how the taxes are calculated based on the employee designation and allowances (e.g. Annual, Cumulative) */
  taxCalculationMethods: Array<VariableTypeField>;
  /** Arbitrary data defined and assigned by the jurisdiction that does not identify an employee. e.g National Insurance Category, Arizona State Tax Rate */
  taxCodes: Array<VariableTypeField>;
  /** Tax deductions assigned to this employee as part of the employee's tax setup */
  taxDeductions: Array<EmployeeTaxDeduction>;
  /** Withholdings for this employee */
  withholdings: Array<VariableMoneyField>;
};


/**
 * Define the structure for employee's tax information for a specific jurisdiction.
 * Ref - https://schema.intuit.com/#data:/payroll/employee/EmployeeTaxSetup
 */
export type EmployeeTaxSetupFilingStatusArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/**
 * Define the structure for employee's tax information for a specific jurisdiction.
 * Ref - https://schema.intuit.com/#data:/payroll/employee/EmployeeTaxSetup
 */
export type EmployeeTaxSetupJurisdictionIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type EmployeeTaxSetupAllowance = VariableIntField | VariableMoneyField;

/**
 * EmployeeTaxSetupAllowance is an union and currently GraphQL doesn't support union of inputs.
 * Ref: https://github.com/graphql/graphql-spec/blob/inputUnionRFC-priorArt/rfcs/InputUnion.md
 *
 * Only one of the fields (moneyValue or intValue) in an input type may be provided.
 */
export type EmployeeTaxSetupAllowanceInput = {
  fieldId: Scalars['String']['input'];
  intValue?: InputMaybe<Scalars['Int']['input']>;
  moneyValue?: InputMaybe<Scalars['Money']['input']>;
};

export type EmployeeTaxSetupAllowanceMetaModel = MetaVariableIntField | MetaVariableMoneyField;

/** Meta model for Employee Tax Setup */
export type EmployeeTaxSetupMetaModel = MetaModel & {
  __typename?: 'EmployeeTaxSetupMetaModel';
  allowances: Array<EmployeeTaxSetupAllowanceMetaModel>;
  applicable: Scalars['Boolean']['output'];
  exemptions: Array<MetaVariableTypeField>;
  /** Filing status enum for a given jurisdiction. Could possibly be null if jurisdiction does not have a filing status. i.e cases with no state taxes will still have a jurisdiction but no filing status */
  filingStatus?: Maybe<MetaEnum>;
  jurisdictionId: Scalars['JurisdictionID']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  roleDetails: Array<EmployeeTaxRoleDetailMetaModel>;
  taxCalculationMethods: Array<MetaVariableTypeField>;
  taxCodes: Array<MetaVariableTypeField>;
  /** Meta model for all Employee Tax Deductions associated with the EmployeeTaxSetup */
  taxDeductions: Array<EmployeeTaxDeductionMetaModel>;
  /**
   * A URL for a PDF version of the jurisdiction's tax withholdings form. The PDF could potentially be served from an external organization's domain.
   * This field is acting as a stand-in for exposing this jurisdictional form information, and will likely be deprecated and replaced by the upcoming exposure of TaxFilings/forms.
   */
  taxWithholdingsFormPDFUrl?: Maybe<Scalars['String']['output']>;
  typeRef: Scalars['String']['output'];
  withholdings: Array<MetaVariableMoneyField>;
};

export type EmployeeTimeOffPoliciesPayload = {
  __typename?: 'EmployeeTimeOffPoliciesPayload';
  /** List of employee time off policies that are successfully created/updated */
  timeOffPolicies?: Maybe<Array<EmployeeTimeOffPolicyAssignment>>;
  /** Any errors during the create/update of list of employee timeoff policy assignments */
  userError?: Maybe<TimeOffPolicyError>;
};

export type EmployeeTimeOffPolicy = Node & {
  __typename?: 'EmployeeTimeOffPolicy';
  /** The associated employer time off policy that dictates the rules governing this employee policy */
  employerTimeOffPolicy: EmployerTimeOffPolicy;
  /** For external ids, required field for node. */
  externalIds?: Maybe<Array<Common_ExternalId>>;
  /** The unique identifier for the employee's time off */
  id: Scalars['ID']['output'];
  /**
   * The monetary balance indicating available monetary amount balance and YTD monetary amount used.
   * Currently only applicable for Canadian companies.
   */
  monetaryBalance?: Maybe<MonetaryBalance>;
  /** The time balance indicating available time balance and YTD time used */
  timeBalance: TimeBalance;
};

/** Type to provide the employee timeoff assignment details - policyAssignmentId and the policy details - id, timeoff method, category, accrual frequency, rate, value and max balance */
export type EmployeeTimeOffPolicyAssignment = Node & {
  __typename?: 'EmployeeTimeOffPolicyAssignment';
  /** The associated employer time off policy that dictates the rules governing this employee policy wrt time-off accruals based on time-off accrual-frequency, accrual-rate and max-limits */
  employerTimeOffPolicy: EmployerTimeOffPolicy;
  /** The unique identifier for the employee's time off */
  id: Scalars['ID']['output'];
};

export type EmployeeTimeOffPolicyAssignmentsDetails = {
  __typename?: 'EmployeeTimeOffPolicyAssignmentsDetails';
  /** Count of employees assigned to a policy */
  count?: Maybe<Scalars['Int']['output']>;
};

/** Account selected for export of employee compensations and tax expenses by employee */
export type EmployeeToAccountMapping = {
  __typename?: 'EmployeeToAccountMapping';
  /** Account selected for export of expenses categorized by the employee */
  account: LedgerAccount;
  employee: Employee;
};

export type EmployeeToAccountMappingByEmployerContributionCategory = {
  __typename?: 'EmployeeToAccountMappingByEmployerContributionCategory';
  accountsByCategory: Array<DeductionCategoryToAccountMapping>;
  employee: Employee;
};

export type EmployeeToAccountMappingInput = {
  /** Account selected for export of expenses categorized by the employee */
  accountName: Scalars['String']['input'];
  employeeId: Scalars['ID']['input'];
};

export type EmployeeViewableStatus = {
  employeeId: Scalars['ID']['input'];
  isViewable: Scalars['Boolean']['input'];
};

/** Defines the contracted time values; describes the employee's expected work schedule, in terms of hours per week and specific days of the week */
export type EmployeeWeeklyWorkSchedule = {
  __typename?: 'EmployeeWeeklyWorkSchedule';
  /** A flag which defines if this employee's working days are static or dynamic each week; false if the employee works the same days every week, else true. */
  irregularWorkingDays?: Maybe<Scalars['Boolean']['output']>;
  /** Defines the days of the week the employee normally works. Only applicable if the employee has a regular work schedule (see irregularWorkingDays). */
  typicalWorkingDays?: Maybe<Array<DayOfWeek>>;
  /** Defines the time an employee is contractually obligated to work each week. Defined in hours per week, either by directly collecting hours per week from the user, or by collecting both hours per day and days per week from the user. */
  weeklyContractedHours: WeeklyContractedHours;
};

export type EmployeeWorkersCompensationClass = EmployeeManagedWorkersCompensationClass | ExternalWorkersCompensationClass;

/** Special predefined values for filtering employees for particular check flow. */
export enum EmployeesForChecksFilterPreset {
  /** Employees applicable for Adjustment flow. */
  EmployeesForAdjustment = 'EMPLOYEES_FOR_ADJUSTMENT'
}

export enum EmployeesWithCompensationOrderBy {
  FirstNameAsc = 'firstName_ASC',
  FirstNameDesc = 'firstName_DESC',
  LastNameAsc = 'lastName_ASC',
  LastNameDesc = 'lastName_DESC',
  RatePerHourAsc = 'ratePerHour_ASC',
  RatePerHourDesc = 'ratePerHour_DESC',
  RecurringAmountAsc = 'recurringAmount_ASC',
  RecurringAmountDesc = 'recurringAmount_DESC',
  SalaryAsc = 'salary_ASC',
  SalaryDesc = 'salary_DESC'
}

export enum EmployeesWithContributionOrderBy {
  CompanyContributionAmountAsc = 'companyContributionAmount_ASC',
  CompanyContributionAmountDesc = 'companyContributionAmount_DESC',
  CompanyContributionAnnualMaximumAsc = 'companyContributionAnnualMaximum_ASC',
  CompanyContributionAnnualMaximumDesc = 'companyContributionAnnualMaximum_DESC',
  EmployeeContributionAmountAsc = 'employeeContributionAmount_ASC',
  EmployeeContributionAmountDesc = 'employeeContributionAmount_DESC',
  EmployeeContributionAnnualMaximumAsc = 'employeeContributionAnnualMaximum_ASC',
  EmployeeContributionAnnualMaximumDesc = 'employeeContributionAnnualMaximum_DESC',
  FirstNameAsc = 'firstName_ASC',
  FirstNameDesc = 'firstName_DESC',
  LastNameAsc = 'lastName_ASC',
  LastNameDesc = 'lastName_DESC'
}

/** Defines if the employer is ready to run payroll for its employees automatically or not. */
export type EmployerAutoPayrollReadiness = Readiness & {
  __typename?: 'EmployerAutoPayrollReadiness';
  deficiencies: Array<AcuteReadinessDeficiency>;
  ready: Scalars['Boolean']['output'];
};

/** Additional ways of providing pay to employees specific to a company */
export type EmployerCompensation = {
  __typename?: 'EmployerCompensation';
  /** Whether this compensation is currently active */
  active: Scalars['Boolean']['output'];
  /** Provides the list of employees related to the current compensation */
  employees?: Maybe<CompensationEmployeeConnection>;
  id: Scalars['ID']['output'];
  /** The name associated with this compensation */
  name: Scalars['String']['output'];
  /** Attribute for checking if a pay type is subjected to any calculation */
  subjectedToCalculation?: Maybe<SubjectedToCalculation>;
  /** The corresponding compensation type */
  type: Scalars['String']['output'];
};


/** Additional ways of providing pay to employees specific to a company */
export type EmployerCompensationEmployeesArgs = {
  filterBy?: InputMaybe<PayrollPolicyEmployeesFilter>;
  includeEmployeesWithUpcomingAssignments?: InputMaybe<Scalars['Boolean']['input']>;
  orderBy?: InputMaybe<Array<EmployeesWithCompensationOrderBy>>;
  pagination?: InputMaybe<PaginationInput>;
};


/** Additional ways of providing pay to employees specific to a company */
export type EmployerCompensationTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type EmployerCompensationMetaModel = MetaModel & {
  __typename?: 'EmployerCompensationMetaModel';
  applicable: Scalars['Boolean']['output'];
  employeeCompensation: EmployeeCompensationMetaModel;
  label: Scalars['String']['output'];
  name: MetaString;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  type: Scalars['String']['output'];
  typeRef: Scalars['String']['output'];
};

export type EmployerCompensationToAccountMapping = {
  __typename?: 'EmployerCompensationToAccountMapping';
  /** Account selected for employee compensation expenses for a pay type or a liability deducted. */
  account: LedgerAccount;
  employerCompensation: EmployerCompensation;
};

export type EmployerCompensationToAccountMappingInput = {
  /** account selected for employee compensation expenses by pay type or payroll liability or asset. */
  accountName: Scalars['String']['input'];
  employerCompensationId: Scalars['ID']['input'];
};

export type EmployerCompensationsFilter = {
  active?: InputMaybe<BooleanFilter>;
  id?: InputMaybe<IdFilter>;
  type?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Describes the contribution amount and cappings contributed by company */
export type EmployerContribution = {
  __typename?: 'EmployerContribution';
  /** Amount that is contributed by employer for any given deduction */
  amount: Rate;
  /** Capping details that is contributed by employer for any given deduction */
  capping?: Maybe<Capping>;
  /** The frequency for the employer contribution */
  frequency: ContributionFrequency;
};

/** Includes current and total amounts contributed by employer to a deduction for the specific time period */
export type EmployerContributionAccumulationAmount = AccumulationAmount & {
  __typename?: 'EmployerContributionAccumulationAmount';
  /** Monetary amount contributed by the employer for a deduction (for e.g. during a specific payroll run or payslip) */
  currentAmount: Scalars['Money']['output'];
  /** Total monetary amount contributed by the employer for a deduction */
  toDateAmounts: Array<ToDateAmount>;
};

/** Metamodel to includes current and total amounts contributed by employer to a deduction for time period */
export type EmployerContributionAccumulationAmountMetaModel = MetaModel & {
  __typename?: 'EmployerContributionAccumulationAmountMetaModel';
  applicable: Scalars['Boolean']['output'];
  currentAmount: MetaMoney;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  toDateAmounts: Array<ToDateAmountMetaModel>;
  typeRef: Scalars['String']['output'];
};

/**
 * Account selected for export of company retirement, health insurance and non cash taxable benefit contribution expenses.
 * Input can be specified as one of the following: Account selected may be specified by category, by employee or by contribution type.
 * This is a one-of tagged union type acting as an input union, one and only one of these fields must be non-null.
 */
export type EmployerContributionExpensesAccountMappingCurrentPreferenceInput = {
  /** updates the mode to BY_CATEGORY and sets the account mapping for each category- retirement, health insurance and non cash taxable benefit contribution expenses. */
  accountsByCategory?: InputMaybe<Array<EmployerContributionExpensesToAccountMappingByCategoryInput>>;
  /** updates the mode to BY_CONTRIBUTION_TYPE and sets the account mapping for each contribution type. */
  accountsByContributionType?: InputMaybe<Array<EmployerContributionExpensesToAccountMappingByContributionTypeInput>>;
  /** updates the mode to BY_EMPLOYEE and sets the account mapping for each employee by category. */
  accountsByEmployee?: InputMaybe<Array<EmployerContributionExpensesToAccountMappingByEmployeeInput>>;
};

/**
 * Account selected for export of company retirement, health insurance and non cash taxable benefit contribution expenses.
 * Account mapping may be to one account by contribution category, or categorized by employee or by contribution type.
 */
export type EmployerContributionExpensesToAccountMapping = {
  __typename?: 'EmployerContributionExpensesToAccountMapping';
  byCategory?: Maybe<EmployerContributionExpensesToAccountMappingByCategory>;
  byEmployee?: Maybe<EmployerContributionExpensesToAccountMappingByEmployee>;
  byType?: Maybe<EmployerContributionExpensesToAccountMappingByType>;
  /** specifies the account mapping mode selected and expense to account mappings for the selected mode. */
  currentPreference?: Maybe<EmployerContributionExpensesToAccountMappingSelectedDetail>;
};

export type EmployerContributionExpensesToAccountMappingByCategory = {
  __typename?: 'EmployerContributionExpensesToAccountMappingByCategory';
  accountsByCategory: Array<DeductionCategoryToAccountMapping>;
};

export type EmployerContributionExpensesToAccountMappingByCategoryInput = {
  accountName: Scalars['String']['input'];
  contributionCategoryId: Scalars['ID']['input'];
};

export type EmployerContributionExpensesToAccountMappingByContributionTypeInput = {
  /** Account selected for contribution expenses categorized by type */
  accountName: Scalars['String']['input'];
  employerContributionId: Scalars['ID']['input'];
};

export type EmployerContributionExpensesToAccountMappingByEmployee = {
  __typename?: 'EmployerContributionExpensesToAccountMappingByEmployee';
  accountsByEmployee: Array<EmployeeToAccountMappingByEmployerContributionCategory>;
};

export type EmployerContributionExpensesToAccountMappingByEmployeeInput = {
  contributionCategoryToAccount: EmployerContributionExpensesToAccountMappingByCategoryInput;
  employeeId: Scalars['ID']['input'];
};

export type EmployerContributionExpensesToAccountMappingByType = {
  __typename?: 'EmployerContributionExpensesToAccountMappingByType';
  accountsByType: Array<EmployerContributionToAccountMapping>;
};

/** Account selected for export of company retirement, health insurance and non cash taxable benefit contribution expenses. */
export type EmployerContributionExpensesToAccountMappingInput = {
  currentPreference: EmployerContributionExpensesAccountMappingCurrentPreferenceInput;
};

/** Employer contribution account mapping may be to one account by contribution category, or categorized by employee or by contribution type. */
export enum EmployerContributionExpensesToAccountMappingMode {
  ByCategory = 'BY_CATEGORY',
  ByContributionType = 'BY_CONTRIBUTION_TYPE',
  ByEmployee = 'BY_EMPLOYEE'
}

export type EmployerContributionExpensesToAccountMappingPreference = EmployerContributionExpensesToAccountMappingByCategory | EmployerContributionExpensesToAccountMappingByEmployee | EmployerContributionExpensesToAccountMappingByType;

export type EmployerContributionExpensesToAccountMappingSelectedDetail = {
  __typename?: 'EmployerContributionExpensesToAccountMappingSelectedDetail';
  accountMapping: EmployerContributionExpensesToAccountMappingPreference;
  /** Account mapping may be by category, by employee or by contribution type. */
  mode: EmployerContributionExpensesToAccountMappingMode;
};

export type EmployerContributionMetaModel = MetaModel & {
  __typename?: 'EmployerContributionMetaModel';
  /** The metamodels for amount contributed by the employer */
  amount: RateMetaModel;
  applicable: Scalars['Boolean']['output'];
  /** The metamodels for cappings in employer contribution */
  capping: CappingMetaModel;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type EmployerContributionToAccountMapping = {
  __typename?: 'EmployerContributionToAccountMapping';
  /** Account selected for export of company contribution for the specific deduction */
  account: LedgerAccount;
  employerContributionStub: EmployerDeductionStub;
};

/** Data consents given by this employer to share payroll data for this company */
export type EmployerDataConsent = {
  __typename?: 'EmployerDataConsent';
  /** consented value, true or false. */
  consented: Scalars['Boolean']['output'];
  /** The usage or purpose of this consent */
  usage: EmployerDataConsentUsage;
};

/** Data consent usage describes the purpose of this consent is used for within this company */
export enum EmployerDataConsentUsage {
  /** This usage will gives Equifax the permission to read only employee payroll data in this company */
  EquifaxEmployeeVerification = 'EQUIFAX_EMPLOYEE_VERIFICATION'
}

export type EmployerDebitTransaction = Node & {
  __typename?: 'EmployerDebitTransaction';
  /** Specifies if this Tax Payment has been exported to any external system */
  exportedToExternal: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  taxAmount: Scalars['Money']['output'];
  transactionType: Scalars['String']['output'];
  withdrawalDate: Scalars['Date']['output'];
};

export type EmployerDeductionStub = {
  __typename?: 'EmployerDeductionStub';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type EmployerDeductionToAccountMapping = {
  __typename?: 'EmployerDeductionToAccountMapping';
  /** Account selected for payroll correction, deduction liability or asset. */
  account: LedgerAccount;
  employerDeductionStub: EmployerDeductionStub;
};

export type EmployerDeductionToAccountMappingInput = {
  /** Account selected for export of payroll correction, deduction liability or asset */
  accountName: Scalars['String']['input'];
  employerDeductionId: Scalars['ID']['input'];
};

export type EmployerDirectDepositFundingDetails = {
  __typename?: 'EmployerDirectDepositFundingDetails';
  /** Eligible date for Employer faster funding and higher limits */
  eligibilityDate: Scalars['Date']['output'];
  fundingLeadTimes: EmployerDirectDepositFundingLeadTimes;
  fundingLimits: EmployerDirectDepositFundingLimits;
};

/** The Direct deposit Lead time/Funding details data associated with the company */
export type EmployerDirectDepositFundingLeadTimes = {
  __typename?: 'EmployerDirectDepositFundingLeadTimes';
  /**
   * Direct Deposit Lead time that company is approved for.
   * Once the transfer is initiated, money will arrive in  bank account within the approved lead time.
   */
  approvedLeadTime: Scalars['String']['output'];
  /**
   * Company's default Direct Deposit Lead time also called as prefunddays. It could be same day/ next day/two day or five day.
   * Once the transfer is initiated, money will arrive in employee's bank account within the mentioned lead time.
   */
  leadTime: Scalars['String']['output'];
  /**
   * Determines whether company is allowed for same day funding. This field is based on Company featureSet SameDayDirectDeposit,
   * and eventually will be moved to GAS featureType
   */
  sameDayLeadTimeAllowed: Scalars['Boolean']['output'];
};

export type EmployerDirectDepositFundingLeadTimesError = {
  __typename?: 'EmployerDirectDepositFundingLeadTimesError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type EmployerDirectDepositFundingLimits = {
  __typename?: 'EmployerDirectDepositFundingLimits';
  /** This field defines the max limit specified the total max amount direct deposit company can run. */
  company: Scalars['Money']['output'];
  /** This field specifies the total amount direct deposit Employer can run per payee, When payee limit exceeds the amount the limit check fails and Company is allowed to pay by paper cheque or request for direct deposit increase */
  payee: Scalars['Money']['output'];
  /** This field Specifies the total amount direct deposit Employer can run per payroll(6 day period). When the DD exceeds the specified amount, the limit check fails and Company is allowed to pay by paper cheque or request for direct deposit increase */
  payroll: Scalars['Money']['output'];
};

export type EmployerInfoMetaModel = MetaModel & {
  __typename?: 'EmployerInfoMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** The employerCompensationMetaModels associated with this employer */
  employerCompensations: Array<EmployerCompensationMetaModel>;
  label: Scalars['String']['output'];
  /** The liability adjustments metamodel associated with this employer */
  liabilityAdjustments: Array<PayrollLiabilityAdjustmentMetaModel>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type EmployerInfoTaxSetupsFilter = {
  /** Specifies if local tax info needs to be returned as part of the getTaxSetup call */
  includeLocalTaxes?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Specifies a list of jurisdictions to be used to filter the list of tax setups.
   * Only EmployerTaxSetup entities with a JurisdictionID matching one of those specified in this list will be included in the resulting list of tax setups.
   */
  jurisdictionId?: InputMaybe<Array<Scalars['JurisdictionID']['input']>>;
  /**
   * Specifies a list of use case requirements to fetch tax payment groups for. Example: ['TAX_SETUP'].
   * If not specified, will contain 'TAX_SETUP'.
   */
  requirementGroups?: InputMaybe<RequirementGroupFilter>;
};

/** Workers compensation class managed by Intuit QuickBooks Payroll to calculate the workers compensation liabilities / expenses. */
export type EmployerManagedWorkersCompensationClass = WorkersCompensationClass & {
  __typename?: 'EmployerManagedWorkersCompensationClass';
  /** True if the class is active; false only if the class is also not assigned to any employee */
  active: Scalars['Boolean']['output'];
  /** Classifies workers' compensation based on classes and subclasses */
  classification?: Maybe<WorkersCompensationClassification>;
  /** Short description of the workers' compensation class */
  description?: Maybe<Scalars['String']['output']>;
  /**
   * Name of the workers compensation class
   * @deprecated Use description instead
   */
  employeeClass?: Maybe<Scalars['String']['output']>;
  /** id of the employee class or type of work */
  id: Scalars['ID']['output'];
  /** True if the class is assigned to an employee; otherwise false */
  isAssignedToEmployee: Scalars['Boolean']['output'];
  /** Jurisdiction identifier in the format of C[country_code]_L1[state/province code], e.g, CUS_L1WA or CCA_L1AB */
  jurisdictionId: Scalars['JurisdictionID']['output'];
  /** An array of rates that will be used to determine the rate for the employee class on a given date using the rates Effective date. */
  rates: Array<EmployerWorkersCompensationRate>;
  /** An array of costs that will be used to determine the cost for workers' compensation on a given date using the effective date. */
  workersCompensationCost: Array<WorkersCompensationCost>;
};

/** Input workers' compensation cost for createAndAssignEmployerManagedWorkersCompensation mutation. */
export type EmployerManagedWorkersCompensationCostInput = {
  effectiveDate: Scalars['Date']['input'];
  employeeContribution?: InputMaybe<RateInput>;
  totalCost: RateInput;
};

/** Company's pay distribution details */
export type EmployerPayDistributionDetails = {
  __typename?: 'EmployerPayDistributionDetails';
  directDepositFundingDetails: EmployerDirectDepositFundingDetails;
};

/** The history of an employer's past payroll runs with all compensations and all withheld taxes */
export type EmployerPayHistory = {
  __typename?: 'EmployerPayHistory';
  /** Identifies employer prior payroll information for a given period. */
  currentPeriod?: Maybe<EmployerPriorPayrollPeriod>;
  /** Meta model for employer pay history */
  metaModel: EmployerPayHistoryMetaModel;
  /** Specifies per-period totals for tax items which require it for compliance reasons */
  taxItemPeriodBreakdowns: Array<EmployerPriorPayrollTaxItemPeriodBreakdown>;
};

/** Meta model for history of an employer's pay history information */
export type EmployerPayHistoryMetaModel = MetaModel & {
  __typename?: 'EmployerPayHistoryMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** Meta model for employer prior payroll information in a given period. */
  currentPeriod: EmployerPayHistoryPeriodMetaModel;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type EmployerPayHistoryPeriodMetaModel = MetaModel & {
  __typename?: 'EmployerPayHistoryPeriodMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  /** Meta Model for employer's prior payroll information for the specified date period. */
  priorPayrollRun: EmployerPriorPayrollRunMetaModel;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type EmployerPaySchedule = {
  __typename?: 'EmployerPaySchedule';
  /** Number of active employees that have this pay schedule assigned. */
  activeEmployeesCount: Scalars['Int']['output'];
  /** Whether or not newly created employees will be automatically assigned to this pay schedule. There can be only one default pay schedule for the company. */
  defaultPaySchedule: Scalars['Boolean']['output'];
  employees?: Maybe<EmployeeConnection>;
  /** Parent company */
  employer: Company;
  /** The frequency of the pay periods for this pay schedule, i.e. weekly, monthly, etc. */
  frequency: PayScheduleFrequency;
  id: Scalars['ID']['output'];
  /** The name for the pay schedule */
  name: Scalars['String']['output'];
  /** The previous pay periods for this schedule relative to today's date. This is a limited list, it will contain up to the number amount of pay periods specified as an argument to the parent, otherwise it will return 0 previous pay periods. */
  previousPayPeriods: Array<PaySchedulePeriod>;
  /** The reference dates that are used in combination with the frequency to determine the pay periods for this pay schedule. */
  referenceDates: Array<PayScheduleReferenceDates>;
  /** The upcoming pay periods for this schedule relative to today's date. This is a limited list, it will contain four pay periods by default. If argument to the parent is specified, it will contain up to the number amount of pay periods specified in argument to parent. */
  upcomingPayPeriods: Array<PaySchedulePeriod>;
};


export type EmployerPayScheduleEmployeesArgs = {
  filterBy?: InputMaybe<EmployeeEmployerPayScheduleFilter>;
  sortBy?: InputMaybe<EmployeeConnectionOrderBy>;
};

export type EmployerPaySchedulesQueryInput = {
  maxNumberOfPreviousPeriods?: InputMaybe<Scalars['Int']['input']>;
  maxNumberOfUpcomingPeriods?: InputMaybe<Scalars['Int']['input']>;
};

/** Defines if the Employer is ready to pay any taxes or not. */
export type EmployerPayTaxesReadiness = Readiness & {
  __typename?: 'EmployerPayTaxesReadiness';
  deficiencies: Array<ReadinessDeficiency>;
  ready: Scalars['Boolean']['output'];
};

/** Defines if the employer is ready for payroll collection using AI agent or not. */
export type EmployerPayrollCollectionReadiness = Readiness & {
  __typename?: 'EmployerPayrollCollectionReadiness';
  deficiencies: Array<AcuteReadinessDeficiency>;
  ready: Scalars['Boolean']['output'];
};

/** Breakdown of overall employer cost into 3 categories: compensations, employer taxes and employer contributions */
export type EmployerPayrollCostBreakdown = {
  __typename?: 'EmployerPayrollCostBreakdown';
  /** Breakdown of total compensation paid by employer including gross pay and additional reported pay */
  compensations: EmployerPayrollCostCompensationAggregationDetail;
  /**
   * Aggregation of contribution types made by employer on payslips such as
   * 401k match, health savings account etc.
   */
  employerContributions: PayslipEmployerContributionAggregationDetail;
  /** Aggregated employer's share of payroll taxes */
  employerTaxes: PayslipTaxAggregationDetail;
};

/**
 * This type is added for aggregated total amount for a compensation type. This can be expanded
 * to get further breakdown of compensations in the future
 */
export type EmployerPayrollCostCompensationAggregation = {
  __typename?: 'EmployerPayrollCostCompensationAggregation';
  totalAmount: Scalars['Money']['output'];
};

export type EmployerPayrollCostCompensationAggregationDetail = {
  __typename?: 'EmployerPayrollCostCompensationAggregationDetail';
  /**
   * Pay received by employee separately not through a payslip
   * such as cash tips, employee award but reported on the payslip for future taxing purposes.
   */
  additionalReportedPay?: Maybe<EmployerPayrollCostCompensationAggregation>;
  /**
   * Different types of wages paid by an employer to an employee such as salary, commission, reimbursements etc.
   * broken down into two categories
   */
  grossPay: EmployerPayrollCostGrossPayBreakdown;
  /** Total of all compensations including grossPay and additionalReportedPay */
  totalAmount: Scalars['Money']['output'];
};

export type EmployerPayrollCostDetail = {
  amount: Scalars['Money']['output'];
};

/**
 * Employer Payroll cost item attached to an employee, to be used in breakdownByPayslip Item.
 * This type will be relevant only in case of AggregatedByEmployee
 */
export type EmployerPayrollCostDetailForEmployee = EmployerPayrollCostDetail & {
  __typename?: 'EmployerPayrollCostDetailForEmployee';
  amount: Scalars['Money']['output'];
  employeeDetail: PayslipAggregationReportEmployeeDetail;
};

/**
 * Employer Payroll cost item attached to an period, to be used in breakdownByPayslip items.
 * This type will be relevant only in case of AggregatedByPeriod
 */
export type EmployerPayrollCostDetailForPeriod = EmployerPayrollCostDetail & {
  __typename?: 'EmployerPayrollCostDetailForPeriod';
  amount: Scalars['Money']['output'];
  periodDetail: PayslipAggregationReportPeriodDetail;
};

export type EmployerPayrollCostGrossPayBreakdown = {
  __typename?: 'EmployerPayrollCostGrossPayBreakdown';
  /**
   * Sum of all reimbursements provided by employer for employees for certain expenses
   * such as meals, cell phone bills etc. paid through payslips for which taxes are already paid
   */
  reimbursements: EmployerPayrollCostCompensationAggregation;
  /**
   * Sum of all wages paid by an employer to all employees such as salary, commission etc
   * before taxes and deductions.
   */
  taxableWages: EmployerPayrollCostCompensationAggregation;
};

/** A connection to a list of payslips for an employee. */
export type EmployerPayslipConnection = {
  __typename?: 'EmployerPayslipConnection';
  edges?: Maybe<Array<Maybe<EmployerPayslipEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a connection for an employer. */
export type EmployerPayslipEdge = {
  __typename?: 'EmployerPayslipEdge';
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge */
  node?: Maybe<Payslip>;
};

export type EmployerPayslipItemsAggregation = {
  __typename?: 'EmployerPayslipItemsAggregation';
  /**
   * Aggregation of contribution types made by employer on payslips such as
   * 401k match, health savings account etc.
   */
  contributionDetail?: Maybe<PayslipEmployerContributionAggregations>;
  /** Employer's share of payroll taxes */
  taxDetail: PayslipTaxAggregations;
  /** List of sum of employer taxes and contributions for all employees/periods */
  totalTaxAndContributions: Array<EmployerPayrollCostDetail>;
};

export type EmployerPayslipItemsAggregationDetail = {
  __typename?: 'EmployerPayslipItemsAggregationDetail';
  /**
   * Aggregation of contribution types made by employer on payslips such as
   * 401k match, health savings account etc.
   */
  contributionDetail?: Maybe<PayslipEmployerContributionAggregationDetail>;
  /** Employer's share of payroll taxes */
  taxDetail: PayslipTaxAggregationDetail;
  /** Sum of employer taxes and contributions */
  totalTaxAndContribution: Scalars['Money']['output'];
};

/** Currently the payslips for Employer can be sorted based on the below fields */
export enum EmployerPayslipsOrderBy {
  EmployeeFirstNameAsc = 'employee__firstName_ASC',
  EmployeeFirstNameDesc = 'employee__firstName_DESC',
  EmployeeLastNameAsc = 'employee__lastName_ASC',
  EmployeeLastNameDesc = 'employee__lastName_DESC',
  GrossPayCurrentAmountAsc = 'grossPay__currentAmount_ASC',
  GrossPayCurrentAmountDesc = 'grossPay__currentAmount_DESC',
  NetPayDistributionsCheckNumberAsc = 'netPayDistributions__checkNumber_ASC',
  NetPayDistributionsCheckNumberDesc = 'netPayDistributions__checkNumber_DESC',
  NetPayCurrentAmountAsc = 'netPay__currentAmount_ASC',
  NetPayCurrentAmountDesc = 'netPay__currentAmount_DESC',
  PayDateAsc = 'payDate_ASC',
  PayDateDesc = 'payDate_DESC'
}

export type EmployerPreferences = {
  __typename?: 'EmployerPreferences';
  /** @deprecated early wage access is currently unsupported */
  earlyWageAccessPreferences?: Maybe<EarlyWageAccessPreferences>;
  notificationPreferences?: Maybe<NotificationPreferences>;
  payslipPreferences?: Maybe<PayslipPreferences>;
  taxPreferences?: Maybe<TaxPreferences>;
  workerPortalPreferences?: Maybe<WorkerPortalPreferences>;
};

export type EmployerPriorPayrollCompensationMismatch = {
  __typename?: 'EmployerPriorPayrollCompensationMismatch';
  /** Difference between the aggregated employee and employer compensation totals */
  difference: Scalars['Money']['output'];
  /** Aggregated employee compensation amount in employee prior payroll in the specified date period */
  employeeTotal: Scalars['Money']['output'];
  /** Defines the compensation */
  employerCompensation: EmployerCompensation;
  /** Aggregated Employer compensation totals in the employer prior payroll in the specified date period */
  employerTotal: Scalars['Money']['output'];
};

export type EmployerPriorPayrollDeductionMismatch = {
  __typename?: 'EmployerPriorPayrollDeductionMismatch';
  /** Defines the deduction policy */
  deductionPolicy: DeductionPolicy;
  /** Mismatches in employee deduction prior payroll totals in the specified date period */
  employeeDeduction?: Maybe<EmployerPriorPayrollEmployeeDeductionMismatch>;
  /** Mismatches in employer contribution prior payroll totals in the specified date period */
  employerContribution?: Maybe<EmployerPriorPayrollEmployerContributionMismatch>;
};

export type EmployerPriorPayrollEmployeeDeductionMismatch = {
  __typename?: 'EmployerPriorPayrollEmployeeDeductionMismatch';
  /**
   * Difference between the aggregated employee prior payroll and
   * employer prior payroll employee deduction totals
   */
  difference: Scalars['Money']['output'];
  /** Aggregated employee deduction totals in the employee prior payroll in the specified date period */
  employeeTotal: Scalars['Money']['output'];
  /** Aggregated employee deduction totals in employer prior payroll in the specified date period */
  employerTotal: Scalars['Money']['output'];
};

export type EmployerPriorPayrollEmployerContributionMismatch = {
  __typename?: 'EmployerPriorPayrollEmployerContributionMismatch';
  /**
   * Difference between the aggregated employee prior payroll and
   * employer prior payroll contribution totals
   */
  difference: Scalars['Money']['output'];
  /** Aggregated employer contribution totals in employee prior payroll in the specified date period */
  employeeTotal: Scalars['Money']['output'];
  /** Aggregated employer contribution totals in employer prior payroll in the specified date period */
  employerTotal: Scalars['Money']['output'];
};

export type EmployerPriorPayrollMismatch = {
  __typename?: 'EmployerPriorPayrollMismatch';
  /**
   * Mismatch of employer prior payroll summary information for all compensations paid
   * and taxes withheld in a specified date period.
   */
  summary: EmployerPriorPayrollSummaryMismatch;
  /**
   * Mismatch of the breakdown of aggregated prior payroll totals given by the employer
   * in a specified date period for compensations, deductions and taxes withheld.
   */
  totals: EmployerPriorPayrollTotalsMismatch;
};

export type EmployerPriorPayrollPeriod = {
  __typename?: 'EmployerPriorPayrollPeriod';
  /** Applicable date period in which the prior payroll information is given by the employer */
  datePeriod: DatePeriod;
  /**
   * Mismatches of employer prior payroll information and aggregated employee
   * prior payroll information in the specified date period
   */
  mismatch?: Maybe<EmployerPriorPayrollMismatch>;
  /** Employer's prior payroll information for the specified date period. */
  priorPayrollRuns: Array<EmployerPriorPayrollRun>;
};


export type EmployerPriorPayrollPeriodPriorPayrollRunsArgs = {
  filterBy?: InputMaybe<PriorPayrollRunFilter>;
};

export type EmployerPriorPayrollRun = {
  __typename?: 'EmployerPriorPayrollRun';
  /** Specifies the date for the prior payroll run */
  payDate: Scalars['Date']['output'];
  /**
   * Read-only summary of the employer's prior payroll information for all
   * compensations paid and taxes withheld on given pay date.
   */
  summary: EmployerPriorPayrollRunSummary;
  /**
   * The breakdown of prior payroll totals given by the employer for this pay date
   * in compensations, deductions and taxes withheld.
   */
  totals: EmployerPriorPayrollRunTotals;
};

export type EmployerPriorPayrollRunCompensation = {
  __typename?: 'EmployerPriorPayrollRunCompensation';
  /** Compensation amount for the given type in given pay date */
  amount: Scalars['Money']['output'];
  /** Defines the compensation */
  employerCompensation: EmployerCompensation;
};

/** Input type for compensation totals inputted by the user for a given pay date */
export type EmployerPriorPayrollRunCompensationInput = {
  /**
   * Represents the compensation totals inputted for
   * the given compensation type on the given pay date
   */
  amount: Scalars['Money']['input'];
  /** Compensation ID of the employer */
  employerCompensationId: Scalars['ID']['input'];
};

export type EmployerPriorPayrollRunCompensationMetaModel = MetaModel & {
  __typename?: 'EmployerPriorPayrollRunCompensationMetaModel';
  /** Meta model for compensation amount for the given type in given pay date */
  amount: MetaMoney;
  applicable: Scalars['Boolean']['output'];
  /** Defines the compensation id */
  employerCompensationId: Scalars['ID']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type EmployerPriorPayrollRunDeduction = {
  __typename?: 'EmployerPriorPayrollRunDeduction';
  /** Defines the deduction policy */
  deductionPolicy: DeductionPolicy;
  /** Deduction amount for given type in given pay date */
  employeeDeductionAmount?: Maybe<Scalars['Money']['output']>;
  /** Contribution amount for the given type in given pay date */
  employerContributionAmount?: Maybe<Scalars['Money']['output']>;
};

/** Input type for deduction totals inputted by the user for a given pay date */
export type EmployerPriorPayrollRunDeductionInput = {
  /** Deduction Policy ID for the employer */
  deductionPolicyId: Scalars['ID']['input'];
  /**
   * Represents the employee deduction totals inputted for
   * the given deduction policy type  on the given pay date
   */
  employeeDeductionAmount?: InputMaybe<Scalars['Money']['input']>;
  /**
   * Represents the employer contribution totals inputted for
   * the given deduction policy type on the given pay date
   */
  employerContributionAmount?: InputMaybe<Scalars['Money']['input']>;
};

export type EmployerPriorPayrollRunDeductionMetaModel = MetaModel & {
  __typename?: 'EmployerPriorPayrollRunDeductionMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** Defines the deduction policy id */
  deductionPolicyId: Scalars['ID']['output'];
  /** Meta model for the deduction amount for given type in given pay date */
  employeeDeductionAmount: MetaMoney;
  /** Meta model for the contribution amount for the given type in given pay date */
  employerContributionAmount: MetaMoney;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/**
 * Input type for the breakdown of employer prior payroll totals
 * inputted by the user for a given pay date
 */
export type EmployerPriorPayrollRunInput = {
  /** Specifies the date for the prior payroll run */
  payDate: Scalars['Date']['input'];
  /**
   * The breakdown of prior payroll totals collected for this pay date by the employer in
   * compensations, deductions and taxes withheld.
   */
  totals: EmployerPriorPayrollRunTotalsInput;
};

export type EmployerPriorPayrollRunMetaModel = MetaModel & {
  __typename?: 'EmployerPriorPayrollRunMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  /** Allowed pay dates per applicable date period */
  payDate: MetaDate;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /**
   * The breakdown of prior payroll totals collected for this pay date by the employer in
   * compensations, deductions and taxes withheld.
   */
  totals: EmployerPriorPayrollRunTotalsMetaModel;
  typeRef: Scalars['String']['output'];
};

/** Error object with details for updating employer prior payroll totals */
export type EmployerPriorPayrollRunMutationError = {
  __typename?: 'EmployerPriorPayrollRunMutationError';
  /** Error code for mutation */
  code: Scalars['String']['output'];
  /** Error message for the mutation */
  message: Scalars['String']['output'];
  /** Identifies which pay date had the problem if the error is date-specific */
  payDate?: Maybe<Scalars['Date']['output']>;
  /** Type of error for the mutation */
  type?: Maybe<Scalars['String']['output']>;
};

export type EmployerPriorPayrollRunSummary = {
  __typename?: 'EmployerPriorPayrollRunSummary';
  /** Read-only field for total gross amount paid on the pay date by the employer */
  compensations: Scalars['Money']['output'];
  /** Read-only field for total employee deductions on the pay date by the employer */
  employeeDeductions?: Maybe<Scalars['Money']['output']>;
  /** Read-only field for total taxes deducted on the pay date by the employer */
  employeeTaxes: Scalars['Money']['output'];
  /** Read-only field for total employer contributions on the pay date by the employer */
  employerContributions?: Maybe<Scalars['Money']['output']>;
};

export type EmployerPriorPayrollRunTax = {
  __typename?: 'EmployerPriorPayrollRunTax';
  /** Tax amount deducted for the given type in the pay date */
  amount: Scalars['Money']['output'];
  /** Defines the exact tax type */
  statutoryType: Scalars['String']['output'];
};


export type EmployerPriorPayrollRunTaxStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** Input type for tax totals inputted by the user for a given pay date */
export type EmployerPriorPayrollRunTaxInput = {
  /**
   * Represents the tax totals inputted for
   * the given tax type on the given pay date
   */
  amount: Scalars['Money']['input'];
  /** Defines the exact tax type */
  statutoryType: Scalars['String']['input'];
};

export type EmployerPriorPayrollRunTaxMetaModel = MetaModel & {
  __typename?: 'EmployerPriorPayrollRunTaxMetaModel';
  /** Meta model for the tax amount deducted for the given type in the pay date */
  amount: MetaMoney;
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** Defines the exact tax type */
  statutoryType: Scalars['String']['output'];
  typeRef: Scalars['String']['output'];
};

export type EmployerPriorPayrollRunTotals = {
  __typename?: 'EmployerPriorPayrollRunTotals';
  /** Compensation totals on the given pay date */
  compensations: Array<EmployerPriorPayrollRunCompensation>;
  /** Employee Deduction & Employer Contribution totals on the given pay date */
  deductions: Array<EmployerPriorPayrollRunDeduction>;
  /** Tax totals withheld on the given pay date */
  employeeTaxes: Array<EmployerPriorPayrollRunTax>;
};

/**
 * Input type for the breakdown of compensations, deductions & taxes in
 * the employer prior payroll inputted by the user for a given pay date
 */
export type EmployerPriorPayrollRunTotalsInput = {
  /** Compensation totals on the given pay date */
  compensations: Array<EmployerPriorPayrollRunCompensationInput>;
  /** Employee Deduction & Employer Contribution totals on the given pay date */
  deductions: Array<EmployerPriorPayrollRunDeductionInput>;
  /** Tax totals withheld on the given pay date */
  employeeTaxes: Array<EmployerPriorPayrollRunTaxInput>;
};

export type EmployerPriorPayrollRunTotalsMetaModel = MetaModel & {
  __typename?: 'EmployerPriorPayrollRunTotalsMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** Compensation totals on the given pay date */
  compensations: Array<EmployerPriorPayrollRunCompensationMetaModel>;
  /** Employee Deduction & Employer Contribution totals on the given pay date */
  deductions: Array<EmployerPriorPayrollRunDeductionMetaModel>;
  /** Tax totals withheld on the given pay date */
  employeeTaxes: Array<EmployerPriorPayrollRunTaxMetaModel>;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type EmployerPriorPayrollRunsInput = {
  /** Represents list of employer prior payroll run totals to be added */
  additions: Array<EmployerPriorPayrollRunInput>;
  /** Represents list of employer prior payroll run totals to be removed */
  removals: Array<EmployerPriorPayrollRunInput>;
};

/** Payload type for updated employer prior payroll run */
export type EmployerPriorPayrollRunsPayload = {
  __typename?: 'EmployerPriorPayrollRunsPayload';
  /** Specifies the date for the prior payroll run */
  payDate: Scalars['Date']['output'];
  /**
   * The breakdown of prior payroll totals collected for this pay date by the employer in
   * compensations, deductions and taxes withheld.
   */
  totals: EmployerPriorPayrollRunTotals;
};

export type EmployerPriorPayrollSummaryMismatch = {
  __typename?: 'EmployerPriorPayrollSummaryMismatch';
  /** Difference between the aggregated employee totals and employer totals */
  difference: Scalars['Money']['output'];
  /** Aggregated employee prior payroll summary in the specified date period */
  employeeSummary: Scalars['Money']['output'];
  /** Aggregated employer prior payroll summary in the specified date period */
  employerSummary: Scalars['Money']['output'];
};

export type EmployerPriorPayrollTaxItemPeriodBreakdown = {
  __typename?: 'EmployerPriorPayrollTaxItemPeriodBreakdown';
  /** Identifies the tax item */
  statutoryType: Scalars['String']['output'];
  /** Identifies the tax amounts for a given date period */
  toDateAmounts: Array<EmployerPriorPayrollTaxToDateAmount>;
};


export type EmployerPriorPayrollTaxItemPeriodBreakdownStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type EmployerPriorPayrollTaxItemPeriodBreakdownInput = {
  /** Identifies the tax item */
  statutoryType: Scalars['String']['input'];
  /** Identifies the tax amounts for a given date period */
  toDateAmounts: Array<EmployerPriorPayrollTaxToDateAmountInput>;
};

export type EmployerPriorPayrollTaxMismatch = {
  __typename?: 'EmployerPriorPayrollTaxMismatch';
  /**
   * Difference between the aggregated employee prior payroll
   * and employer prior payroll tax totals
   */
  difference: Scalars['Money']['output'];
  /** Aggregated tax totals in employee prior payroll in the specified date period */
  employeeTotal: Scalars['Money']['output'];
  /** Aggregated tax totals in employer prior payroll in the specified date period */
  employerTotal: Scalars['Money']['output'];
  /** Defines the exact tax type */
  statutoryType: Scalars['String']['output'];
};


export type EmployerPriorPayrollTaxMismatchStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type EmployerPriorPayrollTaxToDateAmount = {
  __typename?: 'EmployerPriorPayrollTaxToDateAmount';
  /** To-date monetary amount for time period */
  amount?: Maybe<Scalars['Money']['output']>;
  /** Date period for the total monetary amount */
  datePeriod: DatePeriod;
  /** Type of to-date amount */
  toDateAmountType: ToDateAmountType;
};

export type EmployerPriorPayrollTaxToDateAmountInput = {
  /** To-date monetary amount for time period */
  amount: Scalars['Money']['input'];
  /** Date period for the total monetary amount */
  datePeriod: PriorPayrollDatePeriodInput;
  /** Type of to-date amount */
  toDateAmountType: ToDateAmountType;
};

export type EmployerPriorPayrollTotalsMismatch = {
  __typename?: 'EmployerPriorPayrollTotalsMismatch';
  /** Mismatches in compensation totals in the specified date period. */
  compensations: Array<EmployerPriorPayrollCompensationMismatch>;
  /** Mismatches in employee deduction & employer contribution totals in the specified date period */
  deductions: Array<EmployerPriorPayrollDeductionMismatch>;
  /** Mismatches in tax totals withheld in the specified date period */
  employeeTaxes: Array<EmployerPriorPayrollTaxMismatch>;
};

export type EmployerPriorPayrollUpdateTaxBreakdownMutationError = {
  __typename?: 'EmployerPriorPayrollUpdateTaxBreakdownMutationError';
  /** Error code for mutation */
  code: Scalars['String']['output'];
  /** Error message for the mutation */
  message: Scalars['String']['output'];
  /** Identifies which tax item had the problem if the error is tax item specific */
  statutoryType: Scalars['String']['output'];
  /** Type of error for the mutation */
  type?: Maybe<Scalars['String']['output']>;
};


export type EmployerPriorPayrollUpdateTaxBreakdownMutationErrorStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** Defines the readiness of an Employer to be able to perform certain actions using the capabilities provided by the Payroll platform. */
export type EmployerReadiness = {
  __typename?: 'EmployerReadiness';
  autoPayroll?: Maybe<EmployerAutoPayrollReadiness>;
  payTaxes?: Maybe<EmployerPayTaxesReadiness>;
  payrollCollection?: Maybe<EmployerPayrollCollectionReadiness>;
  runPayroll?: Maybe<EmployerRunPayrollReadiness>;
};

/** Defines if the Employer is ready to run payroll for its employees or not. */
export type EmployerRunPayrollReadiness = Readiness & {
  __typename?: 'EmployerRunPayrollReadiness';
  /** @deprecated Use employerInfo.readiness.autoPayroll instead */
  autoPayroll?: Maybe<EmployerAutoPayrollReadiness>;
  deficiencies: Array<EntityReadinessDeficiency>;
  ready: Scalars['Boolean']['output'];
};

export type EmployerTaxIdentifier = Node & {
  __typename?: 'EmployerTaxIdentifier';
  id: Scalars['ID']['output'];
  /** The type of the Tax Identifier (FEIN/WH/SUI/etc) */
  taxIdentifierType: Scalars['String']['output'];
  /**
   * The value for the particular tax identifier being specified
   * The tax identifier value is used for filing taxes. By default the values are in full plain text, but
   * the sensitized (partially obfuscated) can be requested by specifying through the argument to protect privacy.
   */
  value?: Maybe<Scalars['String']['output']>;
};


export type EmployerTaxIdentifierTaxIdentifierTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


export type EmployerTaxIdentifierValueArgs = {
  sensitized?: InputMaybe<Scalars['Boolean']['input']>;
};

export type EmployerTaxIdentifierMetaModel = MetaModel & {
  __typename?: 'EmployerTaxIdentifierMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** The type of the Tax Identifier (FEIN/WH/SUI/etc) */
  taxIdentifierType: Scalars['String']['output'];
  typeRef: Scalars['String']['output'];
  /** The value for the particular tax identifier being specified */
  value: MetaString;
};

export type EmployerTaxItem = {
  __typename?: 'EmployerTaxItem';
  /** CMS ID for the tax item */
  id?: Maybe<Scalars['String']['output']>;
  /** The compliance API ID key and display name of the tax item */
  type: Scalars['String']['output'];
};


export type EmployerTaxItemTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type EmployerTaxPaymentGroup = {
  __typename?: 'EmployerTaxPaymentGroup';
  /** Applicable deposit frequency for the tax setup */
  depositFrequencies: Array<EmployerTaxSetupTaxDepositFrequency>;
  /** Tax Payment Electronic Service Data */
  electronicService?: Maybe<TaxPaymentElectronicService>;
  /** Applicable filing types for the tax setup */
  filingTypes: Array<VariableEnumField>;
  /** CMS ID for the tax payment group */
  id?: Maybe<Scalars['String']['output']>;
  /** Payment Collector responsible for collecting the taxes for the tax payment group. */
  paymentCollector?: Maybe<EmployerTaxSetupTaxPaymentCollector>;
  /** Tax setup readiness status and deficiencies */
  readiness?: Maybe<TaxPaymentGroupReadiness>;
  /** List of tax items under this taxPaymentGroup */
  taxItems: Array<EmployerTaxItem>;
  /** The Id of the TaxPayment Group this agency belongs to */
  taxPaymentGroupId: Scalars['String']['output'];
  /** Tax setup controls for this taxPaymentGroup */
  taxSetupControls: Array<TaxSetupControl>;
  /** List of Taxes for this taxPaymentGroup */
  taxes: Array<EmployerTaxSetupTax>;
};


export type EmployerTaxPaymentGroupTaxPaymentGroupIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


export type EmployerTaxPaymentGroupTaxSetupControlsArgs = {
  filterBy?: InputMaybe<TaxSetupControlFilter>;
};

export type EmployerTaxPaymentGroupInput = {
  /** @deprecated use `updateDepositFrequencies` instead */
  depositFrequencies?: InputMaybe<Array<EmployerTaxSetupTaxDepositFrequencyInput>>;
  filingTypes?: InputMaybe<Array<VariableEnumFieldInput>>;
  taxPaymentGroupId: Scalars['String']['input'];
  taxes?: InputMaybe<Array<EmployerTaxSetupTaxInput>>;
  updateDepositFrequencies?: InputMaybe<UpdateEmployerTaxSetupTaxDepositFrequenciesInput>;
};

export type EmployerTaxPaymentGroupMetaModel = {
  __typename?: 'EmployerTaxPaymentGroupMetaModel';
  /** Applicable deposit frequency for the tax setup */
  depositFrequencies: Array<EmployerTaxSetupTaxDepositFrequencyMetaModel>;
  /** Applicable filing types for the tax setup */
  filingTypes: Array<MetaVariableEnumField>;
  /** The Id of the TaxPayment Group this agency belongs to */
  taxPaymentGroupId: Scalars['String']['output'];
  /** List of Taxes for this taxPaymentGroup */
  taxes: Array<EmployerTaxSetupTaxMetaModel>;
};

/** Defines the structure for employer's tax information for a specific jurisdiction */
export type EmployerTaxSetup = EntityInterface & Node & {
  __typename?: 'EmployerTaxSetup';
  /** The agency object for storing all agency related details */
  agency: Agency;
  /**
   * The credentials used by the employer to communicate with the Tax agency. E.g. used by UK companies for tax filing submissions
   * @deprecated Use `agencyCredential` of Agency Object instead
   */
  agencyCredential?: Maybe<AgencyCredential>;
  /**
   * The unique identifier that represents this tax agency. A company will have have multiple EmployerTaxSetups where each one describes one of the tax agencies they belong to.
   * @deprecated Use `agencyId` of Agency Object instead
   */
  agencyId: Scalars['String']['output'];
  /** Taxes that the whole company, including employees, may be exempt from paying */
  exemptions: Array<TaxExemption>;
  externalIds?: Maybe<Array<Maybe<Common_ExternalId>>>;
  id: Scalars['ID']['output'];
  /** The id of the jurisdiction that other details like filing status, allowances etc applies to */
  jurisdictionId: Scalars['JurisdictionID']['output'];
  meta?: Maybe<Common_Metadata>;
  /** Metamodel representing fields with multiple allowed values for Employer Taxsetup */
  metaModel: EmployerTaxSetupMetaModel;
  /** Deduction policies that are configured by the employer, and are mandated as a tax */
  taxDeductions: Array<TaxDeductionPolicy>;
  /** Tax identifiers an employer has registered with the agency for the tax setup */
  taxIdentifiers: Array<EmployerTaxIdentifier>;
  /** The TaxPayment groups that belong to this Agency */
  taxPaymentGroups: Array<EmployerTaxPaymentGroup>;
};


/** Defines the structure for employer's tax information for a specific jurisdiction */
export type EmployerTaxSetupAgencyIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/** Defines the structure for employer's tax information for a specific jurisdiction */
export type EmployerTaxSetupExemptionsArgs = {
  filterBy?: InputMaybe<TaxExemptionFilter>;
};

/** Meta model for employer tax setup */
export type EmployerTaxSetupMetaModel = MetaModel & {
  __typename?: 'EmployerTaxSetupMetaModel';
  /**
   * The credentials used by the employer to communicate with the Tax agency. E.g. used by UK companies for tax filing submissions
   * @deprecated Use `agencyCredential` of AgencyMetaModel Object instead
   */
  agencyCredential: AgencyCredentialMetaModel;
  /**
   * The unique identifier that represents this tax agency. A company will have have multiple EmployerTaxSetups where each one describes one of the tax agencies they belong to.
   * @deprecated Use `agencyId` of AgencyMetaModel Object instead
   */
  agencyId: Scalars['String']['output'];
  applicable: Scalars['Boolean']['output'];
  /** List of exemptions that the company is eligible for in the tax setup */
  exemptions: Array<TaxExemptionMetaModel>;
  /** The id of the jurisdiction that other details like filing status, allowances etc applies to */
  jurisdictionId: Scalars['JurisdictionID']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** Meta model for all Tax Deduction Policies associated with the EmployerTaxSetup */
  taxDeductions: Array<TaxDeductionPolicyMetaModel>;
  /** Tax identifiers an employer has registered with the agency for the tax setup */
  taxIdentifiers: Array<EmployerTaxIdentifierMetaModel>;
  /** The TaxPayment Group this agency belongs to */
  taxPaymentGroups: Array<EmployerTaxPaymentGroupMetaModel>;
  typeRef: Scalars['String']['output'];
};


/** Meta model for employer tax setup */
export type EmployerTaxSetupMetaModelExemptionsArgs = {
  filterBy?: InputMaybe<TaxExemptionFilter>;
};

/** Defines if the Employer is setup for payments and filings */
export type EmployerTaxSetupReadiness = Readiness & {
  __typename?: 'EmployerTaxSetupReadiness';
  deficiencies: Array<ReadinessDeficiency>;
  ready: Scalars['Boolean']['output'];
};

export type EmployerTaxSetupTax = {
  __typename?: 'EmployerTaxSetupTax';
  /** Rates with effectiveDates applicable for this taxType */
  rates: Array<EmployerTaxSetupTaxRate>;
  /**
   * A tax code defined and assigned by a jurisdiction that is associated with this tax
   * @deprecated Use `taxCodes` instead
   */
  taxCode?: Maybe<Scalars['String']['output']>;
  /** Tax codes defined and assigned by a jurisdiction associated with this tax */
  taxCodes: Array<EmployerTaxSetupTaxCode>;
  /** The type of the tax e.g. TCTR-US_CA-SUI */
  taxType: Scalars['String']['output'];
};


export type EmployerTaxSetupTaxTaxTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** A tax code defined and assigned by a jurisdiction */
export type EmployerTaxSetupTaxCode = {
  __typename?: 'EmployerTaxSetupTaxCode';
  /** Date which this tax code is active from */
  effectiveDate: Scalars['Date']['output'];
  /** The value for this tax code */
  value: VariableTypeField;
};

/** A tax code defined and assigned by a jurisdiction */
export type EmployerTaxSetupTaxCodeInput = {
  /** Date which this tax code is active from */
  effectiveDate: Scalars['Date']['input'];
  /** The value for this tax code */
  value: VariableTypeFieldInput;
};

export type EmployerTaxSetupTaxCodeMetaModel = {
  __typename?: 'EmployerTaxSetupTaxCodeMetaModel';
  /** Allowed effective dates */
  effectiveDate: MetaDate;
  /** Allowed values for this tax code */
  value: MetaVariableTypeField;
};

export type EmployerTaxSetupTaxDepositFrequency = {
  __typename?: 'EmployerTaxSetupTaxDepositFrequency';
  /** Deposit Frequency for the jurisdiction */
  depositFrequencyType: Scalars['String']['output'];
  /** Date on which this tax deposit configuration will become active/is active from */
  effectiveDate: Scalars['Date']['output'];
};

export type EmployerTaxSetupTaxDepositFrequencyInput = {
  depositFrequencyType: Scalars['String']['input'];
  effectiveDate: Scalars['Date']['input'];
};

export type EmployerTaxSetupTaxDepositFrequencyMetaModel = {
  __typename?: 'EmployerTaxSetupTaxDepositFrequencyMetaModel';
  /** Allowed Deposit Frequencies per filing type. */
  depositFrequencyType: MetaEnum;
  /** Allowed effective dates per deposit frequency type */
  effectiveDate: MetaDate;
};

export type EmployerTaxSetupTaxInput = {
  rates?: InputMaybe<Array<EmployerTaxSetupTaxRateInput>>;
  taxCode?: InputMaybe<Scalars['String']['input']>;
  /** Tax codes defined and assigned by a jurisdiction associated with this tax */
  taxCodes?: InputMaybe<Array<EmployerTaxSetupTaxCodeInput>>;
  taxRates?: InputMaybe<UpdateEmployerTaxSetupTaxRatesInput>;
  taxType: Scalars['String']['input'];
};

export type EmployerTaxSetupTaxMetaModel = {
  __typename?: 'EmployerTaxSetupTaxMetaModel';
  /** Rates with effectiveDates applicable for this taxRateType */
  rates: Array<EmployerTaxSetupTaxRateMetaModel>;
  /**
   * A tax code defined and assigned by a jurisdiction that is associated with this tax
   * @deprecated Field no longer supported
   */
  taxCode: MetaString;
  /** Tax codes defined  and assigned by a jurisdiction that is associated with this tax */
  taxCodes?: Maybe<Array<Maybe<EmployerTaxSetupTaxCodeMetaModel>>>;
  /** The type of the tax e.g. TCTR-US_CA-SUI */
  taxType: Scalars['String']['output'];
};

export type EmployerTaxSetupTaxPaymentCollector = {
  __typename?: 'EmployerTaxSetupTaxPaymentCollector';
  /** Name of the agency responsible for collecting the tax payments */
  name: Scalars['String']['output'];
};

export type EmployerTaxSetupTaxRate = {
  __typename?: 'EmployerTaxSetupTaxRate';
  /** Date on which this tax rate configuration will become active/is active from */
  effectiveDate: Scalars['Date']['output'];
  /** The tax rate value for this type */
  value?: Maybe<Scalars['Float']['output']>;
};

export type EmployerTaxSetupTaxRateInput = {
  /**
   * For a given tax rate type there can be multiple unique values based on effective dates.
   * Effective date is normally the first day of the year but it also takes into account the form usage date if its prior to the current year
   */
  effectiveDate: Scalars['Date']['input'];
  value: Scalars['Float']['input'];
};

export type EmployerTaxSetupTaxRateMetaModel = {
  __typename?: 'EmployerTaxSetupTaxRateMetaModel';
  /** The date when this taxRate is effective */
  effectiveDate: Scalars['Date']['output'];
  /** The tax rate for this type */
  value: MetaFloat;
};

export type EmployerTimeOffPolicy = Node & {
  __typename?: 'EmployerTimeOffPolicy';
  /** Enum that is used to determine which type of time off hours this policy describes */
  category: TimeOffCategory;
  /**
   * Additional information about the time off category, including its unique identifier, display name, and whether it is a paid or unpaid category type.
   * This field is only populated when the category is CUSTOM_PAID or CUSTOM_UNPAID.
   */
  categoryDetail?: Maybe<TimeOffCategoryDetail>;
  /** A string that specifies a human readable representation of the time off policy */
  description?: Maybe<Scalars['String']['output']>;
  /** Assignment details of a policy - Policy can be assigned to multiple employees */
  employeeAssignmentsDetails?: Maybe<EmployeeTimeOffPolicyAssignmentsDetails>;
  /** For external ids, required field for node. */
  externalIds?: Maybe<Array<Common_ExternalId>>;
  /** The unique identifier for the time off policy */
  id: Scalars['ID']['output'];
  /** Name provided by the customer during the import flow that is not one of the available time offs in payroll. */
  importedName?: Maybe<Scalars['String']['output']>;
  /**
   * Specifies the details of the time off policy itself.
   * Will be set to null if timeOffMethod is not ACCRUAL_TIME or PAYOUT
   */
  policyDetail?: Maybe<TimeOffPolicyDetail>;
  /** A user defined name assigned to a TimeOff policy */
  policyName?: Maybe<Scalars['String']['output']>;
  /** Specifies the type of time off occurs at employer level */
  timeOffMethod: TimeOffMethod;
};

/** This input type provides the employer timeoff policy details */
export type EmployerTimeOffPolicyAssignmentInput = {
  /** Employer time off policy Id */
  policyId: Scalars['ID']['input'];
};

/** This input type provides the options for specifying employer timeoff policy details of an employee policy, and all of the options are mutually exclusive. Must specify one and only one of the fields in the input, i.e. only one of the input fields should be non-null. */
export type EmployerTimeOffPolicyDetailsInput = {
  /** Create a new employer time off policy */
  createNewPolicy?: InputMaybe<CreateEmployerTimeOffPolicyInput>;
  /** Use existing employer time off policy */
  existingPolicyId?: InputMaybe<Scalars['ID']['input']>;
  /** Name provided by the customer during the import flow that is not one of the available time offs in payroll. */
  importedName?: InputMaybe<Scalars['String']['input']>;
};

export type EmployerTimeOffPolicyFilter = {
  /** Filter options for employer time off policies. Currently supports filtering by ID, but can be extended to support filtering by other fields. */
  id?: InputMaybe<IdFilter>;
};

export type EmployerTotalPayrollCostReport = {
  __typename?: 'EmployerTotalPayrollCostReport';
  breakdown: EmployerPayrollCostBreakdown;
  /** Employer payroll cost report with report data rendering detail */
  renderings?: Maybe<EmployerTotalPayrollCostReportRenderings>;
  /**
   * The sum of money paid by an employer to cover their employees which includes
   * employee's total compensation including gross pay and additional reported pay,
   * employer taxes and employer contributions.
   */
  totalEmployerPayrollCost: Scalars['Money']['output'];
};

export type EmployerTotalPayrollCostReportEmployeeFilter = {
  /**
   * Employer payroll cost can be determined for payslips
   * filtered by employee's current workers compensation classes
   */
  workersCompensationClass?: InputMaybe<StringFilter>;
};

/** Optional data can be excluded for employer total payroll cost report excel rendering */
export enum EmployerTotalPayrollCostReportExcelOptionalData {
  Compensations = 'COMPENSATIONS',
  EmployerContributions = 'EMPLOYER_CONTRIBUTIONS',
  EmployerPayrollCost = 'EMPLOYER_PAYROLL_COST',
  EmployerTaxes = 'EMPLOYER_TAXES'
}

/** Input fields for employer total payroll cost report excel rendering */
export type EmployerTotalPayrollCostReportExcelRenderInput = {
  /** Specifies the optional data that can additionally be excluded in the excel file rendering */
  excludedData?: InputMaybe<Array<EmployerTotalPayrollCostReportExcelOptionalData>>;
};

export type EmployerTotalPayrollCostReportFilter = {
  /**
   * Employer payroll cost can be determined for payslips filtered by
   * employee's current information
   */
  employee?: InputMaybe<EmployerTotalPayrollCostReportEmployeeFilter>;
  payDate: PayslipPayDateFilter;
  /** Employer payroll cost can be determined for payslips filtered by work location id */
  workLocation?: InputMaybe<PayslipWorkLocationFilter>;
};

export type EmployerTotalPayrollCostReportInput = {
  filterBy: EmployerTotalPayrollCostReportFilter;
};

/** Optional data can be excluded for employer total payroll cost report pdf rendering */
export enum EmployerTotalPayrollCostReportPdfOptionalData {
  Compensations = 'COMPENSATIONS',
  EmployerContributions = 'EMPLOYER_CONTRIBUTIONS',
  EmployerPayrollCost = 'EMPLOYER_PAYROLL_COST',
  EmployerTaxes = 'EMPLOYER_TAXES'
}

/** Input fields for employer total payroll cost report pdf rendering */
export type EmployerTotalPayrollCostReportPdfRenderInput = {
  /** Specifies the optional data that can additionally be excluded in the pdf file rendering */
  excludedData?: InputMaybe<Array<EmployerTotalPayrollCostReportPdfOptionalData>>;
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Provides details for employer total payroll cost report renderings e.g. excel, pdf */
export type EmployerTotalPayrollCostReportRenderings = {
  __typename?: 'EmployerTotalPayrollCostReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/** Provides details for employer total payroll cost report renderings e.g. excel, pdf */
export type EmployerTotalPayrollCostReportRenderingsExcelArgs = {
  input?: InputMaybe<EmployerTotalPayrollCostReportExcelRenderInput>;
};


/** Provides details for employer total payroll cost report renderings e.g. excel, pdf */
export type EmployerTotalPayrollCostReportRenderingsPdfArgs = {
  input?: InputMaybe<EmployerTotalPayrollCostReportPdfRenderInput>;
};

/** Workers compensation class */
export type EmployerWorkersCompensationClass = Node & {
  __typename?: 'EmployerWorkersCompensationClass';
  /** Name of the workers compensation class */
  employeeClass: Scalars['String']['output'];
  /** id of the employee class or type of work */
  id: Scalars['ID']['output'];
  /** True if the class is assigned to an employee; otherwise false */
  isAssignedToEmployee: Scalars['Boolean']['output'];
  /** Jurisdiction identifier in the format of C[country_code]_L1[state/province code], e.g, CUS_L1WA or CCA_L1AB */
  jurisdictionId: Scalars['String']['output'];
  /** An array of rates that will be used to determine the rate for the employee class on a given date using the rates Effective date. */
  rates: Array<EmployerWorkersCompensationRate>;
};

/** Input for filtering workers compensation classes for an employer */
export type EmployerWorkersCompensationClassFilter = {
  type: WorkersCompensationClassType;
};

export type EmployerWorkersCompensationRate = {
  __typename?: 'EmployerWorkersCompensationRate';
  /** the Effective date is used to calculate a contiguous series of rates over time that will be applied to the employee class on a given date. */
  effectiveDate: Scalars['Date']['output'];
  /**
   * The worker's compensation rate percentage (effective as of its effective date).
   * To specify 3.25%, provide 3.25
   */
  rate: Scalars['Float']['output'];
};

/** Input rate type for create and update EmployerWorkersCompensationClass mutations */
export type EmployerWorkersCompensationRateInput = {
  effectiveDate: Scalars['Date']['input'];
  rate: Scalars['Float']['input'];
};

/** The type of employment whether it is full time, part time or temporary */
export enum EmploymentClassification {
  FullTime = 'FULL_TIME',
  PartTime = 'PART_TIME',
  Temporary = 'TEMPORARY'
}

export type EmploymentDetailMetaModel = MetaModel & {
  __typename?: 'EmploymentDetailMetaModel';
  applicable: Scalars['Boolean']['output'];
  employeeIdentifier: MetaString;
  employmentType: MetaEnum;
  healthInsuranceEligibility: MetaBoolean;
  hireDate: MetaDate;
  jobDeclaration: MetaEnum;
  jobTitle: MetaString;
  label: Scalars['String']['output'];
  occupationalClassification: MetaString;
  paidIrregularly?: Maybe<MetaBoolean>;
  payrollNumber: PayrollNumberMetaModel;
  readOnly: Scalars['Boolean']['output'];
  reportingUnit: ReportingUnitMetaModel;
  requirementGroups: Array<RequirementGroup>;
  statusReason: MetaEnum;
  terminationDate: MetaDate;
  typeRef: Scalars['String']['output'];
  /** @deprecated Use primaryWorkLocation instead */
  workLocation: CompanyAddressMetaModel;
};

/** Information pertaining to identity and employment authorization for an employee hired to work for employment eligibility verification. */
export type EmploymentEligibility = {
  __typename?: 'EmploymentEligibility';
  /** Ascertains if the person can be hired to work and holds the verification details provided to verify employment eligibility. */
  employmentEligibilityVerification?: Maybe<EmploymentEligibilityVerification>;
  /** If true, the employee will be enabled to fill out the employment eligibility requirements electronically through workforce self setup. */
  enableElectronicSubmission: Scalars['Boolean']['output'];
  /** Represents the citizenship or immigration legal status of the employee, which allows them to be employed */
  legalStatus?: Maybe<Scalars['String']['output']>;
};


/** Information pertaining to identity and employment authorization for an employee hired to work for employment eligibility verification. */
export type EmploymentEligibilityLegalStatusArgs = {
  sensitized?: InputMaybe<Scalars['Boolean']['input']>;
};

export type EmploymentEligibilityError = {
  __typename?: 'EmploymentEligibilityError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type EmploymentEligibilityInput = {
  verificationFilter?: InputMaybe<EmploymentEligibilityVerificationFilter>;
};

export type EmploymentEligibilityRequiredVerification = {
  __typename?: 'EmploymentEligibilityRequiredVerification';
  /** Holds all values provided to fill out the verification */
  attributes: Array<VariableTypeField>;
  /** Requirement that needs to be fulfilled to complete the verification */
  employmentEligibilityRequirement: EmploymentEligibilityRequirement;
  /** Date on which the verification is due to expire and a new verification is needed */
  expirationDate?: Maybe<Scalars['Date']['output']>;
  /** ID of the verification */
  id: Scalars['ID']['output'];
  /**
   * Rendering for the Verification document (eg. I9 form PDF)
   * Can return the preview / final document, depending on the status of the verification
   */
  rendering?: Maybe<EmploymentEligibilityRequiredVerificationRendering>;
  /** Provides the status of the verification. Eg: IN_PROGRESS, SIGNED_BY_EMPLOYEE, VERIFIED_BY_EMPLOYER */
  status: Scalars['String']['output'];
  /** Documents provided to verify the authenticity of the data used to fill out the employment form document */
  supportingDocuments?: Maybe<Array<VerificationDocument>>;
  /** Date on which the verification is due to verify */
  verificationDueDate?: Maybe<Scalars['Date']['output']>;
};


export type EmploymentEligibilityRequiredVerificationAttributesArgs = {
  sensitized?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Detail values to fill the employment eligibility required verification */
export type EmploymentEligibilityRequiredVerificationAttributesInput = {
  /** List of attributes of the verification requirement to add or update if already existing */
  additions: Array<VariableTypeFieldInput>;
  /** List of attribute fieldIds of the verification requirement to be deleted if existing */
  removals: Array<Scalars['String']['input']>;
};

export type EmploymentEligibilityRequiredVerificationError = {
  __typename?: 'EmploymentEligibilityRequiredVerificationError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Requirement that needs to be fulfilled to complete the employment eligibility verification */
export type EmploymentEligibilityRequiredVerificationInput = {
  /** Detail values to fill the employment eligibility requirement document */
  attributes?: InputMaybe<EmploymentEligibilityRequiredVerificationAttributesInput>;
  employeeId: Scalars['ID']['input'];
  requiredVerificationId: Scalars['ID']['input'];
  /** Documentary evidence for verification of the employment eligibility requirement document */
  supportingDocuments?: InputMaybe<Array<VerificationDocumentInput>>;
};

/** Type for Verification document renderings */
export type EmploymentEligibilityRequiredVerificationRendering = {
  __typename?: 'EmploymentEligibilityRequiredVerificationRendering';
  pdf?: Maybe<FileRendering>;
};

/** An employment form that can be filed, contains no customer data but rather describes the form */
export type EmploymentEligibilityRequirement = {
  __typename?: 'EmploymentEligibilityRequirement';
  /** Description of the employment eligibility requirement */
  description: Scalars['String']['output'];
  /** The jurisdiction the form applies to */
  jurisdictionId: Scalars['JurisdictionID']['output'];
  /**
   * Unique identifier for this employment eligibility requirement
   * E.g. TEER_CUS_EI9FORM | I9 form for United states
   */
  statutoryType: Scalars['String']['output'];
};


/** An employment form that can be filed, contains no customer data but rather describes the form */
export type EmploymentEligibilityRequirementStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** Employees need to be legally authorized to be employed. EmploymentEligibilityVerification holds the details provided to verify that the employee is authorized */
export type EmploymentEligibilityVerification = {
  __typename?: 'EmploymentEligibilityVerification';
  /** Represents the status of the Employment Eligibility Verification after evaluating all verifications */
  verificationStatus: EmploymentEligibilityVerificationStatus;
  verifications: Array<EmploymentEligibilityRequiredVerification>;
};

/** Filter for Employment Verifications */
export type EmploymentEligibilityVerificationFilter = {
  id?: InputMaybe<IdFilter>;
};

export type EmploymentEligibilityVerificationStatus = {
  __typename?: 'EmploymentEligibilityVerificationStatus';
  /** Provides the status of the verification. Eg: IN_PROGRESS, VERIFIED, MISSING_DATA */
  status: Scalars['String']['output'];
};

export type EmploymentHistoryConnection = {
  __typename?: 'EmploymentHistoryConnection';
  edges: Array<EmploymentHistoryEdge>;
  pageInfo: PageInfo;
};

export type EmploymentHistoryEdge = {
  __typename?: 'EmploymentHistoryEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<EmploymentHistoryNode>;
};

export type EmploymentHistoryNode = HistoryNode & {
  __typename?: 'EmploymentHistoryNode';
  /** Represents the action on the employee - CREATE / UPDATE / DELETE */
  action?: Maybe<Scalars['String']['output']>;
  /** Represents the employee's department */
  department?: Maybe<Department>;
  /** Represents the employment status detail (Active, Paid Leave, Unpaid Leave, Not On Payroll, Terminated, Deceased) */
  detailedStatus?: Maybe<Scalars['String']['output']>;
  /** end date when the employment history is effective till */
  effectiveEndDate?: Maybe<Scalars['Date']['output']>;
  /** start date when the employment history is effective from */
  effectiveStartDate: Scalars['Date']['output'];
  /** This field denotes whether the employee is eligible to be rehired */
  eligibleToRehire?: Maybe<Scalars['Boolean']['output']>;
  /** The type of employment whether it is full time, part time or temporary */
  employmentClassification?: Maybe<EmploymentClassification>;
  /** Employee's first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** Employee's hire date */
  hireDate?: Maybe<Scalars['Date']['output']>;
  /** Employee's home address */
  homeAddress?: Maybe<Common_Address>;
  /** Employee's job title */
  jobTitle?: Maybe<Scalars['String']['output']>;
  /** Employee's last name */
  lastName?: Maybe<Scalars['String']['output']>;
  /** Employee's mailing address */
  mailingAddress?: Maybe<Common_Address>;
  /** Represents the manager of the employee */
  manager?: Maybe<Employee>;
  /** Employee's middle initial */
  middleInitial?: Maybe<Scalars['String']['output']>;
  /** Reason for employment status change */
  statusReason?: Maybe<Scalars['String']['output']>;
  /** Reason for termination of an employee */
  terminationReason?: Maybe<Scalars['String']['output']>;
  /** Date when the assignment was made */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** User or the system who made the assignment */
  updatedBy?: Maybe<HistoryNodeUpdatedBy>;
};

export type EmploymentPaymentRecordReport = {
  __typename?: 'EmploymentPaymentRecordReport';
  renderings?: Maybe<EmploymentPaymentRecordReportRenderings>;
};

/** Employee payment record report can be filtered by fiscal year. */
export type EmploymentPaymentRecordReportFilter = {
  dateFilter: ReportTaxYearRangeFilter;
};

/** Input filter for employee payment record report */
export type EmploymentPaymentRecordReportInput = {
  filterBy: EmploymentPaymentRecordReportFilter;
};

export type EmploymentPaymentRecordReportRenderings = {
  __typename?: 'EmploymentPaymentRecordReportRenderings';
  pdf: FileRendering;
};

export type EmploymentRelationshipError = {
  __typename?: 'EmploymentRelationshipError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type EmploymentStatusFilter = {
  active?: InputMaybe<BooleanFilter>;
  detailedStatus?: InputMaybe<StringFilter>;
};

/** This is the employment type to describe whether an employee is seasonal or not */
export enum EmploymentType {
  Seasonal = 'SEASONAL',
  Unspecified = 'UNSPECIFIED'
}

/**
 * [/Entity](https://schema.intuit.com/#data:/Entity)
 * All directly addressable entities derive from this base class.
 */
export type EntityInterface = {
  externalIds?: Maybe<Array<Maybe<Common_ExternalId>>>;
  id: Scalars['ID']['output'];
  /**
   * Contains meta-data details common to all entities in the system such as
   * who/what/when created and/or modified the entity. All entities are required to
   * support these fields
   */
  meta?: Maybe<Common_Metadata>;
};

/**
 * Describes the failing or shortcoming that is contributing to the lack of readiness, and optionally an action
 * that can be taken to correct it, based on each entity definition contributing to the readiness capability.
 */
export type EntityReadinessDeficiency = ReadinessDeficiency & {
  __typename?: 'EntityReadinessDeficiency';
  /** Attributes explaining the entity. eg. In tax setup deficiencies jurisdiction of tax setup, Taxtype. */
  attributes: Array<VariableTypeField>;
  deficiencies: Array<AcuteReadinessDeficiency>;
  /** Describes this failing or shortcoming that is contributing to the lack of readiness, e.g. 'Tax setup incomplete for employee John' */
  description: Scalars['String']['output'];
  entity: Scalars['String']['output'];
  remediation?: Maybe<UserActionable>;
};

/** Variability data describing the rules of a particular field that is an Enum type, represented as a String in the schema. */
export type EnumSchema = {
  __typename?: 'EnumSchema';
  /** All the allowedValues for this property */
  allowedValues?: Maybe<Array<Maybe<AllowedValue>>>;
};

/** Escrow related information */
export type EscrowTaxPreferences = {
  __typename?: 'EscrowTaxPreferences';
  /** Value of the escrow tax enabled */
  escrowTaxEnabled: Scalars['Boolean']['output'];
};

export type EscrowTaxPreferencesInput = {
  /** Boolean value to set the impounding/escrow tax enabled field */
  escrowTaxEnabled: Scalars['Boolean']['input'];
};

/** Input for the exemptEmployeeWorkersCompensationInput mutation. */
export type ExemptEmployeeFromWorkersCompensationInput = {
  /** Flag to retroactively apply rates to paychecks for WC liability. Required true if paychecks exist during effective date time period. */
  applyRateRetroactively: Scalars['Boolean']['input'];
  /** The ID of the company */
  companyId: Scalars['ID']['input'];
  /** The ID of the employee for whom the exempt workers' compensation policy has to be assigned. */
  employeeId: Scalars['ID']['input'];
};

/** Result payload of exemptEmployeeWorkersCompensation mutation. */
export type ExemptEmployeeFromWorkersCompensationPayload = {
  __typename?: 'ExemptEmployeeFromWorkersCompensationPayload';
  /** Employee workers' compensation policy that was assigned as a result of the mutation. */
  employeeManagedWorkersCompensationClass?: Maybe<EmployeeManagedWorkersCompensationClass>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<WorkersCompensationError>;
};

export type ExportTransactionsToAccountingApiPayload = ExportTransactionsToAccountingPayload & {
  __typename?: 'ExportTransactionsToAccountingApiPayload';
  /** List of successfully exported contractor payments */
  contractorPayments: Array<ContractorPayment>;
  /** List of error details for an unsuccessful export */
  errors: Array<ExportTransactionsToAccountingError>;
  /** List of successfully exported employer debits */
  exportedEmployerDebitIds: Array<Scalars['ID']['output']>;
  /** List of successfully exported payslips */
  payslips: Array<Payslip>;
  /** List of successfully exported taxpayments */
  taxPayments: Array<Payroll_Payments_TaxPayment>;
};

export type ExportTransactionsToAccountingError = {
  /** The error code */
  code: Scalars['String']['output'];
  /** The error message */
  message: Scalars['String']['output'];
  /** The error type */
  type?: Maybe<Scalars['String']['output']>;
};

export type ExportTransactionsToAccountingFileDownloadPayload = ExportTransactionsToAccountingPayload & {
  __typename?: 'ExportTransactionsToAccountingFileDownloadPayload';
  /** List of successfully exported contractor payments */
  contractorPayments: Array<ContractorPayment>;
  /** List of error details for an unsuccessful export */
  errors: Array<ExportTransactionsToAccountingError>;
  /** List of successfully exported employer debits */
  exportedEmployerDebitIds: Array<Scalars['ID']['output']>;
  /** The URL of the file containing the exported accounting data for transactions that were specified. This file and its URL are both transient. */
  fileUrl?: Maybe<Scalars['String']['output']>;
  /** List of successfully exported payslips */
  payslips: Array<Payslip>;
  /** List of successfully exported taxpayments */
  taxPayments: Array<Payroll_Payments_TaxPayment>;
};

export type ExportTransactionsToAccountingInput = {
  companyId: Scalars['ID']['input'];
  contractorPaymentIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  employerDebitIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  payslipIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  taxPaymentIds?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type ExportTransactionsToAccountingPayload = {
  /** List of successfully exported contractor payments */
  contractorPayments: Array<ContractorPayment>;
  /** List of error details for an unsuccessful export */
  errors: Array<ExportTransactionsToAccountingError>;
  /** List of successfully exported employer debits */
  exportedEmployerDebitIds: Array<Scalars['ID']['output']>;
  /** List of successfully exported payslips */
  payslips: Array<Payslip>;
  /** List of successfully exported taxpayments */
  taxPayments: Array<Payroll_Payments_TaxPayment>;
};

export type ExternalEmployeeWorkersCompensationClassInput = {
  employeeClass?: InputMaybe<Scalars['String']['input']>;
};

/** Workers compensation class manged by the employer themselves or by using another service they are partnered with. */
export type ExternalWorkersCompensationClass = WorkersCompensationClass & {
  __typename?: 'ExternalWorkersCompensationClass';
  /** Name of the workers compensation class */
  employeeClass?: Maybe<Scalars['String']['output']>;
};

/** Input type for the document data extraction mutation */
export type ExtractDataFromDocumentsInput = {
  /** The id for company */
  companyId: Scalars['ID']['input'];
  /** The id for the document to be extracted and the fields to be extracted from the document */
  documentsAndFieldsToExtract: Array<DocumentAndFieldsToExtract>;
  /** The id of the employee */
  employeeId: Scalars['ID']['input'];
};

/** Payload type for the document data extraction mutation */
export type ExtractDataFromDocumentsPayload = {
  __typename?: 'ExtractDataFromDocumentsPayload';
  /** The id for company */
  companyId: Scalars['ID']['output'];
  /** The id for employee */
  employeeId: Scalars['ID']['output'];
  /** The list of document id and the data extracted from the document */
  extractedDocumentsData: Array<ExtractedDocumentDataPayload>;
};

/** Payload type containing the extracted data and any errors for a single document */
export type ExtractedDocumentDataPayload = {
  __typename?: 'ExtractedDocumentDataPayload';
  /** The id for the document */
  documentId: Scalars['ID']['output'];
  /** The data extracted from the document. It is a JSON string. Consumers can parse it and extract the data. Eg: JSON.parse(extractedData) */
  extractedData: Scalars['String']['output'];
  /** The error for the document extraction */
  extractionError?: Maybe<Array<DocumentExtractionError>>;
};

/** File rendering return type including generated file url */
export type FileRendering = {
  __typename?: 'FileRendering';
  fileUrl: Scalars['String']['output'];
};

/** The status of the deferred employee tax setup feature. This feature is only accessable in FTU under specific conditions. */
export type FirstTimePayrollSetupDeferredEmployeeTaxSetup = {
  __typename?: 'FirstTimePayrollSetupDeferredEmployeeTaxSetup';
  /** Indicates whether the deferred employee tax setup feature can be activated for this company. */
  eligible: Scalars['Boolean']['output'];
  /** Indicates whether the deferred employee tax setup feature is active or not. */
  enabled: Scalars['Boolean']['output'];
  /**
   * Indicates whether or not the client prefers to have deferred employee tax setup activated. Initially this
   * value is null, though it can be changed by the client to be true or false. If the value is true and the
   * company is eligible for deferred setup, then deferred employee tax setup will be activated. If eligibility
   * changes due to changes in the company or employee configuration then deferred employee tax setup will
   * automatically be deactivated.
   */
  preferred?: Maybe<Scalars['Boolean']['output']>;
};

/** A field that can be adjusted in the filing */
export type FormFieldsAdjustmentInput = {
  /** List of fields that can be adjusted */
  fields?: InputMaybe<Array<AdjustableFilingFieldInput>>;
  /** Additional notes regarding the adjustment, to be sent to an audit service where agents, and later customers would be able to see the notes they provided. */
  notes?: InputMaybe<Scalars['String']['input']>;
};

/** Templates of forms downloaded by the customer and then print and sent to agencies, which are not tracked as taxFilings */
export type FormTemplate = {
  __typename?: 'FormTemplate';
  formDocument?: Maybe<TaxFormDocument>;
};

/** Filter to identify whether to query for which type of template form */
export type FormTemplateDocumentConnectionFilter = {
  taxFormCategory: TaxFormCategory;
};

/**
 * Used to specifiy how the localized label for the field's opaque string value will be resolved
 *
 * This is used only for the formattedKey schema directive and should be omitted from the exposed schema.
 */
export enum FormattedKeyLabelResolution {
  /** The field's resolver function must implement handling of the `format` argument and resolving the localized label string */
  Unspecified = 'UNSPECIFIED'
}

/**
 * Garnishment policy details that are assigned to an employee
 * Examples includes child/spousal support, federal tax levy etc.
 */
export type GarnishmentPolicy = DeductionPolicy & Node & {
  __typename?: 'GarnishmentPolicy';
  /** Determines this garnishment category */
  category: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** A deduction name/description */
  name: Scalars['String']['output'];
  /** Defines the exact types (including taxability) that are supported by region (e.g. CUS_DED_CHILD_SUPPORT_AFTER_TAX) */
  statutoryType: Scalars['String']['output'];
  /** Subcategory of this garnishment */
  subCategory: Scalars['String']['output'];
  /** Indicates deduction is a pre-tax or post-tax */
  taxOption: TaxOption;
};


/**
 * Garnishment policy details that are assigned to an employee
 * Examples includes child/spousal support, federal tax levy etc.
 */
export type GarnishmentPolicyCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/**
 * Garnishment policy details that are assigned to an employee
 * Examples includes child/spousal support, federal tax levy etc.
 */
export type GarnishmentPolicyStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/**
 * Garnishment policy details that are assigned to an employee
 * Examples includes child/spousal support, federal tax levy etc.
 */
export type GarnishmentPolicySubCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/**
 * Determines how multiple garnishments will be prioritised when the salary
 * is not enough to pay all of them
 */
export type GarnishmentPriority = {
  __typename?: 'GarnishmentPriority';
  /** Defines the algorithm to calculate the priority for garnishments */
  calculationMethod: Scalars['String']['output'];
  /** Array of key pair values to configure the current calculation method */
  calculationMethodConfiguration?: Maybe<Array<VariableTypeField>>;
};


/**
 * Determines how multiple garnishments will be prioritised when the salary
 * is not enough to pay all of them
 */
export type GarnishmentPriorityCalculationMethodArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type GarnishmentPriorityMetaModel = MetaModel & {
  __typename?: 'GarnishmentPriorityMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** The metamodel for calculationMethod */
  calculationMethod: MetaEnum;
  /** The metamodel for calculationMethodConfiguration */
  calculationMethodConfiguration: Array<MetaVariableTypeField>;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type GenerateDraftPayrollRunWarningsEmployeePayrollRunInput = {
  /** Employee's deductions calculated during this payroll run */
  calculatedDeductions: Array<PayrollRunCalculatedDeductionInput>;
  /** Employee taxes calculated to be withheld as part of this payroll run */
  calculatedEmployeeTaxes: Array<PayrollRunCalculatedTaxInput>;
  /** Employer taxes calculated to be withheld as part of this payroll run */
  calculatedEmployerTaxes: Array<PayrollRunCalculatedTaxInput>;
  /** Employee id for this payroll run */
  employeeId: Scalars['ID']['input'];
  /** Id of employee payroll run to to generate warnings */
  id: Scalars['ID']['input'];
  /** Net pay distribution for this employee payroll run */
  netPayDistributions: Array<PayrollRunNetPayDistributionInput>;
};

/** Input to generate warnings for draft payroll run */
export type GenerateDraftPayrollRunWarningsInput = {
  /** Realm id of the company */
  companyId: Scalars['ID']['input'];
  /** List of employee payroll runs to be used to generate warnings */
  employeePayrollRunInputs: Array<GenerateDraftPayrollRunWarningsEmployeePayrollRunInput>;
  /** Id of company payroll run to generate warnings */
  id: Scalars['ID']['input'];
  /** Includes relevant dates like pay period dates and paydate for this payroll run */
  payrollDateSummary: PayrollDateSummaryInput;
};

/** Result of generateDraftPayrollRunWarnings mutation */
export type GenerateDraftPayrollRunWarningsPayload = {
  __typename?: 'GenerateDraftPayrollRunWarningsPayload';
  /** Info/Warning/Blocker messages encountered while running this payroll */
  messages: Array<PayrollRunMessage>;
  /** Company's cost distribution for this payroll run */
  payrollCostDistributions: Array<PayrollCostDistribution>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<PayrollRunUserError>;
};

/**
 * Tax reporting information for health coverage overridable by customer.
 * For example, in US this represents amounts in Box 12FF and Box 12DD on employee's W-2
 */
export type HealthCoverageBenefitCost = {
  __typename?: 'HealthCoverageBenefitCost';
  /**
   * Field to store maximum reimbursement of healthcare-related costs.
   * For eg in US, Permitted benefits under a qualified small employer health insurance reimbursement arrangement
   */
  maxPermissibleReimbursement?: Maybe<Scalars['Money']['output']>;
  /**
   * Field to store total cost of healthcare to employer and employee for tax reporting purposes
   * for example on box 12DD of W2.
   */
  totalContributionCost?: Maybe<ToDateAmount>;
};

export type HealthCoverageBenefitCostInput = {
  maxPermissibleReimbursement?: InputMaybe<Scalars['Money']['input']>;
  /** Total cost and max benefit are optional */
  totalContributionCost?: InputMaybe<Scalars['Money']['input']>;
};

export type HireDateRangeFilter = {
  endDate: Scalars['Date']['input'];
  startDate: Scalars['Date']['input'];
};

/** Includes all the historical changes of an employee's profile */
export type History = {
  __typename?: 'History';
  departmentHistory?: Maybe<DepartmentHistoryConnection>;
  employeeCompensationsHistory?: Maybe<Array<Maybe<EmployeeCompensationsHistory>>>;
  employmentHistory?: Maybe<EmploymentHistoryConnection>;
  payContractHistory?: Maybe<PayContractHistoryConnection>;
};


/** Includes all the historical changes of an employee's profile */
export type HistoryDepartmentHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


/** Includes all the historical changes of an employee's profile */
export type HistoryEmploymentHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};


/** Includes all the historical changes of an employee's profile */
export type HistoryPayContractHistoryArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  filterBy?: InputMaybe<EmployerCompensationsFilter>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

/** Period input to filter history records between a date range */
export type HistoryDatePeriodFilter = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};

/** Common filter for all history connections for an employee */
export type HistoryFilter = {
  period?: InputMaybe<HistoryDatePeriodFilter>;
};

export type HistoryNode = {
  /** end date the history value is effective till */
  effectiveEndDate?: Maybe<Scalars['Date']['output']>;
  /** start date when the history value is effective from */
  effectiveStartDate: Scalars['Date']['output'];
  /** Date when the change was made */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** who made the change */
  updatedBy?: Maybe<HistoryNodeUpdatedBy>;
};

/**
 * User or the system who changed the specific entity (performs CRUD operations on an entity)
 * More information on this type available in this doc
 *  https://docs.google.com/document/d/1ssmDu9onRkBLuG_4gZxO9OnSWFBMTDaY7rXO_8CkLRY/edit#heading=h.c422dswrtlc1
 */
export type HistoryNodeUpdatedBy = {
  __typename?: 'HistoryNodeUpdatedBy';
  /** Type defining who made the change */
  type: HistoryNodeUpdatedByEnum;
  /** The value can be the user Id, name of the system that made the change, etc., based on the type */
  value?: Maybe<Scalars['String']['output']>;
};

/** Supported types */
export enum HistoryNodeUpdatedByEnum {
  System = 'SYSTEM',
  Unknown = 'UNKNOWN',
  User = 'USER'
}

export enum HoldType {
  Lock = 'LOCK',
  PaymentFraud = 'PAYMENT_FRAUD',
  PaymentNsf = 'PAYMENT_NSF'
}

export type IdFilter = {
  eq?: InputMaybe<Scalars['ID']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
};

/** The imported data associated with this company */
export type ImportedCompany = {
  __typename?: 'ImportedCompany';
  company: Company;
  companyInfo: ImportedCompanyInfo;
  /** List of employees that have been imported from other systems */
  employees: Array<ImportedEmployee>;
};


/** The imported data associated with this company */
export type ImportedCompanyEmployeesArgs = {
  input?: InputMaybe<ImportedEmployeeInput>;
};

export type ImportedCompanyInfo = {
  __typename?: 'ImportedCompanyInfo';
  employerInfo: ImportedEmployerInfo;
};

/** List of imported deduction policies */
export type ImportedDeductionPolicy = {
  __typename?: 'ImportedDeductionPolicy';
  /** Lists applicable taxes for the payitem */
  applicableTaxes: Array<ImportedPayItemWithheldTax>;
  /** Deduction policy associated to this imported data */
  deductionPolicy?: Maybe<DeductionPolicy>;
  /** List of Imported employee deductions associated with this particular Employer Deduction policy */
  employeeDeductions?: Maybe<Array<ImportedEmployeeDeduction>>;
  /** Indicates who has mapped the policy most recently */
  mappingAuthor: MappingAuthor;
  /** Deduction policy name */
  name: Scalars['String']['output'];
  /** Deduction policy type */
  type: VariableStringField;
};

/** Employee that has been imported from other systems */
export type ImportedEmployee = {
  __typename?: 'ImportedEmployee';
  employee: Employee;
  /** Desktop Employee status before migration to online payroll */
  employmentStatus?: Maybe<Payroll_Employee_EmploymentStatus>;
  /** Employee last pay date imported from DT */
  lastPayDate?: Maybe<Scalars['Date']['output']>;
  /** Prior payroll information for the employees imported from other systems. */
  priorPayroll?: Maybe<ImportedEmployeePriorPayroll>;
};

/** Employee compensations which have not been mapped yet to any company compensation policy */
export type ImportedEmployeeCompensation = {
  __typename?: 'ImportedEmployeeCompensation';
  /** Employee compensation mapped to this imported employee compensation. */
  employeeCompensation?: Maybe<EmployeeCompensation>;
  /** Imported Employee associated with this employee compensation */
  importedEmployee: ImportedEmployee;
  /** Compensation policy name */
  name: Scalars['String']['output'];
  /** The money rate this compensation is paid with */
  rate?: Maybe<PayRate>;
};

/** Employee deductions which have not been mapped yet to any company deduction policy */
export type ImportedEmployeeDeduction = {
  __typename?: 'ImportedEmployeeDeduction';
  /** Describes the contribution amount and cappings contributed by employee i.e. deducted from employee's paycheck */
  employeeContribution?: Maybe<EmployeeContribution>;
  /** Employee deduction mapped to the imported employee deduction. */
  employeeDeduction?: Maybe<EmployeeDeduction>;
  /** Describes the contribution amount and cappings contributed by company */
  employerContribution?: Maybe<EmployerContribution>;
  /** Imported Employee associated with this employee deduction */
  importedEmployee: ImportedEmployee;
  /** Deduction policy name */
  name: Scalars['String']['output'];
};

export enum ImportedEmployeeDetails {
  EmployeeWithNoPriorPayroll = 'EMPLOYEE_WITH_NO_PRIOR_PAYROLL',
  EmployeeWithPriorPayroll = 'EMPLOYEE_WITH_PRIOR_PAYROLL'
}

export type ImportedEmployeeFilter = {
  eq?: InputMaybe<ImportedEmployeeDetails>;
};

export type ImportedEmployeeInput = {
  filterBy?: InputMaybe<ImportedEmployeeFilter>;
};

/**
 * Payroll information for an employee paid within the most recent year by the same company when company is switching
 * from a different product
 */
export type ImportedEmployeePriorPayroll = {
  __typename?: 'ImportedEmployeePriorPayroll';
  /** The breakdown totals for the imported employee as present in the source i.e. pdf report, xml file etc */
  importedPeriods: Array<ImportedEmployeePriorPayrollPeriod>;
};

/** Specifies how much the employee was paid in the given date period */
export type ImportedEmployeePriorPayrollPeriod = {
  __typename?: 'ImportedEmployeePriorPayrollPeriod';
  /** Identifies the date range for this period */
  datePeriod: DatePeriod;
  /**
   * The breakdown totals of prior payroll information collected this period for the employee's
   * compensations, deductions and withheld taxes.
   */
  importedTotals: ImportedEmployeePriorPayrollPeriodTotals;
};

/**
 * The breakdown of totals for an individual period's prior payroll collected per employee for
 * all compensation, deductions and withheld taxes.
 */
export type ImportedEmployeePriorPayrollPeriodTotals = {
  __typename?: 'ImportedEmployeePriorPayrollPeriodTotals';
  /** The breakdown of imported employee taxes */
  importedEmployeeTaxes: Array<ImportedEmployeeTax>;
};

/** Represents a tax type for an employee's historic paycheck */
export type ImportedEmployeePriorPayrollTax = {
  __typename?: 'ImportedEmployeePriorPayrollTax';
  /** Defines the over or under withheld tax amount */
  adjustedTaxAmount?: Maybe<Scalars['Money']['output']>;
  /** Defines the exact tax type */
  statutoryType: Scalars['String']['output'];
  /** Defines tax amount withheld */
  taxAmount: Scalars['Money']['output'];
};


/** Represents a tax type for an employee's historic paycheck */
export type ImportedEmployeePriorPayrollTaxStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** The breakdown of each statutory type  prior payroll tax details for the imported employee */
export type ImportedEmployeeTax = {
  __typename?: 'ImportedEmployeeTax';
  /** Defines actual tax amount withheld */
  amountWithheld: Scalars['Money']['output'];
  /** Defines correct tax amount should have been withheld */
  expectedAmountWithheld: Scalars['Money']['output'];
  /** Prior payroll tax details for each saturatory type */
  importedPriorPayrollTaxes: Array<ImportedEmployeePriorPayrollTax>;
  /** Defines sum of total amount either over or under withheld */
  totalAdjustedAmountWithheld: Scalars['Money']['output'];
  /** Defines the total taxable wage for the imported employee */
  totalTaxableWages: Scalars['Money']['output'];
};

/** Employee Timeoff balance imported from other providers */
export type ImportedEmployeeTimeOffBalance = {
  __typename?: 'ImportedEmployeeTimeOffBalance';
  /**
   * The monetary balance indicating available monetary amount balance and YTD monetary amount used.
   * Currently only applicable for Canadian companies.
   */
  monetaryBalance?: Maybe<MonetaryBalance>;
  /** The time balance indicating available time balance and YTD time used */
  timeBalance?: Maybe<TimeBalance>;
};

/** Employee Timeoff policies which have not been mapped yet to any company Timeoff policy */
export type ImportedEmployeeTimeOffPolicy = {
  __typename?: 'ImportedEmployeeTimeOffPolicy';
  /** Employee timeoff mapped to the imported employee timeoff. */
  employeeTimeOff?: Maybe<EmployeeTimeOffPolicy>;
  /** Imported Employee associated with this employee timeoff */
  importedEmployee: ImportedEmployee;
  /** Policy Name */
  name: Scalars['String']['output'];
  /** Employee Timeoff balance imported from other providers */
  timeOffBalance?: Maybe<ImportedEmployeeTimeOffBalance>;
};

/** List of imported compensation policies */
export type ImportedEmployerCompensation = {
  __typename?: 'ImportedEmployerCompensation';
  /** Lists applicable taxes for the payitem */
  applicableTaxes: Array<ImportedPayItemWithheldTax>;
  /** List of Imported employee compensations associated with this particular Employer Compensation policy */
  employeeCompensations?: Maybe<Array<ImportedEmployeeCompensation>>;
  /** Compensation policy associated to this imported data */
  employerCompensation?: Maybe<EmployerCompensation>;
  /** Indicates who has mapped the policy most recently */
  mappingAuthor: MappingAuthor;
  /** Compensation policy name */
  name: Scalars['String']['output'];
  /** Compensation policy type */
  type: VariableStringField;
};

export type ImportedEmployerInfo = {
  __typename?: 'ImportedEmployerInfo';
  /** List of imported compensation policies */
  employerCompensations?: Maybe<Array<ImportedEmployerCompensation>>;
  /** List of imported deduction policies */
  employerDeductions?: Maybe<Array<ImportedDeductionPolicy>>;
  /** List of imported tax items */
  taxItems?: Maybe<Array<ImportedTaxItem>>;
  /** List of imported time-off policies */
  timeOffPolicies?: Maybe<Array<ImportedEmployerTimeOffPolicy>>;
};

/** List of imported time off policies */
export type ImportedEmployerTimeOffPolicy = {
  __typename?: 'ImportedEmployerTimeOffPolicy';
  /** Lists applicable taxes for the payitem */
  applicableTaxes: Array<ImportedPayItemWithheldTax>;
  /** List of Imported employee time off policies associated with this particular Employer Time off policy */
  employeeTimeOffPolicies?: Maybe<Array<ImportedEmployeeTimeOffPolicy>>;
  /** TimeOff policy associated to this imported data */
  employerTimeOffPolicy?: Maybe<EmployerTimeOffPolicy>;
  /** Indicates who has mapped the policy most recently */
  mappingAuthor: MappingAuthor;
  /** Time off policy name */
  name: Scalars['String']['output'];
  /** TimeOffPolicy type */
  type: VariableStringField;
};

export type ImportedPayHistoryError = {
  __typename?: 'ImportedPayHistoryError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export enum ImportedPayHistoryState {
  Failed = 'FAILED',
  Success = 'SUCCESS'
}

/** The breakdown of each applicable statutory type taxes */
export type ImportedPayItemWithheldTax = {
  __typename?: 'ImportedPayItemWithheldTax';
  /** Defines the exact tax type */
  statutoryType: Scalars['String']['output'];
};


/** The breakdown of each applicable statutory type taxes */
export type ImportedPayItemWithheldTaxStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** Represents the tax mapping details for the imported tax item */
export type ImportedTaxItem = {
  __typename?: 'ImportedTaxItem';
  /** Employees who were mapped to this imported tax item */
  employees: Array<Employee>;
  /** Imported tax item name */
  name: Scalars['String']['output'];
  /** All the possible QBOP tax items available to map with this imported third party tax item */
  potentialTaxItems: Array<TaxItem>;
  /** Name of the third party payroll provider */
  priorPayrollProvider: Scalars['String']['output'];
  /** Tax item mapped to this imported tax item */
  taxItem?: Maybe<TaxItem>;
};

/** Name detail for individual contractor */
export type IndividualContractorNameDetail = {
  __typename?: 'IndividualContractorNameDetail';
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  middleInitial?: Maybe<Scalars['String']['output']>;
};

export type IntFilter = {
  gte?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
};

export type JurisdictionOverrideInput = {
  /**
   * Location to override residential jurisdiction with.
   * Exclusive with political sub division.
   */
  location?: InputMaybe<JurisdictionOverrideLocationInput>;
  /**
   * Political sub division, used in certain areas to specify school district. e.g PA and OH
   * Exclusive with location.
   */
  politicalSubDivision?: InputMaybe<Scalars['String']['input']>;
};

export type JurisdictionOverrideLocationInput = {
  city: Scalars['String']['input'];
  county?: InputMaybe<Scalars['String']['input']>;
  zip: Scalars['String']['input'];
};

export enum LeaveCategory {
  MaternityLeave = 'MATERNITY_LEAVE',
  NeonatalCareLeave = 'NEONATAL_CARE_LEAVE',
  PaternityLeave = 'PATERNITY_LEAVE',
  SickLeave = 'SICK_LEAVE',
  UnpaidLeave = 'UNPAID_LEAVE'
}

export type LeavePeriodError = {
  __typename?: 'LeavePeriodError';
  code?: Maybe<Scalars['String']['output']>;
  employeeId?: Maybe<Scalars['String']['output']>;
  employeeLeavePeriodId?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type LedgerAccount = {
  __typename?: 'LedgerAccount';
  /** Specifies external IDs, for e.g. accountId maintained by QBO. */
  externalIds: Array<Common_ExternalId>;
  metaModel: LedgerAccountMetaModel;
  /** Specifies the assigned account name. */
  name?: Maybe<Scalars['String']['output']>;
  /** Specifies the type of the assigned account such as BANK, EXPENSE, ASSET or LIABILITY. */
  type: Scalars['String']['output'];
};

export type LedgerAccountMetaModel = MetaModel & {
  __typename?: 'LedgerAccountMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** The type of account such as BANK, EXPENSE, ASSET or LIABILITY determines the list of possible account names for an account */
  type: MetaEnum;
  typeRef: Scalars['String']['output'];
};

export type ManagerFilter = {
  /** Filter to find employees with manager. */
  hasManager?: InputMaybe<BooleanFilter>;
  id?: InputMaybe<IdFilter>;
};

export enum MappingAuthor {
  None = 'NONE',
  System = 'SYSTEM',
  User = 'USER'
}

export type MaternalLeavePeriod = EmployeeLeavePeriod & Node & {
  __typename?: 'MaternalLeavePeriod';
  /** Baby's birth date for maternity leave */
  babyBirthDate?: Maybe<Scalars['Date']['output']>;
  /** Baby's due date for maternity leave */
  babyDueDate: Scalars['Date']['output'];
  /** Used to determine the type of leave */
  category: LeaveCategory;
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['output'];
  /** End date of the employee leave which is optional */
  endDate?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  /**
   * The wage reference to compute employee wages during the leave period.
   * It is a temporal value that could potentially change for every leave period
   * e.g. average weekly earnings of the employee at the time of taking the leave.
   */
  leaveWageReference?: Maybe<Scalars['Money']['output']>;
};

/** Rule indicating if the contribution rate needs to match the maxPercentage */
export type MaxPercentageRequiredRules = {
  __typename?: 'MaxPercentageRequiredRules';
  dependsOn: Array<DependsOn>;
  maxPercentageRequired: Scalars['Boolean']['output'];
};

/** A message to show to the user */
export type Message = {
  /** Code to identify message */
  code: Scalars['String']['output'];
  /** Short description */
  message?: Maybe<Scalars['String']['output']>;
  /** Type of the message (Info, Warning, Blocker) */
  type: MessageType;
};

/** Describes different types of messages */
export enum MessageType {
  Blocker = 'BLOCKER',
  Info = 'INFO',
  Warning = 'WARNING'
}

export type MetaAllowedValue = {
  __typename?: 'MetaAllowedValue';
  label: Scalars['String']['output'];
  value: Scalars['String']['output'];
};

export type MetaBoolean = MetaType & {
  __typename?: 'MetaBoolean';
  label: Scalars['String']['output'];
  rules: Array<MetaBooleanRule>;
  typeRef: Scalars['String']['output'];
};

export type MetaBooleanRule = MetaModelRule & {
  __typename?: 'MetaBooleanRule';
  applicable: Scalars['Boolean']['output'];
  dependsOn: Array<DependsOn>;
  /** i18n field label pertaining to a false boolean value */
  falseLabel?: Maybe<Scalars['String']['output']>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** i18n field label pertaining to a true boolean value */
  trueLabel?: Maybe<Scalars['String']['output']>;
};

export type MetaDate = MetaType & {
  __typename?: 'MetaDate';
  label: Scalars['String']['output'];
  rules: Array<MetaDateRule>;
  typeRef: Scalars['String']['output'];
};

export type MetaDateRule = MetaModelRule & {
  __typename?: 'MetaDateRule';
  allowedValues: Array<Scalars['Date']['output']>;
  applicable: Scalars['Boolean']['output'];
  dependsOn: Array<DependsOn>;
  max?: Maybe<Scalars['Date']['output']>;
  min?: Maybe<Scalars['Date']['output']>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
};

export type MetaDateTime = MetaType & {
  __typename?: 'MetaDateTime';
  label: Scalars['String']['output'];
  rules: Array<MetaDateTimeRule>;
  typeRef: Scalars['String']['output'];
};

export type MetaDateTimeRule = MetaModelRule & {
  __typename?: 'MetaDateTimeRule';
  applicable: Scalars['Boolean']['output'];
  dependsOn: Array<DependsOn>;
  max?: Maybe<Scalars['DateTime']['output']>;
  min?: Maybe<Scalars['DateTime']['output']>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
};

export type MetaDeductionPolicyApplicable = {
  __typename?: 'MetaDeductionPolicyApplicable';
  category: Scalars['String']['output'];
  subCategory: Scalars['String']['output'];
};

export type MetaEnum = MetaType & {
  __typename?: 'MetaEnum';
  label: Scalars['String']['output'];
  rules: Array<MetaEnumRule>;
  typeRef: Scalars['String']['output'];
};

export type MetaEnumRule = MetaModelRule & {
  __typename?: 'MetaEnumRule';
  allowedValues: Array<MetaAllowedValue>;
  applicable: Scalars['Boolean']['output'];
  default?: Maybe<Scalars['String']['output']>;
  dependsOn: Array<DependsOn>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
};

export type MetaFloat = MetaType & {
  __typename?: 'MetaFloat';
  label: Scalars['String']['output'];
  rules: Array<MetaFloatRule>;
  typeRef: Scalars['String']['output'];
};

export type MetaFloatRule = MetaModelRule & {
  __typename?: 'MetaFloatRule';
  allowedValues: Array<Scalars['Float']['output']>;
  applicable: Scalars['Boolean']['output'];
  default?: Maybe<Scalars['Float']['output']>;
  dependsOn: Array<DependsOn>;
  max?: Maybe<Scalars['Float']['output']>;
  min?: Maybe<Scalars['Float']['output']>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
};

export type MetaInt = MetaType & {
  __typename?: 'MetaInt';
  label: Scalars['String']['output'];
  rules: Array<MetaIntRule>;
  typeRef: Scalars['String']['output'];
};

export type MetaIntRule = MetaModelRule & {
  __typename?: 'MetaIntRule';
  applicable: Scalars['Boolean']['output'];
  dependsOn: Array<DependsOn>;
  max?: Maybe<Scalars['Int']['output']>;
  min?: Maybe<Scalars['Int']['output']>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
};

/** These are types defines MetaModel rules for any field in the schema. */
export type MetaModel = {
  /**
   * If a field is not applicable it should be ignored. It will be ignored in any Mutation
   * and it will always return null in any query.
   */
  applicable: Scalars['Boolean']['output'];
  /** i18n field label */
  label: Scalars['String']['output'];
  /** If a field is readOnly it cannot be modified. Trying to modify this value will produce an error */
  readOnly: Scalars['Boolean']['output'];
  /** This field defines when the field is required. See RequirementGroup for more details */
  requirementGroups: Array<RequirementGroup>;
  /** Reference Type of this entity */
  typeRef: Scalars['String']['output'];
};

export type MetaModelRule = {
  /**
   * If a field is not applicable it should be ignored. It will be ignored in any Mutation
   * and it will always return null in any query.
   */
  applicable: Scalars['Boolean']['output'];
  /** List of required dependencies to apply this rule */
  dependsOn: Array<DependsOn>;
  /** If a field is readOnly it cannot be modified. Trying to modify this value will produce an error */
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
};

export type MetaModels = {
  __typename?: 'MetaModels';
  /** Metamodel representing fields with multiple allowed values for Employee Setup */
  employeeMetaModel: EmployeeMetaModel;
  employeePayslipMetaModel?: Maybe<Payroll_Payslip_EmployeePayslipMetaModel>;
};

export type MetaMoney = MetaType & {
  __typename?: 'MetaMoney';
  label: Scalars['String']['output'];
  rules: Array<MetaMoneyRule>;
  typeRef: Scalars['String']['output'];
};

export type MetaMoneyRule = MetaModelRule & {
  __typename?: 'MetaMoneyRule';
  applicable: Scalars['Boolean']['output'];
  default?: Maybe<Scalars['Money']['output']>;
  dependsOn: Array<DependsOn>;
  max?: Maybe<Scalars['Money']['output']>;
  min?: Maybe<Scalars['Money']['output']>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
};

export type MetaString = MetaType & {
  __typename?: 'MetaString';
  label: Scalars['String']['output'];
  rules: Array<MetaStringRule>;
  typeRef: Scalars['String']['output'];
};

export type MetaStringRule = MetaModelRule & {
  __typename?: 'MetaStringRule';
  applicable: Scalars['Boolean']['output'];
  dependsOn: Array<DependsOn>;
  /** This field provides an example format of the string to be used based on the rules defined in this type. e.g. 'xxx-xx-xxxx' */
  format?: Maybe<Scalars['String']['output']>;
  maxLength?: Maybe<Scalars['Int']['output']>;
  minLength?: Maybe<Scalars['Int']['output']>;
  readOnly: Scalars['Boolean']['output'];
  regexes: Array<Scalars['String']['output']>;
  requirementGroups: Array<RequirementGroup>;
};

export type MetaType = {
  /** i18n field label */
  label: Scalars['String']['output'];
  /** Reference Type of this entity */
  typeRef: Scalars['String']['output'];
};

export type MetaVariableBooleanField = MetaVariableField & {
  __typename?: 'MetaVariableBooleanField';
  fieldId: Scalars['String']['output'];
  value: MetaBoolean;
};

export type MetaVariableDateField = MetaVariableField & {
  __typename?: 'MetaVariableDateField';
  fieldId: Scalars['String']['output'];
  value: MetaDate;
};

export type MetaVariableDateTimeField = MetaVariableField & {
  __typename?: 'MetaVariableDateTimeField';
  fieldId: Scalars['String']['output'];
  value: MetaDateTime;
};

export type MetaVariableEnumField = MetaVariableField & {
  __typename?: 'MetaVariableEnumField';
  fieldId: Scalars['String']['output'];
  value: MetaEnum;
};

export type MetaVariableField = {
  fieldId: Scalars['String']['output'];
};

export type MetaVariableFloatField = MetaVariableField & {
  __typename?: 'MetaVariableFloatField';
  fieldId: Scalars['String']['output'];
  value: MetaFloat;
};

export type MetaVariableIntField = MetaVariableField & {
  __typename?: 'MetaVariableIntField';
  fieldId: Scalars['String']['output'];
  value: MetaInt;
};

export type MetaVariableMoneyField = MetaVariableField & {
  __typename?: 'MetaVariableMoneyField';
  fieldId: Scalars['String']['output'];
  value: MetaMoney;
};

export type MetaVariableStringField = MetaVariableField & {
  __typename?: 'MetaVariableStringField';
  fieldId: Scalars['String']['output'];
  value: MetaString;
};

export type MetaVariableTypeField = MetaVariableBooleanField | MetaVariableDateField | MetaVariableDateTimeField | MetaVariableEnumField | MetaVariableFloatField | MetaVariableIntField | MetaVariableMoneyField | MetaVariableStringField;

export enum MigrationStatus {
  /** Company information is not found */
  DataNotFound = 'DATA_NOT_FOUND',
  /** Company is not migrated */
  Failed = 'FAILED',
  /** Migration is in progress */
  InProgress = 'IN_PROGRESS',
  /** Company is migrated */
  Success = 'SUCCESS'
}

export type MigrationUserError = {
  __typename?: 'MigrationUserError';
  /** error code */
  code?: Maybe<Scalars['String']['output']>;
  /** A description of the error */
  message: Scalars['String']['output'];
  /** error type */
  type?: Maybe<Scalars['String']['output']>;
};

export type MiscDeductionEmployeeConnection = {
  __typename?: 'MiscDeductionEmployeeConnection';
  edges?: Maybe<Array<Maybe<EmployeeEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/**
 * Miscellaneous deductions that an employer may choose to offer in their company
 * Examples includes Health Savings Account and other deductions
 */
export type MiscDeductionPolicy = DeductionPolicy & Node & {
  __typename?: 'MiscDeductionPolicy';
  /** Whether this policy is currently active */
  active: Scalars['Boolean']['output'];
  /** Determines this deduction category */
  category: Scalars['String']['output'];
  /** Provides the list of employees related to the current misc deduction */
  employees?: Maybe<MiscDeductionEmployeeConnection>;
  id: Scalars['ID']['output'];
  /** A deduction name/description */
  name: Scalars['String']['output'];
  /** Name of the deduction provider (e.g. GoCo). Null indicates no provider is associated. */
  providerName?: Maybe<Scalars['String']['output']>;
  /** Defines the exact types (including taxability) that are supported by region (e.g. CUS_DED_FSA_AFTER_TAX) */
  statutoryType: Scalars['String']['output'];
  /** SubCategory of this deduction */
  subCategory: Scalars['String']['output'];
  /** Indicates deduction is a pre-tax or post-tax */
  taxOption: TaxOption;
};


/**
 * Miscellaneous deductions that an employer may choose to offer in their company
 * Examples includes Health Savings Account and other deductions
 */
export type MiscDeductionPolicyCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/**
 * Miscellaneous deductions that an employer may choose to offer in their company
 * Examples includes Health Savings Account and other deductions
 */
export type MiscDeductionPolicyEmployeesArgs = {
  filterBy?: InputMaybe<PayrollPolicyEmployeesFilter>;
  orderBy?: InputMaybe<Array<EmployeesWithContributionOrderBy>>;
  pagination?: InputMaybe<PaginationInput>;
};


/**
 * Miscellaneous deductions that an employer may choose to offer in their company
 * Examples includes Health Savings Account and other deductions
 */
export type MiscDeductionPolicyProviderNameArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/**
 * Miscellaneous deductions that an employer may choose to offer in their company
 * Examples includes Health Savings Account and other deductions
 */
export type MiscDeductionPolicyStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/**
 * Miscellaneous deductions that an employer may choose to offer in their company
 * Examples includes Health Savings Account and other deductions
 */
export type MiscDeductionPolicySubCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** Additional tax info that is reported on at an employee level */
export type MiscTaxReporting = {
  __typename?: 'MiscTaxReporting';
  /**
   * The offered benefits associated with this employee
   * Example: Used to disclose what types of dental benefits are offered to employee for reporting on the T4
   */
  offeredBenefits: Array<MiscTaxReportingOfferedEmployeeBenefit>;
};

/** Type that stores offered employee benefits for tax reporting purposes */
export type MiscTaxReportingOfferedEmployeeBenefit = {
  __typename?: 'MiscTaxReportingOfferedEmployeeBenefit';
  attribute: VariableStringField;
};

export type MiscTaxReportingOfferedEmployeeBenefitError = {
  __typename?: 'MiscTaxReportingOfferedEmployeeBenefitError';
  code?: Maybe<Scalars['String']['output']>;
  employeeId: Scalars['ID']['output'];
  fieldId?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
  value?: Maybe<Scalars['String']['output']>;
};

export type MiscTaxReportingOfferedEmployeeBenefitInput = {
  attribute: VariableStringFieldInput;
  /** The ID of the employee for whom the offered benefit is for */
  employeeId: Scalars['ID']['input'];
};

export type MonetaryBalance = {
  __typename?: 'MonetaryBalance';
  /** The total monetary amount that an employee has available to use for the given time off policy */
  currentBalance: Scalars['Money']['output'];
  /** The total monetary amount that an employee has already used during this year for the given time off policy */
  yearToDateAmountUsed: Scalars['Money']['output'];
};

export type MonetaryBalanceInput = {
  currentBalance: Scalars['Money']['input'];
};

export enum Month {
  April = 'APRIL',
  August = 'AUGUST',
  December = 'DECEMBER',
  February = 'FEBRUARY',
  January = 'JANUARY',
  July = 'JULY',
  June = 'JUNE',
  March = 'MARCH',
  May = 'MAY',
  November = 'NOVEMBER',
  October = 'OCTOBER',
  September = 'SEPTEMBER'
}

export type Mutation = {
  __typename?: 'Mutation';
  addEmployeeToDepartment?: Maybe<AddEmployeeToDepartmentPayload>;
  addReportee?: Maybe<AddReporteePayload>;
  /** Adding a new work location to the company. This will create a new CompanyAddress that is included in the Work Locations list */
  addWorkLocation?: Maybe<AddWorkLocationPayload>;
  adjustPriorPayroll?: Maybe<AdjustPriorPayrollPayload>;
  /** Schedule a tax payment to either be paid electronically or record through QuickBooks. The payment returned may have a different ID */
  approveAndScheduleTaxPayment?: Maybe<ApproveAndScheduleTaxPaymentPayload>;
  /** Save an archived copy of a manual filing and mark it as Filed */
  archiveManualTaxFiling?: Maybe<ArchiveManualTaxFilingPayload>;
  /** Save an archived copy of a manual tax form and mark it as Filed */
  archiveManualTaxForm?: Maybe<ArchiveManualTaxFormPayload>;
  /** Assigns multiple time off policies to an employee for a given employeeId and the timeoff policies input */
  assignBatchEmployeeTimeOffPolicies?: Maybe<EmployeeTimeOffPoliciesPayload>;
  assignEmployeeWorkersCompensation?: Maybe<AssignEmployeeWorkersCompensationPayload>;
  assignPayScheduleToEmployee?: Maybe<AssignPayScheduleToEmployeePayload>;
  /** Auto fill payslip check numbers based on initial check number */
  autoFillPayslipCheckNumber?: Maybe<AutoFillPayslipCheckNumberPayload>;
  batchAssignPayScheduleToEmployee?: Maybe<BatchAssignPayScheduleToEmployeePayload>;
  /**
   * batchCreateEmployeeBenefits allows the client to use an existing benefit policy and assign it to the employees hence creating a new employee benefit of that type.
   * or activate an already existing one. Once batchCreateEmployeeBenefits has been fully supported, we can deprecate createEmployeeBenefit
   * as this will perform the same functionality but for multiple employees at at time (PD-239789).
   */
  batchCreateEmployeeBenefits?: Maybe<BatchCreateEmployeeBenefitsPayload>;
  /**
   * batchCreateEmployeeBenefitsAndPolicy allows the client to create a new benefit policy for employer and assign it to the employees hence creating a new employee benefit of that type.
   * Once batchCreateEmployeeBenefitsAndPolicy has been fully supported, we can deprecate createEmployeeBenefitAndPolicy
   * as this will perform the same functionality but for multiple employees at at time (PD-238953).
   */
  batchCreateEmployeeBenefitsAndPolicy?: Maybe<BatchCreateEmployeeBenefitsAndPolicyPayload>;
  batchCreateEmployeeContractDetails?: Maybe<BatchCreateEmployeeContractDetailsPayload>;
  /** Batch create employee garnishments given employeeIds and garnishment details */
  batchCreateEmployeeGarnishments?: Maybe<BatchCreateEmployeeGarnishmentsPayload>;
  /**
   * batchCreateEmployeeMiscDeductions allows the client to use an existing miscellaneous deduction policy and assign it to the employee hence creating a new employee miscellaneous deduction of that type.
   * or activate an already existing one. Once batchCreateEmployeeMiscDeductions has been fully supported, we can deprecate createEmployeeMiscDeduction
   * as this will perform the same functionality but for multiple employees at at time (PD-239789).
   */
  batchCreateEmployeeMiscDeductions?: Maybe<BatchCreateEmployeeMiscDeductionsPayload>;
  /**
   * batchCreateEmployeeMiscDeductionsAndPolicy allows the client to create a new miscellaneous deduction policy for employer and assign it to the employee hence creating a new employee miscellaneous deduction of that type.
   * Once batchCreateEmployeeMiscDeductionsAndPolicy has been fully supported, we can deprecate createEmployeeMiscDeductionAndPolicy
   * as this will perform the same functionality but for multiple employees at at time (PD-238953).
   */
  batchCreateEmployeeMiscDeductionsAndPolicy?: Maybe<BatchCreateEmployeeMiscDeductionsAndPolicyPayload>;
  /** Batch creates employee payroll runs for multiple employees to be associated with given company payroll run */
  batchCreateEmployeePayrollRun?: Maybe<BatchCreateEmployeePayrollRunPayload>;
  /**
   * batchCreateEmployeePensions allows the client to use an existing pensionPolicy and assign it to the employees hence creating a new employee pension of that type.
   * or activate an already existing one. Once batchCreateEmployeePensions has been fully supported, we can deprecate createEmployeePension
   * as this will perform the same functionality but for multiple employees at at time (PD-239789).
   */
  batchCreateEmployeePensions?: Maybe<BatchCreateEmployeePensionsPayload>;
  /**
   * batchCreateEmployeePensionsAndPolicy allows the client to create a new pensionPolicy for employer and assign it to the employees hence creating a new employee pension of that type.
   * Once batchCreateEmployeePensionsAndPolicy has been fully supported, we can deprecate createEmployeePensionAndPolicy
   * as this will perform the same functionality but for multiple employees at at time (PD-238953).
   */
  batchCreateEmployeePensionsAndPolicy?: Maybe<BatchCreateEmployeePensionsAndPolicyPayload>;
  /** batchCreateMiscTaxReportingOfferedEmployeeBenefit allows the client to create new offered employee benefits */
  batchCreateMiscTaxReportingOfferedEmployeeBenefits?: Maybe<BatchCreateMiscTaxReportingOfferedEmployeeBenefitsPayload>;
  /**
   * batchCreateOrUpdateEmployeeCompensations allows the client to create employeeCompensations for multiple employees at a time.
   * This might also involve creating employerCompensations if they don't yet exist.
   *
   * Once batchCreateOrUpdateEmployeeCompensations has been fully supported, we can deprecate setupEmployeeCompensations
   * as this will perform the same functionality but for multiple employees at at time (PD-238195).
   */
  batchCreateOrUpdateEmployeeCompensations?: Maybe<BatchCreateOrUpdateEmployeeCompensationsPayload>;
  /** Creates company tasks */
  batchCreateTasks?: Maybe<BatchCreateTasksPayload>;
  batchDeleteAdjustmentPayslips?: Maybe<BatchDeleteAdjustmentPayslipsPayload>;
  batchDeleteAdjustments?: Maybe<BatchDeleteAdjustmentsPayload>;
  /**
   * batchDeleteEmployeeBenefits allows the client to delete existing list of employee benefit.
   * Once batchDeleteEmployeeBenefits has been fully supported, we can deprecate deleteEmployeeBenefit
   * as this will perform the same functionality but for multiple employees at at time (PD-238951).
   */
  batchDeleteEmployeeBenefits?: Maybe<BatchDeleteEmployeeBenefitsPayload>;
  /** Deletes employee garnishments */
  batchDeleteEmployeeGarnishments?: Maybe<BatchDeleteEmployeeGarnishmentsPayload>;
  /**
   * batchDeleteEmployeeMiscDeductions allows the client to delete existing employee miscellaneous deduction.
   * Once batchDeleteEmployeeMiscDeductions has been fully supported, we can deprecate deleteEmployeeMiscDeduction
   * as this will perform the same functionality but for multiple employees at at time (PD-238951).
   */
  batchDeleteEmployeeMiscDeductions?: Maybe<BatchDeleteEmployeeMiscDeductionsPayload>;
  /**
   * batchDeleteEmployeePensions allows the client to delete existing employee pension.
   * Once batchDeleteEmployeePensions has been fully supported, we can deprecate deleteEmployeePension
   * as this will perform the same functionality but for multiple employees at at time (PD-238951).
   */
  batchDeleteEmployeePensions?: Maybe<BatchDeleteEmployeePensionsPayload>;
  /** Delete a batch of employee time off policies given the employeeIds and policy ids */
  batchDeleteEmployeeTimeOffPolicies?: Maybe<BatchDeleteEmployeeTimeOffPoliciesPayload>;
  /** Deletes existing tasks */
  batchDeleteTasks?: Maybe<BatchDeleteTasksPayload>;
  batchEvaluateEmployeePriorPayrolls?: Maybe<BatchEvaluateEmployeePriorPayrollsPayload>;
  /** Creates a batch of employee time off policies given the employeeIds and the timeoff policy input. */
  batchSetupEmployeeTimeOffPolicies?: Maybe<BatchSetupEmployeeTimeOffPoliciesPayload>;
  batchUpdateEmployeeAutoPayrollSetup?: Maybe<BatchUpdateEmployeeAutoPayrollSetupPayload>;
  /**
   * batchUpdateEmployeeBenefits allows the client to update existing benefit policy for list of employees.
   * Once batchUpdateEmployeeBenefits has been fully supported, we can deprecate updateEmployeeBenefit
   * as this will perform the same functionality but for multiple employees at at time (PD-238954).
   */
  batchUpdateEmployeeBenefits?: Maybe<BatchUpdateEmployeeBenefitsPayload>;
  /** Batch update employee garnishments given employeeIds and garnishment details */
  batchUpdateEmployeeGarnishments?: Maybe<BatchUpdateEmployeeGarnishmentsPayload>;
  /**
   * batchUpdateEmployeeMiscDeductions allows the client to update existing misc deduction policy for list of employees.
   * Once batchUpdateEmployeeMiscDeductions has been fully supported, we can deprecate updateEmployeeMiscDeduction
   * as this will perform the same functionality but for multiple employees at at time (PD-238954).
   */
  batchUpdateEmployeeMiscDeductions?: Maybe<BatchUpdateEmployeeMiscDeductionsPayload>;
  /**
   * batchUpdateEmployeePensions allows the client to update existing pension policy for list of employees.
   * Once batchUpdateEmployeePensions has been fully supported, we can deprecate updateEmployeePension
   * as this will perform the same functionality but for multiple employees at at time (PD-238954).
   */
  batchUpdateEmployeePensions?: Maybe<BatchUpdateEmployeePensionsPayload>;
  batchUpdateEmployeePriorPayrollTotals?: Maybe<BatchUpdateEmployeePriorPayrollTotalsPayload>;
  /** Updates a batch of employee time off policies given the employeeIds and the timeoff policy input. */
  batchUpdateEmployeeTimeOffPolicies?: Maybe<BatchUpdateEmployeeTimeOffPoliciesPayload>;
  batchUpdateEmployeesYearToDate?: Maybe<BatchUpdateEmployeesYearToDatePayload>;
  batchUpdateEmployerPriorPayrollRuns?: Maybe<BatchUpdateEmployerPriorPayrollRunsPayload>;
  /**
   * This mutation is specific to DTM use case. Do not adopt this.
   * To do- Make this generic creating a batchUpdateEmployee mutation and use it to batch update employment status and any other employee field.
   */
  batchUpdateEmploymentStatus?: Maybe<BatchUpdateEmploymentStatusPayload>;
  /** batchUpdateMiscTaxReportingOfferedEmployeeBenefit allows the client to update existing offered employee benefits. */
  batchUpdateMiscTaxReportingOfferedEmployeeBenefits?: Maybe<BatchUpdateMiscTaxReportingOfferedEmployeeBenefitsPayload>;
  /** Updates existing tasks */
  batchUpdateTasks?: Maybe<BatchUpdateTasksPayload>;
  /** Add or remove employee viewable */
  batchUpdateTaxFilingDocumentEmployeeViewable?: Maybe<BatchUpdateTaxFilingDocumentEmployeeViewablePayload>;
  /** @deprecated There should be no more usages of bulk update employee feature groups */
  bulkUpdateEmployeeFeatureGroup?: Maybe<BulkUpdateEmployeeFeatureGroupPayload>;
  /**
   * cancelEmployeeCompensationEffectiveDatedChange allows the client to cancel a scheduled change associated with one employee
   * compensation. The scheduled change is identified by the applicable compensation's id and the date the change is intended to
   * take effect on (a given date can only have 1 scheduled change associated with it).
   */
  cancelEmployeeCompensationEffectiveDatedChange?: Maybe<CancelEmployeeCompensationEffectiveDatedChangePayload>;
  cancelEmployeeContractDetailsEffectiveDatedChange?: Maybe<CancelEmployeeContractDetailsEffectiveDatedChangePayload>;
  /**
   * Cancels an employee's effective dated change. This mutation allows removing a previously scheduled employment change
   * by specifying the employee ID and the effective start date of the change to be cancelled. This is useful for
   * undoing planned employment changes that are no longer needed or correcting scheduling errors.
   */
  cancelEmployeeEffectiveDatedChange?: Maybe<CancelEmployeeEffectiveDatedChangePayload>;
  completeMappingImportedTaxItem?: Maybe<CompleteMappingImportedTaxItemPayload>;
  /**
   * Marks the employee self setup as completed.
   * This mutation explicitly sets the completed flag to true, indicating the employee has finished the
   * setup process. Once completed, the employee will no longer see the Employee Self Setup (EESS)
   * flow when logging into Workforce Solutions (WFS).
   */
  completePayrollEmployeeSelfSetup?: Maybe<CompletePayrollEmployeeSelfSetupPayload>;
  createAndAssignEmployerManagedWorkersCompensation?: Maybe<CreateAndAssignEmployerManagedWorkersCompensationPayload>;
  createAndAssignPaySchedule?: Maybe<CreateAndAssignPaySchedulePayload>;
  /** createBenefitPolicy allows the client to create a new benefit deduction for employer. */
  createBenefitPolicy?: Maybe<CreateBenefitPolicyPayload>;
  /**
   * Creates a company payroll run for given payroll run type, mode and payschedule by creating
   * a company payroll run and associated employee payroll runs with company and employee defaults
   */
  createCompanyAndEmployeePayrollRuns?: Maybe<CreateCompanyAndEmployeePayrollRunsPayload>;
  createDepartment?: Maybe<CreateDepartmentPayload>;
  createEmployee?: Maybe<CreateEmployeePayload>;
  /** createEmployeeBenefit allows the client to create new employee benefit by assigning an existing benefitPolicy. */
  createEmployeeBenefit?: Maybe<CreateEmployeeBenefitPayload>;
  /** createEmployeeBenefitAndPolicy allows the client to create new employee benefit by creating a new benefitPolicy for that type. */
  createEmployeeBenefitAndPolicy?: Maybe<CreateEmployeeBenefitAndPolicyPayload>;
  createEmployeeContractDetails?: Maybe<CreateEmployeeContractDetailsPayload>;
  createEmployeeEmergencyContact?: Maybe<EmployeeEmergencyContactPayload>;
  /** Creates employee garnishment */
  createEmployeeGarnishment?: Maybe<CreateEmployeeGarnishmentPayload>;
  /** createEmployeeMiscDeduction allows the client to create new employee miscellaneous deduction by assigning an existing misc. deduction policy. */
  createEmployeeMiscDeduction?: Maybe<CreateEmployeeMiscDeductionPayload>;
  /** createEmployeeMiscDeductionAndPolicy allows the client to create a new miscellaneous deduction policy for employer and assign it to the employee hence creating a new employee miscellaneous deduction of that type. */
  createEmployeeMiscDeductionAndPolicy?: Maybe<CreateEmployeeMiscDeductionAndPolicyPayload>;
  /** Creates employee payroll run to be associated with given company payroll run */
  createEmployeePayrollRun?: Maybe<CreateEmployeePayrollRunPayload>;
  /** createEmployeePension allows the client to create new employee pension by assigning an existing pensionPolicy. */
  createEmployeePension?: Maybe<CreateEmployeePensionPayload>;
  /** createEmployeePensionAndPolicy allows the client to create a new pensionPolicy for employer and assign it to the employee hence creating a new employee pension of that type. */
  createEmployeePensionAndPolicy?: Maybe<CreateEmployeePensionAndPolicyPayload>;
  createEmployeePensionAutoEnrollment?: Maybe<CreateEmployeePensionEnrollmentPayload>;
  createEmployeeTaxDeduction?: Maybe<UpdateEmployeeTaxDeductionPayload>;
  createEmployerCompensation?: Maybe<CreateEmployerCompensationPayload>;
  createEmployerManagedWorkersCompensation?: Maybe<CreateEmployerManagedWorkersCompensationPayload>;
  createEmployerPaySchedule?: Maybe<CreateEmployerPaySchedulePayload>;
  createEmployerTimeOffPolicy?: Maybe<CreateEmployerTimeOffPolicyPayload>;
  createEmployerWorkersCompensationClass?: Maybe<CreateEmployerWorkersCompensationClassPayload>;
  /** Create a form filing adjustment for employees. */
  createFormFilingAdjustment?: Maybe<EmployeeFormFilingAdjustmentCreationPayload>;
  createMaternalLeavePeriod?: Maybe<CreateMaternalLeavePeriodPayload>;
  /** createMiscDeductionPolicy allows the client to create a new misc deduction policy for employer. */
  createMiscDeductionPolicy?: Maybe<CreateMiscDeductionPolicyPayload>;
  createNeonatalCareLeavePeriod?: Maybe<CreateNeonatalCareLeavePeriodPayload>;
  /** This will create or update a liability adjustment and corresponding liability adjustment details */
  createOrUpdateLiabilityAdjustment?: Maybe<CreateOrUpdateLiabilityAdjustmentPayload>;
  createOrUpdatePartnerSubscription?: Maybe<CreateOrUpdatePartnerSubscriptionPayload>;
  /** createOrUpdatePensionProviderSetup allows the client to create/update their pension provider setup */
  createOrUpdatePensionProviderSetup?: Maybe<CreateOrUpdatePensionProviderSetupPayload>;
  createPaternalLeavePeriod?: Maybe<CreatePaternalLeavePeriodPayload>;
  createPaySchedule?: Maybe<Company_Employer_PaySchedulePayload>;
  /**
   * Creates a refresh token such that Payroll First companies are able to export transactions (paychecks, tax payments,
   * contractor payments to Quickbooks Online. ```
   */
  createPayrollFirstRefreshTokenForExport?: Maybe<CreatePayrollFirstRefreshTokenForExportPayload>;
  createPayroll_Employee_EmployeeContractDetails?: Maybe<CreatePayroll_Employee_EmployeeContractDetailsPayload>;
  createPensionEnrollment?: Maybe<CreatePensionEnrollmentPayload>;
  /** createPensionPolicy allows the client to create a new pensionPolicy for employer. */
  createPensionPolicy?: Maybe<CreatePensionPolicyPayload>;
  createSickLeavePeriod?: Maybe<CreateSickLeavePeriodPayload>;
  createSignatory?: Maybe<CreateSignatoryPayload>;
  createTaxDeductionPolicy?: Maybe<UpdateTaxDeductionPolicyPayload>;
  createTaxExemption?: Maybe<UpdateTaxExemptionPayload>;
  createTaxRegistrationOrder?: Maybe<CreateTaxRegistrationOrderPayload>;
  /** Create a new custom time off category for the company */
  createTimeOffCategory?: Maybe<TimeOffCategoryPayload>;
  deleteDepartment?: Maybe<DeleteDepartmentPayload>;
  deleteEmployee?: Maybe<DeleteEmployeePayload>;
  /** deleteEmployeeBenefit allows the client to delete existing employee benefit. */
  deleteEmployeeBenefit?: Maybe<DeleteEmployeeBenefitPayload>;
  /** Deletes employee garnishment by setting active to false */
  deleteEmployeeGarnishment?: Maybe<DeleteEmployeeGarnishmentPayload>;
  /** deleteEmployeeMiscDeduction allows the client to delete existing employee miscellaneous deduction. */
  deleteEmployeeMiscDeduction?: Maybe<DeleteEmployeeMiscDeductionPayload>;
  /** deleteEmployeePension allows the client to delete existing employee pension. */
  deleteEmployeePension?: Maybe<DeleteEmployeePensionPayload>;
  deleteEmployeeTaxDeduction?: Maybe<DeleteEmployeeTaxDeductionPayload>;
  /** Delete list of employee timeoff policies. */
  deleteEmployeeTimeOffPolicies?: Maybe<DeleteEmployeeTimeOffPoliciesPayload>;
  deleteEmployeeWorkersCompensation?: Maybe<DeleteEmployeeWorkersCompensationPayload>;
  deleteEmployerManagedWorkersCompensation?: Maybe<DeleteEmployerManagedWorkersCompensationClassPayload>;
  deleteEmployerWorkersCompensationClass?: Maybe<DeleteEmployerWorkersCompensationClassPayload>;
  deleteLeavePeriod?: Maybe<DeleteLeavePeriodPayload>;
  deleteMappingImportedTaxItem?: Maybe<DeleteMappingImportedTaxItemPayload>;
  /** Delete a batch of payslips. Delete is a correction action that can be taken on a payslip. */
  deletePayslips?: Maybe<DeletePayslipsPayload>;
  deleteTaxExemption?: Maybe<DeleteTaxExemptionPayload>;
  /** Delete a tax filing entity */
  deleteTaxFiling?: Maybe<DeleteTaxFilingPayload>;
  /** Delete a tax payment */
  deleteTaxPayment?: Maybe<DeleteTaxPaymentPayload>;
  /** Delete a custom time off category */
  deleteTimeOffCategory?: Maybe<DeleteTimeOffCategoryPayload>;
  deleteWorkLocation?: Maybe<DeleteWorkLocationPayload>;
  editEmployeeTimeOffPolicies?: Maybe<EditEmployeeTimeOffPoliciesPayload>;
  exemptEmployeeFromWorkersCompensation?: Maybe<ExemptEmployeeFromWorkersCompensationPayload>;
  /**
   * This is specified as a mutation because it makes changes into the DB while exporting transactions into accounting.
   * Export a company's payroll transactions to an external accounting software. This mutation performs two actions:
   * 1. Marks specified transactions as exported
   * 2. Transmits the specified transactions' data to an external accounting software
   *   - Data transmission method may differ (ie. file download vs. direct transmission to accounting software)
   *   - Data transmission method is dictated by the company's current accounting export mode, refer to the type AccountingPreferences and the enum AccountingExportMode
   */
  exportTransactionsToAccounting?: Maybe<ExportTransactionsToAccountingPayload>;
  /** Extracts specified fields from one or more documents */
  extractDataFromDocuments?: Maybe<ExtractDataFromDocumentsPayload>;
  /** Generate warnings for draft company payroll run */
  generateDraftPayrollRunWarnings?: Maybe<GenerateDraftPayrollRunWarningsPayload>;
  generatePrefillDimensionDefaults?: Maybe<PrefillDimensionDefaultsPayload>;
  generatePreviewInsightRunPayroll?: Maybe<PreviewInsightRunPayrollPayload>;
  /**
   * Grant an IUS 'User' access to their employee data from all of their employers by their tax identifier
   * Requires an ID Proofed request for succesful response
   */
  grantEmployeeAccessToUserByTaxIdentifier?: Maybe<UserEmployeeAccessPayload>;
  mapSmartImportData?: Maybe<SmartImportPayload>;
  /**
   * Executes a workflow that offboards an employee and reassigns their reportees by effective date.
   *
   * This is an all-or-nothing operation - either all employee and reportee updates will be applied, or none of them will be.
   */
  offboardEmployee?: Maybe<OffboardEmployeePayload>;
  overrideEmployeeHomeAddressLocalJurisdiction?: Maybe<OverrideEmployeeHomeAddressLocalJurisdictionPayload>;
  recalculateImportedPayHistory?: Maybe<RecalculateImportedPayHistoryPayload>;
  recalculatePriorPayroll?: Maybe<RecalculatePriorPayrollPayload>;
  /** Record whether or not the employer consents that their data be used for the specified usage. */
  recordEmployerDataConsent?: Maybe<RecordEmployerDataConsentPayload>;
  /** Mark tax payments that have already been paid against existing tax liabilities. */
  recordPaidTaxPayments?: Maybe<RecordPaidTaxPaymentsPayload>;
  /** Record a tax payment that has been made for tax liabilities that are not present in the system */
  recordTaxPayment?: Maybe<RecordTaxPaymentPayload>;
  removeEmployeeFromDepartment?: Maybe<RemoveEmployeeFromDepartmentPayload>;
  removeReportee?: Maybe<RemoveReporteePayload>;
  resendEmployeeProductInvitation?: Maybe<ResendEmployeeProductInvitationPayload>;
  /** Record what to do with extraneous funds that have been overpaid to a certain tax agency during a given period. */
  resolveTaxOverpayment?: Maybe<ResolveTaxOverpaymentPayload>;
  /** Reverse a batch of direct deposit payslips. Reversal is a correction action that can be taken on a payslip. */
  reverseDirectDepositPayslips?: Maybe<ReverseDirectDepositPayslipsPayload>;
  /**
   * Updates and saves payroll run with DRAFT status for review of payroll run
   * before submit. This would save any overrides that are part of the input.
   */
  saveDraftCompanyAndEmployeePayrollRun?: Maybe<SaveDraftCompanyAndEmployeePayrollRunPayload>;
  /**
   * setupEmployeeCompensations allows the client to create new employee compensation by either assigning an existing
   * employer compensation or creating a new employer compensation for that type. It also allws the client to update
   * existing employee compensations
   */
  setupEmployeeCompensations?: Maybe<SetupEmployeeCompensationsPayload>;
  setupEmployeeTimeOffPolicies?: Maybe<SetupEmployeeTimeOffPoliciesPayload>;
  /** Update the status of a benefit filing to PENDING_SUBMISSION */
  submitBenefitFiling?: Maybe<SubmitBenefitFilingPayload>;
  /** Submits a payroll run and create payslips using existing payroll runs in DRAFT mode for the given pay schedule and pay period */
  submitDraftPayrollRun?: Maybe<SubmitPayrollRunPayload>;
  /** Submit an electronic filing */
  submitElectronicTaxFiling?: Maybe<SubmitElectronicTaxFilingPayload>;
  /** Submits a payroll run and create payslips using existing payroll runs in DRAFT mode */
  submitPayrollRun?: Maybe<SubmitPayrollRunPayload>;
  /** Updates export mode for a company */
  updateAccountingExportPreferences?: Maybe<UpdateAccountingExportPreferencesPayload>;
  updateActiveTaxYearStartDate?: Maybe<UpdateActiveTaxYearStartDatePayload>;
  updateAndAssignPaySchedule?: Maybe<UpdateAndAssignPaySchedulePayload>;
  /** Updates assigned preparer with allowed and preparer */
  updateAssignedPreparer?: Maybe<UpdateAssignedPreparerPayload>;
  /** Updates assigned representative with allowed and representative */
  updateAssignedRepresentative?: Maybe<UpdateAssignedRepresentativePayload>;
  /** Updates multiple employee time off policy assignments for a given employeeId and the timeoff policy assignments input */
  updateBatchEmployeeTimeOffPolicies?: Maybe<EmployeeTimeOffPoliciesPayload>;
  /** updateBenefitPolicy allows the client to update existing benefit policy. */
  updateBenefitPolicy?: Maybe<UpdateBenefitPolicyPayload>;
  updateCompanyInfo?: Maybe<UpdateCompany_CompanyInfo_Payload>;
  /** This will update a migration verified status for a migrated company */
  updateCompanyMigrationVerifiedStatus: UpdateCompanyMigrationVerifiedStatusPayload;
  /** Updates a specific company payroll run with the provided input */
  updateCompanyPayrollRun?: Maybe<UpdateCompanyPayrollRunPayload>;
  updateCompanyPrimaryContact?: Maybe<UpdateCompany_PrimaryContactPayload>;
  updateCompanyTerminationTaxPreferences?: Maybe<CompanyTerminationTaxPreferencesResponse>;
  updateDepartment?: Maybe<UpdateDepartmentPayload>;
  updateDigitalTaxFormDelivery?: Maybe<UpdateDigitalTaxFormDeliveryPayload>;
  /** @deprecated early wage access is currently unsupported */
  updateEarlyWageAccessPreferences?: Maybe<UpdateEarlyWageAccessPreferencesPayload>;
  updateEmailNotifications?: Maybe<UpdateEmailNotificationsPayload>;
  updateEmployee?: Maybe<UpdateEmployeePayload>;
  /** updateEmployeeBenefit allows the client to update existing employee benefit. */
  updateEmployeeBenefit?: Maybe<UpdateEmployeeBenefitPayload>;
  updateEmployeeContractDetails?: Maybe<UpdateEmployeeContractDetailsPayload>;
  updateEmployeeEmergencyContact?: Maybe<EmployeeEmergencyContactPayload>;
  /**
   * Updates employee employment changes with effective dates. This mutation allows updating multiple employment attributes
   * with a single effective date range. All changes will take effect from the specified effective start date and remain active until the effective end date.
   */
  updateEmployeeEmploymentChangeWithEffectiveDate?: Maybe<UpdateEmployeeEmploymentChangeWithEffectiveDatePayload>;
  updateEmployeeEmploymentDetail?: Maybe<UpdateEmployeeEmploymentDetailPayload>;
  updateEmployeeExternalWorkersCompensationClass?: Maybe<UpdateEmployeeExternalWorkersCompensationClassPayload>;
  updateEmployeeFeatureGroup?: Maybe<UpdateEmployeeFeatureGroupPayload>;
  /** Updates employee garnishment */
  updateEmployeeGarnishment?: Maybe<UpdateEmployeeGarnishmentPayload>;
  /** updateEmployeeMiscDeduction allows the client to update existing employee miscellaneous deduction. */
  updateEmployeeMiscDeduction?: Maybe<UpdateEmployeeMiscDeductionPayload>;
  updateEmployeePayDistributions?: Maybe<UpdateEmployeePayDistributionsPayload>;
  /**
   * updateEmployeePayrollCorrection allows the client to update existing employee payroll correction deduction.
   * Applies only when employee owes employer.
   */
  updateEmployeePayrollCorrection?: Maybe<UpdateEmployeePayrollCorrectionPayload>;
  /** Updates a specific employee payroll run with the provided input */
  updateEmployeePayrollRun?: Maybe<UpdateEmployeePayrollRunPayload>;
  /** updateEmployeePension allows the client to update existing employee pension. */
  updateEmployeePension?: Maybe<UpdateEmployeePensionPayload>;
  updateEmployeePensionAutoEnrollment?: Maybe<UpdateEmployeePensionEnrollmentPayload>;
  updateEmployeePreferences?: Maybe<UpdateEmployeePreferencesPayload>;
  updateEmployeeTaxDeduction?: Maybe<UpdateEmployeeTaxDeductionPayload>;
  updateEmployeeTaxSetups?: Maybe<UpdateEmployeeTaxSetupsPayload>;
  updateEmployeeUserId?: Maybe<UpdateEmployeeUserIdPayload>;
  updateEmployerCompensation?: Maybe<UpdateEmployerCompensationPayload>;
  updateEmployerDirectDepositLeadTimes?: Maybe<UpdateEmployerDirectDepositLeadTimesPayload>;
  updateEmployerManagedWorkersCompensation?: Maybe<UpdateEmployerManagedWorkersCompensationClassPayload>;
  updateEmployerPaySchedule?: Maybe<UpdateEmployerPaySchedulePayload>;
  updateEmployerPriorPayrollTaxItemPeriodBreakdowns?: Maybe<UpdateEmployerPriorPayrollTaxItemPeriodBreakdownsPayload>;
  updateEmployerTaxAgencyCredential?: Maybe<UpdateEmployerTaxAgencyCredentialPayload>;
  updateEmployerTaxIdentifier?: Maybe<UpdateEmployerTaxIdentifierPayload>;
  updateEmployerTaxSetup?: Maybe<UpdateEmployerTaxSetupPayload>;
  updateEmployerTimeOffPolicy?: Maybe<UpdateEmployerTimeOffPolicyPayload>;
  updateEmployerWorkerPortalPreferences?: Maybe<UpdateWorkerPortalEmployerPreferencesPayload>;
  updateEmployerWorkersCompensationClass?: Maybe<UpdateEmployerWorkersCompensationClassPayload>;
  updateEmploymentEligibility?: Maybe<UpdateEmploymentEligibilityPayload>;
  updateEmploymentEligibilityRequiredVerification?: Maybe<UpdateEmploymentEligibilityRequiredVerificationPayload>;
  /** Updates the existing transactions that have already been synced to Accounting with the current chart of accounts mapping preferences. Updates every transaction from a given start date up to present/end date. */
  updateExistingTransactionsToAccounting?: Maybe<UpdateExistingTransactionsToAccountingPayload>;
  updateFicaMisMapConsent?: Maybe<UpdateFicaMisMapConsentPayload>;
  updateFirstTimePayrollSetup?: Maybe<UpdatePayroll_Employer_FirstTimePayrollSetupPayload>;
  /** Updates garnishment priority when there are 2 garnishments */
  updateGarnishmentPriority?: Maybe<UpdateGarnishmentPriorityPayload>;
  updateImportedTaxItem?: Maybe<UpdateImportedTaxItemPayload>;
  updateInitialPaySchedule?: Maybe<Company_Employer_PaySchedulePayload>;
  updateMaternalLeavePeriod?: Maybe<UpdateMaternalLeavePeriodPayload>;
  /** updateMiscDeductionPolicy allows the client to update existing misc deduction policy. */
  updateMiscDeductionPolicy?: Maybe<UpdateMiscDeductionPolicyPayload>;
  updateNeonatalCareLeavePeriod?: Maybe<UpdateNeonatalCareLeavePeriodPayload>;
  updateNotificationPreferences?: Maybe<UpdateNotificationPreferencesPayload>;
  updatePaternalLeavePeriod?: Maybe<UpdatePaternalLeavePeriodPayload>;
  updatePaySchedule?: Maybe<Company_Employer_PaySchedulePayload>;
  /**
   * Updates the employee self setup enabled state.
   * Use this mutation to enable or disable the Employee Self Setup (EESS) flow for an employee.
   */
  updatePayrollEmployeeSelfSetup?: Maybe<UpdatePayrollEmployeeSelfSetupPayload>;
  updatePayroll_Employee_EmployeeContractDetails?: Maybe<UpdatePayroll_Employee_EmployeeContractDetailsPayload>;
  /** Update information that needs to be gathered from the user for contractor payments setup. */
  updatePayroll_Employer_ContractorPaymentsSetup: Payroll_Employer_UpdateContractorPaymentsSetup_Payload;
  /** Update information needed for user actions stages of contractor payments setup. */
  updatePayroll_Employer_ContractorPaymentsSetup_UserActions: Payroll_Employer_UpdateContractorPaymentsSetup_UserActions_Payload;
  /** Update a payslip. Update (or Edit) is a correction action that can be taken on a payslip. */
  updatePayslip?: Maybe<UpdatePayslipPayload>;
  /**
   * Update check number for a payslip.
   * The payslip must contain only a single net pay distribution with method of 'Check', to be applicable for this mutation.
   * @deprecated Use updatePayslip mutation to update any field associated with a payslip. Jira: PD-249111
   */
  updatePayslipCheckNumber?: Maybe<UpdatePayslipCheckNumberPayload>;
  /** Update preferences for a payslip */
  updatePayslipPreferences?: Maybe<UpdatePayslipPreferencesPayload>;
  updatePensionEnrollment?: Maybe<UpdatePensionEnrollmentPayload>;
  /** updatePensionPolicy allows the client to update existing pension policy. */
  updatePensionPolicy?: Maybe<UpdatePensionPolicyPayload>;
  updateSickLeavePeriod?: Maybe<UpdateSickLeavePeriodPayload>;
  updateTaxDeductionPolicy?: Maybe<UpdateTaxDeductionPolicyPayload>;
  updateTaxExemption?: Maybe<UpdateTaxExemptionPayload>;
  updateTaxFilingDocumentsSignature?: Maybe<UpdateTaxFilingDocumentsSignaturePayload>;
  /** Update the print status of a tax filing */
  updateTaxFilingPrintStatus?: Maybe<UpdateTaxFilingPrintStatusPayload>;
  updateTaxFormDeliveryPreference?: Maybe<UpdateTaxFormDeliveryPreferencePayload>;
  updateTaxFormPrintingPreference?: Maybe<UpdateTaxFormPrintingPreferencePayload>;
  updateTaxPreferences?: Maybe<UpdateTaxPreferencesPayload>;
  updateTaxPreferencesEscrowConsent?: Maybe<UpdateTaxPreferencesEscrowConsentPayload>;
  updateTaxRegistrationOrder?: Maybe<UpdateTaxRegistrationOrderPayload>;
  updateTaxSetupAcknowledgement: UpdateTaxSetupAcknowledgementPayload;
  updateTaxSetupControl?: Maybe<UpdateTaxSetupControlPayload>;
  /** Update an existing custom time off category */
  updateTimeOffCategory?: Maybe<TimeOffCategoryPayload>;
  /** Update the account name preference to export to accounting software for each transaction type */
  updateTransactionsToAccountMappingPreferences?: Maybe<UpdateTransactionsToAccountMappingPreferencesPayload>;
  /** Updates mode of mapping classes to payroll transactions and class selected for export of transactions if classes are in use. */
  updateTransactionsToClassMappingPreferences?: Maybe<UpdateTransactionsToClassMappingPreferencesPayload>;
  /** Editing a specific work location in the company */
  updateWorkLocation?: Maybe<UpdateWorkLocationPayload>;
  /** Void a batch of payslips. Void is a correction action that can be taken on a payslip. */
  voidPayslips?: Maybe<VoidPayslipsPayload>;
};


export type MutationAddEmployeeToDepartmentArgs = {
  input: AddEmployeeToDepartmentInput;
};


export type MutationAddReporteeArgs = {
  input: AddReporteeInput;
};


export type MutationAddWorkLocationArgs = {
  input: AddWorkLocationInput;
};


export type MutationAdjustPriorPayrollArgs = {
  input: AdjustPriorPayrollInput;
};


export type MutationApproveAndScheduleTaxPaymentArgs = {
  input: ApproveAndScheduleTaxPaymentInput;
};


export type MutationArchiveManualTaxFilingArgs = {
  input: ArchiveManualTaxFilingInput;
};


export type MutationArchiveManualTaxFormArgs = {
  input: ArchiveManualTaxFormInput;
};


export type MutationAssignBatchEmployeeTimeOffPoliciesArgs = {
  input: AssignBatchEmployeeTimeOffPoliciesInput;
};


export type MutationAssignEmployeeWorkersCompensationArgs = {
  input: AssignEmployeeWorkersCompensationInput;
};


export type MutationAssignPayScheduleToEmployeeArgs = {
  input: AssignPayScheduleToEmployeeInput;
};


export type MutationAutoFillPayslipCheckNumberArgs = {
  input: AutoFillPayslipCheckNumberInput;
};


export type MutationBatchAssignPayScheduleToEmployeeArgs = {
  input: BatchAssignPayScheduleToEmployeeInput;
};


export type MutationBatchCreateEmployeeBenefitsArgs = {
  input: BatchCreateEmployeeBenefitsInput;
};


export type MutationBatchCreateEmployeeBenefitsAndPolicyArgs = {
  input: BatchCreateEmployeeBenefitsAndPolicyInput;
};


export type MutationBatchCreateEmployeeContractDetailsArgs = {
  input: BatchCreateEmployeeContractDetailsInput;
};


export type MutationBatchCreateEmployeeGarnishmentsArgs = {
  input: BatchCreateEmployeeGarnishmentsInput;
};


export type MutationBatchCreateEmployeeMiscDeductionsArgs = {
  input: BatchCreateEmployeeMiscDeductionsInput;
};


export type MutationBatchCreateEmployeeMiscDeductionsAndPolicyArgs = {
  input: BatchCreateEmployeeMiscDeductionsAndPolicyInput;
};


export type MutationBatchCreateEmployeePayrollRunArgs = {
  input: BatchCreateEmployeePayrollRunInput;
};


export type MutationBatchCreateEmployeePensionsArgs = {
  input: BatchCreateEmployeePensionsInput;
};


export type MutationBatchCreateEmployeePensionsAndPolicyArgs = {
  input: BatchCreateEmployeePensionsAndPolicyInput;
};


export type MutationBatchCreateMiscTaxReportingOfferedEmployeeBenefitsArgs = {
  input: BatchCreateMiscTaxReportingOfferedEmployeeBenefitsInput;
};


export type MutationBatchCreateOrUpdateEmployeeCompensationsArgs = {
  input: BatchCreateOrUpdateEmployeeCompensationsInput;
};


export type MutationBatchCreateTasksArgs = {
  input: BatchCreateTasksInput;
};


export type MutationBatchDeleteAdjustmentPayslipsArgs = {
  input: BatchDeleteAdjustmentPayslipsInput;
};


export type MutationBatchDeleteAdjustmentsArgs = {
  input: BatchDeleteAdjustmentsInput;
};


export type MutationBatchDeleteEmployeeBenefitsArgs = {
  input: BatchDeleteEmployeeBenefitsInput;
};


export type MutationBatchDeleteEmployeeGarnishmentsArgs = {
  input: BatchDeleteEmployeeGarnishmentsInput;
};


export type MutationBatchDeleteEmployeeMiscDeductionsArgs = {
  input: BatchDeleteEmployeeMiscDeductionsInput;
};


export type MutationBatchDeleteEmployeePensionsArgs = {
  input: BatchDeleteEmployeePensionsInput;
};


export type MutationBatchDeleteEmployeeTimeOffPoliciesArgs = {
  input: BatchDeleteEmployeeTimeOffPoliciesInput;
};


export type MutationBatchDeleteTasksArgs = {
  input: BatchDeleteTasksInput;
};


export type MutationBatchEvaluateEmployeePriorPayrollsArgs = {
  input: BatchEvaluateEmployeePriorPayrollsInput;
};


export type MutationBatchSetupEmployeeTimeOffPoliciesArgs = {
  input: BatchSetupEmployeeTimeOffPoliciesInput;
};


export type MutationBatchUpdateEmployeeAutoPayrollSetupArgs = {
  input: BatchUpdateEmployeeAutoPayrollSetupInput;
};


export type MutationBatchUpdateEmployeeBenefitsArgs = {
  input: BatchUpdateEmployeeBenefitsInput;
};


export type MutationBatchUpdateEmployeeGarnishmentsArgs = {
  input: BatchUpdateEmployeeGarnishmentsInput;
};


export type MutationBatchUpdateEmployeeMiscDeductionsArgs = {
  input: BatchUpdateEmployeeMiscDeductionsInput;
};


export type MutationBatchUpdateEmployeePensionsArgs = {
  input: BatchUpdateEmployeePensionsInput;
};


export type MutationBatchUpdateEmployeePriorPayrollTotalsArgs = {
  input: BatchUpdateEmployeePriorPayrollInput;
};


export type MutationBatchUpdateEmployeeTimeOffPoliciesArgs = {
  input: BatchUpdateEmployeeTimeOffPoliciesInput;
};


export type MutationBatchUpdateEmployeesYearToDateArgs = {
  input: BatchUpdateEmployeesYearToDateInput;
};


export type MutationBatchUpdateEmployerPriorPayrollRunsArgs = {
  input: BatchUpdateEmployerPriorPayrollRunsInput;
};


export type MutationBatchUpdateEmploymentStatusArgs = {
  input: BatchUpdateEmploymentStatusInput;
};


export type MutationBatchUpdateMiscTaxReportingOfferedEmployeeBenefitsArgs = {
  input: BatchUpdateMiscTaxReportingOfferedEmployeeBenefitsInput;
};


export type MutationBatchUpdateTasksArgs = {
  input: BatchUpdateTasksInput;
};


export type MutationBatchUpdateTaxFilingDocumentEmployeeViewableArgs = {
  input: BatchUpdateTaxFilingDocumentEmployeeViewableInput;
};


export type MutationBulkUpdateEmployeeFeatureGroupArgs = {
  input: BulkUpdateEmployeeFeatureGroupInput;
};


export type MutationCancelEmployeeCompensationEffectiveDatedChangeArgs = {
  input: CancelEmployeeCompensationEffectiveDatedChangeInput;
};


export type MutationCancelEmployeeContractDetailsEffectiveDatedChangeArgs = {
  input: CancelEmployeeContractDetailsEffectiveDatedChangeInput;
};


export type MutationCancelEmployeeEffectiveDatedChangeArgs = {
  input: CancelEmployeeEffectiveDatedChangeInput;
};


export type MutationCompleteMappingImportedTaxItemArgs = {
  input: CompleteMappingImportedTaxItemInput;
};


export type MutationCompletePayrollEmployeeSelfSetupArgs = {
  input: CompletePayrollEmployeeSelfSetupInput;
};


export type MutationCreateAndAssignEmployerManagedWorkersCompensationArgs = {
  input: CreateAndAssignEmployerManagedWorkersCompensationInput;
};


export type MutationCreateAndAssignPayScheduleArgs = {
  input: CreateAndAssignPayScheduleInput;
};


export type MutationCreateBenefitPolicyArgs = {
  input: CreateBenefitPolicyInput;
};


export type MutationCreateCompanyAndEmployeePayrollRunsArgs = {
  input: CreateCompanyAndEmployeePayrollRunsInput;
};


export type MutationCreateDepartmentArgs = {
  input: CreateDepartmentInput;
};


export type MutationCreateEmployeeArgs = {
  input?: InputMaybe<CreateEmployeeInput>;
};


export type MutationCreateEmployeeBenefitArgs = {
  input: CreateEmployeeBenefitInput;
};


export type MutationCreateEmployeeBenefitAndPolicyArgs = {
  input: CreateEmployeeBenefitAndPolicyInput;
};


export type MutationCreateEmployeeContractDetailsArgs = {
  input: CreateEmployeeContractDetailsInput;
};


export type MutationCreateEmployeeEmergencyContactArgs = {
  input?: InputMaybe<EmployeeEmergencyContactCreateInput>;
};


export type MutationCreateEmployeeGarnishmentArgs = {
  input: CreateEmployeeGarnishmentInput;
};


export type MutationCreateEmployeeMiscDeductionArgs = {
  input: CreateEmployeeMiscDeductionInput;
};


export type MutationCreateEmployeeMiscDeductionAndPolicyArgs = {
  input: CreateEmployeeMiscDeductionAndPolicyInput;
};


export type MutationCreateEmployeePayrollRunArgs = {
  input: CreateEmployeePayrollRunInput;
};


export type MutationCreateEmployeePensionArgs = {
  input: CreateEmployeePensionInput;
};


export type MutationCreateEmployeePensionAndPolicyArgs = {
  input: CreateEmployeePensionAndPolicyInput;
};


export type MutationCreateEmployeePensionAutoEnrollmentArgs = {
  input?: InputMaybe<CreateEmployeePensionAutoEnrollmentInput>;
};


export type MutationCreateEmployeeTaxDeductionArgs = {
  input: CreateEmployeeTaxDeductionInput;
};


export type MutationCreateEmployerCompensationArgs = {
  input: CreateEmployerCompensationInput;
};


export type MutationCreateEmployerManagedWorkersCompensationArgs = {
  input: CreateEmployerManagedWorkersCompensationInput;
};


export type MutationCreateEmployerPayScheduleArgs = {
  input: CreateEmployerPayScheduleInput;
};


export type MutationCreateEmployerTimeOffPolicyArgs = {
  input: CreateEmployerTimeOffPolicyInput;
};


export type MutationCreateEmployerWorkersCompensationClassArgs = {
  input: CreateEmployerWorkersCompensationClassInput;
};


export type MutationCreateFormFilingAdjustmentArgs = {
  input: EmployeeFormFilingAdjustmentCreationInput;
};


export type MutationCreateMaternalLeavePeriodArgs = {
  input: CreateMaternalLeavePeriodInput;
};


export type MutationCreateMiscDeductionPolicyArgs = {
  input: CreateMiscDeductionPolicyInput;
};


export type MutationCreateNeonatalCareLeavePeriodArgs = {
  input: CreateNeonatalCareLeavePeriodInput;
};


export type MutationCreateOrUpdateLiabilityAdjustmentArgs = {
  input: CreateOrUpdateLiabilityAdjustmentInput;
};


export type MutationCreateOrUpdatePartnerSubscriptionArgs = {
  input: CreateOrUpdatePartnerSubscriptionInput;
};


export type MutationCreateOrUpdatePensionProviderSetupArgs = {
  input: CreateOrUpdatePensionProviderSetupInput;
};


export type MutationCreatePaternalLeavePeriodArgs = {
  input: CreatePaternalLeavePeriodInput;
};


export type MutationCreatePayScheduleArgs = {
  input: CreateCompany_Employer_PayScheduleInput;
};


export type MutationCreatePayrollFirstRefreshTokenForExportArgs = {
  input: CreatePayrollFirstRefreshTokenForExportInput;
};


export type MutationCreatePayroll_Employee_EmployeeContractDetailsArgs = {
  input: CreatePayroll_Employee_EmployeeContractDetailsInput;
};


export type MutationCreatePensionEnrollmentArgs = {
  input: CreatePensionEnrollmentInput;
};


export type MutationCreatePensionPolicyArgs = {
  input: CreatePensionPolicyInput;
};


export type MutationCreateSickLeavePeriodArgs = {
  input: CreateSickLeavePeriodInput;
};


export type MutationCreateSignatoryArgs = {
  input: CreateSignatoryInput;
};


export type MutationCreateTaxDeductionPolicyArgs = {
  input: CreateTaxDeductionPolicyInput;
};


export type MutationCreateTaxExemptionArgs = {
  input: CreateTaxExemptionInput;
};


export type MutationCreateTaxRegistrationOrderArgs = {
  input?: InputMaybe<CreateTaxRegistrationOrderInput>;
};


export type MutationCreateTimeOffCategoryArgs = {
  input: CreateTimeOffCategoryInput;
};


export type MutationDeleteDepartmentArgs = {
  input: DeleteDepartmentInput;
};


export type MutationDeleteEmployeeArgs = {
  input?: InputMaybe<DeleteEmployeeInput>;
};


export type MutationDeleteEmployeeBenefitArgs = {
  input: DeleteEmployeeBenefitInput;
};


export type MutationDeleteEmployeeGarnishmentArgs = {
  input: DeleteEmployeeGarnishmentInput;
};


export type MutationDeleteEmployeeMiscDeductionArgs = {
  input: DeleteEmployeeMiscDeductionInput;
};


export type MutationDeleteEmployeePensionArgs = {
  input: DeleteEmployeePensionInput;
};


export type MutationDeleteEmployeeTaxDeductionArgs = {
  input: DeleteEmployeeTaxDeductionInput;
};


export type MutationDeleteEmployeeTimeOffPoliciesArgs = {
  input: DeleteEmployeeTimeOffPoliciesInput;
};


export type MutationDeleteEmployeeWorkersCompensationArgs = {
  input: DeleteEmployeeWorkersCompensationInput;
};


export type MutationDeleteEmployerManagedWorkersCompensationArgs = {
  input: DeleteEmployerManagedWorkersCompensationInput;
};


export type MutationDeleteEmployerWorkersCompensationClassArgs = {
  input: DeleteEmployerWorkersCompensationClassInput;
};


export type MutationDeleteLeavePeriodArgs = {
  input: DeleteLeavePeriodInput;
};


export type MutationDeleteMappingImportedTaxItemArgs = {
  input: DeleteMappingImportedTaxItemInput;
};


export type MutationDeletePayslipsArgs = {
  input: DeletePayslipsInput;
};


export type MutationDeleteTaxExemptionArgs = {
  input: DeleteTaxExemptionInput;
};


export type MutationDeleteTaxFilingArgs = {
  input: DeleteTaxFilingInput;
};


export type MutationDeleteTaxPaymentArgs = {
  input: DeleteTaxPaymentInput;
};


export type MutationDeleteTimeOffCategoryArgs = {
  input: DeleteTimeOffCategoryInput;
};


export type MutationDeleteWorkLocationArgs = {
  input: DeleteWorkLocationInput;
};


export type MutationEditEmployeeTimeOffPoliciesArgs = {
  input: EditEmployeeTimeOffPoliciesInput;
};


export type MutationExemptEmployeeFromWorkersCompensationArgs = {
  input: ExemptEmployeeFromWorkersCompensationInput;
};


export type MutationExportTransactionsToAccountingArgs = {
  input: ExportTransactionsToAccountingInput;
};


export type MutationExtractDataFromDocumentsArgs = {
  input: ExtractDataFromDocumentsInput;
};


export type MutationGenerateDraftPayrollRunWarningsArgs = {
  input: GenerateDraftPayrollRunWarningsInput;
};


export type MutationGeneratePrefillDimensionDefaultsArgs = {
  input: PrefillDimensionDefaultsInput;
};


export type MutationGeneratePreviewInsightRunPayrollArgs = {
  input: PreviewInsightRunPayrollInput;
};


export type MutationGrantEmployeeAccessToUserByTaxIdentifierArgs = {
  input: UserEmployeeAccessByTaxIdentifierInput;
};


export type MutationMapSmartImportDataArgs = {
  input: SmartImportInput;
};


export type MutationOffboardEmployeeArgs = {
  input: OffboardEmployeeInput;
};


export type MutationOverrideEmployeeHomeAddressLocalJurisdictionArgs = {
  input: OverrideEmployeeHomeAddressLocalJurisdictionInput;
};


export type MutationRecalculateImportedPayHistoryArgs = {
  input: RecalculateImportedPayHistoryInput;
};


export type MutationRecalculatePriorPayrollArgs = {
  input: RecalculatePriorPayrollInput;
};


export type MutationRecordEmployerDataConsentArgs = {
  input: RecordEmployerDataConsentInput;
};


export type MutationRecordPaidTaxPaymentsArgs = {
  input: RecordPaidTaxPaymentsInput;
};


export type MutationRecordTaxPaymentArgs = {
  input: RecordTaxPaymentInput;
};


export type MutationRemoveEmployeeFromDepartmentArgs = {
  input: RemoveEmployeeFromDepartmentInput;
};


export type MutationRemoveReporteeArgs = {
  input: RemoveReporteeInput;
};


export type MutationResendEmployeeProductInvitationArgs = {
  input: ResendEmployeeProductInvitationInput;
};


export type MutationResolveTaxOverpaymentArgs = {
  input: ResolveTaxOverpaymentInput;
};


export type MutationReverseDirectDepositPayslipsArgs = {
  input: ReverseDirectDepositPayslipsInput;
};


export type MutationSaveDraftCompanyAndEmployeePayrollRunArgs = {
  input: SaveDraftCompanyAndEmployeePayrollRunInput;
};


export type MutationSetupEmployeeCompensationsArgs = {
  input: SetupEmployeeCompensationsInput;
};


export type MutationSetupEmployeeTimeOffPoliciesArgs = {
  input: SetupEmployeeTimeOffPoliciesInput;
};


export type MutationSubmitBenefitFilingArgs = {
  input: SubmitBenefitFilingInput;
};


export type MutationSubmitDraftPayrollRunArgs = {
  input: SubmitDraftPayrollRunInput;
};


export type MutationSubmitElectronicTaxFilingArgs = {
  input: SubmitElectronicTaxFilingInput;
};


export type MutationSubmitPayrollRunArgs = {
  input: SubmitPayrollRunInput;
};


export type MutationUpdateAccountingExportPreferencesArgs = {
  input?: InputMaybe<UpdateAccountingExportPreferencesInput>;
};


export type MutationUpdateActiveTaxYearStartDateArgs = {
  input: UpdateActiveTaxYearStartDateInput;
};


export type MutationUpdateAndAssignPayScheduleArgs = {
  input: UpdateAndAssignPayScheduleInput;
};


export type MutationUpdateAssignedPreparerArgs = {
  input: UpdateAssignedPreparerInput;
};


export type MutationUpdateAssignedRepresentativeArgs = {
  input: UpdateAssignedRepresentativeInput;
};


export type MutationUpdateBatchEmployeeTimeOffPoliciesArgs = {
  input: UpdateBatchEmployeeTimeOffPoliciesInput;
};


export type MutationUpdateBenefitPolicyArgs = {
  input: UpdateBenefitPolicyInput;
};


export type MutationUpdateCompanyInfoArgs = {
  input: UpdateCompany_CompanyInfoInput;
};


export type MutationUpdateCompanyMigrationVerifiedStatusArgs = {
  input: UpdateCompanyMigrationVerifiedStatusInput;
};


export type MutationUpdateCompanyPayrollRunArgs = {
  input: UpdateCompanyPayrollRunInput;
};


export type MutationUpdateCompanyPrimaryContactArgs = {
  input: UpdateCompany_PrimaryContactInput;
};


export type MutationUpdateCompanyTerminationTaxPreferencesArgs = {
  input: UpdateCompanyTerminationTaxPreferencesInput;
};


export type MutationUpdateDepartmentArgs = {
  input: UpdateDepartmentInput;
};


export type MutationUpdateDigitalTaxFormDeliveryArgs = {
  input: UpdateDigitalTaxFormDeliveryInput;
};


export type MutationUpdateEarlyWageAccessPreferencesArgs = {
  input: UpdateEarlyWageAccessPreferencesInput;
};


export type MutationUpdateEmailNotificationsArgs = {
  input: UpdateEmailNotificationsInput;
};


export type MutationUpdateEmployeeArgs = {
  input?: InputMaybe<UpdateEmployeeInput>;
};


export type MutationUpdateEmployeeBenefitArgs = {
  input: UpdateEmployeeBenefitInput;
};


export type MutationUpdateEmployeeContractDetailsArgs = {
  input: UpdateEmployeeContractDetailsInput;
};


export type MutationUpdateEmployeeEmergencyContactArgs = {
  input?: InputMaybe<EmployeeEmergencyContactUpdateInput>;
};


export type MutationUpdateEmployeeEmploymentChangeWithEffectiveDateArgs = {
  input: UpdateEmployeeEmploymentChangeWithEffectiveDateInput;
};


export type MutationUpdateEmployeeEmploymentDetailArgs = {
  input: UpdateEmployeeEmploymentDetailInput;
};


export type MutationUpdateEmployeeExternalWorkersCompensationClassArgs = {
  input: UpdateEmployeeExternalWorkersCompensationClassInput;
};


export type MutationUpdateEmployeeFeatureGroupArgs = {
  input: UpdateEmployeeFeatureGroupInput;
};


export type MutationUpdateEmployeeGarnishmentArgs = {
  input: UpdateEmployeeGarnishmentInput;
};


export type MutationUpdateEmployeeMiscDeductionArgs = {
  input: UpdateEmployeeMiscDeductionInput;
};


export type MutationUpdateEmployeePayDistributionsArgs = {
  input?: InputMaybe<UpdateEmployeePayDistributionsInput>;
};


export type MutationUpdateEmployeePayrollCorrectionArgs = {
  input: UpdateEmployeePayrollCorrectionInput;
};


export type MutationUpdateEmployeePayrollRunArgs = {
  input: UpdateEmployeePayrollRunInput;
};


export type MutationUpdateEmployeePensionArgs = {
  input: UpdateEmployeePensionInput;
};


export type MutationUpdateEmployeePensionAutoEnrollmentArgs = {
  input?: InputMaybe<UpdateEmployeePensionAutoEnrollmentInput>;
};


export type MutationUpdateEmployeePreferencesArgs = {
  input: UpdateEmployeePreferencesInput;
};


export type MutationUpdateEmployeeTaxDeductionArgs = {
  input: UpdateEmployeeTaxDeductionInput;
};


export type MutationUpdateEmployeeTaxSetupsArgs = {
  input: UpdateEmployeeTaxSetupsInput;
};


export type MutationUpdateEmployeeUserIdArgs = {
  input?: InputMaybe<UpdateEmployeeUserIdInput>;
};


export type MutationUpdateEmployerCompensationArgs = {
  input: UpdateEmployerCompensationInput;
};


export type MutationUpdateEmployerDirectDepositLeadTimesArgs = {
  input: UpdateEmployerDirectDepositLeadTimesInput;
};


export type MutationUpdateEmployerManagedWorkersCompensationArgs = {
  input: UpdateEmployerManagedWorkersCompensationInput;
};


export type MutationUpdateEmployerPayScheduleArgs = {
  input: UpdateEmployerPayScheduleInput;
};


export type MutationUpdateEmployerPriorPayrollTaxItemPeriodBreakdownsArgs = {
  input: UpdateEmployerPriorPayrollTaxItemPeriodBreakdownsInput;
};


export type MutationUpdateEmployerTaxAgencyCredentialArgs = {
  input: UpdateTaxAgencyCredentialInput;
};


export type MutationUpdateEmployerTaxIdentifierArgs = {
  input: UpdateEmployerTaxIdentifierInput;
};


export type MutationUpdateEmployerTaxSetupArgs = {
  input: UpdateEmployerTaxSetupInput;
};


export type MutationUpdateEmployerTimeOffPolicyArgs = {
  input: UpdateEmployerTimeOffPolicyInput;
};


export type MutationUpdateEmployerWorkerPortalPreferencesArgs = {
  input: WorkerPortalEmployerPreferencesInput;
};


export type MutationUpdateEmployerWorkersCompensationClassArgs = {
  input: UpdateEmployerWorkersCompensationClassInput;
};


export type MutationUpdateEmploymentEligibilityArgs = {
  input: UpdateEmploymentEligibilityInput;
};


export type MutationUpdateEmploymentEligibilityRequiredVerificationArgs = {
  input: EmploymentEligibilityRequiredVerificationInput;
};


export type MutationUpdateExistingTransactionsToAccountingArgs = {
  input: UpdateExistingTransactionsToAccountingInput;
};


export type MutationUpdateFicaMisMapConsentArgs = {
  input: UpdateFicaMisMapConsentInput;
};


export type MutationUpdateFirstTimePayrollSetupArgs = {
  input: UpdatePayroll_Employer_FirstTimePayrollSetupInput;
};


export type MutationUpdateGarnishmentPriorityArgs = {
  input: UpdateGarnishmentPriorityInput;
};


export type MutationUpdateImportedTaxItemArgs = {
  input: UpdateImportedTaxItemInput;
};


export type MutationUpdateInitialPayScheduleArgs = {
  input: UpdateCompany_Employer_InitialPayScheduleInput;
};


export type MutationUpdateMaternalLeavePeriodArgs = {
  input: UpdateMaternalLeavePeriodInput;
};


export type MutationUpdateMiscDeductionPolicyArgs = {
  input: UpdateMiscDeductionPolicyInput;
};


export type MutationUpdateNeonatalCareLeavePeriodArgs = {
  input: UpdateNeonatalCareLeavePeriodInput;
};


export type MutationUpdateNotificationPreferencesArgs = {
  input: UpdateNotificationPreferencesInput;
};


export type MutationUpdatePaternalLeavePeriodArgs = {
  input: UpdatePaternalLeavePeriodInput;
};


export type MutationUpdatePayScheduleArgs = {
  input: UpdateCompany_Employer_PayScheduleInput;
};


export type MutationUpdatePayrollEmployeeSelfSetupArgs = {
  input: UpdatePayrollEmployeeSelfSetupInput;
};


export type MutationUpdatePayroll_Employee_EmployeeContractDetailsArgs = {
  input: UpdatePayroll_Employee_EmployeeContractDetailsInput;
};


export type MutationUpdatePayroll_Employer_ContractorPaymentsSetupArgs = {
  input: Payroll_Employer_UpdateContractorPaymentsSetup_Input;
};


export type MutationUpdatePayroll_Employer_ContractorPaymentsSetup_UserActionsArgs = {
  input: Payroll_Employer_UpdateContractorPaymentsSetup_UserActions_Input;
};


export type MutationUpdatePayslipArgs = {
  input: UpdatePayslipInput;
};


export type MutationUpdatePayslipCheckNumberArgs = {
  input: UpdatePayslipCheckNumberInput;
};


export type MutationUpdatePayslipPreferencesArgs = {
  input: UpdatePayslipPreferencesInput;
};


export type MutationUpdatePensionEnrollmentArgs = {
  input: UpdatePensionEnrollmentInput;
};


export type MutationUpdatePensionPolicyArgs = {
  input: UpdatePensionPolicyInput;
};


export type MutationUpdateSickLeavePeriodArgs = {
  input: UpdateSickLeavePeriodInput;
};


export type MutationUpdateTaxDeductionPolicyArgs = {
  input: UpdateTaxDeductionPolicyInput;
};


export type MutationUpdateTaxExemptionArgs = {
  input: UpdateTaxExemptionInput;
};


export type MutationUpdateTaxFilingDocumentsSignatureArgs = {
  input: UpdateTaxFilingDocumentsSignatureInput;
};


export type MutationUpdateTaxFilingPrintStatusArgs = {
  input: UpdateTaxFilingPrintStatusInput;
};


export type MutationUpdateTaxFormDeliveryPreferenceArgs = {
  input: UpdateTaxFormDeliveryPreferenceInput;
};


export type MutationUpdateTaxFormPrintingPreferenceArgs = {
  input: UpdateTaxFormPrintingPreferenceInput;
};


export type MutationUpdateTaxPreferencesArgs = {
  input: UpdateTaxPreferencesInput;
};


export type MutationUpdateTaxPreferencesEscrowConsentArgs = {
  input: UpdateTaxPreferencesEscrowConsentInput;
};


export type MutationUpdateTaxRegistrationOrderArgs = {
  input?: InputMaybe<UpdateTaxRegistrationOrderInput>;
};


export type MutationUpdateTaxSetupAcknowledgementArgs = {
  input: UpdateTaxSetupAcknowledgementInput;
};


export type MutationUpdateTaxSetupControlArgs = {
  input: TaxSetupControlInput;
};


export type MutationUpdateTimeOffCategoryArgs = {
  input: UpdateTimeOffCategoryInput;
};


export type MutationUpdateTransactionsToAccountMappingPreferencesArgs = {
  input: UpdateTransactionsToAccountMappingPreferencesInput;
};


export type MutationUpdateTransactionsToClassMappingPreferencesArgs = {
  input: UpdateTransactionsToClassMappingPreferencesInput;
};


export type MutationUpdateWorkLocationArgs = {
  input: UpdateWorkLocationInput;
};


export type MutationVoidPayslipsArgs = {
  input: VoidPayslipsInput;
};

export type NameFilter = {
  /** Filters the collection for display name contains the specified String value. The contains test is performed as a case-insenstive match. */
  displayNameContains?: InputMaybe<Scalars['String']['input']>;
  /** Filters the collection for name contains the specified String value. This is a fuzzy match across name. The contains test is performed as a case-insenstive match. */
  nameContains?: InputMaybe<Scalars['String']['input']>;
};

export type NeonatalCareLeavePeriod = EmployeeLeavePeriod & Node & {
  __typename?: 'NeonatalCareLeavePeriod';
  /** Baby's birth date for neonatal care leave */
  babyBirthDate: Scalars['Date']['output'];
  /** Baby's due date for neonatal care leave */
  babyDueDate: Scalars['Date']['output'];
  /** Used to determine the type of leave */
  category: LeaveCategory;
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['output'];
  /** End date of the employee leave which is optional */
  endDate?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  /**
   * The wage reference to compute employee wages during the leave period.
   * It is a temporal value that could potentially change for every leave period
   * e.g. average weekly earnings of the employee at the time of taking the leave.
   */
  leaveWageReference?: Maybe<Scalars['Money']['output']>;
  /** Number of weeks for Employee leave period */
  numberOfWeeks: Scalars['Int']['output'];
  /** Tier type for Employee leave period */
  tierType: Scalars['Int']['output'];
};

/** [/network/definitions/ContactMethod](https://schema.intuit.com/#data:/network/definitions/ContactMethod) */
export type Network_Definitions_ContactMethod = {
  __typename?: 'Network_Definitions_ContactMethod';
  contactMethodId?: Maybe<Scalars['String']['output']>;
  primaryAddress?: Maybe<Common_Address>;
  primaryTelephone?: Maybe<Common_Telephone>;
};

/** An object with an ID */
export type Node = {
  id: Scalars['ID']['output'];
};

/** Represent the regular date object as date for sensitizable date field */
export type NonSensitizedDate = {
  __typename?: 'NonSensitizedDate';
  date?: Maybe<Scalars['Date']['output']>;
};

/**
 * Notification preferences ideally belong to its own service (ex. OINP) but does not yet exist and as such is
 * represented by NotificationPreferences.
 */
export type NotificationPreferences = {
  __typename?: 'NotificationPreferences';
  /** Email notification channel */
  emailNotificationChannel?: Maybe<EmailNotificationChannel>;
  /** Text notification channel */
  textNotificationChannel?: Maybe<TextNotificationChannel>;
};

export type NotificationPreferencesUserError = {
  __typename?: 'NotificationPreferencesUserError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Input fields to be updated for a single employee for offboarding. */
export type OffboardEmployeeDetailsInput = {
  /**
   * If employee is eligible to be rehired.
   * Default value is false.
   */
  eligibleForRehire?: InputMaybe<Scalars['Boolean']['input']>;
  /** ID of the employee being offboarded */
  employeeId: Scalars['ID']['input'];
  /** Employment status */
  employmentStatus: Payroll_Employee_EmploymentStatus_Input;
  /** Reason for status of the employee */
  statusReason?: InputMaybe<Scalars['String']['input']>;
  /** Additional note about the offboarding */
  terminationReason?: InputMaybe<Scalars['String']['input']>;
};

/** Input for the entire offboarding operation. */
export type OffboardEmployeeInput = {
  /** Company ID of the offboarding employee and reportees */
  companyId: Scalars['ID']['input'];
  /**
   * The date range during which the employee's offboarding details and reportees reassignment will be effective.
   *
   * Default start date is today's date.
   * Default end date is 01-01-3000.
   */
  effectiveDateRange: EffectiveDateRangeInput;
  /** The employee details to be updated for offboarding. */
  employeeDetails: OffboardEmployeeDetailsInput;
  /**
   * List of offboarding employee's reportees to be reassigned to a new manager.
   *
   * By default the offboarding employee's reportees will be reassigned to no manager.
   * If this input is provided, the reportees will be reassigned to the manager specified.
   */
  reportees?: InputMaybe<Array<AddReporteeInput>>;
};

/** Payload for the offboarding operation. */
export type OffboardEmployeePayload = {
  __typename?: 'OffboardEmployeePayload';
  /** The offboarded employee */
  employee?: Maybe<Employee>;
  /** User error */
  userError?: Maybe<EmployeeError>;
};

/** Org Chart Report */
export type OrgChartReport = {
  __typename?: 'OrgChartReport';
  employees?: Maybe<OrgChartReportEmployeeConnection>;
};


/** Org Chart Report */
export type OrgChartReportEmployeesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
};

/**
 * This employee information is only used for org chart and is a lightweight version of the employee node itself.
 * Contains display-like versions of items such as manager, reportees, first name, last name etc.
 * It is to be used to display org chart in workforce
 */
export type OrgChartReportEmployee = {
  __typename?: 'OrgChartReportEmployee';
  /** Contact information for an employee */
  contactInfo?: Maybe<OrgChartReportEmployeeContactInfo>;
  /** Employee's display name */
  displayName?: Maybe<Scalars['String']['output']>;
  /**
   * This field defines details related to the employee's most recent employment.
   * The only field exposed here is jobTitle
   */
  employmentDetail?: Maybe<OrgChartReportEmploymentDetail>;
  /** Employee's first name */
  firstName?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Employee's last name */
  lastName?: Maybe<Scalars['String']['output']>;
  /** Employee's preferred first name */
  preferredFirstName?: Maybe<Scalars['String']['output']>;
  /** Employee's profile picture documents */
  profilePictures?: Maybe<Array<Picture>>;
  /** Count of reportees for this employee */
  reporteeCount: Scalars['Int']['output'];
};

/** Connection for a list of org chart employee edges. Also contains page information */
export type OrgChartReportEmployeeConnection = {
  __typename?: 'OrgChartReportEmployeeConnection';
  edges?: Maybe<Array<OrgChartReportEmployeeEdge>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type OrgChartReportEmployeeContactInfo = {
  __typename?: 'OrgChartReportEmployeeContactInfo';
  /** Employee's phone number */
  phoneNumbers: Array<PhoneNumber>;
  /** Employee's primary email address */
  primaryEmailAddress?: Maybe<EmailAddress>;
};

export type OrgChartReportEmployeeEdge = {
  __typename?: 'OrgChartReportEmployeeEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<OrgChartReportEmployee>;
};

export type OrgChartReportEmploymentDetail = {
  __typename?: 'OrgChartReportEmploymentDetail';
  /** Employee's job title */
  jobTitle?: Maybe<Scalars['String']['output']>;
};

/**
 * Filtering options for displaying org chart. Currently employees can be filtered by hasManager, hasReportees,
 * employee name and the employment status
 */
export type OrgChartReportFilter = {
  employeeName?: InputMaybe<NameFilter>;
  employmentStatus?: InputMaybe<EmploymentStatusFilter>;
  id?: InputMaybe<IdFilter>;
  manager?: InputMaybe<ManagerFilter>;
  reportees?: InputMaybe<ReporteesFilter>;
};

/** Input filter for org chart report */
export type OrgChartReportInput = {
  filterBy: OrgChartReportFilter;
  orderBy?: InputMaybe<OrgChartReportOrderBy>;
};

/** Sorting options for displaying org chart. */
export enum OrgChartReportOrderBy {
  FirstnameAsc = 'FIRSTNAME_ASC',
  FirstnameDesc = 'FIRSTNAME_DESC',
  LastnameAsc = 'LASTNAME_ASC',
  LastnameDesc = 'LASTNAME_DESC',
  PreferredFirstnameAsc = 'PREFERRED_FIRSTNAME_ASC',
  PreferredFirstnameDesc = 'PREFERRED_FIRSTNAME_DESC'
}

export type OverrideEmployeeHomeAddressLocalJurisdictionError = {
  __typename?: 'OverrideEmployeeHomeAddressLocalJurisdictionError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type OverrideEmployeeHomeAddressLocalJurisdictionInput = {
  /** Company ID that the employee belogs to */
  companyId: Scalars['ID']['input'];
  /** Employee ID of the employee being updated */
  employeeId: Scalars['ID']['input'];
  /** The location or political sub division to override the current residential jurisdiction with */
  jurisdictionOverride: JurisdictionOverrideInput;
};

export type OverrideEmployeeHomeAddressLocalJurisdictionPayload = {
  __typename?: 'OverrideEmployeeHomeAddressLocalJurisdictionPayload';
  taxSetups?: Maybe<Array<EmployeeTaxSetup>>;
  userError?: Maybe<OverrideEmployeeHomeAddressLocalJurisdictionError>;
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

/** Specifies the page orientation, e.g. Potrait, Landscape. */
export enum PageOrientation {
  Landscape = 'LANDSCAPE',
  Portrait = 'PORTRAIT'
}

/**
 * Common input type for pagination
 * first/after for forward pagination
 * last/before for backward pagination
 * Refer to connection spefication for more details:
 * https://relay.dev/graphql/connections.htm#sec-Arguments
 */
export type PaginationInput = {
  /** Returns the elements in the list that come after the specified cursor. */
  after?: InputMaybe<Scalars['String']['input']>;
  /** Returns the elements in the list that come before the specified cursor. */
  before?: InputMaybe<Scalars['String']['input']>;
  /** Returns the first n elements from the list. The value must be a non-negative integer. */
  first?: InputMaybe<Scalars['Int']['input']>;
  /** Returns the last n elements from the list. The value must be a non-negative integer. */
  last?: InputMaybe<Scalars['Int']['input']>;
};

export type ParsedPhoneNumber = {
  __typename?: 'ParsedPhoneNumber';
  /** A PBX extension number that must be entered after the primary number is answered */
  extension?: Maybe<Scalars['String']['output']>;
};

export type ParsedPhoneNumberInput = {
  extension?: InputMaybe<Scalars['String']['input']>;
};

/**
 * This schema shows the partner subscription a company is enrolled in.
 * This is a company level info and contains the partner subscription details, usually provided by external vendors.
 * For example workers comp, HR, indeed(future) etc.
 */
export type PartnerSubscription = Node & {
  __typename?: 'PartnerSubscription';
  /** Effective end date of this subscription. */
  endDate?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  metaModel: PartnerSubscriptionMetaModel;
  /** Name of the partner who provides this benefit. */
  partnerName: Scalars['String']['output'];
  /** Represents the source of this quote/lead, for instance an intuit page or a partner iframe. */
  sourceCode?: Maybe<Scalars['String']['output']>;
  /** Effective start date of this subscription. */
  startDate?: Maybe<Scalars['Date']['output']>;
  /** Status of this subscription for example enrolled, subscribed or cancelled. */
  status: Scalars['String']['output'];
  /** Name of the subscription. */
  subscriptionName: Scalars['String']['output'];
};


/**
 * This schema shows the partner subscription a company is enrolled in.
 * This is a company level info and contains the partner subscription details, usually provided by external vendors.
 * For example workers comp, HR, indeed(future) etc.
 */
export type PartnerSubscriptionMetaModelArgs = {
  filterBy?: InputMaybe<PartnerSubscriptionsFilter>;
};

export type PartnerSubscriptionError = {
  __typename?: 'PartnerSubscriptionError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type PartnerSubscriptionMetaModel = MetaModel & {
  __typename?: 'PartnerSubscriptionMetaModel';
  applicable: Scalars['Boolean']['output'];
  endDate: MetaDate;
  label: Scalars['String']['output'];
  partnerName: MetaEnum;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  sourceCode: MetaString;
  startDate: MetaDate;
  status: MetaEnum;
  subscriptionName: MetaEnum;
  typeRef: Scalars['String']['output'];
};

export type PartnerSubscriptionsFilter = {
  providerType?: InputMaybe<Scalars['String']['input']>;
  subscriptionName?: InputMaybe<Scalars['String']['input']>;
};

export type PaternalLeavePeriod = EmployeeLeavePeriod & Node & {
  __typename?: 'PaternalLeavePeriod';
  /** Baby's birth date for paternity leave */
  babyBirthDate: Scalars['Date']['output'];
  /** Baby's due date for paternity leave */
  babyDueDate: Scalars['Date']['output'];
  /** Used to determine the type of leave */
  category: LeaveCategory;
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['output'];
  /** End date of the employee leave which is optional */
  endDate?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  /**
   * The wage reference to compute employee wages during the leave period.
   * It is a temporal value that could potentially change for every leave period
   * e.g. average weekly earnings of the employee at the time of taking the leave.
   */
  leaveWageReference?: Maybe<Scalars['Money']['output']>;
};

/** A connection for list of pay contracts an employee is historically assigned to */
export type PayContractHistoryConnection = {
  __typename?: 'PayContractHistoryConnection';
  edges: Array<PayContractHistoryEdge>;
  pageInfo: PageInfo;
};

/** An edge for an employee's pay contract assignment */
export type PayContractHistoryEdge = {
  __typename?: 'PayContractHistoryEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<PayContractHistoryNode>;
};

/** A node for an employee's pay contract assignment effective during a specific period */
export type PayContractHistoryNode = HistoryNode & {
  __typename?: 'PayContractHistoryNode';
  /** end date when the pay contract assignment is effective till */
  effectiveEndDate?: Maybe<Scalars['Date']['output']>;
  /** start date when the pay contract assignment is effective from */
  effectiveStartDate: Scalars['Date']['output'];
  /** Date when the assignment was made */
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  /** User or the system who made the assignment */
  updatedBy?: Maybe<HistoryNodeUpdatedBy>;
  /** details of the employee pay contract */
  value?: Maybe<EmployeeContractDetails>;
};

/**
 * Enum of available payroll correction pay down types
 * FULL_BALANCE: Deduct balance from next paycheck
 * PER_PAYCHECK: Deduct amount on per paycheck basis
 */
export enum PayDownType {
  FullBalance = 'FULL_BALANCE',
  PerPaycheck = 'PER_PAYCHECK'
}

export type PayPeriod = Common_DatePeriod & {
  __typename?: 'PayPeriod';
  /** The first day of the pay period */
  beginDate: Scalars['Date']['output'];
  /** The end date of the pay period. */
  endDate: Scalars['Date']['output'];
};

export type PayPeriodInput = {
  beginDate: Scalars['Date']['input'];
  endDate: Scalars['Date']['input'];
};

/** Defines the amount of money paid over the given frequency */
export type PayRate = {
  __typename?: 'PayRate';
  amount: Scalars['Money']['output'];
  frequency: PayRateFrequency;
  /** Metamodel representing fields with multiple allowed values for PayRate */
  metaModel: PayRateMetaModel;
};

/** The frequency in which a rate is paid */
export enum PayRateFrequency {
  Hourly = 'HOURLY',
  Monthly = 'MONTHLY',
  PerPayslip = 'PER_PAYSLIP',
  Weekly = 'WEEKLY',
  Yearly = 'YEARLY'
}

export type PayRateInput = {
  amount: Scalars['Money']['input'];
  frequency: PayRateFrequency;
};

export type PayRateMetaModel = MetaModel & {
  __typename?: 'PayRateMetaModel';
  amount: MetaMoney;
  applicable: Scalars['Boolean']['output'];
  frequency: MetaEnum;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type PayScheduleAbsoluteReferenceDates = {
  __typename?: 'PayScheduleAbsoluteReferenceDates';
  endDate: Scalars['Date']['output'];
  payDate: Scalars['Date']['output'];
};

export type PayScheduleAbsoluteReferenceDatesInput = {
  endDate: Scalars['Date']['input'];
  payDate: Scalars['Date']['input'];
};

export type PayScheduleError = {
  __typename?: 'PayScheduleError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type PayScheduleFilter = {
  activeEmployeesCount?: InputMaybe<IntFilter>;
  /** @deprecated Field no longer supported */
  id?: InputMaybe<IdFilter>;
  payScheduleId?: InputMaybe<PayScheduleIdFilter>;
};

/** Allowed values for pay frequency */
export enum PayScheduleFrequency {
  EveryFourWeek = 'EVERY_FOUR_WEEK',
  EveryMonth = 'EVERY_MONTH',
  EveryOtherWeek = 'EVERY_OTHER_WEEK',
  EveryWeek = 'EVERY_WEEK',
  TwiceAMonth = 'TWICE_A_MONTH'
}

export type PayScheduleIdFilter = {
  eq?: InputMaybe<Scalars['ID']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  ne?: InputMaybe<Scalars['ID']['input']>;
};

export type PaySchedulePayPeriodsPreviewInput = {
  frequency: PayScheduleFrequency;
  referenceDates: PayScheduleReferenceDatesInput;
};

export type PaySchedulePayPeriodsPreviewResult = {
  __typename?: 'PaySchedulePayPeriodsPreviewResult';
  paySchedulePeriods?: Maybe<Array<PaySchedulePeriod>>;
  userError?: Maybe<PayScheduleError>;
};

export type PaySchedulePeriod = {
  __typename?: 'PaySchedulePeriod';
  /** The payment date for the period */
  payDate: Scalars['Date']['output'];
  period: PayPeriod;
};

export type PayScheduleReferenceDates = PayScheduleAbsoluteReferenceDates | PayScheduleRelativeReferenceDates;

/** This input type provides the options for specifying reference dates of payschedule, and all of the options are mutually exclusive. Must specify one and only one of the fields in the input, i.e. only one of the input fields should be non-null. */
export type PayScheduleReferenceDatesInput = {
  absoluteReferenceDate?: InputMaybe<PayScheduleAbsoluteReferenceDatesInput>;
  relativeReferenceDates?: InputMaybe<Array<PayScheduleRelativeReferenceDatesInput>>;
};

/** The Reference Period for advanced setup for Pay Schedule, for MONTHLY and TWICE_A_MONTH pay schedule frequency */
export type PayScheduleRelativeReferenceDates = {
  __typename?: 'PayScheduleRelativeReferenceDates';
  endDay: PayScheduleRelativeReferencePeriodEnd;
  payDay: DayOfMonth;
};

export type PayScheduleRelativeReferenceDatesInput = {
  endDay: PayScheduleRelativeReferencePeriodEndInput;
  payDay: DayOfMonth;
};

export type PayScheduleRelativeReferencePeriodEnd = ReferencePeriodEndDayOfMonth | ReferencePeriodEndDayOffset;

/** This input type provides the options for specifying payschedule relative reference end periods, and all of the options are mutually exclusive. Must specify one and only one of the fields in the input, i.e. only one of the input fields should be non-null. */
export type PayScheduleRelativeReferencePeriodEndInput = {
  dayOfMonth?: InputMaybe<ReferencePeriodEndDayOfMonthInput>;
  offset?: InputMaybe<ReferencePeriodEndDayOffsetInput>;
};

export type PaymentGroup = {
  __typename?: 'PaymentGroup';
  /** The category of tax payment */
  category: Scalars['String']['output'];
  /** The display name for the agency to which the payment is due */
  displayName: Scalars['String']['output'];
  /** The type of tax payment */
  type: Scalars['String']['output'];
};

/** Options for how soon automatic payments are made. */
export enum PaymentTimingPreference {
  /** Always make automatic payments on the earliest available date */
  Earliest = 'EARLIEST',
  /** Always make automatic payments on the latest available date */
  Latest = 'LATEST',
  /** No preference, automatic payments can be made on any available date (default) */
  NoPreference = 'NO_PREFERENCE'
}

/** Tax transactions made on a company - Employer Debits, Agency Credits and Dispute Ledger entries */
export type PaymentsTaxTransaction = Node & {
  __typename?: 'PaymentsTaxTransaction';
  /** The amount of the tax payment */
  amount: Common_MoneyAmount;
  /** The date Intuit will debit employer, or tax agency credited, or dispute ledger dates */
  date?: Maybe<Scalars['Date']['output']>;
  /** The details of the tax transaction */
  description: Scalars['String']['output'];
  /** The ID of tax transaction */
  id: Scalars['ID']['output'];
  /** The status of tax payment. Expect one of Paid, Processing, Scheduled or Failed */
  status: Scalars['String']['output'];
  /** The type of tax transaction */
  type: Scalars['String']['output'];
};

/** A connection to a list of tax transactions. */
export type PaymentsTaxTransactionConnection = {
  __typename?: 'PaymentsTaxTransactionConnection';
  edges: Array<PaymentsTaxTransactionEdge>;
};

/** An edge for a connection of a recorded tax transaction. */
export type PaymentsTaxTransactionEdge = {
  __typename?: 'PaymentsTaxTransactionEdge';
  /** The item at the end of the edge */
  node?: Maybe<PaymentsTaxTransaction>;
};

/** Filter criteria for fetching PaymentsTaxTransactions */
export type PaymentsTaxTransactionFilter = {
  beginDate: DateFilter;
  endDate: DateFilter;
};

export type PayrollAggregatedReport = {
  __typename?: 'PayrollAggregatedReport';
  /** Payroll aggregated report with report data rendering detail */
  renderings?: Maybe<PayrollAggregatedReportRenderings>;
};

export type PayrollAggregatedReportInput = {
  payDate: PayslipPayDateFilter;
  reportTypes: Array<PayrollAggregatedReportType>;
};

export type PayrollAggregatedReportRenderings = {
  __typename?: 'PayrollAggregatedReportRenderings';
  excel?: Maybe<FileRendering>;
};

export enum PayrollAggregatedReportType {
  DeductionsAndContributionsReport = 'DeductionsAndContributionsReport',
  EmployeeDetailsReport = 'EmployeeDetailsReport',
  PayrollDetailsReport = 'PayrollDetailsReport',
  PayrollSummaryByEmployeeReport = 'PayrollSummaryByEmployeeReport',
  PayrollSummaryReport = 'PayrollSummaryReport',
  RecordedTaxTransactionsReport = 'RecordedTaxTransactionsReport',
  TaxCompensationSummaryReport = 'TaxCompensationSummaryReport',
  TaxLiabilityReport = 'TaxLiabilityReport',
  TotalCostReport = 'TotalCostReport',
  TotalPayByEmployeeReport = 'TotalPayByEmployeeReport'
}

/** Defines the payroll bank account information */
export type PayrollBankAccount = EntityInterface & Node & {
  __typename?: 'PayrollBankAccount';
  /**
   * account number for US
   * @deprecated Pull `accountNumber` from wallet service using walletId
   */
  accountNumber: Scalars['String']['output'];
  /**
   * Type of bank account, CHECKINGS, SAVINGS
   * @deprecated Pull `accountType` from wallet service using walletId
   */
  accountType: Scalars['String']['output'];
  /**
   * Routing number for US
   * @deprecated Pull `bankCode` from wallet service using walletId
   */
  bankCode: Scalars['String']['output'];
  /**
   * Name of bank, computed value
   * @deprecated Pull `bankName` from wallet service using walletId
   */
  bankName?: Maybe<Scalars['String']['output']>;
  externalIds?: Maybe<Array<Maybe<Common_ExternalId>>>;
  id: Scalars['ID']['output'];
  meta?: Maybe<Common_Metadata>;
  /**
   * Payroll bank account balance information for this payroll bank account.
   * This provides the current balance, account details, and status of the payroll bank account.
   */
  payrollBankAccountBalance?: Maybe<PayrollBankAccountBalance>;
};

/** Bank account balance information */
export type PayrollBankAccountBalance = {
  __typename?: 'PayrollBankAccountBalance';
  /** Masked account number (e.g., XXXX3434) */
  accountNumberMasked?: Maybe<Scalars['String']['output']>;
  /** Account type (e.g., BUSINESS_CHECKING) */
  accountType?: Maybe<Scalars['String']['output']>;
  /** Available balance */
  availableBalance?: Maybe<Scalars['String']['output']>;
  /** Date of the balance */
  balanceDate?: Maybe<Scalars['String']['output']>;
  /** Bank name */
  bankName?: Maybe<Scalars['String']['output']>;
  /** Currency code (e.g., USD) */
  currency?: Maybe<Scalars['String']['output']>;
  /** Current balance */
  currentBalance?: Maybe<Scalars['String']['output']>;
  /** Financial Data Platform account ID */
  fdpAccountId?: Maybe<Scalars['String']['output']>;
  /** Last time the balance was refreshed */
  lastRefreshDate?: Maybe<Scalars['DateTime']['output']>;
  /** Account status (e.g., ACTIVE) */
  status?: Maybe<Scalars['String']['output']>;
  /** Wallet service bank account ID */
  walletBankAccountId?: Maybe<Scalars['String']['output']>;
};

/** MetaModel for PayrollBankAccount */
export type PayrollBankAccountMetaModel = MetaModel & {
  __typename?: 'PayrollBankAccountMetaModel';
  /** The account number of a bank */
  accountNumber: MetaString;
  /** The account type */
  accountType: MetaEnum;
  applicable: Scalars['Boolean']['output'];
  /** The routing number of a bank */
  bankCode: MetaString;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** A payroll correction item an employee owes to employer or employer owes to employee */
export type PayrollCorrectionPolicy = DeductionPolicy & Node & {
  __typename?: 'PayrollCorrectionPolicy';
  /** Determines this deduction category */
  category: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** A deduction name/description */
  name: Scalars['String']['output'];
  /** Defines the exact types (including taxability) that are supported by region (e.g. CUS_DED_MEDICAL_INSURANCE_PRE_TAX) */
  statutoryType: Scalars['String']['output'];
  /** SubCategory of this deduction */
  subCategory: Scalars['String']['output'];
  /** Indicates deduction is a pre-tax or post-tax */
  taxOption: TaxOption;
};


/** A payroll correction item an employee owes to employer or employer owes to employee */
export type PayrollCorrectionPolicyCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/** A payroll correction item an employee owes to employer or employer owes to employee */
export type PayrollCorrectionPolicyStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/** A payroll correction item an employee owes to employer or employer owes to employee */
export type PayrollCorrectionPolicySubCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type PayrollCostDistribution = {
  __typename?: 'PayrollCostDistribution';
  /** Subtracts from the total amount */
  adjustmentAmount: Scalars['Money']['output'];
  /** Determines if the cost will be auto debited by system from company's account */
  isAutoDebited: Scalars['Boolean']['output'];
  totalAmount: Scalars['Money']['output'];
  type: PayrollCostDistributionType;
};

export enum PayrollCostDistributionType {
  /** Contributions towards benefits, retirement plans, etc. */
  Contributions = 'CONTRIBUTIONS',
  /** Deductions from the employee's pay for benefits, etc. */
  Deductions = 'DEDUCTIONS',
  /** Net pay distributed via bank transfer. */
  NetPayBankTransfer = 'NET_PAY_BANK_TRANSFER',
  /** Net pay distributed via cash. */
  NetPayCash = 'NET_PAY_CASH',
  /** Net pay distributed via check. */
  NetPayCheck = 'NET_PAY_CHECK',
  /** Net pay distributed via direct deposit. */
  NetPayDirectDeposit = 'NET_PAY_DIRECT_DEPOSIT',
  /** Employer tax obligations and employee tax withholding for the payroll run. */
  Taxes = 'TAXES'
}

export type PayrollDateSummaryInput = {
  /** Pay date of the payroll run */
  payDate?: InputMaybe<Scalars['Date']['input']>;
  /** Pay period for the payroll run */
  payPeriod?: InputMaybe<PayPeriodInput>;
};

export type PayrollEmployeeConnection = {
  __typename?: 'PayrollEmployeeConnection';
  edges: Array<PayrollEmployeeEdge>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge in a connection. */
export type PayrollEmployeeEdge = {
  __typename?: 'PayrollEmployeeEdge';
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge */
  node?: Maybe<Employee>;
};

/** Type representing the state of employee self setup in regards to payroll */
export type PayrollEmployeeSelfSetup = {
  __typename?: 'PayrollEmployeeSelfSetup';
  /** True if employee self setup has been completed by the employee user */
  completed: Scalars['Boolean']['output'];
  /** True if employee self setup is enabled */
  enabled: Scalars['Boolean']['output'];
};

export type PayrollEmployerFirstTimePayrollSetupReadinessFilter = {
  categories?: InputMaybe<Array<ReadinessCategory>>;
};

/**
 * Employment active period information for an employee.
 * Provides essential information about when an employee was active.
 */
export type PayrollEmploymentActivePeriod = {
  __typename?: 'PayrollEmploymentActivePeriod';
  /**
   * The effective end date when the employee's active status ends (null if still active).
   * Shows actual termination/leave date even if it's beyond the pay period.
   * End date is inclusive (employee is active through this date).
   */
  effectiveEndDate?: Maybe<Scalars['Date']['output']>;
  /**
   * The effective start date when the employee became active in the payroll period.
   * Could be the hire date or the start of an ACTIVE/PAID_LEAVE status change.
   * Dates are inclusive.
   */
  effectiveStartDate?: Maybe<Scalars['Date']['output']>;
  /**
   * The reason why the employee became inactive.
   * Values: TERMINATED, UNPAID_LEAVE, NOT_ON_PAYROLL, DECEASED, etc.
   * Null if employee remains active (effectiveEndDate is null).
   */
  inactiveReason?: Maybe<Scalars['String']['output']>;
};

export enum PayrollExpertReviewStatus {
  Available = 'AVAILABLE',
  Cancelled = 'CANCELLED',
  Completed = 'COMPLETED',
  Failed = 'FAILED',
  FeatureNotApplicable = 'FEATURE_NOT_APPLICABLE',
  InformationAdded = 'INFORMATION_ADDED',
  InformationNeeded = 'INFORMATION_NEEDED',
  InProgress = 'IN_PROGRESS',
  NotAvailable = 'NOT_AVAILABLE',
  Requested = 'REQUESTED',
  UserAcknowledged = 'USER_ACKNOWLEDGED',
  UserOptedOut = 'USER_OPTED_OUT'
}

/** Company liability adjustment which is recorded in the system */
export type PayrollLiabilityAdjustment = {
  __typename?: 'PayrollLiabilityAdjustment';
  id: Scalars['ID']['output'];
  /** Liability adjustment details */
  liabilityAdjustmentDetails: Array<PayrollLiabilityAdjustmentDetail>;
  /** Date for liability adjustment */
  liabilityDate: Scalars['Date']['output'];
  /** Net amount for the liability adjustment */
  netAmount: Scalars['Money']['output'];
  /** Liability adjustment period */
  period: PayrollLiabilityAdjustmentPeriod;
};

export type PayrollLiabilityAdjustmentDetail = {
  /** Amount for the liability adjustment detail */
  amount: Scalars['Money']['output'];
  /** Display name for the the liability adjustment detail */
  displayName: Scalars['String']['output'];
  /** Item Id key for the liability adjustment detail */
  itemIdKey: Scalars['String']['output'];
};

export type PayrollLiabilityAdjustmentDetailInput = {
  /** Amount for the liability adjustment detail to be created */
  amount: Scalars['Money']['input'];
  /** Item Id key for the liability adjustment detail to be created */
  itemIdKey: Scalars['String']['input'];
};

export type PayrollLiabilityAdjustmentDetailMetaModel = MetaModel & {
  __typename?: 'PayrollLiabilityAdjustmentDetailMetaModel';
  amount: MetaMoney;
  applicable: Scalars['Boolean']['output'];
  itemIdKey: Scalars['String']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type PayrollLiabilityAdjustmentFilter = {
  /** Only return liability adjustments with this key or set of keys */
  itemIdKey?: InputMaybe<StringFilter>;
  /**
   * Only return liability adjustments for periods within this range.
   * If not passed, all liability adjustments for the current tax year would be returned.
   */
  period?: InputMaybe<DateFilter>;
};

export type PayrollLiabilityAdjustmentMetaModel = MetaModel & {
  __typename?: 'PayrollLiabilityAdjustmentMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  liabilityAdjustmentDetails: Array<PayrollLiabilityAdjustmentDetailMetaModel>;
  liabilityDate: MetaDate;
  netAmount: MetaMoney;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/**
 * For future use cases, we can create other types as needed, which can implement the interface PayrollLiabilityAdjustmentDetail
 * as needed. The following is an example of a type representing company contributions.
 *
 * type CompanyContributionAdjustmentDetail implements PayrollLiabilityAdjustmentDetail {
 *   itemIdKey: String!
 *   contributionId: String!
 *   amount: Money!
 *   displayName: String!
 * }
 */
export type PayrollLiabilityAdjustmentPeriod = Common_DatePeriod & {
  __typename?: 'PayrollLiabilityAdjustmentPeriod';
  /** The start date of the liability adjustment period */
  beginDate: Scalars['Date']['output'];
  /** The end date of the liability adjustment period */
  endDate: Scalars['Date']['output'];
};

export type PayrollLiabilityAdjustmentPeriodInput = {
  /** Liability adjustment period begin date */
  beginDate: Scalars['Date']['input'];
  /** Liability adjustment period end date */
  endDate: Scalars['Date']['input'];
};

export type PayrollLiabilityAdjustmentUserError = {
  __typename?: 'PayrollLiabilityAdjustmentUserError';
  /** error code */
  code?: Maybe<Scalars['String']['output']>;
  /** A description of the error */
  message: Scalars['String']['output'];
  /** error type */
  type?: Maybe<Scalars['String']['output']>;
};

export type PayrollNumber = {
  __typename?: 'PayrollNumber';
  /** Unique id for an employee in a company used for payroll */
  id: Scalars['String']['output'];
};

export type PayrollNumberInput = {
  id: Scalars['String']['input'];
};

export type PayrollNumberMetaModel = MetaModel & {
  __typename?: 'PayrollNumberMetaModel';
  applicable: Scalars['Boolean']['output'];
  id: MetaString;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type PayrollPaymentsTaxPaymentIDsFilter = {
  externalPartnerDataId?: InputMaybe<Scalars['ID']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
};

export type PayrollPaymentsTaxWithdrawal = Node & {
  __typename?: 'PayrollPaymentsTaxWithdrawal';
  /** The amount of the tax payment */
  debitAmount: Scalars['Money']['output'];
  /** The date of the tax transaction */
  debitDate?: Maybe<Scalars['Date']['output']>;
  /** The status of tax payment. */
  debitStatus?: Maybe<Scalars['String']['output']>;
  /** The ID of a Tax Withdrawal */
  id: Scalars['ID']['output'];
  /** List of tax payment details. */
  taxBreakdowns: Array<TaxWithdrawalTaxBreakdown>;
  /** The type of tax payment transaction. */
  transactionType: Scalars['String']['output'];
};

export type PayrollPaymentsTaxWithdrawalFilter = {
  /** Filters that can be applied to withdrawalDate */
  withdrawalDate?: InputMaybe<PayrollPaymentsTaxWithdrawalPeriodFilter>;
};

export type PayrollPaymentsTaxWithdrawalPeriod = {
  __typename?: 'PayrollPaymentsTaxWithdrawalPeriod';
  /** The first day of the pay period */
  begin?: Maybe<Scalars['DateTime']['output']>;
  /** The end date of the pay period. */
  end?: Maybe<Scalars['DateTime']['output']>;
};

export type PayrollPaymentsTaxWithdrawalPeriodFilter = {
  gte?: InputMaybe<Scalars['Date']['input']>;
  lte?: InputMaybe<Scalars['Date']['input']>;
};

/** A connection to a list of tax debit transactions. */
export type PayrollPaymentsTaxWithdrawalsConnection = {
  __typename?: 'PayrollPaymentsTaxWithdrawalsConnection';
  edges?: Maybe<Array<PayrollPaymentsTaxWithdrawalsEdge>>;
};

/** An edge for a connection of a tax debit transaction. */
export type PayrollPaymentsTaxWithdrawalsEdge = {
  __typename?: 'PayrollPaymentsTaxWithdrawalsEdge';
  /** The item at the end of the edge */
  node?: Maybe<PayrollPaymentsTaxWithdrawal>;
};

/** Common filter options for both DCG and Pay Type payroll item employees */
export type PayrollPolicyEmployeesFilter = {
  /** If not provided, employees will not be filtered by contract pay type */
  contractPayType?: InputMaybe<ContractPayType>;
  /** If provided, the filtered employees will be the ones whose first name or last name contains the filter value */
  employeeName?: InputMaybe<NameFilter>;
  /**
   * When false, returns employees with the payroll item assigned.
   * When true, returns employees who do not have the payroll item assigned.
   */
  employeeUnassigned?: InputMaybe<Scalars['Boolean']['input']>;
  /** If not provided, both active and inactive employees will be accepted */
  employmentStatus?: InputMaybe<EmploymentStatusFilter>;
  /** If provided, compensations will be filtered based on effective time period */
  period?: InputMaybe<EffectiveDateRange>;
  /** If provided, only employees who work in the location will be accepted */
  workLocation?: InputMaybe<WorkLocationFilter>;
};

export type PayrollReportAggregationByDeduction = {
  __typename?: 'PayrollReportAggregationByDeduction';
  /** Aggregated data broken down by employee payslips contributing amounts to one or more particular deduction type(s) */
  breakdownByEmployee?: Maybe<PayrollReportEmployeeDeductionDetailConnection>;
  /** Details on the pension policy */
  deductionPolicy: DeductionPolicy;
  /** @deprecated Use `breakdownByEmployee` field instead */
  employeeBreakdown: Array<PayrollReportEmployeeDeductionDetail>;
  /** Total aggregation of deduction data across all employees */
  totalDeductionDetail: PayrollReportDeductionDetail;
};


export type PayrollReportAggregationByDeductionBreakdownByEmployeeArgs = {
  filterBy?: InputMaybe<DeductionsAndContributionsReportEmployeeBreakdownInput>;
  pagination?: InputMaybe<PaginationInput>;
};

export type PayrollReportAggregationByDeductionEdge = {
  __typename?: 'PayrollReportAggregationByDeductionEdge';
  /** The item at the end of the edge */
  node?: Maybe<PayrollReportAggregationByDeduction>;
};

export type PayrollReportAggregationDeductionPolicyConnection = {
  __typename?: 'PayrollReportAggregationDeductionPolicyConnection';
  edges?: Maybe<Array<Maybe<PayrollReportAggregationByDeductionEdge>>>;
};

/** Total compensation with employee counts in a quarter */
export type PayrollReportCompensationQuarterlyDetail = {
  __typename?: 'PayrollReportCompensationQuarterlyDetail';
  /** Employee counts for each month of a quarter. The counts are returned in the chronological order of the months. */
  employeeMonthlyCounts: Array<PayrollReportMonthlyEmployeeCount>;
  /** Total compensation of all employees in a quarter for a work location */
  totalCompensation: Scalars['Money']['output'];
};

/** Filter contractor payments based on contractor infomation */
export type PayrollReportContractorFilter = {
  /**
   * Filter by the status of the contractor - true indicates an active
   * contractor, false indicates an inactive contractor.
   */
  active?: InputMaybe<BooleanFilter>;
  id?: InputMaybe<IdFilter>;
};

export type PayrollReportDeductionDetail = {
  __typename?: 'PayrollReportDeductionDetail';
  /** Employee's contribution to this deduction */
  employeeDeduction: Scalars['Money']['output'];
  /** Company's contribution to this deduction */
  employerContribution: Scalars['Money']['output'];
  /** Total of employee's and company's contribution */
  total: Scalars['Money']['output'];
};

/**
 * This employee information is only used for reporting and is a lightweight version of the employee node itself.
 * Contains display-like versions of items for eg. compensations, deductions and contact info
 */
export type PayrollReportEmployee = {
  __typename?: 'PayrollReportEmployee';
  /** @deprecated Use dateOfBirth with sensitized argument instead of birthDate */
  birthDate?: Maybe<Scalars['String']['output']>;
  /** List of active compensations associated with this employee */
  compensations?: Maybe<Array<PayrollReportEmployeeCompensation>>;
  contactInfo?: Maybe<PayrollReportEmployeeContactInfo>;
  /** List of active deductions for this employee with non-zero employer contribution amounts */
  contributions?: Maybe<Array<PayrollReportEmployeeDeduction>>;
  dateOfBirth?: Maybe<SensitizableDate>;
  /** List of active non-zero deductions configured for this employee */
  deductions?: Maybe<Array<PayrollReportEmployeeDeduction>>;
  /**
   * List of employee's active pay distributions along with destination(if applicable)
   * For eg. Direct deposit will  have account number attached to it. (DD, ....9124)
   */
  distributionLabels: Array<Scalars['String']['output']>;
  /** Reference to the employee object can be obtained via this id */
  employeeId: Scalars['ID']['output'];
  employerNotes?: Maybe<Scalars['String']['output']>;
  employmentDetail?: Maybe<PayrollReportEmploymentDetail>;
  firstName: Scalars['String']['output'];
  /** Label for displaying the gender. Cannot be used for mutations or updates. */
  genderLabel?: Maybe<Scalars['String']['output']>;
  lastName: Scalars['String']['output'];
  middleInitial?: Maybe<Scalars['String']['output']>;
  /**
   * The identifiers for this employee that are used when filing taxes, e.g. Social Security Number (SSN) for US, or
   * Social Insurance Number (SIN) for CA. By default the values are sensitized (partially obfuscated) to protect privacy,
   * but the full plain text value can be requested by specifying through the argument.
   */
  taxIdentifiers?: Maybe<Array<VariableStringField>>;
  taxSetups: Array<EmployeeTaxSetup>;
  timeOffPolicies?: Maybe<Array<PayrollReportEmployeeTimeOffPolicy>>;
};


/**
 * This employee information is only used for reporting and is a lightweight version of the employee node itself.
 * Contains display-like versions of items for eg. compensations, deductions and contact info
 */
export type PayrollReportEmployeeDateOfBirthArgs = {
  sensitized?: InputMaybe<Scalars['Boolean']['input']>;
};


/**
 * This employee information is only used for reporting and is a lightweight version of the employee node itself.
 * Contains display-like versions of items for eg. compensations, deductions and contact info
 */
export type PayrollReportEmployeeTaxIdentifiersArgs = {
  sensitized?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Compensation details that contain a more condensed version of EmployeeCompensation type. */
export type PayrollReportEmployeeCompensation = {
  __typename?: 'PayrollReportEmployeeCompensation';
  /** Name associated with this compensation (Which is specific to a company) */
  employerCompensationName: Scalars['String']['output'];
  /** Type associated with this compensation */
  employerCompensationType: Scalars['String']['output'];
  /** Defines the amount of money paid over the given frequency */
  rate?: Maybe<PayRate>;
};

/** Connection for a list of report employee edges. Also contains page information */
export type PayrollReportEmployeeConnection = {
  __typename?: 'PayrollReportEmployeeConnection';
  edges?: Maybe<Array<Maybe<PayrollReportEmployeeEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type PayrollReportEmployeeContactInfo = {
  __typename?: 'PayrollReportEmployeeContactInfo';
  /**
   * Formatted string combining the components of the home address
   * @deprecated Use homeAddress instead
   */
  formattedHomeAddress?: Maybe<Scalars['String']['output']>;
  /** Employee home address */
  homeAddress?: Maybe<Common_Address>;
  primaryEmailAddress?: Maybe<EmailAddress>;
};

/** Deductions made from an employee's payslip. Consolidated and simplified version of deductions and contributions */
export type PayrollReportEmployeeDeduction = {
  __typename?: 'PayrollReportEmployeeDeduction';
  /** Display string for amount or percentage that is contributed by employee for any given deduction */
  employeeContribution?: Maybe<Scalars['String']['output']>;
  /** Display string for amount or percentage that is contributed by employer for any given deduction */
  employerContribution?: Maybe<Scalars['String']['output']>;
  policyName: Scalars['String']['output'];
};

export type PayrollReportEmployeeDeductionBreakdownByPayslip = {
  __typename?: 'PayrollReportEmployeeDeductionBreakdownByPayslip';
  /** Deduction/contribution/garnishment amounts data to a particular payslip */
  payslipDeductionDetail: PayrollReportDeductionDetail;
  /** Payslip id including adjustment type of payslip. */
  payslipId?: Maybe<Scalars['ID']['output']>;
  /** It denotes the paydate for payslip type and creation data for adjustment type */
  transactionDate: Scalars['Date']['output'];
};

export type PayrollReportEmployeeDeductionBreakdownByPayslipEdge = {
  __typename?: 'PayrollReportEmployeeDeductionBreakdownByPayslipEdge';
  /** The item at the end of the edge */
  node?: Maybe<PayrollReportEmployeeDeductionBreakdownByPayslip>;
};

/**
 * Payslips aggregated by employee for a given deduction, containing details of the employee,
 * employee's deduction and employer's contribution
 */
export type PayrollReportEmployeeDeductionDetail = {
  __typename?: 'PayrollReportEmployeeDeductionDetail';
  /** Total aggregation of deduction data across all payslips to a particular employee */
  deductionDetail: PayrollReportDeductionDetail;
  employeeDetail: PayslipAggregationReportEmployeeDetail;
  /**
   * Aggregated data broken down by payslip contributing amounts to a particular employee
   * Employee ID and deduction policy ID are required
   */
  payslipBreakdown?: Maybe<PayrollReportEmployeeDeductionPayslipConnection>;
};


/**
 * Payslips aggregated by employee for a given deduction, containing details of the employee,
 * employee's deduction and employer's contribution
 */
export type PayrollReportEmployeeDeductionDetailPayslipBreakdownArgs = {
  pagination?: InputMaybe<PaginationInput>;
};

export type PayrollReportEmployeeDeductionDetailConnection = {
  __typename?: 'PayrollReportEmployeeDeductionDetailConnection';
  edges?: Maybe<Array<Maybe<PayrollReportEmployeeDeductionDetailEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type PayrollReportEmployeeDeductionDetailEdge = {
  __typename?: 'PayrollReportEmployeeDeductionDetailEdge';
  /** The item at the end of the edge */
  node?: Maybe<PayrollReportEmployeeDeductionDetail>;
};

export type PayrollReportEmployeeDeductionPayslipConnection = {
  __typename?: 'PayrollReportEmployeeDeductionPayslipConnection';
  edges?: Maybe<Array<Maybe<PayrollReportEmployeeDeductionBreakdownByPayslipEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** Details of an employee with id, first name, last name and middle initial and employment status */
export type PayrollReportEmployeeDetail = {
  __typename?: 'PayrollReportEmployeeDetail';
  employeeId: Scalars['ID']['output'];
  employmentStatus?: Maybe<Payroll_Employee_EmploymentStatus>;
  firstName: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  middleInitial?: Maybe<Scalars['String']['output']>;
};

export type PayrollReportEmployeeEdge = {
  __typename?: 'PayrollReportEmployeeEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<PayrollReportEmployee>;
};

/**
 * Timeoff policy associated with this employee. Provides details for the  associated employer time off policy that
 * dictates the rules governing this employee policy.
 */
export type PayrollReportEmployeeTimeOffPolicy = {
  __typename?: 'PayrollReportEmployeeTimeOffPolicy';
  /** Label for the enum that is used to determine which type of time off hours this policy describes */
  categoryLabel: Scalars['String']['output'];
  /** A string that specifies a human readable representation of the time off policy */
  description?: Maybe<Scalars['String']['output']>;
};

export type PayrollReportEmploymentDetail = {
  __typename?: 'PayrollReportEmploymentDetail';
  /** Active or Inactive Status of the employee and detailed status */
  employmentStatus: Payroll_Employee_EmploymentStatus;
  /**
   * Formatted string combining the components of the work location address
   * @deprecated Use workLocation instead
   */
  formattedWorkLocationAddress?: Maybe<Scalars['String']['output']>;
  hireDate?: Maybe<Scalars['Date']['output']>;
  /** If the employee is terminated, this field denotes what date the termination occurred */
  terminationDate?: Maybe<Scalars['Date']['output']>;
  /** Employee work location address */
  workLocation?: Maybe<CompanyAddress>;
};

/** Employee count for a month in a quarter */
export type PayrollReportMonthlyEmployeeCount = {
  __typename?: 'PayrollReportMonthlyEmployeeCount';
  employeeCount: Scalars['Int']['output'];
  month: Month;
};

/** Period detail with begin and end dates for payroll reports */
export type PayrollReportPeriodDetail = Common_DatePeriod & {
  __typename?: 'PayrollReportPeriodDetail';
  beginDate: Scalars['Date']['output'];
  endDate: Scalars['Date']['output'];
};

export type PayrollReports = {
  __typename?: 'PayrollReports';
  /** Certified payroll report filtered by a specific pay period and project */
  certifiedPayrollReport?: Maybe<CertifiedPayrollReport>;
  /** Report to show contractor payments that have been made. */
  contractorPaymentsReport?: Maybe<ContractorPaymentsReport>;
  /** Report of total employee deductions, company contributions and garnishment amounts */
  deductionsAndContributionsReport?: Maybe<DeductionsAndContributionsReport>;
  /** Report to show the payroll summary (taxes and deductions) for the employee in a given tax year */
  employeeAnnualPayrollSummaryReport?: Maybe<EmployeeAnnualPayrollSummaryReport>;
  /**
   * Employee details report provides personal information (name, birth date, gender),
   * employment information (hire date, work location), pay information (pay rate, compensations,
   * deductions, contributions, time off policies) and tax information of an employee
   */
  employeeDetailsReport?: Maybe<EmployeeDetailsReport>;
  /**
   * Employee directory report provides employee's personal information like birth date, email, home address, home phone
   * and employment information like work location, hire date, work phone.
   */
  employeeDirectoryReport?: Maybe<EmployeeDirectoryReport>;
  /**
   * Payslips data filtered by a specific date range and/or work location and/or
   * workers compensation class aggregated to determine the breakdown and totals for
   * overall employer payroll cost
   */
  employerTotalPayrollCostReport?: Maybe<EmployerTotalPayrollCostReport>;
  /** Employment payment record report. */
  employmentPaymentRecordReport?: Maybe<EmploymentPaymentRecordReport>;
  /** Report to show org chart */
  orgChartReport?: Maybe<OrgChartReport>;
  /** Payroll aggregated data filtered by specified pay date range and report types. */
  payrollAggregatedReport?: Maybe<PayrollAggregatedReport>;
  /**
   * Payslips data filtered by a specific date range and/or work location and/or set of employees
   * aggregated by employee or period. If no filter is provided, aggregation will be
   * done on payslips from most recent paydate for active employees.
   */
  payslipAggregationReport?: Maybe<PayslipAggregationReport>;
  payslipsListReport?: Maybe<PayslipsListReport>;
  /** Report of payslip deduction and contribution amounts for employees' pensions */
  pensionsReport?: Maybe<PensionsReport>;
  /** Report to show recorded tax transactions. */
  recordedTaxTransactionsReport?: Maybe<RecordedTaxTransactionsReport>;
  /** Report of state mandated payslip deduction amounts for employees' pensions */
  stateMandatedPensionsReport?: Maybe<StateMandatedPensionsReport>;
  /** Report to show the total and taxable compensation details for all employees for each tax item */
  taxCompensationDetailReport?: Maybe<TaxCompensationDetailReport>;
  /** Report to show total and taxable compensations that are subject to federal and province/region/state withholding. */
  taxCompensationSummaryReport?: Maybe<TaxCompensationSummaryReport>;
  /** Report to show tax that already been paid and how much is owed. */
  taxLiabilityReport?: Maybe<TaxLiabilityReport>;
  /** Report to show time off details with hours and monetary amount breakdowns for each employee. */
  timeOffDetailsReport?: Maybe<TimeOffDetailsReport>;
  /** Report to show time off summary for all policies for all employees of a company. */
  timeOffSummaryReport?: Maybe<TimeOffSummaryReport>;
  /** report returns un-exported transactions for Payslip/Tax Payment/Contractor Payment */
  unexportedTransactionsReport: UnexportedTransactionsReport;
  /** Report to show employee counts and total compensations in a quarter for all work locations of a company. */
  workLocationsQuarterlyReport?: Maybe<WorkLocationsQuarterlyReport>;
  /** Report to show total and aggregated wages paid for each workers compensation class */
  workersCompensationReport?: Maybe<WorkersCompensationReport>;
  /** Report to show the work place pension summary for a pension item in a given pay date range */
  workplacePensionReport?: Maybe<WorkplacePensionReport>;
};


export type PayrollReportsCertifiedPayrollReportArgs = {
  input: CertifiedPayrollReportInput;
};


export type PayrollReportsContractorPaymentsReportArgs = {
  input: ContractorPaymentsReportInput;
};


export type PayrollReportsDeductionsAndContributionsReportArgs = {
  filterBy: DeductionsAndContributionsReportInput;
};


export type PayrollReportsEmployeeAnnualPayrollSummaryReportArgs = {
  input: EmployeeAnnualPayrollSummaryReportInput;
};


export type PayrollReportsEmployeeDetailsReportArgs = {
  input: EmployeeDetailsReportInput;
};


export type PayrollReportsEmployeeDirectoryReportArgs = {
  input: EmployeeDirectoryReportInput;
};


export type PayrollReportsEmployerTotalPayrollCostReportArgs = {
  input: EmployerTotalPayrollCostReportInput;
};


export type PayrollReportsEmploymentPaymentRecordReportArgs = {
  input: EmploymentPaymentRecordReportInput;
};


export type PayrollReportsOrgChartReportArgs = {
  input: OrgChartReportInput;
};


export type PayrollReportsPayrollAggregatedReportArgs = {
  input: PayrollAggregatedReportInput;
};


export type PayrollReportsPayslipAggregationReportArgs = {
  input: PayslipAggregationReportInput;
};


export type PayrollReportsPayslipsListReportArgs = {
  input: PayslipsListReportInput;
};


export type PayrollReportsPensionsReportArgs = {
  input: PensionsReportInput;
};


export type PayrollReportsRecordedTaxTransactionsReportArgs = {
  input: RecordedTaxTransactionInput;
};


export type PayrollReportsStateMandatedPensionsReportArgs = {
  input: StateMandatedPensionsReportInput;
};


export type PayrollReportsTaxCompensationDetailReportArgs = {
  input: TaxCompensationDetailReportInput;
};


export type PayrollReportsTaxCompensationSummaryReportArgs = {
  input: TaxCompensationSummaryReportInput;
};


export type PayrollReportsTaxLiabilityReportArgs = {
  input: TaxLiabilityReportInput;
};


export type PayrollReportsTimeOffDetailsReportArgs = {
  input: TimeOffDetailsReportInput;
};


export type PayrollReportsTimeOffSummaryReportArgs = {
  input: TimeOffSummaryReportInput;
};


export type PayrollReportsUnexportedTransactionsReportArgs = {
  input: UnexportedTransactionsReportInput;
};


export type PayrollReportsWorkLocationsQuarterlyReportArgs = {
  input: WorkLocationsQuarterlyReportInput;
};


export type PayrollReportsWorkersCompensationReportArgs = {
  input: WorkersCompensationReportInput;
};


export type PayrollReportsWorkplacePensionReportArgs = {
  input: WorkplacePensionReportInput;
};

/** Represents a compensation calculated to be paid as part of specific payroll run */
export type PayrollRunCalculatedCompensation = CalculatedCompensation & {
  __typename?: 'PayrollRunCalculatedCompensation';
  /** Includes current and total amounts for a compensation paid as part of specific payroll run */
  calculatedCompensationAccumulationAmount: CalculatedCompensationAccumulationAmount;
  /** Includes rate and hours used to compute compensation amount to be paid */
  calculatedCompensationDetail?: Maybe<CalculatedCompensationDetail>;
  /** CompensationSplits specifies how a singular calculated compensation breaks down across different compensationSplitDetail. If the total (of the compensationSpilts) is below the the value of hours or amount in the CalculatedCompensation, the remainder is unallocated. If compensationSplits is null, there is no allocation of this CalculatedCompensation across any employeeCompensationSplitData. */
  compensationSplits: Array<EmployeeCompensationSplit>;
  /** Compliance id for the compensation */
  complianceId?: Maybe<Scalars['String']['output']>;
  /** Compensation of the employee to be paid in specific payroll run */
  employeeCompensation: EmployeeCompensation;
};

export type PayrollRunCalculatedCompensationInput = {
  /** Includes amount and hours for a compensation */
  calculatedCompensationDetail: CalculatedCompensationDetailInput;
  /** CompensationSplits specifies how a singular calculated compensation breaks down across different compensationSplitDetail. If the total (of the compensationSpilts) is below the the value of hours or amount in the CalculatedCompensation, the remainder is unallocated. If compensationSplits is null, there is no allocation of this CalculatedCompensation across any employeeCompensationSplitData. */
  compensationSplits?: InputMaybe<Array<EmployeeCompensationSplitInput>>;
  /** Id of compensation of the employee */
  employeeCompensationId: Scalars['ID']['input'];
};

/** Metamodel to represents a compensation calculated to be paid as part payroll run */
export type PayrollRunCalculatedCompensationMetaModel = MetaModel & {
  __typename?: 'PayrollRunCalculatedCompensationMetaModel';
  applicable: Scalars['Boolean']['output'];
  calculatedCompensationAccumulationAmount: CalculatedCompensationAccumulationAmountMetaModel;
  calculatedCompensationDetail: CalculatedCompensationDetailMetaModel;
  employeeCompensation: EmployeeCompensationMetaModel;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Represents a deduction calculated during a specific payroll run */
export type PayrollRunCalculatedDeduction = CalculatedDeduction & {
  __typename?: 'PayrollRunCalculatedDeduction';
  /** Compliance id for the deduction */
  complianceId?: Maybe<Scalars['String']['output']>;
  /** Employee's current and total contribution amount to a deduction */
  employeeContributionAccumulationAmount?: Maybe<EmployeeContributionAccumulationAmount>;
  /** Deduction of the employee used for specific payroll run */
  employeeDeduction: EmployeeDeduction;
  /** Employer's current and total contribution amount to a deduction */
  employerContributionAccumulationAmount?: Maybe<EmployerContributionAccumulationAmount>;
};

export type PayrollRunCalculatedDeductionInput = {
  /** Current amount for an employee contribution */
  employeeContributionAmount?: InputMaybe<Scalars['Money']['input']>;
  /** Id of the deduction policy */
  employeeDeductionId: Scalars['ID']['input'];
  /** Current amount for an employer contribution */
  employerContributionAmount?: InputMaybe<Scalars['Money']['input']>;
};

/** Metamodel to represents a deduction calculated during payroll run */
export type PayrollRunCalculatedDeductionMetaModel = MetaModel & {
  __typename?: 'PayrollRunCalculatedDeductionMetaModel';
  applicable: Scalars['Boolean']['output'];
  employeeContributionAccumulationAmount: EmployeeContributionAccumulationAmountMetaModel;
  employeeDeduction: EmployeeDeductionMetaModel;
  employerContributionAccumulationAmount: EmployerContributionAccumulationAmountMetaModel;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Represents a tax calculated during a specific payroll run */
export type PayrollRunCalculatedTax = CalculatedTax & {
  __typename?: 'PayrollRunCalculatedTax';
  /** Includes current and total amounts for a tax */
  accumulationAmount: TaxAccumulationAmount;
  /** Compliance id for the tax */
  complianceId?: Maybe<Scalars['String']['output']>;
  /** Defines the exact tax type */
  statutoryType: Scalars['String']['output'];
};


/** Represents a tax calculated during a specific payroll run */
export type PayrollRunCalculatedTaxStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type PayrollRunCalculatedTaxInput = {
  /** Current amounts for a tax. */
  amount?: InputMaybe<Scalars['Money']['input']>;
  /** Monetary amount of income subject to tax */
  currentTaxableIncome?: InputMaybe<Scalars['Money']['input']>;
  /** Defines the exact tax type. */
  statutoryType: Scalars['String']['input'];
};

/** Metamodel to represents a a tax calculated during payroll run */
export type PayrollRunCalculatedTaxMetaModel = MetaModel & {
  __typename?: 'PayrollRunCalculatedTaxMetaModel';
  accumulationAmount: TaxAccumulationAmountMetaModel;
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  statutoryType: MetaString;
  typeRef: Scalars['String']['output'];
};

/** Represents a time off policy calculated during a specific payroll run */
export type PayrollRunCalculatedTimeOffPolicy = CalculatedTimeOffPolicy & {
  __typename?: 'PayrollRunCalculatedTimeOffPolicy';
  /**
   * Includes calculated accrued, used and available amounts for employee's time off policy
   * during payroll run
   */
  calculatedTimeOffAmountDetail: CalculatedTimeOffAmountDetail;
  /**
   * Includes calculated accrued, used and available hours for employee's time off policy
   * during payroll run
   */
  calculatedTimeOffHoursDetail: CalculatedTimeOffHoursDetail;
  /** Timeoff policy of the employee to be paid during the payroll run */
  employeeTimeOffPolicy: EmployeeTimeOffPolicy;
};

/** Summary of the payroll run date for a payroll run */
export type PayrollRunDateSummary = {
  __typename?: 'PayrollRunDateSummary';
  /** Cutoff dates for actions/events on this automated payroll run. e.g submit cutoff date */
  cutoffDateSummary?: Maybe<CutoffDateSummary>;
  /** Dates for direct deposit events on this payroll run for e.g. direct deposit settlement date */
  directDepositDateSummary?: Maybe<DirectDepositDateSummary>;
  /** Pay date of the payroll run */
  payDate: Scalars['Date']['output'];
  /** Pay period for which this payroll run is created */
  payPeriod?: Maybe<PayPeriod>;
};

export enum PayrollRunInfoOrderBy {
  PayrollRunDateAsc = 'payrollRunDate_ASC',
  PayrollRunDateDesc = 'payrollRunDate_DESC'
}

export type PayrollRunLedgerAccountInput = {
  /**
   * External IDs (for e.g. accountId maintained by QBO) of the
   * ledger account selected by the user
   */
  externalId?: InputMaybe<Common_ExternalIdInput>;
  /** Ledger account name selected by the user */
  name: Scalars['String']['input'];
};

/** A message encountered during a specific payroll run to show to the user */
export type PayrollRunMessage = Message & {
  __typename?: 'PayrollRunMessage';
  /** Code to identify message */
  code: Scalars['String']['output'];
  /** Short description */
  message?: Maybe<Scalars['String']['output']>;
  /** Defines the type of message (Info, Warning, Blocker) */
  type: MessageType;
};

/** Mode of payroll run. e.g automated/manual */
export enum PayrollRunMode {
  /** Automated payroll run */
  Automated = 'AUTOMATED',
  /** Manual payroll run */
  Manual = 'MANUAL'
}

/** Details on how the net pay of an employee payroll run is distributed */
export type PayrollRunNetPayDistribution = {
  __typename?: 'PayrollRunNetPayDistribution';
  amount: Scalars['Money']['output'];
  /**
   * The destination type of this distribution eg. Check, DirectDeposit.
   * There can only be either check or direct deposit.
   */
  method: EmployeePayDistributionMethod;
};

export type PayrollRunNetPayDistributionInput = {
  amount: Scalars['Money']['input'];
  /**
   * The destination type of this distribution eg. Check, DirectDeposit.
   * There can only be either check or direct deposit.
   */
  method: EmployeePayDistributionMethod;
};

/** The current state of the payroll run */
export enum PayrollRunStatus {
  /** Payroll run that is in progress */
  Draft = 'DRAFT',
  /** Completed payroll run */
  Submitted = 'SUBMITTED'
}

/** Type of payroll run */
export enum PayrollRunType {
  Adjustment = 'ADJUSTMENT',
  BlankAdjustment = 'BLANK_ADJUSTMENT',
  Bonus = 'BONUS',
  Commission = 'COMMISSION',
  Fringe = 'FRINGE',
  Regular = 'REGULAR'
}

/** Error generated as a result of a payroll run mutation */
export type PayrollRunUserError = {
  __typename?: 'PayrollRunUserError';
  /** error code */
  code?: Maybe<Scalars['String']['output']>;
  /** A description of the error */
  message: Scalars['String']['output'];
  /** error type */
  type?: Maybe<Scalars['String']['output']>;
};

export enum PayrollTaxPenaltyProtectionStatus {
  FeatureNotApplicable = 'FEATURE_NOT_APPLICABLE',
  Off = 'OFF',
  On = 'ON',
  OnHold = 'ON_HOLD'
}

/** Define the structure to store readiness details. It is used to define if an EE or ER is ready to start paying or generating filings */
export type Payroll_Definitions_ReadinessDetails = {
  __typename?: 'Payroll_Definitions_ReadinessDetails';
  /** true if ready */
  ready: Scalars['Boolean']['output'];
};

/** Defines the Profile info for an employee (emails, homeAddress, phones) */
export type Payroll_Employee_ContactInfo = {
  __typename?: 'Payroll_Employee_ContactInfo';
  homeAddress?: Maybe<Common_Address>;
  isMailingAddressSameAsHomeAddress?: Maybe<Scalars['Boolean']['output']>;
  mailingAddress?: Maybe<Common_Address>;
  phoneNumbers: Array<PhoneNumber>;
  primaryEmailAddress?: Maybe<EmailAddress>;
};

export type Payroll_Employee_ContactInfoInput = {
  homeAddress?: InputMaybe<Common_AddressInput>;
  mailingAddress?: InputMaybe<Common_AddressInput>;
  phoneNumbers?: InputMaybe<Array<PhoneNumberInput>>;
  primaryEmailAddress?: InputMaybe<EmailAddressInput>;
};

/** Metamodel for Payroll_Employee_ContactInfo, only has homeAddress for now */
export type Payroll_Employee_ContactInfoMetaModel = MetaModel & {
  __typename?: 'Payroll_Employee_ContactInfoMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** Home address of the payroll employee contact */
  homeAddress: Common_AddressMetaModel;
  label: Scalars['String']['output'];
  /** Mailing address of the payroll employee contact */
  mailingAddress: Common_AddressMetaModel;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** [/payroll/employee/EmployeeContractDetails](https://schema.intuit.com/#data:/payroll/employee/EmployeeContractDetails) */
export type Payroll_Employee_EmployeeContractDetails = EntityInterface & Node & {
  __typename?: 'Payroll_Employee_EmployeeContractDetails';
  /** Statutory type (e.g. TCTT_CUS_ESALARY) for the main way in which the employee is contracted to earn pay, e.g. as a condition of the employment itself (a salary), or based on hours worked or some other condition. */
  contractPayType: Scalars['String']['output'];
  /** The employee associated with this contract */
  employee: Employee;
  externalIds?: Maybe<Array<Maybe<Common_ExternalId>>>;
  /**
   * Pay frequency to define the rate unit e.g per year, per hour, etc.
   * Some frequencies may only be applicable to certain contract pay types, e.g. one jurisdiction may only support specifying salary per year, while another allows salary per year, per month, etc.
   */
  frequencyType?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  meta?: Maybe<Common_Metadata>;
  /** Monetary amount representing the employee salary or compensation */
  rate?: Maybe<Scalars['String']['output']>;
};

/**
 * [/payroll/employee/EmployeePayDistribution](https://schema.intuit.com/#data:/payroll/employee/EmployeePayDistribution)
 * A definition of how an employee's pay is distributed from their payslips
 */
export type Payroll_Employee_EmployeePayDistribution = {
  __typename?: 'Payroll_Employee_EmployeePayDistribution';
  /**
   * The destination type of this distribution eg. Check, Cash, MoneyMovement. There can only be at most one of either cash or check.
   * @deprecated Use method instead off of EmployeePayDistribution
   */
  distributionType: Scalars['String']['output'];
};

/** Define the structure to store readiness details. It is used to define if an EE or ER is ready to start paying or generating filings */
export type Payroll_Employee_EmployeeReadiness = {
  __typename?: 'Payroll_Employee_EmployeeReadiness';
  autoPayroll?: Maybe<EmployeeAutoPayrollReadiness>;
  /** Define if the employee is ready to be paid. */
  payReady?: Maybe<Payroll_Definitions_ReadinessDetails>;
  /** Define if the employee is ready to be paid */
  runPayroll?: Maybe<EmployeeRunPayrollReadinessDetails>;
};

export type Payroll_Employee_EmploymentDetail = {
  __typename?: 'Payroll_Employee_EmploymentDetail';
  /** This field denotes whether the employee is eligible to be rehired */
  eligibleToRehire?: Maybe<Scalars['Boolean']['output']>;
  employeeIdentifier?: Maybe<Scalars['String']['output']>;
  /** The classification of employment (e.g. FULL_TIME) */
  employmentClassification?: Maybe<EmploymentClassification>;
  /** The type of employment (e.g. SEASONAL) */
  employmentType: EmploymentType;
  healthInsuranceEligibility?: Maybe<Scalars['Boolean']['output']>;
  hireDate?: Maybe<Scalars['Date']['output']>;
  jobCosting?: Maybe<EmployeeJobCosting>;
  /** New employee information/declaration at the beginning of the employment (e.g. First job, Only job, Has another job or pension) */
  jobDeclaration?: Maybe<Scalars['String']['output']>;
  /** The current job title given to this employee */
  jobTitle?: Maybe<Scalars['String']['output']>;
  lastPayDate?: Maybe<Scalars['Date']['output']>;
  metaModel: EmploymentDetailMetaModel;
  /** A classification that identifies the occupation of the employeee */
  occupationalClassification?: Maybe<Scalars['String']['output']>;
  /**
   * The flag which defines if this employee is paid on a standard cadence, e.g. does this employee receive pay for every pay period of the year or not.
   * Required by some tax agencies to track an employee's tax compliance.
   */
  paidIrregularly?: Maybe<Scalars['Boolean']['output']>;
  payrollNumber?: Maybe<PayrollNumber>;
  /** The reporting unit this employee is assigned to */
  reportingUnit?: Maybe<ReportingUnit>;
  /**
   * Reason why the employee status is changing when employee is not on payroll (e.g. Quit / Take another job)
   * Status changes that require a reason are
   * Unpaid leave of absence
   * Not on payroll
   * Terminated
   * Deceased
   */
  statusReason?: Maybe<Scalars['String']['output']>;
  /** If the employee is terminated, this field denotes what date the termination occurred */
  terminationDate?: Maybe<Scalars['Date']['output']>;
  /** Reason for termination of an employee */
  terminationReason?: Maybe<Scalars['String']['output']>;
  /** @deprecated Use primaryWorkLocation instead */
  workLocation?: Maybe<CompanyAddress>;
};


export type Payroll_Employee_EmploymentDetailJobDeclarationArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


export type Payroll_Employee_EmploymentDetailOccupationalClassificationArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type Payroll_Employee_EmploymentDetailInput = {
  eligibleToRehire?: InputMaybe<Scalars['Boolean']['input']>;
  employeeIdentifier?: InputMaybe<Scalars['String']['input']>;
  employmentClassification?: InputMaybe<EmploymentClassification>;
  hireDate?: InputMaybe<Scalars['Date']['input']>;
  jobCosting?: InputMaybe<EmployeeJobCostingInput>;
  jobDeclaration?: InputMaybe<Scalars['String']['input']>;
  jobTitle?: InputMaybe<Scalars['String']['input']>;
  statusReason?: InputMaybe<Scalars['String']['input']>;
  terminationDate?: InputMaybe<Scalars['Date']['input']>;
  terminationReason?: InputMaybe<Scalars['String']['input']>;
};

/**
 * [/payroll/employee/EmploymentStatus](https://schema.intuit.com/#data:/payroll/employee/EmploymentStatus)
 * Defines the employment status depending on whether the employee is active for payroll and additional status detail.
 */
export type Payroll_Employee_EmploymentStatus = {
  __typename?: 'Payroll_Employee_EmploymentStatus';
  /**
   * Determines whether the employee will potentially be included in future payroll runs.
   * A false value indicates the employee will not be included while a true value signifies the employee will
   * be considered for inclusion in future payroll runs. However, for eligibility to be paid, see readiness.
   */
  active: Scalars['Boolean']['output'];
  /** employment status detail (Active, Paid Leave, Unpaid Leave, Not On Payroll, Terminated, Deceased) */
  detailedStatus?: Maybe<Scalars['String']['output']>;
};

export enum Payroll_Employee_EmploymentStatusEnumInput {
  Active = 'ACTIVE',
  Deceased = 'DECEASED',
  Inactive = 'INACTIVE',
  NotOnPayroll = 'NOT_ON_PAYROLL',
  PaidLeave = 'PAID_LEAVE',
  Terminated = 'TERMINATED',
  UnpaidLeave = 'UNPAID_LEAVE'
}

export type Payroll_Employee_EmploymentStatus_Input = {
  detailedStatus?: InputMaybe<Payroll_Employee_EmploymentStatusEnumInput>;
};

export enum Payroll_Employee_GenderEnumInput {
  Female = 'FEMALE',
  Male = 'MALE',
  Other = 'OTHER'
}

/** Details of setup for contractor payments direct deposit functionality. */
export type Payroll_Employer_ContractorPaymentsSetup = EntityInterface & Node & {
  __typename?: 'Payroll_Employer_ContractorPaymentsSetup';
  /**
   * Has the company collected W-9 info from contractors. Null indicates this information has not been collected yet.
   * Possible values:
   * - NO
   * - NOT_SURE
   * - YES
   */
  collectedW9Info?: Maybe<Scalars['String']['output']>;
  /** True if the overall setup for contractor payments has been completed. False if setup has not been completed yet. */
  completedSetup: Scalars['Boolean']['output'];
  externalIds?: Maybe<Array<Maybe<Common_ExternalId>>>;
  id: Scalars['ID']['output'];
  meta?: Maybe<Common_Metadata>;
  /** Status of completion of different stages of contractor payments setup process. */
  readiness: Array<Payroll_Employer_ContractorPaymentsSetup_Readiness_Item>;
  /** List of user actions associated with contractor payments setup. */
  userActions: Array<Payroll_Employer_ContractorPaymentsSetup_UserAction>;
};

/**
 * A given stage of the contractor payments setup process and the status of completion for that stage.
 * There are multiple ways that readiness may be determined, including the following:
 * - based on availability of information gathered from the user (e.g. for personalization)
 * - based on captured user actions (e.g. has the user reviewed and verified their latest company information)
 * - based on dynamically-determined availability of backend functionality (e.g. availability of a bank account
 * for direct deposit)
 */
export type Payroll_Employer_ContractorPaymentsSetup_Readiness_Item = {
  __typename?: 'Payroll_Employer_ContractorPaymentsSetup_Readiness_Item';
  /**
   * Name of a readiness item, one of the following:
   * - PERSONALIZATION
   * - BANK
   * - COMPANY_INFO
   * - CONTACT_INFO
   * - TAX_INFO
   * - CONTRACTOR_INVITATIONS
   */
  name: Scalars['String']['output'];
  /**
   * Status of a readiness item, one of the following:
   * - EMPTY
   * - IN_PROGRESS
   * - INVALID
   * - IN_REVIEW
   * - COMPLETED
   */
  status: Scalars['String']['output'];
};

/**
 * A user action is intended to capture whether a user has completed a certain part of the contractor payments setup
 * process. A user action is not intended to store actual information provided by the user as part of that action.
 */
export type Payroll_Employer_ContractorPaymentsSetup_UserAction = {
  __typename?: 'Payroll_Employer_ContractorPaymentsSetup_UserAction';
  /**
   * Name of a user action, one of the following:
   * - CONFIRMED_COMPANY_INFO
   * - CONFIRMED_CONTACT_INFO
   * - CONFIRMED_TAX_INFO
   * - PROCESSED_CONTRACTOR_INVITATIONS
   */
  name: Scalars['String']['output'];
  /**
   * Status of a user action, one of the following:
   * - NOT_ACTED_ON
   * - COMPLETED
   */
  status: Scalars['String']['output'];
};

/**
 * The workflow entity for a company setting up, primarily for the first time.
 * Data here represents what a customer has indicated about expectations for setup.
 * It does not imply any durable meaning either during or after the process.
 *
 * This is pending to be created in V4 schema where it will deprecate some parts of PayrollApplication.
 *
 * [/payroll/employer/FirstTimePayrollSetup](https://schema.intuit.com/#data:/payroll/employer/FirstTimePayrollSetup)
 */
export type Payroll_Employer_FirstTimePayrollSetup = EntityInterface & Node & {
  __typename?: 'Payroll_Employer_FirstTimePayrollSetup';
  /**
   * Whether the company wishes to defer employees' tax setup (e.g. w4 information) until after the first payroll run.
   * @deprecated Use deferredEmployeeTaxSetup instead
   */
  deferEmployeeTaxSetup?: Maybe<Scalars['Boolean']['output']>;
  deferredEmployeeTaxSetup: FirstTimePayrollSetupDeferredEmployeeTaxSetup;
  /** The date when first time payroll setup was completed. When non-null, the company is considered to no longer be in first time payroll setup state. This value should not be relied upon for any other processing or determinations about payroll setup status, as it only represents that setup was completed at this point in time. */
  done?: Maybe<Scalars['DateTime']['output']>;
  /** The date for which the company intends to pay their employees for the first time */
  expectedFirstPayrollPayDate?: Maybe<Scalars['Date']['output']>;
  externalIds?: Maybe<Array<Maybe<Common_ExternalId>>>;
  id: Scalars['ID']['output'];
  meta?: Maybe<Common_Metadata>;
  /** The status of the expert review portion of payroll setup, relevant for companies that have this feature. This review status can affect the Tax Penalty Protection status. Only modifiable by those with expert permissions. */
  payrollExpertReviewStatus?: Maybe<PayrollExpertReviewStatus>;
  /**
   * A measurement of the company's prior knowledge and experience with payroll, i.e. one of:
   * - BRAND_NEW
   * - INTERMEDIATE
   * - EXPERT
   */
  payrollExpertise?: Maybe<Scalars['String']['output']>;
  /** Whether the company believes it has paid employees before in the scope of this setup */
  priorPayHistory?: Maybe<Scalars['Boolean']['output']>;
  readiness?: Maybe<Payroll_Employer_FirstTimePayrollSetup_Readiness>;
};


/**
 * The workflow entity for a company setting up, primarily for the first time.
 * Data here represents what a customer has indicated about expectations for setup.
 * It does not imply any durable meaning either during or after the process.
 *
 * This is pending to be created in V4 schema where it will deprecate some parts of PayrollApplication.
 *
 * [/payroll/employer/FirstTimePayrollSetup](https://schema.intuit.com/#data:/payroll/employer/FirstTimePayrollSetup)
 */
export type Payroll_Employer_FirstTimePayrollSetupReadinessArgs = {
  filterBy?: InputMaybe<PayrollEmployerFirstTimePayrollSetupReadinessFilter>;
};

export enum Payroll_Employer_FirstTimePayrollSetup_PayrollExpertiseTypeEnum {
  BrandNew = 'BRAND_NEW',
  Expert = 'EXPERT',
  Intermediate = 'INTERMEDIATE'
}

/**
 * Items that have to be completed for different actions as part of a setup.
 * Different items represent if a company is ready for different actions (run payroll, submit filings, etc.).
 * Currently only the tasks necessary for running payroll are captured.
 *
 * This is pending to be created in V4 schema.
 *
 * [/payroll/employer/firstTimePayrollSetup/Readiness](https://schema.intuit.com/#data:/payroll/employer/firstTimePayrollSetup/Readiness)
 */
export type Payroll_Employer_FirstTimePayrollSetup_Readiness = {
  __typename?: 'Payroll_Employer_FirstTimePayrollSetup_Readiness';
  runPayroll?: Maybe<Payroll_Employer_FirstTimePayrollSetup_Readiness_Holder>;
};

/**
 * All the items that need to be completed to be ready. This is pending to be created in V4 schema.
 *
 * [/payroll/employer/firstTimePayrollSetup/readiness/Holder](https://schema.intuit.com/#data:/payroll/employer/firstTimePayrollSetup/readiness/Holder)
 */
export type Payroll_Employer_FirstTimePayrollSetup_Readiness_Holder = {
  __typename?: 'Payroll_Employer_FirstTimePayrollSetup_Readiness_Holder';
  items?: Maybe<Array<Maybe<Payroll_Employer_FirstTimePayrollSetup_Readiness_Item>>>;
};

/**
 * An item that has to be completed as part of the FTU.
 *
 * This is pending to be created in V4 schema.
 *
 * [/payroll/employer/firstTimePayrollSetup/readiness/Item](https://schema.intuit.com/#data:/payroll/employer/firstTimePayrollSetup/readiness/Item)
 */
export type Payroll_Employer_FirstTimePayrollSetup_Readiness_Item = {
  __typename?: 'Payroll_Employer_FirstTimePayrollSetup_Readiness_Item';
  /**
   * The name uniquely identifies the item being evaluated, i.e. one of:
   * -  PERSONALIZATION_SETUP
   * -  COMPANY_INFO
   * -  EMPLOYEES
   * -  TAX_INFO
   * -  BANK
   * -  RUN_PAYROLL
   * -  E_FILE
   * -  PAYROLL_ITEM_MAPPING
   */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * The status of the item, i.e. one of:
   * -  EMPTY (no progress has been made)
   * -  IN_PROGRESS (some progress has been made, but it is incomplete)
   * -  INVALID (the item has some progress, but the data fails some validation)
   * -  IN_REVIEW (the item has some progress, but the data requires intervention)
   * -  SKIPPED (the user has indicated that the item will not be completed)
   * -  COMPLETED (the item has been completed)
   */
  status?: Maybe<Scalars['String']['output']>;
};

/** The schedule by which employees are typically paid */
export type Payroll_Employer_PaySchedule = {
  __typename?: 'Payroll_Employer_PaySchedule';
  /** Parent company */
  employer: Company;
  /** The Pay Schedule frequency type */
  frequency: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /**
   * The initial dates used to calculate future pay periods and pay days.
   * These can't be edited once payroll has been run.
   */
  initialSetupDates: Payroll_Employer_PaySchedule_InitialSetupDates;
  /** The name for the pay schedule */
  name: Scalars['String']['output'];
};

/** The period for which payroll needs to be processed for a pay schedule. */
export type Payroll_Employer_PaySchedulePeriod = {
  __typename?: 'Payroll_Employer_PaySchedulePeriod';
  /** The payment date for the period */
  payDate: Scalars['Date']['output'];
  /** The start and end date of the period */
  payPeriod?: Maybe<Payroll_Employer_PaySchedulePeriod_DatePeriod>;
  /** The pay schedule that this period belongs to. */
  paySchedule?: Maybe<Payroll_Employer_PaySchedule>;
};

/** A period defining the start and end dates for a pay schedule. */
export type Payroll_Employer_PaySchedulePeriod_DatePeriod = Common_DatePeriod & {
  __typename?: 'Payroll_Employer_PaySchedulePeriod_DatePeriod';
  /** The first day of the pay period */
  beginDate: Scalars['Date']['output'];
  /** The end date of the pay period. */
  endDate: Scalars['Date']['output'];
};

/**
 * Information that can be used to co-relate payroll run with a specific pay schedule.
 * [/company/EmployerInfo/PaySchedulePeriod/PayrollRunInfo](https://schema.intuit.com/#data:/company/EmployerInfo/PaySchedulePeriod/PayrollRunInfo)
 */
export type Payroll_Employer_PaySchedulePeriod_PayrollRunInfo = {
  __typename?: 'Payroll_Employer_PaySchedulePeriod_PayrollRunInfo';
  /** The pay schedule period that this payroll run information applies to. */
  paySchedulePeriod: Payroll_Employer_PaySchedulePeriod;
  /**
   * Date that represents the latest possible date in which a payroll run for this period can be submitted,
   * based on the current setup of the employer and employees.
   */
  payrollRunDate?: Maybe<Scalars['Date']['output']>;
};

export type Payroll_Employer_PaySchedule_InitialSetupDates = {
  __typename?: 'Payroll_Employer_PaySchedule_InitialSetupDates';
  /**
   * The first date that the employer will pay employees for this pay schedule.
   * Used for configuring the pay date for the pay schedule.
   */
  payDate: Scalars['Date']['output'];
  /**
   * Used for configuring the current period of the pay schedule.
   * The end date of the first pay period.
   */
  payPeriodEndDate: Scalars['Date']['output'];
};

export enum Payroll_Employer_UpdateContractorPaymentsSetup_CollectedW9Info_Enum_Input {
  No = 'NO',
  NotSure = 'NOT_SURE',
  Yes = 'YES'
}

export type Payroll_Employer_UpdateContractorPaymentsSetup_Input = {
  collectedW9Info?: InputMaybe<Payroll_Employer_UpdateContractorPaymentsSetup_CollectedW9Info_Enum_Input>;
  id: Scalars['ID']['input'];
};

export type Payroll_Employer_UpdateContractorPaymentsSetup_Payload = {
  __typename?: 'Payroll_Employer_UpdateContractorPaymentsSetup_Payload';
  contractorPaymentsSetup?: Maybe<Payroll_Employer_ContractorPaymentsSetup>;
};

export type Payroll_Employer_UpdateContractorPaymentsSetup_UserActions_Input = {
  id: Scalars['ID']['input'];
  /**
   * The list of UserActions to update the status of, along with their new statuses.
   * Only existing UserActions can be updated, and no new UserActions can be created via this list.
   */
  userActions: Array<Payroll_Employer_UpdateContractorPaymentsSetup_UserActions_Item_Input>;
};

export type Payroll_Employer_UpdateContractorPaymentsSetup_UserActions_Item_Input = {
  name: Payroll_Employer_UpdateContractorPaymentsSetup_UserActions_Item_Name_Enum_Input;
  status: Payroll_Employer_UpdateContractorPaymentsSetup_UserActions_Item_Status_Enum_Input;
};

export enum Payroll_Employer_UpdateContractorPaymentsSetup_UserActions_Item_Name_Enum_Input {
  ConfirmedCompanyInfo = 'CONFIRMED_COMPANY_INFO',
  ConfirmedContactInfo = 'CONFIRMED_CONTACT_INFO',
  ConfirmedTaxInfo = 'CONFIRMED_TAX_INFO',
  InitiatedBankSetup = 'INITIATED_BANK_SETUP',
  ProcessedContractorInvitations = 'PROCESSED_CONTRACTOR_INVITATIONS'
}

export enum Payroll_Employer_UpdateContractorPaymentsSetup_UserActions_Item_Status_Enum_Input {
  Completed = 'COMPLETED',
  NotActedOn = 'NOT_ACTED_ON'
}

export type Payroll_Employer_UpdateContractorPaymentsSetup_UserActions_Payload = {
  __typename?: 'Payroll_Employer_UpdateContractorPaymentsSetup_UserActions_Payload';
  contractorPaymentsSetup?: Maybe<Payroll_Employer_ContractorPaymentsSetup>;
};

/** This enum is used to specify the desired format of the JSON string value for a String field whose value is an opaque string identifier. */
export enum Payroll_KeyFormat {
  /** A localized human readable string label for this opaque string value. */
  Label = 'LABEL',
  /** The opaque string value. This is the default format of a formattable opaque string field. */
  Value = 'VALUE'
}

/** Tax payments made by a company [/payroll/payments/TaxPayment](https://schema.intuit.com/#data:/payroll/payments/TaxPayment) */
export type Payroll_Payments_TaxPayment = Node & {
  __typename?: 'Payroll_Payments_TaxPayment';
  /** Should payments be exported to QBO */
  allowExport?: Maybe<Scalars['Boolean']['output']>;
  /** If true, then this payment is an amendment payment. */
  amendmentPayment?: Maybe<Scalars['Boolean']['output']>;
  /** A tax filing that must be made with this payment, if applicable. This is the same association as TaxFiling.associatedPayment but from the other direction. */
  associatedFiling?: Maybe<TaxFiling>;
  /** Is/was the platform responsible for automatically making this payment. False indicates that this payment will be/was made manually by the user. */
  automatic: Scalars['Boolean']['output'];
  /**
   * Overpayment resolution methods available for this tax payment;
   * only available if this tax payment is an overpayment (paymentStatus is OverPaid), null otherwise.
   */
  availableOverpaymentResolutions?: Maybe<Array<TaxOverpaymentResolutionMethod>>;
  /** Payment methods available for the tax payment */
  availablePaymentMethods?: Maybe<Array<Scalars['String']['output']>>;
  /** A user-entered check number for payments paid by paper check, outside of QuickBooks */
  checkNumber?: Maybe<Scalars['String']['output']>;
  /** A description of the companies tax payment deposit status */
  depositFrequencyType?: Maybe<Scalars['String']['output']>;
  /** Tax payment due date at the agency */
  dueDate?: Maybe<Scalars['Date']['output']>;
  /** Specific to electronic payments, will be null for manual payments. */
  electronicDetails?: Maybe<ElectronicTaxPaymentDetails>;
  /** Specifies if this Tax Payment has been exported to any external system */
  exportedToExternal: Scalars['Boolean']['output'];
  /** For external ids, required field for node. */
  externalIds?: Maybe<Array<Maybe<Common_ExternalId>>>;
  id: Scalars['ID']['output'];
  /** Specifies if this Tax Payment was made outside of payroll */
  importedFromExternal: Scalars['Boolean']['output'];
  /** List of messages providing extra information about this payment to the user, each of which could have an associated action that can be taken. */
  informationalMessages: Array<TaxPaymentMessage>;
  /** Indicates if the tax payment calculation is in progress */
  isCalculating?: Maybe<Scalars['Boolean']['output']>;
  /** Any memos that are tagged to the tax payment */
  memo?: Maybe<Scalars['String']['output']>;
  /** MetaModel representing Tax Payment */
  metaModel: TaxPaymentMetaModel;
  /** The amount of the tax payment */
  paymentAmount: Scalars['String']['output'];
  /** The date Intuit will make a payment to an agency */
  paymentDate?: Maybe<Scalars['Date']['output']>;
  /** A filled out tax form that instructs the user how make the payment, but which is not filed with the payment. Only present when associatedFiling is null. */
  paymentForm?: Maybe<TaxFormDocument>;
  /** The payment group details for the tax payment. */
  paymentGroup?: Maybe<PaymentGroup>;
  /**
   * The key for the agency to which the payment is due
   * @deprecated Use paymentGroup.type instead
   */
  paymentGroupType: Scalars['String']['output'];
  /**
   * The display name for the agency to which the payment is due
   * @deprecated Use paymentGroup.displayName instead
   */
  paymentGroupTypeDisplayName: Scalars['String']['output'];
  /** Payment method chosen for the tax payment */
  paymentMethod?: Maybe<Scalars['String']['output']>;
  /** Payment method type chosen for the tax payment */
  paymentMethodType?: Maybe<Scalars['String']['output']>;
  /** If true, then this payment is put on hold */
  paymentOnHold: Scalars['Boolean']['output'];
  /** Date range noting the being and end of the pay period */
  paymentPeriod?: Maybe<Payroll_Payments_TaxPayment_DatePeriod>;
  /** The status of tax payment. Expect one of Paid, Processing or Scheduled. */
  paymentStatus?: Maybe<Scalars['String']['output']>;
  /** Payment can be made through product or customer needs to make it outside of product */
  paymentUnsupported: Scalars['Boolean']['output'];
  /** Whether this payment is ready to be scheduled or paid, and if not, what actions need to be taken to correct that. Will be null if the payment has already been completed. */
  readiness?: Maybe<TaxPaymentReadiness>;
  /** List of tax payment details. */
  taxBreakdowns: Array<TaxPaymentTaxBreakdown>;
  /** The CMS ID of the TaxPayment Group this payment belongs to */
  taxPaymentGroupCmsId?: Maybe<Scalars['String']['output']>;
  /** List of warning messages suggesting reasons why the user may not want to make the payment yet at this time, but which ultimately do not block it from being made. */
  warningMessages: Array<TaxPaymentMessage>;
};

/** A connection to a list of items. */
export type Payroll_Payments_TaxPaymentConnection = {
  __typename?: 'Payroll_Payments_TaxPaymentConnection';
  edges?: Maybe<Array<Maybe<Payroll_Payments_TaxPaymentEdge>>>;
};

/** An edge in a connection. */
export type Payroll_Payments_TaxPaymentEdge = {
  __typename?: 'Payroll_Payments_TaxPaymentEdge';
  /** The item at the end of the edge */
  node?: Maybe<Payroll_Payments_TaxPayment>;
};

export type Payroll_Payments_TaxPaymentFilter = {
  /** Filters that can be applied to paymentDate */
  paymentDate?: InputMaybe<Payroll_Payments_TaxPayment_DateOperation>;
};

export type Payroll_Payments_TaxPayment_DateOperation = {
  gt?: InputMaybe<Scalars['Date']['input']>;
  lt?: InputMaybe<Scalars['Date']['input']>;
};

export type Payroll_Payments_TaxPayment_DatePeriod = Common_DatePeriod & {
  __typename?: 'Payroll_Payments_TaxPayment_DatePeriod';
  /** The first day of the pay period */
  beginDate: Scalars['Date']['output'];
  /** The end date of the pay period. */
  endDate: Scalars['Date']['output'];
};

export type Payroll_Payslip_EmployeePayslipMetaModel = {
  __typename?: 'Payroll_Payslip_EmployeePayslipMetaModel';
  type?: Maybe<EnumSchema>;
};

export type Payslip = Node & {
  __typename?: 'Payslip';
  /** List of AlternateID (e.g V4Id) */
  alternateIds?: Maybe<Array<Qb_AlternateId>>;
  /** Employee's compensations for this payslip. */
  compensations: Array<PayslipCalculatedCompensation>;
  /**
   * Correction details with reason why this correction payslip was created.
   * This is null for payslips that were not created as correction.
   */
  correctionDetails?: Maybe<PayslipCorrectionDetails>;
  /** Describes the eligibility of actions that can be performed on this payslip */
  correctionsEligibility: PayslipCorrectionActionsEligibility;
  /** Employee's deductions for this payslip. */
  deductions: Array<PayslipCalculatedDeduction>;
  employee: Employee;
  /** Employee taxes withheld for this payslip. */
  employeeTaxes: Array<PayslipCalculatedTax>;
  /** Employer taxes withheld for this payslip. */
  employerTaxes: Array<PayslipCalculatedTax>;
  /** Specifies if this Payslip has been exported to any external system */
  exportedToExternal: Scalars['Boolean']['output'];
  /** Payslip's external id used to load the Transaction Journal */
  externalIds: Array<Common_ExternalId>;
  /** Payslip funds account name: the payslip is paid from this account. */
  fundingLedgerAccountName?: Maybe<Scalars['String']['output']>;
  grossPay: PayslipAccumulationAmount;
  id: Scalars['ID']['output'];
  /** Memo note for this payslip. */
  memo?: Maybe<Scalars['String']['output']>;
  /** Meta model for Payslip */
  metaModel: PayslipMetaModel;
  netPay: Scalars['Money']['output'];
  /** Defines how the net pay amount will be distributed to the employee */
  netPayDistributions?: Maybe<Array<PayslipNetPayDistribution>>;
  /** Pay date of the payslip */
  payDate: Scalars['Date']['output'];
  payPeriod: PayslipPeriod;
  /** Employee's timeoff policies for this payslip. */
  timeOffPolicies: Array<PayslipCalculatedTimeOffPolicy>;
  /** This indicates the type of the payslip, e.g. Regular, Bonus, Commission, Fringe or Adjustment */
  type: Scalars['String']['output'];
};

/** Details for Payslip accumulation amounts. It returns current amount and year to date amount for a payslip. */
export type PayslipAccumulationAmount = {
  __typename?: 'PayslipAccumulationAmount';
  currentAmount: Scalars['Money']['output'];
  yearToDateAmount?: Maybe<Scalars['Money']['output']>;
};

/**
 * For Payslip aggregation by employee, two renderings are supported.
 * 1. Payslip aggregation report with all payslip item details
 * 2. Total pay report containing only compensation types an totals
 * for gross pay and additional reported earnings
 */
export type PayslipAggregationBreakdownByEmployeesRenderings = {
  __typename?: 'PayslipAggregationBreakdownByEmployeesRenderings';
  compensationItemDetails?: Maybe<PayslipAggregationCompensationEmployeeBreakdownRenderings>;
  payslipItemDetails?: Maybe<PayslipAggregationEmployeeBreakdownRenderings>;
};

export type PayslipAggregationByEmployee = {
  __typename?: 'PayslipAggregationByEmployee';
  breakdownByEmployees?: Maybe<Array<PayslipAggregationEmployeeBreakdown>>;
  breakdownByPayslipItem?: Maybe<PayslipAggregationPayslipItemBreakdown>;
};

export type PayslipAggregationByEmployeeExcelRenderInput = {
  /**
   * Specifies optional data that can be excluded from the generated excel for aggregation by employee report.
   * If not specified, all the data will be included by default
   */
  excludedData?: InputMaybe<Array<PayslipAggregationByEmployeeRenderingOptionalData>>;
  /**
   * Specifies whether the Excel file should include a breakdown of the data at the individual payslip item level.
   * If true, then the amounts, hours, etc. will all be detailed for each payslip item (e.g. "salary", "bonus")
   * and included, in addition to the total values for each grouping (e.g. "gross pay", "deductions") that the items belong to.
   * Otherwise, if false, only the total values for each grouping and the calculated values such as taxable pay, net pay etc.
   * will be included.
   */
  includePayslipItemDetails: Scalars['Boolean']['input'];
};

export type PayslipAggregationByEmployeePdfRenderInput = {
  /**
   * Specifies optional data to exclude while generating the pdf report for aggregation by employee report
   * If not specified, all the data will be included by default
   */
  excludedData?: InputMaybe<Array<PayslipAggregationByEmployeeRenderingOptionalData>>;
  /**
   * Specifies whether the PDF file should include a breakdown of the data at the individual payslip item level.
   * If true, then the amounts, hours, etc. will all be detailed for each payslip item (e.g. "salary", "bonus")
   * and included, in addition to the total values for each grouping (e.g. "gross pay", "deductions") that the items belong to.
   * Otherwise, if false, only the total values for each grouping and the calculated values such as taxable pay, net pay etc.
   * will be included.
   */
  includePayslipItemDetails: Scalars['Boolean']['input'];
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /**
   * Specifies if a header such as company name, date etc. should be repeated for each page of the pdf or not.
   * If not specified, it will be false by default
   */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/**
 * Specifies optional data for aggregation by employee report
 * that can be excluded from the rendering
 */
export enum PayslipAggregationByEmployeeRenderingOptionalData {
  AdditionalReportedEarning = 'ADDITIONAL_REPORTED_EARNING',
  EmployeeTaxesAndDeductions = 'EMPLOYEE_TAXES_AND_DEDUCTIONS',
  EmployerPayrollCost = 'EMPLOYER_PAYROLL_COST',
  EmployerTaxesAndContributions = 'EMPLOYER_TAXES_AND_CONTRIBUTIONS',
  GrossPay = 'GROSS_PAY',
  Hours = 'HOURS',
  NetPay = 'NET_PAY',
  QboClass = 'QBO_CLASS',
  WorkersCompClass = 'WORKERS_COMP_CLASS'
}

export type PayslipAggregationByEmployeeRenderings = {
  __typename?: 'PayslipAggregationByEmployeeRenderings';
  /** @deprecated Use breakdownByEmployees */
  breakdownByEmployee: PayslipAggregationEmployeeBreakdownRenderings;
  breakdownByEmployees?: Maybe<PayslipAggregationBreakdownByEmployeesRenderings>;
  breakdownByPayslipItem: PayslipAggregationEmployeeBreakdownRenderings;
};

export type PayslipAggregationByPeriod = {
  __typename?: 'PayslipAggregationByPeriod';
  breakdownByPayslipItem?: Maybe<PayslipAggregationPayslipItemBreakdown>;
  breakdownByPeriods?: Maybe<Array<PayslipAggregationPeriodBreakdown>>;
};


export type PayslipAggregationByPeriodBreakdownByPayslipItemArgs = {
  input: PayslipAggregationByPeriodInput;
};


export type PayslipAggregationByPeriodBreakdownByPeriodsArgs = {
  input: PayslipAggregationByPeriodInput;
};

export type PayslipAggregationByPeriodExcelRenderInput = {
  /**
   * Specifies optional data that can be excluded from the generated excel for aggregation by period report.
   * If not specified, all the data will be included by default
   */
  excludedData?: InputMaybe<Array<PayslipAggregationByPeriodRenderingOptionalData>>;
  /**
   * Specifies whether the Excel file should include a breakdown of the data at the individual payslip item level.
   * If true, then the amounts, hours, etc. will all be detailed for each payslip item (e.g. "salary", "bonus")
   * and included, in addition to the total values for each grouping (e.g. "gross pay", "deductions") that the items belong to.
   * Otherwise, if false, only the total values for each grouping and the calculated values such as taxable pay, net pay etc.
   * will be included.
   */
  includePayslipItemDetails: Scalars['Boolean']['input'];
};

export type PayslipAggregationByPeriodInput = {
  periodFrequency: PeriodAggregationFrequency;
};

export type PayslipAggregationByPeriodPdfRenderInput = {
  /**
   * Specifies optional data to exclude while generating the pdf for aggregation by period report.
   * If not specified, all the data will be included by default
   */
  excludedData?: InputMaybe<Array<PayslipAggregationByPeriodRenderingOptionalData>>;
  /**
   * Specifies whether the PDF file should include a breakdown of the data at the individual payslip item level.
   * If true, then the amounts, hours, etc. will all be detailed for each payslip item (e.g. "salary", "bonus")
   * and included, in addition to the total values for each grouping (e.g. "gross pay", "deductions") that the items belong to.
   * Otherwise, if false, only the total values for each grouping and the calculated values such as taxable pay, net pay etc.
   * will be included.
   */
  includePayslipItemDetails: Scalars['Boolean']['input'];
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /**
   * Specifies if a header such as company name, date etc. should be repeated for each page on the pdf or not.
   * If not specified, it will be false by default
   */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/**
 * Specifies optional data for aggregation by period report
 * that can be excluded from the rendering
 */
export enum PayslipAggregationByPeriodRenderingOptionalData {
  AdditionalReportedEarning = 'ADDITIONAL_REPORTED_EARNING',
  EmployeeTaxesAndDeductions = 'EMPLOYEE_TAXES_AND_DEDUCTIONS',
  EmployerPayrollCost = 'EMPLOYER_PAYROLL_COST',
  EmployerTaxesAndContributions = 'EMPLOYER_TAXES_AND_CONTRIBUTIONS',
  GrossPay = 'GROSS_PAY',
  Hours = 'HOURS',
  NetPay = 'NET_PAY'
}

export type PayslipAggregationByPeriodRenderings = {
  __typename?: 'PayslipAggregationByPeriodRenderings';
  breakdownByPayslipItem: PayslipAggregationPeriodBreakdownRenderings;
  breakdownByPeriod: PayslipAggregationPeriodBreakdownRenderings;
};

export type PayslipAggregationCompensationEmployeeBreakdownPdfRenderInput = {
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /**
   * Specifies if a header such as company name, date etc. should be repeated for each page of the pdf or not.
   * If not specified, it will be false by default
   */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Provides details for aggregated compensation details by employee report renderings e.g. excel, pdf */
export type PayslipAggregationCompensationEmployeeBreakdownRenderings = {
  __typename?: 'PayslipAggregationCompensationEmployeeBreakdownRenderings';
  excel?: Maybe<FileRendering>;
  pdf?: Maybe<FileRendering>;
};


/** Provides details for aggregated compensation details by employee report renderings e.g. excel, pdf */
export type PayslipAggregationCompensationEmployeeBreakdownRenderingsPdfArgs = {
  input?: InputMaybe<PayslipAggregationCompensationEmployeeBreakdownPdfRenderInput>;
};

export type PayslipAggregationDetail = {
  __typename?: 'PayslipAggregationDetail';
  /** Details of employee related payslip items for a single employee/period. */
  employeePayslipItems: EmployeePayslipItemsAggregationDetail;
  /**
   * The sum of money paid by an employer to cover their employees which includes
   * employee's grossEarnings, employer taxes and employer contributions
   */
  employerPayrollCost: Scalars['Money']['output'];
  /** Details of employer's related payslip items for a single employee/period. */
  employerPayslipItems: EmployerPayslipItemsAggregationDetail;
};

/** Returns payslip data aggregated by employee and broken down by employee */
export type PayslipAggregationEmployeeBreakdown = {
  __typename?: 'PayslipAggregationEmployeeBreakdown';
  employeeDetail: PayslipAggregationReportEmployeeDetail;
  /** Aggregated payslip items details for an employee */
  payslipAggregationDetail: PayslipAggregationDetail;
};

/** Provides details for payslip aggregation by employee report renderings e.g. excel, pdf */
export type PayslipAggregationEmployeeBreakdownRenderings = {
  __typename?: 'PayslipAggregationEmployeeBreakdownRenderings';
  excel?: Maybe<FileRendering>;
  pdf?: Maybe<FileRendering>;
};


/** Provides details for payslip aggregation by employee report renderings e.g. excel, pdf */
export type PayslipAggregationEmployeeBreakdownRenderingsExcelArgs = {
  input: PayslipAggregationByEmployeeExcelRenderInput;
};


/** Provides details for payslip aggregation by employee report renderings e.g. excel, pdf */
export type PayslipAggregationEmployeeBreakdownRenderingsPdfArgs = {
  input: PayslipAggregationByEmployeePdfRenderInput;
};

export type PayslipAggregationPayslipItemBreakdown = {
  __typename?: 'PayslipAggregationPayslipItemBreakdown';
  /** Details of employee related payslip items */
  employeePayslipItems: EmployeePayslipItemsAggregation;
  /**
   * List of employees for which the aggregation report is applicable. Will return the list of employees for which at least one
   * payslip exists.
   */
  employees?: Maybe<Array<PayslipAggregationReportEmployeeDetail>>;
  /**
   * The sum of money paid by an employer to cover their employees which includes
   * employee's grossEarnings, employer taxes and employer contributions. Returns a list
   * of employees or periods with their respective amount.
   */
  employerPayrollTotalCost: Array<EmployerPayrollCostDetail>;
  /** Details of employer's related payslip items */
  employerPayslipItems: EmployerPayslipItemsAggregation;
  /**
   * Splits the given date range into array of periods based on the period type input, useful for grouping payslips.
   * Will only return periods for which a at least one payslip (applicable for aggregation by period).
   * In case when aggregation is done by employee, the period would be the given input date range.
   */
  periods?: Maybe<Array<PayslipAggregationReportPeriodDetail>>;
};

/** Returns payslip data aggregated and broken down by selected period type */
export type PayslipAggregationPeriodBreakdown = {
  __typename?: 'PayslipAggregationPeriodBreakdown';
  payslipAggregationDetail: PayslipAggregationDetail;
  periodDetail: PayslipAggregationReportPeriodDetail;
};

/** Provides details for payslip aggregation by period report renderings e.g. excel, pdf */
export type PayslipAggregationPeriodBreakdownRenderings = {
  __typename?: 'PayslipAggregationPeriodBreakdownRenderings';
  excel?: Maybe<FileRendering>;
  pdf?: Maybe<FileRendering>;
};


/** Provides details for payslip aggregation by period report renderings e.g. excel, pdf */
export type PayslipAggregationPeriodBreakdownRenderingsExcelArgs = {
  input: PayslipAggregationByPeriodExcelRenderInput;
};


/** Provides details for payslip aggregation by period report renderings e.g. excel, pdf */
export type PayslipAggregationPeriodBreakdownRenderingsPdfArgs = {
  input: PayslipAggregationByPeriodPdfRenderInput;
};

export type PayslipAggregationReport = {
  __typename?: 'PayslipAggregationReport';
  aggregatedByEmployee?: Maybe<PayslipAggregationByEmployee>;
  aggregatedByPeriod?: Maybe<PayslipAggregationByPeriod>;
  /** Aggregation of payslips that have been created for prior pay history */
  historicalPayslipAggregationDetail?: Maybe<PayslipAggregationDetail>;
  /**
   * List of payslip items containing drilled down information about items and their totals.
   * Optional input contains limit and offset that may be used for pagination.
   * If no pagination is provided, it should return 20 payslips by default
   */
  payslips?: Maybe<PayslipAggregationReportPayslipDetailConnection>;
  /** Payslip Aggregation Report with report data rendering detail */
  renderings?: Maybe<PayslipAggregationReportRenderings>;
  /** Details of payslip items aggregated together */
  totalAggregationDetail?: Maybe<PayslipAggregationDetail>;
};


export type PayslipAggregationReportPayslipsArgs = {
  pagination?: InputMaybe<PaginationInput>;
};

/**
 * Aggregation for a given employee/period.Contains hours and amount for the total and respective values per each Wage
 * item type eg Regular, Bonus etc.
 */
export type PayslipAggregationReportCompensation = {
  __typename?: 'PayslipAggregationReportCompensation';
  amount: Scalars['Money']['output'];
  employerCompensationTypeId: Scalars['ID']['output'];
  employerCompensationTypeName: Scalars['String']['output'];
  hours?: Maybe<Scalars['Float']['output']>;
};

/**
 * Information about the Wage item type with the list of employee or periods associated with it, based on the interface
 * usage. For example, returns a list of all employees with 'regular' as Wage type, with its corresponding amount and hours.
 */
export type PayslipAggregationReportCompensations = {
  __typename?: 'PayslipAggregationReportCompensations';
  compensationDetails?: Maybe<Array<PayslipCompensationDetail>>;
  employerCompensationTypeId: Scalars['ID']['output'];
  employerCompensationTypeName: Scalars['String']['output'];
};

/** Aggregation for a given employee/period.Contains amount for the total and respective values per each deduction item type */
export type PayslipAggregationReportDeduction = {
  __typename?: 'PayslipAggregationReportDeduction';
  amount: Scalars['Money']['output'];
  employerDeductionTypeId: Scalars['ID']['output'];
  employerDeductionTypeName: Scalars['String']['output'];
};

/**
 * Information about the deduction item type with the list of employee or periods associated with it, based on the interface
 * usage.For example, returns a list of all employees with 'HSA' as deduction type, with its corresponding amount and hours.
 */
export type PayslipAggregationReportDeductions = {
  __typename?: 'PayslipAggregationReportDeductions';
  deductionDetails?: Maybe<Array<PayslipDeductionDetail>>;
  employerDeductionTypeId: Scalars['ID']['output'];
  employerDeductionTypeName: Scalars['String']['output'];
};

export type PayslipAggregationReportEmployeeDetail = {
  __typename?: 'PayslipAggregationReportEmployeeDetail';
  /** Accounting categorization class assigned to an employee */
  accountingCategorizationClass?: Maybe<AccountingCategorizationClass>;
  employeeId: Scalars['ID']['output'];
  /** Active or Inactive Status of the employee and detailed status */
  employmentStatus: Payroll_Employee_EmploymentStatus;
  firstName: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  middleInitial?: Maybe<Scalars['String']['output']>;
  /** Tax information of the employee at the time of payslip generation */
  taxDetails?: Maybe<PayslipAggregationReportEmployeeDetailTaxDetails>;
  workersCompensationClass?: Maybe<EmployeeWorkersCompensationClass>;
};

/**
 * Breakdown of the employee's tax information for a given payslip; specifically those fields which are exposed during the report preview
 * For example, returns a list of all the employee's tax codes used for calculations at time of payslip generation
 */
export type PayslipAggregationReportEmployeeDetailTaxDetails = {
  __typename?: 'PayslipAggregationReportEmployeeDetailTaxDetails';
  taxCodes: Array<VariableTypeField>;
};

export type PayslipAggregationReportEmployeeFilter = {
  employmentStatus?: InputMaybe<StringFilter>;
  id?: InputMaybe<IdFilter>;
  workersCompensationClass?: InputMaybe<StringFilter>;
};

/** Aggregation for a given employee/period.Contains amount for the total and respective values per each contribution item type */
export type PayslipAggregationReportEmployerContribution = {
  __typename?: 'PayslipAggregationReportEmployerContribution';
  amount: Scalars['Money']['output'];
  employerContributionTypeId: Scalars['ID']['output'];
  employerContributionTypeName: Scalars['String']['output'];
};

/**
 * Information about the contribution item type with the list of employee or periods associated with it, based on the interface
 * usage.
 */
export type PayslipAggregationReportEmployerContributions = {
  __typename?: 'PayslipAggregationReportEmployerContributions';
  contributionDetails?: Maybe<Array<PayslipEmployerContributionDetail>>;
  employerContributionTypeId: Scalars['ID']['output'];
  employerContributionTypeName: Scalars['String']['output'];
};

export type PayslipAggregationReportInput = {
  /** Class to categorize accounting transactions */
  accountingCategorizationClass?: InputMaybe<AccountingCategorizationClassFilter>;
  employee: PayslipAggregationReportEmployeeFilter;
  payDate: PayslipPayDateFilter;
  /** Tracking class filter to aggregate payroll transaction data */
  trackingClass?: InputMaybe<TrackingClassFilter>;
  workLocation?: InputMaybe<PayslipWorkLocationFilter>;
};

/**
 * Returns subset of the payslip data to avoid having reference to the actual payslip
 * type for performance reasons
 */
export type PayslipAggregationReportPayslipDetail = {
  __typename?: 'PayslipAggregationReportPayslipDetail';
  employeeDetail: PayslipAggregationReportEmployeeDetail;
  netPayDistributions?: Maybe<Array<PayslipNetPayDistribution>>;
  payDate: Scalars['Date']['output'];
  payPeriod: PayslipAggregationReportPeriodDetail;
  payslipId: Scalars['ID']['output'];
  payslipItemsDetail: PayslipAggregationDetail;
};

/** A connection to the list of payslip aggregation details used in reports. */
export type PayslipAggregationReportPayslipDetailConnection = {
  __typename?: 'PayslipAggregationReportPayslipDetailConnection';
  edges?: Maybe<Array<Maybe<PayslipAggregationReportPayslipDetailEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type PayslipAggregationReportPayslipDetailEdge = {
  __typename?: 'PayslipAggregationReportPayslipDetailEdge';
  cursor: Scalars['String']['output'];
  node: PayslipAggregationReportPayslipDetail;
};

export type PayslipAggregationReportPayslipDetailExcelRenderInput = {
  excludedData?: InputMaybe<Array<PayslipAggregationReportPayslipDetailOptionalData>>;
  includePayslipItemDetails: Scalars['Boolean']['input'];
};

export enum PayslipAggregationReportPayslipDetailOptionalData {
  AdditionalReportedEarning = 'ADDITIONAL_REPORTED_EARNING',
  EmployeeTaxesAndDeductions = 'EMPLOYEE_TAXES_AND_DEDUCTIONS',
  EmployerPayrollCost = 'EMPLOYER_PAYROLL_COST',
  EmployerTaxesAndContributions = 'EMPLOYER_TAXES_AND_CONTRIBUTIONS',
  GrossPay = 'GROSS_PAY',
  Hours = 'HOURS',
  NetpaydistributionsChecknumber = 'NETPAYDISTRIBUTIONS_CHECKNUMBER',
  NetPay = 'NET_PAY',
  PayDate = 'PAY_DATE',
  PayPeriod = 'PAY_PERIOD',
  QboClass = 'QBO_CLASS',
  WorkersCompClass = 'WORKERS_COMP_CLASS'
}

export type PayslipAggregationReportPayslipDetailPdfRenderInput = {
  excludedData?: InputMaybe<Array<PayslipAggregationReportPayslipDetailOptionalData>>;
  includePayslipItemDetails: Scalars['Boolean']['input'];
  pageOrientation?: InputMaybe<PageOrientation>;
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Returns renderings such as excel, pdf for payslip details view of the aggregation report */
export type PayslipAggregationReportPayslipDetailRenderings = {
  __typename?: 'PayslipAggregationReportPayslipDetailRenderings';
  excel?: Maybe<FileRendering>;
  pdf?: Maybe<FileRendering>;
};


/** Returns renderings such as excel, pdf for payslip details view of the aggregation report */
export type PayslipAggregationReportPayslipDetailRenderingsExcelArgs = {
  input?: InputMaybe<PayslipAggregationReportPayslipDetailExcelRenderInput>;
};


/** Returns renderings such as excel, pdf for payslip details view of the aggregation report */
export type PayslipAggregationReportPayslipDetailRenderingsPdfArgs = {
  input?: InputMaybe<PayslipAggregationReportPayslipDetailPdfRenderInput>;
};

export type PayslipAggregationReportPayslipSummaryExcelRenderInput = {
  excludedData?: InputMaybe<Array<PayslipAggregationReportPayslipSummaryOptionalData>>;
};

export enum PayslipAggregationReportPayslipSummaryOptionalData {
  AdditionalReportedEarning = 'ADDITIONAL_REPORTED_EARNING',
  EmployeeAfterTaxDeductions = 'EMPLOYEE_AFTER_TAX_DEDUCTIONS',
  EmployeePreTaxDeductions = 'EMPLOYEE_PRE_TAX_DEDUCTIONS',
  EmployeeTaxes = 'EMPLOYEE_TAXES',
  EmployerContributions = 'EMPLOYER_CONTRIBUTIONS',
  EmployerPayrollCost = 'EMPLOYER_PAYROLL_COST',
  EmployerTaxes = 'EMPLOYER_TAXES',
  GrossPay = 'GROSS_PAY',
  Hours = 'HOURS',
  NetpaydistributionsChecknumber = 'NETPAYDISTRIBUTIONS_CHECKNUMBER',
  NetPay = 'NET_PAY',
  PayPeriod = 'PAY_PERIOD',
  QboClass = 'QBO_CLASS',
  WorkersCompClass = 'WORKERS_COMP_CLASS'
}

export type PayslipAggregationReportPayslipSummaryPdfRenderInput = {
  excludedData?: InputMaybe<Array<PayslipAggregationReportPayslipSummaryOptionalData>>;
  pageOrientation?: InputMaybe<PageOrientation>;
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Returns renderings such as excel, pdf for payslip summary view of the aggregation report */
export type PayslipAggregationReportPayslipSummaryRenderings = {
  __typename?: 'PayslipAggregationReportPayslipSummaryRenderings';
  excel?: Maybe<FileRendering>;
  pdf?: Maybe<FileRendering>;
};


/** Returns renderings such as excel, pdf for payslip summary view of the aggregation report */
export type PayslipAggregationReportPayslipSummaryRenderingsExcelArgs = {
  input?: InputMaybe<PayslipAggregationReportPayslipSummaryExcelRenderInput>;
};


/** Returns renderings such as excel, pdf for payslip summary view of the aggregation report */
export type PayslipAggregationReportPayslipSummaryRenderingsPdfArgs = {
  input?: InputMaybe<PayslipAggregationReportPayslipSummaryPdfRenderInput>;
};

/** @deprecated use PayslipAggregationReportPayslipDetailExcelRenderInput or PayslipAggregationReportPayslipSummaryExcelRenderInput instead. */
export type PayslipAggregationReportPayslipsExcelRenderInput = {
  /**
   * Specifies optional data to exclude while generating the excel report for payslip view of the report
   * If not specified, all the data will be included by default
   */
  excludedData?: InputMaybe<Array<PayslipAggregationReportPayslipsOptionalData>>;
  /**
   * Specifies whether the Excel file should include a breakdown of the data at the individual payslip item level.
   * If true, then the amounts, hours, etc. will all be detailed for each payslip item (e.g. "salary", "bonus")
   * and included, in addition to the total values for each grouping (e.g. "gross pay", "deductions") that the items belong to.
   * Otherwise, if false, only the total values for each grouping and the calculated values such as taxable pay, net pay etc.
   * will be included.
   */
  includePayslipItemDetails: Scalars['Boolean']['input'];
};

/**
 * @deprecated use PayslipAggregationReportPayslipDetailOptionalData or PayslipAggregationReportPayslipSummaryOptionalData instead.
 * Specifies the optional data that can additionally be excluded in any of the file rendering
 * for payslips summary report
 */
export enum PayslipAggregationReportPayslipsOptionalData {
  AdditionalReportedEarning = 'ADDITIONAL_REPORTED_EARNING',
  EmployeeTaxesAndDeductions = 'EMPLOYEE_TAXES_AND_DEDUCTIONS',
  EmployerPayrollCost = 'EMPLOYER_PAYROLL_COST',
  EmployerTaxesAndContributions = 'EMPLOYER_TAXES_AND_CONTRIBUTIONS',
  /**
   * Excluding this data only excludes the amounts for pre-tax deduction and gross pay
   * from gross pay section of the report. To exclude the entire section including amount and hours,
   * you would need to specify GROSS_PAY and HOURS both in the excludedData array
   */
  GrossPay = 'GROSS_PAY',
  /**
   * Excluding this data only removes the hours data from gross pay section
   * of the report. To exclude the entire section including amount and hours,
   * you would need to specify GROSS_PAY and HOURS both in the excludedData array
   */
  Hours = 'HOURS',
  NetpaydistributionsChecknumber = 'NETPAYDISTRIBUTIONS_CHECKNUMBER',
  NetPay = 'NET_PAY',
  PayDate = 'PAY_DATE',
  PayPeriod = 'PAY_PERIOD',
  QboClass = 'QBO_CLASS',
  WorkersCompClass = 'WORKERS_COMP_CLASS'
}

/** @deprecated use PayslipAggregationReportPayslipDetailPdfRenderInput or PayslipAggregationReportPayslipSummaryPdfRenderInput instead. */
export type PayslipAggregationReportPayslipsPdfRenderInput = {
  /**
   * Specifies optional data to exclude while generating the pdf report for payslip view of the report
   * If not specified, all the data will be included by default
   */
  excludedData?: InputMaybe<Array<PayslipAggregationReportPayslipsOptionalData>>;
  /**
   * Specifies whether the PDF file should include a breakdown of the data at the individual payslip item level.
   * If true, then the amounts, hours, etc. will all be detailed for each payslip item (e.g. "salary", "bonus")
   * and included, in addition to the total values for each grouping (e.g. "gross pay", "deductions") that the items belong to.
   * Otherwise, if false, only the total values for each grouping and the calculated values such as taxable pay, net pay etc.
   * will be included.
   */
  includePayslipItemDetails: Scalars['Boolean']['input'];
  /**
   * Specifies if a header such as company name, date etc. should be repeated for each page on the pdf or not.
   * If not specified, it will be false by default.
   */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Returns renderings such as excel, pdf for payslip details or summary view of the aggregation report */
export type PayslipAggregationReportPayslipsRenderings = {
  __typename?: 'PayslipAggregationReportPayslipsRenderings';
  /** Renderings for a detailed Report for payslips in a tabular format with all the breakdowns that constitute the total */
  details?: Maybe<PayslipAggregationReportPayslipDetailRenderings>;
  /** @deprecated Use `details.excel` or `summary.excel` field instead */
  excel?: Maybe<FileRendering>;
  /** @deprecated Use `details.pdf` or `summary.pdf` field instead */
  pdf?: Maybe<FileRendering>;
  /** Renderings for a summarized report for paylsips with aggregated data */
  summary?: Maybe<PayslipAggregationReportPayslipSummaryRenderings>;
};


/** Returns renderings such as excel, pdf for payslip details or summary view of the aggregation report */
export type PayslipAggregationReportPayslipsRenderingsExcelArgs = {
  input?: InputMaybe<PayslipAggregationReportPayslipsExcelRenderInput>;
};


/** Returns renderings such as excel, pdf for payslip details or summary view of the aggregation report */
export type PayslipAggregationReportPayslipsRenderingsPdfArgs = {
  input?: InputMaybe<PayslipAggregationReportPayslipsPdfRenderInput>;
};

export type PayslipAggregationReportPeriodDetail = Common_DatePeriod & {
  __typename?: 'PayslipAggregationReportPeriodDetail';
  beginDate: Scalars['Date']['output'];
  endDate: Scalars['Date']['output'];
};

/**
 * Payslip aggregation report supports various renderings for
 * aggregation detail view and for payslip details view. Note that
 * each rendering also includes aggregated totals for the report
 */
export type PayslipAggregationReportRenderings = {
  __typename?: 'PayslipAggregationReportRenderings';
  aggregatedByEmployee: PayslipAggregationByEmployeeRenderings;
  aggregatedByPeriod: PayslipAggregationByPeriodRenderings;
  payslips: PayslipAggregationReportPayslipsRenderings;
};


/**
 * Payslip aggregation report supports various renderings for
 * aggregation detail view and for payslip details view. Note that
 * each rendering also includes aggregated totals for the report
 */
export type PayslipAggregationReportRenderingsAggregatedByPeriodArgs = {
  input?: InputMaybe<PayslipAggregationByPeriodInput>;
};

/** Aggregation for a given employee/period. Contains amount for the total and respective values per each tax item type */
export type PayslipAggregationReportTax = {
  __typename?: 'PayslipAggregationReportTax';
  amount: Scalars['Money']['output'];
  taxTypeId: Scalars['ID']['output'];
  taxTypeName: Scalars['String']['output'];
};

/**
 * Information about the tax item type with the list of employee or periods associated with it, based on the interface
 * usage. For example, returns a list of all employees with 'FIT' or 'SS' as tax type, with its corresponding amount and hours.
 */
export type PayslipAggregationReportTaxes = {
  __typename?: 'PayslipAggregationReportTaxes';
  taxDetails?: Maybe<Array<PayslipTaxDetail>>;
  taxTypeId: Scalars['ID']['output'];
  taxTypeName: Scalars['String']['output'];
};

export type PayslipCalculatedAccumulationAmountInput = {
  /** Monetary amount paid for a compensation */
  currentAmount?: InputMaybe<Scalars['Money']['input']>;
  /** Monetary amount of income subject to tax */
  currentTaxableIncome?: InputMaybe<Scalars['Money']['input']>;
};

/** Represents a compensation calculated for a specific payslip. */
export type PayslipCalculatedCompensation = CalculatedCompensation & {
  __typename?: 'PayslipCalculatedCompensation';
  /** Includes current and total amounts for a compensation paid. */
  calculatedCompensationAccumulationAmount: CalculatedCompensationAccumulationAmount;
  /** Includes rate and hours used to compute compensation amount to be paid. */
  calculatedCompensationDetail: CalculatedCompensationDetail;
  /** CompensationSplits specifies how a singular calculated compensation breaks down across different compensationSplitDetail. If the total (of the compensationSpilts) is below the the value of hours or amount in the CalculatedCompensation, the remainder is unallocated. If compensationSplits is null, there is no allocation of this CalculatedCompensation across any employeeCompensationSplitData. */
  compensationSplits: Array<EmployeeCompensationSplit>;
  /** Compliance id for the compensation */
  complianceId?: Maybe<Scalars['String']['output']>;
  /** Compensation of the employee to be paid. */
  employeeCompensation: EmployeeCompensation;
};

export type PayslipCalculatedCompensationDetailInput = {
  /** Hours worked for a compensation */
  hours?: InputMaybe<Scalars['Float']['input']>;
  /** The money rate this compensation is paid with */
  rate?: InputMaybe<PayRateInput>;
};

export type PayslipCalculatedCompensationInput = {
  /** Includes amount for a compensation */
  calculatedCompensationAccumulationAmount?: InputMaybe<PayslipCalculatedAccumulationAmountInput>;
  /** Includes hours and rate for a compensation */
  calculatedCompensationDetail?: InputMaybe<PayslipCalculatedCompensationDetailInput>;
  /** CompensationSplits specifies how a singular calculated compensation breaks down across different compensationSplitDetail. If the total (of the compensationSpilts) is below the the value of hours or amount in the CalculatedCompensation, the remainder is unallocated. If compensationSplits is null, there is no allocation of this CalculatedCompensation across any employeeCompensationSplitData. */
  compensationSplits?: InputMaybe<Array<EmployeeCompensationSplitInput>>;
  /** Id of a compensation */
  employeeCompensationId: Scalars['ID']['input'];
};

/** Metamodel to represent a compensation calculated for a specific payslip. */
export type PayslipCalculatedCompensationMetaModel = MetaModel & {
  __typename?: 'PayslipCalculatedCompensationMetaModel';
  applicable: Scalars['Boolean']['output'];
  calculatedCompensationAccumulationAmount: CalculatedCompensationAccumulationAmountMetaModel;
  calculatedCompensationDetail: CalculatedCompensationDetailMetaModel;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Represents a deduction calculated for a specific payslip. */
export type PayslipCalculatedDeduction = CalculatedDeduction & {
  __typename?: 'PayslipCalculatedDeduction';
  /** Compliance id for the deduction */
  complianceId?: Maybe<Scalars['String']['output']>;
  /** Employee's current and total contribution amount to a deduction. */
  employeeContributionAccumulationAmount?: Maybe<EmployeeContributionAccumulationAmount>;
  /** Deduction of the employee used. */
  employeeDeduction: EmployeeDeduction;
  /** Employer's current and total contribution amount to a deduction. */
  employerContributionAccumulationAmount?: Maybe<EmployerContributionAccumulationAmount>;
};

export type PayslipCalculatedDeductionInput = {
  /** Includes amount for an employee contribution */
  employeeContributionAccumulationAmount?: InputMaybe<PayslipCalculatedAccumulationAmountInput>;
  /** Id of the deduction policy */
  employeeDeductionId: Scalars['ID']['input'];
  /** Includes amount for an employer contribution */
  employerContributionAccumulationAmount?: InputMaybe<PayslipCalculatedAccumulationAmountInput>;
};

/** Metamodel to represent a deduction calculated for a specific payslip. */
export type PayslipCalculatedDeductionMetaModel = MetaModel & {
  __typename?: 'PayslipCalculatedDeductionMetaModel';
  applicable: Scalars['Boolean']['output'];
  employeeContributionAccumulationAmount: EmployeeContributionAccumulationAmountMetaModel;
  employeeDeduction: EmployeeDeductionMetaModel;
  employerContributionAccumulationAmount: EmployerContributionAccumulationAmountMetaModel;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Represents a tax calculated for a specific payslip. */
export type PayslipCalculatedTax = CalculatedTax & {
  __typename?: 'PayslipCalculatedTax';
  /** Includes current and total amounts for a tax. */
  accumulationAmount: TaxAccumulationAmount;
  /** Compliance id for the tax */
  complianceId?: Maybe<Scalars['String']['output']>;
  /** Defines the exact tax type. */
  statutoryType: Scalars['String']['output'];
};


/** Represents a tax calculated for a specific payslip. */
export type PayslipCalculatedTaxStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type PayslipCalculatedTaxInput = {
  /** Includes current amounts for a tax. */
  accumulationAmount: PayslipCalculatedAccumulationAmountInput;
  /** Defines the exact tax type. */
  statutoryType: Scalars['String']['input'];
};

/** Metamodel to represent a tax calculated for a specific payslip. */
export type PayslipCalculatedTaxMetaModel = MetaModel & {
  __typename?: 'PayslipCalculatedTaxMetaModel';
  accumulationAmount: TaxAccumulationAmountMetaModel;
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  statutoryType: MetaString;
  typeRef: Scalars['String']['output'];
};

/** Represents a time off policy calculated for a specific payslip. */
export type PayslipCalculatedTimeOffPolicy = CalculatedTimeOffPolicy & {
  __typename?: 'PayslipCalculatedTimeOffPolicy';
  /** Includes calculated accrued, used and available amounts for employee's time off policy. */
  calculatedTimeOffAmountDetail: CalculatedTimeOffAmountDetail;
  /** Includes calculated accrued, used and available hours for employee's time off policy. */
  calculatedTimeOffHoursDetail: CalculatedTimeOffHoursDetail;
  /** Timeoff policy of the employee to be paid. */
  employeeTimeOffPolicy: EmployeeTimeOffPolicy;
};

/**
 * Aggregation for a given employee/period returning a flat list of all Wage types. This type is to be used for
 * breakdownByEmployee or breakdownByPeriod which will already have the period and
 * employee detail at the higher level.
 */
export type PayslipCompensationAggregationDetail = {
  __typename?: 'PayslipCompensationAggregationDetail';
  totalAmount: Scalars['Money']['output'];
  totalHours?: Maybe<Scalars['Float']['output']>;
  totalsByCompensationType: Array<PayslipAggregationReportCompensation>;
};

/**
 * Returns a list of employees/periods with their respective total compensation information. And returns a list of lists for
 * each compensation type with its corresponding employee/period. To be used in breakdownByPayslip Item, common for
 * aggregateByEmployee and aggregateByPeriod.
 */
export type PayslipCompensationAggregations = {
  __typename?: 'PayslipCompensationAggregations';
  totals: Array<PayslipCompensationDetail>;
  totalsByCompensationType: Array<PayslipAggregationReportCompensations>;
};

/** Details related to a Wage item shared across reports with varied breakdowns. */
export type PayslipCompensationDetail = {
  amount: Scalars['Money']['output'];
  hours?: Maybe<Scalars['Float']['output']>;
};

/**
 * Wage Item Detail attached to an employee, to be used in breakdownByPayslip Item.
 * This type will be relevant only in case of AggregatedByEmployee
 */
export type PayslipCompensationDetailForEmployee = PayslipCompensationDetail & {
  __typename?: 'PayslipCompensationDetailForEmployee';
  amount: Scalars['Money']['output'];
  employeeDetail: PayslipAggregationReportEmployeeDetail;
  hours?: Maybe<Scalars['Float']['output']>;
};

/**
 * Wage Detail attached to an period, to be used in breakdownByPayslip Item.
 * This type will be relevant only in case of AggregatedByPeriod
 */
export type PayslipCompensationDetailForPeriod = PayslipCompensationDetail & {
  __typename?: 'PayslipCompensationDetailForPeriod';
  amount: Scalars['Money']['output'];
  hours?: Maybe<Scalars['Float']['output']>;
  periodDetail: PayslipAggregationReportPeriodDetail;
};

/** Enum of the possible correction actions that can be taken on a payslip */
export enum PayslipCorrectionAction {
  /** Represents the action to delete a payslip which effectively removes all traces of the payslip from the system. */
  Delete = 'DELETE',
  /**
   * Represents the action to edit a payslip which may result in changes to editable fields in a payslip
   * (hours, certain employer and employee taxes)
   */
  Edit = 'EDIT',
  /** Represents the action to void a payslip which effectively creates a new payslip to negate the selected payslip */
  Void = 'VOID'
}

/**
 * Eligibility for actions that can be performed on a payslip. These boolean values determine
 * if actions like edit, delete or void are allowed on this payslip.
 */
export type PayslipCorrectionActionsEligibility = {
  __typename?: 'PayslipCorrectionActionsEligibility';
  delete: CorrectionActionEligibilityDetails;
  edit: CorrectionActionEligibilityDetails;
  void: CorrectionActionEligibilityDetails;
};

/** Correction details for a payslip with reason why this correction payslip was created */
export type PayslipCorrectionDetails = {
  __typename?: 'PayslipCorrectionDetails';
  /**
   * The correction reason for a payslip, (e.g. Rollback, TaxAdjustment)
   * describes a source operation why this correction payslip was created
   * (e.g. rolling back another transaction by creating this offsetting transaction
   * or adjusting tax amounts to account for logic / compliance changes or modification in state tax).
   * It will be null for non-adjustment payslips.
   */
  reason: Scalars['String']['output'];
};

/** Payslips can be filtered by correction details */
export type PayslipCorrectionDetailsFilter = {
  reason?: InputMaybe<PayslipCorrectionReasonFilter>;
};

export type PayslipCorrectionFailure = {
  __typename?: 'PayslipCorrectionFailure';
  /**
   * When the intended correction action is unable to be taken on a payslip but an alternate action is possible, this field
   * will be set.
   */
  eligibleAlternateAction?: Maybe<PayslipCorrectionAction>;
  /** The errors list contains unique errors and associated details of an unsuccessful correction action */
  errors?: Maybe<Array<PayslipMutationError>>;
  /** Payslip that was attempted to be corrected */
  payslip: Payslip;
};

/** The correction reason for a Payslip, e.g. Rollback, Tax Adjustment. */
export enum PayslipCorrectionReason {
  Rollback = 'ROLLBACK',
  TaxAdjustment = 'TAX_ADJUSTMENT'
}

/** Payslips can be filtered by correction reason */
export type PayslipCorrectionReasonFilter = {
  eq?: InputMaybe<PayslipCorrectionReason>;
  in?: InputMaybe<Array<PayslipCorrectionReason>>;
  ne?: InputMaybe<PayslipCorrectionReason>;
  nin?: InputMaybe<Array<PayslipCorrectionReason>>;
};

/**
 * Aggregation for a given employee/period returning a flat list of all deduction types. This type is to be used for
 * breakdownByEmployee or breakdownByPeriod.
 */
export type PayslipDeductionAggregationDetail = {
  __typename?: 'PayslipDeductionAggregationDetail';
  totalAmount: Scalars['Money']['output'];
  totalsByDeductionType: Array<PayslipAggregationReportDeduction>;
};

/**
 * Returns a list of employees/periods with their respective total deduction information. And returns a list of lists for
 * each deduction type with its corresponding employee/period. To be used in breakdownByPayslip Item, common for
 * aggregateByEmployee and aggregateByPeriod.
 */
export type PayslipDeductionAggregations = {
  __typename?: 'PayslipDeductionAggregations';
  totals: Array<PayslipDeductionDetail>;
  totalsByDeductionType: Array<PayslipAggregationReportDeductions>;
};

/** Details related to a deduction item shared across reports with varied breakdowns. */
export type PayslipDeductionDetail = {
  amount: Scalars['Money']['output'];
};

/**
 * Deduction Item Detail attached to an employee, to be used in breakdownByPayslip Item.
 * This type will be relevant only in case of AggregatedByEmployee
 */
export type PayslipDeductionForEmployee = PayslipDeductionDetail & {
  __typename?: 'PayslipDeductionForEmployee';
  amount: Scalars['Money']['output'];
  employeeDetail: PayslipAggregationReportEmployeeDetail;
};

/**
 * Deduction Item Detail attached to an period, to be used in breakdownByPayslip items.
 * This type will be relevant only in case of AggregatedByPeriod
 */
export type PayslipDeductionForPeriod = PayslipDeductionDetail & {
  __typename?: 'PayslipDeductionForPeriod';
  amount: Scalars['Money']['output'];
  periodDetail: PayslipAggregationReportPeriodDetail;
};

/** Payslips can be filtered by employee id, employment status and work location id. */
export type PayslipEmployeeFilter = {
  employmentStatus?: InputMaybe<StringFilter>;
  id?: InputMaybe<IdFilter>;
};

/**
 * Aggregation for a given employee/period returning a flat list of all contribution types. This type is to be used for
 * breakdownByEmployee or breakdownByPeriod.
 */
export type PayslipEmployerContributionAggregationDetail = {
  __typename?: 'PayslipEmployerContributionAggregationDetail';
  totalAmount: Scalars['Money']['output'];
  totalsByEmployerContributionType: Array<PayslipAggregationReportEmployerContribution>;
};

/**
 * Returns a list of employees/periods with their respective total contribution information. And returns a list of lists for
 * each contribution type with its corresponding employee/period. To be used in breakdownByPayslip Item, common for
 * aggregateByEmployee and aggregateByPeriod.
 */
export type PayslipEmployerContributionAggregations = {
  __typename?: 'PayslipEmployerContributionAggregations';
  totals?: Maybe<Array<PayslipEmployerContributionDetail>>;
  totalsByEmployerContributionType: Array<PayslipAggregationReportEmployerContributions>;
};

/** Details related to a contribution item shared across reports with varied breakdowns. */
export type PayslipEmployerContributionDetail = {
  amount: Scalars['Money']['output'];
};

/**
 * Contribution Item Detail attached to an employee, to be used in breakdownByPayslip Item.
 * This type will be relevant only in case of AggregatedByEmployee
 */
export type PayslipEmployerContributionForEmployee = PayslipEmployerContributionDetail & {
  __typename?: 'PayslipEmployerContributionForEmployee';
  amount: Scalars['Money']['output'];
  employeeDetail: PayslipAggregationReportEmployeeDetail;
};

/**
 * Contribution Item Detail attached to an period, to be used in breakdownByPayslip items.
 * This type will be relevant only in case of AggregatedByPeriod
 */
export type PayslipEmployerContributionForPeriod = PayslipEmployerContributionDetail & {
  __typename?: 'PayslipEmployerContributionForPeriod';
  amount: Scalars['Money']['output'];
  periodDetail: PayslipAggregationReportPeriodDetail;
};

export type PayslipExportToAccountingError = ExportTransactionsToAccountingError & {
  __typename?: 'PayslipExportToAccountingError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  /** The payslip which failed with this error */
  payslip: Payslip;
  type?: Maybe<Scalars['String']['output']>;
};

/** Metamodel to represent a payslip. */
export type PayslipMetaModel = MetaModel & {
  __typename?: 'PayslipMetaModel';
  applicable: Scalars['Boolean']['output'];
  compensations: Array<PayslipCalculatedCompensationMetaModel>;
  deductions: Array<PayslipCalculatedDeductionMetaModel>;
  employeeTaxes: Array<PayslipCalculatedTaxMetaModel>;
  employerTaxes: Array<PayslipCalculatedTaxMetaModel>;
  label: Scalars['String']['output'];
  memo: MetaString;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type PayslipMutationError = {
  __typename?: 'PayslipMutationError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** The status of a direct deposit distribution of a payslip net pay amount. */
export enum PayslipNetPayDirectDepositStatus {
  Canceled = 'CANCELED',
  Processed = 'PROCESSED',
  Returned = 'RETURNED',
  Scheduled = 'SCHEDULED'
}

/** Payslips can be filtered by net pay direct deposit status */
export type PayslipNetPayDirectDepositStatusFilter = {
  eq?: InputMaybe<PayslipNetPayDirectDepositStatus>;
  in?: InputMaybe<Array<PayslipNetPayDirectDepositStatus>>;
};

/** Details on how a portion of the Payslip's net pay is distributed */
export type PayslipNetPayDistribution = {
  amount: Scalars['Money']['output'];
  /**
   * The destination type of this distribution eg. Check, DirectDeposit.
   * There can only be either check or direct deposit.
   */
  method: Scalars['String']['output'];
};

/** Payslip net pay distribution details for check */
export type PayslipNetPayDistributionCheck = PayslipNetPayDistribution & {
  __typename?: 'PayslipNetPayDistributionCheck';
  amount: Scalars['Money']['output'];
  checkNumber?: Maybe<Scalars['Int']['output']>;
  method: Scalars['String']['output'];
};

export type PayslipNetPayDistributionCheckInput = {
  checkNumber?: InputMaybe<Scalars['Int']['input']>;
};

/** Payslip net pay distribution details for direct deposit */
export type PayslipNetPayDistributionDirectDeposit = PayslipNetPayDistribution & {
  __typename?: 'PayslipNetPayDistributionDirectDeposit';
  amount: Scalars['Money']['output'];
  directDepositStatus: PayslipNetPayDirectDepositStatus;
  /** Direct deposit date and time when payment starts to be processed */
  initiationDate?: Maybe<Scalars['DateTime']['output']>;
  method: Scalars['String']['output'];
  /** Direct deposit date and time when payment is completed */
  settlementDate?: Maybe<Scalars['DateTime']['output']>;
  status: PayslipNetPayDirectDepositStatus;
};

export type PayslipNetPayDistributionInput = {
  payslipNetPayDistributionCheck?: InputMaybe<PayslipNetPayDistributionCheckInput>;
};

/**
 * Filtering options for Payslip pay date. Allows choosing between specifying a date range or using a predefined preset.
 * Must specify one and only one of the choices.
 */
export type PayslipPayDateFilter = {
  dateRange?: InputMaybe<DateFilter>;
  preset?: InputMaybe<PayslipPayDateFilterPreset>;
};

/** Special predefined date ranges to be used when filtering payslips by pay date. */
export enum PayslipPayDateFilterPreset {
  /** Latest pay date for which a payslip has been created for an employee */
  LatestEmployeePayDate = 'LATEST_EMPLOYEE_PAY_DATE',
  /** Latest pay date for which a payslip has been created. */
  LatestPayDate = 'LATEST_PAY_DATE'
}

export type PayslipPayPeriodFilter = {
  dateRange: DateFilter;
};

/** Period detail for a payslip with begin and end dates */
export type PayslipPeriod = Common_DatePeriod & {
  __typename?: 'PayslipPeriod';
  beginDate: Scalars['Date']['output'];
  endDate: Scalars['Date']['output'];
};

export type PayslipPreferences = {
  __typename?: 'PayslipPreferences';
  /** Employer preferences for printing payslips. */
  printPreference: PrintPreference;
};

export enum PayslipPresetFilter {
  /** Bonus paycheck after pay day. */
  AllPayslipsPaidBonus = 'ALL_PAYSLIPS_PAID_BONUS',
  /** filter to return basic paychecks details (without all the details for e.g. tax and deduction breakdowns) */
  BasicPayslipDetails = 'BASIC_PAYSLIP_DETAILS'
}

export type PayslipPrintPreferencesInput = {
  /** Alignment preferences to be updated for the payslip to be printed */
  alignment?: InputMaybe<PrintAlignmentInput>;
  /**
   * Config to configure print preferences for payslip
   * For e.g. `showAccruedVacationHours` used to configure print preferences to include
   * vacation hours as a part of payslip
   */
  configurations?: InputMaybe<Array<VariableTypeFieldInput>>;
  /** Base64-encoded PNG signature image to be printed on paychecks */
  employerSignatureLink?: InputMaybe<Scalars['String']['input']>;
  /** Print preference to be updated for the payslip */
  preference?: InputMaybe<VariableEnumFieldInput>;
};

/**
 * Aggregation for a given employee/period returning a flat list of all tax types. This type is to be used for
 * breakdownByEmployee or breakdownByPeriod.
 */
export type PayslipTaxAggregationDetail = {
  __typename?: 'PayslipTaxAggregationDetail';
  totalAmount: Scalars['Money']['output'];
  totalsByTaxType: Array<PayslipAggregationReportTax>;
};

/**
 * Returns a list of employees/periods with their respective total tax information. And returns a list of lists for
 * each tax type with its corresponding employee/period. To be used in breakdownByPayslip Item, common for
 * aggregateByEmployee and aggregateByPeriod.
 */
export type PayslipTaxAggregations = {
  __typename?: 'PayslipTaxAggregations';
  totals: Array<PayslipTaxDetail>;
  totalsByTaxType: Array<PayslipAggregationReportTaxes>;
};

/** Details related to a tax item shared across reports with varied breakdowns. */
export type PayslipTaxDetail = {
  amount: Scalars['Money']['output'];
};

/**
 * Tax Item Detail attached to an employee, to be used in breakdownByPayslip Item.
 * This type will be relevant only in case of AggregatedByEmployee
 */
export type PayslipTaxDetailForEmployee = PayslipTaxDetail & {
  __typename?: 'PayslipTaxDetailForEmployee';
  amount: Scalars['Money']['output'];
  employeeDetail: PayslipAggregationReportEmployeeDetail;
};

/**
 * Tax Item Detail attached to an period, to be used in breakdownByPayslip items.
 * This type will be relevant only in case of AggregatedByPeriod
 */
export type PayslipTaxDetailForPeriod = PayslipTaxDetail & {
  __typename?: 'PayslipTaxDetailForPeriod';
  amount: Scalars['Money']['output'];
  periodDetail: PayslipAggregationReportPeriodDetail;
};

/** The type of a Payslip, e.g. Regular, Bonus, Commission, Fringe or Adjustment. */
export enum PayslipType {
  Adjustment = 'ADJUSTMENT',
  Bonus = 'BONUS',
  Commission = 'COMMISSION',
  Fringe = 'FRINGE',
  Regular = 'REGULAR'
}

/** Payslips can be filtered by type */
export type PayslipTypeFilter = {
  eq?: InputMaybe<PayslipType>;
  in?: InputMaybe<Array<PayslipType>>;
  ne?: InputMaybe<PayslipType>;
  nin?: InputMaybe<Array<PayslipType>>;
};

export type PayslipVoidSuccess = {
  __typename?: 'PayslipVoidSuccess';
  /** The payslip that was voided as a result of the mutation's success */
  payslip: Payslip;
};

/** Payslips can be filtered by work location id */
export type PayslipWorkLocationFilter = {
  id: IdFilter;
};

/**
 * Filtering options for payslips for an employer. Currently payslips can be filtered by employees' id, status,
 * payslip type, correction reason, work location, pay schedule, and also pay date.
 */
export type PayslipsFilter = {
  correctionDetails?: InputMaybe<PayslipCorrectionDetailsFilter>;
  employee?: InputMaybe<PayslipEmployeeFilter>;
  exportedToExternal?: InputMaybe<BooleanFilter>;
  payDate?: InputMaybe<PayslipPayDateFilter>;
  type?: InputMaybe<PayslipTypeFilter>;
};

/** Paycheck List Report with report data rendering detail */
export type PayslipsListReport = {
  __typename?: 'PayslipsListReport';
  renderings?: Maybe<PayslipsListReportRenderings>;
};

/** Optional fields can be excluded for payslip report excel rendering, fields are refering to payslip schema type */
export enum PayslipsListReportExcelOptionalField {
  GrosspayCurrentamount = 'GROSSPAY__CURRENTAMOUNT',
  NetpaydistributionsChecknumber = 'NETPAYDISTRIBUTIONS__CHECKNUMBER',
  NetpaydistributionsDirectdepositstatus = 'NETPAYDISTRIBUTIONS__DIRECTDEPOSITSTATUS',
  NetpaydistributionsMethod = 'NETPAYDISTRIBUTIONS__METHOD'
}

/** Input fields for payslip report excel rendering */
export type PayslipsListReportExcelRenderInput = {
  /** Specifies the optional fields that can additionally be excluded in the excel file rendering, fields are refering to payslip schema type */
  excludedFields?: InputMaybe<Array<PayslipsListReportExcelOptionalField>>;
  orderBy?: InputMaybe<Array<EmployerPayslipsOrderBy>>;
};

/** Input filter for payslip report */
export type PayslipsListReportInput = {
  filterBy: PayslipsFilter;
};

/** Optional fields can be excluded for payslip report pdf rendering, fields are refering to payslip schema type */
export enum PayslipsListReportPdfOptionalField {
  GrosspayCurrentamount = 'GROSSPAY__CURRENTAMOUNT',
  NetpaydistributionsChecknumber = 'NETPAYDISTRIBUTIONS__CHECKNUMBER',
  NetpaydistributionsDirectdepositstatus = 'NETPAYDISTRIBUTIONS__DIRECTDEPOSITSTATUS',
  NetpaydistributionsMethod = 'NETPAYDISTRIBUTIONS__METHOD'
}

/** Input fields for payslip report pdf rendering */
export type PayslipsListReportPdfRenderInput = {
  /** Specifies the optional fields that can additionally be excluded in the pdf file rendering, fields are refering to payslip schema type */
  excludedFields?: InputMaybe<Array<PayslipsListReportPdfOptionalField>>;
  /** Specifies the fields with order for sorting the records in the pdf document */
  orderBy?: InputMaybe<Array<EmployerPayslipsOrderBy>>;
  /** Specifies the page orientation for the pdf document. */
  pageOrientation: PageOrientation;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader: Scalars['Boolean']['input'];
  /** Specifies if the smart page break will be enabled or not. */
  smartPageBreak: Scalars['Boolean']['input'];
};

/**
 * The report renderind types are not specified as mutations because these do not make any DB change
 * and just render the report in the required format by using the inputs provided.
 * Provides details for report rendering, e.g. excel, pdf
 */
export type PayslipsListReportRenderings = {
  __typename?: 'PayslipsListReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/**
 * The report renderind types are not specified as mutations because these do not make any DB change
 * and just render the report in the required format by using the inputs provided.
 * Provides details for report rendering, e.g. excel, pdf
 */
export type PayslipsListReportRenderingsExcelArgs = {
  input?: InputMaybe<PayslipsListReportExcelRenderInput>;
};


/**
 * The report renderind types are not specified as mutations because these do not make any DB change
 * and just render the report in the required format by using the inputs provided.
 * Provides details for report rendering, e.g. excel, pdf
 */
export type PayslipsListReportRenderingsPdfArgs = {
  input?: InputMaybe<PayslipsListReportPdfRenderInput>;
};

export type PensionEmployeeConnection = {
  __typename?: 'PensionEmployeeConnection';
  edges?: Maybe<Array<Maybe<EmployeeEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** Defines the enrollment related fields for pension */
export type PensionEnrollment = Node & {
  __typename?: 'PensionEnrollment';
  /** Flag to determine if the user gave consent to compute the staging date */
  allowComputingStagingDate: Scalars['Boolean']['output'];
  id: Scalars['ID']['output'];
  /** Defines the details for pension re-enrollment */
  pensionReenrollment: PensionReenrollment;
  /** Defines the duties start date for a company */
  stagingDate?: Maybe<Scalars['Date']['output']>;
};

export type PensionEnrollmentError = {
  __typename?: 'PensionEnrollmentError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/**
 * A pension an employer offers to employees
 * Examples includes defined contribution schemes such as 401(k) as well as defined benefit pensions
 */
export type PensionPolicy = DeductionPolicy & Node & {
  __typename?: 'PensionPolicy';
  /** Whether this policy is currently active */
  active: Scalars['Boolean']['output'];
  /** Determines this deduction category */
  category: Scalars['String']['output'];
  /** Provides the list of employees related to the current pension */
  employees?: Maybe<PensionEmployeeConnection>;
  id: Scalars['ID']['output'];
  /** Determines if this is the default pensionPolicy */
  isDefault: Scalars['Boolean']['output'];
  /** A deduction name/description */
  name: Scalars['String']['output'];
  /** Defines attributes to setup specific characteristics of pensions in different jurisdictions */
  pensionSetup?: Maybe<PensionSetup>;
  /** Name of the Pension provider (e.g. NEST, AVIVA) */
  providerName?: Maybe<Scalars['String']['output']>;
  /** Defines the Provider Reference ID which is a unique identifier given to the employer by the provider */
  providerReferenceId?: Maybe<Scalars['String']['output']>;
  /** Defines the exact types (including taxability) that are supported by region (e.g. CUS_DED_401K_PRE_TAX) */
  statutoryType: Scalars['String']['output'];
  /** SubCategory of this deduction */
  subCategory: Scalars['String']['output'];
  /** Indicates deduction is a pre-tax or post-tax */
  taxOption: TaxOption;
};


/**
 * A pension an employer offers to employees
 * Examples includes defined contribution schemes such as 401(k) as well as defined benefit pensions
 */
export type PensionPolicyCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/**
 * A pension an employer offers to employees
 * Examples includes defined contribution schemes such as 401(k) as well as defined benefit pensions
 */
export type PensionPolicyEmployeesArgs = {
  filterBy?: InputMaybe<PayrollPolicyEmployeesFilter>;
  orderBy?: InputMaybe<Array<EmployeesWithContributionOrderBy>>;
  pagination?: InputMaybe<PaginationInput>;
};


/**
 * A pension an employer offers to employees
 * Examples includes defined contribution schemes such as 401(k) as well as defined benefit pensions
 */
export type PensionPolicyProviderNameArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/**
 * A pension an employer offers to employees
 * Examples includes defined contribution schemes such as 401(k) as well as defined benefit pensions
 */
export type PensionPolicyStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/**
 * A pension an employer offers to employees
 * Examples includes defined contribution schemes such as 401(k) as well as defined benefit pensions
 */
export type PensionPolicySubCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** Metamodel for all types for PensionPolicy */
export type PensionPolicyMetaModel = DeductionPolicyMetaModelV2 & MetaModel & {
  __typename?: 'PensionPolicyMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** This deduction is only applicable for the given category/subcategory */
  categoryDetails: MetaDeductionPolicyApplicable;
  label: Scalars['String']['output'];
  /** The metamodel for deduction name/description */
  name: MetaString;
  /** The metamodel for pension setup */
  pensionSetup: PensionSetupMetaModel;
  /** The metamodel for name of the Pension provider */
  providerName: MetaEnum;
  /** The metamodel for provider reference ID */
  providerReferenceId: MetaString;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** The metamodel for statutoryType */
  statutoryType: MetaEnum;
  typeRef: Scalars['String']['output'];
};

/**
 * A pension provider through which an employer offers pension to employees
 * Examples includes NEST, Aviva, Empower etc
 */
export type PensionProviderSetup = Node & ProviderAgencySetup & {
  __typename?: 'PensionProviderSetup';
  /** Pension provider credentials for integration */
  agencyCredential?: Maybe<AgencyCredential>;
  /** Is the platform responsible for automatically making this filing. False indicates that this filing will be made manually by the user. */
  autoSyncEnabled: Scalars['Boolean']['output'];
  /** Is integration enabled */
  enabled: Scalars['Boolean']['output'];
  /** Provider id */
  id: Scalars['ID']['output'];
  /** A pension provider name/description */
  name: Scalars['String']['output'];
};

/** Defines the re-enrollment releated fields for pension */
export type PensionReenrollment = {
  __typename?: 'PensionReenrollment';
  /** Defines the pension re-enrollment date */
  effectiveDate?: Maybe<Scalars['Date']['output']>;
  /** Defines the automatic pension re-enrollment enabled flag */
  isAutoEnabled: Scalars['Boolean']['output'];
  /** Determines if the company is in the re-enrollment period */
  isReenrollmentPeriod: Scalars['Boolean']['output'];
};

export type PensionReenrollmentInput = {
  effectiveDate?: InputMaybe<Scalars['Date']['input']>;
  isAutoEnabled: Scalars['Boolean']['input'];
};

/** A pension setup type comprises of attributes related to pension policy setup */
export type PensionSetup = {
  __typename?: 'PensionSetup';
  /** Group name of the pension policy */
  groupName?: Maybe<Scalars['String']['output']>;
  /** Taxation method of the pension policy */
  taxationMethod: Scalars['String']['output'];
  /** Determines if earnings threshold is used for calculating pension */
  useEarningsThreshold: Scalars['Boolean']['output'];
};


/** A pension setup type comprises of attributes related to pension policy setup */
export type PensionSetupTaxationMethodArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** A pension setup input comprises of attributes related to pension policy setup */
export type PensionSetupInput = {
  /** Group name of the pension policy */
  groupName?: InputMaybe<Scalars['String']['input']>;
  /** Taxation method of the pension policy */
  taxationMethod: Scalars['String']['input'];
  /** Determines if earnings threshold is used for calculating pension */
  useEarningsThreshold: Scalars['Boolean']['input'];
};

/** Metamodel for Pension Setup */
export type PensionSetupMetaModel = MetaModel & {
  __typename?: 'PensionSetupMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** The metamodel for group name */
  groupName: MetaString;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** The metamodel for taxation method */
  taxationMethod: MetaEnum;
  typeRef: Scalars['String']['output'];
};

export type PensionsReport = {
  __typename?: 'PensionsReport';
  /** List of deduction/contribution details aggregated by a particular pension type */
  aggregatedByPension?: Maybe<Array<PayrollReportAggregationByDeduction>>;
  /** Pensions report with report data rendering detail */
  renderings?: Maybe<PensionsReportRenderings>;
};

export type PensionsReportEmployeeFilter = {
  employmentStatus?: InputMaybe<EmploymentStatusFilter>;
  id?: InputMaybe<IdFilter>;
};

export type PensionsReportInput = {
  employee?: InputMaybe<PensionsReportEmployeeFilter>;
  payDate: PayslipPayDateFilter;
};

/** Input fields for pensions report pdf rendering */
export type PensionsReportPdfRenderInput = {
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Returns renderings such as excel, pdf for pensions report */
export type PensionsReportRenderings = {
  __typename?: 'PensionsReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/** Returns renderings such as excel, pdf for pensions report */
export type PensionsReportRenderingsPdfArgs = {
  input?: InputMaybe<PensionsReportPdfRenderInput>;
};

export enum PeriodAggregationFrequency {
  Biweekly = 'BIWEEKLY',
  Monthly = 'MONTHLY',
  Quarterly = 'QUARTERLY',
  Weekly = 'WEEKLY',
  Yearly = 'YEARLY'
}

/** Interface representing a date range */
export type PeriodicDate = {
  beginDate?: Maybe<Scalars['Date']['output']>;
  endDate?: Maybe<Scalars['Date']['output']>;
};

/** Define the structure for the Phone Number Object */
export type PhoneNumber = {
  __typename?: 'PhoneNumber';
  /** Combines area code and number. Extension is not included. */
  originalNumber?: Maybe<Scalars['String']['output']>;
  parsedNumber?: Maybe<ParsedPhoneNumber>;
  usageType?: Maybe<Scalars['String']['output']>;
};

export type PhoneNumberInput = {
  originalNumber?: InputMaybe<Scalars['String']['input']>;
  parsedNumber?: InputMaybe<ParsedPhoneNumberInput>;
  usageType?: InputMaybe<PhoneNumberUsageType>;
};

export type PhoneNumberMetaModel = MetaModel & {
  __typename?: 'PhoneNumberMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  /** The metamodel for original number */
  originalNumber: MetaString;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
  /** The metamodel for usage type */
  usageType: MetaEnum;
};

export enum PhoneNumberUsageType {
  Home = 'HOME',
  Mobile = 'MOBILE',
  Work = 'WORK'
}

/** Represents a picture document being stored in the system */
export type Picture = Document & {
  __typename?: 'Picture';
  id: Scalars['ID']['output'];
  /** Identifies if given picture is to used for primary display */
  isPrimary: Scalars['Boolean']['output'];
  /** Identifies the type of the picture. Eg: PROFILE_PICTURE */
  type: Scalars['String']['output'];
};

/** Input type for getting list of applicable Political Subdivision Codes for a given address */
export type PoliticalSubdivisionCodesInput = {
  addressComponents: Array<VariableStringFieldInput>;
};

export type PrefillDimensionDefaultsInput = {
  parameters: PrefillDimensionParametersInput;
  promptId: Scalars['String']['input'];
  promptVersion: Scalars['Int']['input'];
  spec?: InputMaybe<Scalars['String']['input']>;
};

export type PrefillDimensionDefaultsPayload = {
  __typename?: 'PrefillDimensionDefaultsPayload';
  error?: Maybe<Scalars['String']['output']>;
  response?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type PrefillDimensionParametersInput = {
  dimensionName: Scalars['String']['input'];
  dimensionValues: Scalars['String']['input'];
  employees: Scalars['String']['input'];
};

/** Defines information of a preparer like their name, contact etc. */
export type Preparer = {
  name: Scalars['String']['output'];
};

/** Includes information of a preparer firm like firm name etc. */
export type PreparerFirmInformation = {
  __typename?: 'PreparerFirmInformation';
  /** Preparer Firm's Name */
  name: Scalars['String']['output'];
  /** Preparer Firm's Tax Identifier (Firm's EIN etc.) */
  taxIdentifier: TaxIdentifier;
};

/** Input for updating preparer firm information */
export type PreparerFirmInformationInput = {
  /** Name of firm */
  name: Scalars['String']['input'];
  /** Firm tax identifier */
  taxIdentifier: Scalars['String']['input'];
};

/** Includes information of a preparer like their name, contact etc. */
export type PreparerInformation = Preparer & {
  __typename?: 'PreparerInformation';
  /** Prepare Address (Address, city, state, zip code) */
  address: Common_Address;
  /** Preparer Email Address */
  email: EmailAddress;
  /** Preparer Name */
  name: Scalars['String']['output'];
  /** Preparer Phone Number */
  phone: PhoneNumber;
  /** Preparer Firm Information - This will be optional when selfEmployed is true */
  preparerFirmInformation?: Maybe<PreparerFirmInformation>;
  /** Preparer is self-employed */
  selfEmployed: Scalars['Boolean']['output'];
  /**
   * Preparer Tax Identification Number (PTIN) (Example: P12345678)
   * Anyone being paid to prepare a tax return must have a Preparer Tax Identification Number (PTIN).
   */
  taxIdentifier: TaxIdentifier;
};

/** Input for updating preparer */
export type PreparerInput = {
  address: Common_AddressInput;
  email: EmailAddressInput;
  name: Scalars['String']['input'];
  phone: PhoneNumberInput;
  preparerFirmInformation?: InputMaybe<PreparerFirmInformationInput>;
  selfEmployed: Scalars['Boolean']['input'];
  taxIdentifier: Scalars['String']['input'];
};

export type PreviewInsightParametersInput = {
  insightPayloadJson: Scalars['String']['input'];
  languagePreference?: InputMaybe<Scalars['String']['input']>;
  spike: Scalars['String']['input'];
  totalCostDiffAbs: Scalars['String']['input'];
  totalCostDiffPercent: Scalars['String']['input'];
};

export type PreviewInsightRunPayrollInput = {
  parameters: PreviewInsightParametersInput;
  promptId: Scalars['String']['input'];
  promptVersion: Scalars['Int']['input'];
  spec?: InputMaybe<Scalars['String']['input']>;
};

export type PreviewInsightRunPayrollPayload = {
  __typename?: 'PreviewInsightRunPayrollPayload';
  error?: Maybe<Scalars['String']['output']>;
  response?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

/** The primary officer of a company, usually the highest ranking officer at that company */
export type PrincipalOfficer = {
  __typename?: 'PrincipalOfficer';
  /** The principal officer's home or business address */
  address?: Maybe<Common_Address>;
  /** The principal officer's date of birth */
  dateOfBirth?: Maybe<Scalars['Date']['output']>;
  /** The principal officer's first and last name */
  name?: Maybe<Scalars['String']['output']>;
  /** The principal officer's SSN or other taxIdentifer */
  taxIdentifier?: Maybe<TaxIdentifier>;
  /** The principal officer's title (e.g. Chairman of the Board, President) */
  title?: Maybe<Scalars['String']['output']>;
};

export type PrincipalOfficerInput = {
  title?: InputMaybe<Scalars['String']['input']>;
};

export type PrincipalOfficerMetaModel = MetaModel & {
  __typename?: 'PrincipalOfficerMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** The principal officer's title (e.g. Chairman of the Board, President) */
  title: MetaEnum;
  typeRef: Scalars['String']['output'];
};

export type PrintAlignment = {
  __typename?: 'PrintAlignment';
  /** X co-ordinate setting for print alignment offset */
  x: Scalars['String']['output'];
  /** Y co-ordinate setting for print alignment offset */
  y: Scalars['String']['output'];
};

export type PrintAlignmentInput = {
  /** X co-ordinate setting to be updated for print alignment offset */
  x: Scalars['String']['input'];
  /** Y co-ordinate setting to be update for print alignment offset */
  y: Scalars['String']['input'];
};

export type PrintPreference = {
  __typename?: 'PrintPreference';
  /** Print alignment preferences for payslip */
  alignment: PrintAlignment;
  /**
   * Config to configure print preferences for payslip
   * For e.g. `showAccruedVacationHours` used to configure print preferences to include
   * vacation hours as a part of payslip
   */
  configurations: Array<VariableTypeField>;
  /** Base64-encoded PNG signature image to be printed on paychecks */
  employerSignatureLink?: Maybe<Scalars['String']['output']>;
  metaModel: PrintPreferenceMetaModel;
  /** Enum specifying the payslip printing preference. For example, this could be PLAIN_PAPER or PREPRINTED_CHECK_STOCK. */
  preference: VariableEnumField;
};

/** Metamodel to represent print preference */
export type PrintPreferenceMetaModel = MetaModel & {
  __typename?: 'PrintPreferenceMetaModel';
  applicable: Scalars['Boolean']['output'];
  configurations: Array<MetaVariableTypeField>;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Print status of a tax filing */
export enum PrintStatus {
  Pending = 'PENDING',
  Printed = 'PRINTED',
  PrintRequested = 'PRINT_REQUESTED'
}

/**
 * Payroll information for an employee paid within the most recent year by the same company when company is switching
 * from a different product
 */
export type PriorPayroll = {
  __typename?: 'PriorPayroll';
  /** Employee's prior Payroll information for current and previous date periods of the specified tax year. */
  periods: Array<PriorPayrollPeriod>;
  /**
   * Read-only summary of the employee's year-to-date pay information for all compensations paid and withheld taxes,
   * computed based on closed quarter and YTD information
   */
  summary: PriorPayrollSummary;
  /** The year for which the prior payroll is recorded */
  year: Scalars['Int']['output'];
};

/** Represents a specific compensation type paid to the employee */
export type PriorPayrollCompensation = {
  __typename?: 'PriorPayrollCompensation';
  /** Includes current and total amounts for a compensation */
  accumulationAmount?: Maybe<CalculatedCompensationAccumulationAmount>;
  /** Compensation of the employee */
  employeeCompensation: EmployeeCompensation;
};

/** Input type for compensation details for prior payroll totals */
export type PriorPayrollCompensationInput = {
  /** Compensation of the employee */
  employeeCompensationId: Scalars['ID']['input'];
  /** Represents the amount of compensation paid to an employee */
  toDateAmount?: InputMaybe<Array<PriorPayrollToDateAmountInput>>;
};

/** Input type for the date period between a start and end date */
export type PriorPayrollDatePeriodInput = {
  /** Begin date for the date period */
  beginDate: Scalars['Date']['input'];
  /** end date for the date period */
  endDate?: InputMaybe<Scalars['Date']['input']>;
};

/** Represents a specific deduction type held / paid */
export type PriorPayrollDeduction = {
  __typename?: 'PriorPayrollDeduction';
  /** Employee's current and total contribution amount to a deduction */
  employeeContributionAccumulationAmount?: Maybe<EmployeeContributionAccumulationAmount>;
  /** Deduction of the employee */
  employeeDeduction: EmployeeDeduction;
  /** Employer's current and total contribution amount to a deduction */
  employerContributionAccumulationAmount?: Maybe<EmployerContributionAccumulationAmount>;
};

/** Input type for deduction details for prior payroll totals */
export type PriorPayrollDeductionInput = {
  /** Represents the amount contributed by the employee towards a deduction */
  employeeContributionToDateAmount?: InputMaybe<Array<PriorPayrollToDateAmountInput>>;
  /** Deduction of the employee */
  employeeDeductionId: Scalars['ID']['input'];
  /** Represents the amount contributed by the employer towards a deduction */
  employerContributionToDateAmount?: InputMaybe<Array<PriorPayrollToDateAmountInput>>;
};

/**
 * Meta model for payroll information of an employee paid within the most recent year by the same company when company is switching
 * from a different product
 */
export type PriorPayrollMetaModel = MetaModel & {
  __typename?: 'PriorPayrollMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  /** Employee's prior Payroll information for current and previous date periods of the specified tax year. */
  periods: Array<PriorPayrollPeriodMetaModel>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Error object with details for updating prior payroll totals */
export type PriorPayrollMutationError = {
  __typename?: 'PriorPayrollMutationError';
  /** Error code for mutation */
  code: Scalars['String']['output'];
  /** Identifies which period had the problem if the error is period-specific */
  datePeriod?: Maybe<DatePeriod>;
  /** Detailed description of the error for a specific fieldId and datePeriod */
  detailedMessage?: Maybe<Scalars['String']['output']>;
  /** Employee Id */
  employeeId?: Maybe<Scalars['ID']['output']>;
  /** Identifies which field had the problem if the error is field-specific */
  fieldId?: Maybe<Scalars['ID']['output']>;
  /** Error message for the mutation */
  message: Scalars['String']['output'];
  /** Type of error for the mutation */
  type?: Maybe<Scalars['String']['output']>;
};

/** Specifies how much the employee was paid in the given date period */
export type PriorPayrollPeriod = {
  __typename?: 'PriorPayrollPeriod';
  /** Identifies the date range for this period */
  datePeriod: DatePeriod;
  /** Specifies if the employee was paid in the given date period */
  employeePaidStatus: EmployeePaidStatus;
  /** Summary totals for the employee compensation and deductions in the given period */
  summary?: Maybe<PriorPayrollPeriodSummary>;
  /**
   * Represents the amount of time worked in the given period
   * (Ex: Number of WEEKS worked in the CURRENT QUARTER)
   */
  timeWorkedInPeriod?: Maybe<TimeWorkedInPeriod>;
  /**
   * The breakdown totals of prior payroll information collected this period for the employee's
   * compensations, deductions and withheld taxes.
   */
  totals: PriorPayrollPeriodTotals;
};

/** Evaluated totals based on the employee's prior payroll deduction totals in the given date period */
export type PriorPayrollPeriodDeductionSummary = {
  __typename?: 'PriorPayrollPeriodDeductionSummary';
  /** Totals for the employee pre tax deductions computed in the given period */
  preTaxTotal: Scalars['Money']['output'];
};

/** Input type for prior payroll details collected for a given date period */
export type PriorPayrollPeriodInput = {
  /** Date period for prior payroll period totals */
  datePeriod: PriorPayrollDatePeriodInput;
  /** Specifies if the employee was paid in the given date period */
  employeePaidStatus: EmployeePaidStatus;
  /** Represents the amount of time worked in the given period */
  timeWorkedInPeriod?: InputMaybe<Scalars['Int']['input']>;
  /**
   * The breakdown totals of prior payroll information collected this period for the employee's
   * compensations, deductions and withheld taxes.
   */
  totals: PriorPayrollPeriodTotalsInput;
};

/** Meta model for employee's prior Payroll information for current and previous date periods of the specified tax year. */
export type PriorPayrollPeriodMetaModel = MetaModel & {
  __typename?: 'PriorPayrollPeriodMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** Identifies the date range for this period */
  datePeriod: DatePeriod;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /**
   * Represents the amount of time worked in the given period
   * (Ex: Number of WEEKS worked in the CURRENT QUARTER)
   */
  timeWorkedInPeriod: TimeWorkedInPeriodMetaModel;
  /**
   * The breakdown totals of prior payroll information collected this period for the employee's
   * compensations, deductions and withheld taxes.
   */
  totals: PriorPayrollPeriodTotalsMetaModel;
  typeRef: Scalars['String']['output'];
};

/**
 * Evaluated summary based on the employee's prior payroll totals for given
 * compensations and deductions in the given date period
 */
export type PriorPayrollPeriodSummary = {
  __typename?: 'PriorPayrollPeriodSummary';
  /** Totals for the employee compensation computed in the given period */
  compensation: Scalars['Money']['output'];
  /** Totals for the employee deductions computed in the given period */
  deduction: PriorPayrollPeriodDeductionSummary;
  /** Evaluated by subtracting pre-tax deductions from total compensations */
  taxablePay: Scalars['Money']['output'];
};

/**
 * The breakdown of totals for an individual period's prior payroll collected per employee for
 * all compensation, deductions and withheld taxes.
 */
export type PriorPayrollPeriodTotals = {
  __typename?: 'PriorPayrollPeriodTotals';
  /** Compensation totals for the employee in the given period */
  compensations: Array<PriorPayrollCompensation>;
  /** Deduction totals collected for the employee and employer in the given period */
  deductions: Array<PriorPayrollDeduction>;
  /** Employee tax totals withheld for the given period */
  employeeTaxes: Array<PriorPayrollTax>;
  /** Employer tax totals withheld for the given period */
  employerTaxes: Array<PriorPayrollTax>;
  /**
   * The net pay calculated using the values of the totals entered in the
   * employee's prior payroll in the given date period
   */
  netPay?: Maybe<Scalars['Money']['output']>;
};

/**
 * Input type for all of the prior payroll totals collected per employee for
 * compensations, deductions and withheld taxes.
 */
export type PriorPayrollPeriodTotalsInput = {
  /** Compensation totals for the employee in the given period */
  compensations: Array<PriorPayrollCompensationInput>;
  /** Deduction totals for the employee and employer in the given period */
  deductions: Array<PriorPayrollDeductionInput>;
  /** Employee tax totals withheld for the given period */
  employeeTaxes: Array<PriorPayrollTaxInput>;
  /** Employer tax totals withheld for the given period */
  employerTaxes: Array<PriorPayrollTaxInput>;
  /**
   * The net pay entered by the user or calculated using the values of the totals entered in the
   * employee's prior payroll in the given date period
   */
  netPay?: InputMaybe<Scalars['Money']['input']>;
};

export type PriorPayrollPeriodTotalsMetaModel = {
  __typename?: 'PriorPayrollPeriodTotalsMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** Employee tax totals withheld for the given period */
  employeeTaxes: Array<PriorPayrollTaxMetaModel>;
  /** Employer tax totals withheld for the given period */
  employerTaxes: Array<PriorPayrollTaxMetaModel>;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type PriorPayrollRunFilter = {
  /** Filters that can be applied to payDate */
  payDate?: InputMaybe<Scalars['Date']['input']>;
};

/**
 * Summary of the employee's year-to-date pay information for all compensations paid and withheld taxes,
 * computed based on closed quarter and YTD information
 */
export type PriorPayrollSummary = {
  __typename?: 'PriorPayrollSummary';
  /** Net amount of all compensations paid to employee year-to-date (YTD) */
  netAmountPaid: Scalars['Money']['output'];
  /** The Status of employee pay history state */
  status: EmployeeHistoryStatus;
  /** Total amount of all compensations paid to employee year-to-date (YTD) */
  totalAmount: Scalars['Money']['output'];
  /** Total amount of all taxes deducted from employee's pay year-to-date (YTD) */
  totalTaxesDeducted: Scalars['Money']['output'];
};

/** Represents a tax type for an employee's historic paycheck */
export type PriorPayrollTax = {
  __typename?: 'PriorPayrollTax';
  /** Includes current and total amounts for a tax */
  accumulationAmount?: Maybe<TaxAccumulationAmount>;
  /** Includes particular tax related information */
  rates: Array<PriorPayrollTaxRate>;
  /** Defines the exact tax type */
  statutoryType: Scalars['String']['output'];
  /**
   * Arbitrary tax breakdown information defined and assigned by the jurisdiction
   * Ex: National Insurance Income subject to tax or NI Letter.
   */
  taxBreakdownDetails: Array<VariableTypeField>;
};


/** Represents a tax type for an employee's historic paycheck */
export type PriorPayrollTaxStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** Input type for tax information for an employee's historic paycheck */
export type PriorPayrollTaxInput = {
  /** Defines the exact tax type */
  statutoryType: Scalars['String']['input'];
  /**
   * Arbitrary tax breakdown information defined and assigned by the jurisdiction
   * Ex: National Insurance Income subject to tax or NI Letter.
   */
  taxBreakdownDetails?: InputMaybe<Array<VariableTypeFieldInput>>;
  /** Represents the amount paid towards tax */
  toDateAmount?: InputMaybe<Array<PriorPayrollToDateAmountInput>>;
};

export type PriorPayrollTaxMetaModel = {
  __typename?: 'PriorPayrollTaxMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  /** Includes particular tax related information */
  rates: Array<PriorPayrollTaxRateMetaModel>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** Defines the exact tax type */
  statutoryType: Scalars['String']['output'];
  /**
   * Arbitrary tax breakdown information defined and assigned by the jurisdiction
   * Ex: National Insurance Income subject to tax or NI Letter.
   */
  taxBreakdownDetails: Array<MetaVariableTypeField>;
  typeRef: Scalars['String']['output'];
};

/** Represents a tax breakdown information for an employee's historical paycheck */
export type PriorPayrollTaxRate = {
  __typename?: 'PriorPayrollTaxRate';
  /** Includes amount after the tax rate has been applied */
  amount: Scalars['Money']['output'];
  /** Includes date on which this tax rate configuration will become active/is active from */
  effectiveDate: Scalars['Date']['output'];
  /** Includes tax rate for the tax type */
  rate: Rate;
};

/** Represents a tax breakdown information for an employee's historical paycheck */
export type PriorPayrollTaxRateMetaModel = {
  __typename?: 'PriorPayrollTaxRateMetaModel';
  /** Includes pre-tax wage limit on which the tax rate is applicable */
  amount: MetaMoney;
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  /** Includes rate for the tax type */
  rate: Rate;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Input type for the to date amount for each total type in a specific date period */
export type PriorPayrollToDateAmountInput = {
  /** To-date monetary amount for time period */
  amount: Scalars['Money']['input'];
  /** Type of to-date amount */
  toDateAmountType: ToDateAmountType;
};

export type ProjectAddressInput = {
  addressLine1: Scalars['String']['input'];
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  city: Scalars['String']['input'];
  country: Scalars['String']['input'];
  state: Scalars['String']['input'];
  zipcode: Scalars['String']['input'];
};

export type ProjectFilter = {
  addresses?: InputMaybe<Array<ProjectAddressInput>>;
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};

export type ProviderAgencyError = {
  __typename?: 'ProviderAgencyError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/**
 * Includes the details of a Provider Agency integrated with a company account
 * Example: NEST UK pension provider
 */
export type ProviderAgencySetup = {
  /** Agency credentials for integration */
  agencyCredential?: Maybe<AgencyCredential>;
  /** Is integration enabled */
  enabled: Scalars['Boolean']['output'];
  /** Provider id */
  id: Scalars['ID']['output'];
  /** A provider name/description */
  name: Scalars['String']['output'];
};

/** Storing a namespace-controlled alternative ID for an entity. */
export type Qb_AlternateId = {
  __typename?: 'Qb_AlternateId';
  /** alternative id within the given namespace */
  id?: Maybe<Scalars['String']['output']>;
  /** the domain that generates the ID. */
  nameSpace?: Maybe<Scalars['String']['output']>;
};

/** Entry points to the schema */
export type Query = {
  __typename?: 'Query';
  company?: Maybe<Company>;
  /**
   * Provides a list of companies for the specified search configuration. This is a restricted search API
   * This search requires the 50M intuit_realm header, in order to fetch data from multiple companies at once, and works only if the calling app is whitelisted by the backend.
   */
  companySearch?: Maybe<CompanySearchConnection>;
  /** @deprecated Use employee from Company instead */
  employee?: Maybe<Employee>;
  importedCompany?: Maybe<ImportedCompany>;
  metaModels?: Maybe<MetaModels>;
  /**
   * This query is intended for workers to get all their employee records and contractor records.
   * It is not for employers to get all their worker records.
   */
  workersByUserId: Array<Worker>;
};


/** Entry points to the schema */
export type QueryCompanyArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


/** Entry points to the schema */
export type QueryCompanySearchArgs = {
  input: CompanySearchInput;
};


/** Entry points to the schema */
export type QueryEmployeeArgs = {
  id: Scalars['ID']['input'];
};


/** Entry points to the schema */
export type QueryWorkersByUserIdArgs = {
  input?: InputMaybe<WorkerInput>;
};

/** Shared rate object */
export type Rate = {
  __typename?: 'Rate';
  type: RateType;
  value: Scalars['String']['output'];
};

export type RateInput = {
  type: RateType;
  value: Scalars['String']['input'];
};

/** Metamodel for Rate */
export type RateMetaModel = MetaModel & {
  __typename?: 'RateMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** Rate type, either Fixed or a Percent value */
  type: MetaEnum;
  typeRef: Scalars['String']['output'];
  /** The value for the particular rate type being specified */
  value: MetaMoney;
};

/** Rate type, either Fixed or a Percent value */
export enum RateType {
  Fixed = 'FIXED',
  Percent = 'PERCENT'
}

/** Describes if a capability (e.g. run payroll, pay taxes) is ready and available for use. If it is not, then a list of deficiencies (reasons) that detail why it is not is also provided. */
export type Readiness = {
  /** List of reasons why the capability is not ready. This list is empty when 'ready' is true. */
  deficiencies: Array<ReadinessDeficiency>;
  ready: Scalars['Boolean']['output'];
};

export enum ReadinessCategory {
  All = 'ALL',
  Benefits = 'BENEFITS',
  CompanySetup = 'COMPANY_SETUP',
  EmployeesHistory = 'EMPLOYEES_HISTORY',
  Eservices = 'ESERVICES',
  RunPayroll = 'RUN_PAYROLL'
}

/** Describes the failing or shortcoming that is contributing to the lack of readiness, and optionally an action that can be taken to correct it. */
export type ReadinessDeficiency = {
  description: Scalars['String']['output'];
  remediation?: Maybe<UserActionable>;
};

/** This type is used to express an action that can be taken to remediate a readiness deficiency, for when there is no ToDo/Task already tracking and describing the remediation action. */
export type ReadinessDeficiencyRemediation = UserActionable & {
  __typename?: 'ReadinessDeficiencyRemediation';
  action: UserAction;
  /** Short description of how the action will remediate the deficiency */
  description: Scalars['String']['output'];
};

export enum ReasonCategory {
  AccountClosed = 'ACCOUNT_CLOSED',
  AgentAction = 'AGENT_ACTION',
  Default = 'DEFAULT',
  DesktopMigration = 'DESKTOP_MIGRATION',
  FeinMismatch = 'FEIN_MISMATCH',
  FilingRejectionInactiveOrClosedAgencyAccount = 'FILING_REJECTION_INACTIVE_OR_CLOSED_AGENCY_ACCOUNT',
  FilingRejectionMissingOrInvalidAgencyId = 'FILING_REJECTION_MISSING_OR_INVALID_AGENCY_ID',
  FilingRejectionNoTpaAccess = 'FILING_REJECTION_NO_TPA_ACCESS',
  FormsTpaNotProvided = 'FORMS_TPA_NOT_PROVIDED',
  InactiveAccount = 'INACTIVE_ACCOUNT',
  Na = 'NA',
  NoAccount = 'NO_ACCOUNT',
  NoWithholdingSetup = 'NO_WITHHOLDING_SETUP',
  TpaNotAssigned = 'TPA_NOT_ASSIGNED',
  WithholdingClosed = 'WITHHOLDING_CLOSED',
  WrongBusinessName = 'WRONG_BUSINESS_NAME',
  WrongEin = 'WRONG_EIN',
  WrongLegalName = 'WRONG_LEGAL_NAME',
  ZipCode = 'ZIP_CODE'
}

/** CompanyId for which the ImportedpayHistory will be created */
export type RecalculateImportedPayHistoryInput = {
  /** Company ID that is being updated */
  companyId: Scalars['ID']['input'];
  /**
   * Boolean for determining if recalculate is called from 3rd party imported
   * This shouldn't be used in any future use cases as it'll be deprecated when
   * the company can tell if import was through 3rd party or desktop.
   */
  isThirdParty?: InputMaybe<Scalars['Boolean']['input']>;
};

export type RecalculateImportedPayHistoryPayload = {
  __typename?: 'RecalculateImportedPayHistoryPayload';
  state: ImportedPayHistoryState;
  userError?: Maybe<ImportedPayHistoryError>;
};

/**
 * This is the error type related to recalculation of prior payroll. As data has been already
 * entered into the system, this error is not invovled with user but the recalculation process itself.
 */
export type RecalculatePriorPayrollError = {
  __typename?: 'RecalculatePriorPayrollError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type RecalculatePriorPayrollInput = {
  /** The id for company to be recalculated for prior payroll history */
  companyId: Scalars['ID']['input'];
};

/**
 * Recalculate company status and pay checks based on prior pay history data
 * that exist after employees' pay historical info have been entered
 */
export type RecalculatePriorPayrollPayload = {
  __typename?: 'RecalculatePriorPayrollPayload';
  /** Company employer info updated from the recalculation */
  employerInfo?: Maybe<Company_EmployerInfo>;
  /**
   * Error occurrs while recalculating prior payroll history.
   * This error is not user related error.
   */
  error?: Maybe<RecalculatePriorPayrollError>;
};

export type RecordEmployerDataConsentInput = {
  /** The id of the company that the consent is being recording */
  companyId: Scalars['ID']['input'];
  /** consented value, true or false. */
  consented: Scalars['Boolean']['input'];
  /** The usage or purpose of this consent */
  usage: EmployerDataConsentUsage;
};

export type RecordEmployerDataConsentPayload = {
  __typename?: 'RecordEmployerDataConsentPayload';
  /** The recorded employer data consent */
  consent: EmployerDataConsent;
};

export type RecordPaidTaxPaymentInput = {
  paymentDate?: InputMaybe<Scalars['Date']['input']>;
  referenceNumber?: InputMaybe<Scalars['String']['input']>;
  /** An ID of a Tax Payment. Only an ID for a Tax Payment that is in pending status is valid. */
  taxPaymentId: Scalars['ID']['input'];
};

export type RecordPaidTaxPaymentSuccess = {
  __typename?: 'RecordPaidTaxPaymentSuccess';
  /** ID of a Tax Payment that was deleted as a result of the mutation. This value will be defined if by recording a pending Tax Payment as paid, that payment was deleted and replaced by a newly created payment. */
  deletedTaxPaymentId?: Maybe<Scalars['ID']['output']>;
  /** A Tax Payment that was recorded as paid a result of the mutation. This Tax Payment could either be the pending payment that was specified as input (and has been updated), or a newly created payment. */
  recordedPayment: Payroll_Payments_TaxPayment;
};

/** Input for the `recordTaxPayments` mutation. */
export type RecordPaidTaxPaymentsInput = {
  /** List of pending tax payments to record as paid, including details about the payments. */
  pendingTaxPayments: Array<RecordPaidTaxPaymentInput>;
};

/**
 * Result of `recordPaidTaxPayments` mutation.
 * Includes successfully recorded tax payments, as well as any errors that caused failures to do so.
 */
export type RecordPaidTaxPaymentsPayload = {
  __typename?: 'RecordPaidTaxPaymentsPayload';
  /** List of failed pending tax payments */
  errors?: Maybe<Array<TaxPaymentError>>;
  /** List of successful recorded paid tax-payments */
  successes?: Maybe<Array<RecordPaidTaxPaymentSuccess>>;
};

/** Input for the `recordTaxPayments` mutation. */
export type RecordTaxPaymentInput = {
  checkNumber?: InputMaybe<Scalars['String']['input']>;
  memo?: InputMaybe<Scalars['String']['input']>;
  /** Date on which the payment being recorded was made */
  paymentDate: Scalars['Date']['input'];
  /** The start and end date of the tax payment period */
  paymentPeriod: RecordedTaxTransactionLiabilityPeriodFilter;
  /** List of tax payment details */
  taxBreakdowns: Array<TaxPaymentTaxBreakdownInput>;
  /** The CMS ID of the TaxPayment Group this payment belongs to */
  taxPaymentGroupCmsId?: InputMaybe<Scalars['String']['input']>;
  /** The Id of the TaxPayment Group this payment belongs to */
  taxPaymentGroupId: Scalars['String']['input'];
  /** The ID of the tax payment entity being updated, if any */
  taxPaymentId?: InputMaybe<Scalars['ID']['input']>;
};

/**
 * Result of `recordTaxPayment` mutation.
 * Includes successfully recorded tax payment, as well as any error during the mutation, if any
 */
export type RecordTaxPaymentPayload = {
  __typename?: 'RecordTaxPaymentPayload';
  /** Error during the recording of the Tax payment */
  error?: Maybe<TaxPaymentError>;
  /** The tax payment recorded, if successful */
  recordedPayment?: Maybe<Payroll_Payments_TaxPayment>;
};

/** A connection to a list of tax transactions which are recorded in the system. */
export type RecordedEmployerDebitConnection = {
  __typename?: 'RecordedEmployerDebitConnection';
  edges: Array<RecordedEmployerDebitEdge>;
};

/** An edge for a connection of a recorded tax transaction. */
export type RecordedEmployerDebitEdge = {
  __typename?: 'RecordedEmployerDebitEdge';
  /** The item at the end of the edge */
  node?: Maybe<EmployerDebitTransaction>;
};

export type RecordedEmployerDebitFilter = {
  /** Only return recorded tax transactions with exportedToExternal as either true or false */
  exportedToExternal?: InputMaybe<BooleanFilter>;
  /** Only return recorded tax transactions with a liability period within this range */
  paymentPeriod: RecordedEmployerDebitPeriodFilter;
};

export type RecordedEmployerDebitInput = {
  filterBy: RecordedEmployerDebitFilter;
};

export type RecordedEmployerDebitPeriodFilter = {
  beginDate: DateFilter;
  endDate: DateFilter;
};

/** A connection to a list of tax transactions which are recorded in the system. */
export type RecordedTaxTransactionConnection = {
  __typename?: 'RecordedTaxTransactionConnection';
  edges?: Maybe<Array<Maybe<RecordedTaxTransactionEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

/** An edge for a connection of a recorded tax transaction. */
export type RecordedTaxTransactionEdge = {
  __typename?: 'RecordedTaxTransactionEdge';
  /** The item at the end of the edge */
  node?: Maybe<Payroll_Payments_TaxPayment>;
};

export type RecordedTaxTransactionFilter = {
  /** Source system which will identify which system is source of truth for the exported payment. */
  exportSourceSystem?: InputMaybe<StringFilter>;
  /** Only return recorded tax transactions with exportedToExternal as either true or false */
  exportedToExternal?: InputMaybe<BooleanFilter>;
  /** Only return recorded tax transactions that were made outside of payroll */
  importedFromExternal?: InputMaybe<BooleanFilter>;
  /** Only return recorded tax transactions with a liability period within this range */
  paymentPeriod: RecordedTaxTransactionLiabilityPeriodFilter;
  /** Tax payment group IDs for which payments need to be fetched */
  taxPaymentGroup?: InputMaybe<IdFilter>;
  /** Tax payment group CMS IDs for which payments need to be fetched */
  taxPaymentGroupCmsId?: InputMaybe<IdFilter>;
};

export type RecordedTaxTransactionInput = {
  filterBy: RecordedTaxTransactionFilter;
  orderBy?: InputMaybe<RecordedTaxTransactionOrderBy>;
  /** If no pagination input is provided, 20 recorded tax transactions will be returned */
  pagination?: InputMaybe<PaginationInput>;
};

export type RecordedTaxTransactionLiabilityPeriodFilter = {
  beginDate: DateFilter;
  endDate: DateFilter;
};

/** Recorded tax transactions data can be sorted based on the below fields */
export enum RecordedTaxTransactionOrderBy {
  PaymentAmountAsc = 'paymentAmount_ASC',
  PaymentAmountDesc = 'paymentAmount_DESC',
  PaymentDateAsc = 'paymentDate_ASC',
  PaymentDateDesc = 'paymentDate_DESC'
}

export type RecordedTaxTransactionsReport = {
  __typename?: 'RecordedTaxTransactionsReport';
  renderings?: Maybe<RecordedTaxTransactionsReportRenderings>;
};

export enum RecordedTaxTransactionsReportExcelOptionalField {
  Notes = 'NOTES',
  PaymentMethod = 'PAYMENT_METHOD'
}

export type RecordedTaxTransactionsReportExcelRenderInput = {
  /**
   * Specifies optional data to exclude while generating the excel report for tax payments report
   * If not specified, all the data will be included by default
   */
  excludedFields?: InputMaybe<Array<RecordedTaxTransactionsReportExcelOptionalField>>;
};

export enum RecordedTaxTransactionsReportPdfOptionalField {
  Notes = 'NOTES',
  PaymentMethod = 'PAYMENT_METHOD'
}

export type RecordedTaxTransactionsReportPdfRenderInput = {
  /**
   * Specifies optional data to exclude while generating the pdf report for tax payments report
   * If not specified, all the data will be included by default
   */
  excludedFields?: InputMaybe<Array<RecordedTaxTransactionsReportPdfOptionalField>>;
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Tax payments report data rendering detail */
export type RecordedTaxTransactionsReportRenderings = {
  __typename?: 'RecordedTaxTransactionsReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/** Tax payments report data rendering detail */
export type RecordedTaxTransactionsReportRenderingsExcelArgs = {
  input?: InputMaybe<RecordedTaxTransactionsReportExcelRenderInput>;
};


/** Tax payments report data rendering detail */
export type RecordedTaxTransactionsReportRenderingsPdfArgs = {
  input?: InputMaybe<RecordedTaxTransactionsReportPdfRenderInput>;
};

export type ReferencePeriodEndDayOfMonth = {
  __typename?: 'ReferencePeriodEndDayOfMonth';
  /** The period end day information */
  day: DayOfMonth;
  /** The reference month information for the period end date */
  relativeMonth: RelativeMonth;
};

export type ReferencePeriodEndDayOfMonthInput = {
  day: DayOfMonth;
  relativeMonth: RelativeMonth;
};

export type ReferencePeriodEndDayOffset = {
  __typename?: 'ReferencePeriodEndDayOffset';
  /**
   * The offset number of days for end date, where if the number of days are prior to the pay date, this value should be positive
   * and if it is after the pay date, the value should be negative
   */
  offsetDays: Scalars['Int']['output'];
};

export type ReferencePeriodEndDayOffsetInput = {
  offsetDays: Scalars['Int']['input'];
};

/** Allowed value for Arrears Month Type */
export enum RelativeMonth {
  Next = 'NEXT',
  Previous = 'PREVIOUS',
  Same = 'SAME'
}

/** Input for removing an employee from a department */
export type RemoveEmployeeFromDepartmentInput = {
  companyId: Scalars['ID']['input'];
  /** Department id */
  departmentId: Scalars['ID']['input'];
  /** Employee id */
  employeeId: Scalars['ID']['input'];
};

/** Type for remove employee from department response */
export type RemoveEmployeeFromDepartmentPayload = {
  __typename?: 'RemoveEmployeeFromDepartmentPayload';
  userError?: Maybe<EmploymentRelationshipError>;
};

/** Input for deleting a reportee from a manager */
export type RemoveReporteeInput = {
  companyId: Scalars['ID']['input'];
  /** Manager employee id */
  managerId: Scalars['ID']['input'];
  /** Reportee employee id */
  reporteeId: Scalars['ID']['input'];
};

/** Type for delete reportee response */
export type RemoveReporteePayload = {
  __typename?: 'RemoveReporteePayload';
  /** Represents the total number of reportees employee currently has. */
  reporteeCount?: Maybe<Scalars['Int']['output']>;
  userError?: Maybe<EmploymentRelationshipError>;
};

/** Filter report data by tax year range */
export type ReportTaxYearRangeFilter = {
  dateRange: DateFilter;
};

export type ReporteesFilter = {
  /** Filter to find employees with reportees. */
  hasReportees?: InputMaybe<BooleanFilter>;
};

export type ReportingUnit = {
  __typename?: 'ReportingUnit';
  /** The code assigned to this particular reporting unit */
  code: Scalars['String']['output'];
};

export type ReportingUnitInput = {
  code: Scalars['String']['input'];
};

export type ReportingUnitMetaModel = MetaModel & {
  __typename?: 'ReportingUnitMetaModel';
  applicable: Scalars['Boolean']['output'];
  code: MetaString;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Defines information of a representative like their name, contact etc. */
export type Representative = {
  name: Scalars['String']['output'];
};

/** Includes information of a representative like their name, contact etc. */
export type RepresentativeInformation = Representative & {
  __typename?: 'RepresentativeInformation';
  /** Representative Name */
  name: Scalars['String']['output'];
  /** Representative Phone */
  phone: PhoneNumber;
  /** PIN for representative to use when talking to the government agency (Example: 54674, 00123 etc.) */
  pin: Scalars['String']['output'];
};

/** Input for updating representative */
export type RepresentativeInput = {
  name: Scalars['String']['input'];
  phone: PhoneNumberInput;
  pin: Scalars['String']['input'];
};

export enum RequirementGroup {
  /** The field is required to create a new entity */
  CreateEntity = 'CREATE_ENTITY',
  /** The field is required to file taxes */
  FileTaxes = 'FILE_TAXES',
  /** The field is required to pay taxes */
  PayTaxes = 'PAY_TAXES',
  /** The field is required to run payroll */
  RunPayroll = 'RUN_PAYROLL',
  /** The field is required to setup taxes */
  SetupTaxes = 'SETUP_TAXES'
}

export type RequirementGroupFilter = {
  eq?: InputMaybe<RequirementGroup>;
  in?: InputMaybe<Array<RequirementGroup>>;
};

export type ResendEmployeeProductInvitationInput = {
  /** Company ID */
  companyId: Scalars['ID']['input'];
  /** Employee ID */
  employeeId: Scalars['ID']['input'];
  /** Type of the invitation */
  type: Scalars['String']['input'];
};

export type ResendEmployeeProductInvitationPayload = {
  __typename?: 'ResendEmployeeProductInvitationPayload';
  error?: Maybe<EmployeeProductInvitationError>;
  /** The invitation that was updated as a result of the mutation */
  invitation?: Maybe<EmployeeProductInvitation>;
};

/** Input for the `resolveTaxOverpayment` mutation. */
export type ResolveTaxOverpaymentInput = {
  /** Specifies the method to be used when resolving the overpayment amount */
  resolutionMethod: TaxOverpaymentResolutionMethod;
  /**
   * The ID of the Tax Payment that is the overpayment to resolve.
   * Only an ID for a Tax Payment that has paymentStatus as OverPaid is valid.
   */
  taxPaymentId: Scalars['ID']['input'];
};

/** Result of `resolveTaxOverpayment` mutation. */
export type ResolveTaxOverpaymentPayload = {
  __typename?: 'ResolveTaxOverpaymentPayload';
  /**
   * The error that occurred if resolving the overpayment failed.
   * This is null if resolution was successful.
   */
  error?: Maybe<TaxPaymentError>;
  /**
   * The ID of the Tax Payment that was deleted as a result of successful resolution of the overpayment.
   * This is null if resolving the overpayment failed.
   */
  resolvedTaxPaymentId?: Maybe<Scalars['ID']['output']>;
};

export enum ResponsiblePartyTypeEnum {
  Commercial = 'COMMERCIAL',
  Individual = 'INDIVIDUAL'
}

/** Tax reporting information for retirement benefits are given to the employee. For example, in US, this is currently used to report Box 13 on employee's W-2 */
export type RetirementBenefit = {
  __typename?: 'RetirementBenefit';
  /** If retirement benefits are provided to the employee. */
  contributesToRetirementPlan: Scalars['Boolean']['output'];
};

export type RetirementBenefitInput = {
  contributesToRetirementPlan: Scalars['Boolean']['input'];
};

export type ReverseDirectDepositPayslipsInput = {
  companyId: Scalars['ID']['input'];
  payslipReversalDetails: Array<DirectDepositPayslipReversalDetail>;
};

/** Result of the 'reverseDirectDepositPayslips' mutation. Provides a list of successful and errored reverse DD actions on a batch of payslips. */
export type ReverseDirectDepositPayslipsPayload = {
  __typename?: 'ReverseDirectDepositPayslipsPayload';
  /** List of direct deposit payslips that weren't able to be reversed and associated list of errors as to why reversal was unsuccessful */
  failures?: Maybe<Array<PayslipCorrectionFailure>>;
  /** List of direct deposit payslip ids that were reversed successfully */
  payslipIds?: Maybe<Array<Scalars['ID']['output']>>;
};

/** Input to save draft company and employee payroll run */
export type SaveDraftCompanyAndEmployeePayrollRunInput = {
  /** Realm id of the company */
  companyId: Scalars['ID']['input'];
  /** List of employee payroll runs to be saved */
  employeePayrollRunInputs: Array<SaveDraftEmployeePayrollRunInput>;
  /** Ledger account used to fund this payroll run */
  fundingLedgerAccount?: InputMaybe<PayrollRunLedgerAccountInput>;
  /** Id of company payroll run to be saved */
  id: Scalars['ID']['input'];
  /** Includes relevant dates like pay period dates and paydate for this payroll run */
  payrollDateSummary: PayrollDateSummaryInput;
  /**
   * Determines if draft payroll run is saved for later.
   * Setting this value skips evaluation of any payroll run messages (warnings/blockers)
   */
  saveForLater?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Result of SaveDraftCompanyAndEmployeePayrollRunPayload mutation */
export type SaveDraftCompanyAndEmployeePayrollRunPayload = {
  __typename?: 'SaveDraftCompanyAndEmployeePayrollRunPayload';
  /** Company payroll run saved as a result of mutation */
  companyPayrollRun?: Maybe<CompanyPayrollRun>;
  /** Employee payroll runs saved as a result of mutation */
  employeePayrollRuns?: Maybe<Array<SaveDraftEmployeePayrollRunPayload>>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<PayrollRunUserError>;
};

/** Input to save draft employee payroll run */
export type SaveDraftEmployeePayrollRunInput = {
  /** Employee's compensations calculated to be paid as part of this payroll run */
  calculatedCompensationInputs?: InputMaybe<Array<PayrollRunCalculatedCompensationInput>>;
  /** Employee's tax calculated to be paid as part of this payroll run */
  calculatedTaxInputs?: InputMaybe<Array<PayrollRunCalculatedTaxInput>>;
  /** Employee id for this payroll run */
  employeeId: Scalars['ID']['input'];
  /** Id of employee payroll run to be saved */
  id: Scalars['ID']['input'];
  /** Memo note for this employee payroll run */
  memo?: InputMaybe<Scalars['String']['input']>;
  /** Employee's pay distributions for this payroll run */
  payDistributions?: InputMaybe<Array<EmployeePayDistributionInput>>;
};

export type SaveDraftEmployeePayrollRunPayload = {
  __typename?: 'SaveDraftEmployeePayrollRunPayload';
  /** Employee payroll run saved as part of this payroll run */
  employeePayrollRun: EmployeePayrollRun;
  /**
   * Total deduction contributions for this employee payroll run, includes
   * employee and employer total contributions
   */
  totalDeductions?: Maybe<TotalDeductions>;
  /** Total employee taxes to be withheld for this employee payroll run */
  totalEmployeeTaxes?: Maybe<Scalars['Money']['output']>;
  /** Total employer taxes to be withheld for this employee payroll run */
  totalEmployerTaxes?: Maybe<Scalars['Money']['output']>;
  /** Total hours worked for this payroll run (include regular, overtime, double overtime hours) */
  totalHours?: Maybe<Scalars['Float']['output']>;
};

export type SelectedClassTrackingDetail = {
  __typename?: 'SelectedClassTrackingDetail';
  /** Specifies the class name for transactions if classes are assigned to transactions. */
  classMapping?: Maybe<TransactionsToClassMapping>;
  /**
   * Specifies whether classes are assigned to payroll transactions.
   * Classes may not be used or class may be specified for each worker or same class may be used for all workers.
   */
  mode: ClassTrackingMode;
};

/** Union of date object and date string type values */
export type SensitizableDate = NonSensitizedDate | SensitizedDate;

/** Represent the sensitized date as string for sensitizable date field */
export type SensitizedDate = {
  __typename?: 'SensitizedDate';
  dateString?: Maybe<Scalars['String']['output']>;
};

export type SetupEmployeeCompensationsCreateInput = {
  effective?: InputMaybe<EffectiveDateRange>;
  employerCompensation: CreateEmployeeCompensationEmployerCompensationInput;
  rate?: InputMaybe<PayRateInput>;
};

export type SetupEmployeeCompensationsCreatedResult = {
  __typename?: 'SetupEmployeeCompensationsCreatedResult';
  employeeCompensations?: Maybe<Array<EmployeeCompensation>>;
  employerCompensations?: Maybe<Array<EmployerCompensation>>;
  userErrors?: Maybe<Array<CompensationMutationError>>;
};

export type SetupEmployeeCompensationsInput = {
  create?: InputMaybe<Array<SetupEmployeeCompensationsCreateInput>>;
  employeeId: Scalars['ID']['input'];
  update?: InputMaybe<Array<UpdateEmployeeCompensationInput>>;
};

export type SetupEmployeeCompensationsPayload = {
  __typename?: 'SetupEmployeeCompensationsPayload';
  created?: Maybe<SetupEmployeeCompensationsCreatedResult>;
  updated?: Maybe<SetupEmployeeCompensationsUpdatedResult>;
};

export type SetupEmployeeCompensationsUpdatedResult = {
  __typename?: 'SetupEmployeeCompensationsUpdatedResult';
  employeeCompensations?: Maybe<Array<EmployeeCompensation>>;
  userErrors?: Maybe<Array<CompensationMutationError>>;
};

export type SetupEmployeeTimeOffPoliciesInput = {
  /** ID of the employee */
  employeeId: Scalars['ID']['input'];
  setupEmployeeTimeOffPolicyDetails: Array<SetupEmployeeTimeOffPolicyDetailsInput>;
};

export type SetupEmployeeTimeOffPoliciesPayload = {
  __typename?: 'SetupEmployeeTimeOffPoliciesPayload';
  /** The employer time off policies that were successfully created as a result of the mutation. */
  employerTimeOffPolicies?: Maybe<Array<EmployerTimeOffPolicy>>;
  /** The employee time off policies that were successfully created as a result of the mutation. */
  timeOffPolicies?: Maybe<Array<EmployeeTimeOffPolicy>>;
  userError?: Maybe<TimeOffPolicyError>;
};

/** Input type to create a new employee time off policy or batch create employer and employee time off policies */
export type SetupEmployeeTimeOffPolicyDetailsInput = {
  /** EmployerTimeOffPolicy details */
  employerTimeOffPolicy: EmployerTimeOffPolicyDetailsInput;
  /** The total monetary amount that an employee has available to use for the given time off policy */
  monetaryBalance?: InputMaybe<MonetaryBalanceInput>;
  /** The total time that an employee has available to use for the given time off policy */
  timeBalance?: InputMaybe<TimeBalanceInput>;
};

export type SickLeavePeriod = EmployeeLeavePeriod & Node & {
  __typename?: 'SickLeavePeriod';
  /** Used to determine the type of leave */
  category: LeaveCategory;
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['output'];
  /** End date of the employee leave which is optional */
  endDate?: Maybe<Scalars['Date']['output']>;
  id: Scalars['ID']['output'];
  /**
   * The wage reference to compute employee wages during the leave period.
   * It is a temporal value that could potentially change for every leave period
   * e.g. average weekly earnings of the employee at the time of taking the leave.
   */
  leaveWageReference?: Maybe<Scalars['Money']['output']>;
  /** Specifies the number of days from another leave that should be linked to this leave. */
  linkedLeaveDays?: Maybe<Scalars['Int']['output']>;
};

/** Error object for signatory operations */
export type SignatoryError = {
  __typename?: 'SignatoryError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type SmartImportInput = {
  parameters: SmartImportParametersInput;
  promptId: Scalars['String']['input'];
  promptVersion: Scalars['Int']['input'];
  spec?: InputMaybe<Scalars['String']['input']>;
};

export type SmartImportParametersInput = {
  destinationData: Scalars['String']['input'];
  sourceData: Scalars['String']['input'];
};

export type SmartImportPayload = {
  __typename?: 'SmartImportPayload';
  error?: Maybe<Scalars['String']['output']>;
  response?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type Source = {
  __typename?: 'Source';
  /** The region that the company is setup in, can be different than the company work location. e.g US, CA */
  region: Scalars['String']['output'];
};

export type StateMandatedPensionsReport = {
  __typename?: 'StateMandatedPensionsReport';
  /** List of deduction breakdowns by a particular pension type */
  aggregatedByPension?: Maybe<Array<StateMandatedPensionsReportAggregationByDeduction>>;
  /** State mandated pensions report with report data rendering detail */
  renderings?: Maybe<StateMandatedPensionsReportRenderings>;
};

export type StateMandatedPensionsReportAggregationByDeduction = {
  __typename?: 'StateMandatedPensionsReportAggregationByDeduction';
  /** Details on the pension policy */
  deductionPolicy: DeductionPolicy;
  /** Aggregated data broken down by employee payslips contributing to a particular deduction type */
  employeeBreakdowns: Array<StateMandatedPensionsReportEmployeeDeductionDetail>;
  /** Total aggregation of deductions across all employees */
  totalEmployeeDeduction: Scalars['Money']['output'];
};

/** Details of the employee and employee's deduction */
export type StateMandatedPensionsReportEmployeeDeductionDetail = {
  __typename?: 'StateMandatedPensionsReportEmployeeDeductionDetail';
  /** Employee's contribution to this deduction */
  employeeDeduction: Scalars['Money']['output'];
  employeeDetail: StateMandatedPensionsReportEmployeeDetail;
};

export type StateMandatedPensionsReportEmployeeDetail = {
  __typename?: 'StateMandatedPensionsReportEmployeeDetail';
  employeeId: Scalars['ID']['output'];
  employeeIdentifier?: Maybe<Scalars['String']['output']>;
  /** Active or Inactive Status of the employee and detailed status */
  employmentStatus: Payroll_Employee_EmploymentStatus;
  firstName: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  middleInitial?: Maybe<Scalars['String']['output']>;
  /**
   * The identifiers for this employee that are used when filing taxes, e.g. Social Security Number (SSN) for US, or
   * Social Insurance Number (SIN) for CA. By default the values are sensitized (partially obfuscated) to protect privacy,
   * but the full plain text value can be requested by specifying through the argument.
   */
  taxIdentifiers?: Maybe<Array<VariableStringField>>;
};


export type StateMandatedPensionsReportEmployeeDetailTaxIdentifiersArgs = {
  sensitized?: InputMaybe<Scalars['Boolean']['input']>;
};

export type StateMandatedPensionsReportInput = {
  deductionPolicyId?: InputMaybe<IdFilter>;
  employee?: InputMaybe<PensionsReportEmployeeFilter>;
  payDate: PayslipPayDateFilter;
};

/** Input fields for state mandated pensions report pdf rendering */
export type StateMandatedPensionsReportPdfRenderInput = {
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Returns renderings such as excel, pdf for state mandated pensions report */
export type StateMandatedPensionsReportRenderings = {
  __typename?: 'StateMandatedPensionsReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/** Returns renderings such as excel, pdf for state mandated pensions report */
export type StateMandatedPensionsReportRenderingsPdfArgs = {
  input?: InputMaybe<StateMandatedPensionsReportPdfRenderInput>;
};

export type StringFilter = {
  eq?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
};

/** Represents options for the sub period types */
export enum SubPeriodDuration {
  /** Represents the subperiod HOURS */
  Hours = 'HOURS',
  /** Represents the subperiod WEEKS */
  Weeks = 'WEEKS'
}

/** Additional ways of determining if a compensation is subjected to any calculations */
export type SubjectedToCalculation = {
  __typename?: 'SubjectedToCalculation';
  /** Determines if a compensation is subjected to pension */
  pension: Scalars['Boolean']['output'];
};

export type SubjectedToCalculationInput = {
  pension: Scalars['Boolean']['input'];
};

/** Error generated as a result of the submitBenefitFiling mutation */
export type SubmitBenefitFilingError = {
  __typename?: 'SubmitBenefitFilingError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type SubmitBenefitFilingInput = {
  benefitSubmissionId: Scalars['ID']['input'];
  companyId: Scalars['ID']['input'];
};

export type SubmitBenefitFilingPayload = {
  __typename?: 'SubmitBenefitFilingPayload';
  benefitFiling?: Maybe<BenefitFiling>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<SubmitBenefitFilingError>;
};

/** Input to submit payroll run */
export type SubmitDraftPayrollRunInput = {
  /** Realm id of the company */
  companyId: Scalars['ID']['input'];
  /** Id of company payroll run to be submitted */
  id: Scalars['ID']['input'];
  /** Pay period for the payroll run */
  payPeriod: PayPeriodInput;
  /** The id of the pay schedule to be assigned to the employee */
  payScheduleId: Scalars['ID']['input'];
};

export type SubmitElectronicTaxFilingInput = {
  lateReason?: InputMaybe<Scalars['String']['input']>;
  taxFilingId: Scalars['ID']['input'];
};

export type SubmitElectronicTaxFilingPayload = {
  __typename?: 'SubmitElectronicTaxFilingPayload';
  /** ID of a Tax Filing that was deleted as a result of the mutation. This value will be defined if by recording a pending Tax Payment as paid, that payment was deleted and replaced by a newly created payment. */
  deletedFilingId?: Maybe<Scalars['ID']['output']>;
  error?: Maybe<TaxFilingError>;
  /** A Tax Filing that was successfully submitted as a result of the mutation. This could either be the pending filing that was specified as input (and has been updated), or a newly created filing. */
  filingSubmitted?: Maybe<TaxFiling>;
};

export type SubmitEmployeePayrollRunInput = {
  /** Employee's compensations calculated to be paid as part of this payroll run */
  calculatedCompensations?: InputMaybe<Array<PayrollRunCalculatedCompensationInput>>;
  /** Id of employee payroll run to be submitted */
  id: Scalars['ID']['input'];
  /** Memo note for this employee payroll run */
  memo?: InputMaybe<Scalars['String']['input']>;
};

/** Input to submit payroll run */
export type SubmitPayrollRunInput = {
  /** Reason for creating amendments */
  amendmentsReason?: InputMaybe<Scalars['String']['input']>;
  /** Realm id of the company */
  companyId: Scalars['ID']['input'];
  /** Create amendments for closed quarter correction */
  createAmendmentsCase?: InputMaybe<Scalars['Boolean']['input']>;
  /** List of employee payroll runs to be submitted */
  employeePayrollRunInputs: Array<SubmitEmployeePayrollRunInput>;
  /** Ledger account used to fund this payroll run */
  fundingLedgerAccount?: InputMaybe<PayrollRunLedgerAccountInput>;
  /** Id of company payroll run to be submitted */
  id: Scalars['ID']['input'];
  /** Syncs transaction */
  syncTransaction?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Result of SubmitPayrollRun mutation */
export type SubmitPayrollRunPayload = {
  __typename?: 'SubmitPayrollRunPayload';
  /** Id of company payroll run that was submitted */
  companyPayrollRun?: Maybe<CompanyPayrollRun>;
  /** Created amendments for closed quarter correction */
  createdAmendmentsCase?: Maybe<Scalars['Boolean']['output']>;
  /**
   * Employee payroll runs that were submitted. This includes reference to
   * payslips generated as part of payroll submission
   */
  employeePayrollRuns?: Maybe<Array<EmployeePayrollRun>>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<PayrollRunUserError>;
};

export type Task = {
  __typename?: 'Task';
  /** Actions for the task contains the required actions the user needs to perform to complete the task */
  actions: Array<TaskAction>;
  /**
   * Category of the task.
   * Eg: IFSP_ONBOARDING, PAY_TAXES, FORM_FILING
   */
  category: Scalars['String']['output'];
  /** Description for the task */
  description?: Maybe<Scalars['String']['output']>;
  /** Date when the task is due */
  dueDate?: Maybe<Scalars['Date']['output']>;
  /**
   * Employee(s) for whom the task is related to.
   * Can be null in a scenario where the task is not related to any employee(s)
   */
  employees?: Maybe<Array<Employee>>;
  /** Date when tasks is expried */
  expiryDate?: Maybe<Scalars['Date']['output']>;
  /**
   * Files associated to the Task.
   * It can include both agent and user added/uploaded ones.
   */
  files: Array<TaskFile>;
  /** Id of the task */
  id: Scalars['ID']['output'];
  /** Metamodel for updating a task */
  metaModel: TaskMetaModel;
  /**
   * Name of the task.
   * Eg: E-sign legal authorization forms
   */
  name: Scalars['String']['output'];
  /** Priority of the task. Varies from 0 to 10 with 10 being the highest priority */
  priority?: Maybe<Scalars['Int']['output']>;
  /** Source data for the task */
  sourceVersion?: Maybe<TaskSourceVersion>;
  /** Current status of the task */
  status: TaskStatus;
  /**
   * Type of the task.
   * Eg: TASK, TODO, BLOCKER
   */
  type: TaskType;
};

export type TaskAction = {
  __typename?: 'TaskAction';
  /**
   * Defines the key for the action.
   * Eg: type.id, moduleType.id, url, wddx.description, wddx.metadata
   */
  key: Scalars['String']['output'];
  /**
   * Represents the sub-actions to be completed for this action.
   * Can be null in a scenario where there are no actions for a task.
   * Can be an empty array in a scenario where all the actions have been completed.
   */
  subActions?: Maybe<Array<TaskSubAction>>;
  /** Value for the above specified key */
  value?: Maybe<Scalars['String']['output']>;
};

export type TaskActionInput = {
  /** Key for the action */
  key: Scalars['String']['input'];
  /** Sub-actions for the action */
  subActions?: InputMaybe<Array<TaskSubActionsInput>>;
  /** Value for the action */
  value?: InputMaybe<Scalars['String']['input']>;
};

export type TaskActionMetaModel = MetaModel & {
  __typename?: 'TaskActionMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** Key for the action */
  key: MetaString;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
  /** Value for the above specified key */
  value: MetaString;
};

export type TaskError = {
  __typename?: 'TaskError';
  /** error code */
  code?: Maybe<Scalars['String']['output']>;
  /** Id of the task */
  id?: Maybe<Scalars['ID']['output']>;
  /** A description of the error */
  message: Scalars['String']['output'];
  /** Name of the task */
  name?: Maybe<Scalars['String']['output']>;
  /** error type */
  type?: Maybe<Scalars['String']['output']>;
};

export type TaskFile = {
  __typename?: 'TaskFile';
  /** Timestamp of the created file */
  createdDate: Scalars['DateTime']['output'];
  /** Id of the file */
  id: Scalars['ID']['output'];
  /** Indicates who added the file agent/system or user */
  mappingAuthor: MappingAuthor;
  /** Name of the file */
  name: Scalars['String']['output'];
};

/** Input filter for the Task */
export type TaskFilter = {
  /**
   * Filter based on the task category
   * Eg: IFSP_ONBOARDING, PAY_TAXES, FORM_FILING
   */
  categories?: InputMaybe<StringFilter>;
  /** Filter based on the Task Id */
  id?: InputMaybe<IdFilter>;
  /** Filter based on the priority of the task */
  priority?: InputMaybe<IntFilter>;
  /** Filter based on the current status for the task */
  status?: InputMaybe<Array<TaskStatus>>;
  /**
   * Filter based on the type of the task
   * Eg: TASK, TODO, BLOCKER
   */
  type?: InputMaybe<Array<TaskType>>;
};

/** Metamodel for the task */
export type TaskMetaModel = MetaModel & {
  __typename?: 'TaskMetaModel';
  /** Actions for the task contains the required actions the user needs to perform to complete the task */
  action: TaskActionMetaModel;
  applicable: Scalars['Boolean']['output'];
  /**
   * Category of the task.
   * Eg: IFSP_ONBOARDING, PAY_TAXES, FORM_FILING
   */
  category: MetaEnum;
  /** Description for the task */
  description: MetaString;
  /** Date when the task is due */
  dueDate: MetaDate;
  /** Date when the task is expires */
  expiryDate: MetaDate;
  /** Pre-defined type of the task */
  itemType: MetaEnum;
  label: Scalars['String']['output'];
  /**
   * Name of the task.
   * Eg: E-sign legal authorization forms
   */
  name: MetaString;
  /** Priority of the task. Varies from 0 to 10 with 10 being the highest priority */
  priority: MetaEnum;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** Source data for the task */
  sourceVersion: TaskSourceVersionMetaModel;
  /** Current status of the task */
  status: MetaEnum;
  /**
   * Type of the task.
   * Eg: TASK, TODO, BLOCKER
   */
  type: MetaEnum;
  typeRef: Scalars['String']['output'];
};

/** Specifies the order in which the tasks should be returned */
export enum TaskOrderBy {
  DueDateAsc = 'dueDate_ASC',
  DueDateDesc = 'dueDate_DESC',
  PriorityAsc = 'priority_ASC',
  PriorityDesc = 'priority_DESC'
}

export type TaskSourceVersion = {
  __typename?: 'TaskSourceVersion';
  /** Client source Id of the task */
  clientId: Scalars['Int']['output'];
  /** Source version of the task */
  version: Scalars['Int']['output'];
};

export type TaskSourceVersionInput = {
  /** Client source Id of the task */
  clientId: Scalars['Int']['input'];
  /** Source version of the task */
  version: Scalars['Int']['input'];
};

export type TaskSourceVersionMetaModel = MetaModel & {
  __typename?: 'TaskSourceVersionMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** Client source Id of the task */
  clientId: MetaInt;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
  /** Source version of the task */
  version: MetaInt;
};

/** Defines the status of the task */
export enum TaskStatus {
  /** Task is under review by the agent */
  AgentReview = 'AGENT_REVIEW',
  /** Task is completed */
  Completed = 'COMPLETED',
  /** Task is not displayed to the user */
  DoNotDisplay = 'DO_NOT_DISPLAY',
  /** Task is not valid for this company */
  Invalid = 'INVALID',
  /** Task is in progress */
  InProgress = 'IN_PROGRESS',
  /** Task is in review from another service before completion */
  InReview = 'IN_REVIEW',
  /** Task needs to be reviewed by user due to missing information */
  MissingInfo = 'MISSING_INFO',
  /** Task is not started yet. This is the default staus */
  NotStarted = 'NOT_STARTED',
  /** Task is pending verification */
  Pending = 'PENDING',
  /** Task is skipped by the user */
  Skipped = 'SKIPPED',
  /** Task status is unknown */
  Unspecified = 'UNSPECIFIED'
}

export type TaskSubAction = {
  __typename?: 'TaskSubAction';
  /** Defines a list of sub-actions for a specific action for the task */
  items: Array<VariableStringField>;
};

export type TaskSubActionsInput = {
  /** List of sub-actions for the action */
  items: Array<VariableStringFieldInput>;
};

export enum TaskType {
  /** A blocker that prevents user from running payroll */
  Blocker = 'BLOCKER',
  /** Tasks for a company */
  Task = 'TASK',
  /** Ongoing todos for a company */
  Todo = 'TODO'
}

/** Includes current and total amounts contributed to a tax for the specific time period */
export type TaxAccumulationAmount = AccumulationAmount & {
  __typename?: 'TaxAccumulationAmount';
  /** Monetary amount of the tax to be withheld (for e.g. during a specific payroll run) */
  currentAmount: Scalars['Money']['output'];
  /** Monetary amount of income subject to tax */
  currentTaxableIncome?: Maybe<Scalars['Money']['output']>;
  /** Total monetary amount of the tax for given time period */
  toDateAmounts: Array<ToDateAmount>;
};

/** Metamodel to include current and total amounts contributed to a tax for time period */
export type TaxAccumulationAmountMetaModel = MetaModel & {
  __typename?: 'TaxAccumulationAmountMetaModel';
  applicable: Scalars['Boolean']['output'];
  currentAmount: MetaMoney;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  toDateAmounts: Array<ToDateAmountMetaModel>;
  typeRef: Scalars['String']['output'];
};

export type TaxAdjustmentDetail = PayrollLiabilityAdjustmentDetail & {
  __typename?: 'TaxAdjustmentDetail';
  /** Amount for the tax adjustment detail */
  amount: Scalars['Money']['output'];
  /** Display name for the tax adjustment detail */
  displayName: Scalars['String']['output'];
  /** Item Id key for the tax adjustment detail */
  itemIdKey: Scalars['String']['output'];
};

/** Error object with details for updating a tax agency credential */
export type TaxAgencyCredentialError = {
  __typename?: 'TaxAgencyCredentialError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type TaxCompensationDetailAggregation = {
  __typename?: 'TaxCompensationDetailAggregation';
  /** The breakdowns to provide compensation and tax details for each employee */
  employeeBreakdowns: Array<TaxCompensationDetailEmployeeBreakdown>;
  /** The tax item detail which is a formatted key to show the value and/or label */
  tax: Scalars['String']['output'];
  /** The total aggregation of compensations for each tax item */
  totalCompensationDetail: TaxCompensationSummaryReportCompensationDetail;
  /** The total aggregation of taxes for each tax item */
  totalTaxDetail: TaxCompensationSummaryReportTaxDetail;
};


export type TaxCompensationDetailAggregationTaxArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type TaxCompensationDetailEmployeeBreakdown = {
  __typename?: 'TaxCompensationDetailEmployeeBreakdown';
  /** The compensation detail for an employee */
  compensationDetail: TaxCompensationSummaryReportCompensationDetail;
  employee: TaxCompensationSummaryReportEmployeeDetail;
  /** The tax detail for an employee */
  taxDetail: TaxCompensationSummaryReportTaxDetail;
};

export type TaxCompensationDetailReport = {
  __typename?: 'TaxCompensationDetailReport';
  aggregationDetail?: Maybe<TaxCompensationDetailAggregation>;
  renderings?: Maybe<TaxCompensationDetailReportRenderings>;
};

export type TaxCompensationDetailReportEmployeeFilter = {
  workLocationId?: InputMaybe<IdFilter>;
  workersCompensationClass?: InputMaybe<StringFilter>;
};

/**
 * Specifies optional data for tax compensation detail report
 * that can be excluded from the rendering
 */
export enum TaxCompensationDetailReportExcelOptionalField {
  EmployeeHomeaddress = 'EMPLOYEE_HOMEADDRESS',
  EmployeeTaxidentifier = 'EMPLOYEE_TAXIDENTIFIER',
  TaxdetailPercentage = 'TAXDETAIL_PERCENTAGE'
}

/** Input fields for tax compensation detail report excel rendering */
export type TaxCompensationDetailReportExcelRenderInput = {
  /**
   * Specifies optional data to exclude while generating the excel report for tax compensation summary report
   * If not specified, all the data will be included by default
   */
  excludedFields?: InputMaybe<Array<TaxCompensationDetailReportExcelOptionalField>>;
};

export type TaxCompensationDetailReportFilter = {
  employee?: InputMaybe<TaxCompensationDetailReportEmployeeFilter>;
  payDate: PayslipPayDateFilter;
  tax: Scalars['String']['input'];
};

export type TaxCompensationDetailReportInput = {
  filterBy: TaxCompensationDetailReportFilter;
};

/**
 * Specifies optional data for tax compensation detail report
 * that can be excluded from the rendering
 */
export enum TaxCompensationDetailReportPdfOptionalField {
  EmployeeHomeaddress = 'EMPLOYEE_HOMEADDRESS',
  EmployeeTaxidentifier = 'EMPLOYEE_TAXIDENTIFIER',
  TaxdetailPercentage = 'TAXDETAIL_PERCENTAGE'
}

/** Input fields for tax compensation detail report pdf rendering */
export type TaxCompensationDetailReportPdfRenderInput = {
  /**
   * Specifies optional data to exclude while generating the pdf report for tax compensation summary report
   * If not specified, all the data will be included by default
   */
  excludedFields?: InputMaybe<Array<TaxCompensationDetailReportPdfOptionalField>>;
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. Add Defaults */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Tax compensation detail report data rendering detail */
export type TaxCompensationDetailReportRenderings = {
  __typename?: 'TaxCompensationDetailReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/** Tax compensation detail report data rendering detail */
export type TaxCompensationDetailReportRenderingsExcelArgs = {
  input?: InputMaybe<TaxCompensationDetailReportExcelRenderInput>;
};


/** Tax compensation detail report data rendering detail */
export type TaxCompensationDetailReportRenderingsPdfArgs = {
  input?: InputMaybe<TaxCompensationDetailReportPdfRenderInput>;
};

export type TaxCompensationSummaryAggregation = {
  __typename?: 'TaxCompensationSummaryAggregation';
  /** The breakdowns to provide compensation and tax details for each tax item */
  breakdowns: Array<TaxCompensationSummaryBreakdown>;
  /**
   * The key for the payment group to which the payment is due.
   * This is a formatted key to show the value and/or label.
   */
  paymentGroupType: Scalars['String']['output'];
  /** The total aggregation of taxes for each payment group */
  totalTaxDetail: TaxCompensationSummaryReportTaxDetail;
};


export type TaxCompensationSummaryAggregationPaymentGroupTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type TaxCompensationSummaryBreakdown = {
  __typename?: 'TaxCompensationSummaryBreakdown';
  /** The compensation detail for each tax item */
  compensationDetail: TaxCompensationSummaryReportCompensationDetail;
  /** The tax item detail which is a formatted key to show the value and/or label */
  tax: Scalars['String']['output'];
  /** The tax detail for each tax item */
  taxDetail: TaxCompensationSummaryReportTaxDetail;
};


export type TaxCompensationSummaryBreakdownTaxArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type TaxCompensationSummaryReport = {
  __typename?: 'TaxCompensationSummaryReport';
  aggregations?: Maybe<Array<TaxCompensationSummaryAggregation>>;
  renderings?: Maybe<TaxCompensationSummaryReportRenderings>;
};

export type TaxCompensationSummaryReportCompensationDetail = {
  __typename?: 'TaxCompensationSummaryReportCompensationDetail';
  /** Non-taxable compensation calculated by subtracting taxableCompensation from totalCompensation */
  excessCompensation: Scalars['Money']['output'];
  /** The compensation basis which are taxable */
  taxableCompensation: Scalars['Money']['output'];
  /** Total compensation which includes both taxable and non-taxable compensations */
  totalCompensation: Scalars['Money']['output'];
};

export type TaxCompensationSummaryReportEmployeeDetail = {
  __typename?: 'TaxCompensationSummaryReportEmployeeDetail';
  employeeId: Scalars['ID']['output'];
  firstName: Scalars['String']['output'];
  homeAddress?: Maybe<Common_Address>;
  lastName: Scalars['String']['output'];
  middleInitial?: Maybe<Scalars['String']['output']>;
  taxIdentifiers?: Maybe<Array<VariableStringField>>;
};


export type TaxCompensationSummaryReportEmployeeDetailTaxIdentifiersArgs = {
  sensitized?: InputMaybe<Scalars['Boolean']['input']>;
};

export type TaxCompensationSummaryReportEmployeeFilter = {
  workLocationId?: InputMaybe<IdFilter>;
  workersCompensationClass?: InputMaybe<StringFilter>;
};

export enum TaxCompensationSummaryReportExcelOptionalField {
  TaxdetailPercentage = 'TAXDETAIL_PERCENTAGE'
}

export type TaxCompensationSummaryReportExcelRenderInput = {
  /**
   * Specifies optional data to exclude while generating the excel report for tax compensation summary report
   * If not specified, all the data will be included by default
   */
  excludedFields?: InputMaybe<Array<TaxCompensationSummaryReportExcelOptionalField>>;
};

export type TaxCompensationSummaryReportFilter = {
  employee?: InputMaybe<TaxCompensationSummaryReportEmployeeFilter>;
  payDate: PayslipPayDateFilter;
};

export type TaxCompensationSummaryReportInput = {
  filterBy: TaxCompensationSummaryReportFilter;
};

export enum TaxCompensationSummaryReportPdfOptionalField {
  TaxdetailPercentage = 'TAXDETAIL_PERCENTAGE'
}

export type TaxCompensationSummaryReportPdfRenderInput = {
  /**
   * Specifies optional data to exclude while generating the pdf report for tax compensation summary report
   * If not specified, all the data will be included by default
   */
  excludedFields?: InputMaybe<Array<TaxCompensationSummaryReportPdfOptionalField>>;
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Tax compensation summary report data rendering detail */
export type TaxCompensationSummaryReportRenderings = {
  __typename?: 'TaxCompensationSummaryReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/** Tax compensation summary report data rendering detail */
export type TaxCompensationSummaryReportRenderingsExcelArgs = {
  input?: InputMaybe<TaxCompensationSummaryReportExcelRenderInput>;
};


/** Tax compensation summary report data rendering detail */
export type TaxCompensationSummaryReportRenderingsPdfArgs = {
  input?: InputMaybe<TaxCompensationSummaryReportPdfRenderInput>;
};

export type TaxCompensationSummaryReportTaxDetail = {
  __typename?: 'TaxCompensationSummaryReportTaxDetail';
  amount: Scalars['Money']['output'];
  /** Tax percentage calculated by diving tax amount with taxable compensation */
  percentage?: Maybe<Scalars['Float']['output']>;
};

/** A deduction contribution effective as of a specific date */
export type TaxDeductionContribution = CompositeContributiveDeduction & {
  __typename?: 'TaxDeductionContribution';
  /** The composite type this contribution is applicable to */
  compositeContributionType?: Maybe<Scalars['String']['output']>;
  /** Date on which these contribution rates will become active/ be active from */
  effectiveDate: Scalars['Date']['output'];
  /** Employee's contribution to this deduction */
  employeeContribution?: Maybe<EmployeeContribution>;
  /** Company's contribution to this deduction */
  employerContribution?: Maybe<EmployerContribution>;
  /** Maximum percentage required rules for this deduction */
  maxPercentageRequiredRules?: Maybe<Array<Maybe<MaxPercentageRequiredRules>>>;
  /** The list of reasons the contribution is not in compliance for the agency */
  messages: Array<TaxDeductionPolicyMessage>;
};


/** A deduction contribution effective as of a specific date */
export type TaxDeductionContributionCompositeContributionTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type TaxDeductionContributionInput = {
  /** The composite type this contribution is applicable to */
  compositeContributionType?: InputMaybe<Scalars['String']['input']>;
  /** Date on which these contribution rates will become active/ be active from */
  effectiveDate: Scalars['Date']['input'];
  /** Employee's contribution to this deduction */
  employeeContribution: CreateEmployeeContributionInput;
  /** Company's contribution to this deduction */
  employerContribution: CreateEmployerContributionInput;
};

export type TaxDeductionContributionMetaModel = MetaModel & {
  __typename?: 'TaxDeductionContributionMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** The composite type this contribution is applicable to */
  compositeContributionType: MetaString;
  /** Allowed effective dates for this contribution */
  effectiveDate: MetaDate;
  /** The meta model for employee contribution */
  employeeContribution: EmployeeContributionMetaModel;
  /** The meta model for employer contribution */
  employerContribution: EmployerContributionMetaModel;
  label: Scalars['String']['output'];
  /** Maximum percentage required rules for this deduction */
  maxPercentageRequiredRules?: Maybe<Array<Maybe<MaxPercentageRequiredRules>>>;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type TaxDeductionError = {
  __typename?: 'TaxDeductionError';
  /** error code */
  code?: Maybe<Scalars['String']['output']>;
  /** A description of the error */
  message: Scalars['String']['output'];
  /** error type */
  type?: Maybe<Scalars['String']['output']>;
};

/** Deduction policies that are configured by the employer and are mandated as a tax */
export type TaxDeductionPolicy = DeductionPolicy & Node & {
  __typename?: 'TaxDeductionPolicy';
  /** Determines this deduction category */
  category: Scalars['String']['output'];
  /** The deduction contributions associated with this policy */
  contributions: Array<TaxDeductionContribution>;
  /** The employee tax deductions associated with this policy */
  employeeTaxDeductions: Array<EmployeeTaxDeduction>;
  /** Tax deduction policy entity ID */
  id: Scalars['ID']['output'];
  /** The list of reasons the policy is not in compliance for the agency */
  messages: Array<TaxDeductionPolicyMessage>;
  /** The meta model for this tax deduction policy */
  metaModel: TaxDeductionPolicyMetaModel;
  /** The user-defined policy name/description */
  name: Scalars['String']['output'];
  /**
   * Unique identifier for this tax deduction policy
   * E.g. CUS_L1MA_PFML | Massachusetts Paid Family and Medical Leave
   */
  statutoryType: Scalars['String']['output'];
  /** SubCategory of this deduction */
  subCategory: Scalars['String']['output'];
  /** Indicates deduction is a pre-tax or post-tax */
  taxOption: TaxOption;
};


/** Deduction policies that are configured by the employer and are mandated as a tax */
export type TaxDeductionPolicyCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/** Deduction policies that are configured by the employer and are mandated as a tax */
export type TaxDeductionPolicyStatutoryTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


/** Deduction policies that are configured by the employer and are mandated as a tax */
export type TaxDeductionPolicySubCategoryArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type TaxDeductionPolicyMessage = Message & {
  __typename?: 'TaxDeductionPolicyMessage';
  /** Code to identify message */
  code: Scalars['String']['output'];
  /** Short description */
  message?: Maybe<Scalars['String']['output']>;
  /** Type of the message (Info, Warning, Blocker) */
  type: MessageType;
};

/** Meta model for Tax Deduction Policy */
export type TaxDeductionPolicyMetaModel = MetaModel & {
  __typename?: 'TaxDeductionPolicyMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** This deduction is only applicable for the given category/subcategory */
  categoryDetails: MetaDeductionPolicyApplicable;
  /** The deduction contributions associated with this policy */
  contributions: Array<TaxDeductionContributionMetaModel>;
  label: Scalars['String']['output'];
  /** The user-defined policy name/description */
  name: MetaString;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** The metamodel for statutoryType */
  statutoryType: MetaEnum;
  typeRef: Scalars['String']['output'];
};

export type TaxExemption = {
  __typename?: 'TaxExemption';
  /** The date from when this exemption applies, if null the company has not set the exemption */
  effectiveDate?: Maybe<Scalars['Date']['output']>;
  /** The tax that the exemption applies to e.g. TTAX_CUS_L1MA_EXEMPT_104 */
  exemptionCode: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** Flag indicating if you are exempt from this tax */
  isExempt: Scalars['Boolean']['output'];
};

/** Error object with details for updating a tax exemption */
export type TaxExemptionError = {
  __typename?: 'TaxExemptionError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Input type for filtering TaxExemptions */
export type TaxExemptionFilter = {
  types?: InputMaybe<Array<TaxExemptionType>>;
};

export type TaxExemptionMetaModel = MetaModel & {
  __typename?: 'TaxExemptionMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** Generic field to handle extensible exemptions like isChecked(Boolean), status(String) ... */
  attributes?: Maybe<Array<MetaVariableTypeField>>;
  /** Allowed effective dates for the exemption */
  effectiveDate?: Maybe<MetaDate>;
  /** The tax that the exemption applies to e.g. TTAX_CUS_L1MA_EXEMPT_104 */
  exemptionCode: MetaString;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Type of tax exemption. e.g commuteroptput/tax_exemptions */
export enum TaxExemptionType {
  /** Commuter opt out type */
  CommuterOptout = 'COMMUTER_OPTOUT',
  /** jurisdiction / tax payment group exemption type */
  JurisdictionExempt = 'JURISDICTION_EXEMPT',
  /** None exemption type */
  None = 'NONE',
  /** tax exemptions type */
  TaxExemptions = 'TAX_EXEMPTIONS'
}

/** Filings for a company that may or may not have been filed. */
export type TaxFiling = Node & {
  __typename?: 'TaxFiling';
  /** A tax payment that must be made with this filing, if applicable. This is the same association as Payroll_Payments_TaxPayment.associatedFiling but from the other direction. */
  associatedPayment?: Maybe<Payroll_Payments_TaxPayment>;
  /** Is/was the platform responsible for automatically making this filing. False indicates that this filing will be/was made manually by the user. */
  automatic: Scalars['Boolean']['output'];
  /** Filing methods available for this filing. Only relevent when the filing has not been submitted or archived yet. */
  availableFilingMethods: Array<TaxFilingMethod>;
  /** Documents representations of the filing */
  documents: Array<TaxFormDocument>;
  /** Due date set by the tax agency */
  dueDate?: Maybe<Scalars['Date']['output']>;
  /** Specific to electronic payments, will be null for paper filings. */
  electronicDetails?: Maybe<ElectronicTaxFilingDetails>;
  /** Adjustment details for the given filing */
  filingAdjustment?: Maybe<TaxFilingAdjustment>;
  /** Filing method of this filing. */
  filingMethod?: Maybe<TaxFilingMethod>;
  id: Scalars['ID']['output'];
  /** List of informational messages about this filing that provide some extra information to the customer, which could have an associated action */
  informationalMessages: Array<TaxFilingMessage>;
  /** The period of time this tax filing reports data for */
  period: TaxFilingDatePeriod;
  /** Current print status of the filing */
  printStatus?: Maybe<PrintStatus>;
  /** Whether this filing is ready to be filed. */
  readiness?: Maybe<TaxFilingReadiness>;
  /** Current status of the filing */
  status: TaxFilingStatus;
  /** Tax Form that this filing is an instance of */
  taxForm: TaxForm;
  /** List of warning messages about this filing that provide some extra information to the customer, and suggest a reason not make the filing, but which does not block it from being made */
  warningMessages: Array<TaxFilingMessage>;
};

/** An adjustable tax filling */
export type TaxFilingAdjustment = EntityInterface & {
  __typename?: 'TaxFilingAdjustment';
  /** THe xml tax form document that the adjustment is applied to */
  documents: Array<TaxFormDocument>;
  /** The associated IDs of the tax filing adjustment */
  externalIds?: Maybe<Array<Common_ExternalId>>;
  /** The ID of the tax filing adjustment */
  id: Scalars['ID']['output'];
  /** Metadata associated with the entity */
  meta?: Maybe<Common_Metadata>;
  /** Last modified by, modifiedBy must be in a common metadata type. Todo: Refactor per OIGQL standards */
  modifiedBy?: Maybe<Scalars['String']['output']>;
};

/** A connection to a list of items. */
export type TaxFilingConnection = {
  __typename?: 'TaxFilingConnection';
  edges?: Maybe<Array<Maybe<TaxFilingEdge>>>;
};

export type TaxFilingConnectionFilter = {
  filingPeriod?: InputMaybe<TaxFilingDatePeriodFilter>;
  /** The type of filing state, could either be ACTIVE or ARCHIVED e.g. ACTIVE for the status which is DUE_SOON, ARCHIVED for the status which is FILED. */
  filingStatusType?: InputMaybe<TaxFilingStatusType>;
  /** Use formTypes instead of this */
  formId?: InputMaybe<Scalars['String']['input']>;
  formTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** deprecated. reason: use filingPeriod instead */
  period?: InputMaybe<TaxFilingDatePeriodFilter>;
};

/** A period defining the start and end dates for a pay schedule. */
export type TaxFilingDatePeriod = Common_DatePeriod & {
  __typename?: 'TaxFilingDatePeriod';
  /** The first day of the filing period */
  beginDate: Scalars['Date']['output'];
  /** The end date of the filing period. */
  endDate: Scalars['Date']['output'];
};

/** Matches filing periods that fall within the range. */
export type TaxFilingDatePeriodFilter = {
  endDate?: InputMaybe<DateFilter>;
  startDate?: InputMaybe<DateFilter>;
};

export enum TaxFilingDocumentSigningType {
  /** Electronic Sign */
  Esign = 'ESIGN',
  None = 'NONE',
  /** Wet signing */
  Paper = 'PAPER'
}

/**
 * Response of the bulk update of employer tax setup signing. Attributes denote
 * the success of the mutation and the signing type used.
 */
export type TaxFilingDocumentsSignature = {
  __typename?: 'TaxFilingDocumentsSignature';
  signingSessionId?: Maybe<Scalars['String']['output']>;
  signingStatus: TaxFilingDocumentsSigningStatus;
  signingType: TaxFilingDocumentSigningType;
};

export type TaxFilingDocumentsSignatureUpdateError = {
  __typename?: 'TaxFilingDocumentsSignatureUpdateError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export enum TaxFilingDocumentsSigningStatus {
  Failed = 'FAILED',
  MarkForLater = 'MARK_FOR_LATER',
  Pending = 'PENDING',
  Signed = 'SIGNED'
}

/** An edge in a connection. */
export type TaxFilingEdge = {
  __typename?: 'TaxFilingEdge';
  /** The item at the end of the edge */
  node?: Maybe<TaxFiling>;
};

export type TaxFilingError = {
  __typename?: 'TaxFilingError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Frequency that a form must be filed */
export enum TaxFilingFrequency {
  Monthly = 'MONTHLY',
  /** This value represents that there is no periodic filing frequency for the form. e.g. a tax payment coupon or an employee setup form. */
  None = 'NONE',
  Quarterly = 'QUARTERLY',
  Semimonthly = 'SEMIMONTHLY',
  Weekly = 'WEEKLY',
  Yearly = 'YEARLY'
}

/** A message about this filing to show to a user, which might or might not be actionable. */
export type TaxFilingMessage = {
  __typename?: 'TaxFilingMessage';
  action?: Maybe<UserActionable>;
  description: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
};

/** Options for how a filing can be filed */
export enum TaxFilingMethod {
  /** E-File submission that is transmitted to the agency through QuickBooks */
  Electronic = 'ELECTRONIC',
  /** Sumbission by the customer, outside of QuickBooks, either by print & mail, or direct entry on a tax agency's website */
  Manual = 'MANUAL'
}

/** Exact filing period input. */
export type TaxFilingPeriod = {
  endDate: Scalars['Date']['input'];
  startDate: Scalars['Date']['input'];
};

/** Whether this specific filing is ready to be filed. */
export type TaxFilingReadiness = Readiness & {
  __typename?: 'TaxFilingReadiness';
  /** Reasons that the filing is not ready to be filed */
  deficiencies: Array<ReadinessDeficiency>;
  /** If ready is false, deficiencies will be non-empty */
  ready: Scalars['Boolean']['output'];
};

export enum TaxFilingState {
  Accepted = 'ACCEPTED',
  Automatic = 'AUTOMATIC',
  DueSoon = 'DUE_SOON',
  Filed = 'FILED',
  NotDueYet = 'NOT_DUE_YET',
  PastDue = 'PAST_DUE',
  ReadyToFile = 'READY_TO_FILE',
  Rejected = 'REJECTED',
  Submitted = 'SUBMITTED'
}

export type TaxFilingStatus = {
  __typename?: 'TaxFilingStatus';
  /** The date this filingStatus status came into effect */
  effectiveDate: Scalars['Date']['output'];
  filingStatus: TaxFilingState;
  /** Provides the reason/code for a filing in REJECTED state */
  rejectionReason?: Maybe<Scalars['String']['output']>;
  /** The date in which the form has been submitted to the agency */
  submissionDate?: Maybe<Scalars['Date']['output']>;
};

export enum TaxFilingStatusType {
  Active = 'ACTIVE',
  Archived = 'ARCHIVED'
}

/** A payroll tax form that can be filed, contains no customer data but rather describes the form */
export type TaxForm = {
  __typename?: 'TaxForm';
  /** Short description of what data the form reports, and how it is filed */
  description: Scalars['String']['output'];
  /** Detailed description of taxform, any instructions on how to manually file it. */
  detailedDescription?: Maybe<Scalars['String']['output']>;
  /** For periodic forms, the frequency at which the form needs to be filed. For forms that have no periodic filing frequency, this will have the value `NONE` (e.g. tax payment coupons and forms related to employee setup). */
  filingFrequency: TaxFilingFrequency;
  formId: Scalars['String']['output'];
  /** Specifies if the form can be manually adjusted by the user */
  isManuallyAdjustable?: Maybe<Scalars['Boolean']['output']>;
  /** The jurisdiction the form applies to */
  jurisdictionId: Scalars['JurisdictionID']['output'];
  /** The name of the form, as stored in the backend service */
  name: Scalars['String']['output'];
};

/** Represents different categories for template forms */
export enum TaxFormCategory {
  AcceleratedTax1 = 'ACCELERATED_TAX1',
  AcceleratedTax2 = 'ACCELERATED_TAX2',
  EmployeeSetup = 'EMPLOYEE_SETUP',
  EmployerSetup = 'EMPLOYER_SETUP',
  MonthlyTax = 'MONTHLY_TAX',
  QuarterlyTax = 'QUARTERLY_TAX'
}

/** Details of tax form delivery preferences */
export type TaxFormDeliveryPreference = {
  __typename?: 'TaxFormDeliveryPreference';
  /** Tax Form details this delivery preference applies to */
  form: TaxForm;
  /** Enum specifying the delivery preferences for the tax form */
  preference: VariableEnumField;
};

/** A document representation of a completed tax form which may be part of a filing, or presented to the user as a stand-alone document */
export type TaxFormDocument = {
  /** Attributes specific to the document will be returned as name value pairs */
  attributes: Array<VariableTypeField>;
  /** File rendering for the associated taxForm, it includes the generated file url */
  rendering: FileRendering;
  /** The associated tax form for the document/rendering */
  taxForm: TaxForm;
};

export type TaxFormPrintingPreference = {
  __typename?: 'TaxFormPrintingPreference';
  /** Tax Form that this printing preference applies to */
  form: TaxForm;
  /** MetaModel representing fields with multiple allowed values for TaxFormPrintingPreference */
  metamodel: TaxFormPrintingPreferenceMetaModel;
  /** Enum specifying the printing prefernce. For example, for W2 forms, this could be THREE_PART_PERFORATED_PAPER, FOUR_PART_PERFORATED_PAPER, or NO_PREFERENCE */
  preference: VariableEnumField;
};

export type TaxFormPrintingPreferenceMetaModel = MetaModel & {
  __typename?: 'TaxFormPrintingPreferenceMetaModel';
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  /** The metamodel representing the allowed values for the printingPreference for the tax form */
  preference: MetaEnum;
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Tax Identification Number Issued by the Government */
export type TaxIdentifier = Node & {
  __typename?: 'TaxIdentifier';
  id: Scalars['ID']['output'];
  /** The type of the Tax Identifier used either for Business (FEIN/WH/SUI/etc) or Individual(SSN/SIN/NI) */
  taxIdentifierType: Scalars['String']['output'];
  /**
   * The value for the particular tax identifier being specified
   * The tax identifier value is used for filing taxes. By default the values are sensitized (partially obfuscated)
   * to protect privacy, but the full plain text value can be requested by specifying through the argument.
   */
  value?: Maybe<Scalars['String']['output']>;
};


/** Tax Identification Number Issued by the Government */
export type TaxIdentifierTaxIdentifierTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** Error object with details for updating a tax identifier */
export type TaxIdentifierError = {
  __typename?: 'TaxIdentifierError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Tax Identification Number Issued by the Government */
export type TaxIdentifierInput = {
  /** The type of the Tax Identifier used for Business (FEIN) */
  taxIdentifierType: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

/** Defines the Tax Identifier validation types */
export enum TaxIdentifierValidationType {
  /** Check for Duplicate EIN */
  Duplicate = 'DUPLICATE',
  /** Check for EIN-Legal Name validity */
  Legalname = 'LEGALNAME'
}

export type TaxInformation = HealthCoverageBenefitCost | RetirementBenefit;

export type TaxInformationInput = {
  /**
   * Only one of these inputs will be used depending upon if its a pension info update, benefit tax info update, or
   * tax reporting attribute update
   */
  healthCoverageBenefitCost?: InputMaybe<HealthCoverageBenefitCostInput>;
  retirementBenefit?: InputMaybe<RetirementBenefitInput>;
};

/** Details of tax item */
export type TaxItem = {
  __typename?: 'TaxItem';
  /** ID of the tax item */
  id: Scalars['ID']['output'];
  /** Jurisdiction Id of the tax item */
  jurisdictionId: Scalars['JurisdictionID']['output'];
  /** Statutory type for tax item */
  type: Scalars['String']['output'];
};


/** Details of tax item */
export type TaxItemTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type TaxItemInput = {
  /** ID of the tax item */
  id: Scalars['ID']['input'];
  /** Jurisdiction Id of the tax item */
  jurisdictionId: Scalars['JurisdictionID']['input'];
  /** Label for tax item */
  label: Scalars['String']['input'];
  /** Value for tax item */
  value: Scalars['String']['input'];
};

export type TaxItemToAccountMapping = {
  __typename?: 'TaxItemToAccountMapping';
  /** The ledger account selected by the user for this specific tax item. */
  account: LedgerAccount;
  /** The employer tax item for which this account mapping refers to. */
  taxItem: EmployerTaxItem;
};

export type TaxItemToAccountMappingInput = {
  /**
   * A string to specify the name of the account in QBO which will be used when syncing the
   * tax expenses to QBO transactions.
   */
  accountName: Scalars['String']['input'];
  /** ID of a tax item for which this account mapping refers to. */
  taxItemId: Scalars['ID']['input'];
};

export type TaxLiabilitiesAccountMappingCurrentPreferenceInput = {
  /**
   * When input is provided, it sets the user preference to mapping tax liabilities at a tax group level.
   * Individual tax items bubble up to a tax payment group which signifies the agency being paid.
   * When mapped at this level, the entirety of liabilities towards a single tax payment group will be mapped to a single chosen ledger account.
   * If null, assumes an alternative input has been set.
   */
  accountsByTaxGroup?: InputMaybe<Array<TaxPaymentGroupToAccountMappingInput>>;
  /**
   * When input is provided, it sets the user preference to mapping tax liabilities at a tax item level.
   * A tax item specifies a singular tax.
   * When mapped at this level, the liability corresponding to a singular tax will be mapped to the chosen ledger account.
   * If null, assumes an alternative input has been set.
   */
  accountsByTaxItem?: InputMaybe<Array<TaxItemToAccountMappingInput>>;
};

/** Account selected for export of tax liabilities. */
export type TaxLiabilitiesToAccountMappingInput = {
  currentPreference: TaxLiabilitiesAccountMappingCurrentPreferenceInput;
};

export type TaxLiabilityDateFilter = {
  dateRange?: InputMaybe<DateFilter>;
};

export type TaxLiabilityEmployeeFilter = {
  workersCompensationClass?: InputMaybe<StringFilter>;
};

/** Filter on tax liabilities generated from payslips */
export type TaxLiabilityPayslipFilter = {
  /** Filter on payslip based on employee's current information */
  employee?: InputMaybe<TaxLiabilityEmployeeFilter>;
  /** Filter on payslips based on work location */
  workLocation?: InputMaybe<PayslipWorkLocationFilter>;
};

export type TaxLiabilityReport = {
  __typename?: 'TaxLiabilityReport';
  /** List of tax items aggregated by their payment group type. */
  aggregations?: Maybe<Array<TaxLiabilityReportPaymentGroupAggregation>>;
  renderings?: Maybe<TaxLiabilityReportRenderings>;
};

export type TaxLiabilityReportBreakdown = {
  __typename?: 'TaxLiabilityReportBreakdown';
  /** The tax item detail which is a formatted key to show the value and/or label */
  tax: Scalars['String']['output'];
  /** The tax detail for each tax item */
  taxDetail: TaxLiabilityReportTaxDetail;
};


export type TaxLiabilityReportBreakdownTaxArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type TaxLiabilityReportExcelRenderInput = {
  /**
   * Specifies the ids/keys of the payment groups that should be excluded while generating the excel
   * If not specified, all payment group types data will be included by default
   */
  excludedPaymentGroupTypes?: InputMaybe<Array<Scalars['String']['input']>>;
};

/**
 * Filter tax liability period, work location for an employee when the paylsip was created,
 * and workers compensation class of the employee.
 */
export type TaxLiabilityReportFilter = {
  /** Filter on all tax liabilities that fall in the given date range */
  dateFilter: TaxLiabilityDateFilter;
  payslipFilter?: InputMaybe<TaxLiabilityPayslipFilter>;
};

export type TaxLiabilityReportInput = {
  filterBy: TaxLiabilityReportFilter;
};

export type TaxLiabilityReportPaymentGroupAggregation = {
  __typename?: 'TaxLiabilityReportPaymentGroupAggregation';
  /** The breakdowns to provide tax details for each tax item */
  breakdowns: Array<TaxLiabilityReportBreakdown>;
  /**
   * The key for the payment group to which the payment is due.
   * This is a formatted key to show the value and/or label.
   */
  paymentGroupType: Scalars['String']['output'];
  /** The total aggregation of taxes for each payment group */
  totalTaxDetail?: Maybe<TaxLiabilityReportTaxDetail>;
};


export type TaxLiabilityReportPaymentGroupAggregationPaymentGroupTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type TaxLiabilityReportPdfRenderInput = {
  /**
   * Specifies the ids/keys of the payment groups that should be excluded while generating the pdf
   * If not specified, all payment group types data will be included by default
   */
  excludedPaymentGroupTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Tax liability report data rendering detail */
export type TaxLiabilityReportRenderings = {
  __typename?: 'TaxLiabilityReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/** Tax liability report data rendering detail */
export type TaxLiabilityReportRenderingsExcelArgs = {
  input?: InputMaybe<TaxLiabilityReportExcelRenderInput>;
};


/** Tax liability report data rendering detail */
export type TaxLiabilityReportRenderingsPdfArgs = {
  input?: InputMaybe<TaxLiabilityReportPdfRenderInput>;
};

export type TaxLiabilityReportTaxDetail = {
  __typename?: 'TaxLiabilityReportTaxDetail';
  /** Tax withheld from paychecks as well as recorded tax payments */
  taxAmount: Scalars['Money']['output'];
  /** Total tax owed, calculated from both paychecks as well as recorded tax payments */
  taxOwed: Scalars['Money']['output'];
  /** Tax that has already been paid */
  taxPaid: Scalars['Money']['output'];
};

export enum TaxOption {
  /** Indicates that deduction is pre-tax */
  Pretax = 'PRETAX',
  /** Indicates that deduction is post-tax */
  Taxable = 'TAXABLE',
  /** Indicates that deduction tax option is unknown */
  Unknown = 'UNKNOWN'
}

/** Defines the possible different options for how tax overpayment amounts can be resolved. */
export enum TaxOverpaymentResolutionMethod {
  /** where the overpaid amount is resolved by being applied as funds toward the next tax period */
  ApplyForward = 'APPLY_FORWARD',
  /** where the overpaid amount is resolved by being credited back to the original account */
  Refund = 'REFUND'
}

export type TaxPaymentElectronicEnrollmentDetails = {
  __typename?: 'TaxPaymentElectronicEnrollmentDetails';
  /** Any corresponding enrollment events, such as authorizationRequestSubmission and agencyRequestSubmission */
  enrollmentEvent?: Maybe<Array<Maybe<TaxPaymentElectronicEnrollmentEvent>>>;
  /** The time enrollment should be completed in */
  enrollmentLeadTime: Scalars['String']['output'];
};

export type TaxPaymentElectronicEnrollmentEvent = {
  __typename?: 'TaxPaymentElectronicEnrollmentEvent';
  /** Date and time of the enrollment event */
  date?: Maybe<Scalars['DateTime']['output']>;
  /** Name of the enrollment event */
  name?: Maybe<Scalars['String']['output']>;
  /** Reason for the enrollment event */
  reason?: Maybe<TaxPaymentElectronicEnrollmentEventReason>;
};

export type TaxPaymentElectronicEnrollmentEventReason = {
  __typename?: 'TaxPaymentElectronicEnrollmentEventReason';
  /** Description of the reason */
  description?: Maybe<Scalars['String']['output']>;
  /** The category of the reason */
  type?: Maybe<ReasonCategory>;
};

/** Defines the Electronic Payment Status */
export enum TaxPaymentElectronicPaymentStatus {
  /** Customer has applied for electonic services and accepted by agency */
  Active = 'ACTIVE',
  /** Customer has applied for electonic services but not accepted by agency */
  Applied = 'APPLIED',
  /** Customer has not applied for electonic services */
  NotApplied = 'NOT_APPLIED'
}

export type TaxPaymentElectronicService = {
  __typename?: 'TaxPaymentElectronicService';
  /** Signing details of different documents */
  documentSigning: Array<ElectronicServiceDocumentSigningDetails>;
  /** Enrollment Details */
  enrollmentDetails?: Maybe<TaxPaymentElectronicEnrollmentDetails>;
  /** Electonic Payment Status */
  paymentStatus?: Maybe<TaxPaymentElectronicPaymentStatus>;
  /**
   * POA Status(Deprecated in favour of documentSigning.statuses)
   * @deprecated Field no longer supported
   */
  poaStatus?: Maybe<TaxPaymentGroupPoaStatus>;
};

/** Error object with details for a given operation that failed on a tax payment */
export type TaxPaymentError = {
  __typename?: 'TaxPaymentError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  taxPayment?: Maybe<Payroll_Payments_TaxPayment>;
  /** @deprecated Use taxPayment.id instead */
  taxPaymentId: Scalars['ID']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/**
 * Account selected for export of tax payment expenses. Input can be specified as one of the following:
 * Account selected may be specified as a single account for all transactions, or by employee, or by tax type.
 * This is a one-of tagged union type acting as an input union, one and only one of these fields must be non-null.
 */
export type TaxPaymentExpensesAccountMappingCurrentPreferenceInput = {
  /** updates the mode to BY_EMPLOYEE and sets the account mapping for each employee. */
  accountsByEmployee?: InputMaybe<Array<EmployeeToAccountMappingInput>>;
  /**
   * When input is provided, it sets the user preference to mapping tax expenses at a tax item level (BY_TAX_ITEM).
   * A tax item specifies a singular tax. When mapped at this level, the tax expense corresponding to a singular tax will be mapped to the chosen ledger account.
   * If null, assumes an alternative input has been set. Only 1 set of the inputs will be used.
   */
  accountsByTaxItem?: InputMaybe<Array<TaxItemToAccountMappingInput>>;
  /**
   * When input is provided, it sets the user preference to mapping tax expenses at a tax group level(BY_TAX_TYPE).
   * Individual tax items bubble up to a tax payment group which signifies the agency being paid.
   * When mapped at this level, the entirety of tax expenses towards a single tax payment group will be mapped to a single chosen ledger account.
   * If null, assumes an alternative input has been set. Only 1 set of the inputs will be used.
   */
  accountsByTaxType?: InputMaybe<Array<TaxPaymentGroupToAccountMappingInput>>;
  /** updates the mode to ONE_ACCOUNT and sets the same account for all tax payment expense transactions. */
  singleAccountName?: InputMaybe<Scalars['String']['input']>;
};

export type TaxPaymentExpensesAccountMappingSelectedDetail = {
  __typename?: 'TaxPaymentExpensesAccountMappingSelectedDetail';
  /** specifies the account mapping for the selected mode which can be any one of - one account, by employee or by tax type. */
  accountMapping: TaxPaymentExpensesToAccountMappingPreference;
  /** Tax payment account mapping may be to one account, or categorized by employee or by tax type. */
  mode: TaxPaymentExpensesToAccountMappingMode;
};

/**
 * Account selected for export of tax expenses.
 * Account mapping may be to one account, or categorized by employee or by tax type.
 */
export type TaxPaymentExpensesToAccountMapping = {
  __typename?: 'TaxPaymentExpensesToAccountMapping';
  byEmployee?: Maybe<TaxPaymentExpensesToAccountMappingByEmployee>;
  byTaxItem?: Maybe<TaxPaymentExpensesToAccountMappingByTaxItem>;
  byTaxType?: Maybe<TaxPaymentExpensesToAccountMappingByTaxType>;
  /** specifies the account mapping mode selected and expense to account mappings for the selected mode. */
  currentPreference: TaxPaymentExpensesAccountMappingSelectedDetail;
  oneAccount?: Maybe<TaxPaymentExpensesToAccountMappingOneAccount>;
};

export type TaxPaymentExpensesToAccountMappingByEmployee = {
  __typename?: 'TaxPaymentExpensesToAccountMappingByEmployee';
  /** Account selected for export of tax expenses categorized by employee. */
  accountsByEmployee: Array<EmployeeToAccountMapping>;
};

export type TaxPaymentExpensesToAccountMappingByTaxItem = {
  __typename?: 'TaxPaymentExpensesToAccountMappingByTaxItem';
  /**
   * This retrieves the list of individual employer tax items and the corresponding ledger accounts chosen by the user when the
   * preference mode is set to "BY_TAX_ITEM" i.e. at the singular tax item level.
   * If empty, it means that an alternative preference is being used.
   */
  accountsByTaxItem: Array<TaxItemToAccountMapping>;
};

export type TaxPaymentExpensesToAccountMappingByTaxType = {
  __typename?: 'TaxPaymentExpensesToAccountMappingByTaxType';
  /** Account selected for export of tax expenses categorized by tax type. */
  accountsByTaxType: Array<TaxPaymentGroupToAccountMapping>;
};

/** Account selected for export of tax payment expenses. */
export type TaxPaymentExpensesToAccountMappingInput = {
  currentPreference: TaxPaymentExpensesAccountMappingCurrentPreferenceInput;
};

/**
 * List of account mapping modes to map the employer Tax expenses to ledger accounts.
 * ONE_ACCOUNT : All employer tax expenses are mapped to a single account.
 * BY_EMPLOYEE : Each employee's employer tax expenses are mapped to an individual account.
 * BY_TAX_TYPE : Account mapping happens at the tax group level.
 * BY_TAX_ITEM : Account mapping happens at the tax item level.
 * Note: Individual tax items bubble up to a tax payment group which signifies the agency being paid.
 */
export enum TaxPaymentExpensesToAccountMappingMode {
  ByEmployee = 'BY_EMPLOYEE',
  ByTaxItem = 'BY_TAX_ITEM',
  ByTaxType = 'BY_TAX_TYPE',
  OneAccount = 'ONE_ACCOUNT'
}

export type TaxPaymentExpensesToAccountMappingOneAccount = {
  __typename?: 'TaxPaymentExpensesToAccountMappingOneAccount';
  /** Account selected for export of tax expenses */
  account: LedgerAccount;
};

export type TaxPaymentExpensesToAccountMappingPreference = TaxPaymentExpensesToAccountMappingByEmployee | TaxPaymentExpensesToAccountMappingByTaxItem | TaxPaymentExpensesToAccountMappingByTaxType | TaxPaymentExpensesToAccountMappingOneAccount;

export type TaxPaymentExportToAccountingError = ExportTransactionsToAccountingError & {
  __typename?: 'TaxPaymentExportToAccountingError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  /** The tax payment which failed with this error */
  taxPayment: Payroll_Payments_TaxPayment;
  type?: Maybe<Scalars['String']['output']>;
};

export type TaxPaymentGroupDeficiency = {
  __typename?: 'TaxPaymentGroupDeficiency';
  /** The kind of deficiency */
  status?: Maybe<TaxPaymentGroupDeficiencyStatus>;
  /** The entity type which has missing data or incorrect setup */
  type?: Maybe<TaxPaymentGroupDeficiencyType>;
};

export enum TaxPaymentGroupDeficiencyStatus {
  Blocked = 'BLOCKED',
  /** deprecated - will be removed in followup */
  EservicePendingFromAgency = 'ESERVICE_PENDING_FROM_AGENCY',
  /** deprecated - will be removed in followup */
  EserviceRejectedByAgency = 'ESERVICE_REJECTED_BY_AGENCY',
  MissingAuthform = 'MISSING_AUTHFORM',
  MissingInfo = 'MISSING_INFO',
  Pending = 'PENDING',
  Rejected = 'REJECTED'
}

export enum TaxPaymentGroupDeficiencyType {
  Bank = 'BANK',
  DepositFrequency = 'DEPOSIT_FREQUENCY',
  Eservice = 'ESERVICE',
  Policy = 'POLICY',
  TaxIdentifier = 'TAX_IDENTIFIER',
  TaxRate = 'TAX_RATE'
}

/** Defines the Power Of Attorney Signing Status */
export enum TaxPaymentGroupPoaStatus {
  /** All POA Forms are signed for the tax payment group */
  Complete = 'COMPLETE',
  /** Missing POA Forms for the tax payment group */
  Incomplete = 'INCOMPLETE',
  /** No POA Form is required for the tax payment group */
  NoPoaRequired = 'NO_POA_REQUIRED'
}

export type TaxPaymentGroupReadiness = {
  __typename?: 'TaxPaymentGroupReadiness';
  /** Deficiencies associated with the TPG if any */
  deficiencies: Array<TaxPaymentGroupDeficiency>;
  /** Readiness status of the tax payment group */
  status?: Maybe<TaxPaymentGroupReadinessStatus>;
};

export enum TaxPaymentGroupReadinessStatus {
  Exempt = 'EXEMPT',
  NotReady = 'NOT_READY',
  Ready = 'READY'
}

export type TaxPaymentGroupToAccountMapping = {
  __typename?: 'TaxPaymentGroupToAccountMapping';
  /** Account selected for tax expenses of the tax payment group. */
  account: LedgerAccount;
  taxPaymentGroup: EmployerTaxPaymentGroup;
};

export type TaxPaymentGroupToAccountMappingInput = {
  /** Account selected for tax payments or liabilities of the tax payment group */
  accountName: Scalars['String']['input'];
  taxPaymentGroupId: Scalars['ID']['input'];
};

export type TaxPaymentLiabilitiesAccountMappingSelectedPreference = {
  __typename?: 'TaxPaymentLiabilitiesAccountMappingSelectedPreference';
  /**
   * Retrieves the account mapping preference set by the user for mapping the tax liabilities to ledger accounts.
   * The account mapping is either at the tax group level or tax item level based on the user's selection of mapping mode.
   */
  accountMapping: TaxPaymentLiabilitiesToAccountMappingPreference;
  /**
   * Tax Liability account mapping can either happen at the tax payment group level(BY_TAX_GROUP)or at the individual tax item level (BY_TAX_ITEM).
   * Individual tax items bubble up to a tax payment group which signifies the agency being paid.
   */
  mode: TaxPaymentLiabilitiesToAccountMappingMode;
};

export type TaxPaymentLiabilitiesToAccountMapping = {
  __typename?: 'TaxPaymentLiabilitiesToAccountMapping';
  byTaxGroup?: Maybe<TaxPaymentLiabilitiesToAccountMappingByTaxGroup>;
  byTaxItem?: Maybe<TaxPaymentLiabilitiesToAccountMappingByTaxItem>;
  /** The existing preference set by the user to map the tax liabilities to ledger accounts. */
  currentPreference: TaxPaymentLiabilitiesAccountMappingSelectedPreference;
};

export type TaxPaymentLiabilitiesToAccountMappingByTaxGroup = {
  __typename?: 'TaxPaymentLiabilitiesToAccountMappingByTaxGroup';
  /**
   * This retrieves the list of individual employer tax items and the corresponding ledger accounts chosen by the user when the
   * preference mode is set to "BY_TAX_GROUP" i.e. at the tax group level.
   * If empty, it means that an alternative preference is being used.
   */
  accountsByTaxGroup: Array<TaxPaymentGroupToAccountMapping>;
};

export type TaxPaymentLiabilitiesToAccountMappingByTaxItem = {
  __typename?: 'TaxPaymentLiabilitiesToAccountMappingByTaxItem';
  /**
   * This retrieves the list of individual employer tax items and the corresponding ledger accounts chosen by the user when the
   * preference mode is set to "BY_TAX_ITEM" i.e. at the singular tax item level.
   * If empty, it means that an alternative preference is being used.
   */
  accountsByTaxItem: Array<TaxItemToAccountMapping>;
};

/**
 * List of account mapping modes to map the tax liabilities to ledger accounts.
 * BY_TAX_TYPE : Account mapping happens at the tax group level.
 * BY_TAX_ITEM : Account mapping happens at the tax item level.
 * Note: Individual tax items bubble up to a tax payment group which signifies the agency being paid.
 */
export enum TaxPaymentLiabilitiesToAccountMappingMode {
  ByTaxGroup = 'BY_TAX_GROUP',
  ByTaxItem = 'BY_TAX_ITEM'
}

export type TaxPaymentLiabilitiesToAccountMappingPreference = TaxPaymentLiabilitiesToAccountMappingByTaxGroup | TaxPaymentLiabilitiesToAccountMappingByTaxItem;

/** A message about this payment to show to a user, which may also be actionable. */
export type TaxPaymentMessage = {
  __typename?: 'TaxPaymentMessage';
  action?: Maybe<UserActionable>;
  description: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
};

export type TaxPaymentMetaModel = MetaModel & {
  __typename?: 'TaxPaymentMetaModel';
  applicable: Scalars['Boolean']['output'];
  deletable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  sourceSystem?: Maybe<Scalars['String']['output']>;
  typeRef: Scalars['String']['output'];
};

/** Whether this specific payment is ready to be made, and if not, what actions need to be taken first. */
export type TaxPaymentReadiness = Readiness & {
  __typename?: 'TaxPaymentReadiness';
  deficiencies: Array<ReadinessDeficiency>;
  ready: Scalars['Boolean']['output'];
};

/**
 * A deficiency related to a specific tax payment that is impeding the readiness of another action/capability
 * (e.g. a tax filing, another tax payment).
 */
export type TaxPaymentReadinessDeficiency = ReadinessDeficiency & {
  __typename?: 'TaxPaymentReadinessDeficiency';
  /**
   * Describes this failing or shortcoming that is contributing to the lack of readiness, which relaties to a
   * specific tax payment, e.g. 'This tax payment must be submitted first'
   */
  description: Scalars['String']['output'];
  remediation?: Maybe<UserActionable>;
  taxPayment: Payroll_Payments_TaxPayment;
};

export type TaxPaymentTaxBreakdown = {
  __typename?: 'TaxPaymentTaxBreakdown';
  /**
   * Amount that was adjusted from the tax item amount, based on rounding or other agency rules
   * This will be null for normal payments
   */
  adjustmentAmount?: Maybe<Scalars['Money']['output']>;
  /** The tax item amount */
  amount: Scalars['String']['output'];
  /** The tax payment period end date */
  periodEndDate?: Maybe<Scalars['Date']['output']>;
  /** The tax item detail key */
  tax: Scalars['String']['output'];
  /** The tax item detail display name */
  taxDisplayName: Scalars['String']['output'];
  /** The CMS ID of the tax item */
  taxItemCmsId?: Maybe<Scalars['String']['output']>;
};

export type TaxPaymentTaxBreakdownInput = {
  /** The tax item amount */
  amount: Scalars['String']['input'];
  /** The tax item detail key */
  tax: Scalars['String']['input'];
  /** The CMS ID of the tax item */
  taxItemCmsId?: InputMaybe<Scalars['String']['input']>;
};

/** Error object with details for a given operation that failed on a tax preference */
export type TaxPreferenceError = {
  __typename?: 'TaxPreferenceError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type TaxPreferences = {
  __typename?: 'TaxPreferences';
  /** Automatic tax payment and filing preferences */
  autoTaxPreferences?: Maybe<AutoTaxPreferences>;
  /**
   * Enrollment preference for electronic tax services
   * Opting out will cancel the e-services enrollment process or un-enroll if previously applied
   */
  electronicTaxServicesPreferred: Scalars['Boolean']['output'];
  /**
   * Customer consent on the impounding of taxes
   * escrow is an alternate word used for impounding
   */
  escrowConsent?: Maybe<TaxPreferencesEscrowConsent>;
  /** Escrow Tax preferences information */
  escrowTaxPreferences?: Maybe<EscrowTaxPreferences>;
  /** MetaModel representing fields with multiple allowed values for TaxPreferences */
  metaModel?: Maybe<TaxPreferencesMetaModel>;
  /** Form delivery settings preferences */
  taxFormDeliveryPreferences: Array<TaxFormDeliveryPreference>;
  /** Form printing settings preferences */
  taxFormPrintingPreferences: Array<TaxFormPrintingPreference>;
};

/**
 * Customer consent on the (escrow) impounding of taxes
 * @deprecated Use TaxSetupAcknowledgement for new acknowledgement usecases
 */
export type TaxPreferencesEscrowConsent = {
  __typename?: 'TaxPreferencesEscrowConsent';
  /** Date when the Consent was given by customer */
  date?: Maybe<Scalars['Date']['output']>;
  /** Type of Customer Consent (Auto, Manual etc.) */
  type?: Maybe<TaxPreferencesEscrowConsentType>;
};

/** Options for TaxPreferencesEscrowConsentType */
export enum TaxPreferencesEscrowConsentType {
  /** Consent from Auto Payroll */
  Auto = 'AUTO',
  /** Consent from Manual Payroll */
  Manual = 'MANUAL',
  /** Consent not provided */
  NoConsent = 'NO_CONSENT',
  /** Consent fallback option */
  Unknown = 'UNKNOWN'
}

export type TaxPreferencesMetaModel = MetaModel & {
  __typename?: 'TaxPreferencesMetaModel';
  applicable: Scalars['Boolean']['output'];
  autoTaxPreferences: AutoTaxPreferencesMetaModel;
  electronicTaxServicesPreferred: MetaBoolean;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Defines the structure for tax registration information containing orders for an employer */
export type TaxRegistration = {
  __typename?: 'TaxRegistration';
  /** The tax registration orders placed by the employer */
  orders: Array<TaxRegistrationOrder>;
};


/** Defines the structure for tax registration information containing orders for an employer */
export type TaxRegistrationOrdersArgs = {
  filterBy?: InputMaybe<TaxRegistrationOrderFilter>;
};

/** Error object with details for creating state tax registration order */
export type TaxRegistrationError = {
  __typename?: 'TaxRegistrationError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Defines the structure for tax registration orders placed by an employer for a specific jurisdiction */
export type TaxRegistrationOrder = {
  __typename?: 'TaxRegistrationOrder';
  /** The order Id for the tax registration order */
  id: Scalars['ID']['output'];
  /** The ID of the jurisdiction for which the tax registration order was placed */
  jurisdictionId: Scalars['JurisdictionID']['output'];
  /** The message associated with the tax registration order */
  message: Scalars['String']['output'];
  /** The metamodel for order */
  metaModel: TaxRegistrationOrderMetaModel;
  /** The human readable number for the tax registration order from vendor */
  orderReference: Scalars['String']['output'];
  /** The status of the tax registration order */
  status: Scalars['String']['output'];
};

export type TaxRegistrationOrderBusinessAdditionalInfoInput = {
  key: Scalars['String']['input'];
  values: Array<VariableTypeFieldInput>;
};

/** Input object for providing business information required for creating a tax registration order */
export type TaxRegistrationOrderBusinessInfoInput = {
  /** Additional business information like llcInfo, nonProfitInfo, etc */
  additionalInfo: Array<TaxRegistrationOrderBusinessAdditionalInfoInput>;
  /** business code like NAICS code */
  businessCode: VariableTypeFieldInput;
  /** The category of the business */
  category: Scalars['String']['input'];
  /** A description of the business */
  description: Scalars['String']['input'];
  /** The type of entity for the business */
  entityType: Scalars['String']['input'];
  /** The fiscal year end for the business */
  fiscalYearEnd: Scalars['String']['input'];
  /** The date of formation for the business */
  formationDate: Scalars['Date']['input'];
  /** Indicates whether the business has employees outside of the country or not */
  hasAbroadEmployees: Scalars['Boolean']['input'];
  /** Indicates whether the legal entity of the business has changed or not */
  hasLegalEntityChanged: Scalars['Boolean']['input'];
  /** The jurisdiction where the business was incorporated */
  jurisdiction: Scalars['JurisdictionID']['input'];
  /** The mailing address of the business */
  mailingAddress: Common_AddressInput;
  /** The name of the business */
  name: Scalars['String']['input'];
  /** The primary address of the business in that jurisdiction */
  primaryAddress: Common_AddressInput;
  /** The responsible parties associated with the business */
  responsibleParties: Array<TaxRegistrationOrderResponsiblePartyInput>;
  /** The tax identifier input for the business, which is Federal in this case */
  taxIdentifier: TaxIdentifierInput;
  /** The "doing business as" name for the business (Required by the Agency) */
  tradeName: Scalars['String']['input'];
};

export type TaxRegistrationOrderFilter = {
  /**
   * Specifies a order id to be used to filter the list of tax registration info.
   * Only order with specific order id will be returned.
   * If not specified, all the orders will be returned.
   */
  id?: InputMaybe<IdFilter>;
  /**
   * Specifies a list of jurisdictions to be used to filter the tax registration orders.
   * Only TaxRegistration entities with a JurisdictionID matching one of those specified in this list will be included in the resulting list of tax registration orders.
   */
  jurisdictionId?: InputMaybe<Array<Scalars['JurisdictionID']['input']>>;
};

/** Input object for providing jurisdiction information required for creating a tax registration order */
export type TaxRegistrationOrderJurisdictionInfoInput = {
  /** The number of employees in the business in the jurisdiction */
  employeeCount: Scalars['Int']['input'];
  /** The date when the wages threshold was exceeded by the business in the jurisdiction */
  exceededWagesThresholdDate: Scalars['Date']['input'];
  /** The date when the first employee started working for the business in the jurisdiction */
  firstEmployeeWorkingDate: Scalars['Date']['input'];
  /** The amount of the first payroll for the business in the jurisdiction */
  firstPayrollAmount: Scalars['Money']['input'];
  /** The date of the first payroll for the business in the jurisdiction */
  firstPayrollDate: Scalars['Date']['input'];
  /** The jurisdiction for which the tax registration order is being created */
  jurisdiction: Scalars['JurisdictionID']['input'];
  /** The work locations for the business in the jurisdiction */
  workLocations: Array<TaxRegistrationOrderWorkLocationsInput>;
};

/** Input object for providing legal commercial information required for creating a state tax registration order */
export type TaxRegistrationOrderLegalCommercialInput = {
  /** The name of the company */
  companyName: Scalars['String']['input'];
  /** The email address of the company */
  emailAddress: EmailAddressInput;
  /** The phone number of the company */
  phone: Common_TelephoneInput;
  /** The tax identifier input for the company */
  taxIdentifier: TaxIdentifierInput;
};

/** Input object for providing legal individual information required for creating a state tax registration order */
export type TaxRegistrationOrderLegalIndividualInput = {
  /** The date of birth for the individual */
  dateOfBirth: Scalars['Date']['input'];
  /** The email address of the individual */
  emailAddress: EmailAddressInput;
  /** The first name of the individual */
  firstName: Scalars['String']['input'];
  /** The last name of the individual */
  lastName: Scalars['String']['input'];
  /** The middle initial of the individual, if any */
  middleInitial?: InputMaybe<Scalars['String']['input']>;
  /** The phone number of the individual */
  phone: Common_TelephoneInput;
  /** The suffix of the individual, if any */
  suffix?: InputMaybe<Scalars['String']['input']>;
  /** The ID for the individual */
  taxIdentifier: TaxIdentifierInput;
};

export type TaxRegistrationOrderMetaModel = MetaModel & {
  __typename?: 'TaxRegistrationOrderMetaModel';
  applicable: Scalars['Boolean']['output'];
  /** The key that indicates if the order can be cancelled */
  cancellable?: Maybe<Scalars['Boolean']['output']>;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Input object for providing responsible party information required for creating a state tax registration order */
export type TaxRegistrationOrderResponsiblePartyInput = {
  /** The address of the responsible party */
  address: Common_AddressInput;
  /** Indicates whether the responsible party is a signatory or not */
  isSignatory: Scalars['Boolean']['input'];
  /** The legal commercial information for the responsible party, if applicable */
  legalCommercial?: InputMaybe<TaxRegistrationOrderLegalCommercialInput>;
  /** The legal individual information for the responsible party */
  legalIndividual?: InputMaybe<TaxRegistrationOrderLegalIndividualInput>;
  /** The ownership percentage of the responsible party in the business */
  ownershipPercentage: Scalars['Int']['input'];
  /** The title of the responsible party */
  title: Scalars['String']['input'];
  /** The type of responsible party, such as an individual or company(entity) */
  type: ResponsiblePartyTypeEnum;
};

/** Input object for providing work location information required for creating a state tax registration order */
export type TaxRegistrationOrderWorkLocationsInput = {
  /** The address of the work location */
  address: Common_AddressInput;
  /** The type of address, such as home office, business office, etc (Required by Agency) */
  addressType: AddressTypeEnum;
  /** The number of employees working at the work location */
  employeeCount: Scalars['Int']['input'];
};

export type TaxReportingInfo = {
  __typename?: 'TaxReportingInfo';
  /** Name of the taxReporting information section. */
  name: Scalars['String']['output'];
  /** Tax Reporting information details. */
  taxInformation?: Maybe<TaxInformation>;
};

/** Tax setup acknowledgement stored in TSS */
export type TaxSetupAcknowledgement = {
  __typename?: 'TaxSetupAcknowledgement';
  /** Date when the acknowledgement was given by customer */
  date: Scalars['Date']['output'];
  /** Flow type indicating the UI flow */
  flowType: TaxSetupAcknowledgementFlowType;
  /** Type of acknowledgement (Auto, Manual, DIY_TAXES etc.) */
  type: TaxSetupAcknowledgementType;
};

/** Error returned when updating acknowledgement in TSS fails */
export type TaxSetupAcknowledgementError = {
  __typename?: 'TaxSetupAcknowledgementError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Options for TaxSetupAcknowledgementFlowType */
export enum TaxSetupAcknowledgementFlowType {
  AutoTaxConsent = 'AUTO_TAX_CONSENT'
}

/** Options for TaxSetupAcknowledgementType */
export enum TaxSetupAcknowledgementType {
  /** Acknowledgement from Auto Payroll */
  Auto = 'AUTO',
  /** Acknowledgement from DIY Taxes Payroll */
  DiyTaxes = 'DIY_TAXES',
  /** Acknowledgement from Manual Payroll */
  Manual = 'MANUAL'
}

export type TaxSetupControl = {
  __typename?: 'TaxSetupControl';
  /** Action type for the tax setup control */
  actionType: TaxSetupControlActionType;
  /** Attributes for the tax setup control */
  attributes: Array<TaxSetupControlAttribute>;
  /** Entity type for the tax setup control */
  entityType: TaxSetupControlEntityType;
  /** Reason for the tax setup control */
  reason: TaxSetupControlReasonCategory;
};

export enum TaxSetupControlActionType {
  Blocker = 'BLOCKER',
  Warning = 'WARNING'
}

export type TaxSetupControlAttribute = {
  __typename?: 'TaxSetupControlAttribute';
  key: Scalars['String']['output'];
  value: VariableTypeField;
};

/** Input for tax setup control attributes */
export type TaxSetupControlAttributeInput = {
  key: Scalars['String']['input'];
  value: VariableTypeFieldInput;
};

export enum TaxSetupControlEntityType {
  Runpayroll = 'RUNPAYROLL'
}

/** Error object for tax setup control operations */
export type TaxSetupControlError = {
  __typename?: 'TaxSetupControlError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Input type for filtering TaxSetupControls */
export type TaxSetupControlFilter = {
  entityType: TaxSetupControlEntityType;
};

/** Input for updating tax setup controls */
export type TaxSetupControlInput = {
  /** Action type for the tax setup control */
  actionType: TaxSetupControlActionType;
  /** Attributes for the tax setup control */
  attributes: Array<TaxSetupControlAttributeInput>;
  /** Company ID of the company */
  companyId: Scalars['ID']['input'];
  /** Entity type for the tax setup control */
  entityType: TaxSetupControlEntityType;
  /** Reason for the tax setup control */
  reason: TaxSetupControlReasonCategory;
};

export enum TaxSetupControlReasonCategory {
  EservicesNotReady = 'ESERVICES_NOT_READY'
}

/** Error object with details for updating a tax setup */
export type TaxSetupError = {
  __typename?: 'TaxSetupError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type TaxWithdrawalTaxBreakdown = {
  __typename?: 'TaxWithdrawalTaxBreakdown';
  /** The tax item amount */
  amount: Scalars['String']['output'];
  /** Date range noting the begin and end of the pay period */
  paymentPeriod?: Maybe<PayrollPaymentsTaxWithdrawalPeriod>;
  /** The name for tax item this payment belongs to */
  taxName: Scalars['String']['output'];
  /** The Id of the TaxPayment Group this payment belongs to */
  taxPaymentGroupId: Scalars['String']['output'];
  /** The group name for tax payment */
  taxPaymentGroupName: Scalars['String']['output'];
};

/** Identifies the text notification preference and if it is enabled or disabled */
export type TextNotification = {
  __typename?: 'TextNotification';
  /** Whether the notification is enabled or disabled for this type */
  enabled: Scalars['Boolean']['output'];
  /** Type of notification. Ex. AutoPayroll, DirectDeposit */
  notificationType: Scalars['String']['output'];
};


/** Identifies the text notification preference and if it is enabled or disabled */
export type TextNotificationNotificationTypeArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

/** Text notification channel used for text notifications */
export type TextNotificationChannel = {
  __typename?: 'TextNotificationChannel';
  /** Mobile number to be used for the notifications */
  mobileNumber: PhoneNumber;
  /** Different text notifications attached to this notification channel. Ex. DirectDeposit, AutoPayroll */
  textNotifications: Array<TextNotification>;
};

export type TimeBalance = {
  __typename?: 'TimeBalance';
  /** The total time that an employee has available to use for the given time off policy */
  currentBalance: UnitOfTime;
  /** The total time that an employee has already used during this year for the given time off policy */
  yearToDateTimeUsed: UnitOfTime;
};

export type TimeBalanceInput = {
  currentBalanceInHours: Scalars['Float']['input'];
};

/**
 * A format in which to represent a quantity of time.
 * This format expresses time, not as a decimal, but a breakdown of years, days, hours, seconds.
 * Fields can be 0 but not null
 */
export type TimeBreakdown = {
  __typename?: 'TimeBreakdown';
  days: Scalars['Int']['output'];
  hours: Scalars['Int']['output'];
  /**
   * Specifies whether the time specified in timeBreakdown is overall a negative or positive quantity of time
   * An overall quantity of time of 0 is nonnegative.
   */
  isNonNegative: Scalars['Boolean']['output'];
  minutes: Scalars['Int']['output'];
  seconds: Scalars['Int']['output'];
  years: Scalars['Int']['output'];
};

export enum TimeOffAccrualFrequency {
  /** Accrual frequency where the accrualValue is accumulated by customer entry */
  Manual = 'MANUAL',
  /** Accrual frequency where the accrualValue is accumulated on the anniversary of an employee's hire date */
  OnHireDate = 'ON_HIRE_DATE',
  /** Accrual frequency where the accrualValue is accumulated once a year on start of year(January 1st) */
  OnYearStart = 'ON_YEAR_START',
  /** Accrual frequency where the accrualValue is accumulated for every hour a worker works */
  PerHourWorked = 'PER_HOUR_WORKED',
  /** Accrual frequency where the accrualValue is accumulated at the end of a pay period */
  PerPayPeriod = 'PER_PAY_PERIOD',
  /** Accrual frequency where the accrualValue is accumulated every year */
  Yearly = 'YEARLY'
}

export type TimeOffAccrualPolicyDetail = {
  __typename?: 'TimeOffAccrualPolicyDetail';
  /** Enum that is used to define the frequency of when accrual should occur */
  accrualFrequency: TimeOffAccrualFrequency;
  /** The time quantity that will be accrued at the specified accrual frequency */
  accrualValue: UnitOfTime;
  /** Boolean indicating whether employees can request time off that makes their balance negative */
  allowNegativeBalance?: Maybe<Scalars['Boolean']['output']>;
  /**
   * The time quantity that defines the upper limit for hours a worker can accrue before not being allowed to accrue any more
   * Null value implies that there is no upper limit of hours a worker can accrue
   */
  maxAccruable?: Maybe<UnitOfTime>;
  timeOffAccrualRule?: Maybe<TimeOffAccrualRule>;
  timeOffAccrualTier?: Maybe<TimeOffAccrualTier>;
  timeOffCarryOver?: Maybe<TimeOffCarryOver>;
};

export type TimeOffAccrualPolicyDetailInput = {
  accrualFrequency: TimeOffAccrualFrequency;
  /**
   * The string defines the month and day on which the accrual will reset
   * If AccrualFrequency is CUSTOM_DATE, then value is mandatory
   * The value must follow the format MM/DD such as "01/20" for Janaury 20th
   */
  accrualResetDay?: InputMaybe<Scalars['String']['input']>;
  /** On this date the employee's accrual balances will be reset based on policy carryover limit configuration */
  accrualResetFrequency?: InputMaybe<AccrualResetFrequency>;
  accrualValueInHours: Scalars['Float']['input'];
  /** Indicates if a given time-off policy can allow the current year to carry over balances to next year */
  allowCarryOver?: InputMaybe<Scalars['Boolean']['input']>;
  /** Boolean indicating whether employees can request time off that makes their balance negative */
  allowNegativeBalance?: InputMaybe<Scalars['Boolean']['input']>;
  /** Determines whether unused balance can be carried over to next year during a reset date */
  carryOverAllUnusedBalance?: InputMaybe<Scalars['Boolean']['input']>;
  maxAccruableInHours?: InputMaybe<Scalars['Float']['input']>;
  /** Indicates maximum accrued balance that can be carried over to next year during a reset date */
  maxCarryOverBalance?: InputMaybe<Scalars['Float']['input']>;
  /** Indicates maximum time-off accrual balance allowed for a given year for an employee */
  yearlyMaxAccrualLimit?: InputMaybe<Scalars['Float']['input']>;
};

export type TimeOffAccrualRule = {
  __typename?: 'TimeOffAccrualRule';
  /**
   * The string defines the month and day on which the accrual will reset
   * If AccrualFrequency is CUSTOM_DATE, then value is mandatory
   * The value must follow the format MM/DD such as "01/20" for Janaury 20th
   */
  accrualResetDay?: Maybe<Scalars['String']['output']>;
  /**
   * This enum defines reset frequency type for a time-off accrual rule
   * On this date the employee's accrual balances will be reset based on policy carryover limit configuration
   */
  accrualResetFrequency?: Maybe<AccrualResetFrequency>;
};

export type TimeOffAccrualTier = {
  __typename?: 'TimeOffAccrualTier';
  /** Indicates if a given time-off policy can allow the current year carry over balances to next year */
  allowCarryOver?: Maybe<Scalars['Boolean']['output']>;
  /** Indicates maximum time-off accrual balance allowed for a given year for an employee */
  yearlyMaxAccrualLimit?: Maybe<Scalars['Float']['output']>;
};

export type TimeOffCarryOver = {
  __typename?: 'TimeOffCarryOver';
  /** Determines whether unused balance can be carried over to next year during a reset date */
  carryOverAllUnusedBalance?: Maybe<Scalars['Boolean']['output']>;
  /** Indicates maximum accrued balance that can be carried over to next year during a reset date */
  maxCarryOverBalance?: Maybe<Scalars['Float']['output']>;
};

export enum TimeOffCategory {
  BankedOvertime = 'BANKED_OVERTIME',
  Bereavement = 'BEREAVEMENT',
  CustomPaid = 'CUSTOM_PAID',
  CustomUnpaid = 'CUSTOM_UNPAID',
  JuryDuty = 'JURY_DUTY',
  LearningAndDevelopment = 'LEARNING_AND_DEVELOPMENT',
  PaidTimeOff = 'PAID_TIME_OFF',
  Sick = 'SICK',
  UnpaidTimeOff = 'UNPAID_TIME_OFF',
  Unspecified = 'UNSPECIFIED',
  Vacation = 'VACATION',
  Volunteer = 'VOLUNTEER',
  Weather = 'WEATHER'
}

export type TimeOffCategoryDetail = {
  __typename?: 'TimeOffCategoryDetail';
  /** A unique identifier for the category, for custom category it is a unique category identifier per company */
  categoryId: Scalars['ID']['output'];
  /** Indicates whether this is a custom time off category type */
  isCustomType: Scalars['Boolean']['output'];
  /** The time off category enum value associated with this category */
  label: TimeOffCategory;
  /** The display name of the time off category */
  name: Scalars['String']['output'];
  /** Indicates whether the timeOff type is paid or unpaid for the selected timeOff category */
  type: TimeOffType;
};

/** Input type for referencing an existing time off category when creating or updating a time off policy */
export type TimeOffCategoryInput = {
  /** The unique identifier of the category */
  categoryId: Scalars['ID']['input'];
  /** Indicates whether the time off category is a custom type */
  isCustomType: Scalars['Boolean']['input'];
  /** The time off category enum value (e.g., CUSTOM_PAID, CUSTOM_UNPAID) */
  label: TimeOffCategory;
};

/** Response payload for time off category mutations (create and update) */
export type TimeOffCategoryPayload = {
  __typename?: 'TimeOffCategoryPayload';
  /** The time off category details that were successfully created or updated */
  categoryDetail?: Maybe<TimeOffCategoryDetail>;
  /** Any errors that occurred during the mutation */
  userError?: Maybe<TimeOffCategoryUserError>;
};

export type TimeOffCategoryUserError = {
  __typename?: 'TimeOffCategoryUserError';
  categoryId?: Maybe<Scalars['ID']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

/** Report to show time off hours and monetary amount breakdowns of a time off policy for an employee */
export type TimeOffDetailsReport = {
  __typename?: 'TimeOffDetailsReport';
  /** The associated breakdowns for the time off policy and for the employee */
  breakdowns: Array<TimeOffDetailsReportBreakdown>;
  /** Emoloyee personal information for report */
  employeeDetail: PayrollReportEmployeeDetail;
  /** Employer time off policies for all employees in the company */
  employerTimeOffPolicies: Array<EmployerTimeOffPolicy>;
  /** Perid detail with begin and end dates */
  periodDetail: PayrollReportPeriodDetail;
  /** Time off hours and monetary aggregation at the end of a period */
  periodEndPolicyDetails: Array<TimeOffDetailsReportPolicyDetail>;
  /** Time off hours and monetary amount balance before the start of the period */
  periodStartPolicyDetails?: Maybe<Array<TimeOffDetailsReportPolicyDetail>>;
  /** Time off detail report with report data rendering detail */
  renderings?: Maybe<TimeOffDetailsReportRenderings>;
};

/**
 * Monetary amount Accrued, Used and Remaining balance for a time off policy of an employee
 * This detail is available for Canada only.
 */
export type TimeOffDetailsReportAmountDetail = {
  __typename?: 'TimeOffDetailsReportAmountDetail';
  accrued?: Maybe<Scalars['Money']['output']>;
  balance: Scalars['Money']['output'];
  used?: Maybe<Scalars['Money']['output']>;
};

/** Breakdown information with hours and amount details */
export type TimeOffDetailsReportBreakdown = {
  __typename?: 'TimeOffDetailsReportBreakdown';
  /** Payslip id to navigate to payslip PDF for payslip type of breakdown only. It will not be present for adjustment. */
  payslipId?: Maybe<Scalars['ID']['output']>;
  /** Employer time off policy details with hours and monetary amount info impacted in this transation */
  timeOffPolicies: Array<TimeOffDetailsReportPolicyDetail>;
  /** It denotes the paydate for payslip type and creation data for adjustment type */
  transactionDate: Scalars['Date']['output'];
  /** Type is either Payslip or Adjustment. */
  transactionType: TimeOffDetailsReportTransactionType;
};

export type TimeOffDetailsReportFilter = {
  employeeId: Scalars['ID']['input'];
  payDate: PayslipPayDateFilter;
};

/** Hours Accrued, Used and Remaining balance for a time off policy of an employee */
export type TimeOffDetailsReportHoursDetail = {
  __typename?: 'TimeOffDetailsReportHoursDetail';
  accrued?: Maybe<UnitOfTime>;
  balance: UnitOfTime;
  used?: Maybe<UnitOfTime>;
};

export type TimeOffDetailsReportInput = {
  filterBy: TimeOffDetailsReportFilter;
};

/** Input fields for time off details report pdf rendering */
export type TimeOffDetailsReportPdfRenderInput = {
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Employer time off policy detail with hours and monetary amount info */
export type TimeOffDetailsReportPolicyDetail = {
  __typename?: 'TimeOffDetailsReportPolicyDetail';
  /** Monetary amount detail for time off policy applicable for Canada only */
  amountDetail?: Maybe<TimeOffDetailsReportAmountDetail>;
  /** The associated employer time off policy that dictates the rules governing this employee policy */
  employerTimeOffPolicy: EmployerTimeOffPolicy;
  /** Hours detail for time off policy applicable for both US and Canada */
  hoursDetail: TimeOffDetailsReportHoursDetail;
};

/** Returns renderings such as excel, pdf for time off details report */
export type TimeOffDetailsReportRenderings = {
  __typename?: 'TimeOffDetailsReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/** Returns renderings such as excel, pdf for time off details report */
export type TimeOffDetailsReportRenderingsPdfArgs = {
  input?: InputMaybe<TimeOffDetailsReportPdfRenderInput>;
};

/** Type enum for a time off policy detail breakdown. */
export enum TimeOffDetailsReportTransactionType {
  Adjustment = 'ADJUSTMENT',
  Payslip = 'PAYSLIP'
}

/** Specifies the types of time off that are possible. */
export enum TimeOffMethod {
  /**
   * Accrual of hours happens on a policy specified by frequency and rate.
   * The TimeOffAccrualPolicyDetail will be set as policyDetail on EmployerTimeOffPolicy.
   */
  AccrualTime = 'ACCRUAL_TIME',
  /**
   * Payout happens on a policy specified by rate. Employees are paid a dollar amount each check, rather than accruing any time off.  The amount is based on their vacationable earnings multiplied by the policy's rate.
   * The TimeOffPayOutPolicyDetail will be set as policyDetail on EmployerTimeOffPolicy.
   */
  Payout = 'PAYOUT',
  /** An unlimited amount of hours are available for consumption. Hours will not be accrued automatically at all, and there is no balance of accrued hours tracked. */
  UnlimitedTime = 'UNLIMITED_TIME'
}

export type TimeOffPayOutPolicyDetail = {
  __typename?: 'TimeOffPayOutPolicyDetail';
  /**
   * A percentage rate used to calculate vacation pay based off vacationable wages earned per pay period.
   * To specify 3.25%, provide 3.25. Limited to two decimal places.
   * Currently only applicable in Canada
   */
  payOutRate: Scalars['Float']['output'];
};

export type TimeOffPayOutPolicyDetailInput = {
  payOutRate: Scalars['Float']['input'];
};

/** Union of possible types that TimeOffPolicyDetail can return, TimeOffAccrualPolicyDetail or TimeOffPayOutPolicyDetail */
export type TimeOffPolicyDetail = TimeOffAccrualPolicyDetail | TimeOffPayOutPolicyDetail;

/** This input type provides the options for specifying timeoff policy details, and all of the options are mutually exclusive. Must specify one and only one of the fields in the input, i.e. only one of the input fields should be non-null. */
export type TimeOffPolicyDetailInput = {
  accrual?: InputMaybe<TimeOffAccrualPolicyDetailInput>;
  payOut?: InputMaybe<TimeOffPayOutPolicyDetailInput>;
};

export type TimeOffPolicyError = {
  __typename?: 'TimeOffPolicyError';
  code?: Maybe<Scalars['String']['output']>;
  employeeId?: Maybe<Scalars['String']['output']>;
  employeeTimeOffPolicyId?: Maybe<Scalars['String']['output']>;
  employerTimeOffPolicyId?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type TimeOffPolicyFilter = {
  /** Filter by policy IDs with support for multiple operations */
  policyId?: InputMaybe<TimeOffPolicyIdFilter>;
  /** Request additional recommendation data in the response */
  recommendations?: InputMaybe<Scalars['Boolean']['input']>;
};

export type TimeOffPolicyIdFilter = {
  /** Exact match for a single policy ID */
  eq?: InputMaybe<Scalars['ID']['input']>;
  /** Match any of the provided policy IDs */
  in?: InputMaybe<Array<Scalars['ID']['input']>>;
};

export type TimeOffReportEmployeeFilter = {
  employeeId?: InputMaybe<IdFilter>;
  employmentStatus?: InputMaybe<EmploymentStatusFilter>;
};

/** Report to show time off policy summary details for each employee of a company. */
export type TimeOffSummaryReport = {
  __typename?: 'TimeOffSummaryReport';
  employeeBreakdowns?: Maybe<TimeOffSummaryReportConnection>;
  /** Employer time off policies for all employees in the company */
  employerTimeOffPolicies: Array<EmployerTimeOffPolicy>;
  /** Time off summary report with report data rendering detail */
  renderings?: Maybe<TimeOffSummaryReportRenderings>;
};


/** Report to show time off policy summary details for each employee of a company. */
export type TimeOffSummaryReportEmployeeBreakdownsArgs = {
  pagination?: InputMaybe<PaginationInput>;
};

export type TimeOffSummaryReportConnection = {
  __typename?: 'TimeOffSummaryReportConnection';
  edges?: Maybe<Array<Maybe<TimeOffSummaryReportEdge>>>;
  pageInfo: PageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type TimeOffSummaryReportEdge = {
  __typename?: 'TimeOffSummaryReportEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<TimeOffSummaryReportNode>;
};

export type TimeOffSummaryReportFilter = {
  employee: TimeOffReportEmployeeFilter;
};

export type TimeOffSummaryReportInput = {
  filterBy: TimeOffSummaryReportFilter;
};

export type TimeOffSummaryReportNode = {
  __typename?: 'TimeOffSummaryReportNode';
  /** Details for an employee with id, first name, last name and middle initial and employment status. */
  employeeDetail: PayrollReportEmployeeDetail;
  /** Employee time off policies dictate the available balances of time an employee can take towards each time off policies set by the employer */
  timeOffPolicies?: Maybe<Array<EmployeeTimeOffPolicy>>;
};

/** Input fields for time off summary report pdf rendering */
export type TimeOffSummaryReportPdfRenderInput = {
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Returns renderings such as excel, pdf for time off summary report */
export type TimeOffSummaryReportRenderings = {
  __typename?: 'TimeOffSummaryReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/** Returns renderings such as excel, pdf for time off summary report */
export type TimeOffSummaryReportRenderingsPdfArgs = {
  input?: InputMaybe<TimeOffSummaryReportPdfRenderInput>;
};

export enum TimeOffType {
  Paid = 'PAID',
  Unpaid = 'UNPAID'
}

export type TimeWorkedInPeriod = {
  __typename?: 'TimeWorkedInPeriod';
  /** Represents amount of time worked in the specified sub period */
  amount?: Maybe<Scalars['Int']['output']>;
  /** Represents one of the possible sub period in the specified period */
  subPeriodDuration: SubPeriodDuration;
};

export type TimeWorkedInPeriodMetaModel = MetaModel & {
  __typename?: 'TimeWorkedInPeriodMetaModel';
  /** Represents amount of time worked in the specified sub period */
  amount: MetaInt;
  applicable: Scalars['Boolean']['output'];
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  /** Represents one of the possible sub period in the specified period */
  subPeriodDuration: MetaEnum;
  typeRef: Scalars['String']['output'];
};

/** Represents to-date amount for a specific time period (e.g. year-to-date or quarter-to-date) */
export type ToDateAmount = {
  __typename?: 'ToDateAmount';
  /** To-date monetary amount for time period */
  amount: Scalars['Money']['output'];
  /** Type of to-date amount */
  toDateAmountType: ToDateAmountType;
};

/** Metamodel to represents to-date amount for a specific time period (e.g. year-to-date or quarter-to-date) */
export type ToDateAmountMetaModel = MetaModel & {
  __typename?: 'ToDateAmountMetaModel';
  amount: MetaMoney;
  applicable: Scalars['Boolean']['output'];
  datePeriod: DatePeriodMetaModel;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  toDateAmountType: MetaEnum;
  typeRef: Scalars['String']['output'];
};

/** Represents type of to-date amount */
export enum ToDateAmountType {
  /** Represents month-to-date amount type */
  Month = 'MONTH',
  /** Represents quarter-to-date amount type */
  Quarter = 'QUARTER',
  /** Represents year-to-date amount type */
  Year = 'YEAR'
}

/**
 * Includes total employer and employee deduction contributions for the
 * employee payroll run
 */
export type TotalDeductions = {
  __typename?: 'TotalDeductions';
  /** Total employee deduction contributions for the employee payroll run */
  totalEmployeeContributions: Scalars['Money']['output'];
  /** Total employer deduction contributions for the employee payroll run */
  totalEmployerContributions: Scalars['Money']['output'];
};

export type TrackingClass = {
  __typename?: 'TrackingClass';
  className: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  /** subClass reference gives link to Tracking sub class. */
  subClass?: Maybe<TrackingClass>;
};

/** Payroll details data can be filtered by tracking classes */
export type TrackingClassFilter = {
  classId?: InputMaybe<IdFilter>;
  className?: InputMaybe<StringFilter>;
};

/** Currently selected account name preferences for exporting transactions to accounting software */
export type TransactionsToAccountMappingPreferences = {
  __typename?: 'TransactionsToAccountMappingPreferences';
  /** Bank checking account selected for export */
  bankAccount?: Maybe<LedgerAccount>;
  /** Account selected for export of reimbursement and contractor payment expenses */
  contractorPaymentExpensesAccount?: Maybe<LedgerAccount>;
  /** Account selected for export of contractor reimbursement expenses */
  contractorReimbursementExpensesAccount?: Maybe<LedgerAccount>;
  /** Account selected for export of payroll corrections, deduction assets or liabilities */
  deductions?: Maybe<Array<EmployerContributionToAccountMapping>>;
  /** Specifies list of account selected for export of employee compensation expenses. */
  employeeCompensationExpenses: EmployeeCompensationExpensesToAccountMapping;
  /** Account selected for export of payroll liabilities */
  employeeCompensationLiabilities?: Maybe<Array<EmployerCompensationToAccountMapping>>;
  /** Specifies list of account selected for export of employee reimbursement expenses. */
  employeeReimbursementExpenses?: Maybe<EmployeeReimbursementExpensesToAccountMapping>;
  /** Specifies list of account selected for export of company retirement, health insurance and non cash taxable benefit contribution expenses. */
  employerContributionExpenses?: Maybe<EmployerContributionExpensesToAccountMapping>;
  /** Impounding Bank Account for export */
  taxImpoundAccount?: Maybe<LedgerAccount>;
  /** Indicates the current user preference for mapping the tax liabilities to ledger accounts. */
  taxLiabilities: TaxPaymentLiabilitiesToAccountMapping;
  /** Specifies list of account selected for export of tax expenses. */
  taxPaymentExpenses: TaxPaymentExpensesToAccountMapping;
  /** Account selected for export of tax liabilities */
  taxPaymentLiabilities: Array<TaxPaymentGroupToAccountMapping>;
};

export type TransactionsToAccountMappingPreferencesMutationError = {
  __typename?: 'TransactionsToAccountMappingPreferencesMutationError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type TransactionsToClassMapping = TransactionsToClassMappingByWorker | TransactionsToOneClassMapping;

/** Specifies the class name assigned for all transactions by contractor. */
export type TransactionsToClassMappingByContractor = {
  __typename?: 'TransactionsToClassMappingByContractor';
  class?: Maybe<AccountingCategorizationClass>;
  contractor: Contractor;
};

export type TransactionsToClassMappingByContractorInput = {
  className: Scalars['String']['input'];
  contractorId: Scalars['ID']['input'];
};

/** Specifies the class name assigned for all transactions by employee. */
export type TransactionsToClassMappingByEmployee = {
  __typename?: 'TransactionsToClassMappingByEmployee';
  class?: Maybe<AccountingCategorizationClass>;
  employee: Employee;
};

export type TransactionsToClassMappingByEmployeeInput = {
  className: Scalars['String']['input'];
  employeeId: Scalars['ID']['input'];
};

/** Specifies the class name assigned for all transactions by worker. */
export type TransactionsToClassMappingByWorker = {
  __typename?: 'TransactionsToClassMappingByWorker';
  /** Specifies the class name assigned for transactions by each contractor. */
  classByContractor: Array<TransactionsToClassMappingByContractor>;
  /** Specifies the class name assigned for transactions by each employee. */
  classByEmployee: Array<TransactionsToClassMappingByEmployee>;
};

export type TransactionsToClassMappingByWorkerInput = {
  classByContractor?: InputMaybe<Array<TransactionsToClassMappingByContractorInput>>;
  /** Specifies class name assigned for each employee. */
  classByEmployee: Array<TransactionsToClassMappingByEmployeeInput>;
};

/** Specifies the class mapping current setup and class name for transactions if classes are assigned to transactions. */
export type TransactionsToClassMappingPreferences = {
  __typename?: 'TransactionsToClassMappingPreferences';
  /** Specifies the class name assigned for all payroll transactions by worker. */
  classByWorker?: Maybe<TransactionsToClassMappingByWorker>;
  currentPreference: SelectedClassTrackingDetail;
  /** Specifies the class name assigned for all payroll transactions. */
  oneClass?: Maybe<TransactionsToOneClassMapping>;
};

export type TransactionsToClassMappingPreferencesMutationError = {
  __typename?: 'TransactionsToClassMappingPreferencesMutationError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

/** Specifies the class name assigned for all transactions. */
export type TransactionsToOneClassMapping = {
  __typename?: 'TransactionsToOneClassMapping';
  class?: Maybe<AccountingCategorizationClass>;
};

/** The report returns un-exported transactions for Paycheck/Tax Payment/Contractor Payment */
export type UnexportedTransactionsReport = {
  __typename?: 'UnexportedTransactionsReport';
  contractorPaymentCount: Scalars['Int']['output'];
  contractorPayments: Array<ContractorPayment>;
  payslipCount: Scalars['Int']['output'];
  payslips: Array<Payslip>;
  taxPaymentCount: Scalars['Int']['output'];
  taxPayments: Array<Payroll_Payments_TaxPayment>;
};

export type UnexportedTransactionsReportInput = {
  beginDate: Scalars['Date']['input'];
  /** endDate can be at most 2 years after beginDate */
  endDate: Scalars['Date']['input'];
};

/**
 * Represents a quantity of time in different formats. Includes a decimal hours format as well as a time breakdown format.
 * Each field of this type describes the same single quantity of time that this object represents, but provides different formats of the same.
 */
export type UnitOfTime = {
  __typename?: 'UnitOfTime';
  /** A way to express the unit of time which is a breakdown of years, days, hours, seconds */
  timeBreakdown: TimeBreakdown;
  /**
   * Time expressed as decimal hours
   * Can be 0 or even negative but not null
   */
  timeInHours: Scalars['Float']['output'];
  /**
   * Duration of time expressed in the standard ISO 8601 duration extended format (PYYYY-MM-DDThh:mm:ss).
   * e.g. 'P0002-10-15T10:30:20', which represents a time interval with a duraiton of 2 years, 10 months, 15 days, 10 hours, 30 minutes, and 20 seconds.
   */
  timeInISOFormat: Scalars['String']['output'];
};

/** The input to update Accounting Export Preferences */
export type UpdateAccountingExportPreferencesInput = {
  companyId: Scalars['ID']['input'];
  defaultExportMode?: InputMaybe<AccountingExportMode>;
};

export type UpdateAccountingExportPreferencesPayload = {
  __typename?: 'UpdateAccountingExportPreferencesPayload';
  defaultExportMode?: Maybe<AccountingExportMode>;
};

export type UpdateActiveTaxYearStartDateInput = {
  activeTaxYearStartDate: Scalars['Date']['input'];
};

export type UpdateActiveTaxYearStartDatePayload = {
  __typename?: 'UpdateActiveTaxYearStartDatePayload';
  activeTaxYearStartDate?: Maybe<Scalars['Date']['output']>;
  userError?: Maybe<UpdateActiveTaxYearStartDateUserError>;
};

export type UpdateActiveTaxYearStartDateUserError = {
  __typename?: 'UpdateActiveTaxYearStartDateUserError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type UpdateAndAssignPayScheduleInput = {
  /** ID of the employee to assign to this pay schedule */
  employeeId: Scalars['ID']['input'];
  /** The details for the payschedule that will be assigned to this employee and also optionally updated */
  updateEmployerPaySchedule: UpdateEmployerPayScheduleInput;
};

export type UpdateAndAssignPaySchedulePayload = {
  __typename?: 'UpdateAndAssignPaySchedulePayload';
  /** Employee that was successfully assigned to the schedule */
  employee?: Maybe<Employee>;
  paySchedule?: Maybe<EmployerPaySchedule>;
  /** The previous default pay schedule for the employer. This will be non-null only in the case that the mutation changed which pay schedule is the employer's default. */
  priorDefaultPaySchedule?: Maybe<EmployerPaySchedule>;
  userError?: Maybe<PayScheduleError>;
};

/** Input for updating assigned preparer */
export type UpdateAssignedPreparerInput = {
  allowed: Scalars['Boolean']['input'];
  companyId: Scalars['ID']['input'];
  preparer?: InputMaybe<PreparerInput>;
};

/** Result of updateAssignedPreparer mutation */
export type UpdateAssignedPreparerPayload = {
  __typename?: 'UpdateAssignedPreparerPayload';
  assignedPreparer?: Maybe<AssignedPreparer>;
  userError?: Maybe<AssignedPreparerUserError>;
};

/** Input for updating assigned representative */
export type UpdateAssignedRepresentativeInput = {
  allowed: Scalars['Boolean']['input'];
  companyId: Scalars['ID']['input'];
  representative?: InputMaybe<RepresentativeInput>;
};

/** Result of updateAssignedRepresentative mutation */
export type UpdateAssignedRepresentativePayload = {
  __typename?: 'UpdateAssignedRepresentativePayload';
  assignedRepresentative?: Maybe<AssignedRepresentative>;
  userError?: Maybe<AssignedRepresentativeUserError>;
};

/** Input type to update a list of existing employee time off policy assignments */
export type UpdateBatchEmployeeTimeOffPoliciesInput = {
  /** ID of the employee */
  employeeId: Scalars['ID']['input'];
  /** Details of list of timeOff policy assignments to be updated */
  updateEmployeeTimeOffPoliciesDetails: Array<UpdateEmployeeTimeOffPolicyDetailsInput>;
};

export type UpdateBenefitPolicyInput = {
  /** Whether this policy is currently active */
  active?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  /** Can edit only name of existing benefit policy. */
  name: Scalars['String']['input'];
};

export type UpdateBenefitPolicyPayload = {
  __typename?: 'UpdateBenefitPolicyPayload';
  /** The benefitPolicy that was successfully updated as a result of the mutation. */
  policy?: Maybe<BenefitPolicy>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type UpdateCompanyMigrationVerifiedStatusInput = {
  /** Realm id of the company */
  companyId: Scalars['ID']['input'];
  /** Migration verified after migration */
  migrationVerified: Scalars['Boolean']['input'];
};

export type UpdateCompanyMigrationVerifiedStatusPayload = {
  __typename?: 'UpdateCompanyMigrationVerifiedStatusPayload';
  /** Update migration verified after migration */
  migrationVerified: Scalars['Boolean']['output'];
  /** User error generated as a result of the mutation */
  userError?: Maybe<MigrationUserError>;
};

/** Input to update a company payroll run */
export type UpdateCompanyPayrollRunInput = {
  /** Realm id of the company */
  companyId: Scalars['ID']['input'];
  /** When set to true updates are not persisted */
  dryRun?: InputMaybe<Scalars['Boolean']['input']>;
  /** Id of company payroll run to be updated */
  id: Scalars['ID']['input'];
  /** Includes relevant dates like pay period dates and paydate for this payroll run */
  payrollDateSummary?: InputMaybe<PayrollDateSummaryInput>;
  /**
   * Options to configure payslip calculation of this payroll run
   * For e.g. `includeDeductions` used to configure Bonus payroll run to include deductions
   * as part of payslip
   */
  payrollRunOptions?: InputMaybe<Array<VariableTypeFieldInput>>;
  /** Source id that can be used to track payroll run from client side */
  sourceId?: InputMaybe<Scalars['String']['input']>;
};

/** Result of UpdateCompanyPayrollRun mutation */
export type UpdateCompanyPayrollRunPayload = {
  __typename?: 'UpdateCompanyPayrollRunPayload';
  /** Company payroll run updated as a result of mutation */
  companyPayrollRun?: Maybe<CompanyPayrollRun>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<PayrollRunUserError>;
};

export type UpdateCompanyTerminationTaxPreferencesInput = {
  /** Realm ID of the company being updated */
  companyId?: InputMaybe<Scalars['ID']['input']>;
  /**
   * The company's specific preferences for handling tax obligations during termination.
   * Defines timeline, filing requirements, and business closure status.
   */
  terminationTaxPreferences: CompanyTerminationTaxPreferencesInput;
};

export type UpdateCompany_CompanyInfoInput = {
  businessName?: InputMaybe<Scalars['String']['input']>;
  companyAddress?: InputMaybe<UpdateCompany_CompanyInfo_CompanyProfile_CompanyAddress_Input>;
  companyType?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  legalAddress?: InputMaybe<Common_AddressInput>;
  legalName?: InputMaybe<Scalars['String']['input']>;
  principalOfficer?: InputMaybe<PrincipalOfficerInput>;
};

export type UpdateCompany_CompanyInfo_CompanyProfile_CompanyAddress_Input = {
  addressLine1: Scalars['String']['input'];
  city: Scalars['String']['input'];
  county?: InputMaybe<Scalars['String']['input']>;
  /** Political subdivision code for a work location required to identify the tax collector for Pennsylvania */
  politicalSubdivisionCode?: InputMaybe<Scalars['String']['input']>;
  state: Scalars['String']['input'];
  zip: Scalars['String']['input'];
};

export type UpdateCompany_CompanyInfo_Payload = {
  __typename?: 'UpdateCompany_CompanyInfo_Payload';
  companyCompanyInfo?: Maybe<Company_CompanyInfo>;
};

/**
 * This type of update can't be used once payroll has been run.
 * By doing this type of update, you will cause the schedule to change and the name to be updated, unless specified.
 */
export type UpdateCompany_Employer_InitialPayScheduleInput = {
  frequency: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  initialSetupDates: Company_Employer_PaySchedule_InitialSetupDatesInput;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCompany_Employer_PayScheduleInput = {
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCompany_PrimaryContactInput = {
  id: Scalars['ID']['input'];
  primaryContact: UpdatePrimaryContactInput;
};

export type UpdateCompany_PrimaryContactPayload = {
  __typename?: 'UpdateCompany_PrimaryContactPayload';
  company?: Maybe<Company>;
};

export type UpdateDeductionPolicyInput = {
  id: Scalars['ID']['input'];
  /** Can edit only name of existing policy. */
  name: Scalars['String']['input'];
};

export type UpdateDepartmentInput = {
  companyId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDepartmentPayload = {
  __typename?: 'UpdateDepartmentPayload';
  department?: Maybe<Department>;
  userError?: Maybe<DepartmentError>;
};

export type UpdateDigitalTaxFormDeliveryInput = {
  companyId: Scalars['ID']['input'];
  digitalTaxFormDelivery: VariableBooleanFieldInput;
  /** Employee ID of the employee that is being updated */
  employeeId: Scalars['ID']['input'];
};

export type UpdateDigitalTaxFormDeliveryPayload = {
  __typename?: 'UpdateDigitalTaxFormDeliveryPayload';
  digitalTaxFormDelivery?: Maybe<Array<VariableBooleanField>>;
  userError?: Maybe<EmployeePreferencesError>;
};

export type UpdateEarlyWageAccessPreferencesInput = {
  companyId: Scalars['ID']['input'];
  /** This field is @deprecated. Please use `newOffersAllowed` instead */
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  newOffersAllowed?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateEarlyWageAccessPreferencesPayload = {
  __typename?: 'UpdateEarlyWageAccessPreferencesPayload';
  earlyWageAccessPreferences?: Maybe<EarlyWageAccessPreferences>;
};

export type UpdateEmailNotificationInput = {
  /** Determines whether the notification will be enabled or disabled. */
  enabled: Scalars['Boolean']['input'];
  /** Determines the type of notification to be updated. Ex. AutoPayroll, DirectDeposit. */
  notificationType: Scalars['String']['input'];
};

export type UpdateEmailNotificationsInput = {
  companyId: Scalars['ID']['input'];
  emailNotifications: Array<UpdateEmailNotificationInput>;
  /** Employee ID of the employee that is being updated */
  employeeId: Scalars['ID']['input'];
};

export type UpdateEmailNotificationsPayload = {
  __typename?: 'UpdateEmailNotificationsPayload';
  emailNotifications?: Maybe<Array<EmailNotification>>;
  userError?: Maybe<EmployeePreferencesError>;
};

/** Input AutoPayroll setup details for batchUpdateEmployeeAutoPayrollSetup mutation */
export type UpdateEmployeeAutoPayrollSetupInput = {
  /** Id of an employee to be used for updating auto payroll setup */
  employeeId: Scalars['ID']['input'];
  /** Enroll or Unenroll AutoPayroll for an employee */
  enrolled?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Determines the pay date for which AutoPayroll will run for an employee.
   * You can change pay date only when employee is enrolled in AutoPayroll
   */
  payDate?: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateEmployeeBenefitInput = {
  /** The employee benefit to be updated. */
  employeeDeductionDetails: UpdateEmployeeDeductionDetailsInput;
  /** ID of the employee updating this benefitPolicy */
  employeeId: Scalars['ID']['input'];
};

export type UpdateEmployeeBenefitPayload = {
  __typename?: 'UpdateEmployeeBenefitPayload';
  /** The employee benefit that was successfully updated as a result of the mutation. */
  deduction?: Maybe<EmployeeBenefit>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type UpdateEmployeeCompensationInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  effective?: InputMaybe<EffectiveDateRange>;
  id: Scalars['ID']['input'];
  rate?: InputMaybe<PayRateInput>;
};

export type UpdateEmployeeContractDetailsInput = {
  companyId: Scalars['ID']['input'];
  contractPayType?: InputMaybe<ContractPayType>;
  effective?: InputMaybe<EffectiveDateRange>;
  employeeWeeklyWorkSchedule?: InputMaybe<UpdateEmployeeWeeklyWorkScheduleInput>;
  id: Scalars['ID']['input'];
  payRate?: InputMaybe<PayRateInput>;
  weeklyContractedTime?: InputMaybe<WeeklyContractedTimeInput>;
};

export type UpdateEmployeeContractDetailsPayload = {
  __typename?: 'UpdateEmployeeContractDetailsPayload';
  contractDetail?: Maybe<EmployeeContractDetails>;
  userError?: Maybe<EmployeeContractError>;
};

export type UpdateEmployeeContributionInput = {
  amount?: InputMaybe<RateInput>;
  capping?: InputMaybe<CappingInput>;
  frequency?: InputMaybe<ContributionFrequency>;
};

export type UpdateEmployeeDeductionDetailsInput = {
  employeeContributionInput?: InputMaybe<UpdateEmployeeContributionInput>;
  /** ID of the employee deduction to be updated. */
  employeeDeductionId: Scalars['ID']['input'];
  employeeExternalContributionInput?: InputMaybe<UpdateEmployeeExternalContributionInput>;
  employerContributionInput?: InputMaybe<UpdateEmployerContributionInput>;
  groupName?: InputMaybe<Scalars['String']['input']>;
  taxReportingInfo?: InputMaybe<UpdateTaxReportingInfoInput>;
};

/**
 * Input for updating employee employment changes with effective dates. This is a sparse input where only the fields
 * that need to be changed should be provided. Fields not included in the input will remain unchanged.
 * All provided changes will take effect from the specified effective start date and remain active until the effective end date.
 */
export type UpdateEmployeeEmploymentChangeWithEffectiveDateInput = {
  /** Company ID of the employee */
  companyId: Scalars['ID']['input'];
  /** Department assignment change */
  departmentId?: InputMaybe<Scalars['ID']['input']>;
  /** The effective date range for all employment changes */
  effectiveDateRange: EffectiveDateRangeInput;
  /** This field denotes whether the employee is eligible to be rehired */
  eligibleToRehire?: InputMaybe<Scalars['Boolean']['input']>;
  /** ID of the employee being updated */
  employeeId: Scalars['ID']['input'];
  /** The type of employment whether it is full time, part time or temporary */
  employmentClassification?: InputMaybe<EmploymentClassification>;
  /** Job title change */
  jobTitle?: InputMaybe<Scalars['String']['input']>;
  /** Manager assignment change */
  managerId?: InputMaybe<Scalars['ID']['input']>;
  /** Employment status change */
  status?: InputMaybe<Payroll_Employee_EmploymentStatus_Input>;
  /** Reason for employment status change */
  statusReason?: InputMaybe<Scalars['String']['input']>;
  /** Reason for termination of an employee */
  terminationReason?: InputMaybe<Scalars['String']['input']>;
};

/** Payload for updating employee employment changes with effective dates. */
export type UpdateEmployeeEmploymentChangeWithEffectiveDatePayload = {
  __typename?: 'UpdateEmployeeEmploymentChangeWithEffectiveDatePayload';
  /** The updated employee */
  employee?: Maybe<Employee>;
  /** User errors if any */
  userError?: Maybe<EmployeeError>;
};

export type UpdateEmployeeEmploymentDetailInput = {
  companyId: Scalars['ID']['input'];
  /** Employee ID of the employee being updated */
  employeeId: Scalars['ID']['input'];
  employmentDetail: EmployeeEmploymentDetailInput;
  /** This input can update information related to the employee's previous employment */
  previousEmployment?: InputMaybe<EmployeePreviousEmploymentInput>;
};

export type UpdateEmployeeEmploymentDetailPayload = {
  __typename?: 'UpdateEmployeeEmploymentDetailPayload';
  employee?: Maybe<Employee>;
  userError?: Maybe<EmployeeEmploymentDetailError>;
};

export type UpdateEmployeeExternalContributionInput = {
  amount: Scalars['Money']['input'];
};

export type UpdateEmployeeExternalWorkersCompensationClassInput = {
  companyId: Scalars['ID']['input'];
  /** Employee ID of the employee being updated */
  employeeId: Scalars['ID']['input'];
  /** Updates the current workersCompensationClass associated with this employee */
  workersCompensationClass?: InputMaybe<ExternalEmployeeWorkersCompensationClassInput>;
};

export type UpdateEmployeeExternalWorkersCompensationClassPayload = {
  __typename?: 'UpdateEmployeeExternalWorkersCompensationClassPayload';
  employee?: Maybe<Employee>;
  userError?: Maybe<WorkersCompensationError>;
};

/** Employee feature set input */
export type UpdateEmployeeFeatureGroupInput = {
  /** Company ID */
  companyId: Scalars['ID']['input'];
  /** Employee ID */
  employeeId: Scalars['ID']['input'];
  /** The feature group input that applies to employee specified in employeeId */
  featureGroup: EmployeeFeatureGroupInput;
};

export type UpdateEmployeeFeatureGroupPayload = {
  __typename?: 'UpdateEmployeeFeatureGroupPayload';
  createdProductInvitations?: Maybe<Array<EmployeeProductInvitation>>;
  error?: Maybe<EmployeeFeatureGroupError>;
  featureGroup?: Maybe<EmployeeFeatureGroup>;
  updatedProductInvitations?: Maybe<Array<EmployeeProductInvitation>>;
};

export type UpdateEmployeeGarnishmentInput = {
  amount?: InputMaybe<RateInput>;
  /** The ID of the employee garnishment to update */
  employeeGarnishmentId: Scalars['ID']['input'];
  /** The ID of the employee to update */
  employeeId: Scalars['ID']['input'];
  exemptAmount?: InputMaybe<Scalars['Money']['input']>;
  garnishmentPolicyDetails?: InputMaybe<UpdateDeductionPolicyInput>;
  limitAmount?: InputMaybe<RateInput>;
  totalAmountOwed?: InputMaybe<Scalars['Money']['input']>;
  vendorId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEmployeeGarnishmentPayload = {
  __typename?: 'UpdateEmployeeGarnishmentPayload';
  garnishment?: Maybe<EmployeeGarnishment>;
  userError?: Maybe<DeductionError>;
};

export type UpdateEmployeeInput = {
  birthDate?: InputMaybe<Scalars['Date']['input']>;
  companyId: Scalars['ID']['input'];
  contactInfo?: InputMaybe<Payroll_Employee_ContactInfoInput>;
  deleted?: InputMaybe<Scalars['Boolean']['input']>;
  displayName?: InputMaybe<Scalars['String']['input']>;
  employerNotes?: InputMaybe<Scalars['String']['input']>;
  employmentDetail?: InputMaybe<Payroll_Employee_EmploymentDetailInput>;
  employmentStatus?: InputMaybe<Payroll_Employee_EmploymentStatus_Input>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Payroll_Employee_GenderEnumInput>;
  hidden?: InputMaybe<Scalars['Boolean']['input']>;
  honorific?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  lastName?: InputMaybe<Scalars['String']['input']>;
  legalSex?: InputMaybe<Scalars['String']['input']>;
  middleInitial?: InputMaybe<Scalars['String']['input']>;
  otherLastNames?: InputMaybe<Array<Scalars['String']['input']>>;
  payslipDisplayName?: InputMaybe<Scalars['String']['input']>;
  preferredFirstName?: InputMaybe<Scalars['String']['input']>;
  taxIdentifiers?: InputMaybe<Array<VariableStringFieldInput>>;
};

export type UpdateEmployeeMiscDeductionInput = {
  /** The employee misc deduction to be updated. */
  employeeDeductionDetails: UpdateEmployeeDeductionDetailsInput;
  /** ID of the employee updating this miscDeductionPolicy */
  employeeId: Scalars['ID']['input'];
  policyPlan?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEmployeeMiscDeductionPayload = {
  __typename?: 'UpdateEmployeeMiscDeductionPayload';
  /** The employee miscDeduction that was successfully updated as a result of the mutation. */
  deduction?: Maybe<EmployeeMiscDeduction>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type UpdateEmployeePayDistributionsInput = {
  companyId: Scalars['ID']['input'];
  /** The list of pay distributions to be set for this employee */
  distributions: Array<EmployeePayDistributionInput>;
  /** Employee ID of the employee that is being updated */
  employeeId: Scalars['ID']['input'];
};

export type UpdateEmployeePayDistributionsPayload = {
  __typename?: 'UpdateEmployeePayDistributionsPayload';
  payDistributions: Array<EmployeePayDistribution>;
  /**
   * An identifier associated with the employee's pay distributions update as a result of this mutation.
   * Used to aggregate multiple events, from both clients and services, in risk analysis.
   */
  riskIdentifier?: Maybe<Scalars['String']['output']>;
};

export type UpdateEmployeePayload = {
  __typename?: 'UpdateEmployeePayload';
  employee?: Maybe<Employee>;
  userError?: Maybe<EmployeeError>;
};

export type UpdateEmployeePayrollCorrectionInput = {
  /** Amount per paycheck that employee owes to employer. */
  amount: Scalars['Money']['input'];
  /** ID of the employee updating this deductionPolicy */
  employeeId: Scalars['ID']['input'];
  /** The employee payroll correction to be updated. */
  employeePayrollCorrectionId: Scalars['ID']['input'];
  /** Determines how the correction item should be deducted from paycheck */
  payDownType: PayDownType;
};

export type UpdateEmployeePayrollCorrectionPayload = {
  __typename?: 'UpdateEmployeePayrollCorrectionPayload';
  /** The employee payroll correction deduction that was successfully updated as a result of the mutation. */
  payrollCorrection?: Maybe<EmployeePayrollCorrection>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

/** Input to update an employee payroll run */
export type UpdateEmployeePayrollRunInput = {
  /** Compensations to be updated on the employee payroll run */
  calculatedCompensations?: InputMaybe<Array<PayrollRunCalculatedCompensationInput>>;
  /** Deductions to be updated on the employee payroll run */
  calculatedDeductions?: InputMaybe<Array<PayrollRunCalculatedDeductionInput>>;
  /** Employee taxes to be updated on the employee payroll run */
  calculatedEmployeeTaxes?: InputMaybe<Array<PayrollRunCalculatedTaxInput>>;
  /** Employer taxes to be updated on the employee payroll run */
  calculatedEmployerTaxes?: InputMaybe<Array<PayrollRunCalculatedTaxInput>>;
  /** Id of the company to which the employee payroll run belongs */
  companyId: Scalars['ID']['input'];
  /** Denotes if the employee payroll run has to be persisted with the updates */
  dryRun: Scalars['Boolean']['input'];
  /** Id of the employee whose payroll run is to be updated */
  employeeId: Scalars['ID']['input'];
  /** Id of the employee payroll run to be updated */
  id: Scalars['ID']['input'];
  /** Memo note for this employee payroll run */
  memo?: InputMaybe<Scalars['String']['input']>;
  /**
   * Options to configure payslip calculation of this employee payroll run
   * For e.g. `accrueTimeOff` used to configure employee payroll run to accrue timeOff
   * for the resultant payslip
   */
  payrollRunOptions?: InputMaybe<Array<VariableTypeFieldInput>>;
};

/** Result of the 'updateEmployeePayrollRun' mutation. Provides the updated employee payroll run and any error as a result of update action on the employee payroll run. */
export type UpdateEmployeePayrollRunPayload = {
  __typename?: 'UpdateEmployeePayrollRunPayload';
  /** Employee payroll run that was updated successfully */
  employeePayrollRun?: Maybe<EmployeePayrollRun>;
  /**
   * Total deduction contributions for this employee payroll run, includes
   * employee and employer total contributions
   */
  totalDeductions?: Maybe<TotalDeductions>;
  /** Total employee taxes to be withheld for this employee payroll run */
  totalEmployeeTaxes?: Maybe<Scalars['Money']['output']>;
  /** Total employer taxes to be withheld for this employee payroll run */
  totalEmployerTaxes?: Maybe<Scalars['Money']['output']>;
  /** Total hours worked for this payroll run (include regular, overtime, double overtime hours) */
  totalHours?: Maybe<Scalars['Float']['output']>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<PayrollRunUserError>;
};

export type UpdateEmployeePensionAutoEnrollmentInput = {
  companyId: Scalars['ID']['input'];
  employeeCategory: Scalars['String']['input'];
  employeeId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
  status: Scalars['String']['input'];
  statusDate?: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateEmployeePensionEnrollmentPayload = {
  __typename?: 'UpdateEmployeePensionEnrollmentPayload';
  pensionEnrollment?: Maybe<EmployeePensionEnrollment>;
  /** User errors generated as a result of the mutation. */
  userErrors?: Maybe<Array<PensionEnrollmentError>>;
};

export type UpdateEmployeePensionInput = {
  /** The employee pension to be updated. */
  employeeDeductionDetails: UpdateEmployeeDeductionDetailsInput;
  /** ID of the employee updating this pensionPolicy */
  employeeId: Scalars['ID']['input'];
};

export type UpdateEmployeePensionPayload = {
  __typename?: 'UpdateEmployeePensionPayload';
  /** The employee pension that was successfully updated as a result of the mutation. */
  deduction?: Maybe<EmployeePension>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type UpdateEmployeePreferencesInput = {
  companyId: Scalars['ID']['input'];
  /** Employee ID of the employee that is being updated */
  employeeId: Scalars['ID']['input'];
  preferences: EmployeePreferencesInput;
};

export type UpdateEmployeePreferencesPayload = {
  __typename?: 'UpdateEmployeePreferencesPayload';
  employee?: Maybe<Employee>;
  userError?: Maybe<EmployeePreferencesError>;
};

export type UpdateEmployeeTaxDeductionInput = {
  /** Flag to retroactively apply this update to affected paychecks. Required true if paychecks exist during effective date time period. */
  applyRetroactively?: InputMaybe<Scalars['Boolean']['input']>;
  /** Company ID that the employee tax deduction belongs to */
  companyId: Scalars['ID']['input'];
  /** Date on which the employee's assignment to the policy will become active/is active from */
  effectiveDate?: InputMaybe<Scalars['Date']['input']>;
  /** The ID of the employee tax deduction assignment */
  id: Scalars['ID']['input'];
  /** The tax deduction policy ID that the employee will be assigned to */
  policyId?: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateEmployeeTaxDeductionPayload = {
  __typename?: 'UpdateEmployeeTaxDeductionPayload';
  /** Employee tax deduction assignment that was updated as a result of the mutation */
  employeeTaxDeduction?: Maybe<EmployeeTaxDeduction>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<TaxDeductionError>;
};

export type UpdateEmployeeTaxSetupsInput = {
  companyId: Scalars['ID']['input'];
  /** The employee ID of an employee whose tax setups these are */
  employeeId: Scalars['ID']['input'];
  /**
   * When true, signals that EESS auto-complete should be skipped in IOP because the NHO
   * onboarding wizard will complete EESS later via FinishOnboardingMutation. When absent or
   * false, IOP auto-completes EESS as normal (old EESS flow).
   */
  skipCompleteEESS?: InputMaybe<Scalars['Boolean']['input']>;
  taxSetups: Array<UpdateSingleEmployeeTaxSetupInput>;
};

export type UpdateEmployeeTaxSetupsPayload = {
  __typename?: 'UpdateEmployeeTaxSetupsPayload';
  taxSetups: Array<EmployeeTaxSetup>;
};

/** Input type to update an employye's time off policy assignment */
export type UpdateEmployeeTimeOffPolicyDetailsInput = {
  /** EmployerTimeOffPolicy details */
  employerTimeOffPolicy?: InputMaybe<EmployerTimeOffPolicyAssignmentInput>;
  /** Employee timeOff policy assignment Id */
  id: Scalars['ID']['input'];
};

export type UpdateEmployeeUserIdError = {
  __typename?: 'UpdateEmployeeUserIdError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type UpdateEmployeeUserIdInput = {
  companyId: Scalars['String']['input'];
  /** consumerRealmId field is temporary and used only during the transition phase of CFR removal. Will be removed as part of CFR cleanup */
  consumerRealmId?: InputMaybe<Scalars['String']['input']>;
  employeeExternalId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type UpdateEmployeeUserIdPayload = {
  __typename?: 'UpdateEmployeeUserIdPayload';
  employee?: Maybe<Employee>;
  userError?: Maybe<UpdateEmployeeUserIdError>;
};

export type UpdateEmployeeWeeklyWorkScheduleInput = {
  irregularWorkingDays?: InputMaybe<Scalars['Boolean']['input']>;
  typicalWorkingDays?: InputMaybe<Array<DayOfWeek>>;
  weeklyContractedHoursPerDay?: InputMaybe<WeeklyContractedHoursPerDayInput>;
  weeklyContractedHoursPerWeek?: InputMaybe<WeeklyContractedHoursPerWeekInput>;
};

export type UpdateEmployerCompensationInput = {
  active?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  subjectedToCalculation?: InputMaybe<SubjectedToCalculationInput>;
};

export type UpdateEmployerCompensationPayload = {
  __typename?: 'UpdateEmployerCompensationPayload';
  compensation?: Maybe<EmployerCompensation>;
  userError?: Maybe<CompensationMutationError>;
};

export type UpdateEmployerContributionInput = {
  amount?: InputMaybe<RateInput>;
  capping?: InputMaybe<CappingInput>;
  frequency?: InputMaybe<ContributionFrequency>;
};

export type UpdateEmployerDirectDepositLeadTimesInput = {
  leadTime: Scalars['String']['input'];
};

export type UpdateEmployerDirectDepositLeadTimesPayload = {
  __typename?: 'UpdateEmployerDirectDepositLeadTimesPayload';
  fundingLeadTimes?: Maybe<EmployerDirectDepositFundingLeadTimes>;
  userError?: Maybe<EmployerDirectDepositFundingLeadTimesError>;
};

/** Result payload of updateEmployerManagedWorkersCompensationClass mutation */
export type UpdateEmployerManagedWorkersCompensationClassPayload = {
  __typename?: 'UpdateEmployerManagedWorkersCompensationClassPayload';
  /** The EmployerManagedWorkersCompensationClass that was updated as a result of the mutation. */
  employerWorkersCompensationClass?: Maybe<EmployerManagedWorkersCompensationClass>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<WorkersCompensationError>;
};

/** Input for the updateEmployerManagedWorkersCompensation mutation. */
export type UpdateEmployerManagedWorkersCompensationInput = {
  active: Scalars['Boolean']['input'];
  applyRateRetroactively: Scalars['Boolean']['input'];
  companyId: Scalars['ID']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  /** id of EmployerManagedWorkersCompensationClass to be updated */
  id: Scalars['ID']['input'];
  workersCompensationCost?: InputMaybe<Array<EmployerManagedWorkersCompensationCostInput>>;
};

export type UpdateEmployerPayScheduleDetailsInput = {
  frequency?: InputMaybe<PayScheduleFrequency>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  referenceDates?: InputMaybe<PayScheduleReferenceDatesInput>;
};

export type UpdateEmployerPayScheduleInput = {
  paySchedule: UpdateEmployerPayScheduleDetailsInput;
  /** Update payschedule as default for the employer in addition to update payschedule. Can affect other payschedule which is employer's default. */
  useAsDefault?: InputMaybe<Scalars['Boolean']['input']>;
};

/** The response payload for updating an employer pay schedule. */
export type UpdateEmployerPaySchedulePayload = {
  __typename?: 'UpdateEmployerPaySchedulePayload';
  /** The pay schedule that an employer has updated. */
  paySchedule?: Maybe<EmployerPaySchedule>;
  /** Errors that occurred during the operation. */
  userError?: Maybe<PayScheduleError>;
};

export type UpdateEmployerPriorPayrollTaxItemPeriodBreakdownsInput = {
  /** Represents the unique ID of the company */
  companyId: Scalars['ID']['input'];
  /** Represents employer prior payroll tax breakdown details */
  taxItemPeriodBreakdowns: Array<EmployerPriorPayrollTaxItemPeriodBreakdownInput>;
};

export type UpdateEmployerPriorPayrollTaxItemPeriodBreakdownsPayload = {
  __typename?: 'UpdateEmployerPriorPayrollTaxItemPeriodBreakdownsPayload';
  /** Identifies employer prior payroll tax breakdown details */
  taxItemPeriodBreakdowns?: Maybe<Array<EmployerPriorPayrollTaxItemPeriodBreakdown>>;
  /** Error for the mutation */
  userErrors: Array<EmployerPriorPayrollUpdateTaxBreakdownMutationError>;
};

export type UpdateEmployerTaxAgencyCredentialPayload = {
  __typename?: 'UpdateEmployerTaxAgencyCredentialPayload';
  error?: Maybe<TaxAgencyCredentialError>;
  taxSetup?: Maybe<EmployerTaxSetup>;
};

export type UpdateEmployerTaxIdentifierInput = {
  companyId?: InputMaybe<Scalars['ID']['input']>;
  /**
   * Flag indicates the check for duplication inside the database
   * @deprecated Use `validations` instead
   */
  enableDuplicateFeinCheck?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  /** List of validations to be checked for FEIN */
  validations?: InputMaybe<Array<TaxIdentifierValidationType>>;
  value: Scalars['String']['input'];
};

export type UpdateEmployerTaxIdentifierPayload = {
  __typename?: 'UpdateEmployerTaxIdentifierPayload';
  error?: Maybe<TaxIdentifierError>;
  taxIdentifier?: Maybe<EmployerTaxIdentifier>;
};

export type UpdateEmployerTaxSetupInput = {
  companyId?: InputMaybe<Scalars['ID']['input']>;
  id: Scalars['ID']['input'];
  taxPaymentGroups?: InputMaybe<Array<EmployerTaxPaymentGroupInput>>;
};

export type UpdateEmployerTaxSetupPayload = {
  __typename?: 'UpdateEmployerTaxSetupPayload';
  error?: Maybe<TaxSetupError>;
  taxSetup?: Maybe<EmployerTaxSetup>;
};

/**
 * This input type provides the options for adding/removing an EmployerTaxSetupTaxDepositFrequency,
 * and all of the options are mutually exclusive. Must specify one and only one of
 * the fields in the input, i.e. only one of the input fields should be non-null.
 */
export type UpdateEmployerTaxSetupTaxDepositFrequenciesInput = {
  /** Deposit Frequency to be added */
  addFrequency?: InputMaybe<EmployerTaxSetupTaxDepositFrequencyInput>;
  /** Deposit Frequency to be deleted which is effective on this Date */
  removeFrequencyForDate?: InputMaybe<Scalars['Date']['input']>;
};

/** This input type provides the options for adding/removing an EmployerTaxSetupTaxRate. */
export type UpdateEmployerTaxSetupTaxRatesInput = {
  additions?: InputMaybe<Array<EmployerTaxSetupTaxRateInput>>;
  removals?: InputMaybe<Array<EmployerTaxSetupTaxRateInput>>;
};

export type UpdateEmployerTimeOffPolicyDetailsInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  policyDetail?: InputMaybe<TimeOffPolicyDetailInput>;
  policyName?: InputMaybe<Scalars['String']['input']>;
  timeOffMethod?: InputMaybe<TimeOffMethod>;
};

export type UpdateEmployerTimeOffPolicyInput = {
  timeOffPolicy: UpdateEmployerTimeOffPolicyDetailsInput;
  /** Update time off policy as default for the employer in addition to update policy. Can affect other policy which is employer's default. Currently applicable only to CA Vacation Policy. */
  useAsDefault?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateEmployerTimeOffPolicyPayload = {
  __typename?: 'UpdateEmployerTimeOffPolicyPayload';
  /** The previous default time off policy for the employer. This will be non-null only in the case that the mutation changed which time off policy is the employer's default. */
  priorDefaultTimeOffPolicy?: Maybe<EmployerTimeOffPolicy>;
  /** The policy that was successfully updated as a result of the update mutation. */
  timeOffPolicy?: Maybe<EmployerTimeOffPolicy>;
  userError?: Maybe<TimeOffPolicyError>;
};

/** Input for the updateWorkersCompClass mutation. */
export type UpdateEmployerWorkersCompensationClassInput = {
  companyId: Scalars['ID']['input'];
  employeeClass?: InputMaybe<Scalars['String']['input']>;
  /** id of EmployerWorkersCompensationClass */
  id: Scalars['ID']['input'];
  rates?: InputMaybe<Array<EmployerWorkersCompensationRateInput>>;
};

/** Result payload of updateEmployerWorkersClass mutation */
export type UpdateEmployerWorkersCompensationClassPayload = {
  __typename?: 'UpdateEmployerWorkersCompensationClassPayload';
  /** The EmployerWorkersCompensationClass that was updated as a result of the mutation. */
  workersCompensationClass: EmployerWorkersCompensationClass;
};

export type UpdateEmploymentEligibilityInput = {
  employeeId: Scalars['ID']['input'];
  /** If true, the employee will be enabled to fill out the employment eligibility requirements electronically through workforce self setup. */
  enableElectronicSubmission?: InputMaybe<Scalars['Boolean']['input']>;
  /** Represents the citizenship or immigration legal status of the employee, which allows them to be employed */
  legalStatus?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEmploymentEligibilityPayload = {
  __typename?: 'UpdateEmploymentEligibilityPayload';
  employmentEligibility?: Maybe<EmploymentEligibility>;
  userError?: Maybe<EmploymentEligibilityError>;
};

export type UpdateEmploymentEligibilityRequiredVerificationPayload = {
  __typename?: 'UpdateEmploymentEligibilityRequiredVerificationPayload';
  userError?: Maybe<EmploymentEligibilityRequiredVerificationError>;
  verification?: Maybe<EmploymentEligibilityRequiredVerification>;
};

export type UpdateEmploymentStatusInput = {
  /** Id of employee whose employment status has to be changed */
  employeeId: Scalars['ID']['input'];
  /** Status of employment that has to be updated */
  employmentStatus: Payroll_Employee_EmploymentStatusEnumInput;
};

export type UpdateExistingTransactionsMessage = Message & {
  __typename?: 'UpdateExistingTransactionsMessage';
  /** Code to identify message */
  code: Scalars['String']['output'];
  /** Status message regarding update existing transactions */
  message?: Maybe<Scalars['String']['output']>;
  /** Type of the message (Info, Warning, Blocker) */
  type: MessageType;
};

export type UpdateExistingTransactionsToAccountingError = ExportTransactionsToAccountingError & {
  __typename?: 'UpdateExistingTransactionsToAccountingError';
  code: Scalars['String']['output'];
  /** Update existing transaction which failed with this error */
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type UpdateExistingTransactionsToAccountingInput = {
  /** Category of Accounting update (RECLASSIFY_CATEGORIES for classes and dimensions and unspecified for chart of accounts) */
  category?: InputMaybe<Scalars['String']['input']>;
  companyId: Scalars['ID']['input'];
  /**
   * Date from which all transactions from Start date to End Date are updated using the current chart of account mapping preferences.
   * If end date is absent update transactions from Start Date to present Date
   */
  endDate?: InputMaybe<Scalars['Date']['input']>;
  /** Date from which all transactions between start date to the present are updated using the current chart of account mapping preferences. */
  startDate: Scalars['Date']['input'];
};

export type UpdateExistingTransactionsToAccountingPayload = {
  __typename?: 'UpdateExistingTransactionsToAccountingPayload';
  /** List of error details for an unsuccessful account mapping update for existing transactions */
  errors?: Maybe<Array<ExportTransactionsToAccountingError>>;
  /** Message status after execution of update existing transaction with current account mapping */
  messages?: Maybe<Array<UpdateExistingTransactionsMessage>>;
};

/** CompanyId for which the FICA tax status will be updated */
export type UpdateFicaMisMapConsentInput = {
  /** Company ID that is being updated */
  companyId: Scalars['ID']['input'];
};

export type UpdateFicaMisMapConsentPayload = {
  __typename?: 'UpdateFicaMisMapConsentPayload';
  state: ImportedPayHistoryState;
  userError?: Maybe<ImportedPayHistoryError>;
};

/** Indicate the client's preferences for the deferred employee tax setup feature. */
export type UpdateFirstTimePayrollSetupDeferredEmployeeTaxSetupInput = {
  /** Indicate whether the deferred employee tax setup feature should be activated when possible for the company. */
  preferred: Scalars['Boolean']['input'];
};

export type UpdateGarnishmentPriorityInput = {
  calculationMethod: Scalars['String']['input'];
  /** Optional because when we have EQUAL or PRO_RATED calculation method, we don't pass garnishment ID */
  calculationMethodConfiguration?: InputMaybe<Array<VariableTypeFieldInput>>;
  /** The ID of the employee to update */
  employeeId: Scalars['ID']['input'];
};

export type UpdateGarnishmentPriorityPayload = {
  __typename?: 'UpdateGarnishmentPriorityPayload';
  priority?: Maybe<GarnishmentPriority>;
  userError?: Maybe<DeductionError>;
};

export type UpdateImportedTaxItemInput = {
  /** Company ID that is being updated */
  companyId: Scalars['ID']['input'];
  /** Name of the imported tax item */
  name: Scalars['String']['input'];
  /** Tax item mapped to this imported tax item */
  potentialTaxItem: TaxItemInput;
};

export type UpdateImportedTaxItemPayload = {
  __typename?: 'UpdateImportedTaxItemPayload';
  userError?: Maybe<ImportedPayHistoryError>;
};

export type UpdateMaternalLeavePeriodInput = {
  /** Baby's birth date for maternity leave */
  babyBirthDate?: InputMaybe<Scalars['Date']['input']>;
  /** Baby's due date for maternity leave */
  babyDueDate: Scalars['Date']['input'];
  /** Used to determine the type of leave */
  category: LeaveCategory;
  companyId: Scalars['ID']['input'];
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['input'];
  employeeId: Scalars['ID']['input'];
  /** End date of the employee leave which is optional */
  endDate?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['ID']['input'];
  /**
   * The wage reference to compute employee wages during the leave period.
   * It is a temporal value that could potentially change for every leave period
   * e.g. average weekly earnings of the employee at the time of taking the leave.
   */
  leaveWageReference?: InputMaybe<Scalars['Money']['input']>;
};

export type UpdateMaternalLeavePeriodPayload = {
  __typename?: 'UpdateMaternalLeavePeriodPayload';
  leavePeriod?: Maybe<MaternalLeavePeriod>;
  userError?: Maybe<LeavePeriodError>;
};

export type UpdateMiscDeductionPolicyInput = {
  /** Whether this policy is currently active */
  active?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  /** Can edit only name of existing misc deduction policy. */
  name: Scalars['String']['input'];
};

export type UpdateMiscDeductionPolicyPayload = {
  __typename?: 'UpdateMiscDeductionPolicyPayload';
  /** The miscDeductionPolicy that was successfully updated as a result of the mutation. */
  policy?: Maybe<MiscDeductionPolicy>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type UpdateNeonatalCareLeavePeriodInput = {
  /** Baby's birth date for neonatal care leave */
  babyBirthDate: Scalars['Date']['input'];
  /** Baby's due date for neonatal care leave */
  babyDueDate: Scalars['Date']['input'];
  /** Used to determine the type of leave */
  category: LeaveCategory;
  companyId: Scalars['ID']['input'];
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['input'];
  employeeId: Scalars['ID']['input'];
  /** End date of the employee leave which is optional */
  endDate?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['ID']['input'];
  /**
   * The wage reference to compute employee wages during the leave period.
   * It is a temporal value that could potentially change for every leave period
   * e.g. average weekly earnings of the employee at the time of taking the leave.
   */
  leaveWageReference?: InputMaybe<Scalars['Money']['input']>;
  /** Number of weeks for Employee leave period */
  numberOfWeeks: Scalars['Int']['input'];
  /** Tier type for Employee leave period */
  tierType: Scalars['Int']['input'];
};

export type UpdateNeonatalCareLeavePeriodPayload = {
  __typename?: 'UpdateNeonatalCareLeavePeriodPayload';
  leavePeriod?: Maybe<NeonatalCareLeavePeriod>;
  userError?: Maybe<LeavePeriodError>;
};

/** Input notification preferences for updateNotificationPreferences mutation. */
export type UpdateNotificationPreferencesInput = {
  /** Id of the company */
  companyId: Scalars['ID']['input'];
  /** Specify the text notification channel to be updated. */
  textNotificationChannel?: InputMaybe<UpdateTextNotificationChannelInput>;
};

/** Result payload of updateNotificationPreferences mutation. */
export type UpdateNotificationPreferencesPayload = {
  __typename?: 'UpdateNotificationPreferencesPayload';
  /** The NotificationPreferences that was updated as a result of the mutation. */
  notificationPreferences?: Maybe<NotificationPreferences>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<NotificationPreferencesUserError>;
};

export type UpdatePaternalLeavePeriodInput = {
  /** Baby's birth date for paternity leave */
  babyBirthDate: Scalars['Date']['input'];
  /** Baby's due date for paternity leave */
  babyDueDate: Scalars['Date']['input'];
  /** Used to determine the type of leave */
  category: LeaveCategory;
  companyId: Scalars['ID']['input'];
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['input'];
  employeeId: Scalars['ID']['input'];
  /** End date of the employee leave which is optional */
  endDate?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['ID']['input'];
  /**
   * The wage reference to compute employee wages during the leave period.
   * It is a temporal value that could potentially change for every leave period
   * e.g. average weekly earnings of the employee at the time of taking the leave.
   */
  leaveWageReference?: InputMaybe<Scalars['Money']['input']>;
};

export type UpdatePaternalLeavePeriodPayload = {
  __typename?: 'UpdatePaternalLeavePeriodPayload';
  leavePeriod?: Maybe<PaternalLeavePeriod>;
  userError?: Maybe<LeavePeriodError>;
};

export type UpdatePayrollEmployeeSelfSetupInput = {
  companyId: Scalars['ID']['input'];
  employeeId: Scalars['ID']['input'];
  enabled: Scalars['Boolean']['input'];
};

export type UpdatePayrollEmployeeSelfSetupPayload = {
  __typename?: 'UpdatePayrollEmployeeSelfSetupPayload';
  payrollSelfSetup?: Maybe<PayrollEmployeeSelfSetup>;
  userError?: Maybe<EmployeeSelfSetupUserError>;
};

export type UpdatePayroll_Employee_EmployeeContractDetailsInput = {
  companyId: Scalars['ID']['input'];
  contractPayType?: InputMaybe<Scalars['String']['input']>;
  frequencyType?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  rate?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePayroll_Employee_EmployeeContractDetailsPayload = {
  __typename?: 'UpdatePayroll_Employee_EmployeeContractDetailsPayload';
  contractDetail?: Maybe<Payroll_Employee_EmployeeContractDetails>;
};

export type UpdatePayroll_Employer_FirstTimePayrollSetupInput = {
  deferEmployeeTaxSetup?: InputMaybe<Scalars['Boolean']['input']>;
  deferredEmployeeTaxSetup?: InputMaybe<UpdateFirstTimePayrollSetupDeferredEmployeeTaxSetupInput>;
  expectedFirstPayrollPayDate?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['ID']['input'];
  payrollExpertise?: InputMaybe<Payroll_Employer_FirstTimePayrollSetup_PayrollExpertiseTypeEnum>;
  priorPayHistory?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdatePayroll_Employer_FirstTimePayrollSetupPayload = {
  __typename?: 'UpdatePayroll_Employer_FirstTimePayrollSetupPayload';
  payrollEmployerFirstTimePayrollSetup?: Maybe<Payroll_Employer_FirstTimePayrollSetup>;
};

export type UpdatePayslipCheckNumberInput = {
  checkNumber?: InputMaybe<Scalars['Int']['input']>;
  companyId: Scalars['ID']['input'];
  payslipId: Scalars['ID']['input'];
};

export type UpdatePayslipCheckNumberPayload = {
  __typename?: 'UpdatePayslipCheckNumberPayload';
  /** Payslip id and error detail of an unsuccessful update payslip check number mutation */
  error?: Maybe<PayslipMutationError>;
  /** Updated payslip on a successful update payslip check number mutation */
  payslip?: Maybe<Payslip>;
};

export type UpdatePayslipInput = {
  /** Reason for creating amendments */
  amendmentsReason?: InputMaybe<Scalars['String']['input']>;
  /** Id of the company to which the payslip belongs */
  companyId: Scalars['ID']['input'];
  /** Compensations to be updated on the payslip */
  compensations?: InputMaybe<Array<PayslipCalculatedCompensationInput>>;
  /** Create amendments for closed quarter correction */
  createAmendmentsCase?: InputMaybe<Scalars['Boolean']['input']>;
  /** Deductions to be updated on the payslip */
  deductions?: InputMaybe<Array<PayslipCalculatedDeductionInput>>;
  /** Denotes if the payslip has to be persisted with the updates */
  dryRun: Scalars['Boolean']['input'];
  /** Employee taxes to be updated on a payslip */
  employeeTaxes?: InputMaybe<Array<PayslipCalculatedTaxInput>>;
  /** Employer taxes to be updated on a payslip */
  employerTaxes?: InputMaybe<Array<PayslipCalculatedTaxInput>>;
  /** Memo note for this payslip */
  memo?: InputMaybe<Scalars['String']['input']>;
  /** Defines how the net pay amount will be distributed to the employee */
  netPayDistributions?: InputMaybe<Array<PayslipNetPayDistributionInput>>;
  /** Id of the payslip to be updated */
  payslipId: Scalars['ID']['input'];
};

/** Result of the 'updatePayslip' mutation. Provides the updated payslip and any error as a result of update action on the payslip. */
export type UpdatePayslipPayload = {
  __typename?: 'UpdatePayslipPayload';
  /** Created amendments for closed quarter correction */
  createdAmendmentsCase?: Maybe<Scalars['Boolean']['output']>;
  /** Payslip id and error detail of an unsuccessful update payslip mutation */
  error?: Maybe<PayslipMutationError>;
  /** Payslip that was updated successfully */
  payslip?: Maybe<Payslip>;
};

export type UpdatePayslipPreferencesInput = {
  /** Realm id of the company */
  companyId: Scalars['ID']['input'];
  /** Print preference for a payslip */
  printPreference?: InputMaybe<PayslipPrintPreferencesInput>;
};

export type UpdatePayslipPreferencesPayload = {
  __typename?: 'UpdatePayslipPreferencesPayload';
  /** Printing preferences of a payslip */
  printPreference?: Maybe<PrintPreference>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<PayslipMutationError>;
};

export type UpdatePensionEnrollmentInput = {
  allowComputingStagingDate?: InputMaybe<Scalars['Boolean']['input']>;
  companyId: Scalars['ID']['input'];
  id: Scalars['ID']['input'];
  pensionReenrollment?: InputMaybe<PensionReenrollmentInput>;
  stagingDate?: InputMaybe<Scalars['Date']['input']>;
};

export type UpdatePensionEnrollmentPayload = {
  __typename?: 'UpdatePensionEnrollmentPayload';
  pensionEnrollment?: Maybe<PensionEnrollment>;
  /** User errors generated as a result of the mutation. */
  userErrors?: Maybe<Array<PensionEnrollmentError>>;
};

export type UpdatePensionPolicyInput = {
  /** Whether this policy is currently active */
  active?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['ID']['input'];
  /** Determines if this is the default pensionPolicy */
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  /** Can edit the name of existing pension policy. */
  name: Scalars['String']['input'];
  /** Attributes to setup specific characteristics of pensions in different jurisdictions */
  pensionSetup?: InputMaybe<PensionSetupInput>;
  /** Provider Reference ID which is a unique identifier given to the employer by the provider */
  providerReferenceId?: InputMaybe<Scalars['String']['input']>;
};

export type UpdatePensionPolicyPayload = {
  __typename?: 'UpdatePensionPolicyPayload';
  /** The pensionPolicy that was successfully updated as a result of the mutation. */
  policy?: Maybe<PensionPolicy>;
  /** User error generated as a result of the mutation. */
  userError?: Maybe<DeductionError>;
};

export type UpdatePrimaryContactInput = {
  firstName?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  primaryEmail?: InputMaybe<Scalars['String']['input']>;
  primaryTelephone?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateSickLeavePeriodInput = {
  /** Used to determine the type of leave */
  category: LeaveCategory;
  companyId: Scalars['ID']['input'];
  /** Start date of the employee leave */
  effectiveDate: Scalars['Date']['input'];
  employeeId: Scalars['ID']['input'];
  /** End date of the employee leave which is optional */
  endDate?: InputMaybe<Scalars['Date']['input']>;
  id: Scalars['ID']['input'];
  /**
   * The wage reference to compute employee wages during the leave period.
   * It is a temporal value that could potentially change for every leave period
   * e.g. average weekly earnings of the employee at the time of taking the leave.
   */
  leaveWageReference?: InputMaybe<Scalars['Money']['input']>;
  /** Specifies the number of days from another leave that should be linked to this leave. */
  linkedLeaveDays?: InputMaybe<Scalars['Int']['input']>;
};

export type UpdateSickLeavePeriodPayload = {
  __typename?: 'UpdateSickLeavePeriodPayload';
  leavePeriod?: Maybe<SickLeavePeriod>;
  userError?: Maybe<LeavePeriodError>;
};

/** Input for Employee Tax Setup */
export type UpdateSingleEmployeeTaxSetupInput = {
  allowances?: InputMaybe<Array<EmployeeTaxSetupAllowanceInput>>;
  exemptions?: InputMaybe<Array<VariableTypeFieldInput>>;
  filingStatus?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  /**
   * Employee role details if any implications on tax liability calculations
   * e.g. Director role, and null is for regular (non-director) employee
   */
  roleDetails?: InputMaybe<Array<EmployeeTaxRoleDetailInput>>;
  taxCalculationMethods?: InputMaybe<Array<VariableTypeFieldInput>>;
  taxCodes?: InputMaybe<Array<VariableTypeFieldInput>>;
  withholdings?: InputMaybe<Array<VariableMoneyFieldInput>>;
};

export type UpdateTaskInput = {
  /** Actions for the task */
  actions?: InputMaybe<Array<TaskActionInput>>;
  /** Category of the task */
  category: Scalars['String']['input'];
  /** Due date for the task */
  dueDate?: InputMaybe<Scalars['Date']['input']>;
  /** Expiry date for the task */
  expiryDate?: InputMaybe<Scalars['Date']['input']>;
  /** Id of the task */
  id: Scalars['ID']['input'];
  /** Priority of the task */
  priority?: InputMaybe<Scalars['Int']['input']>;
  /** Source data for the task */
  sourceVersion?: InputMaybe<TaskSourceVersionInput>;
  /** Status of the task */
  status?: InputMaybe<TaskStatus>;
};

export type UpdateTaxAgencyCredentialInput = {
  agencyCredential: AgencyCredentialInput;
  id: Scalars['ID']['input'];
};

export type UpdateTaxDeductionPolicyInput = {
  /** Flag to retroactively apply this update to affected paychecks. Required true if paychecks exist during effective date time period. */
  applyRetroactively?: InputMaybe<Scalars['Boolean']['input']>;
  /** Company ID that the tax deduction policy belongs to */
  companyId: Scalars['ID']['input'];
  /** The deduction contributions associated with this policy */
  contributions?: InputMaybe<Array<TaxDeductionContributionInput>>;
  /** Tax deduction policy ID */
  id: Scalars['ID']['input'];
  /** A deduction policy name/description */
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateTaxDeductionPolicyPayload = {
  __typename?: 'UpdateTaxDeductionPolicyPayload';
  /** Tax deduction policy that was updated as a result of the mutation */
  taxDeductionPolicy?: Maybe<TaxDeductionPolicy>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<TaxDeductionError>;
};

export type UpdateTaxExemptionInput = {
  /** Flag to retroactively apply this update to affected paychecks. Required true if paychecks exist during effective date time period. */
  applyRetroactively?: InputMaybe<Scalars['Boolean']['input']>;
  /** The date that the exemption will be effective */
  effectiveDate: Scalars['Date']['input'];
  /** The id of the exemption that is being updated */
  id: Scalars['ID']['input'];
  /** Flag indicating if you are exempt from this tax */
  isExempt: Scalars['Boolean']['input'];
  /** Input type for filtering TaxExemptions */
  type?: InputMaybe<TaxExemptionType>;
};

export type UpdateTaxExemptionPayload = {
  __typename?: 'UpdateTaxExemptionPayload';
  /** The tax exemption that was updated as a result of the mutation */
  taxExemption?: Maybe<TaxExemption>;
  /** User error generated as a result of the mutation */
  userError?: Maybe<TaxExemptionError>;
};

/** Bulk sign of all employer tax setup documents. Contains attribute to support paper or e-sign. */
export type UpdateTaxFilingDocumentsSignatureInput = {
  companyId: Scalars['ID']['input'];
  /** Indicates if the signing is through Intuit Sign */
  isIntuitSign?: InputMaybe<Scalars['Boolean']['input']>;
  /** List of Jurisdictions for which the signing forms are to be created. */
  jurisdictions?: InputMaybe<Array<Scalars['String']['input']>>;
  /** The type of signing i.e. ESIGN or PAPER */
  signingType: TaxFilingDocumentSigningType;
  /** User ID for the signing forms */
  userId?: InputMaybe<Scalars['String']['input']>;
};

/** Response payload of the bulk update of employer tax setup signing */
export type UpdateTaxFilingDocumentsSignaturePayload = {
  __typename?: 'UpdateTaxFilingDocumentsSignaturePayload';
  error?: Maybe<TaxFilingDocumentsSignatureUpdateError>;
  taxFilingDocumentsSignature?: Maybe<TaxFilingDocumentsSignature>;
};

export type UpdateTaxFilingPrintStatusInput = {
  /** The new print status to set */
  printStatus: PrintStatus;
  /** The ID of the tax filing to update print status for */
  taxFilingId: Scalars['ID']['input'];
};

export type UpdateTaxFilingPrintStatusPayload = {
  __typename?: 'UpdateTaxFilingPrintStatusPayload';
  /** Error details if the update failed */
  error?: Maybe<TaxFilingError>;
  /** The updated tax filing with new print status */
  taxFiling?: Maybe<TaxFiling>;
};

/** Input for the updateTaxFormDeliveryPreference mutation. */
export type UpdateTaxFormDeliveryPreferenceInput = {
  /** Target company ID */
  companyId: Scalars['ID']['input'];
  /** Delivery preference to be added/updated */
  deliveryPreference: VariableEnumFieldInput;
  /** Form ID for which the update needs to be done */
  formId: Scalars['String']['input'];
};

/** Result payload for updateTaxFormDeliveryPreference mutation */
export type UpdateTaxFormDeliveryPreferencePayload = {
  __typename?: 'UpdateTaxFormDeliveryPreferencePayload';
  /** error details, if any occurs */
  error?: Maybe<TaxPreferenceError>;
  /** The tax form delivery preference in DB */
  taxFormDeliveryPreference?: Maybe<TaxFormDeliveryPreference>;
};

export type UpdateTaxFormPrintingPreferenceInput = {
  companyId: Scalars['ID']['input'];
  formId: Scalars['String']['input'];
  printingPreference: VariableEnumFieldInput;
};

export type UpdateTaxFormPrintingPreferencePayload = {
  __typename?: 'UpdateTaxFormPrintingPreferencePayload';
  error?: Maybe<TaxPreferenceError>;
  taxFormPrintingPreference?: Maybe<TaxFormPrintingPreference>;
};

/** Input details for updating the Escrow (impounding) consent in DB. */
export type UpdateTaxPreferencesEscrowConsentInput = {
  /** Company (RealmId) ID of customer company */
  companyId: Scalars['ID']['input'];
  /** Type of consent on the Escrow (impounding) */
  type: TaxPreferencesEscrowConsentType;
};

/** Escrow (impounding) Consent payload details after update */
export type UpdateTaxPreferencesEscrowConsentPayload = {
  __typename?: 'UpdateTaxPreferencesEscrowConsentPayload';
  escrowConsent: TaxPreferencesEscrowConsent;
};

export type UpdateTaxPreferencesInput = {
  autoTaxPreferences?: InputMaybe<AutoTaxPreferencesInput>;
  companyId: Scalars['ID']['input'];
  electronicTaxServicesPreferred?: InputMaybe<Scalars['Boolean']['input']>;
  escrowConsentType?: InputMaybe<TaxPreferencesEscrowConsentType>;
  escrowTaxPreferences?: InputMaybe<EscrowTaxPreferencesInput>;
};

export type UpdateTaxPreferencesPayload = {
  __typename?: 'UpdateTaxPreferencesPayload';
  taxPreferences?: Maybe<TaxPreferences>;
};

export type UpdateTaxRegistrationOrderInput = {
  /** The key that indicates if the order has to be cancelled or not */
  cancel?: InputMaybe<Scalars['Boolean']['input']>;
  /** Company ID of the company being updated */
  companyId: Scalars['ID']['input'];
  /**
   * To fetch the order from vendor and update it if there is any change
   * and return the updated details of that particular order.
   */
  id: Scalars['ID']['input'];
};

export type UpdateTaxRegistrationOrderPayload = {
  __typename?: 'UpdateTaxRegistrationOrderPayload';
  error?: Maybe<TaxRegistrationError>;
  /** The tax registration order */
  order?: Maybe<TaxRegistrationOrder>;
};

export type UpdateTaxReportingInfoInput = {
  name: Scalars['String']['input'];
  taxInformation: TaxInformationInput;
};

/** Input details for persisting acknowledgement directly to Tax Setup Service */
export type UpdateTaxSetupAcknowledgementInput = {
  /** Company (RealmId) ID of customer company */
  companyId: Scalars['ID']['input'];
  /** Flow type indicating the UI flow */
  flowType: TaxSetupAcknowledgementFlowType;
  /** Type of acknowledgement - AUTO, MANUAL, or DIY */
  type: TaxSetupAcknowledgementType;
};

/** Payload returned after updating acknowledgement in TSS */
export type UpdateTaxSetupAcknowledgementPayload = {
  __typename?: 'UpdateTaxSetupAcknowledgementPayload';
  acknowledgement?: Maybe<TaxSetupAcknowledgement>;
  error?: Maybe<TaxSetupAcknowledgementError>;
};

/** Payload for updating a tax setup control */
export type UpdateTaxSetupControlPayload = {
  __typename?: 'UpdateTaxSetupControlPayload';
  /** Error details if the operation failed */
  error?: Maybe<TaxSetupControlError>;
  /** The updated tax setup control */
  taxSetupControl?: Maybe<TaxSetupControl>;
};

/** Input text notification channel for updateNotificationPreferences mutation. */
export type UpdateTextNotificationChannelInput = {
  /** Determines the Mobile number to be used for the notifications. */
  mobileNumber?: InputMaybe<PhoneNumberInput>;
  /** Determines input for text notifications to be enabled or disabled. Ex. AutoPayroll, DirectDeposit. */
  textNotifications?: InputMaybe<Array<UpdateTextNotificationInput>>;
};

export type UpdateTextNotificationInput = {
  /** Determines whether the notification will be enabled or disabled. */
  enabled: Scalars['Boolean']['input'];
  /** Determines the type of notification to be updated. Ex. AutoPayroll, DirectDeposit. */
  notificationType: Scalars['String']['input'];
};

/** input type for updating an existing custom time off category */
export type UpdateTimeOffCategoryInput = {
  /** The unique identifier of the category to update */
  categoryId: Scalars['ID']['input'];
  /** The updated name for the custom time off category */
  name: Scalars['String']['input'];
};

export type UpdateTransactionsToAccountMappingPreferencesInput = {
  /** Bank checking account selected for export */
  bankAccount?: InputMaybe<Scalars['String']['input']>;
  companyId: Scalars['ID']['input'];
  /** Account selected for export of contractor payment expenses */
  contractorPaymentExpensesAccount?: InputMaybe<Scalars['String']['input']>;
  contractorReimbursementExpensesAccount?: InputMaybe<Scalars['String']['input']>;
  /** Account selected for export of payroll corrections, deduction liabilities and assets */
  deductions?: InputMaybe<Array<EmployerDeductionToAccountMappingInput>>;
  /** Account selected for export of employee compensation expenses */
  employeeCompensationExpenses?: InputMaybe<EmployeeCompensationExpensesToAccountMappingInput>;
  /** Account selected for export of payroll liabilities */
  employeeCompensationLiabilities?: InputMaybe<Array<EmployerCompensationToAccountMappingInput>>;
  /** Account selected for employee reimbursement expenses */
  employeeReimbursementExpenses?: InputMaybe<EmployeeReimbursementExpensesToAccountMappingInput>;
  /** Account selected for export of company retirement, health insurance and non cash taxable benefit contribution expenses */
  employerContributionExpenses?: InputMaybe<EmployerContributionExpensesToAccountMappingInput>;
  /** Impounding Bank Account for export */
  taxImpoundAccount?: InputMaybe<Scalars['String']['input']>;
  /** Input for user's preferred method of mapping their tax liabilities to ledger accounts. */
  taxLiabilities?: InputMaybe<TaxLiabilitiesToAccountMappingInput>;
  /** Account selected for export of tax payment expenses */
  taxPaymentExpenses?: InputMaybe<TaxPaymentExpensesToAccountMappingInput>;
  /** Account selected for export of tax liabilities */
  taxPaymentLiabilities?: InputMaybe<Array<TaxPaymentGroupToAccountMappingInput>>;
};

export type UpdateTransactionsToAccountMappingPreferencesPayload = {
  __typename?: 'UpdateTransactionsToAccountMappingPreferencesPayload';
  company: Company;
  /** List of errors in case of failure of export preferences update mutation */
  errors?: Maybe<Array<TransactionsToAccountMappingPreferencesMutationError>>;
  /** Account name preferences setup for export to accounting software */
  transactionsToAccountMappingPreferences?: Maybe<TransactionsToAccountMappingPreferences>;
};

/** This is a one-of tagged union type acting as an input union, one and only one of these fields must be non-null. */
export type UpdateTransactionsToClassMappingCurrentPreferenceInput = {
  /** Updates mode of mapping classes to DIFFERENT_CLASSES and specifies the class assigned for each worker. */
  classByWorker?: InputMaybe<TransactionsToClassMappingByWorkerInput>;
  /** Updates mode of mapping classes to ONE_CLASS and specifies the class to export all transactions. */
  oneClass?: InputMaybe<Scalars['String']['input']>;
};

/** Updates mode of mapping classes to payroll transactions and class selected for export of transactions if classes are in use. */
export type UpdateTransactionsToClassMappingPreferencesInput = {
  companyId: Scalars['ID']['input'];
  /**
   * Specifies whether transactions are mapped to classes.
   * If trackClasses is false, updates mode to NO_CLASSES indicating class tracking is not in use.
   */
  trackClasses: Scalars['Boolean']['input'];
  /**
   * Updates mode and specifies the classes used to map transactions when trackClasses is true.
   * Should be null if and only if trackClasses is false.
   */
  transactionsToClassMapping?: InputMaybe<UpdateTransactionsToClassMappingCurrentPreferenceInput>;
};

export type UpdateTransactionsToClassMappingPreferencesPayload = {
  __typename?: 'UpdateTransactionsToClassMappingPreferencesPayload';
  /** List of errors received when the update fails. */
  errors: Array<TransactionsToClassMappingPreferencesMutationError>;
  /** Specifies the selected mode of class mapping and class name for transactions if classes are assigned to transactions. */
  transactionsToClassMappingPreferences?: Maybe<TransactionsToClassMappingPreferences>;
};

export type UpdateWorkLocationError = {
  __typename?: 'UpdateWorkLocationError';
  /** error code */
  code?: Maybe<Scalars['String']['output']>;
  /** error message */
  message: Scalars['String']['output'];
  /** error type */
  type?: Maybe<Scalars['String']['output']>;
};

/** Input type for editing a work location */
export type UpdateWorkLocationInput = {
  active: Scalars['Boolean']['input'];
  addressComponents: Array<VariableStringFieldInput>;
  addressID: Scalars['ID']['input'];
  companyID: Scalars['ID']['input'];
  /** Political subdivision code for a work location required to identify the tax collector for Pennsylvania */
  politicalSubdivisionCode?: InputMaybe<Scalars['String']['input']>;
  unitNumber?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateWorkLocationPayload = {
  __typename?: 'UpdateWorkLocationPayload';
  userError?: Maybe<UpdateWorkLocationError>;
  workLocation?: Maybe<CompanyAddress>;
};

export type UpdateWorkerPortalEmployerPreferencesPayload = {
  __typename?: 'UpdateWorkerPortalEmployerPreferencesPayload';
  userError?: Maybe<WorkerPortalEmployerPreferencesError>;
  workerPortalPreferences?: Maybe<WorkerPortalPreferences>;
};

/** Tax payment that was updated as a result of the approveAndScheduleTaxPayment mutation */
export type UpdatedTaxPayment = {
  __typename?: 'UpdatedTaxPayment';
  taxPayment: Payroll_Payments_TaxPayment;
};

/** An action that can be performed, something for a user to do. Encapsulates what kind of action it is and any additional information required to initiate it. Conceptually, some examples of actions would be "Edit employee Jane Doe's tax setup" or "Run payroll for Weekly pay schedule for June 7th". */
export type UserAction = {
  __typename?: 'UserAction';
  /** Additional paramters that describe describe the action */
  params: Array<UserActionParameter>;
  /** Uniquely identifies the type of action that this object represents */
  type: Scalars['String']['output'];
};

export type UserActionParameter = {
  __typename?: 'UserActionParameter';
  name: Scalars['String']['output'];
  /** The value of this parameter, serialized to a string. For scalar values the conversion is simple, but more complex values (objects, lists) may have more intricate serialization involved. */
  value?: Maybe<Scalars['String']['output']>;
};

/** A type that describes that there is an action that can be taken. Something for a user to do, which often will be tracked as an explicit 'todo', but may also be presented directly in other types. */
export type UserActionable = {
  action: UserAction;
};

export type UserEmployeeAccessByTaxIdentifierInput = {
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  /** Formatted and plaintext SSN or other tax identifier */
  taxIdentifier: Scalars['String']['input'];
};

export type UserEmployeeAccessError = {
  __typename?: 'UserEmployeeAccessError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type UserEmployeeAccessPayload = {
  __typename?: 'UserEmployeeAccessPayload';
  /** Payroll data that the user now has access to */
  employees?: Maybe<Array<Employee>>;
  error?: Maybe<UserEmployeeAccessError>;
};

/** Input for validating EIN against legal business name */
export type ValidateEinInput = {
  /** The Employer Identification Number in format XX-XXXXXXX or XXXXXXXXX */
  ein: Scalars['String']['input'];
  /** The legal business name to validate */
  legalName: Scalars['String']['input'];
  /** Types of validations to perform */
  taxIdentifierValidations: Array<TaxIdentifierValidationType>;
};

/** Result of EIN validation */
export type ValidateEinResult = {
  __typename?: 'ValidateEinResult';
  /** Whether the EIN matches the legal business name */
  valid: Scalars['Boolean']['output'];
};

export type VariableBooleanField = VariableField & {
  __typename?: 'VariableBooleanField';
  fieldId: Scalars['String']['output'];
  value?: Maybe<Scalars['Boolean']['output']>;
};


export type VariableBooleanFieldFieldIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type VariableBooleanFieldInput = {
  fieldId: Scalars['String']['input'];
  value: Scalars['Boolean']['input'];
};

export type VariableDateField = VariableField & {
  __typename?: 'VariableDateField';
  fieldId: Scalars['String']['output'];
  value?: Maybe<Scalars['Date']['output']>;
};


export type VariableDateFieldFieldIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type VariableDateTimeField = VariableField & {
  __typename?: 'VariableDateTimeField';
  fieldId: Scalars['String']['output'];
  value?: Maybe<Scalars['DateTime']['output']>;
};


export type VariableDateTimeFieldFieldIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type VariableEnumField = VariableField & {
  __typename?: 'VariableEnumField';
  fieldId: Scalars['String']['output'];
  value?: Maybe<Scalars['String']['output']>;
};


export type VariableEnumFieldFieldIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};


export type VariableEnumFieldValueArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type VariableEnumFieldInput = {
  fieldId: Scalars['String']['input'];
  value?: InputMaybe<Scalars['String']['input']>;
};

export type VariableField = {
  /** Identifies the field that is represented by this object */
  fieldId: Scalars['String']['output'];
};


export type VariableFieldFieldIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type VariableFloatField = VariableField & {
  __typename?: 'VariableFloatField';
  fieldId: Scalars['String']['output'];
  value?: Maybe<Scalars['Float']['output']>;
};


export type VariableFloatFieldFieldIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type VariableIntField = VariableField & {
  __typename?: 'VariableIntField';
  fieldId: Scalars['String']['output'];
  value?: Maybe<Scalars['Int']['output']>;
};


export type VariableIntFieldFieldIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type VariableMoneyField = VariableField & {
  __typename?: 'VariableMoneyField';
  fieldId: Scalars['String']['output'];
  value?: Maybe<Scalars['Money']['output']>;
};


export type VariableMoneyFieldFieldIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type VariableMoneyFieldInput = {
  fieldId: Scalars['String']['input'];
  value?: InputMaybe<Scalars['Money']['input']>;
};

export type VariableStringField = VariableField & {
  __typename?: 'VariableStringField';
  fieldId: Scalars['String']['output'];
  value?: Maybe<Scalars['String']['output']>;
};


export type VariableStringFieldFieldIdArgs = {
  format?: InputMaybe<Payroll_KeyFormat>;
};

export type VariableStringFieldInput = {
  fieldId: Scalars['String']['input'];
  value?: InputMaybe<Scalars['String']['input']>;
};

export type VariableTypeField = VariableBooleanField | VariableDateField | VariableDateTimeField | VariableEnumField | VariableFloatField | VariableIntField | VariableMoneyField | VariableStringField;

/**
 * VariableTypeField is an union and currently GraphQL doesn't support union of inputs.
 * Ref: https://github.com/graphql/graphql-spec/blob/master/rfcs/InputUnion.md
 *
 * Only one of the fields in an input type may be provided.
 */
export type VariableTypeFieldInput = {
  booleanValue?: InputMaybe<Scalars['Boolean']['input']>;
  dateTimeValue?: InputMaybe<Scalars['DateTime']['input']>;
  dateValue?: InputMaybe<Scalars['Date']['input']>;
  enumValue?: InputMaybe<Scalars['String']['input']>;
  fieldId: Scalars['String']['input'];
  floatValue?: InputMaybe<Scalars['Float']['input']>;
  intValue?: InputMaybe<Scalars['Int']['input']>;
  moneyValue?: InputMaybe<Scalars['Money']['input']>;
  stringValue?: InputMaybe<Scalars['String']['input']>;
};

/** Represents a document that has been used to verify and/or authorize certain process, a form or a different document */
export type VerificationDocument = Document & EntityInterface & Node & {
  __typename?: 'VerificationDocument';
  /** Holds all detail values of the verification document */
  attributes: Array<VariableTypeField>;
  externalIds?: Maybe<Array<Maybe<Common_ExternalId>>>;
  id: Scalars['ID']['output'];
  meta?: Maybe<Common_Metadata>;
  /** Combination of documents that must be presented together to complete required verification Eg: Foreign passport together with a Form I-94 containing an endorsement of the alien’s nonimmigrant status is required to verify that an employee is authorized to be hired to work. */
  supportingDocuments?: Maybe<Array<VerificationDocument>>;
  /** Identifies the type of the document. Eg: PASSPORT, I-94, SOCIAL_SECURITY_CARD */
  type: Scalars['String']['output'];
};


/** Represents a document that has been used to verify and/or authorize certain process, a form or a different document */
export type VerificationDocumentAttributesArgs = {
  sensitized?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Detail values to fill a verification document */
export type VerificationDocumentAttributesInput = {
  /** List of attributes of the document to add or update if already existing */
  additions: Array<VariableTypeFieldInput>;
  /** List of attribute fieldIds of the document to be deleted if existing */
  removals: Array<Scalars['String']['input']>;
};

/** Represents mutation input for a document used to verify and/or authorize certain process, a form or a different document */
export type VerificationDocumentInput = {
  /** detail values of the verification document */
  attributes?: InputMaybe<VerificationDocumentAttributesInput>;
  /** Combination of documents that must be presented together to complete required verification Eg: Foreign passport together with a Form I-94 containing an endorsement of the alien’s nonimmigrant status is required to verify that an employee is authorized to be hired to work. */
  supportingDocuments?: InputMaybe<Array<VerificationDocumentInput>>;
  /** Identifies the type of the document. Eg: PASSPORT, SOCIAL_SECURITY_CARD */
  type: Scalars['String']['input'];
};

export type VoidPayslipsInput = {
  /** Reason for creating amendments */
  amendmentsReason?: InputMaybe<Scalars['String']['input']>;
  companyId: Scalars['ID']['input'];
  /** Create amendments for closed quarter correction */
  createAmendmentsCase?: InputMaybe<Scalars['Boolean']['input']>;
  payslipIds: Array<Scalars['ID']['input']>;
};

/** Result of the 'voidPayslips' mutation. Provides a list of successful and errored void actions on a batch of payslips. */
export type VoidPayslipsPayload = {
  __typename?: 'VoidPayslipsPayload';
  /** Created amendments for closed quarter correction */
  createdAmendmentsCase?: Maybe<Scalars['Boolean']['output']>;
  /** List of payslips that weren't able to be voided and associated list of errors as to why void was unsuccesssful */
  failures?: Maybe<Array<PayslipCorrectionFailure>>;
  /** List of the successfully voided payslips and their associated rollback adjustment payslips */
  successes?: Maybe<Array<PayslipVoidSuccess>>;
  /** Boolean to represent if any of the voided payslips have an associated approved tax payments. If a customer has already paid their payroll taxes for at least one of the payslips, voiding these payslips may result in an overpayment or underpayment of taxes. If this boolean returns as true, the customer's tax liabilities have changed, and a corrective action may be required. */
  taxPaymentsImpacted?: Maybe<Scalars['Boolean']['output']>;
};

/**
 * Defines Wallet information. A Wallet is a financial instrument like a Bank account, QuickBooks Cash account or Credit/Debit card.
 * This is provided by the external Wallet service. Please refer to https://devportal.intuit.com/app/dp/resource/650787738343516891/overview for more information.
 */
export type Wallet = Node & {
  __typename?: 'Wallet';
  /** Id of the Wallet */
  id: Scalars['ID']['output'];
  /**
   * Payroll bank account balance information for this wallet.
   * This provides the current balance, account details, and status of the payroll bank account.
   */
  payrollBankAccountBalance?: Maybe<PayrollBankAccountBalance>;
};

/**
 * Defines Wallet information. A Wallet is a financial instrument like a Bank account, QuickBooks Cash account or Credit/Debit card.
 * This is provided by the external Wallet service. Please refer to https://devportal.intuit.com/app/dp/resource/650787738343516891/overview for more information.
 */
export type WalletInput = {
  /** Id of the Wallet */
  id: Scalars['ID']['input'];
  /**
   * Specifies if this Wallet is a Credit Karma bank account or not. This field should be ignored in almost all cases, as the client should not have to specify this value at all.
   * It is exposed only as a short term workaround and is planned to be removed in the near future.
   */
  isCKWallet?: InputMaybe<Scalars['Boolean']['input']>;
};

/** MetaModel for Wallet */
export type WalletMetaModel = MetaModel & {
  __typename?: 'WalletMetaModel';
  applicable: Scalars['Boolean']['output'];
  id: MetaString;
  isCKWallet?: Maybe<MetaBoolean>;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

/** Defines the time an employee is contractually obligated to work each week. Defining a weekly contract in two different ways is supported because of the different compliance rules between jurisdictions; a single company should use one or the other, not both. */
export type WeeklyContractedHours = WeeklyContractedHoursPerDay | WeeklyContractedHoursPerWeek;

/** Defines the contracted time values in terms of hours per day and days per week */
export type WeeklyContractedHoursPerDay = {
  __typename?: 'WeeklyContractedHoursPerDay';
  daysPerWeek: Scalars['Float']['output'];
  hoursPerDay: Scalars['Float']['output'];
};

export type WeeklyContractedHoursPerDayInput = {
  daysPerWeek: Scalars['Float']['input'];
  hoursPerDay: Scalars['Float']['input'];
};

/** Defines the contracted time by directly collecting hours per week */
export type WeeklyContractedHoursPerWeek = {
  __typename?: 'WeeklyContractedHoursPerWeek';
  hoursPerWeek: Scalars['Float']['output'];
};

export type WeeklyContractedHoursPerWeekInput = {
  hoursPerWeek: Scalars['Float']['input'];
};

/**
 * Defines the contracted time values such as hours per day and days per week
 * @deprecated: Use WeeklyContractedHoursPerDay instead
 */
export type WeeklyContractedTime = {
  __typename?: 'WeeklyContractedTime';
  daysPerWeek: Scalars['Float']['output'];
  hoursPerDay: Scalars['Float']['output'];
};

/** @deprecated: Use WeeklyContractedHoursPerDayInput instead */
export type WeeklyContractedTimeInput = {
  daysPerWeek: Scalars['Float']['input'];
  hoursPerDay: Scalars['Float']['input'];
};

/** @deprecated: Use WeeklyContractedHoursPerDayMetaModel instead */
export type WeeklyContractedTimeMetaModel = MetaModel & {
  __typename?: 'WeeklyContractedTimeMetaModel';
  applicable: Scalars['Boolean']['output'];
  daysPerWeek: MetaFloat;
  hoursPerDay: MetaFloat;
  label: Scalars['String']['output'];
  readOnly: Scalars['Boolean']['output'];
  requirementGroups: Array<RequirementGroup>;
  typeRef: Scalars['String']['output'];
};

export type WithdrawalDatePreviewInput = {
  paymentDate: Scalars['Date']['input'];
};

export type WithdrawalDatePreviewResult = {
  __typename?: 'WithdrawalDatePreviewResult';
  userError?: Maybe<TaxPaymentError>;
  withdrawalDate?: Maybe<Scalars['Date']['output']>;
};

/**
 * Employees can be filtered by work location (`CompanyAddress`) id.
 * When includeAdditionalWorkLocationAssignments is true, employees are matched against all
 * work location assignments (primary + additional) via PWS.
 * When false or omitted, only employees whose primary work location matches are returned.
 */
export type WorkLocationFilter = {
  id: IdFilter;
};

export type WorkLocationInput = {
  id: Scalars['ID']['input'];
};

/**
 * Breakdown info with work location address and detail containing employee count and total compensation
 * for each work location in a company for each month of a quarter
 */
export type WorkLocationQuarterlyBreakdown = {
  __typename?: 'WorkLocationQuarterlyBreakdown';
  detail: PayrollReportCompensationQuarterlyDetail;
  workLocation: CompanyAddress;
};

export type WorkLocationsQuarterlyAggregation = {
  __typename?: 'WorkLocationsQuarterlyAggregation';
  /** Breakdown of employee count and total compensation for each work location in a company for each month of a quarter */
  breakdowns: Array<WorkLocationQuarterlyBreakdown>;
  /** Months belong to the quarter */
  months: Array<Month>;
  /** Quarter starting from 1 and ending at 4 */
  quarter: Scalars['Int']['output'];
  /** The aggregation of employee counts and total compensation for all work locations in a company for each month of a quarter */
  totalDetail: PayrollReportCompensationQuarterlyDetail;
  year: Scalars['Int']['output'];
};

export type WorkLocationsQuarterlyReport = {
  __typename?: 'WorkLocationsQuarterlyReport';
  /** Data aggregated across multiple work locations for the specified quarter */
  aggregation?: Maybe<WorkLocationsQuarterlyAggregation>;
  /** Work locations report with report data rendering detail */
  renderings?: Maybe<WorkLocationsQuarterlyReportRenderings>;
};

export type WorkLocationsQuarterlyReportFilter = {
  /** To fetch data for a quarter in which the input date falls */
  dateInQuarter: Scalars['Date']['input'];
  workLocation?: InputMaybe<PayslipWorkLocationFilter>;
};

export type WorkLocationsQuarterlyReportInput = {
  filterBy: WorkLocationsQuarterlyReportFilter;
};

/** Input fields for work locations quartely report pdf rendering */
export type WorkLocationsQuarterlyReportPdfRenderInput = {
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /** Specifies if the header will be repeated for each page or not. */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

/** Returns renderings such as excel, pdf for work locations quartely aggregated report */
export type WorkLocationsQuarterlyReportRenderings = {
  __typename?: 'WorkLocationsQuarterlyReportRenderings';
  excel: FileRendering;
  pdf: FileRendering;
};


/** Returns renderings such as excel, pdf for work locations quartely aggregated report */
export type WorkLocationsQuarterlyReportRenderingsPdfArgs = {
  input?: InputMaybe<WorkLocationsQuarterlyReportPdfRenderInput>;
};

export type Worker = {
  company: Company;
  id: Scalars['ID']['output'];
};

export type WorkerInput = {
  companyId?: InputMaybe<Scalars['ID']['input']>;
  employeeId?: InputMaybe<Scalars['ID']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type WorkerPortalEmployerPreferencesError = {
  __typename?: 'WorkerPortalEmployerPreferencesError';
  code: Scalars['String']['output'];
  message: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type WorkerPortalEmployerPreferencesInput = {
  companyId: Scalars['ID']['input'];
  workerPortalPreferences: WorkerPortalPreferencesInput;
};

/** Employer preferences */
export type WorkerPortalPreferences = {
  __typename?: 'WorkerPortalPreferences';
  /**
   * Employer preferences to enable/disable their employees to edit their personal, bank and tax info in Worker Portal application
   * Format of employeeEditPreferences - list of <PreferenceName(string), PreferenceValue(boolean)>
   */
  employeeEditPreferences: Array<VariableBooleanField>;
  /**
   * Employer preference to show/hide org chart to employees on Workforce. This will also include the preference to show/hide email, and phone number as well.
   * Format of orgChartPreferences - list of <PreferenceName(string), PreferenceValue(boolean)>
   */
  orgChartPreferences: Array<VariableBooleanField>;
};

export type WorkerPortalPreferencesInput = {
  employeeEditPreferences: Array<VariableBooleanFieldInput>;
  orgChartPreferences?: InputMaybe<Array<VariableBooleanFieldInput>>;
};

export type WorkersCompensationByEmployeeBreakdown = {
  __typename?: 'WorkersCompensationByEmployeeBreakdown';
  edges?: Maybe<Array<Maybe<WorkersCompensationByEmployeeBreakdownDetailEdge>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type WorkersCompensationByEmployeeBreakdownDetail = {
  __typename?: 'WorkersCompensationByEmployeeBreakdownDetail';
  amountDetail: WorkersCompensationReportAmountDetail;
  employee: Employee;
  workLocation: CompanyAddress;
  /** For unspecified wokers compensation class, this will be returned as null */
  workersCompensationClass?: Maybe<EmployeeWorkersCompensationClass>;
};

export type WorkersCompensationByEmployeeBreakdownDetailEdge = {
  __typename?: 'WorkersCompensationByEmployeeBreakdownDetailEdge';
  /** The item at the end of the edge */
  node?: Maybe<WorkersCompensationByEmployeeBreakdownDetail>;
};

/**
 * A policy that exists at the employer (company) level for an employee workers compensation class
 * that can be assigned to one or more employees.
 */
export type WorkersCompensationClass = {
  /** Name of the workers compensation class */
  employeeClass?: Maybe<Scalars['String']['output']>;
};

/** Filtering option by workers compensation class name(s) or set the preset as 'UNSPECIFIED' for filtering by unspecified class name */
export type WorkersCompensationClassFilter = {
  className?: InputMaybe<Scalars['String']['input']>;
  preset?: InputMaybe<WorkersCompensationClassFilterPreset>;
};

export enum WorkersCompensationClassFilterPreset {
  /** Workers compensation class name not specified */
  Unspecified = 'UNSPECIFIED'
}

/** Enum for filtering workers compensation classes by type */
export enum WorkersCompensationClassType {
  External = 'EXTERNAL',
  Managed = 'MANAGED'
}

/** Workers' compensation classification defined by states */
export type WorkersCompensationClassification = {
  __typename?: 'WorkersCompensationClassification';
  /** code representing a category of work defined by state */
  classCode: Scalars['String']['output'];
  /** code representing a sub category of work defined by state */
  subClassCode?: Maybe<Scalars['String']['output']>;
};

/** Input workers' compensation classification for createAndAssignEmployerManagedWorkersCompensation mutation. */
export type WorkersCompensationClassificationInput = {
  classCode: Scalars['String']['input'];
  subClassCode?: InputMaybe<Scalars['String']['input']>;
};

/** Workers' compensation cost that determines the total cost towards workers' compensation liability / expenses based on effective date */
export type WorkersCompensationCost = {
  __typename?: 'WorkersCompensationCost';
  /** The Effective date is used to calculate a contiguous series of cost over time that will be applied to the employee class on a given date. */
  effectiveDate: Scalars['Date']['output'];
  /** Employee's contribution towards workers compensation, deducted from paycheck. */
  employeeContribution?: Maybe<Rate>;
  /** The workers' compensation total cost (effective as of its effective date). */
  totalCost: Rate;
};

export type WorkersCompensationError = {
  __typename?: 'WorkersCompensationError';
  code?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  type?: Maybe<Scalars['String']['output']>;
};

export type WorkersCompensationReport = {
  __typename?: 'WorkersCompensationReport';
  /** Workers Compensation Report with report data rendering detail */
  renderings?: Maybe<WorkersCompensationReportRenderings>;
  /**
   * The total aggregation of wages paid for each workers compensation class
   * This will be null if total amounts data returned as an empty array
   */
  totalAggregation?: Maybe<WorkersCompensationReportAmountDetail>;
  /**
   * List of total and aggregated wages paid of wages paid by each workers compensation class
   * or location (i.e. state/province or work location)
   */
  totalAmounts: WorkersCompensationReportTotalDetails;
  /**
   * Report to show total and aggregated wages paid by each employee for a specific workers compensation class
   * and location (i.e. state/province or work location)
   * If no data for the input filter option(s), this will be null returned.
   */
  totalAmountsByEmployee?: Maybe<WorkersCompensationReportByEmployee>;
  /**
   * List of work locations not supported for this report. i.e. located in WA, WY
   * If no unsuported work location, it will return an empty array.
   */
  unsupportedWorkLocations: Array<CompanyAddress>;
};


export type WorkersCompensationReportTotalAmountsByEmployeeArgs = {
  input: WorkersCompensationReportByEmployeeInput;
};

/** Wages paid by employer to estimate workerts compensation cost */
export type WorkersCompensationReportAmountDetail = {
  __typename?: 'WorkersCompensationReportAmountDetail';
  employeeTaxesAmount: Scalars['Money']['output'];
  premiumWagesAmount: Scalars['Money']['output'];
  tipsAmount: Scalars['Money']['output'];
  wagesAmount: Scalars['Money']['output'];
};

export type WorkersCompensationReportByEmployee = {
  __typename?: 'WorkersCompensationReportByEmployee';
  detail?: Maybe<WorkersCompensationReportByEmployeeDetail>;
};

export type WorkersCompensationReportByEmployeeDetail = {
  __typename?: 'WorkersCompensationReportByEmployeeDetail';
  /** Report to show wages paid for each employee of a workers compensation class and work location */
  breakdowns: WorkersCompensationByEmployeeBreakdown;
  /**
   * Report to show total aggregated amounts of employees for a speicific workers compensation class and work location combination.
   * If no breakdown with empty array, this will be null.
   */
  total?: Maybe<WorkersCompensationReportAmountDetail>;
};

export type WorkersCompensationReportByEmployeeInput = {
  workLocation: WorkersCompensationReportByEmployee_WorkLocationFilter;
  /** Filtering option by single workers compensation class name or set 'UNSPECIFIED' for filtering by unspecified workers compensation class name */
  workersCompensationClass: WorkersCompensationClassFilter;
};

export type WorkersCompensationReportByEmployeePdfRenderInput = {
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /**
   * Specifies if a header such as company name, date etc. should be repeated for each page of the pdf or not.
   * If not specified, it will be false by default
   */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

export type WorkersCompensationReportByEmployeeRenderings = {
  __typename?: 'WorkersCompensationReportByEmployeeRenderings';
  excel?: Maybe<FileRendering>;
  pdf?: Maybe<FileRendering>;
};


export type WorkersCompensationReportByEmployeeRenderingsPdfArgs = {
  input: WorkersCompensationReportByEmployeePdfRenderInput;
};

export type WorkersCompensationReportByEmployee_WorkLocationFilter = {
  /** work location id */
  id?: InputMaybe<Scalars['ID']['input']>;
  /** either state or province  i.e. 'CA', 'NY' */
  location?: InputMaybe<Scalars['String']['input']>;
};

export type WorkersCompensationReportInput = {
  payDate: PayslipPayDateFilter;
  workLocation?: InputMaybe<IdFilter>;
  workersCompensationClass?: InputMaybe<WorkersCompensationClassFilter>;
};

/**
 * Workers compensation report supports various renderings for
 * total amounts view and for total amount by employee breakdown view. Note that
 * each rendering also includes aggregated totals for the report
 */
export type WorkersCompensationReportRenderings = {
  __typename?: 'WorkersCompensationReportRenderings';
  totalAmounts?: Maybe<WorkersCompensationReportTotalDetailsRenderings>;
  totalAmountsByEmployee?: Maybe<WorkersCompensationReportByEmployeeRenderings>;
};


/**
 * Workers compensation report supports various renderings for
 * total amounts view and for total amount by employee breakdown view. Note that
 * each rendering also includes aggregated totals for the report
 */
export type WorkersCompensationReportRenderingsTotalAmountsByEmployeeArgs = {
  input: WorkersCompensationReportByEmployeeInput;
};

export type WorkersCompensationReportTotalDetail = {
  __typename?: 'WorkersCompensationReportTotalDetail';
  amountDetail: WorkersCompensationReportAmountDetail;
  workLocation: WorkersCompensationReportTotalDetailWorkLocation;
  /** For unspecified wokers compensation class, this will be returned as null */
  workersCompensationClass?: Maybe<EmployeeWorkersCompensationClass>;
};

export type WorkersCompensationReportTotalDetailEdge = {
  __typename?: 'WorkersCompensationReportTotalDetailEdge';
  /** The item at the end of the edge */
  node?: Maybe<WorkersCompensationReportTotalDetail>;
};

export type WorkersCompensationReportTotalDetailWorkLocation = {
  __typename?: 'WorkersCompensationReportTotalDetailWorkLocation';
  /** either state or province  i.e. 'CA', 'NY' */
  location: Scalars['String']['output'];
};

export type WorkersCompensationReportTotalDetails = {
  __typename?: 'WorkersCompensationReportTotalDetails';
  edges?: Maybe<Array<Maybe<WorkersCompensationReportTotalDetailEdge>>>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type WorkersCompensationReportTotalDetailsPdfRenderInput = {
  /** Specifies the page orientation for the pdf document. */
  pageOrientation?: InputMaybe<PageOrientation>;
  /**
   * Specifies if a header such as company name, date etc. should be repeated for each page of the pdf or not.
   * If not specified, it will be false by default
   */
  repeatedHeader?: InputMaybe<Scalars['Boolean']['input']>;
};

export type WorkersCompensationReportTotalDetailsRenderings = {
  __typename?: 'WorkersCompensationReportTotalDetailsRenderings';
  excel?: Maybe<FileRendering>;
  pdf?: Maybe<FileRendering>;
};


export type WorkersCompensationReportTotalDetailsRenderingsPdfArgs = {
  input: WorkersCompensationReportTotalDetailsPdfRenderInput;
};

/** Work Place Pension Payment Frequency of a particular NEST pension payment */
export enum WorkplacePensionPaymentFrequency {
  EveryFourWeek = 'EVERY_FOUR_WEEK',
  EveryOtherWeek = 'EVERY_OTHER_WEEK',
  Monthly = 'MONTHLY',
  TaxMonthly = 'TAX_MONTHLY',
  TaxWeekly = 'TAX_WEEKLY',
  Weekly = 'WEEKLY'
}

/** Work Place Pension report shows the pension summary for all the employees in a pay period */
export type WorkplacePensionReport = {
  __typename?: 'WorkplacePensionReport';
  renderings?: Maybe<WorkplacePensionReportRenderings>;
};

/** Work Place Pension report is filtered by pension deduction id and pay date, and pay frequency */
export type WorkplacePensionReportFilter = {
  deductionPolicyId: IdFilter;
  payDate: Scalars['Date']['input'];
  payFrequency: PayScheduleFrequency;
  reportType: WorkplacePensionReportType;
};

/** Input fields for Work Place Pension report */
export type WorkplacePensionReportInput = {
  filterBy: WorkplacePensionReportFilter;
  paymentDueDate?: InputMaybe<Scalars['Date']['input']>;
  paymentFrequency?: InputMaybe<WorkplacePensionPaymentFrequency>;
  paymentSource?: InputMaybe<Scalars['String']['input']>;
};

/** Work Place Pension report rendering detail */
export type WorkplacePensionReportRenderings = {
  __typename?: 'WorkplacePensionReportRenderings';
  excel: FileRendering;
};

export enum WorkplacePensionReportType {
  Contributions = 'CONTRIBUTIONS',
  Memberships = 'MEMBERSHIPS',
  PensionSummary = 'PENSION_SUMMARY'
}

/** in some cases both boolean value and date have to passed as input for each field. */
export type YearToDateOverrideInput = {
  booleanValue?: InputMaybe<Scalars['Boolean']['input']>;
  date?: InputMaybe<Scalars['Date']['input']>;
  fieldId: Scalars['String']['input'];
};

export type GetEmployeeDataForTimeEntriesQuery_company_Company_employees_EmployeeConnection_edges_EmployeeEdge_node_Employee_externalIds_Common_ExternalId = { __typename?: 'Common_ExternalId', localId?: string, realmId?: string, namespaceId?: string };

export type GetEmployeeDataForTimeEntriesQuery_company_Company_employees_EmployeeConnection_edges_EmployeeEdge_node_Employee_employmentDetail_Payroll_Employee_EmploymentDetail_jobCosting_EmployeeJobCosting = { __typename?: 'EmployeeJobCosting', costRate?: any, billRate?: any };

export type GetEmployeeDataForTimeEntriesQuery_company_Company_employees_EmployeeConnection_edges_EmployeeEdge_node_Employee_employmentDetail_Payroll_Employee_EmploymentDetail = { __typename?: 'Payroll_Employee_EmploymentDetail', jobCosting?: GetEmployeeDataForTimeEntriesQuery_company_Company_employees_EmployeeConnection_edges_EmployeeEdge_node_Employee_employmentDetail_Payroll_Employee_EmploymentDetail_jobCosting_EmployeeJobCosting };

export type GetEmployeeDataForTimeEntriesQuery_company_Company_employees_EmployeeConnection_edges_EmployeeEdge_node_Employee = { __typename: 'Employee', id: string, displayName?: string, externalIds?: Array<GetEmployeeDataForTimeEntriesQuery_company_Company_employees_EmployeeConnection_edges_EmployeeEdge_node_Employee_externalIds_Common_ExternalId>, employmentDetail?: GetEmployeeDataForTimeEntriesQuery_company_Company_employees_EmployeeConnection_edges_EmployeeEdge_node_Employee_employmentDetail_Payroll_Employee_EmploymentDetail };

export type GetEmployeeDataForTimeEntriesQuery_company_Company_employees_EmployeeConnection_edges_EmployeeEdge = { __typename: 'EmployeeEdge', node?: GetEmployeeDataForTimeEntriesQuery_company_Company_employees_EmployeeConnection_edges_EmployeeEdge_node_Employee };

export type GetEmployeeDataForTimeEntriesQuery_company_Company_employees_EmployeeConnection = { __typename: 'EmployeeConnection', edges: Array<GetEmployeeDataForTimeEntriesQuery_company_Company_employees_EmployeeConnection_edges_EmployeeEdge> };

export type GetEmployeeDataForTimeEntriesQuery_company_Company = { __typename: 'Company', id: string, employees?: GetEmployeeDataForTimeEntriesQuery_company_Company_employees_EmployeeConnection };

export type GetEmployeeDataForTimeEntriesQuery_Query = { __typename?: 'Query', company?: GetEmployeeDataForTimeEntriesQuery_company_Company };


export type GetEmployeeDataForTimeEntriesQueryVariables = Exact<{
  employeeIdFilter?: InputMaybe<IdFilter>;
  pagination?: InputMaybe<PaginationInput>;
  employeeSortInput?: InputMaybe<EmployeeConnectionOrderBy>;
}>;


export type GetEmployeeDataForTimeEntriesQuery = GetEmployeeDataForTimeEntriesQuery_Query;

export type GetFilteredWageItemsDataForTimeEntriesQuery_company_Company_companyInfo_Company_CompanyInfo_employerInfo_Company_EmployerInfo_employerCompensations_EmployerCompensation = { __typename: 'EmployerCompensation', id: string, name: string, type: string, active: boolean };

export type GetFilteredWageItemsDataForTimeEntriesQuery_company_Company_companyInfo_Company_CompanyInfo_employerInfo_Company_EmployerInfo = { __typename: 'Company_EmployerInfo', employerCompensations?: Array<GetFilteredWageItemsDataForTimeEntriesQuery_company_Company_companyInfo_Company_CompanyInfo_employerInfo_Company_EmployerInfo_employerCompensations_EmployerCompensation> };

export type GetFilteredWageItemsDataForTimeEntriesQuery_company_Company_companyInfo_Company_CompanyInfo = { __typename: 'Company_CompanyInfo', id: string, employerInfo?: GetFilteredWageItemsDataForTimeEntriesQuery_company_Company_companyInfo_Company_CompanyInfo_employerInfo_Company_EmployerInfo };

export type GetFilteredWageItemsDataForTimeEntriesQuery_company_Company = { __typename: 'Company', id: string, companyInfo?: GetFilteredWageItemsDataForTimeEntriesQuery_company_Company_companyInfo_Company_CompanyInfo };

export type GetFilteredWageItemsDataForTimeEntriesQuery_Query = { __typename?: 'Query', company?: GetFilteredWageItemsDataForTimeEntriesQuery_company_Company };


export type GetFilteredWageItemsDataForTimeEntriesQueryVariables = Exact<{
  filterBy?: InputMaybe<EmployerCompensationsFilter>;
}>;


export type GetFilteredWageItemsDataForTimeEntriesQuery = GetFilteredWageItemsDataForTimeEntriesQuery_Query;

export type GetEmployeeByIdQuery_company_Company_employee_Employee_externalIds_Common_ExternalId = { __typename?: 'Common_ExternalId', localId?: string, realmId?: string, namespaceId?: string };

export type GetEmployeeByIdQuery_company_Company_employee_Employee_employmentDetail_Payroll_Employee_EmploymentDetail_jobCosting_EmployeeJobCosting = { __typename?: 'EmployeeJobCosting', costRate?: any, billRate?: any, billable: boolean };

export type GetEmployeeByIdQuery_company_Company_employee_Employee_employmentDetail_Payroll_Employee_EmploymentDetail = { __typename?: 'Payroll_Employee_EmploymentDetail', jobCosting?: GetEmployeeByIdQuery_company_Company_employee_Employee_employmentDetail_Payroll_Employee_EmploymentDetail_jobCosting_EmployeeJobCosting };

export type GetEmployeeByIdQuery_company_Company_employee_Employee_timeOffPolicies_EmployeeTimeOffPolicy_employerTimeOffPolicy_EmployerTimeOffPolicy = { __typename?: 'EmployerTimeOffPolicy', timeOffMethod: TimeOffMethod };

export type GetEmployeeByIdQuery_company_Company_employee_Employee_timeOffPolicies_EmployeeTimeOffPolicy = { __typename?: 'EmployeeTimeOffPolicy', employerTimeOffPolicy: GetEmployeeByIdQuery_company_Company_employee_Employee_timeOffPolicies_EmployeeTimeOffPolicy_employerTimeOffPolicy_EmployerTimeOffPolicy };

export type GetEmployeeByIdQuery_company_Company_employee_Employee = { __typename?: 'Employee', id: string, displayName?: string, externalIds?: Array<GetEmployeeByIdQuery_company_Company_employee_Employee_externalIds_Common_ExternalId>, employmentDetail?: GetEmployeeByIdQuery_company_Company_employee_Employee_employmentDetail_Payroll_Employee_EmploymentDetail, timeOffPolicies?: Array<GetEmployeeByIdQuery_company_Company_employee_Employee_timeOffPolicies_EmployeeTimeOffPolicy> };

export type GetEmployeeByIdQuery_company_Company = { __typename: 'Company', id: string, employee?: GetEmployeeByIdQuery_company_Company_employee_Employee };

export type GetEmployeeByIdQuery_Query = { __typename?: 'Query', company?: GetEmployeeByIdQuery_company_Company };


export type GetEmployeeByIdQueryVariables = Exact<{
  employeeId: Scalars['ID']['input'];
  shouldFetchTimeOffPolicies: Scalars['Boolean']['input'];
}>;


export type GetEmployeeByIdQuery = GetEmployeeByIdQuery_Query;

export type WorkersByUserIdQuery_workersByUserId_Employee_externalIds_Common_ExternalId = { __typename?: 'Common_ExternalId', localId?: string, namespaceId?: string, realmId?: string };

export type WorkersByUserIdQuery_workersByUserId_Contractor = { __typename?: 'Contractor', id: string };

export type WorkersByUserIdQuery_workersByUserId_Employee = { __typename?: 'Employee', id: string, externalIds?: Array<WorkersByUserIdQuery_workersByUserId_Employee_externalIds_Common_ExternalId> };

export type WorkersByUserIdQuery_workersByUserId = WorkersByUserIdQuery_workersByUserId_Contractor | WorkersByUserIdQuery_workersByUserId_Employee;

export type WorkersByUserIdQuery_Query = { __typename?: 'Query', workersByUserId: Array<WorkersByUserIdQuery_workersByUserId> };


export type WorkersByUserIdQueryVariables = Exact<{
  input?: InputMaybe<WorkerInput>;
}>;


export type WorkersByUserIdQuery = WorkersByUserIdQuery_Query;


export const GetEmployeeDataForTimeEntriesDocument = gql`
    query getEmployeeDataForTimeEntries($employeeIdFilter: IDFilter, $pagination: PaginationInput, $employeeSortInput: EmployeeConnectionOrderBy) {
  company {
    __typename
    id
    employees(
      filterBy: {employeeId: $employeeIdFilter}
      pagination: $pagination
      sortBy: $employeeSortInput
    ) {
      __typename
      edges {
        __typename
        node {
          __typename
          id
          displayName
          externalIds {
            localId
            realmId
            namespaceId
          }
          employmentDetail {
            jobCosting {
              costRate
              billRate
            }
          }
        }
      }
    }
  }
}
    `;

/**
 * __useGetEmployeeDataForTimeEntriesQuery__
 *
 * To run a query within a React component, call `useGetEmployeeDataForTimeEntriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetEmployeeDataForTimeEntriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetEmployeeDataForTimeEntriesQuery({
 *   variables: {
 *      employeeIdFilter: // value for 'employeeIdFilter'
 *      pagination: // value for 'pagination'
 *      employeeSortInput: // value for 'employeeSortInput'
 *   },
 * });
 */
export function useGetEmployeeDataForTimeEntriesQuery(baseOptions?: Apollo.QueryHookOptions<GetEmployeeDataForTimeEntriesQuery, GetEmployeeDataForTimeEntriesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetEmployeeDataForTimeEntriesQuery, GetEmployeeDataForTimeEntriesQueryVariables>(GetEmployeeDataForTimeEntriesDocument, options);
      }
export function useGetEmployeeDataForTimeEntriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetEmployeeDataForTimeEntriesQuery, GetEmployeeDataForTimeEntriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetEmployeeDataForTimeEntriesQuery, GetEmployeeDataForTimeEntriesQueryVariables>(GetEmployeeDataForTimeEntriesDocument, options);
        }
export function useGetEmployeeDataForTimeEntriesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetEmployeeDataForTimeEntriesQuery, GetEmployeeDataForTimeEntriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetEmployeeDataForTimeEntriesQuery, GetEmployeeDataForTimeEntriesQueryVariables>(GetEmployeeDataForTimeEntriesDocument, options);
        }
export type GetEmployeeDataForTimeEntriesQueryHookResult = ReturnType<typeof useGetEmployeeDataForTimeEntriesQuery>;
export type GetEmployeeDataForTimeEntriesLazyQueryHookResult = ReturnType<typeof useGetEmployeeDataForTimeEntriesLazyQuery>;
export type GetEmployeeDataForTimeEntriesSuspenseQueryHookResult = ReturnType<typeof useGetEmployeeDataForTimeEntriesSuspenseQuery>;
export type GetEmployeeDataForTimeEntriesQueryResult = Apollo.QueryResult<GetEmployeeDataForTimeEntriesQuery, GetEmployeeDataForTimeEntriesQueryVariables>;
export const GetFilteredWageItemsDataForTimeEntriesDocument = gql`
    query getFilteredWageItemsDataForTimeEntries($filterBy: EmployerCompensationsFilter) {
  company {
    id
    companyInfo {
      id
      employerInfo {
        employerCompensations(filterBy: $filterBy) {
          id
          name
          type
          active
          __typename
        }
        __typename
      }
      __typename
    }
    __typename
  }
}
    `;

/**
 * __useGetFilteredWageItemsDataForTimeEntriesQuery__
 *
 * To run a query within a React component, call `useGetFilteredWageItemsDataForTimeEntriesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetFilteredWageItemsDataForTimeEntriesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetFilteredWageItemsDataForTimeEntriesQuery({
 *   variables: {
 *      filterBy: // value for 'filterBy'
 *   },
 * });
 */
export function useGetFilteredWageItemsDataForTimeEntriesQuery(baseOptions?: Apollo.QueryHookOptions<GetFilteredWageItemsDataForTimeEntriesQuery, GetFilteredWageItemsDataForTimeEntriesQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetFilteredWageItemsDataForTimeEntriesQuery, GetFilteredWageItemsDataForTimeEntriesQueryVariables>(GetFilteredWageItemsDataForTimeEntriesDocument, options);
      }
export function useGetFilteredWageItemsDataForTimeEntriesLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetFilteredWageItemsDataForTimeEntriesQuery, GetFilteredWageItemsDataForTimeEntriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetFilteredWageItemsDataForTimeEntriesQuery, GetFilteredWageItemsDataForTimeEntriesQueryVariables>(GetFilteredWageItemsDataForTimeEntriesDocument, options);
        }
export function useGetFilteredWageItemsDataForTimeEntriesSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetFilteredWageItemsDataForTimeEntriesQuery, GetFilteredWageItemsDataForTimeEntriesQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetFilteredWageItemsDataForTimeEntriesQuery, GetFilteredWageItemsDataForTimeEntriesQueryVariables>(GetFilteredWageItemsDataForTimeEntriesDocument, options);
        }
export type GetFilteredWageItemsDataForTimeEntriesQueryHookResult = ReturnType<typeof useGetFilteredWageItemsDataForTimeEntriesQuery>;
export type GetFilteredWageItemsDataForTimeEntriesLazyQueryHookResult = ReturnType<typeof useGetFilteredWageItemsDataForTimeEntriesLazyQuery>;
export type GetFilteredWageItemsDataForTimeEntriesSuspenseQueryHookResult = ReturnType<typeof useGetFilteredWageItemsDataForTimeEntriesSuspenseQuery>;
export type GetFilteredWageItemsDataForTimeEntriesQueryResult = Apollo.QueryResult<GetFilteredWageItemsDataForTimeEntriesQuery, GetFilteredWageItemsDataForTimeEntriesQueryVariables>;
export const GetEmployeeByIdDocument = gql`
    query getEmployeeById($employeeId: ID!, $shouldFetchTimeOffPolicies: Boolean!) {
  company {
    id
    __typename
    employee(id: $employeeId) {
      id
      displayName
      externalIds {
        localId
        realmId
        namespaceId
      }
      employmentDetail {
        jobCosting {
          costRate
          billRate
          billable
        }
      }
      timeOffPolicies @include(if: $shouldFetchTimeOffPolicies) {
        employerTimeOffPolicy {
          timeOffMethod
        }
      }
    }
  }
}
    `;

/**
 * __useGetEmployeeByIdQuery__
 *
 * To run a query within a React component, call `useGetEmployeeByIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetEmployeeByIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetEmployeeByIdQuery({
 *   variables: {
 *      employeeId: // value for 'employeeId'
 *      shouldFetchTimeOffPolicies: // value for 'shouldFetchTimeOffPolicies'
 *   },
 * });
 */
export function useGetEmployeeByIdQuery(baseOptions: Apollo.QueryHookOptions<GetEmployeeByIdQuery, GetEmployeeByIdQueryVariables> & ({ variables: GetEmployeeByIdQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetEmployeeByIdQuery, GetEmployeeByIdQueryVariables>(GetEmployeeByIdDocument, options);
      }
export function useGetEmployeeByIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetEmployeeByIdQuery, GetEmployeeByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetEmployeeByIdQuery, GetEmployeeByIdQueryVariables>(GetEmployeeByIdDocument, options);
        }
export function useGetEmployeeByIdSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<GetEmployeeByIdQuery, GetEmployeeByIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<GetEmployeeByIdQuery, GetEmployeeByIdQueryVariables>(GetEmployeeByIdDocument, options);
        }
export type GetEmployeeByIdQueryHookResult = ReturnType<typeof useGetEmployeeByIdQuery>;
export type GetEmployeeByIdLazyQueryHookResult = ReturnType<typeof useGetEmployeeByIdLazyQuery>;
export type GetEmployeeByIdSuspenseQueryHookResult = ReturnType<typeof useGetEmployeeByIdSuspenseQuery>;
export type GetEmployeeByIdQueryResult = Apollo.QueryResult<GetEmployeeByIdQuery, GetEmployeeByIdQueryVariables>;
export const WorkersByUserIdDocument = gql`
    query WorkersByUserId($input: WorkerInput) {
  workersByUserId(input: $input) {
    id
    ... on Employee {
      externalIds {
        localId
        namespaceId
        realmId
      }
    }
  }
}
    `;

/**
 * __useWorkersByUserIdQuery__
 *
 * To run a query within a React component, call `useWorkersByUserIdQuery` and pass it any options that fit your needs.
 * When your component renders, `useWorkersByUserIdQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useWorkersByUserIdQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useWorkersByUserIdQuery(baseOptions?: Apollo.QueryHookOptions<WorkersByUserIdQuery, WorkersByUserIdQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<WorkersByUserIdQuery, WorkersByUserIdQueryVariables>(WorkersByUserIdDocument, options);
      }
export function useWorkersByUserIdLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<WorkersByUserIdQuery, WorkersByUserIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<WorkersByUserIdQuery, WorkersByUserIdQueryVariables>(WorkersByUserIdDocument, options);
        }
export function useWorkersByUserIdSuspenseQuery(baseOptions?: Apollo.SuspenseQueryHookOptions<WorkersByUserIdQuery, WorkersByUserIdQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<WorkersByUserIdQuery, WorkersByUserIdQueryVariables>(WorkersByUserIdDocument, options);
        }
export type WorkersByUserIdQueryHookResult = ReturnType<typeof useWorkersByUserIdQuery>;
export type WorkersByUserIdLazyQueryHookResult = ReturnType<typeof useWorkersByUserIdLazyQuery>;
export type WorkersByUserIdSuspenseQueryHookResult = ReturnType<typeof useWorkersByUserIdSuspenseQuery>;
export type WorkersByUserIdQueryResult = Apollo.QueryResult<WorkersByUserIdQuery, WorkersByUserIdQueryVariables>;