import React from 'react';
import Trowser from '@ids-ts/trowser';
import styled from 'styled-components';

import { useAppSelector } from 'src/js/widgets/breaks/store/hooks';
import { selectPreferencesOpen } from 'src/js/widgets/breaks/store/uiSlice';
import BreakPreferencesContainer from 'src/js/widgets/breaks/features/breaks-settings/components/BreakPreferencesContainer';

interface BreakPreferencesContainerProps {
  onClose: () => void;
}

const BreakSettingsTrowserContainer: React.FC<
  BreakPreferencesContainerProps
> = ({ onClose }) => {
  const preferencesOpen = useAppSelector(selectPreferencesOpen);

  return (
    <Trowser
      dismissible
      open={preferencesOpen}
      onClose={onClose}
      showCancelFooterButton
      cancelFooterButtonLabel="Close"
      title="Manage breaks"
      data-testid="break-preferences-container"
    >
      {preferencesOpen ? <BreakPreferencesContainer /> : <></>}
    </Trowser>
  );
};

export default BreakSettingsTrowserContainer;
