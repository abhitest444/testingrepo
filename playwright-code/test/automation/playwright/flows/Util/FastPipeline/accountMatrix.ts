import { getAccounts, getTestAccount } from '../../../config/accounts';
import { LoginCredentials } from '../../../config/types';

/**
 * =============================================================================
 * FastPipeline account matrix — shared track utility
 * =============================================================================
 *
 * Common functionality for resolving test accounts from the extra parameter a
 * Groovy/Jenkins job passes in (default env var: `TEST_ACCOUNT`). Each FastPipeline
 * track defines its own {@link AccountMatrix} (parameter -> account-key pool) and
 * calls {@link resolveMatrixAccounts}; the prod vs preprod source file is still
 * selected by `PLAYWRIGHT_ENV`.
 *
 * This is intentionally generic so every track shares the same resolution logic
 * while keeping its own matrix. It does NOT touch the shared config helpers, so
 * non-matrix scenarios keep using getTestAccount / getRandomTestAccount unchanged.
 * =============================================================================
 */

/** Maps a CI parameter value to the pool of account keys it may run against. */
export type AccountMatrix = Record<string, string[]>;

/** A resolved account paired with the account key it came from. */
export interface ResolvedMatrixAccount {
  /** The account key (e.g. `IES01`) — useful as a per-account test title. */
  testId: string;
  credentials: LoginCredentials;
}

export interface ResolveMatrixOptions {
  /** The track's parameter -> account-pool matrix. */
  matrix: AccountMatrix;
  /**
   * Account key used when the parameter is unset — preserves each track's existing
   * behavior (e.g. the title-derived testId or a hardcoded default).
   */
  fallbackTestId?: string;
  /** Override the resolved parameter value. Defaults to `process.env[envVar]`. */
  param?: string;
  /** Env var the parameter is read from. Defaults to `TEST_ACCOUNT`. */
  envVar?: string;
  /** Log prefix for traceability, e.g. `TE`. Defaults to `matrix`. */
  label?: string;
  /**
   * When true, a matrix group whose accounts are all missing from the active env
   * resolves to `[]` (logged as a warning) instead of throwing. Use this when a
   * track shares the SKU selector with other tracks but does not yet have an
   * account for every SKU — the track then simply registers no tests for that SKU
   * rather than aborting collection of the whole spec file. Unknown parameters and
   * an unset selector still throw, so genuine misconfiguration is not hidden.
   */
  allowEmpty?: boolean;
}

/**
 * Resolves the test account(s) a matrix parameter expands to.
 *  - parameter unset            → `[fallbackTestId]` (existing per-track behavior)
 *  - parameter is an exact key  → `[that account]` (e.g. `IES03`)
 *  - parameter is a matrix group→ every account in the pool that exists in the
 *                                 active env (missing keys are skipped, not fatal)
 *
 * A matrix group always expands to its full pool so the track can run once per
 * account (e.g. `TEST_ACCOUNT=IES` → IES01, IES02, IES03).
 *
 * @example
 *   // Groovy:  PLAYWRIGHT_ENV=prod TEST_ACCOUNT=IES yarn playwright test ...
 *   const accounts = resolveMatrixAccounts({ matrix: TE_ACCOUNT_MATRIX, label: 'TE' });
 *   // → [{ testId: 'IES01', ... }, { testId: 'IES02', ... }, { testId: 'IES03', ... }]
 */
export function resolveMatrixAccounts(
  options: ResolveMatrixOptions,
): ResolvedMatrixAccount[] {
  const {
    matrix,
    fallbackTestId,
    envVar = 'TEST_ACCOUNT',
    label = 'matrix',
    allowEmpty = false,
  } = options;

  const param = (options.param ?? process.env[envVar])?.trim();

  if (!param) {
    if (!fallbackTestId) {
      throw new Error(
        `[${label}] No ${envVar} parameter provided and no fallback account ` +
          `configured. Pass ${envVar}=<group|accountKey> ` +
          `(known groups: ${Object.keys(matrix).join(', ')}).`,
      );
    }
    return [
      { testId: fallbackTestId, credentials: getTestAccount(fallbackTestId) },
    ];
  }

  const accounts = getAccounts().companyAdmin?.testAccounts;
  if (!accounts) {
    throw new Error(
      `[${label}] No company admin test accounts found for current environment`,
    );
  }

  // An exact account key takes precedence over a matrix group of the same name.
  if (accounts[param]) {
    console.log(`[${label}] using exact account key ${param}`);
    return [{ testId: param, credentials: accounts[param] }];
  }

  const pool = matrix[param];
  if (!pool) {
    throw new Error(
      `[${label}] Unknown ${envVar} "${param}". Expected an account key or one ` +
        `of: ${Object.keys(matrix).join(', ')}`,
    );
  }

  const available = pool.filter((id) => accounts[id] != null);
  if (available.length === 0) {
    if (allowEmpty) {
      console.warn(
        `[${label}] group "${param}" -> no accounts exist in current ` +
          `environment (looked for: ${pool.join(
            ', ',
          )}); registering no tests ` +
          `for this track.`,
      );
      return [];
    }
    throw new Error(
      `[${label}] No accounts from matrix group "${param}" exist in current ` +
        `environment (looked for: ${pool.join(', ')})`,
    );
  }

  const skipped = pool.filter((id) => accounts[id] == null);
  if (skipped.length > 0) {
    console.warn(
      `[${label}] group "${param}" -> skipping accounts missing in this env: ` +
        skipped.join(', '),
    );
  }

  console.log(
    `[${label}] group "${param}" -> resolved ${available.length} account(s): ` +
      available.join(', '),
  );

  return available.map((testId) => ({
    testId,
    credentials: accounts[testId],
  }));
}
