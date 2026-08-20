export type TimeSubmenu =
  | 'Overview'
  | 'Time entries'
  | 'Approvals'
  | 'Schedule'
  | 'Time off'
  | 'Time team'
  | 'Assignments'
  | 'Time projects'
  | 'Time reports';

export enum TimeActivityExperience {
  New = 'New',
  Legacy = 'Legacy',
}

export enum CompanyTier {
  Free = 'Free',
  Paid = 'Paid',
}
export interface LoginCredentials {
  username?: string;
  password?: string;
  realmId?: string;
  companyInfo?: string;
  timeActivityExperience?: TimeActivityExperience;
  companyTier?: CompanyTier; // Add company tier to differentiate free vs paid
  testAccounts?: {
    [key: string]: LoginCredentials;
  };
  /**
   * Company platform type.  Drives login-completion checks and dashboard
   * assertions throughout the TE01 suite.
   *
   * - 'elite'    : QBO company with Time Elite or Payroll Elite add-on.
   *                Standard QBO shell — QuickBooks Landing Page sidebar present.
   * - 'premium'  : QBO company with Time Premium or Payroll Premium add-on.
   *                Same shell as 'elite'; all QBO nav elements present.
   * - 'ies'      : Intuit Enterprise Suite.  Different application shell —
   *                QuickBooks Landing Page sidebar NOT present; needs company
   *                picker handling when companyInfo is set.
   * - 'standard' : Plain QBO company (no premium Time add-on).
   *                Same shell as 'elite'.
   *
   * Defaults to 'elite' when omitted.
   */
  companyType?: 'elite' | 'premium' | 'ies' | 'standard';
  // TE01 E2E entitlement metadata — read by runTE01Flow to drive role/SKU variance
  expectedTabs?: string[]; // which Time tabs should be visible for this account
  expectedRole?: 'admin' | 'employee' | 'vendor' | 'manager'; // role driving data-visibility assertions
  canAddTime?: boolean; // whether the Add Time button should be visible
  canDeleteTime?: boolean; // whether Delete is allowed for this role
  canApproveTime?: boolean; // whether Approve/Unapprove actions are available
  isSandboxOnly?: boolean; // if true, skip CRUD mutations (read-only account)
}

export interface RoleBasedAccounts {
  [key: string]: LoginCredentials;
}
