/**
 * WorkerSelection - Shared components for worker selection tables
 *
 * This module provides a reusable, stateless WorkerSelectionTable component
 * following the Layered Composition architecture:
 *
 * Layer 1: Shared UI Component (WorkerSelectionTable)
 *   - Stateless, controlled component
 *   - Receives all state via props
 *   - Emits changes via callbacks
 *
 * Layer 2: Shared Hooks (useWorkerSelectionBase)
 *   - Entity-agnostic selection logic
 *   - Can be wrapped by feature-specific adapters
 *
 * Layer 3: Connected Adapters (feature-specific)
 *   - usePolicyWorkerSelectionAdapter (overtime policies)
 *   - useGroupWorkerSelectionAdapter (groups - future)
 *
 * Layer 4: Feature Components
 *   - PolicyMembersStep, WorkerSelectionContent, etc.
 *
 * @example
 * ```tsx
 * import {
 *   WorkerSelectionTable,
 *   useWorkerSelectionBase,
 *   computeSelectionState,
 * } from 'src/js/widgets/common/WorkerSelection';
 * ```
 */

// Components
export { WorkerSelectionTable } from './components/WorkerSelectionTable';

// Types
export type {
  SelectableWorker,
  PaginationProps,
  WorkerSelectionTableProps,
  WorkerSelectionTableLabels,
  WorkerSelectionBaseResult,
} from './components/WorkerSelectionTable.types';

// Styled components (for extension)
export {
  TableWrapper,
  StyledTable,
  StyledCheckbox,
  CheckboxCell,
  SortableHeaderCell,
  WorkerNameCell,
  GroupCell,
  LoadingContainer,
  EmptyStateContainer,
  PaginationContainer,
} from './components/WorkerSelectionTable.styled';

// Hooks
export {
  useWorkerSelectionBase,
  computeSelectionState,
  type UseWorkerSelectionBaseParams,
} from './hooks';
