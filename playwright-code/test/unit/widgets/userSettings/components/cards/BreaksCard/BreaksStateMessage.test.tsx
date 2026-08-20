// @ts-nocheck
/**
 * BreaksStateMessage Component Tests
 *
 * Tests for the BreaksStateMessage component that displays
 * different state messages (empty, error, etc.) in the Breaks Card.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import BreaksStateMessage from 'src/js/widgets/userSettings/components/cards/BreaksCard/components/BreaksStateMessage';

// Mock @payroll/quicksand
jest.mock('@payroll/quicksand', () => ({
  useIntl: () => ({
    formatMessage: ({ id }) => {
      const messages = {
        'breaks.empty.state.message':
          'Assign break rules in Time settings to help you and your team track break times accurately.',
        'breaks.card.error.state.message':
          'Something went wrong. Please try again later',
      };
      return messages[id] || id;
    },
  }),
}));

// Mock @design-systems/icons
jest.mock('@design-systems/icons', () => ({
  CoffeeMug: () => <span data-testid="coffee-mug-icon">CoffeeMug</span>,
  CircleAlertQuickbooks: () => (
    <span data-testid="alert-icon">CircleAlertQuickbooks</span>
  ),
}));

// Mock @ids-ts/icon-container
jest.mock('@ids-ts/icon-container', () => ({
  IconContainer: ({ source: Icon, description }) => (
    <div data-testid="icon-container">
      <Icon />
    </div>
  ),
}));

// Mock the styles
jest.mock(
  'src/js/widgets/userSettings/components/cards/BreaksCard/styles',
  () => ({
    StateMessageContainer: ({ children, 'data-testid': dataTestId }) => (
      <div data-testid={dataTestId}>{children}</div>
    ),
    StateMessageText: ({ children }) => (
      <div data-testid="state-message-text">{children}</div>
    ),
  }),
);

describe('BreaksStateMessage', () => {
  const CoffeeMugIcon = () => (
    <span data-testid="coffee-mug-icon">CoffeeMug</span>
  );
  const AlertIcon = () => (
    <span data-testid="alert-icon">CircleAlertQuickbooks</span>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    test('renders without crashing with empty state props', () => {
      expect(() => {
        render(
          <BreaksStateMessage
            icon={CoffeeMugIcon}
            messageId="breaks.empty.state.message"
            testId="breaks-empty-state"
          />,
        );
      }).not.toThrow();
    });

    test('renders without crashing with error state props', () => {
      expect(() => {
        render(
          <BreaksStateMessage
            icon={AlertIcon}
            messageId="breaks.card.error.state.message"
            testId="breaks-error-state"
          />,
        );
      }).not.toThrow();
    });

    test('renders and matches snapshot for empty state', () => {
      const componentOutput = render(
        <BreaksStateMessage
          icon={CoffeeMugIcon}
          messageId="breaks.empty.state.message"
          testId="breaks-empty-state"
        />,
      );
      expect(componentOutput).toMatchSnapshot();
    });

    test('renders and matches snapshot for error state', () => {
      const componentOutput = render(
        <BreaksStateMessage
          icon={AlertIcon}
          messageId="breaks.card.error.state.message"
          testId="breaks-error-state"
        />,
      );
      expect(componentOutput).toMatchSnapshot();
    });
  });

  describe('Empty State Rendering', () => {
    const renderEmptyState = () =>
      render(
        <BreaksStateMessage
          icon={CoffeeMugIcon}
          messageId="breaks.empty.state.message"
          testId="breaks-empty-state"
        />,
      );

    test('should render the state message container with correct testId', () => {
      renderEmptyState();
      expect(screen.getByTestId('breaks-empty-state')).toBeInTheDocument();
    });

    test('should render the coffee mug icon', () => {
      renderEmptyState();
      expect(screen.getByTestId('coffee-mug-icon')).toBeInTheDocument();
    });

    test('should render the icon container', () => {
      renderEmptyState();
      expect(screen.getByTestId('icon-container')).toBeInTheDocument();
    });

    test('should render the empty state message', () => {
      renderEmptyState();
      expect(
        screen.getByText(
          'Assign break rules in Time settings to help you and your team track break times accurately.',
        ),
      ).toBeInTheDocument();
    });

    test('should render the text container', () => {
      renderEmptyState();
      expect(screen.getByTestId('state-message-text')).toBeInTheDocument();
    });

    test('text container should contain the message', () => {
      renderEmptyState();
      const textContainer = screen.getByTestId('state-message-text');
      expect(textContainer).toHaveTextContent(
        'Assign break rules in Time settings to help you and your team track break times accurately.',
      );
    });
  });

  describe('Error State Rendering', () => {
    const renderErrorState = () =>
      render(
        <BreaksStateMessage
          icon={AlertIcon}
          messageId="breaks.card.error.state.message"
          testId="breaks-error-state"
        />,
      );

    test('should render the state message container with correct testId', () => {
      renderErrorState();
      expect(screen.getByTestId('breaks-error-state')).toBeInTheDocument();
    });

    test('should render the alert icon', () => {
      renderErrorState();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    test('should render the icon container', () => {
      renderErrorState();
      expect(screen.getByTestId('icon-container')).toBeInTheDocument();
    });

    test('should render the error state message', () => {
      renderErrorState();
      expect(
        screen.getByText('Something went wrong. Please try again later'),
      ).toBeInTheDocument();
    });

    test('should render the text container', () => {
      renderErrorState();
      expect(screen.getByTestId('state-message-text')).toBeInTheDocument();
    });

    test('text container should contain the error message', () => {
      renderErrorState();
      const textContainer = screen.getByTestId('state-message-text');
      expect(textContainer).toHaveTextContent(
        'Something went wrong. Please try again later',
      );
    });
  });

  describe('Component Props', () => {
    test('should use the provided icon', () => {
      render(
        <BreaksStateMessage
          icon={CoffeeMugIcon}
          messageId="breaks.empty.state.message"
          testId="breaks-empty-state"
        />,
      );
      expect(screen.getByTestId('coffee-mug-icon')).toBeInTheDocument();
    });

    test('should use the provided messageId', () => {
      render(
        <BreaksStateMessage
          icon={AlertIcon}
          messageId="breaks.card.error.state.message"
          testId="breaks-error-state"
        />,
      );
      expect(
        screen.getByText('Something went wrong. Please try again later'),
      ).toBeInTheDocument();
    });

    test('should use the provided testId', () => {
      render(
        <BreaksStateMessage
          icon={CoffeeMugIcon}
          messageId="breaks.empty.state.message"
          testId="custom-test-id"
        />,
      );
      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    test('handles component unmounting without errors', () => {
      const { unmount } = render(
        <BreaksStateMessage
          icon={CoffeeMugIcon}
          messageId="breaks.empty.state.message"
          testId="breaks-empty-state"
        />,
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});
