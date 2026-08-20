import React from 'react';
import { Popover, PopoverHeader } from '@ids-ts/popover';
import { useIntl } from '@payroll/quicksand';
import { B3 } from '@ids-ts/typography';

export interface IServicePopover {
  open: boolean;
  onClose: () => void;
  targetElement: HTMLElement | null;
  message: string;
}
export const InfoPopover = ({
  open,
  onClose,
  targetElement,
  message,
}: IServicePopover) => {
  const intl = useIntl();
  const text = (id: string) => intl.formatMessage({ id });

  const handleClose = () => {
    onClose();
  };

  const renderPopoverHeader = () => <PopoverHeader />;

  const renderPopoverContent = () => (
    <div className="popover-content-wrapper">
      <B3 as="div">{text(message)}</B3>
    </div>
  );

  return (
    <Popover
      dismissible
      enableClickAway
      open={open}
      alignment="left"
      onClose={handleClose}
      position="right"
      targetElement={targetElement}
      variant="popover"
    >
      {renderPopoverHeader()}
      {renderPopoverContent()}
    </Popover>
  );
};
