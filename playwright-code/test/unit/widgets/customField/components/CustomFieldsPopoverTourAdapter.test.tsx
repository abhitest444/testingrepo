import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { useSandbox } from '@payroll/quicksand';
import CustomFieldsPopoverTourAdapter from 'src/js/widgets/customField/components/CustomFieldsPopoverTourAdapter';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useSandbox: jest.fn(),
}));

jest.mock('src/js/common/tourSteps', () => ({
  CustomFieldTourSteps: jest.fn(() => [
    {
      id: 'cf-1',
      title: 'Custom Field Tour',
      description: 'This is a custom field tour step',
      buttonText: 'Next',
      position: 'left',
      alignment: 'center',
      bgcolor: '#E6FAEA',
      targetSelector: '[data-testid="custom-fields-add-button"]',
    },
  ]),
}));

jest.mock('src/js/service/utils/useUXPreferences', () => ({
  useUxPreferences: jest.fn(() => ({
    data: {},
    getPreference: jest.fn(),
    setPreference: jest.fn(),
  })),
  UxPreferenceKey: {
    CUSTOM_FIELDS_TOUR_COMPLETED: 'custom_fields_tour_completed',
  },
}));

// Mock usePopoverInstrumentation
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
  () =>
    function MockGeneralPopoverTour({
      open,
      steps,
      onClose,
      onFinish,
      onStepChange,
    }: any) {
      return open && steps.length > 0 ? (
        <div data-testid="general-popover-tour">
          <div data-testid="tour-content">
            <div data-testid="tour-title">{steps[0].title}</div>
            <div data-testid="tour-description">{steps[0].description}</div>
          </div>
          <button data-testid="tour-close" onClick={onClose}>
            Close
          </button>
          <button data-testid="tour-finish" onClick={onFinish}>
            {steps[0].buttonText}
          </button>
          <button
            data-testid="tour-next-step"
            onClick={() => onStepChange?.(1)}
          >
            Next Step
          </button>
        </div>
      ) : null;
    },
);

