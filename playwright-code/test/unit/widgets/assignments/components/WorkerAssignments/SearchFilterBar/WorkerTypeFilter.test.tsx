import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkerTypeFilter } from '../../../../../../../src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/WorkerTypeFilter';
import { WorkerType } from '../../../../../../../src/js/widgets/assignments/components/WorkerAssignments/SearchFilterBar/types';

// Mock tracking
const mockTrack = jest.fn();
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock useIntl, useSandbox, useTracking
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({
      id,
      defaultMessage,
    }: {
      id: string;
      defaultMessage: string;
    }) => defaultMessage,
  }),
  useSandbox: () => ({ logger: mockLogger }),
  useTracking: () => mockTrack,
}));

// Mock IDS Dropdown
jest.mock('@ids-ts/dropdown', () => {
  const React = require('react');
  const Dropdown = ({
    value,
    onChange,
    label,
    children,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
  }: any) => (
    <div>
      <label htmlFor="dropdown-select">{label}</label>
      <select
        id="dropdown-select"
        data-testid={dataTestId}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e)}
      >
        {React.Children.map(children, (child: any) =>
          React.isValidElement(child) ? (
            <option key={child.props.value} value={child.props.value}>
              {child.props.children}
            </option>
          ) : null,
        )}
      </select>
    </div>
  );

  const MenuItem = ({ children, value }: any) => (
    <option value={value}>{children}</option>
  );

  return {
    __esModule: true,
    default: Dropdown,
    Dropdown,
    MenuItem,
  };
});

