import { useFormContext, useWatch } from 'react-hook-form';
import React from 'react';
import { TimeOffMethod } from 'src/__generated__/gas/graphql';
import {
  UxPreferenceData,
  UxPreferenceHideTimeEntryFieldsData,
  UxPreferenceKey,
} from 'src/js/service/utils/useUXPreferences';
import { SingleTimeFormState } from 'src/js/widgets/singleTimeTrowser/hooks/useSingleTimeForm';
import { SingleTimeFormMobile } from 'src/js/widgets/singleTimeTrowser/components/SingleTimeFormMobile';
import { useIsMobileDevice } from 'src/js/common/screenSizeUtils';
import { SingleTimeFormDesktop } from 'src/js/widgets/singleTimeTrowser/components/SingleTimeFormDesktop';
import { TimeTracking_BillableStatus } from 'src/__generated__/timeTracking/graphql';
import { TimeForType } from 'src/js/widgets/common/addTimeFormComponents/TeamMember';
import { labelPreferenceRef } from 'src/js/widgets/common/types';
import { TimeTrackingCompanySettings } from 'src/js/service/hooks/settings/useCompanySettings';
import type { LoadingAction } from '../hooks/useFieldLoadingStates';
import type {
  TimeAgainstContactDAS,
  TimeForContactDAS,
} from '../types/singleTimeEntryQueryTypes';

interface SingleTimeFormProps {
  userFirstName: string;
  settings: TimeTrackingCompanySettings;
  preferences: UxPreferenceData;
  hasPayroll: boolean;
  hasProjects: boolean;
  hasAdminAccess: boolean;
  timeForType: TimeForType;
  timeTrackingOnlyId?: string;
  billableStatus?: TimeTracking_BillableStatus | undefined;
  serviceItemPriceRef: React.RefObject<number>;
  serviceDescriptionRef: React.RefObject<string>;
  serviceTaxableRef: React.RefObject<boolean>;
  isBillRateEnable: boolean;
  labelPreference: labelPreferenceRef;
  timeOffMethod: TimeOffMethod | null;
  isOTX?: boolean;
  updateLabel?: (field: string, value: string) => void;
  dispatchLoading?: (action: LoadingAction) => void;
  isMileageEnabled?: boolean;
  timeForContactDAS?: TimeForContactDAS;
  timeAgainstContactDAS?: TimeAgainstContactDAS;
  classDAS?: { id?: string; fullName?: string };
  departmentDAS?: { id?: string; fullName?: string };
  isBillableFieldAssignedRef?: React.MutableRefObject<boolean>;
  shouldShowTeamMemberField?: boolean;
}

export interface SingleTimeFormChildProps {
  userFirstName: string;
  hideTimeEntryFieldsPreferences: UxPreferenceHideTimeEntryFieldsData;
  settings: TimeTrackingCompanySettings;
  toggledClockIn: boolean;
  toggledBillable: boolean;
  toggledBreak: boolean;
  toggledCurrentlyWorking?: boolean;
  hasPayroll: boolean;
  hasProjects: boolean;
  hasAdminAccess: boolean;
  timeForType: TimeForType;
  timeTrackingOnlyId?: string;
  billableStatus?: TimeTracking_BillableStatus | undefined;
  serviceItemPriceRef?: React.RefObject<number>;
  serviceDescriptionRef?: React.RefObject<string>;
  serviceTaxableRef: React.RefObject<boolean>;
  isBillRateEnable: boolean;
  labelPreference: labelPreferenceRef;
  timeOffMethod: TimeOffMethod | null;
  isOTX?: boolean;
  updateLabel?: (field: string, value: string) => void;
  dispatchLoading?: (action: LoadingAction) => void;
  isMileageEnabled?: boolean;
  timeForContactDAS?: TimeForContactDAS;
  timeAgainstContactDAS?: TimeAgainstContactDAS;
  classDAS?: { id?: string; fullName?: string };
  departmentDAS?: { id?: string; fullName?: string };
  isBillableFieldAssignedRef?: React.MutableRefObject<boolean>;
  shouldShowTeamMemberField?: boolean;
}

