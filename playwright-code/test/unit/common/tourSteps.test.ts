import { renderHook } from '@testing-library/react-hooks';
import {
  TimeClockTourSteps,
  WeeklyTimesheetPageTourSteps,
  BreakTourSteps,
  CustomFieldTourSteps,
  WeeklyTimesheetTourSteps,
  SingleTimeActivityTourSteps,
} from 'src/js/common/tourSteps';

// Mock useIntl hook
jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(() => ({
    formatMessage: jest.fn(({ id }) => id),
  })),
}));

describe('tourSteps', () => {
  describe('TimeClockTourSteps', () => {
    it('should return an array of tour steps', () => {
      const { result } = renderHook(() => TimeClockTourSteps());
      expect(result.current).toBeInstanceOf(Array);
      expect(result.current.length).toBeGreaterThan(0);
    });

    it('should have required properties for each step', () => {
      const { result } = renderHook(() => TimeClockTourSteps());
      result.current.forEach((step) => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('buttonText');
        expect(step).toHaveProperty('position');
        expect(step).toHaveProperty('bgcolor');
        expect(step).toHaveProperty('lottieData');
      });
    });

    it('should have unique ids for each step', () => {
      const { result } = renderHook(() => TimeClockTourSteps());
      const ids = result.current.map((step) => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('WeeklyTimesheetPageTourSteps', () => {
    it('should return an array of tour steps', () => {
      const { result } = renderHook(() => WeeklyTimesheetPageTourSteps());
      expect(result.current).toBeInstanceOf(Array);
      expect(result.current.length).toBeGreaterThan(0);
    });

    it('should have required properties for each step', () => {
      const { result } = renderHook(() => WeeklyTimesheetPageTourSteps());
      result.current.forEach((step) => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('bgcolor');
        expect(step).toHaveProperty('lottieData');
      });
    });

    it('should have unique ids for each step', () => {
      const { result } = renderHook(() => WeeklyTimesheetPageTourSteps());
      const ids = result.current.map((step) => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('BreakTourSteps', () => {
    it('should return an array of tour steps', () => {
      const { result } = renderHook(() => BreakTourSteps());
      expect(result.current).toBeInstanceOf(Array);
      expect(result.current.length).toBeGreaterThan(0);
    });

    it('should have required properties for each step', () => {
      const { result } = renderHook(() => BreakTourSteps());
      result.current.forEach((step) => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('bgcolor');
        expect(step).toHaveProperty('lottieData');
      });
    });
  });

  describe('CustomFieldTourSteps', () => {
    it('should return an array of tour steps', () => {
      const { result } = renderHook(() => CustomFieldTourSteps());
      expect(result.current).toBeInstanceOf(Array);
      expect(result.current.length).toBeGreaterThan(0);
    });

    it('should have required properties for each step', () => {
      const { result } = renderHook(() => CustomFieldTourSteps());
      result.current.forEach((step) => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('bgcolor');
        expect(step).toHaveProperty('lottieData');
      });
    });
  });

  describe('WeeklyTimesheetTourSteps', () => {
    it('should return an array of tour steps', () => {
      const { result } = renderHook(() => WeeklyTimesheetTourSteps());
      expect(result.current).toBeInstanceOf(Array);
      expect(result.current.length).toBeGreaterThan(0);
    });

    it('should have required properties for each step', () => {
      const { result } = renderHook(() => WeeklyTimesheetTourSteps());
      result.current.forEach((step) => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('bgcolor');
        expect(step).toHaveProperty('lottieData');
      });
    });

    it('should have unique ids for each step', () => {
      const { result } = renderHook(() => WeeklyTimesheetTourSteps());
      const ids = result.current.map((step) => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('SingleTimeActivityTourSteps', () => {
    it('should return an array of tour steps', () => {
      const { result } = renderHook(() => SingleTimeActivityTourSteps());
      expect(result.current).toBeInstanceOf(Array);
      expect(result.current.length).toBeGreaterThan(0);
    });

    it('should have required properties for each step', () => {
      const { result } = renderHook(() => SingleTimeActivityTourSteps());
      result.current.forEach((step) => {
        expect(step).toHaveProperty('id');
        expect(step).toHaveProperty('title');
        expect(step).toHaveProperty('description');
        expect(step).toHaveProperty('bgcolor');
        expect(step).toHaveProperty('lottieData');
      });
    });

    it('should have unique ids for each step', () => {
      const { result } = renderHook(() => SingleTimeActivityTourSteps());
      const ids = result.current.map((step) => step.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Tour steps integration', () => {
    it('should all have lottieData animations', () => {
      const allTourStepFunctions = [
        TimeClockTourSteps,
        WeeklyTimesheetPageTourSteps,
        BreakTourSteps,
        CustomFieldTourSteps,
        WeeklyTimesheetTourSteps,
        SingleTimeActivityTourSteps,
      ];

      allTourStepFunctions.forEach((tourStepFn) => {
        const { result } = renderHook(() => tourStepFn());
        result.current.forEach((step: any) => {
          expect(step.lottieData).toBeDefined();
          expect(typeof step.lottieData).toBe('object');
        });
      });
    });

    it('should all have bgcolor defined', () => {
      const allTourStepFunctions = [
        TimeClockTourSteps,
        WeeklyTimesheetPageTourSteps,
        BreakTourSteps,
        CustomFieldTourSteps,
        WeeklyTimesheetTourSteps,
        SingleTimeActivityTourSteps,
      ];

      allTourStepFunctions.forEach((tourStepFn) => {
        const { result } = renderHook(() => tourStepFn());
        result.current.forEach((step: any) => {
          expect(step.bgcolor).toBeDefined();
          expect(typeof step.bgcolor).toBe('string');
          expect(step.bgcolor).toMatch(/^#[0-9A-F]{6}$/i);
        });
      });
    });
  });
});
