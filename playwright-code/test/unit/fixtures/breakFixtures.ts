import { Payroll_Break } from 'src/__generated__/oigql/graphql';
import type { BreakRule } from 'src/js/service/hooks/breaks/useGetWorkerBreaks';

/**
 * Creates a mock BreakRule with sensible defaults.
 */
export const createMockBreakRule = (
  id: string,
  overrides?: Partial<BreakRule>,
): BreakRule => ({
  id,
  breakName: `Break Rule ${id}`,
  breakType: Payroll_Break.Paid,
  breakDuration: 30,
  durationUnit: 'MINUTES',
  isActive: true,
  isDefaultPolicy: false,
  allowAuto: true,
  allowManual: true,
  noSetDuration: false,
  ...overrides,
});
