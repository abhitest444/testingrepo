import { preprodAccounts } from './preprod.accounts';
import { prodAccounts } from './prod.accounts';
import { RoleBasedAccounts, TimeActivityExperience } from './types';

function getEnv(): 'preprod' | 'prod' {
  const env = process.env.PLAYWRIGHT_ENV || 'preprod';
  if (env !== 'preprod' && env !== 'prod') {
    throw new Error(
      `Invalid environment: ${env}. Must be either 'preprod' or 'prod'`,
    );
  }
  return env;
}

export function getAccounts(): RoleBasedAccounts {
  const env = getEnv();
  return env === 'preprod' ? preprodAccounts : prodAccounts;
}

export function getAccount(role: keyof RoleBasedAccounts) {
  const accounts = getAccounts();
  return accounts[role];
}

// Helper function to get all available roles
export function getAvailableRoles(): (keyof RoleBasedAccounts)[] {
  return Object.keys(getAccounts()) as (keyof RoleBasedAccounts)[];
}

export function getTestAccount(testId: string) {
  const accounts = getAccounts();
  const companyAdmin = accounts.companyAdmin;

  if (!companyAdmin || !companyAdmin.testAccounts) {
    throw new Error(
      `No company admin or test accounts found in ${getEnv()} environment`,
    );
  }

  const testAccount = companyAdmin.testAccounts[testId];
  if (!testAccount) {
    throw new Error(
      `No test account found for test ID: ${testId} in ${getEnv()} environment`,
    );
  }

  return testAccount;
}

/**
 * Randomly selects test accounts from different pools based on test tier
 * Only available for preprod environment
 * @param tier - The test tier: 'elite' (OTXE001-OTXE005) or 'premium' (OTXP001-OTXP005)
 * @returns A randomly selected test account
 */
export function getRandomTestAccount(tier: 'elite' | 'premium') {
  const env = getEnv();
  /*
  // Only allow random account selection for preprod environment
  if (env !== 'preprod') {
    throw new Error(
      `Random test account selection is only available for preprod environment. Current environment: ${env}. Please use getTestAccount() for prod environment.`,
    );
  }
*/
  const accounts = getAccounts();
  const companyAdmin = accounts.companyAdmin;

  if (!companyAdmin || !companyAdmin.testAccounts) {
    throw new Error(
      `No company admin or test accounts found in ${env} environment`,
    );
  }

  // Define different account pools for different tiers
  let accountPool: string[];

  if (tier === 'elite') {
    // Elite tier uses OTXE001-OTXE005
    accountPool = [
      'OTXE001',
      'OTXE002',
      'OTXE003',
      'OTXE004',
      'OTXE005',
      'OTXE006',
      'OTXE007',
      'OTXE008',
      'OTXE009',
      'OTXE010',
      'OTXE011',
      'OTXE012',
      'OTXE013',
      'OTXE014',
      'OTXE015',
      'OTXE016',
      'OTXE017',
      'OTXE018',
      'OTXE019',
      'OTXE020',
      'OTXE021',
      'OTXE022',
      'OTXE023',
      'OTXE024',
      'OTXE025',
    ];
  } else if (tier === 'premium') {
    // Premium tier uses OTXP001-OTXP005
    accountPool = [
      'OTXP001',
      'OTXP002',
      'OTXP003',
      'OTXP004',
      'OTXP005',
      'OTXP006',
      'OTXP007',
      'OTXP008',
      'OTXP009',
      'OTXP010',
      'OTXP011',
      'OTXP012',
      'OTXP013',
      'OTXP014',
      'OTXP015',
      'OTXP016',
      'OTXP017',
      'OTXP018',
      'OTXP019',
      'OTXP020',
      'OTXP021',
      'OTXP022',
      'OTXP023',
      'OTXP024',
      'OTXP025',
    ];
  } else {
    throw new Error(
      `Invalid tier: ${tier}. Must be either 'elite' or 'premium'.`,
    );
  }

  // Randomly select one account from the pool
  const randomIndex = Math.floor(Math.random() * accountPool.length);
  const selectedTestId = accountPool[randomIndex];
  const selectedAccount = companyAdmin.testAccounts[selectedTestId];

  console.log(
    `[${env}] Randomly selected ${tier.toUpperCase()} test account: ${selectedTestId} for test execution`,
  );
  console.log(`[${env}] Account details:`, {
    tier: tier.toUpperCase(),
    testId: selectedTestId,
    username: selectedAccount.username,
  });

  return selectedAccount;
}

/**
 * Randomly selects one test account from the QB Time Setup pool of 5.
 * Uses the same pattern as getRandomTestAccount with a fixed pool.
 * @returns A randomly selected test account from the pool of 5
 */
export function getRandomQBTimeSetupAccount() {
  const env = getEnv();
  const accountPool = ['QBSF001', 'QBSF002', 'QBSF003', 'QBSF004', 'QBSF005'];

  // Randomly select one account from the pool
  const randomIndex = Math.floor(Math.random() * accountPool.length);
  const selectedTestId = accountPool[randomIndex];
  const selectedAccount = getTestAccount(selectedTestId);

  console.log(
    `[${env}] Randomly selected QB Time Setup test account (pool of 5): ${selectedTestId} for test execution`,
  );
  console.log(`[${env}] Account details:`, {
    tier: 'QB_TIME_SETUP',
    testId: selectedTestId,
    username: selectedAccount.username,
  });

  return selectedAccount;
}

