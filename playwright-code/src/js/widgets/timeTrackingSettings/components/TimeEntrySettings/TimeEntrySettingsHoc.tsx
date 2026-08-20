import React from 'react';
import Widget from 'web-shell-core/widgets/HOCWidget';
import styled from 'styled-components';

import { TimeEntrySettingsForm } from 'src/js/widgets/timeTrackingSettings/components/TimeEntrySettings/TimeEntrySettingsForm';
import { SettingsTrowserKey } from 'src/js/widgets/timeTrackingSettings/constants';

interface ITimeEntrySettingsHoc {
  type: string;
  onIsDirtyTimeForm?: (isDirty: boolean) => boolean;
  /** When set, open directly into the given trowser (standalone entry point). */
  trowserKey?: SettingsTrowserKey;
  /** Invoked when a standalone trowser (see `trowserKey`) is closed. */
  onClose?: () => void;
  /** Identifies the caller/context that launched this widget. */
  source?: string;
}

const StyledTimeEntrySettingsHoc = styled.div`
  min-width: 600px;
  display: flex;
  flex-direction: column;
`;

// This section basically uses to render the tsheet section if the company is part of
// the isFeatureFlagEnableForTimeEntry then new ui shows otherwise it will show the Tsheet
// ui which already exists
export const TimeEntrySettingsHoc: React.FC<ITimeEntrySettingsHoc> = ({
  type,
  onIsDirtyTimeForm,
  trowserKey,
  onClose,
  source,
}) => (
  <>
    <StyledTimeEntrySettingsHoc>
      <TimeEntrySettingsForm
        type={type}
        onIsDirtyTimeForm={onIsDirtyTimeForm}
        trowserKey={trowserKey}
        onClose={onClose}
        source={source}
      />
    </StyledTimeEntrySettingsHoc>
  </>
);
