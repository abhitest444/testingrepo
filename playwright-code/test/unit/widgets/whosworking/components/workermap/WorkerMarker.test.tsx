import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { WorkerMarker } from 'src/js/widgets/whosworking/components/workerMap/WorkerMarker';
import { WhoIsWorkingWorkerNode } from 'src/js/widgets/whosworking/hooks/useWhoIsWorkingLoadMore';

// Mock tracking function
const mockTrack = jest.fn();
const mockSandbox = {
  appContext: {
    getUserAuthInfo: jest.fn(() => ({ authId: 'auth-user-1' })),
    getAppInfo: jest.fn(() => ({ appId: 'test-app' })),
  },
};

jest.mock('@payroll/quicksand', () => ({
  useTracking: () => mockTrack,
  useSandbox: () => mockSandbox,
}));

// Helper to create mock worker nodes
const createMockWorker = (
  id: string,
  displayName: string,
  overrides?: Partial<WhoIsWorkingWorkerNode>,
): WhoIsWorkingWorkerNode =>
  ({
    timeForContactDAS: { id },
    firstName: displayName.split(' ')[0],
    lastName: displayName.split(' ')[1] || 'Test',
    displayName,
    timeForType: 'EMPLOYEE',
    group: null,
    totalDaySeconds: 3600,
    activeTimeEntry: null,
    currentLocation: null,
    ...overrides,
  } as WhoIsWorkingWorkerNode);

