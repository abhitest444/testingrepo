/**
 * Helpers for working with overtime policy ID conventions.
 *
 * The API returns policy IDs with specific prefixes that encode the policy type:
 * - 'basic'              → company-level default policy
 * - 'basic_policy_<uid>' → user-level override of the basic policy
 * - numeric string       → pay-rate-engine policy (managed in company settings)
 */

const BASIC_POLICY_PREFIX = 'basic_policy_';
export const BASIC_POLICY_ID = 'basic';

/**
 * Returns `true` if the policy is a user-level override (id starts with 'basic_policy_').
 */
export const isUserOverridePolicy = (
  policyId: string | undefined | null,
): boolean => !!policyId && policyId.startsWith(BASIC_POLICY_PREFIX);

/**
 * Returns `true` if the policy is a basic-type policy
 * (either the company default 'basic' or a user-level override 'basic_policy_*').
 */
export const isBasicPolicy = (policyId: string | undefined | null): boolean =>
  !!policyId &&
  (policyId === BASIC_POLICY_ID || policyId.startsWith(BASIC_POLICY_PREFIX));

/**
 * Returns `true` if the policy ID is a numeric (pay-rate-engine) policy.
 */
export const isNumericPolicy = (policyId: string | undefined | null): boolean =>
  !!policyId && /^\d+$/.test(policyId);
