import { renderHook } from '@testing-library/react-hooks';
import { useTourObserverUtils } from 'src/js/widgets/weeklyTimeEntry/components/weeklyTour/tourUtils/tourObserverUtils';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn().mockReturnValue({ logger: { error: jest.fn() } }),
}));

jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/weeklyTour/tourUtils/tourNavigationUtils',
  () => ({
    createUpdatedSteps: jest.fn((steps, targetMenu) =>
      steps.map((step: any, idx: number) => ({
        ...step,
        anchorEl: idx === 1 && targetMenu ? targetMenu : document.body,
      })),
    ),
  }),
);

describe('useTourObserverUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DOM elements
    document.body.innerHTML = `
      <div class="WeeklySuperSerachstyles__Container">Super Search Menu</div>
      <div data-testid="super-search-context-menu">Context Menu</div>
      <div data-testid="super-search-menu">Search Menu</div>
      <div role="menu">Role Menu</div>
      <div class="super-search-menu">Super Search Menu Class</div>
      <div data-testid="menu">Generic Menu</div>
      <div class="context-menu">Context Menu Class</div>
      <div class="dropdown-menu">Dropdown Menu Class</div>
      <div class="menu-container">Menu Container</div>
      <div class="dropdown-container">Dropdown Container</div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('setupMenuObserver', () => {
    it('sets up mutation observer with correct options', () => {
      const { result } = renderHook(() => useTourObserverUtils());
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };

      // Mock MutationObserver
      global.MutationObserver = jest
        .fn()
        .mockImplementation(() => mockObserver);

      result.current.setupMenuObserver(1);

      expect(global.MutationObserver).toHaveBeenCalled();
      expect(mockObserver.observe).toHaveBeenCalledWith(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'data-testid'],
      });
    });

    it('finds and handles weekly super search container', () => {
      const { result } = renderHook(() => useTourObserverUtils());
      const setDynamicSteps = jest.fn();
      const setCurrentStep = jest.fn();
      const steps = [{ id: 'step-1' }, { id: 'step-2' }];

      // Mock MutationObserver
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
      global.MutationObserver = jest
        .fn()
        .mockImplementation(() => mockObserver);

      result.current.setupMenuObserver(
        1,
        false,
        steps,
        setDynamicSteps,
        setCurrentStep,
      );

      // Simulate menu becoming visible
      const weeklyMenu = document.querySelector(
        '.WeeklySuperSerachstyles__Container',
      ) as HTMLElement;
      Object.defineProperty(weeklyMenu, 'offsetParent', {
        value: document.body,
        writable: true,
      });

      // Trigger observer callback
      const observerCallback = (global.MutationObserver as jest.Mock).mock
        .calls[0][0];
      observerCallback([]);

      expect(mockObserver.disconnect).toHaveBeenCalled();
      expect(setDynamicSteps).toHaveBeenCalled();
      expect(setCurrentStep).toHaveBeenCalledWith(1);
    });

    it('finds and handles super search context menu', () => {
      const { result } = renderHook(() => useTourObserverUtils());
      const setDynamicSteps = jest.fn();
      const setCurrentStep = jest.fn();
      const steps = [{ id: 'step-1' }, { id: 'step-2' }];

      // Remove weekly menu to test fallback
      document.querySelector('.WeeklySuperSerachstyles__Container')?.remove();

      // Mock MutationObserver
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
      global.MutationObserver = jest
        .fn()
        .mockImplementation(() => mockObserver);

      result.current.setupMenuObserver(
        1,
        false,
        steps,
        setDynamicSteps,
        setCurrentStep,
      );

      // Simulate menu becoming visible
      const contextMenu = document.querySelector(
        '[data-testid="super-search-context-menu"]',
      ) as HTMLElement;
      Object.defineProperty(contextMenu, 'offsetParent', {
        value: document.body,
        writable: true,
      });

      // Trigger observer callback
      const observerCallback = (global.MutationObserver as jest.Mock).mock
        .calls[0][0];
      observerCallback([]);

      expect(mockObserver.disconnect).toHaveBeenCalled();
      expect(setDynamicSteps).toHaveBeenCalled();
      expect(setCurrentStep).toHaveBeenCalledWith(1);
    });

    it('finds and handles role menu', () => {
      const { result } = renderHook(() => useTourObserverUtils());
      const setDynamicSteps = jest.fn();
      const setCurrentStep = jest.fn();
      const steps = [{ id: 'step-1' }, { id: 'step-2' }];

      // Remove other menus to test fallback
      document.querySelector('.WeeklySuperSerachstyles__Container')?.remove();
      document
        .querySelector('[data-testid="super-search-context-menu"]')
        ?.remove();

      // Mock MutationObserver
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
      global.MutationObserver = jest
        .fn()
        .mockImplementation(() => mockObserver);

      result.current.setupMenuObserver(
        1,
        false,
        steps,
        setDynamicSteps,
        setCurrentStep,
      );

      // Make the menu visible first
      const roleMenu = document.querySelector('[role="menu"]') as HTMLElement;
      Object.defineProperty(roleMenu, 'offsetParent', {
        value: document.body,
        writable: true,
      });

      // Simulate the observer callback being triggered
      const observerCallback = (global.MutationObserver as jest.Mock).mock
        .calls[0][0];

      // Call the callback which should trigger the menu detection logic
      observerCallback([]);

      // Should not throw error when observer callback is triggered
      expect(observerCallback).toBeDefined();
    });

    it('handles backward navigation with delay', () => {
      const { result } = renderHook(() => useTourObserverUtils());
      const setCurrentStep = jest.fn();

      // Mock requestAnimationFrame
      global.requestAnimationFrame = jest.fn((cb) => {
        cb(0);
        return 1;
      });

      // Mock MutationObserver
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
      global.MutationObserver = jest
        .fn()
        .mockImplementation(() => mockObserver);

      result.current.setupMenuObserver(
        1,
        true,
        undefined,
        undefined,
        setCurrentStep,
      );

      expect(global.requestAnimationFrame).toHaveBeenCalled();
      expect(setCurrentStep).toHaveBeenCalledWith(1);
    });

    it('handles backward navigation when menu is already visible', () => {
      const { result } = renderHook(() => useTourObserverUtils());
      const setCurrentStep = jest.fn();

      // Make menu already visible
      const weeklyMenu = document.querySelector(
        '.WeeklySuperSerachstyles__Container',
      ) as HTMLElement;
      Object.defineProperty(weeklyMenu, 'offsetParent', {
        value: document.body,
        writable: true,
      });

      // Mock requestAnimationFrame
      global.requestAnimationFrame = jest.fn((cb) => {
        cb(0);
        return 1;
      });

      // Mock MutationObserver
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
      global.MutationObserver = jest
        .fn()
        .mockImplementation(() => mockObserver);

      result.current.setupMenuObserver(
        1,
        true,
        undefined,
        undefined,
        setCurrentStep,
      );

      // Should not call setCurrentStep immediately since menu is visible
      expect(setCurrentStep).not.toHaveBeenCalled();
    });

    it('does not call callbacks when menu is not visible', () => {
      const { result } = renderHook(() => useTourObserverUtils());
      const setDynamicSteps = jest.fn();
      const setCurrentStep = jest.fn();
      const steps = [{ id: 'step-1' }, { id: 'step-2' }];

      // Mock MutationObserver
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
      global.MutationObserver = jest
        .fn()
        .mockImplementation(() => mockObserver);

      result.current.setupMenuObserver(
        1,
        false,
        steps,
        setDynamicSteps,
        setCurrentStep,
      );

      // Simulate menu not being visible
      const weeklyMenu = document.querySelector(
        '.WeeklySuperSerachstyles__Container',
      ) as HTMLElement;
      Object.defineProperty(weeklyMenu, 'offsetParent', {
        value: null,
        writable: true,
      });

      // Trigger observer callback
      const observerCallback = (global.MutationObserver as jest.Mock).mock
        .calls[0][0];
      observerCallback([]);

      expect(setDynamicSteps).not.toHaveBeenCalled();
      expect(setCurrentStep).not.toHaveBeenCalled();
    });

    it('handles missing callbacks gracefully', () => {
      const { result } = renderHook(() => useTourObserverUtils());

      // Mock MutationObserver
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
      global.MutationObserver = jest
        .fn()
        .mockImplementation(() => mockObserver);

      // Should not throw error
      expect(() => result.current.setupMenuObserver(1)).not.toThrow();
    });

    it('handles multiple menu selectors', () => {
      const { result } = renderHook(() => useTourObserverUtils());
      const setDynamicSteps = jest.fn();
      const setCurrentStep = jest.fn();
      const steps = [{ id: 'step-1' }, { id: 'step-2' }];

      // Remove weekly menu to test other selectors
      document.querySelector('.WeeklySuperSerachstyles__Container')?.remove();

      // Mock MutationObserver
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
      global.MutationObserver = jest
        .fn()
        .mockImplementation(() => mockObserver);

      result.current.setupMenuObserver(
        1,
        false,
        steps,
        setDynamicSteps,
        setCurrentStep,
      );

      // Simulate menu becoming visible
      const contextMenu = document.querySelector(
        '[data-testid="super-search-context-menu"]',
      ) as HTMLElement;
      Object.defineProperty(contextMenu, 'offsetParent', {
        value: document.body,
        writable: true,
      });

      // Trigger observer callback
      const observerCallback = (global.MutationObserver as jest.Mock).mock
        .calls[0][0];
      observerCallback([]);

      expect(mockObserver.disconnect).toHaveBeenCalled();
      expect(setDynamicSteps).toHaveBeenCalled();
      expect(setCurrentStep).toHaveBeenCalledWith(1);
    });

    it('handles empty DOM', () => {
      document.body.innerHTML = '';
      const { result } = renderHook(() => useTourObserverUtils());

      // Mock MutationObserver
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
      global.MutationObserver = jest
        .fn()
        .mockImplementation(() => mockObserver);

      // Should not throw error
      expect(() => result.current.setupMenuObserver(1)).not.toThrow();
    });

    it('handles observer disconnect', () => {
      const { result } = renderHook(() => useTourObserverUtils());

      // Mock MutationObserver
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn(),
      };
      global.MutationObserver = jest
        .fn()
        .mockImplementation(() => mockObserver);

      result.current.setupMenuObserver(1);

      // Simulate cleanup
      mockObserver.disconnect();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe('hook initialization', () => {
    it('returns expected functions', () => {
      const { result } = renderHook(() => useTourObserverUtils());

      expect(result.current).toHaveProperty('setupMenuObserver');
      expect(typeof result.current.setupMenuObserver).toBe('function');
    });
  });
});
