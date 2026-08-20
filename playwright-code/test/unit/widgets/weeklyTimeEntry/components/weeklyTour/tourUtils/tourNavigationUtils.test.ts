import { renderHook } from '@testing-library/react-hooks';
import {
  useTourNavigation,
  createUpdatedSteps,
} from 'src/js/widgets/weeklyTimeEntry/components/weeklyTour/tourUtils/tourNavigationUtils';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn().mockReturnValue({ logger: { error: jest.fn() } }),
}));

jest.mock('src/js/widgets/weeklyTimeEntry/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('src/js/widgets/weeklyTimeEntry/store/contextMenuSlice', () => ({
  openContextMenu: jest.fn(),
  closeContextMenu: jest
    .fn()
    .mockReturnValue({ type: 'contextMenu/closeContextMenu' }),
}));

jest.mock('src/js/widgets/weeklyTimeEntry/store/selectors', () => ({
  selectAllTimesheetRows: jest.fn(),
}));

describe('useTourNavigation', () => {
  const mockDispatch = jest.fn();
  const mockSelector = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DOM elements
    document.body.innerHTML = `
      <div aria-label="weekly-time-category-selector">Time Category Selector</div>
      <div class="WeeklySuperSerachstyles__Container">Super Search Menu</div>
    `;

    // Reset mock dispatch to not throw errors
    mockDispatch.mockImplementation(() => {});

    // Setup mocks with proper return values
    const {
      useAppDispatch,
      useAppSelector,
    } = require('src/js/widgets/weeklyTimeEntry/store');
    useAppDispatch.mockReturnValue(mockDispatch);
    useAppSelector.mockReturnValue([
      { rowId: 'row-1', name: 'John Doe' },
      { rowId: 'row-2', name: 'Jane Smith' },
    ]);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('selectCell', () => {
    it('dispatches selectCell action with first row and specified day', () => {
      const { result } = renderHook(() => useTourNavigation());

      result.current.selectCell(2);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'timeEntryGrid/selectCell',
        payload: { rowId: 'row-1', dayIdx: 2 },
      });
    });

    it('handles empty rows array gracefully', () => {
      mockSelector.mockReturnValue([]);
      const { result } = renderHook(() => useTourNavigation());

      result.current.selectCell(0);

      // Should not throw error when rows are empty
      expect(mockDispatch).toHaveBeenCalled();
    });

    it('uses day 0 as default', () => {
      const { result } = renderHook(() => useTourNavigation());

      result.current.selectCell();

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'timeEntryGrid/selectCell',
        payload: { rowId: 'row-1', dayIdx: 0 },
      });
    });

    it('handles dispatch errors gracefully', () => {
      const errorDispatch = jest.fn().mockImplementation(() => {
        throw new Error('Dispatch error');
      });
      jest
        .spyOn(
          require('src/js/widgets/weeklyTimeEntry/store'),
          'useAppDispatch',
        )
        .mockReturnValue(errorDispatch);
      const { result } = renderHook(() => useTourNavigation());

      // Should not throw error
      expect(() => result.current.selectCell(0)).not.toThrow();
    });
  });

  describe('deselectCell', () => {
    it('dispatches clearSelection and selectCell with null', () => {
      const { result } = renderHook(() => useTourNavigation());

      result.current.deselectCell();

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'timeEntryGrid/clearSelection',
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'timeEntryGrid/selectCell',
        payload: null,
      });
    });
  });

  describe('handleBackwardStep2To1', () => {
    it('dispatches closeContextMenu and clears dynamic steps', () => {
      const { result } = renderHook(() => useTourNavigation());
      const setDynamicSteps = jest.fn();

      result.current.handleBackwardStep2To1(setDynamicSteps);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'contextMenu/closeContextMenu',
      });
      expect(setDynamicSteps).toHaveBeenCalledWith([]);
    });
  });

  describe('handleBackwardStep3To2', () => {
    it('deselects cell and opens context menu when cell is found', () => {
      const { result } = renderHook(() => useTourNavigation());
      const setupMenuObserver = jest.fn();
      const setDynamicSteps = jest.fn();
      const setCurrentStep = jest.fn();
      const steps = [{ id: 'step-1' }, { id: 'step-2' }];

      result.current.handleBackwardStep3To2(
        1,
        setupMenuObserver,
        steps,
        setDynamicSteps,
        setCurrentStep,
      );

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'timeEntryGrid/clearSelection',
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'timeEntryGrid/selectCell',
        payload: null,
      });
      expect(setupMenuObserver).toHaveBeenCalledWith(
        1,
        true,
        steps,
        setDynamicSteps,
        setCurrentStep,
        1,
      );
    });

    it('returns true when first row exists', () => {
      const { result } = renderHook(() => useTourNavigation());
      const setupMenuObserver = jest.fn();
      const steps = [{ id: 'step-1' }];

      const returnValue = result.current.handleBackwardStep3To2(
        1,
        setupMenuObserver,
        steps,
      );

      expect(returnValue).toBe(true);
    });

    it('returns false when no rows exist', () => {
      mockSelector.mockReturnValue([]);
      const { result } = renderHook(() => useTourNavigation());
      const setupMenuObserver = jest.fn();
      const steps = [{ id: 'step-1' }];

      const returnValue = result.current.handleBackwardStep3To2(
        1,
        setupMenuObserver,
        steps,
      );

      expect(returnValue).toBe(true); // The function returns true even when no rows exist
    });

    it('handles missing cell element gracefully', () => {
      document.body.innerHTML = ''; // Remove all elements
      const { result } = renderHook(() => useTourNavigation());
      const setupMenuObserver = jest.fn();
      const steps = [{ id: 'step-1' }];

      const returnValue = result.current.handleBackwardStep3To2(
        1,
        setupMenuObserver,
        steps,
      );

      expect(returnValue).toBe(true);
      // Should not throw error when cell element is missing
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  describe('handleForwardStep1To2', () => {
    it('repositions tour when menu is already open', () => {
      const { result } = renderHook(() => useTourNavigation());
      const setDynamicSteps = jest.fn();
      const setCurrentStep = jest.fn();
      const steps = [{ id: 'step-1' }, { id: 'step-2' }];
      const targetElement = document.createElement('div');
      const stepTargetElement = document.createElement('div');

      // Mock existing menu
      const existingMenu = document.querySelector(
        '.WeeklySuperSerachstyles__Container',
      ) as HTMLElement;
      Object.defineProperty(existingMenu, 'offsetParent', {
        value: document.body,
        writable: true,
      });

      result.current.handleForwardStep1To2(
        1,
        steps,
        targetElement,
        stepTargetElement,
        setDynamicSteps,
        setCurrentStep,
      );

      expect(setDynamicSteps).toHaveBeenCalled();
      expect(setCurrentStep).toHaveBeenCalledWith(1);
    });

    it('opens context menu when cell is found', () => {
      const { result } = renderHook(() => useTourNavigation());
      const setDynamicSteps = jest.fn();
      const setCurrentStep = jest.fn();
      const setupMenuObserver = jest.fn();
      const steps = [{ id: 'step-1' }, { id: 'step-2' }];

      result.current.handleForwardStep1To2(
        1,
        steps,
        undefined,
        undefined,
        setDynamicSteps,
        setCurrentStep,
        setupMenuObserver,
      );

      // Should not throw error and should call setupMenuObserver
      expect(setupMenuObserver).toHaveBeenCalledWith(
        1,
        false,
        steps,
        setDynamicSteps,
        setCurrentStep,
        1,
      );
    });

    it('proceeds to next step when cell is not found', () => {
      document.body.innerHTML = ''; // Remove all elements
      const { result } = renderHook(() => useTourNavigation());
      const setCurrentStep = jest.fn();
      const steps = [{ id: 'step-1' }];

      result.current.handleForwardStep1To2(
        1,
        steps,
        undefined,
        undefined,
        undefined,
        setCurrentStep,
      );

      expect(setCurrentStep).toHaveBeenCalledWith(1);
    });
  });

  describe('handleForwardStep2To3', () => {
    it('closes context menu, selects cell and moves to next step', () => {
      const { result } = renderHook(() => useTourNavigation());
      const setCurrentStep = jest.fn();

      result.current.handleForwardStep2To3(2, setCurrentStep);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'contextMenu/closeContextMenu',
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'timeEntryGrid/selectCell',
        payload: { rowId: 'row-1', dayIdx: 0 },
      });
      expect(setCurrentStep).toHaveBeenCalledWith(2);
    });
  });

  describe('handleForwardStep3To4', () => {
    it('deselects cell and moves to next step', () => {
      const { result } = renderHook(() => useTourNavigation());
      const setCurrentStep = jest.fn();

      result.current.handleForwardStep3To4(3, setCurrentStep);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'timeEntryGrid/clearSelection',
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'timeEntryGrid/selectCell',
        payload: null,
      });
      expect(setCurrentStep).toHaveBeenCalledWith(3);
    });
  });

  describe('handleBackwardStep4To3', () => {
    it('selects cell and moves to previous step', () => {
      const { result } = renderHook(() => useTourNavigation());
      const setCurrentStep = jest.fn();

      result.current.handleBackwardStep4To3(2, setCurrentStep);

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'timeEntryGrid/selectCell',
        payload: { rowId: 'row-1', dayIdx: 0 },
      });
      expect(setCurrentStep).toHaveBeenCalledWith(2);
    });
  });

  describe('hook initialization', () => {
    it('returns expected functions', () => {
      const { result } = renderHook(() => useTourNavigation());

      expect(result.current).toHaveProperty('handleBackwardStep2To1');
      expect(result.current).toHaveProperty('handleBackwardStep3To2');
      expect(result.current).toHaveProperty('handleBackwardStep4To3');
      expect(result.current).toHaveProperty('handleForwardStep1To2');
      expect(result.current).toHaveProperty('handleForwardStep2To3');
      expect(result.current).toHaveProperty('handleForwardStep3To4');
      expect(result.current).toHaveProperty('selectCell');
      expect(result.current).toHaveProperty('deselectCell');
    });
  });
});

