import { renderHook, act } from '@testing-library/react-hooks';
import {
  usePopoverInstrumentation,
  PopoverInstrumentationConfig,
} from 'src/js/common/usePopoverInstrumentation';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  })),
  useTracking: jest.fn(() => jest.fn()),
}));

describe('usePopoverInstrumentation', () => {
  const mockTrack = jest.fn();
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { useSandbox, useTracking } = require('@payroll/quicksand');
    useSandbox.mockReturnValue({ logger: mockLogger });
    useTracking.mockReturnValue(mockTrack);
  });

  describe('tracking points creation', () => {
    it('creates tracking points with default values', () => {
      const config = {
        screen: 'test-screen',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      expect(result.current.trackingPoints).toEqual({
        OPEN: {
          org: 'sbseg',
          purpose: 'prod',
          scope: 'time',
          scope_area: 'qbo',
          screen: 'test-screen',
          action: 'navigated',
          object: 'component',
          ui_action: 'clicked',
          ui_object: 'page',
          ui_access_point: 'popover',
          object_detail: 'popover_opened',
          ui_object_detail: 'popover_popover',
        },
        CLOSE: {
          org: 'sbseg',
          purpose: 'prod',
          scope: 'time',
          scope_area: 'qbo',
          screen: 'test-screen',
          action: 'navigated',
          object: 'component',
          ui_action: 'clicked',
          ui_object: 'page',
          ui_access_point: 'popover',
          object_detail: 'popover_closed',
          ui_object_detail: 'popover_popover',
        },
        SAVE: {
          org: 'sbseg',
          purpose: 'prod',
          scope: 'time',
          scope_area: 'qbo',
          screen: 'test-screen',
          action: 'navigated',
          object: 'component',
          ui_action: 'clicked',
          ui_object: 'page',
          ui_access_point: 'popover',
          object_detail: 'popover_saved',
          ui_object_detail: 'popover_save_button',
        },
        CANCEL: {
          org: 'sbseg',
          purpose: 'prod',
          scope: 'time',
          scope_area: 'qbo',
          screen: 'test-screen',
          action: 'navigated',
          object: 'component',
          ui_action: 'clicked',
          ui_object: 'page',
          ui_access_point: 'popover',
          object_detail: 'popover_cancelled',
          ui_object_detail: 'popover_cancel_button',
        },
        STEP_CHANGE: {
          org: 'sbseg',
          purpose: 'prod',
          scope: 'time',
          scope_area: 'qbo',
          screen: 'test-screen',
          action: 'navigated',
          object: 'component',
          ui_action: 'clicked',
          ui_object: 'page',
          ui_access_point: 'popover',
          object_detail: 'popover_step_changed',
          ui_object_detail: 'popover_tour_step',
        },
        TOUR_COMPLETE: {
          org: 'sbseg',
          purpose: 'prod',
          scope: 'time',
          scope_area: 'qbo',
          screen: 'test-screen',
          action: 'navigated',
          object: 'component',
          ui_action: 'clicked',
          ui_object: 'page',
          ui_access_point: 'popover',
          object_detail: 'popover_tour_completed',
          ui_object_detail: 'popover_tour',
        },
        ERROR: {
          org: 'sbseg',
          purpose: 'prod',
          scope: 'time',
          scope_area: 'qbo',
          screen: 'test-screen',
          action: 'error',
          object: 'component',
          ui_action: 'error',
          ui_object: 'page',
          ui_access_point: 'popover',
          object_detail: 'popover_error',
          ui_object_detail: 'popover_popover',
        },
      });
    });

    it('creates tracking points with custom object and details', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
        object_detail: 'time-settings',
        ui_object_detail: 'time-settings-ui',
        ui_access_point: 'gear-icon',
        previous_screen: 'weekly-timesheet',
        additionalContext: {
          hasPayroll: true,
          isAdmin: false,
        },
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      expect(result.current.trackingPoints.OPEN).toEqual({
        org: 'sbseg',
        purpose: 'prod',
        scope: 'time',
        scope_area: 'qbo',
        screen: 'test-screen',
        action: 'navigated',
        object: 'component',
        ui_action: 'clicked',
        ui_object: 'page',
        ui_access_point: 'gear-icon',
        previous_screen: 'weekly-timesheet',
        hasPayroll: true,
        isAdmin: false,
        object_detail: 'time-settings',
        ui_object_detail: 'time-settings-ui',
      });
    });
  });

  describe('logPopoverOpen', () => {
    it('logs popover open with default heading', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverOpen();
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=test-screen Event=Opened PopoverHeading=Settings Popover',
        expect.objectContaining({
          componentName: 'test-screen',
          popoverHeading: 'Settings Popover',
          screen: 'test-screen',
          object_detail: 'unknown-object',
          ui_object_detail: 'unknown-ui-object',
          ui_access_point: 'popover',
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          object_detail: 'settings-popover_opened',
          ui_object_detail: 'settings-popover_popover',
        }),
      );
    });

    it('logs popover open with custom heading from config', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
        popoverHeading: 'Time Settings',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverOpen();
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=test-screen Event=Opened PopoverHeading=Time Settings',
        expect.objectContaining({
          popoverHeading: 'Time Settings',
        }),
      );
    });

    it('logs popover open with dynamic heading from additional data', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
        popoverHeading: 'Default Heading',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverOpen({
          popoverHeading: 'Dynamic Heading',
          stepNumber: 1,
        });
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=test-screen Event=Opened PopoverHeading=Dynamic Heading',
        expect.objectContaining({
          popoverHeading: 'Dynamic Heading',
          stepNumber: 1,
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          popoverHeading: 'Dynamic Heading',
          stepNumber: 1,
        }),
      );
    });
  });

  describe('logPopoverClose', () => {
    it('logs popover close with default heading', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverClose();
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=test-screen Event=Closed PopoverHeading=Settings Popover',
        expect.objectContaining({
          componentName: 'test-screen',
          popoverHeading: 'Settings Popover',
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          object_detail: 'settings-popover_closed',
        }),
      );
    });

    it('logs popover close with additional data', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverClose({
          popoverHeading: 'Custom Close Heading',
          duration: 5000,
        });
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=test-screen Event=Closed PopoverHeading=Custom Close Heading',
        expect.objectContaining({
          popoverHeading: 'Custom Close Heading',
          duration: 5000,
        }),
      );
    });
  });

  describe('logPopoverSave', () => {
    it('logs popover save with default heading', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverSave();
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=test-screen Event=Saved PopoverHeading=Settings Popover',
        expect.objectContaining({
          componentName: 'test-screen',
          popoverHeading: 'Settings Popover',
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          object_detail: 'settings-popover_saved',
          ui_object_detail: 'settings-popover_save_button',
        }),
      );
    });

    it('logs popover save with additional data', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverSave({
          popoverHeading: 'Save Heading',
          settingsChanged: true,
        });
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=test-screen Event=Saved PopoverHeading=Save Heading',
        expect.objectContaining({
          popoverHeading: 'Save Heading',
          settingsChanged: true,
        }),
      );
    });
  });

  describe('logPopoverCancel', () => {
    it('logs popover cancel with default heading', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverCancel();
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=test-screen Event=Cancelled PopoverHeading=Settings Popover',
        expect.objectContaining({
          componentName: 'test-screen',
          popoverHeading: 'Settings Popover',
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          object_detail: 'settings-popover_cancelled',
          ui_object_detail: 'settings-popover_cancel_button',
        }),
      );
    });
  });

  describe('logTourStepChange', () => {
    it('logs tour step change with step information', () => {
      const config = {
        screen: 'test-screen',
        object: 'tour-popover',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logTourStepChange(2, 4, {
          popoverHeading: 'Tour Step',
          stepTitle: 'Step 2',
        });
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=test-screen Event=StepChanged PopoverHeading=Tour Step',
        expect.objectContaining({
          componentName: 'test-screen',
          popoverHeading: 'Tour Step',
          stepNumber: '2',
          totalSteps: '4',
          currentStep: 2,
          stepTitle: 'Step 2',
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          object_detail: 'tour-popover_step_changed',
          stepNumber: '2',
          totalSteps: '4',
          stepTitle: 'Step 2',
        }),
      );
    });

    it('logs tour step change with default heading', () => {
      const config = {
        screen: 'test-screen',
        object: 'tour-popover',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logTourStepChange(1, 3);
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=test-screen Event=StepChanged PopoverHeading=Tour Popover',
        expect.objectContaining({
          stepNumber: '1',
          totalSteps: '3',
          currentStep: 1,
        }),
      );
    });
  });

  describe('logTourComplete', () => {
    it('logs tour completion with success status', () => {
      const config = {
        screen: 'test-screen',
        object: 'tour-popover',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logTourComplete({
          popoverHeading: 'Tour Complete',
          completionTime: 30000,
        });
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=test-screen Event=TourCompleted PopoverHeading=Tour Complete',
        expect.objectContaining({
          componentName: 'test-screen',
          popoverHeading: 'Tour Complete',
          completionStatus: 'success',
          completionTime: 30000,
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          object_detail: 'tour-popover_tour_completed',
          ui_object_detail: 'tour-popover_tour',
          completionTime: 30000,
        }),
      );
    });
  });

  describe('logPopoverError', () => {
    it('logs popover error with error message', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverError('Failed to save settings', {
          popoverHeading: 'Error Heading',
          errorCode: 'SAVE_FAILED',
        });
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Component=test-screen Event=Error PopoverHeading=Error Heading ErrorMessage=Failed to save settings',
        expect.objectContaining({
          componentName: 'test-screen',
          popoverHeading: 'Error Heading',
          errorMessage: 'Failed to save settings',
          errorType: 'popover_error',
          errorCode: 'SAVE_FAILED',
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'error',
          ui_action: 'error',
          object_detail: 'settings-popover_error',
          errorMessage: 'Failed to save settings',
          errorCode: 'SAVE_FAILED',
        }),
      );
    });

    it('logs popover error with default heading', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverError('Network error occurred');
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Component=test-screen Event=Error PopoverHeading=Settings Popover ErrorMessage=Network error occurred',
        expect.objectContaining({
          errorMessage: 'Network error occurred',
          errorType: 'popover_error',
        }),
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('handles missing screen configuration', () => {
      const config = { screen: 'unknown-screen' };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverOpen();
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=unknown-screen Event=Opened PopoverHeading=Popover',
        expect.objectContaining({
          screen: 'unknown-screen',
          object_detail: 'unknown-object',
          ui_object_detail: 'unknown-ui-object',
        }),
      );
    });

    it('handles complex object names with hyphens', () => {
      const config = {
        screen: 'test-screen',
        object: 'complex-popover-name',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverOpen();
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Component=test-screen Event=Opened PopoverHeading=Complex Popover Name',
        expect.objectContaining({
          popoverHeading: 'Complex Popover Name',
        }),
      );
    });

    it('handles additional context from config', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
        additionalContext: {
          featureFlag: 'new-ui',
          version: '2.0',
        },
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverOpen();
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          featureFlag: 'new-ui',
          version: '2.0',
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          featureFlag: 'new-ui',
          version: '2.0',
        }),
      );
    });

    it('handles previous screen configuration', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
        previous_screen: 'weekly-timesheet',
      };

      const { result } = renderHook(() => usePopoverInstrumentation(config));

      act(() => {
        result.current.logPopoverOpen();
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          previous_screen: 'weekly-timesheet',
        }),
      );

      expect(mockTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          previous_screen: 'weekly-timesheet',
        }),
      );
    });
  });

  describe('hook memoization', () => {
    it('memoizes tracking points correctly', () => {
      const config = {
        screen: 'test-screen',
        object: 'settings-popover',
      };

      const { result, rerender } = renderHook(() =>
        usePopoverInstrumentation(config),
      );

      const firstTrackingPoints = result.current.trackingPoints;

      rerender();

      expect(result.current.trackingPoints).toEqual(firstTrackingPoints);
    });

    it('creates new tracking points when config changes', () => {
      const { result, rerender } = renderHook(
        ({ config }: { config: PopoverInstrumentationConfig }) =>
          usePopoverInstrumentation(config),
        {
          initialProps: {
            config: {
              screen: 'test-screen',
              object: 'settings-popover',
            },
          },
        },
      );

      const firstTrackingPoints = result.current.trackingPoints;

      rerender({
        config: {
          screen: 'test-screen',
          object: 'different-popover',
        },
      });

      expect(result.current.trackingPoints).not.toEqual(firstTrackingPoints);
      expect(result.current.trackingPoints.OPEN.object_detail).toBe(
        'different-popover_opened',
      );
    });
  });
});
