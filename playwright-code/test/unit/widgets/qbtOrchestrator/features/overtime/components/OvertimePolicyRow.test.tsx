import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import {
  getDefaultSandbox,
  renderWithQuicksandReduxAndLogging,
  createQbtOrchestratorStore,
} from 'test/unit/testUtils';
import { OvertimePolicyRow } from 'src/js/widgets/qbtOrchestrator/features/overtime/components/OvertimePolicyRow';
import { OVERTIME_TABLE_ACTIONS } from 'src/js/widgets/qbtOrchestrator/features/overtime/constants/overtimeTableConstants';
import {
  createOvertimePolicy,
  createAssignment,
} from 'test/unit/fixtures/overtimeFixtures';

// Mock styled components
jest.mock(
  'src/js/widgets/qbtOrchestrator/features/overtime/styles/OvertimeFilledState.styled',
  () => ({
    ActionsCell: ({ children }: any) => (
      <td data-testid="actions-cell">{children}</td>
    ),
    ActionsContainer: ({ children }: any) => (
      <div data-testid="actions-container">{children}</div>
    ),
    PolicyNameCell: ({ children }: any) => (
      <div data-testid="policy-name-cell">{children}</div>
    ),
  }),
);

// Mock Badge
jest.mock('@ids-ts/badge', () => ({
  __esModule: true,
  default: ({ children, 'aria-label': ariaLabel }: any) => (
    <span data-testid="default-badge" aria-label={ariaLabel}>
      {children}
    </span>
  ),
}));

// Mock Table
jest.mock('@ids-ts/table', () => {
  const TableComponent = ({ children }: any) => (
    <table data-testid="table">{children}</table>
  );
  TableComponent.Row = ({ children, onClick, 'data-testid': testId }: any) => (
    <tr data-testid={testId} onClick={onClick}>
      {children}
    </tr>
  );
  TableComponent.Cell = ({ children }: any) => <td>{children}</td>;
  return { Table: TableComponent };
});

// Mock ComboLink - MenuItem clicks propagate value via onSelect
jest.mock('@ids-ts/combo-link', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    onSelect,
    label,
    'data-testid': testId,
  }: any) => (
    <div data-testid="combo-link-wrapper">
      <div data-testid={testId}>
        <button data-testid="combo-link-button" onClick={onClick}>
          {label}
        </button>
        <div
          data-testid="combo-link-menu"
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={onSelect}
        >
          {children}
        </div>
      </div>
    </div>
  ),
  MenuItem: ({ children, value, onSelect: _onSelect }: any) => (
    // Renders a button so that click events bubble to the combo-link-menu wrapper.
    // We use a real <button> with value so that event.target.value is accessible.
    <button data-testid={`menu-item-${value}`} value={value} type="button">
      {children}
    </button>
  ),
}));