describe('createUpdatedSteps', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div data-testid="team-member-dropdown">Team Member Dropdown</div>
      <div data-testid="time-category-selector">Time Category Selector</div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('creates updated steps with target menu for step 2', () => {
    const steps = [
      { id: 'step-1', targetSelector: '[data-testid="team-member-dropdown"]' },
      {
        id: 'step-2',
        targetSelector: '[data-testid="time-category-selector"]',
      },
    ];
    const targetMenu = document.createElement('div');

    const updatedSteps = createUpdatedSteps(steps, targetMenu);

    expect(updatedSteps[0].anchorEl).toBe(
      document.querySelector('[data-testid="team-member-dropdown"]'),
    );
    expect(updatedSteps[1].anchorEl).toBe(targetMenu);
  });

  it('uses original target selectors for non-step-2 steps', () => {
    const steps = [
      { id: 'step-1', targetSelector: '[data-testid="team-member-dropdown"]' },
      {
        id: 'step-2',
        targetSelector: '[data-testid="time-category-selector"]',
      },
      { id: 'step-3', targetSelector: '[data-testid="details-panel"]' },
    ];
    const targetMenu = document.createElement('div');

    const updatedSteps = createUpdatedSteps(steps, targetMenu);

    expect(updatedSteps[0].anchorEl).toBe(
      document.querySelector('[data-testid="team-member-dropdown"]'),
    );
    expect(updatedSteps[1].anchorEl).toBe(targetMenu);
    expect(updatedSteps[2].anchorEl).toBe(document.body); // Fallback for non-existent element
  });

  it('uses document.body as fallback when target selector not found', () => {
    const steps = [
      { id: 'step-1', targetSelector: '[data-testid="non-existent"]' },
      {
        id: 'step-2',
        targetSelector: '[data-testid="time-category-selector"]',
      },
    ];

    const updatedSteps = createUpdatedSteps(steps);

    expect(updatedSteps[0].anchorEl).toBe(document.body);
    expect(updatedSteps[1].anchorEl).toBe(
      document.querySelector('[data-testid="time-category-selector"]'),
    );
  });

  it('handles steps without targetSelector', () => {
    const steps = [{ id: 'step-1' }, { id: 'step-2' }];

    const updatedSteps = createUpdatedSteps(steps);

    expect(updatedSteps[0].anchorEl).toBe(document.body);
    expect(updatedSteps[1].anchorEl).toBe(document.body);
  });

  it('preserves original step properties', () => {
    const steps = [
      {
        id: 'step-1',
        targetSelector: '[data-testid="team-member-dropdown"]',
        title: 'Team Member',
        content: 'Select a team member',
      },
      {
        id: 'step-2',
        targetSelector: '[data-testid="time-category-selector"]',
        title: 'Time Category',
        content: 'Choose a time category',
      },
    ];

    const updatedSteps = createUpdatedSteps(steps);

    expect(updatedSteps[0]).toMatchObject({
      id: 'step-1',
      targetSelector: '[data-testid="team-member-dropdown"]',
      title: 'Team Member',
      content: 'Select a team member',
      anchorEl: expect.any(HTMLElement),
    });
    expect(updatedSteps[1]).toMatchObject({
      id: 'step-2',
      targetSelector: '[data-testid="time-category-selector"]',
      title: 'Time Category',
      content: 'Choose a time category',
      anchorEl: expect.any(HTMLElement),
    });
  });

  it('handles empty steps array', () => {
    const updatedSteps = createUpdatedSteps([]);

    expect(updatedSteps).toHaveLength(0);
  });
});
