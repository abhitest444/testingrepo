import type { SelectableWorker } from 'src/js/widgets/common/WorkerSelection/components/WorkerSelectionTable.types';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';

/**
 * Creates a mock SelectableWorker with a canonical default shape.
 */
export const createMockWorker = (
  id: string,
  overrides?: Partial<SelectableWorker>,
): SelectableWorker => ({
  id,
  type: TimeTracking_TimeForType.Employee,
  isActive: true,
  firstName: `First-${id}`,
  lastName: `Last-${id}`,
  displayName: `Worker ${id}`,
  memberOfGroup: null,
  ...overrides,
});

/**
 * Creates an array of N mock SelectableWorkers with sequential 1-indexed ids.
 */
export const createMockWorkers = (count: number): SelectableWorker[] =>
  Array.from({ length: count }, (_, i) => createMockWorker(`worker-${i + 1}`));
