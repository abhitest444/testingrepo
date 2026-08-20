import { preprodGBAccounts } from './preprod.gbaccounts';
import { prodGBAccounts } from './prod.gbaccounts';
import { RoleBasedAccounts, TimeActivityExperience } from '../types';

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
  return env === 'preprod' ? preprodGBAccounts : prodGBAccounts;
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
export function getRandomTestAccount(
  tier: 'elite' | 'premium' | 'time_elite' | 'time_premium',
) {
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
    // Elite tier uses OTXE001
    accountPool = ['OTXE001'];
  } else if (tier === 'premium') {
    // Premium tier uses OTXP001
    accountPool = ['OTXP001'];
  } else if (tier === 'time_elite') {
    accountPool = ['QBTE001'];
  } else if (tier === 'time_premium') {
    accountPool = ['QBTP001'];
  } else {
    throw new Error(
      `Invalid tier: ${tier}. Must be either 'elite' or 'premium' or 'time_elite' or 'time_premium'.`,
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
