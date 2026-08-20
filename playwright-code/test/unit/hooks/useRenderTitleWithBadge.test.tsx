import React from 'react';
import { render, screen } from '@testing-library/react';
import { useIntl } from '@payroll/quicksand';
import {
  renderTitleWithBadge,
  useRenderTitleWithBadge,
} from 'src/js/hooks/useRenderTitleWithBadge';

// Mock dependencies
jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(),
}));

jest.mock(
  '@ids-ts/badge',
  () =>
    function MockBadge({ children, ...props }: any) {
      return (
        <span data-testid="badge" data-props={JSON.stringify(props)}>
          {children}
        </span>
      );
    },
);

jest.mock('dayjs', () =>
  jest.fn().mockImplementation((input?: any) => ({
    isValid: jest.fn().mockReturnValue(true),
    isBefore: jest.fn().mockReturnValue(false),
  })),
);

// Test component for hook testing
const TestComponent = ({
  title,
  isNew,
  isNewVisibleTill,
}: {
  title: string;
  isNew?: boolean;
  isNewVisibleTill?: string;
}) => {
  const result = useRenderTitleWithBadge(title, isNew, isNewVisibleTill);
  return <div data-testid="result">{result}</div>;
};

describe('titleBadgeUtils', () => {
  const mockIntl = {
    formatMessage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useIntl as jest.Mock).mockReturnValue(mockIntl);
    mockIntl.formatMessage.mockImplementation(
      ({ id }: { id: string }) => `formatted_${id}`,
    );
  });

  describe('renderTitleWithBadge', () => {
    describe('when shouldShowNewBadge is false', () => {
      it('should return formatted title when isNew is false', () => {
        const result = renderTitleWithBadge({
          title: 'test.title',
          isNew: false,
          isNewVisibleTill: '2024-12-31',
          intl: mockIntl,
        });

        expect(result).toBe('formatted_test.title');
        expect(mockIntl.formatMessage).toHaveBeenCalledWith({
          id: 'test.title',
        });
        expect(mockIntl.formatMessage).toHaveBeenCalledTimes(1);
      });

      it('should return formatted title when isNew is undefined', () => {
        const result = renderTitleWithBadge({
          title: 'test.title',
          intl: mockIntl,
        });

        expect(result).toBe('formatted_test.title');
        expect(mockIntl.formatMessage).toHaveBeenCalledWith({
          id: 'test.title',
        });
      });

      it('should return formatted title when isNewVisibleTill is empty', () => {
        const result = renderTitleWithBadge({
          title: 'test.title',
          isNew: true,
          isNewVisibleTill: '',
          intl: mockIntl,
        });

        expect(result).toBe('formatted_test.title');
        expect(mockIntl.formatMessage).toHaveBeenCalledWith({
          id: 'test.title',
        });
      });

      it('should return formatted title when isNewVisibleTill is undefined', () => {
        const result = renderTitleWithBadge({
          title: 'test.title',
          isNew: true,
          intl: mockIntl,
        });

        expect(result).toBe('formatted_test.title');
        expect(mockIntl.formatMessage).toHaveBeenCalledWith({
          id: 'test.title',
        });
      });
    });

    describe('when shouldShowNewBadge is true', () => {
      beforeEach(() => {
        // Mock dayjs to return objects that make the badge visible
        const dayjs = require('dayjs');
        dayjs.mockImplementation((input?: any) => ({
          isValid: jest.fn().mockReturnValue(true),
          isBefore: jest.fn().mockReturnValue(input === undefined),
        }));
      });

      it('should return JSX with title and badge when all conditions are met', () => {
        const result = renderTitleWithBadge({
          title: 'test.title',
          isNew: true,
          isNewVisibleTill: '2025-12-31',
          intl: mockIntl,
        });

        // Should return JSX element
        expect(React.isValidElement(result)).toBe(true);

        // Render the result to test its content
        render(<div>{result}</div>);

        expect(screen.getByText('formatted_test.title')).toBeInTheDocument();
        expect(screen.getByTestId('badge')).toBeInTheDocument();
        expect(screen.getByText('formatted_new')).toBeInTheDocument();

        // Check if formatMessage was called for both title and "new"
        expect(mockIntl.formatMessage).toHaveBeenCalledWith({
          id: 'test.title',
        });
        expect(mockIntl.formatMessage).toHaveBeenCalledWith({
          id: 'new',
          defaultMessage: 'New',
        });
        expect(mockIntl.formatMessage).toHaveBeenCalledTimes(2);
      });

      it('should render badge with correct props', () => {
        const result = renderTitleWithBadge({
          title: 'test.title',
          isNew: true,
          isNewVisibleTill: '2025-12-31',
          intl: mockIntl,
        });

        render(<div>{result}</div>);

        const badge = screen.getByTestId('badge');
        const badgeProps = JSON.parse(badge.getAttribute('data-props') || '{}');

        expect(badgeProps).toEqual({
          capitalization: 'sentence',
          priority: 'secondary',
          status: 'new',
        });
      });

      it('should handle different title values correctly', () => {
        const result = renderTitleWithBadge({
          title: 'different.message.id',
          isNew: true,
          isNewVisibleTill: '2025-12-31',
          intl: mockIntl,
        });

        render(<div>{result}</div>);

        expect(
          screen.getByText('formatted_different.message.id'),
        ).toBeInTheDocument();
        expect(mockIntl.formatMessage).toHaveBeenCalledWith({
          id: 'different.message.id',
        });
      });
    });

    describe('edge cases and boundary conditions', () => {
      it('should handle null title', () => {
        const result = renderTitleWithBadge({
          title: null as any,
          isNew: false,
          intl: mockIntl,
        });

        expect(mockIntl.formatMessage).toHaveBeenCalledWith({ id: null });
        expect(result).toBe('formatted_null');
      });

      it('should handle empty string title', () => {
        const result = renderTitleWithBadge({
          title: '',
          isNew: false,
          intl: mockIntl,
        });

        expect(mockIntl.formatMessage).toHaveBeenCalledWith({ id: '' });
        expect(result).toBe('formatted_');
      });

      it('should handle invalid dates', () => {
        const dayjs = require('dayjs');
        dayjs.mockImplementation(() => ({
          isValid: jest.fn().mockReturnValue(false),
          isBefore: jest.fn().mockReturnValue(false),
        }));

        const result = renderTitleWithBadge({
          title: 'test.title',
          isNew: true,
          isNewVisibleTill: 'invalid-date',
          intl: mockIntl,
        });

        expect(result).toBe('formatted_test.title');
        expect(mockIntl.formatMessage).toHaveBeenCalledWith({
          id: 'test.title',
        });
      });

      it('should handle past dates correctly', () => {
        const dayjs = require('dayjs');
        dayjs.mockImplementation((input?: any) => ({
          isValid: jest.fn().mockReturnValue(true),
          isBefore: jest.fn().mockReturnValue(false), // Current date is NOT before visible till date
        }));

        const result = renderTitleWithBadge({
          title: 'test.title',
          isNew: true,
          isNewVisibleTill: '2020-01-01',
          intl: mockIntl,
        });

        expect(result).toBe('formatted_test.title');
      });

      it('should handle malformed date strings', () => {
        const dayjs = require('dayjs');
        dayjs.mockImplementation(() => ({
          isValid: jest.fn().mockReturnValue(false),
          isBefore: jest.fn().mockReturnValue(false),
        }));

        const malformedDates = ['not-a-date', '2024-13-45', 'abc-def-ghi', ''];

        malformedDates.forEach((date) => {
          const result = renderTitleWithBadge({
            title: 'test.title',
            isNew: true,
            isNewVisibleTill: date,
            intl: mockIntl,
          });

          expect(result).toBe('formatted_test.title');
        });
      });
    });

    describe('intl parameter handling', () => {
      it('should handle intl with custom formatMessage behavior', () => {
        const customIntl = {
          formatMessage: jest
            .fn()
            .mockImplementation(({ id }) => `custom_${id.toUpperCase()}`),
        };

        const result = renderTitleWithBadge({
          title: 'test.title',
          isNew: false,
          intl: customIntl,
        });

        expect(result).toBe('custom_TEST.TITLE');
        expect(customIntl.formatMessage).toHaveBeenCalledWith({
          id: 'test.title',
        });
      });

      it('should handle intl formatMessage throwing error', () => {
        const errorIntl = {
          formatMessage: jest.fn().mockImplementation(() => {
            throw new Error('Formatting error');
          }),
        };

        expect(() => {
          renderTitleWithBadge({
            title: 'test.title',
            isNew: false,
            intl: errorIntl,
          });
        }).toThrow('Formatting error');
      });
    });

    describe('styled component structure', () => {
      beforeEach(() => {
        const dayjs = require('dayjs');
        dayjs.mockImplementation((input?: any) => ({
          isValid: jest.fn().mockReturnValue(true),
          isBefore: jest.fn().mockReturnValue(input === undefined),
        }));
      });

      it('should render StyledTitle with correct structure', () => {
        const result = renderTitleWithBadge({
          title: 'test.title',
          isNew: true,
          isNewVisibleTill: '2025-12-31',
          intl: mockIntl,
        });

        const { container } = render(<div>{result}</div>);

        // Check that the StyledTitle div contains both span and badge
        const styledDiv = container.querySelector('div > div');
        expect(styledDiv).toBeInTheDocument();

        const span = styledDiv?.querySelector('span');
        const badge = styledDiv?.querySelector('[data-testid="badge"]');

        expect(span).toBeInTheDocument();
        expect(badge).toBeInTheDocument();
        expect(span).toHaveTextContent('formatted_test.title');
        expect(badge).toHaveTextContent('formatted_new');
      });
    });
  });

  describe('useRenderTitleWithBadge', () => {
    it('should call renderTitleWithBadge with intl from useIntl hook', () => {
      render(
        <TestComponent
          title="test.title"
          isNew={false}
          isNewVisibleTill="2024-12-31"
        />,
      );

      expect(useIntl).toHaveBeenCalled();
      expect(screen.getByTestId('result')).toHaveTextContent(
        'formatted_test.title',
      );
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({ id: 'test.title' });
    });

    it('should work with badge when conditions are met', () => {
      const dayjs = require('dayjs');
      dayjs.mockImplementation((input?: any) => ({
        isValid: jest.fn().mockReturnValue(true),
        isBefore: jest.fn().mockReturnValue(input === undefined),
      }));

      render(
        <TestComponent
          title="test.title"
          isNew
          isNewVisibleTill="2025-12-31"
        />,
      );

      expect(screen.getByText('formatted_test.title')).toBeInTheDocument();
      expect(screen.getByTestId('badge')).toBeInTheDocument();
      expect(screen.getByText('formatted_new')).toBeInTheDocument();
    });

    it('should handle optional parameters correctly', () => {
      render(<TestComponent title="test.title" />);

      expect(screen.getByTestId('result')).toHaveTextContent(
        'formatted_test.title',
      );
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({ id: 'test.title' });
    });

    it('should handle isNew without isNewVisibleTill', () => {
      render(<TestComponent title="test.title" isNew />);

      expect(screen.getByTestId('result')).toHaveTextContent(
        'formatted_test.title',
      );
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({ id: 'test.title' });
    });

    it('should handle isNewVisibleTill without isNew', () => {
      render(
        <TestComponent title="test.title" isNewVisibleTill="2025-12-31" />,
      );

      expect(screen.getByTestId('result')).toHaveTextContent(
        'formatted_test.title',
      );
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({ id: 'test.title' });
    });

    it('should re-render when props change', () => {
      const { rerender } = render(
        <TestComponent title="test.title" isNew={false} />,
      );

      expect(screen.getByTestId('result')).toHaveTextContent(
        'formatted_test.title',
      );

      // Mock conditions for showing badge
      const dayjs = require('dayjs');
      dayjs.mockImplementation((input?: any) => ({
        isValid: jest.fn().mockReturnValue(true),
        isBefore: jest.fn().mockReturnValue(input === undefined),
      }));

      rerender(
        <TestComponent
          title="test.title"
          isNew
          isNewVisibleTill="2025-12-31"
        />,
      );

      expect(screen.getByText('formatted_test.title')).toBeInTheDocument();
      expect(screen.getByTestId('badge')).toBeInTheDocument();
    });

    describe('hook behavior with different useIntl scenarios', () => {
      it('should handle useIntl returning null', () => {
        (useIntl as jest.Mock).mockReturnValue(null);

        expect(() => {
          render(<TestComponent title="test.title" />);
        }).toThrow();
      });

      it('should handle useIntl returning different intl object', () => {
        const differentIntl = {
          formatMessage: jest
            .fn()
            .mockImplementation(({ id }) => `different_${id}`),
        };
        (useIntl as jest.Mock).mockReturnValue(differentIntl);

        render(<TestComponent title="test.title" />);

        expect(screen.getByTestId('result')).toHaveTextContent(
          'different_test.title',
        );
        expect(differentIntl.formatMessage).toHaveBeenCalledWith({
          id: 'test.title',
        });
      });
    });
  });

  describe('dayjs integration', () => {
    it('should call dayjs with correct parameters', () => {
      const dayjs = require('dayjs');
      dayjs.mockImplementation((input?: any) => ({
        isValid: jest.fn().mockReturnValue(true),
        isBefore: jest.fn().mockReturnValue(input === undefined),
      }));

      renderTitleWithBadge({
        title: 'test.title',
        isNew: true,
        isNewVisibleTill: '2025-12-31',
        intl: mockIntl,
      });

      expect(dayjs).toHaveBeenCalledWith('2025-12-31');
      expect(dayjs).toHaveBeenCalledWith();
    });

    it('should handle dayjs throwing exceptions', () => {
      const dayjs = require('dayjs');
      dayjs.mockImplementation(() => {
        throw new Error('dayjs error');
      });

      expect(() => {
        renderTitleWithBadge({
          title: 'test.title',
          isNew: true,
          isNewVisibleTill: '2025-12-31',
          intl: mockIntl,
        });
      }).toThrow('dayjs error');
    });
  });

  describe('complete integration tests', () => {
    it('should handle the complete flow from hook to render with badge', () => {
      const dayjs = require('dayjs');
      dayjs.mockImplementation((input?: any) => ({
        isValid: jest.fn().mockReturnValue(true),
        isBefore: jest.fn().mockReturnValue(input === undefined),
      }));

      render(
        <TestComponent
          title="integration.test.title"
          isNew
          isNewVisibleTill="2025-06-15T10:30:00Z"
        />,
      );

      // Verify useIntl was called
      expect(useIntl).toHaveBeenCalled();

      // Verify dayjs was called correctly
      expect(dayjs).toHaveBeenCalledWith('2025-06-15T10:30:00Z');
      expect(dayjs).toHaveBeenCalledWith();

      // Verify intl formatMessage was called for both title and badge
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'integration.test.title',
      });
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'new',
        defaultMessage: 'New',
      });

      // Verify rendered output
      expect(
        screen.getByText('formatted_integration.test.title'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('badge')).toBeInTheDocument();
      expect(screen.getByText('formatted_new')).toBeInTheDocument();
    });

    it('should handle the complete flow from hook to render without badge', () => {
      render(
        <TestComponent
          title="integration.test.title"
          isNew={false}
          isNewVisibleTill="2025-06-15T10:30:00Z"
        />,
      );

      // Verify useIntl was called
      expect(useIntl).toHaveBeenCalled();

      // Verify intl formatMessage was called only for title
      expect(mockIntl.formatMessage).toHaveBeenCalledWith({
        id: 'integration.test.title',
      });
      expect(mockIntl.formatMessage).toHaveBeenCalledTimes(1);

      // Verify rendered output
      expect(screen.getByTestId('result')).toHaveTextContent(
        'formatted_integration.test.title',
      );
      expect(screen.queryByTestId('badge')).not.toBeInTheDocument();
    });
  });

  describe('badge visibility conditions - comprehensive coverage', () => {
    const testCases = [
      {
        description: 'should not show badge when isNew is false',
        isNew: false,
        isNewVisibleTill: '2025-12-31',
        expected: false,
      },
      {
        description: 'should not show badge when isNew is undefined',
        isNew: undefined,
        isNewVisibleTill: '2025-12-31',
        expected: false,
      },
      {
        description:
          'should not show badge when isNewVisibleTill is empty string',
        isNew: true,
        isNewVisibleTill: '',
        expected: false,
      },
      {
        description: 'should not show badge when isNewVisibleTill is undefined',
        isNew: true,
        isNewVisibleTill: undefined,
        expected: false,
      },
      {
        description: 'should show badge when all conditions are met',
        isNew: true,
        isNewVisibleTill: '2025-12-31',
        expected: true,
        setupMock: () => {
          const dayjs = require('dayjs');
          dayjs.mockImplementation((input?: any) => ({
            isValid: jest.fn().mockReturnValue(true),
            isBefore: jest.fn().mockReturnValue(input === undefined),
          }));
        },
      },
    ];

    testCases.forEach(
      ({ description, isNew, isNewVisibleTill, expected, setupMock }) => {
        it(description, () => {
          if (setupMock) {
            setupMock();
          }

          const result = renderTitleWithBadge({
            title: 'test.title',
            isNew,
            isNewVisibleTill,
            intl: mockIntl,
          });

          if (expected) {
            expect(React.isValidElement(result)).toBe(true);
            render(<div>{result}</div>);
            expect(screen.getByTestId('badge')).toBeInTheDocument();
          } else {
            expect(typeof result).toBe('string');
            expect(result).toBe('formatted_test.title');
          }
        });
      },
    );
  });
});
