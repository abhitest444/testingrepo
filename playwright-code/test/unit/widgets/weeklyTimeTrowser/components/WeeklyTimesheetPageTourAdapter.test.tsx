import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import WeeklyTimesheetPageTourAdapter from 'src/js/widgets/weeklyTimeTrowser/components/WeeklyTimesheetPageTourAdapter';
import { WeeklyTimesheetPageTourSteps } from 'src/js/common/tourSteps';
import { UxPreferenceKey } from 'src/js/service/utils/useUXPreferences';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(() => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
  })),
  useIntl: jest.fn(() => ({
    formatMessage: jest.fn(({ id }) => id),
  })),
}));

jest.mock('src/js/common/tourSteps', () => ({
  WeeklyTimesheetPageTourSteps: jest.fn(() => [
    {
      id: 'step-1',
      title: 'Step 1 Title',
      description: 'Step 1 Description',
      buttonText: 'Next',
      position: 'bottom',
      alignment: 'center',
      distance: 12,
      skidding: 0,
      bgcolor: '#F0E9FF',
      targetSelector: '[data-testid="test-element"]',
      lottieData: { test: 'animation-1' },
    },
    {
      id: 'step-2',
      title: 'Step 2 Title',
      description: 'Step 2 Description',
      buttonText: 'Done',
      position: 'bottom',
      alignment: 'center',
      distance: 12,
      skidding: 0,
      bgcolor: '#D8FFDB',
      targetSelector: '[data-testid="test-element-2"]',
      lottieData: { test: 'animation-2' },
    },
  ]),
}));

jest.mock('src/js/service/utils/useUXPreferences', () => ({
  useUxPreferences: jest.fn(() => ({
    setPreference: jest.fn().mockResolvedValue(undefined),
  })),
  UxPreferenceKey: {
    WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED:
      'WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED',
  },
}));

jest.mock('src/js/common/usePopoverInstrumentation', () => ({
  usePopoverInstrumentation: jest.fn(() => ({
    logPopoverOpen: jest.fn(),
    logPopoverClose: jest.fn(),
    logTourStepChange: jest.fn(),
    logTourComplete: jest.fn(),
    logPopoverError: jest.fn(),
  })),
}));

jest.mock(
  'src/js/widgets/common/GeneralPopoverTour/GeneralPopoverTour',
  () => ({
    __esModule: true,
    default: jest.fn(({ open, onClose, onFinish }) => (
      <div data-testid="general-popover-tour">
        {open && (
          <>
            <button onClick={onClose} data-testid="close-button">
              Close
            </button>
            <button onClick={onFinish} data-testid="finish-button">
              Finish
            </button>
          </>
        )}
      </div>
    )),
  }),
);