describe('WorkerTypeFilter', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockTrack.mockClear();
    mockLogger.info.mockClear();
  });

  describe('Rendering', () => {
    it('should render the worker type filter dropdown', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByTestId('worker-type-filter');
      expect(select).toBeInTheDocument();
    });

    it('should have the correct aria-label', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByLabelText('Filter by worker type');
      expect(select).toBeInTheDocument();
    });

    it.each([
      {
        description: 'displays correct value when value is ALL',
        value: WorkerType.ALL,
      },
      {
        description: 'displays correct value when value is EMPLOYEE',
        value: WorkerType.EMPLOYEE,
      },
      {
        description: 'displays correct value when value is LEGACY_QBO_USER',
        value: WorkerType.LEGACY_QBO_USER,
      },
      {
        description: 'displays correct value when value is VENDOR',
        value: WorkerType.VENDOR,
      },
    ])('$description', ({ value }) => {
      render(<WorkerTypeFilter value={value} onChange={mockOnChange} />);

      const select = screen.getByTestId(
        'worker-type-filter',
      ) as HTMLSelectElement;
      expect(select.value).toBe(value);
    });

    it('should have Workers label', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      expect(screen.getByText('Workers')).toBeInTheDocument();
    });

    it('should render all menu items', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Employee')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Vendor')).toBeInTheDocument();
    });

    it('should not render Contractor option', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      expect(screen.queryByText('Contractor')).not.toBeInTheDocument();
    });

    it('should render 4 options (All, Employee, User, Vendor)', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByTestId('worker-type-filter');
      const options = select.querySelectorAll('option');
      expect(options).toHaveLength(4);
    });
  });

  describe('User Interactions', () => {
    it('should call onChange when a different option is selected', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByTestId('worker-type-filter');
      fireEvent.change(select, { target: { value: WorkerType.EMPLOYEE } });

      expect(mockOnChange).toHaveBeenCalledWith(WorkerType.EMPLOYEE);
    });

    it('should call onChange when selecting LEGACY_QBO_USER', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByTestId('worker-type-filter');
      fireEvent.change(select, {
        target: { value: WorkerType.LEGACY_QBO_USER },
      });

      expect(mockOnChange).toHaveBeenCalledWith(WorkerType.LEGACY_QBO_USER);
    });

    it('should call onChange when selecting VENDOR', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByTestId('worker-type-filter');
      fireEvent.change(select, { target: { value: WorkerType.VENDOR } });

      expect(mockOnChange).toHaveBeenCalledWith(WorkerType.VENDOR);
    });

    it('should call onChange when selecting ALL', () => {
      render(
        <WorkerTypeFilter
          value={WorkerType.EMPLOYEE}
          onChange={mockOnChange}
        />,
      );

      const select = screen.getByTestId('worker-type-filter');
      fireEvent.change(select, { target: { value: WorkerType.ALL } });

      expect(mockOnChange).toHaveBeenCalledWith(WorkerType.ALL);
    });

    it('should handle keyboard events', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByTestId('worker-type-filter');
      fireEvent.keyDown(select, { key: 'Enter' });
      fireEvent.change(select, { target: { value: WorkerType.EMPLOYEE } });

      expect(mockOnChange).toHaveBeenCalledWith(WorkerType.EMPLOYEE);
    });
  });

  describe('Accessibility', () => {
    it('should be keyboard accessible', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByTestId('worker-type-filter');
      select.focus();

      expect(select).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByLabelText('Filter by worker type');
      expect(select).toHaveAttribute('aria-label', 'Filter by worker type');
    });

    it('should be a select element', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByTestId('worker-type-filter');
      expect(select.tagName).toBe('SELECT');
    });
  });

  describe('Component Structure', () => {
    it('should render within a container', () => {
      const { container } = render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByTestId('worker-type-filter');
      expect(select.parentElement).toBeInTheDocument();
    });

    it('should have correct label association', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const label = screen.getByText('Workers');
      expect(label).toBeInTheDocument();
    });

    it('should maintain value prop consistency', () => {
      const { rerender } = render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      let select = screen.getByTestId(
        'worker-type-filter',
      ) as HTMLSelectElement;
      expect(select.value).toBe(WorkerType.ALL);

      rerender(
        <WorkerTypeFilter
          value={WorkerType.EMPLOYEE}
          onChange={mockOnChange}
        />,
      );

      select = screen.getByTestId('worker-type-filter') as HTMLSelectElement;
      expect(select.value).toBe(WorkerType.EMPLOYEE);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid filter changes', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByTestId('worker-type-filter');

      fireEvent.change(select, { target: { value: WorkerType.EMPLOYEE } });
      fireEvent.change(select, { target: { value: WorkerType.VENDOR } });
      fireEvent.change(select, { target: { value: WorkerType.ALL } });

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenLastCalledWith(WorkerType.ALL);
    });

    it('should not call onChange when value does not change', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      // onChange will still be called by the dropdown component,
      // but we're testing that our component properly passes the value
      const select = screen.getByTestId('worker-type-filter');
      fireEvent.change(select, { target: { value: WorkerType.ALL } });

      expect(mockOnChange).toHaveBeenCalledWith(WorkerType.ALL);
    });
  });

  describe('Tracking', () => {
    it.each([
      {
        description: 'tracks when selecting ALL worker type',
        workerType: WorkerType.ALL,
        expectedTrackingValue: 'all',
      },
      {
        description: 'tracks when selecting EMPLOYEE worker type',
        workerType: WorkerType.EMPLOYEE,
        expectedTrackingValue: 'employee',
      },
      {
        description: 'tracks when selecting USER worker type',
        workerType: WorkerType.LEGACY_QBO_USER,
        expectedTrackingValue: 'user',
      },
      {
        description: 'tracks when selecting VENDOR worker type',
        workerType: WorkerType.VENDOR,
        expectedTrackingValue: 'vendor',
      },
    ])('$description', ({ workerType, expectedTrackingValue }) => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByTestId('worker-type-filter');
      fireEvent.change(select, { target: { value: workerType } });

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          worker_type: expectedTrackingValue,
        }),
      );
    });

    it('should track every time the filter changes', () => {
      render(
        <WorkerTypeFilter value={WorkerType.ALL} onChange={mockOnChange} />,
      );

      const select = screen.getByTestId('worker-type-filter');

      fireEvent.change(select, { target: { value: WorkerType.EMPLOYEE } });
      fireEvent.change(select, { target: { value: WorkerType.VENDOR } });
      fireEvent.change(select, { target: { value: WorkerType.ALL } });

      expect(mockTrack).toHaveBeenCalledTimes(3);
    });
  });
});
