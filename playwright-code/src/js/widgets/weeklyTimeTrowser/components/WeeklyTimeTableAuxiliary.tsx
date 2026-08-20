import React from 'react';
import styled from 'styled-components';

import { IconControl } from '@ids-ts/icon-control';
import { Export, Print, Settings } from '@design-systems/icons';
import { useIntl } from '@payroll/quicksand';
import { useFormContext, useWatch } from 'react-hook-form';
import { TimeSettingsPopoverHOC } from 'src/js/widgets/common/timeSettingsPopover/TimeSettingsPopoverHOC';
import { UxPreferenceData } from 'src/js/service/utils/useUXPreferences';
import {
  getWeekdaysWithDurations,
  WeeklyTimeRowState,
} from 'src/js/widgets/weeklyTimeTrowser/hooks/useWeeklyTimeFormRows';
import { computeFieldsWithData } from 'src/js/widgets/weeklyTimeTrowser/hooks/mapWeeklyTimeForm';
import { WEEKLY_TIME_TRACKING_POINTS } from 'src/js/common/useClickTracking';

const WeeklyTimeTableAuxiliaryContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  flex: 0 1 auto;
  margin-top: 0 !important;
`;

const AuxiliaryLabel = styled.div`
  color: var(--Primitives-Gray-gray-100, #393a3d);
  font-size: var(--font-size-component-medium);
  font-style: normal;
  font-weight: var(--font-weight-component);
  line-height: 1.25;
  margin-left: 6px;
`;

const DataLabel = styled.div`
  color: var(--Primitives-Gray-gray-100, #393a3d);
  font-size: var(--font-size-component-medium);
  font-style: normal;
  font-weight: var(--font-weight-component-semibold);
  line-height: 1.25;
  margin-right: 6px;
`;

interface WeeklyTimeTableAuxiliaryProps {
  isSettingsAccessible: boolean;
  preferences: UxPreferenceData;
  onSettingsSaveSuccess: () => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  onPrintTimeTable: () => void;
  onExportTableClick: () => void;
}

export const WeeklyTimeTableAuxiliary = ({
  preferences,
  onSettingsSaveSuccess,
  isSettingsOpen,
  setSettingsOpen,
  onPrintTimeTable,
  isSettingsAccessible,
  onExportTableClick,
}: WeeklyTimeTableAuxiliaryProps) => {
  // -------------------------------- context hooks
  const intl = useIntl();
  // const currencySymbol = useCurrencySymbol();
  // const hideWeekdaysPreferences =
  //   preferences[UxPreferenceKey.HIDE_WEEKDAYS_UX_PREFERENCE];

  const { control } = useFormContext();
  const rows = useWatch({
    control,
    name: 'weeklyTimeRows',
  }) as WeeklyTimeRowState[];

  const weekdaysWithDurations = getWeekdaysWithDurations(rows);
  const fieldsWithData = computeFieldsWithData(
    rows.filter((row) => row.id !== 0),
  );

  // should this be initialized on render ?
  const trowserSettingsGear = document.querySelector(
    '[class~="weekly-time-table-aux-settings-gear"]',
  );

  // -------------------------------- component state hooks
  // const rowTotalHourMinuteString = secondsNumberToHourMinString(useTotalTime());
  // const totalBillable = useTotalBillable();

  // -------------------------------- component interaction handlers
  const handlePrintIconClick = () => {
    onPrintTimeTable();
  };

  const handleExportIconClick = () => {
    onExportTableClick();
  };

  const handleSettingsIconClick = () => {
    setSettingsOpen(!isSettingsOpen);
  };

  return (
    <>
      <WeeklyTimeTableAuxiliaryContainer>
        {/* <WeeklyTimeTableAuxiliaryContainer> */}
        {/*  <AuxiliaryLabel> */}
        {/*    {intl.formatMessage({ */}
        {/*      id: 'total.billable', */}
        {/*    })} */}
        {/*  </AuxiliaryLabel> */}
        {/*  <DataLabel>{`${currencySymbol}${totalBillable}`}</DataLabel> */}
        {/*  <AuxiliaryLabel> */}
        {/*    {intl.formatMessage({ */}
        {/*      id: 'time.total', */}
        {/*    })} */}
        {/*  </AuxiliaryLabel> */}
        {/*  <DataLabel>{`${rowTotalHourMinuteString}`}</DataLabel> */}
        {/* </WeeklyTimeTableAuxiliaryContainer> */}
        <IconControl
          className="weekly-time-table-aux-export-icon"
          aria-label={intl.formatMessage({
            id: 'export.time.table',
          })}
          size="medium"
          onClick={handleExportIconClick}
        >
          <Export size="medium" />
        </IconControl>
        <IconControl
          className="weekly-time-table-aux-print-icon"
          aria-label={intl.formatMessage({
            id: 'print.time.table',
          })}
          size="medium"
          onClick={handlePrintIconClick}
        >
          <Print size="medium" />
        </IconControl>
        <IconControl
          className="weekly-time-table-aux-settings-gear"
          aria-label={intl.formatMessage({
            id: 'singletime.settings.popover.title',
          })}
          size="medium"
          onClick={handleSettingsIconClick}
        >
          <Settings size="medium" />
        </IconControl>
      </WeeklyTimeTableAuxiliaryContainer>
      <TimeSettingsPopoverHOC
        open={isSettingsOpen}
        setOpen={setSettingsOpen}
        targetElement={trowserSettingsGear}
        isSettingsAccessible={isSettingsAccessible}
        onSaveSuccess={onSettingsSaveSuccess}
        showDaysOfWeekPreferences
        weekdaysWithDurations={weekdaysWithDurations}
        fieldsWithData={fieldsWithData}
        trackingPoints={WEEKLY_TIME_TRACKING_POINTS}
      />
    </>
  );
};