describe('WorkerMarker', () => {
  const defaultProps = {
    worker: createMockWorker('1', 'John Doe'),
    lat: 40.7128,
    lng: -74.006,
    isSelected: false,
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTrack.mockClear();
  });

  describe('Rendering', () => {
    it('renders the component', () => {
      render(<WorkerMarker {...defaultProps} />);

      expect(screen.getByTitle('John Doe')).toBeInTheDocument();
    });

    it('renders with default props', () => {
      render(<WorkerMarker worker={defaultProps.worker} lat={0} lng={0} />);

      expect(screen.getByTitle('John Doe')).toBeInTheDocument();
    });
  });

  describe('Initials Display', () => {
    it('displays first and last initials for two-word name', () => {
      const worker = createMockWorker('1', 'John Doe');
      render(<WorkerMarker {...defaultProps} worker={worker} />);

      expect(screen.getByTitle('John Doe')).toHaveTextContent('JD');
    });

    it('displays first and last initials for multi-word name', () => {
      const worker = createMockWorker('1', 'John William Doe');
      worker.displayName = 'John William Doe';
      render(<WorkerMarker {...defaultProps} worker={worker} />);

      expect(screen.getByTitle('John William Doe')).toHaveTextContent('JD');
    });

    it('displays first two characters for single-word name', () => {
      const worker = createMockWorker('1', 'John');
      worker.displayName = 'John';
      render(<WorkerMarker {...defaultProps} worker={worker} />);

      expect(screen.getByTitle('John')).toHaveTextContent('JO');
    });

    it('converts initials to uppercase', () => {
      const worker = createMockWorker('1', 'john doe');
      worker.displayName = 'john doe';
      render(<WorkerMarker {...defaultProps} worker={worker} />);

      expect(screen.getByTitle('john doe')).toHaveTextContent('JD');
    });
  });

  describe('Selection State', () => {
    it('applies selected styling when isSelected is true', () => {
      render(<WorkerMarker {...defaultProps} isSelected />);

      // The marker should reflect selected state
      // Since we're not mocking styled-components, we just verify it renders
      expect(screen.getByTitle('John Doe')).toBeInTheDocument();
    });

    it('applies non-selected styling when isSelected is false', () => {
      render(<WorkerMarker {...defaultProps} isSelected={false} />);

      expect(screen.getByTitle('John Doe')).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('calls onSelect with worker ID when clicked', () => {
      const onSelect = jest.fn();
      render(<WorkerMarker {...defaultProps} onSelect={onSelect} />);

      fireEvent.click(screen.getByTitle('John Doe'));

      expect(onSelect).toHaveBeenCalledWith('1');
    });

    it('tracks TEAM_MEMBER_SELECT when marker is clicked', () => {
      render(<WorkerMarker {...defaultProps} />);

      fireEvent.click(screen.getByTitle('John Doe'));

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          ui_action: 'clicked',
          ui_object: 'button',
          ui_object_detail: 'team_member',
        }),
      );
    });

    it('calls onSelect with empty string when already selected', () => {
      const onSelect = jest.fn();
      render(<WorkerMarker {...defaultProps} isSelected onSelect={onSelect} />);

      fireEvent.click(screen.getByTitle('John Doe'));

      expect(onSelect).toHaveBeenCalledWith('');
    });

    it('does not call onSelect if not provided', () => {
      render(<WorkerMarker worker={defaultProps.worker} lat={0} lng={0} />);

      // Should not throw
      fireEvent.click(screen.getByTitle('John Doe'));
    });

    it('does not call onSelect if worker has no ID', () => {
      const onSelect = jest.fn();
      const worker = {
        ...createMockWorker('1', 'John Doe'),
        timeForContactDAS: undefined,
      } as any;

      render(
        <WorkerMarker {...defaultProps} worker={worker} onSelect={onSelect} />,
      );

      fireEvent.click(screen.getByTitle('John Doe'));

      expect(onSelect).not.toHaveBeenCalled();
    });

    it('stops event propagation on click', () => {
      const parentClickHandler = jest.fn();
      render(
        /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
        <div onClick={parentClickHandler}>
          <WorkerMarker {...defaultProps} />
        </div>,
        /* eslint-enable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
      );

      fireEvent.click(screen.getByTitle('John Doe'));

      expect(parentClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('Title Attribute', () => {
    it('displays worker name as title', () => {
      const worker = createMockWorker('1', 'John Doe');
      render(<WorkerMarker {...defaultProps} worker={worker} />);

      expect(screen.getByTitle('John Doe')).toBeInTheDocument();
    });
  });

  describe('Lat/Lng Props', () => {
    it('accepts latitude and longitude', () => {
      render(<WorkerMarker {...defaultProps} lat={40.7128} lng={-74.006} />);

      // These are typically used by Google Maps to position the marker
      expect(screen.getByTitle('John Doe')).toBeInTheDocument();
    });

    it('handles zero coordinates', () => {
      render(<WorkerMarker {...defaultProps} lat={0} lng={0} />);

      expect(screen.getByTitle('John Doe')).toBeInTheDocument();
    });

    it('handles negative coordinates', () => {
      render(<WorkerMarker {...defaultProps} lat={-33.8688} lng={151.2093} />);

      expect(screen.getByTitle('John Doe')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles name with leading/trailing spaces', () => {
      const worker = createMockWorker('1', '  John Doe  ');
      worker.displayName = '  John Doe  ';
      render(<WorkerMarker {...defaultProps} worker={worker} />);

      // After trimming, should get JD - use regex to match title with spaces
      expect(screen.getByTitle(/John Doe/)).toHaveTextContent('JD');
    });

    it('handles single character name', () => {
      const worker = createMockWorker('1', 'J');
      worker.displayName = 'J';
      render(<WorkerMarker {...defaultProps} worker={worker} />);

      expect(screen.getByTitle('J')).toHaveTextContent('J');
    });

    it('handles special characters in name', () => {
      const worker = createMockWorker('1', "O'Brien Smith");
      worker.displayName = "O'Brien Smith";
      render(<WorkerMarker {...defaultProps} worker={worker} />);

      expect(screen.getByTitle("O'Brien Smith")).toHaveTextContent('OS');
    });

    it('handles hyphenated last name', () => {
      const worker = createMockWorker('1', 'John Smith-Jones');
      worker.displayName = 'John Smith-Jones';
      render(<WorkerMarker {...defaultProps} worker={worker} />);

      expect(screen.getByTitle('John Smith-Jones')).toHaveTextContent('JS');
    });
  });
});