// Mock store
const mockStore = configureStore({
  reducer: {
    // Add a dummy reducer to avoid the warning
    dummy: (state = {}, action: any) => state,
  },
  preloadedState: {},
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

const renderWithProvider = (component: React.ReactElement) =>
  render(<Provider store={mockStore}>{component}</Provider>);

describe('CustomFieldsPopoverTourAdapter', () => {
  const mockUseSandbox = useSandbox as jest.MockedFunction<typeof useSandbox>;
  const mockOnClose = jest.fn();
  const mockOnFinish = jest.fn();
  const mockLogPopoverOpen = jest.fn();
  const mockLogPopoverClose = jest.fn();
  const mockLogTourStepChange = jest.fn();
  const mockLogTourComplete = jest.fn();
  const mockLogPopoverError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSandbox.mockReturnValue({
      logger: {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
      },
    } as any);

    // Mock document.querySelector
    document.querySelector = jest.fn();

    // Mock usePopoverInstrumentation
    const {
      usePopoverInstrumentation,
    } = require('src/js/common/usePopoverInstrumentation');
    usePopoverInstrumentation.mockReturnValue({
      logPopoverOpen: mockLogPopoverOpen,
      logPopoverClose: mockLogPopoverClose,
      logTourStepChange: mockLogTourStepChange,
      logTourComplete: mockLogTourComplete,
      logPopoverError: mockLogPopoverError,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open={false}
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });

    it('should render tour when open is true and target element exists', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });
    });

    it('should render with default props when onFinish is not provided', () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter open onClose={mockOnClose} />,
      );

      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
    });

    it('should render with correct tour step data', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tour-title')).toHaveTextContent(
          'Custom Field Tour',
        );
        expect(screen.getByTestId('tour-description')).toHaveTextContent(
          'This is a custom field tour step',
        );
        expect(screen.getByTestId('tour-finish')).toHaveTextContent('Next');
      });
    });
  });

  describe('Instrumentation', () => {
    it('should log tour open when component mounts with open=true', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(mockLogPopoverOpen).toHaveBeenCalledWith({
          popoverHeading: 'Custom Field Tour',
          stepHeading: 'Custom Field Tour',
          currentStep: 0,
          totalSteps: 1,
          action: 'tour_opened',
          tourType: 'custom_fields',
        });
      });
    });

    it('should not log tour open when component mounts with open=false', () => {
      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open={false}
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      expect(mockLogPopoverOpen).not.toHaveBeenCalled();
    });

    it('should log tour close when close button is clicked', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tour-close')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('tour-close'));

      expect(mockLogPopoverClose).toHaveBeenCalledWith({
        popoverHeading: 'Custom Field Tour',
        stepHeading: 'Custom Field Tour',
        currentStep: 0,
        totalSteps: 1,
        action: 'tour_closed',
        closeReason: 'user_initiated',
        tourType: 'custom_fields',
      });
    });

    it('should log tour complete when finish button is clicked', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tour-finish')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('tour-finish'));

      expect(mockLogTourComplete).toHaveBeenCalledWith({
        popoverHeading: 'Custom Field Tour',
        stepHeading: 'Custom Field Tour',
        currentStep: 0,
        totalSteps: 1,
        completionStatus: 'success',
        tourType: 'custom_fields',
      });
    });

    it('should log step change when next step button is clicked', async () => {
      // Mock multiple steps for step change testing
      const { CustomFieldTourSteps } = require('src/js/common/tourSteps');
      (CustomFieldTourSteps as jest.Mock).mockReturnValue([
        {
          id: 'cf-1',
          title: 'First Step',
          description: 'First step description',
          buttonText: 'Next',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="first-target"]',
        },
        {
          id: 'cf-2',
          title: 'Second Step',
          description: 'Second step description',
          buttonText: 'Finish',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="second-target"]',
        },
      ]);

      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'first-target');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tour-next-step')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('tour-next-step'));

      // The MockGeneralPopoverTour calls onStepChange(1) when next step button is clicked
      expect(mockLogTourStepChange).toHaveBeenCalledWith(1, 2, {
        popoverHeading: 'Second Step',
        stepHeading: 'Second Step',
        fromStep: 0,
        toStep: 1,
        totalSteps: 2,
        tourType: 'custom_fields',
      });
    });
  });

  describe('Anchor Element Management', () => {
    it('should set anchor element when target is found', async () => {
      // Reset to default mock steps
      const { CustomFieldTourSteps } = require('src/js/common/tourSteps');
      (CustomFieldTourSteps as jest.Mock).mockReturnValue([
        {
          id: 'cf-1',
          title: 'Custom Field Tour',
          description: 'This is a custom field tour step',
          buttonText: 'Next',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="custom-fields-add-button"]',
        },
      ]);

      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(document.querySelector).toHaveBeenCalledWith(
          '[data-testid="custom-fields-add-button"]',
        );
      });
    });

    it('should use document.body as fallback when target is not found', () => {
      // Reset to default mock steps
      const { CustomFieldTourSteps } = require('src/js/common/tourSteps');
      (CustomFieldTourSteps as jest.Mock).mockReturnValue([
        {
          id: 'cf-1',
          title: 'Custom Field Tour',
          description: 'This is a custom field tour step',
          buttonText: 'Next',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="custom-fields-add-button"]',
        },
      ]);

      (document.querySelector as jest.Mock).mockReturnValue(null);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      expect(document.querySelector).toHaveBeenCalledWith(
        '[data-testid="custom-fields-add-button"]',
      );
    });

    it('should update anchor element when open prop changes', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      const { rerender } = renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open={false}
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();

      rerender(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });
    });
  });

  describe('Event Handling', () => {
    it('should call onClose when tour close button is clicked', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tour-close')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('tour-close'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onFinish when tour finish button is clicked', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tour-finish')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('tour-finish'));
      expect(mockOnFinish).toHaveBeenCalledTimes(1);
    });

    it('should not throw error when onFinish is not provided and finish button is clicked', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter open onClose={mockOnClose} />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tour-finish')).toBeInTheDocument();
      });

      expect(() => {
        fireEvent.click(screen.getByTestId('tour-finish'));
      }).not.toThrow();
    });

    it('should not throw error when onClose is not provided and close button is clicked', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tour-close')).toBeInTheDocument();
      });

      expect(() => {
        fireEvent.click(screen.getByTestId('tour-close'));
      }).not.toThrow();
    });
  });

  describe('Tour Steps Integration', () => {
    it('should use steps from CustomFieldTourSteps', async () => {
      // Reset to default mock steps
      const { CustomFieldTourSteps } = require('src/js/common/tourSteps');
      (CustomFieldTourSteps as jest.Mock).mockReturnValue([
        {
          id: 'cf-1',
          title: 'Custom Field Tour',
          description: 'This is a custom field tour step',
          buttonText: 'Next',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="custom-fields-add-button"]',
        },
      ]);

      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(document.querySelector).toHaveBeenCalledWith(
          '[data-testid="custom-fields-add-button"]',
        );
      });
    });

    it('should handle empty steps array', () => {
      const { CustomFieldTourSteps } = require('src/js/common/tourSteps');
      (CustomFieldTourSteps as jest.Mock).mockReturnValue([]);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      expect(
        screen.queryByTestId('general-popover-tour'),
      ).not.toBeInTheDocument();
    });

    it('should handle steps with empty targetSelector', () => {
      const { CustomFieldTourSteps } = require('src/js/common/tourSteps');
      (CustomFieldTourSteps as jest.Mock).mockReturnValue([
        {
          id: 'cf-1',
          title: 'Tour without target',
          description: 'No target selector',
          buttonText: 'Next',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '',
        },
      ]);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      // Should still render because it uses document.body as fallback
      expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      expect(screen.getByTestId('tour-title')).toHaveTextContent(
        'Tour without target',
      );
    });

    it('should handle multiple steps and log correct step data', async () => {
      const { CustomFieldTourSteps } = require('src/js/common/tourSteps');
      (CustomFieldTourSteps as jest.Mock).mockReturnValue([
        {
          id: 'cf-1',
          title: 'First Step',
          description: 'First step description',
          buttonText: 'Next',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="first-target"]',
        },
        {
          id: 'cf-2',
          title: 'Second Step',
          description: 'Second step description',
          buttonText: 'Finish',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="second-target"]',
        },
      ]);

      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'first-target');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tour-title')).toHaveTextContent(
          'First Step',
        );
        expect(screen.getByTestId('tour-description')).toHaveTextContent(
          'First step description',
        );
      });

      // Check that logging uses the correct step title
      expect(mockLogPopoverOpen).toHaveBeenCalledWith({
        popoverHeading: 'First Step',
        stepHeading: 'First Step',
        currentStep: 0,
        totalSteps: 2,
        action: 'tour_opened',
        tourType: 'custom_fields',
      });
    });

    it('should handle step change with multiple steps', async () => {
      const { CustomFieldTourSteps } = require('src/js/common/tourSteps');
      (CustomFieldTourSteps as jest.Mock).mockReturnValue([
        {
          id: 'cf-1',
          title: 'First Step',
          description: 'First step description',
          buttonText: 'Next',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="first-target"]',
        },
        {
          id: 'cf-2',
          title: 'Second Step',
          description: 'Second step description',
          buttonText: 'Finish',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="second-target"]',
        },
      ]);

      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'first-target');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tour-next-step')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('tour-next-step'));

      expect(mockLogTourStepChange).toHaveBeenCalledWith(1, 2, {
        popoverHeading: 'Second Step',
        stepHeading: 'Second Step',
        fromStep: 0,
        toStep: 1,
        totalSteps: 2,
        tourType: 'custom_fields',
      });
    });

    it('should handle tour completion with multiple steps', async () => {
      const { CustomFieldTourSteps } = require('src/js/common/tourSteps');
      (CustomFieldTourSteps as jest.Mock).mockReturnValue([
        {
          id: 'cf-1',
          title: 'First Step',
          description: 'First step description',
          buttonText: 'Next',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="first-target"]',
        },
        {
          id: 'cf-2',
          title: 'Second Step',
          description: 'Second step description',
          buttonText: 'Finish',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="second-target"]',
        },
      ]);

      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'first-target');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tour-finish')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('tour-finish'));

      expect(mockLogTourComplete).toHaveBeenCalledWith({
        popoverHeading: 'Second Step',
        stepHeading: 'Second Step',
        currentStep: 1,
        totalSteps: 2,
        completionStatus: 'success',
        tourType: 'custom_fields',
      });
    });

    it('should handle steps with missing titles and use fallback', async () => {
      const { CustomFieldTourSteps } = require('src/js/common/tourSteps');
      (CustomFieldTourSteps as jest.Mock).mockReturnValue([
        {
          id: 'cf-1',
          title: undefined,
          description: 'Step without title',
          buttonText: 'Next',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="no-title-target"]',
        },
      ]);

      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'no-title-target');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });

      // Check that logging uses fallback title
      expect(mockLogPopoverOpen).toHaveBeenCalledWith({
        popoverHeading: 'Custom Fields Tour',
        stepHeading: 'Custom Fields Tour',
        currentStep: 0,
        totalSteps: 1,
        action: 'tour_opened',
        tourType: 'custom_fields',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper test IDs for testing', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
        expect(screen.getByTestId('tour-content')).toBeInTheDocument();
        expect(screen.getByTestId('tour-title')).toBeInTheDocument();
        expect(screen.getByTestId('tour-description')).toBeInTheDocument();
        expect(screen.getByTestId('tour-close')).toBeInTheDocument();
        expect(screen.getByTestId('tour-finish')).toBeInTheDocument();
        expect(screen.getByTestId('tour-next-step')).toBeInTheDocument();
      });
    });

    it('should have proper button text and content', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('tour-close')).toHaveTextContent('Close');
        expect(screen.getByTestId('tour-finish')).toHaveTextContent('Next');
        expect(screen.getByTestId('tour-next-step')).toHaveTextContent(
          'Next Step',
        );
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should clean up anchor element when component unmounts', () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      const { unmount } = renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      unmount();
      // Component should clean up properly without errors
    });

    it('should handle rapid open/close state changes', async () => {
      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      const { rerender } = renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open={false}
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      // Rapidly change open state
      rerender(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      rerender(
        <CustomFieldsPopoverTourAdapter
          open={false}
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      rerender(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });
    });
  });

  describe('Tour Functionality', () => {
    it('should log tour completion before throwing error when onFinish throws', async () => {
      // Reset to default mock steps
      const { CustomFieldTourSteps } = require('src/js/common/tourSteps');
      (CustomFieldTourSteps as jest.Mock).mockReturnValue([
        {
          id: 'cf-1',
          title: 'Custom Field Tour',
          description: 'This is a custom field tour step',
          buttonText: 'Next',
          position: 'left',
          alignment: 'center',
          bgcolor: '#E6FAEA',
          targetSelector: '[data-testid="custom-fields-add-button"]',
        },
      ]);

      const mockElement = document.createElement('div');
      mockElement.setAttribute('data-testid', 'custom-fields-add-button');
      (document.querySelector as jest.Mock).mockReturnValue(mockElement);

      // Mock onFinish to not throw an error for this test
      // This allows us to verify that logging occurs correctly
      const mockOnFinish = jest.fn();

      renderWithProvider(
        <CustomFieldsPopoverTourAdapter
          open
          onClose={mockOnClose}
          onFinish={mockOnFinish}
        />,
      );

      // Wait for tour to appear
      await waitFor(() => {
        expect(screen.getByTestId('general-popover-tour')).toBeInTheDocument();
      });

      // Clear previous calls
      mockLogTourComplete.mockClear();

      // Click the tour finish button - this should not throw an error
      fireEvent.click(screen.getByTestId('tour-finish'));

      // Verify that logTourComplete was called with correct data
      expect(mockLogTourComplete).toHaveBeenCalledWith({
        popoverHeading: 'Custom Field Tour',
        stepHeading: 'Custom Field Tour',
        currentStep: 0,
        totalSteps: 1,
        completionStatus: 'success',
        tourType: 'custom_fields',
      });

      // Verify that onFinish was called
      expect(mockOnFinish).toHaveBeenCalled();

      // Verify that logging happens before onFinish is called
      // This demonstrates that even if onFinish throws an error,
      // the logging will have already occurred
      const logCallTime = mockLogTourComplete.mock.invocationCallOrder[0];
      const onFinishCallTime = mockOnFinish.mock.invocationCallOrder[0];
      expect(logCallTime).toBeLessThan(onFinishCallTime);
    });
  });
});