/** Prod assignments priority suite: random login pool APR001–APR020 (preprod falls back to elite random if APR* missing). */
const ASSIGNMENTS_PRIORITY_ACCOUNT_POOL = [
  'APR001',
  'APR002',
  'APR003',
  'APR004',
  'APR005',
  'APR006',
  'APR007',
  'APR008',
  'APR009',
  'APR010',
  'APR011',
  'APR012',
  'APR013',
  'APR014',
  'APR015',
  'APR016',
  'APR017',
  'APR018',
  'APR019',
  'APR020',
] as const;

/**
 * Random company for **Assignments priority** Playwright suite (prod: APR001–APR020).
 * Override: `PLAYWRIGHT_ASSIGN_PRIORITY_ACCOUNT_ID=APR007`.
 * Preprod: no APR* keys → same behavior as {@link getRandomTestAccount}('elite').
 */
export function getRandomAssignmentsPriorityAccount() {
  const env = getEnv();
  const override = process.env.PLAYWRIGHT_ASSIGN_PRIORITY_ACCOUNT_ID?.trim();
  if (override) {
    console.log(
      `[${env}] Assignments priority: PLAYWRIGHT_ASSIGN_PRIORITY_ACCOUNT_ID=`,
      override,
    );
    return getTestAccount(override);
  }

  const accounts = getAccounts().companyAdmin?.testAccounts;
  const available = ASSIGNMENTS_PRIORITY_ACCOUNT_POOL.filter(
    (id) => accounts?.[id] != null,
  );

  if (available.length === 0) {
    console.log(
      `[${env}] No APR* assignments priority accounts; falling back to elite random`,
    );
    return getRandomTestAccount('elite');
  }

  const selectedTestId =
    available[Math.floor(Math.random() * available.length)];
  const selectedAccount = getTestAccount(selectedTestId);

  console.log(
    `[${env}] Randomly selected assignments priority account: ${selectedTestId}`,
  );
  console.log(`[${env}] Account details:`, {
    testId: selectedTestId,
    username: selectedAccount.username,
  });

  return selectedAccount;
}

/**
 * Gets the IES test account based on tier
 * @param tier - The test tier: 'Parent' or 'Child'
 * @returns The IES test account
 */
export function getIESTestAccount(tier: 'Parent' | 'Child') {
  const env = getEnv();

  const accounts = getAccounts();
  const companyAdmin = accounts.companyAdmin;

  if (!companyAdmin || !companyAdmin.testAccounts) {
    throw new Error(
      `No company admin or test accounts found in ${env} environment`,
    );
  }

  // Define account pools for different tiers
  let accountPool: string[];

  if (tier === 'Parent') {
    accountPool = ['IES001'];
  } else if (tier === 'Child') {
    accountPool = ['IES002'];
  } else {
    throw new Error(
      `Invalid tier: ${tier}. Must be either 'Parent' or 'Child'.`,
    );
  }

  // Randomly select one account from the pool
  const randomIndex = Math.floor(Math.random() * accountPool.length);
  const selectedTestId = accountPool[randomIndex];
  const selectedAccount = companyAdmin.testAccounts[selectedTestId];

  if (!selectedAccount) {
    throw new Error(
      `No IES test account found for tier: ${tier} in ${env} environment`,
    );
  }

  console.log(
    `[${env}] Randomly selected ${tier} IES test account: ${selectedTestId} for test execution`,
  );
  console.log(`[${env}] Account details:`, {
    tier: tier,
    testId: selectedTestId,
    username: selectedAccount.username,
  });

  return selectedAccount;
}

/** Prod/preprod mileage suite: random login pool ML001–ML012 (IDs absent in an env are skipped). */
const MILEAGE_TRACKING_ACCOUNT_POOL = [
  'MLP001',
  'MLP002',
  'MLP003',
  'MLP004',
  'MLP005',
] as const;

/**
 * Random company for **Mileage tracking** Playwright flows (prod/preprod: ML* pool).
 * Override: `PLAYWRIGHT_MILEAGE_TRACKING_ACCOUNT_ID=ML008`.
 * If no ML* keys exist in the current env, falls back to {@link getRandomTestAccount}('elite').
 */
export function getRandomMileageTrackingAccount() {
  const env = getEnv();
  const override = process.env.PLAYWRIGHT_MILEAGE_TRACKING_ACCOUNT_ID?.trim();
  if (override) {
    console.log(
      `[${env}] Mileage tracking: PLAYWRIGHT_MILEAGE_TRACKING_ACCOUNT_ID=`,
      override,
    );
    return getTestAccount(override);
  }

  const accounts = getAccounts().companyAdmin?.testAccounts;
  const available = MILEAGE_TRACKING_ACCOUNT_POOL.filter(
    (id) => accounts?.[id] != null,
  );

  if (available.length === 0) {
    console.log(
      `[${env}] No ML* mileage tracking accounts; falling back to elite random`,
    );
    return getRandomTestAccount('elite');
  }

  const selectedTestId =
    available[Math.floor(Math.random() * available.length)];
  const selectedAccount = getTestAccount(selectedTestId);

  console.log(
    `[${env}] Randomly selected mileage tracking account: ${selectedTestId}`,
  );
  console.log(`[${env}] Account details:`, {
    testId: selectedTestId,
    username: selectedAccount.username,
  });

  return selectedAccount;
}
