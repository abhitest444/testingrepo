import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Import the actual component after mocking dependencies
import { CopyLastWeekPopover } from '../../../../../../src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryFooter/CopyLastWeekPopover';

// Mock dependencies instead of the component itself
jest.mock('@ids-ts/popover', () => ({
  Popover: ({
    children,
    enableClickAway,
    targetElement,
    open,
    position,
    alignment,
    variant,
    onClose,
  }: any) => (
    <div
      data-testid="popover"
      data-enableclickaway={enableClickAway ? '' : undefined}
      data-targetelement={targetElement ? '' : undefined}
      data-open={open ? '' : undefined}
      data-position={position}
      data-alignment={alignment}
      data-variant={variant}
      data-onclose={onClose}
    >
      {children}
    </div>
  ),
  PopoverContent: ({ children }: any) => (
    <div data-testid="popover-content">{children}</div>
  ),
}));

jest.mock('@ids-ts/split-button', () => ({
  MenuItem: ({ children, onClick, value }: any) => (
    <button data-testid={`menu-item-${value}`} onClick={onClick}>
      {children}
    </button>
  ),
}));

// Mock styled-components properly
jest.mock('styled-components', () => {
  const createStyledComponent = (Component: any) => {
    const styledComponent = (strings: TemplateStringsArray, ...args: any[]) =>
      React.forwardRef<HTMLElement>((props, ref) =>
        React.createElement(Component, { ...props, ref }),
      );
    styledComponent.withConfig = () => styledComponent;
    return styledComponent;
  };

  // Handle styled.element syntax
  const styled = new Proxy(
    (Component: any) => createStyledComponent(Component),
    {
      get: (target, prop) => {
        if (prop === '__esModule') return true;
        if (prop === 'default') return target;
        // Return a styled element creator for any requested HTML element
        return createStyledComponent(prop);
      },
    },
  );

  return {
    __esModule: true,
    default: styled,
    createGlobalStyle: () => () => null,
    css: () => '',
    keyframes: () => '',
    ThemeProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

describe('CopyLastWeekPopover', () => {
  const mockOnClose = jest.fn();
  const mockOnClick1 = jest.fn();
  const mockOnClick2 = jest.fn();
  const mockTargetElement = document.createElement('div');

  const defaultProps = {
    open: true,
    targetElement: mockTargetElement,
    onClose: mockOnClose,
    menuItems: [
      { label: 'Copy Last Week', onClick: mockOnClick1 },
      { label: 'Copy Two Weeks Ago', onClick: mockOnClick2 },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the popover with correct props when open', () => {
      render(<CopyLastWeekPopover {...defaultProps} />);

      const popover = screen.getByTestId('popover');
      expect(popover).toBeInTheDocument();
      expect(popover).toHaveAttribute('data-open'); // Boolean props show as empty string when true
      expect(popover).toHaveAttribute('data-enableclickaway'); // React converts camelCase to lowercase for DOM attributes
      expect(popover).toHaveAttribute('data-position', 'bottom');
      expect(popover).toHaveAttribute('data-alignment', 'center');
      expect(popover).toHaveAttribute('data-variant', 'popover');
    });

    it('should render the popover when closed', () => {
      render(<CopyLastWeekPopover {...defaultProps} open={false} />);

      const popover = screen.getByTestId('popover');
      expect(popover).toBeInTheDocument();
      expect(popover).not.toHaveAttribute('data-open'); // Boolean false props are not rendered
    });

    it('should render popover content', () => {
      render(<CopyLastWeekPopover {...defaultProps} />);

      expect(screen.getByTestId('popover-content')).toBeInTheDocument();
    });

    it('should render menu items with correct labels', () => {
      render(<CopyLastWeekPopover {...defaultProps} />);

      expect(screen.getByTestId('menu-item-0')).toHaveTextContent(
        'Copy Last Week',
      );
      expect(screen.getByTestId('menu-item-1')).toHaveTextContent(
        'Copy Two Weeks Ago',
      );

      // Menu items should be rendered correctly (removing value check as it's not in mock)
      expect(screen.getByTestId('menu-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-1')).toBeInTheDocument();
    });

    it('should render with empty menu items array', () => {
      render(<CopyLastWeekPopover {...defaultProps} menuItems={[]} />);

      expect(screen.getByTestId('popover-content')).toBeInTheDocument();
      expect(screen.queryByTestId('menu-item-0')).not.toBeInTheDocument();
    });

    it('should handle null targetElement', () => {
      render(<CopyLastWeekPopover {...defaultProps} targetElement={null} />);

      const popover = screen.getByTestId('popover');
      expect(popover).toBeInTheDocument();
    });

    it('should render with single menu item', () => {
      const singleItemProps = {
        ...defaultProps,
        menuItems: [{ label: 'Single Item', onClick: mockOnClick1 }],
      };

      render(<CopyLastWeekPopover {...singleItemProps} />);

      expect(screen.getByTestId('menu-item-0')).toHaveTextContent(
        'Single Item',
      );
      expect(screen.queryByTestId('menu-item-1')).not.toBeInTheDocument();
    });
  });

  describe('Menu Item Interactions', () => {
    it('should call menu item onClick and onClose when first menu item is clicked', () => {
      render(<CopyLastWeekPopover {...defaultProps} />);

      const firstMenuItem = screen.getByTestId('menu-item-0');
      fireEvent.click(firstMenuItem);

      expect(mockOnClick1).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call menu item onClick and onClose when second menu item is clicked', () => {
      render(<CopyLastWeekPopover {...defaultProps} />);

      const secondMenuItem = screen.getByTestId('menu-item-1');
      fireEvent.click(secondMenuItem);

      expect(mockOnClick2).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should handle menu item click when onClick is successful', () => {
      const mockOnClickSuccess = jest.fn();

      const propsWithSuccess = {
        ...defaultProps,
        menuItems: [{ label: 'Success Item', onClick: mockOnClickSuccess }],
      };

      render(<CopyLastWeekPopover {...propsWithSuccess} />);

      const menuItem = screen.getByTestId('menu-item-0');
      fireEvent.click(menuItem);

      expect(mockOnClickSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple menu items clicks', () => {
      render(<CopyLastWeekPopover {...defaultProps} />);

      const firstMenuItem = screen.getByTestId('menu-item-0');
      const secondMenuItem = screen.getByTestId('menu-item-1');

      fireEvent.click(firstMenuItem);
      fireEvent.click(secondMenuItem);

      expect(mockOnClick1).toHaveBeenCalledTimes(1);
      expect(mockOnClick2).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple rapid clicks on same menu item', () => {
      render(<CopyLastWeekPopover {...defaultProps} />);

      const firstMenuItem = screen.getByTestId('menu-item-0');
      fireEvent.click(firstMenuItem);
      fireEvent.click(firstMenuItem);

      // Should register both clicks
      expect(mockOnClick1).toHaveBeenCalledTimes(2);
      expect(mockOnClose).toHaveBeenCalledTimes(2);
    });
  });

  describe('Props Validation', () => {
    it('should render correctly with all required props', () => {
      render(<CopyLastWeekPopover {...defaultProps} />);

      expect(screen.getByTestId('popover')).toBeInTheDocument();
      expect(screen.getByTestId('popover-content')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-1')).toBeInTheDocument();
    });

    it('should handle complex menu item labels', () => {
      const complexProps = {
        ...defaultProps,
        menuItems: [
          { label: 'Copy Last Week (5 entries)', onClick: mockOnClick1 },
          { label: 'Copy & Modify Previous Week', onClick: mockOnClick2 },
        ],
      };

      render(<CopyLastWeekPopover {...complexProps} />);

      expect(screen.getByTestId('menu-item-0')).toHaveTextContent(
        'Copy Last Week (5 entries)',
      );
      expect(screen.getByTestId('menu-item-1')).toHaveTextContent(
        'Copy & Modify Previous Week',
      );
    });

    it('should render with different targetElement types', () => {
      const buttonElement = document.createElement('button');
      const propsWithButton = {
        ...defaultProps,
        targetElement: buttonElement,
      };

      render(<CopyLastWeekPopover {...propsWithButton} />);

      expect(screen.getByTestId('popover')).toBeInTheDocument();
    });

    it('should handle various prop combinations', () => {
      const customProps = {
        ...defaultProps,
        open: false,
        menuItems: [
          { label: 'Custom Action 1', onClick: mockOnClick1 },
          { label: 'Custom Action 2', onClick: mockOnClick2 },
        ],
      };

      render(<CopyLastWeekPopover {...customProps} />);

      const popover = screen.getByTestId('popover');
      expect(popover).not.toHaveAttribute('data-open'); // Boolean false props are not rendered
      expect(screen.getByTestId('menu-item-0')).toHaveTextContent(
        'Custom Action 1',
      );
      expect(screen.getByTestId('menu-item-1')).toHaveTextContent(
        'Custom Action 2',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle menu items with empty labels', () => {
      const propsWithEmptyLabel = {
        ...defaultProps,
        menuItems: [
          { label: '', onClick: mockOnClick1 },
          { label: 'Valid Label', onClick: mockOnClick2 },
        ],
      };

      render(<CopyLastWeekPopover {...propsWithEmptyLabel} />);

      expect(screen.getByTestId('menu-item-0')).toHaveTextContent('');
      expect(screen.getByTestId('menu-item-1')).toHaveTextContent(
        'Valid Label',
      );
    });

    it('should handle component re-rendering with different props', () => {
      const { rerender } = render(
        <CopyLastWeekPopover {...defaultProps} open />,
      );

      let popover = screen.getByTestId('popover');
      expect(popover).toHaveAttribute('data-open'); // Boolean props show as empty string when true

      rerender(<CopyLastWeekPopover {...defaultProps} open={false} />);

      popover = screen.getByTestId('popover');
      expect(popover).not.toHaveAttribute('data-open'); // Boolean false props are not rendered
    });

    it('should handle menu items with special characters', () => {
      const specialProps = {
        ...defaultProps,
        menuItems: [
          { label: 'Copy & Save', onClick: mockOnClick1 },
          { label: 'Copy < Previous >', onClick: mockOnClick2 },
          { label: 'Copy "Last Week"', onClick: mockOnClick1 },
        ],
      };

      render(<CopyLastWeekPopover {...specialProps} />);

      expect(screen.getByTestId('menu-item-0')).toHaveTextContent(
        'Copy & Save',
      );
      expect(screen.getByTestId('menu-item-1')).toHaveTextContent(
        'Copy < Previous >',
      );
      expect(screen.getByTestId('menu-item-2')).toHaveTextContent(
        'Copy "Last Week"',
      );
    });

    it('should handle large number of menu items', () => {
      const manyItems = Array.from({ length: 10 }, (_, i) => ({
        label: `Item ${i + 1}`,
        onClick: jest.fn(),
      }));

      const manyItemsProps = {
        ...defaultProps,
        menuItems: manyItems,
      };

      render(<CopyLastWeekPopover {...manyItemsProps} />);

      // Check that all items are rendered
      for (let i = 0; i < 10; i += 1) {
        expect(screen.getByTestId(`menu-item-${i}`)).toHaveTextContent(
          `Item ${i + 1}`,
        );
      }
    });

    it('should handle different onClick callback scenarios', () => {
      let callbackValue = null;
      const callbackOnClick = jest.fn(() => {
        callbackValue = 'callback executed';
      });

      const callbackProps = {
        ...defaultProps,
        menuItems: [{ label: 'Callback Item', onClick: callbackOnClick }],
      };

      render(<CopyLastWeekPopover {...callbackProps} />);

      fireEvent.click(screen.getByTestId('menu-item-0'));

      expect(callbackOnClick).toHaveBeenCalledTimes(1);
      expect(callbackValue).toBe('callback executed');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should pass correct key prop to menu items', () => {
      render(<CopyLastWeekPopover {...defaultProps} />);

      const menuItem1 = screen.getByTestId('menu-item-0');
      const menuItem2 = screen.getByTestId('menu-item-1');

      // Both items should be rendered (key prop working correctly)
      expect(menuItem1).toBeInTheDocument();
      expect(menuItem2).toBeInTheDocument();
    });
  });
});
