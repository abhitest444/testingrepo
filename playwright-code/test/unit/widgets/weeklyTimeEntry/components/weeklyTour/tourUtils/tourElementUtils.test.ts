import { renderHook } from '@testing-library/react-hooks';
import { useTourElementUtils } from 'src/js/widgets/weeklyTimeEntry/components/weeklyTour/tourUtils/tourElementUtils';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn().mockReturnValue({ logger: { error: jest.fn() } }),
}));

describe('useTourElementUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock DOM elements
    document.body.innerHTML = `
      <div data-testid="team-member-dropdown">Team Member Dropdown</div>
      <div data-testid="time-category-selector">Time Category Selector</div>
      <div data-testid="details-panel">Details Panel</div>
      <div data-testid="save-button">Save Button</div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('findAnchorElement', () => {
    it('finds element using target selector', () => {
      const { result } = renderHook(() => useTourElementUtils());
      const step = { targetSelector: '[data-testid="team-member-dropdown"]' };

      const anchorEl = result.current.findAnchorElement(step, 0);

      expect(anchorEl).toBe(
        document.querySelector('[data-testid="team-member-dropdown"]'),
      );
    });

    it('uses stepTargetElement as fallback for first step', () => {
      const { result } = renderHook(() => useTourElementUtils());
      const step = { targetSelector: '[data-testid="non-existent"]' };
      const stepTargetElement = document.querySelector(
        '[data-testid="team-member-dropdown"]',
      ) as HTMLElement;

      const anchorEl = result.current.findAnchorElement(
        step,
        0,
        undefined,
        stepTargetElement,
      );

      expect(anchorEl).toBe(stepTargetElement);
    });

    it('uses targetElement as fallback', () => {
      const { result } = renderHook(() => useTourElementUtils());
      const step = { targetSelector: '[data-testid="non-existent"]' };
      const targetElement = document.querySelector(
        '[data-testid="time-category-selector"]',
      ) as HTMLElement;

      const anchorEl = result.current.findAnchorElement(step, 1, targetElement);

      expect(anchorEl).toBe(targetElement);
    });

    it('uses document.body as final fallback', () => {
      const { result } = renderHook(() => useTourElementUtils());
      const step = { targetSelector: '[data-testid="non-existent"]' };

      const anchorEl = result.current.findAnchorElement(step, 1);

      expect(anchorEl).toBe(document.body);
    });

    it('handles step without targetSelector', () => {
      const { result } = renderHook(() => useTourElementUtils());
      const step = {};
      const targetElement = document.querySelector(
        '[data-testid="details-panel"]',
      ) as HTMLElement;

      const anchorEl = result.current.findAnchorElement(step, 1, targetElement);

      expect(anchorEl).toBe(targetElement);
    });

    it('prioritizes stepTargetElement over targetElement for first step', () => {
      const { result } = renderHook(() => useTourElementUtils());
      const step = { targetSelector: '[data-testid="non-existent"]' };
      const stepTargetElement = document.querySelector(
        '[data-testid="team-member-dropdown"]',
      ) as HTMLElement;
      const targetElement = document.querySelector(
        '[data-testid="time-category-selector"]',
      ) as HTMLElement;

      const anchorEl = result.current.findAnchorElement(
        step,
        0,
        targetElement,
        stepTargetElement,
      );

      expect(anchorEl).toBe(stepTargetElement);
    });
  });

  describe('createBaseSteps', () => {
    it('creates base steps with anchor elements', () => {
      const { result } = renderHook(() => useTourElementUtils());
      const steps = [
        {
          id: 'step-1',
          targetSelector: '[data-testid="team-member-dropdown"]',
        },
        {
          id: 'step-2',
          targetSelector: '[data-testid="time-category-selector"]',
        },
      ];

      const baseSteps = result.current.createBaseSteps(steps);

      expect(baseSteps).toHaveLength(2);
      expect(baseSteps[0].anchorEl).toBe(
        document.querySelector('[data-testid="team-member-dropdown"]'),
      );
      expect(baseSteps[1].anchorEl).toBe(
        document.querySelector('[data-testid="time-category-selector"]'),
      );
    });

    it('uses stepTargetElement for first step when provided', () => {
      const { result } = renderHook(() => useTourElementUtils());
      const steps = [
        { id: 'step-1', targetSelector: '[data-testid="non-existent"]' },
        {
          id: 'step-2',
          targetSelector: '[data-testid="time-category-selector"]',
        },
      ];
      const stepTargetElement = document.querySelector(
        '[data-testid="team-member-dropdown"]',
      ) as HTMLElement;

      const baseSteps = result.current.createBaseSteps(
        steps,
        undefined,
        stepTargetElement,
      );

      expect(baseSteps[0].anchorEl).toBe(stepTargetElement);
      expect(baseSteps[1].anchorEl).toBe(
        document.querySelector('[data-testid="time-category-selector"]'),
      );
    });

    it('uses targetElement as fallback for non-first steps', () => {
      const { result } = renderHook(() => useTourElementUtils());
      const steps = [
        {
          id: 'step-1',
          targetSelector: '[data-testid="team-member-dropdown"]',
        },
        { id: 'step-2', targetSelector: '[data-testid="non-existent"]' },
      ];
      const targetElement = document.querySelector(
        '[data-testid="details-panel"]',
      ) as HTMLElement;

      const baseSteps = result.current.createBaseSteps(steps, targetElement);

      expect(baseSteps[0].anchorEl).toBe(
        document.querySelector('[data-testid="team-member-dropdown"]'),
      );
      expect(baseSteps[1].anchorEl).toBe(targetElement);
    });

    it('uses document.body as final fallback', () => {
      const { result } = renderHook(() => useTourElementUtils());
      const steps = [
        { id: 'step-1', targetSelector: '[data-testid="non-existent"]' },
        { id: 'step-2', targetSelector: '[data-testid="non-existent-2"]' },
      ];

      const baseSteps = result.current.createBaseSteps(steps);

      expect(baseSteps[0].anchorEl).toBe(document.body);
      expect(baseSteps[1].anchorEl).toBe(document.body);
    });

    it('preserves original step properties', () => {
      const { result } = renderHook(() => useTourElementUtils());
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

      const baseSteps = result.current.createBaseSteps(steps);

      expect(baseSteps[0]).toMatchObject({
        id: 'step-1',
        targetSelector: '[data-testid="team-member-dropdown"]',
        title: 'Team Member',
        content: 'Select a team member',
        anchorEl: expect.any(HTMLElement),
      });
      expect(baseSteps[1]).toMatchObject({
        id: 'step-2',
        targetSelector: '[data-testid="time-category-selector"]',
        title: 'Time Category',
        content: 'Choose a time category',
        anchorEl: expect.any(HTMLElement),
      });
    });

    it('handles empty steps array', () => {
      const { result } = renderHook(() => useTourElementUtils());

      const baseSteps = result.current.createBaseSteps([]);

      expect(baseSteps).toHaveLength(0);
    });

    it('handles steps with missing targetSelector', () => {
      const { result } = renderHook(() => useTourElementUtils());
      const steps = [{ id: 'step-1' }, { id: 'step-2' }];
      const targetElement = document.querySelector(
        '[data-testid="team-member-dropdown"]',
      ) as HTMLElement;

      const baseSteps = result.current.createBaseSteps(steps, targetElement);

      expect(baseSteps[0].anchorEl).toBe(targetElement);
      expect(baseSteps[1].anchorEl).toBe(targetElement);
    });
  });

  describe('hook initialization', () => {
    it('returns expected functions', () => {
      const { result } = renderHook(() => useTourElementUtils());

      expect(result.current).toHaveProperty('findAnchorElement');
      expect(result.current).toHaveProperty('createBaseSteps');
      expect(typeof result.current.findAnchorElement).toBe('function');
      expect(typeof result.current.createBaseSteps).toBe('function');
    });
  });
});