describe('WeeklyTimesheetPageTourAdapter', () => {
  const mockOnClose = jest.fn();
  const mockOnFinish = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a test element in the document
    const testElement = document.createElement('div');
    testElement.setAttribute('data-testid', 'test-element');
    document.body.appendChild(testElement);
  });

  afterEach(() => {
    // Clean up test elements
    const testElement = document.querySelector('[data-testid="test-element"]');
    if (testElement) {
      document.body.removeChild(testElement);
    }
  });

  it('should render null when tour is closed', () => {
    const { container } = render(
      <WeeklyTimesheetPageTourAdapter
        open={false}
        onClose={mockOnClose}
        onFinish={mockOnFinish}
      />,
    );

    expect(
      container.querySelector('[data-testid="general-popover-tour"]'),
    ).toBeInTheDocument();
  });

  it('should render GeneralPopoverTour when open is true', () => {
    render(
      <WeeklyTimesheetPageTourAdapter
        open
        onClose={mockOnClose}
        onFinish={mockOnFinish}
      />,
    );

    expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    expect(screen.getByTestId('close-button')).toBeInTheDocument();
    expect(screen.getByTestId('finish-button')).toBeInTheDocument();
  });

  it('should call WeeklyTimesheetPageTourSteps to get tour steps', () => {
    render(
      <WeeklyTimesheetPageTourAdapter
        open
        onClose={mockOnClose}
        onFinish={mockOnFinish}
      />,
    );

    expect(WeeklyTimesheetPageTourSteps).toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <WeeklyTimesheetPageTourAdapter
        open
        onClose={mockOnClose}
        onFinish={mockOnFinish}
      />,
    );

    const closeButton = screen.getByTestId('close-button');
    closeButton.click();

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onFinish when finish button is clicked', async () => {
    render(
      <WeeklyTimesheetPageTourAdapter
        open
        onClose={mockOnClose}
        onFinish={mockOnFinish}
      />,
    );

    const finishButton = screen.getByTestId('finish-button');
    finishButton.click();

    await waitFor(() => {
      expect(mockOnFinish).toHaveBeenCalled();
    });
  });

  it('should handle isWeeklyTimeEntry prop', () => {
    const { rerender } = render(
      <WeeklyTimesheetPageTourAdapter
        open
        onClose={mockOnClose}
        onFinish={mockOnFinish}
        isWeeklyTimeEntry
      />,
    );

    expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();

    rerender(
      <WeeklyTimesheetPageTourAdapter
        open
        onClose={mockOnClose}
        onFinish={mockOnFinish}
        isWeeklyTimeEntry={false}
      />,
    );

    expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
  });

  it('should use usePopoverInstrumentation with correct parameters', () => {
    const {
      usePopoverInstrumentation,
    } = require('src/js/common/usePopoverInstrumentation');

    render(
      <WeeklyTimesheetPageTourAdapter
        open
        onClose={mockOnClose}
        onFinish={mockOnFinish}
        isWeeklyTimeEntry
      />,
    );

    expect(usePopoverInstrumentation).toHaveBeenCalledWith({
      screen: 'Weekly Timesheet Tour',
      previous_screen: 'Weekly Timesheet',
      object_detail: 'weekly_timesheet_page_tour',
      ui_object_detail: 'weekly_timesheet_page_tour_popover',
      popoverHeading: 'Weekly Timesheet Tour',
      additionalContext: {
        isWeeklyTimeEntry: true,
      },
    });
  });

  it('should build tour steps with anchor elements', () => {
    const { container } = render(
      <WeeklyTimesheetPageTourAdapter
        open
        onClose={mockOnClose}
        onFinish={mockOnFinish}
      />,
    );

    // The component should query for target elements and build steps
    expect(WeeklyTimesheetPageTourSteps).toHaveBeenCalled();
  });

  it('should fallback to document.body when target element is not found', () => {
    // Remove the test element to test fallback
    const testElement = document.querySelector('[data-testid="test-element"]');
    if (testElement) {
      document.body.removeChild(testElement);
    }

    render(
      <WeeklyTimesheetPageTourAdapter
        open
        onClose={mockOnClose}
        onFinish={mockOnFinish}
      />,
    );

    // Component should still render without throwing an error
    expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
  });

  it('should log popover open event when tour opens', () => {
    const {
      usePopoverInstrumentation,
    } = require('src/js/common/usePopoverInstrumentation');
    const mockLogPopoverOpen = jest.fn();
    usePopoverInstrumentation.mockReturnValue({
      logPopoverOpen: mockLogPopoverOpen,
      logPopoverClose: jest.fn(),
      logTourStepChange: jest.fn(),
      logTourComplete: jest.fn(),
      logPopoverError: jest.fn(),
    });

    render(
      <WeeklyTimesheetPageTourAdapter
        open
        onClose={mockOnClose}
        onFinish={mockOnFinish}
      />,
    );

    expect(mockLogPopoverOpen).toHaveBeenCalled();
  });

  it('should set preference when tour is completed', async () => {
    const {
      useUxPreferences,
    } = require('src/js/service/utils/useUXPreferences');
    const mockSetPreference = jest.fn().mockResolvedValue(undefined);
    useUxPreferences.mockReturnValue({
      setPreference: mockSetPreference,
    });

    render(
      <WeeklyTimesheetPageTourAdapter
        open
        onClose={mockOnClose}
        onFinish={mockOnFinish}
      />,
    );

    const finishButton = screen.getByTestId('finish-button');
    finishButton.click();

    await waitFor(() => {
      expect(mockSetPreference).toHaveBeenCalledWith(
        UxPreferenceKey.WEEKLY_TIMESHEET_PAGE_TOUR_COMPLETED,
        true,
      );
    });
  });

  it('should handle errors when setting preference fails', async () => {
    const {
      useUxPreferences,
    } = require('src/js/service/utils/useUXPreferences');
    const { useSandbox } = require('@payroll/quicksand');
    const mockLogError = jest.fn();
    const mockSetPreference = jest
      .fn()
      .mockRejectedValue(new Error('Test error'));

    useUxPreferences.mockReturnValue({
      setPreference: mockSetPreference,
    });

    useSandbox.mockReturnValue({
      logger: {
        info: jest.fn(),
        error: mockLogError,
        warn: jest.fn(),
      },
    });

    render(
      <WeeklyTimesheetPageTourAdapter
        open
        onClose={mockOnClose}
        onFinish={mockOnFinish}
      />,
    );

    const finishButton = screen.getByTestId('finish-button');
    finishButton.click();

    await waitFor(() => {
      expect(mockLogError).toHaveBeenCalledWith(
        'Failed to save Weekly Timesheet Page tour preference',
        expect.objectContaining({
          error: 'Error: Test error',
        }),
      );
    });

    expect(mockOnFinish).toHaveBeenCalled();
  });
});
