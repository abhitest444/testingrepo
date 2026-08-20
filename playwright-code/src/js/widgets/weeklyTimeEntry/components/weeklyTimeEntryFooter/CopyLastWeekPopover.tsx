import React from 'react';
import { Popover, PopoverContent } from '@ids-ts/popover';
import { MenuItem } from '@ids-ts/split-button';
import styled from 'styled-components';

interface MenuItemOption {
  label: string;
  onClick: () => void;
}

interface CopyLastWeekPopoverProps {
  open: boolean;
  targetElement: HTMLElement | null;
  onClose: () => void;
  menuItems: MenuItemOption[];
}

// Styled Copy Last Week Popover
const StyledPopover = styled(Popover)`
  padding: 4px !important;
`;

export const CopyLastWeekPopover: React.FC<CopyLastWeekPopoverProps> = ({
  open,
  targetElement,
  onClose,
  menuItems,
}) => {
  const handleMenuItemClick = (onClick: () => void) => {
    onClick();
    onClose(); // Close the popover after executing the menu item action
  };

  return (
    <StyledPopover
      enableClickAway
      open={open}
      targetElement={targetElement}
      position="bottom"
      alignment="center"
      variant="popover"
      onClose={onClose}
    >
      <PopoverContent>
        {menuItems.map((item, index) => (
          <MenuItem
            key={item.label}
            value={index.toString()}
            onClick={() => handleMenuItemClick(item.onClick)}
          >
            {item.label}
          </MenuItem>
        ))}
      </PopoverContent>
    </StyledPopover>
  );
};
