import React from 'react';
import styled from 'styled-components';
import { IconControl } from '@ids-ts/icon-control';
import { MapSigns } from '@design-systems/icons';
import { useIntl } from '@payroll/quicksand';

const IconControlWrapper = styled.div`
  position: absolute;
  top: 0px;
  right: 44px;
  z-index: 1000;
  display: flex;
  gap: 20px;
  padding: 10px;
  justify-content: flex-end;
  height: 56px;

  /* Responsive positioning to avoid overlap */
  @media screen and (max-width: 768px) {
    right: 88px; /* Move further right on small screens to avoid overflow button */
  }
`;

type CustomFieldsWhatsNewButtonProps = {
  onClick: () => void;
};

const CustomFieldsWhatsNewButton: React.FC<CustomFieldsWhatsNewButtonProps> = ({
  onClick,
}) => {
  const intl = useIntl();

  return (
    <IconControlWrapper>
      <IconControl
        label={intl.formatMessage({ id: 'take.a.tour.action.label' })}
        size="medium"
        onClick={onClick}
      >
        <MapSigns />
      </IconControl>
    </IconControlWrapper>
  );
};

export default CustomFieldsWhatsNewButton;