export const SingleTimeForm = ({
  userFirstName,
  settings,
  preferences,
  hasPayroll,
  hasProjects,
  hasAdminAccess,
  timeForType,
  timeTrackingOnlyId,
  billableStatus,
  serviceItemPriceRef,
  serviceDescriptionRef,
  serviceTaxableRef,
  isBillRateEnable,
  labelPreference,
  timeOffMethod,
  isOTX = false,
  updateLabel,
  dispatchLoading,
  isMileageEnabled = false,
  timeForContactDAS,
  timeAgainstContactDAS,
  classDAS,
  departmentDAS,
  isBillableFieldAssignedRef,
  shouldShowTeamMemberField,
}: SingleTimeFormProps) => {
  const isMobile = useIsMobileDevice();
  const hideTimeEntryFieldsPreferences =
    preferences[UxPreferenceKey.HIDE_TIME_ENTRY_FIELDS];

  const { control } = useFormContext<SingleTimeFormState>();

  const toggledClockIn = useWatch({
    control,
    name: 'toggleClockIn',
  });

  const toggledBillable = useWatch({
    control,
    name: 'billable',
  });

  const toggledBreak = useWatch({
    control,
    name: 'toggleBreak',
  });

  const toggledCurrentlyWorking = useWatch({
    control,
    name: 'currentlyWorking',
  });

  return (
    <>
      {isMobile && (
        <SingleTimeFormMobile
          userFirstName={userFirstName}
          toggledBillable={toggledBillable}
          toggledClockIn={toggledClockIn}
          toggledBreak={toggledBreak}
          toggledCurrentlyWorking={toggledCurrentlyWorking}
          hideTimeEntryFieldsPreferences={hideTimeEntryFieldsPreferences}
          settings={settings}
          hasPayroll={hasPayroll}
          hasProjects={hasProjects}
          hasAdminAccess={hasAdminAccess}
          timeForType={timeForType}
          timeTrackingOnlyId={timeTrackingOnlyId}
          serviceItemPriceRef={serviceItemPriceRef}
          serviceDescriptionRef={serviceDescriptionRef}
          isBillRateEnable={isBillRateEnable}
          labelPreference={labelPreference}
          serviceTaxableRef={serviceTaxableRef}
          timeOffMethod={timeOffMethod}
          isOTX={isOTX}
          updateLabel={updateLabel}
          dispatchLoading={dispatchLoading}
          isMileageEnabled={isMileageEnabled}
          timeForContactDAS={timeForContactDAS}
          timeAgainstContactDAS={timeAgainstContactDAS}
          classDAS={classDAS}
          departmentDAS={departmentDAS}
          isBillableFieldAssignedRef={isBillableFieldAssignedRef}
          shouldShowTeamMemberField={shouldShowTeamMemberField}
        />
      )}
      {!isMobile && (
        <SingleTimeFormDesktop
          userFirstName={userFirstName}
          toggledBillable={toggledBillable}
          toggledClockIn={toggledClockIn}
          toggledBreak={toggledBreak}
          toggledCurrentlyWorking={toggledCurrentlyWorking}
          hideTimeEntryFieldsPreferences={hideTimeEntryFieldsPreferences}
          settings={settings}
          hasPayroll={hasPayroll}
          hasProjects={hasProjects}
          hasAdminAccess={hasAdminAccess}
          timeForType={timeForType}
          timeTrackingOnlyId={timeTrackingOnlyId}
          billableStatus={billableStatus}
          serviceItemPriceRef={serviceItemPriceRef}
          serviceDescriptionRef={serviceDescriptionRef}
          isBillRateEnable={isBillRateEnable}
          labelPreference={labelPreference}
          serviceTaxableRef={serviceTaxableRef}
          timeOffMethod={timeOffMethod}
          isOTX={isOTX}
          updateLabel={updateLabel}
          dispatchLoading={dispatchLoading}
          isMileageEnabled={isMileageEnabled}
          timeForContactDAS={timeForContactDAS}
          timeAgainstContactDAS={timeAgainstContactDAS}
          classDAS={classDAS}
          departmentDAS={departmentDAS}
          isBillableFieldAssignedRef={isBillableFieldAssignedRef}
          shouldShowTeamMemberField={shouldShowTeamMemberField}
        />
      )}
    </>
  );
};