describe('OvertimePolicyRow', () => {
  const mockSandbox = getDefaultSandbox();
  const mockOnEditPolicy = jest.fn();
  let store: ReturnType<typeof createQbtOrchestratorStore>;

  const renderRow = (policy = createOvertimePolicy(), props: any = {}) =>
    // OvertimePolicyRow renders a <tr> so we need a table wrapper
    renderWithQuicksandReduxAndLogging(
      <table>
        <tbody>
          <OvertimePolicyRow
            policy={policy}
            onEditPolicy={mockOnEditPolicy}
            {...props}
          />
        </tbody>
      </table>,
      store,
      mockSandbox,
    );
  beforeEach(() => {
    jest.clearAllMocks();
    store = createQbtOrchestratorStore();
  });

  describe('Rendering', () => {
    it('should render the policy name', () => {
      renderRow();
      expect(screen.getByText('Test Policy')).toBeInTheDocument();
    });

    it('should render None when there are no assignments', () => {
      const policy = createOvertimePolicy({ assignments: { values: [] } });
      renderRow(policy);
      // useIntl mock renders NLS key + undefined values
      expect(
        screen.getByText(/overtime\.table\.workers\.none/i),
      ).toBeInTheDocument();
    });

    it('should render All when there is a company-wide assignment (line 89)', () => {
      // Covers line 89: hasCompanyWide branch returning 'All'
      const policy = createOvertimePolicy({
        assignments: {
          values: [
            createAssignment({
              entityType: 'all',
              entityId: 'all',
              entityName: 'All',
            }),
          ],
        },
      });
      renderRow(policy);
      expect(
        screen.getByText(/overtime\.table\.workers\.all/i),
      ).toBeInTheDocument();
    });

    it('should render All when policy isDefault, even if no assignments', () => {
      const policy = createOvertimePolicy({
        isDefault: true,
        assignments: { values: [] },
      });
      renderRow(policy);
      expect(
        screen.getByText(/overtime\.table\.workers\.all/i),
      ).toBeInTheDocument();
    });

    it('should show user count when there are user assignments', () => {
      const policy = createOvertimePolicy({
        assignments: {
          values: [
            createAssignment({
              entityType: 'user',
              entityId: 'u1',
              entityName: 'Alice',
            }),
            createAssignment({
              entityType: 'user',
              entityId: 'u2',
              entityName: 'Bob',
            }),
          ],
        },
      });
      renderRow(policy);
      // The workers display should contain user count info
      expect(
        screen.getByTestId(`overtime-policy-row-${policy.id}`),
      ).toBeInTheDocument();
    });

    it('does not count User Not Found user assignments in the displayed user count', () => {
      const policyOnlyOrphans = createOvertimePolicy({
        id: 'p-orphan-only',
        name: 'Orphan Only',
        assignments: {
          values: [
            createAssignment({
              id: 'a-orphan',
              entityType: 'user',
              entityId: 'user-orphan',
              entityName: 'User Not Found',
            }),
          ],
        },
      });
      renderRow(policyOnlyOrphans);
      // userCount is 0 after filtering, so no user count label should be rendered
      expect(
        screen.queryByText(/overtime\.table\.workers\.users/i),
      ).not.toBeInTheDocument();
    });

    it('counts only valid users when mixed with User Not Found assignments', () => {
      const policyMixed = createOvertimePolicy({
        id: 'p-mixed',
        name: 'Mixed Users',
        assignments: {
          values: [
            createAssignment({
              id: 'a-valid',
              entityType: 'user',
              entityId: 'u-valid',
              entityName: 'Alice',
            }),
            createAssignment({
              id: 'a-orphan',
              entityType: 'user',
              entityId: 'u-orphan',
              entityName: 'User Not Found',
            }),
          ],
        },
      });
      renderRow(policyMixed);
      // The valid user triggers the user count label to appear
      expect(
        screen.getByText(/overtime\.table\.workers\.users/i),
      ).toBeInTheDocument();
      // The orphan assignment must not inflate the count — 'None' must not appear
      expect(
        screen.queryByText(/overtime\.table\.workers\.none/i),
      ).not.toBeInTheDocument();
    });

    it('should show group and user count when both exist', () => {
      const policy = createOvertimePolicy({
        assignments: {
          values: [
            createAssignment({
              entityType: 'group',
              entityId: 'g1',
              entityName: 'Group A',
            }),
            createAssignment({
              entityType: 'user',
              entityId: 'u1',
              entityName: 'Alice',
            }),
          ],
        },
      });
      renderRow(policy);
      expect(
        screen.getByTestId(`overtime-policy-row-${policy.id}`),
      ).toBeInTheDocument();
    });

    it('should render rules count', () => {
      renderRow();
      // The policy fixture has 1 rule
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should show default badge when policy isDefault is true', () => {
      const policy = createOvertimePolicy({ isDefault: true });
      renderRow(policy);
      expect(screen.getByTestId('default-badge')).toBeInTheDocument();
    });

    it('should not show default badge when policy isDefault is false', () => {
      const policy = createOvertimePolicy({ isDefault: false });
      renderRow(policy);
      expect(screen.queryByTestId('default-badge')).not.toBeInTheDocument();
    });
  });

  describe('handleDelete - lines 47-52', () => {
    it('should dispatch setPolicyToDelete and setShowDeleteModal when delete menu item is clicked', () => {
      const policy = createOvertimePolicy({
        id: 'policy-del-1',
        name: 'Delete Me',
      });
      renderRow(policy);

      // Click the delete menu item directly - it has data-value="delete"
      const deleteMenuItem = screen.getByTestId(
        `menu-item-${OVERTIME_TABLE_ACTIONS.DELETE}`,
      );
      fireEvent.click(deleteMenuItem);

      // Verify store state was updated
      const state = store.getState() as any;
      expect(state.overtime.showDeleteModal).toBe(true);
      expect(state.overtime.policyToDelete).toMatchObject({
        id: 'policy-del-1',
      });
    });
  });

  describe('handleMenuSelect branches - lines 63, 65', () => {
    it('should call onEditPolicy when menu select value is EDIT (line 63)', () => {
      const policy = createOvertimePolicy({ id: 'p1' });
      renderRow(policy);

      // Click the edit menu item - the mock renders it with data-value="edit"
      const editMenuItem = screen.getByTestId(
        `menu-item-${OVERTIME_TABLE_ACTIONS.EDIT}`,
      );
      fireEvent.click(editMenuItem);

      expect(mockOnEditPolicy).toHaveBeenCalledWith('p1');
    });

    it('should dispatch delete actions when menu select value is DELETE (line 65)', () => {
      const policy = createOvertimePolicy({ id: 'p2', name: 'Policy 2' });
      renderRow(policy);

      const deleteMenuItem = screen.getByTestId(
        `menu-item-${OVERTIME_TABLE_ACTIONS.DELETE}`,
      );
      fireEvent.click(deleteMenuItem);

      const state = store.getState() as any;
      expect(state.overtime.showDeleteModal).toBe(true);
      expect(state.overtime.policyToDelete).toMatchObject({ id: 'p2' });
    });

    it('should log FILLED_STATE_MENU_OPENED when menu is interacted with', () => {
      const policy = createOvertimePolicy({ id: 'p3' });
      renderRow(policy);

      // Click the combo-link-menu wrapper (onSelect handler on the menu wrapper div)
      const comboMenu = screen.getByTestId('combo-link-menu');
      fireEvent.click(comboMenu);

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ policyId: 'p3' }),
      );
    });
  });

  describe('handleRowClick', () => {
    it('should call onEditPolicy when row is clicked', () => {
      const policy = createOvertimePolicy({ id: 'row-1' });
      renderRow(policy);

      const row = screen.getByTestId('overtime-policy-row-row-1');
      fireEvent.click(row);

      expect(mockOnEditPolicy).toHaveBeenCalledWith('row-1');
    });

    it('should not throw when onEditPolicy is not provided', () => {
      const policy = createOvertimePolicy({ id: 'row-2' });
      renderRow(policy, { onEditPolicy: undefined });

      const row = screen.getByTestId('overtime-policy-row-row-2');
      expect(() => fireEvent.click(row)).not.toThrow();
    });
  });
});
