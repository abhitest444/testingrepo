import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import Switch from '@ids-ts/switch';
import { Table } from '@ids-ts/table';
import { useIntl, useSandbox, useTracking } from '@payroll/quicksand';
import { MenuExpand, ChevronUp, ChevronDown } from '@design-systems/icons';
import { Activity } from '@ids-ts/loader';
import ComboLink, { MenuItem } from '@ids-ts/combo-link';
import PageMessage from '@ids-ts/page-message';
import Widget from 'web-shell-core/widgets/HOCWidget';
import { EditLink } from 'src/js/widgets/customField/components/CustomFieldsTable.styled';
import {
  getAssignmentDisplayText,
  getFieldAssignmentLabel,
} from 'src/js/widgets/common/assignment/assignmentUtils';
import {
  ITimeEntrySettingsFormState,
  ITimeSheetFieldOption,
  ITimeSheetRequiredFieldOption,
} from 'src/js/widgets/timeTrackingSettings/types';
import {
  FIELD_TRACKING_MAP,
  LINKS,
  TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS,
} from 'src/js/widgets/timeTrackingSettings/constants';
import {
  filterSubFieldsByIXP,
  getTimeSheetFieldTitle,
  FieldAssignmentTourSteps,
  mapDimensionDefinitionsToPreviewFields,
} from 'src/js/widgets/timeTrackingSettings/utils';
import { useStandardFieldAssignmentSummary } from 'src/js/service/hooks/settings/useStandardFieldAssignmentSummary';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import { DetailedErrorInfo } from 'src/js/widgets/assignments/types';
import {
  STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS,
  TIME_ENTRY_SETTINGS_TRACKING_POINTS,
} from 'src/js/widgets/timeTrackingSettings/timeEntrySettingsTrackingPoints';
import { useDimensionVisibility } from 'src/js/common/useDimensionVisibility';
import StandardFieldAssignmentIntegration from './StandardFieldAssignmentIntegration';
import { FieldAssignmentDetailView } from './FieldAssignmentDetailView';

import {
  ActionCellContent,
  ActionCellHeaderContent,
  ButtonContainer,
  CheckBoxWithToolTip,
  DisplayCell,
  ErrorMessageContainer,
  FieldLabelContainer,
  FieldSectionTitle,
  FieldSectionSubTitle,
  RequiredFieldContainer,
  SectionGroupCell,
  SectionGroupTitle,
  StatusSwitchContainer,
  StyledButton,
  StyledChevron,
  StyledTable,
  TableHeaderCell,
} from '../../styles';
import { DimensionsSection } from './DimensionsSection';

interface IFieldsPreview {
  editTimeSheetFields: ITimeSheetFieldOption[];
  updateSelectedCustomTimeSheetField: (
    selectedCustomTimeSheetField: string,
  ) => void;
  featureFlagForRequiredTimeSheetFields: boolean;
  setIsTimesheetPreviewOpen?: (value?: boolean) => void;
  /** When the standard field assignment detail drill-in is open (hides trowser footer). */
  onFieldAssignmentDetailViewChange?: (isOpen: boolean) => void;
  /** Invoked on "Set defaults" click; returns `true` when handled (closes trowser), `false` to open the custom defaults widget. */
  onDimensionsSetDefaults?: () => boolean;
}

// Function to get tracking point based on field key
export const getTrackingPoint = (fieldKey: string) =>
  FIELD_TRACKING_MAP[fieldKey];

export const RequiredFieldSwitch = ({
  onChange,
  value,
  field,
  isFieldDisabled,
  parentFieldKey,
}: {
  onChange: any;
  value: boolean;
  field: ITimeSheetRequiredFieldOption;
  isFieldDisabled: boolean;
  parentFieldKey: ITimeSheetFieldOption;
}) => {
  const { setValue } = useFormContext();
  const intl = useIntl();
  const track = useTracking();

  // Special handling for customers field - always disabled and false
  const isCustomersField =
    parentFieldKey.key ===
    TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED;
  const isDisabled = isFieldDisabled || isCustomersField;
  const isChecked = isCustomersField ? false : value;

  return (
    <RequiredFieldContainer>
      <span>
        {isChecked
          ? intl.formatMessage({ id: 'time-entries.switch.label.yes' })
          : intl.formatMessage({ id: 'time-entries.switch.label.no' })}
      </span>
      <Switch
        onChange={() => {
          const newValue = !value;
          if (newValue) {
            setValue(parentFieldKey.key, true, { shouldDirty: true });
          }
          // Track the change
          const trackingPoint = getTrackingPoint(field.key);
          if (trackingPoint) {
            track({
              ...trackingPoint,
              ui_action: newValue ? 'enabled' : 'disabled',
            });
          }
          onChange(newValue);
        }}
        checked={isChecked}
        disabled={isDisabled}
        aria-label={field.key || ''}
      />
    </RequiredFieldContainer>
  );
};

export const FieldLabelComponent = ({
  field,
  isSubField,
  hasSubFields = false,
  isExpanded = true,
  onToggleExpand,
}: {
  field: ITimeSheetFieldOption;
  isSubField: boolean;
  hasSubFields?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) => {
  const intl = useIntl();

  return (
    <CheckBoxWithToolTip
      isSubField={isSubField}
      data-testid={field.automationId}
    >
      <FieldLabelContainer>
        <span>{getTimeSheetFieldTitle(field, intl.formatMessage)}</span>
        {hasSubFields && (
          <StyledChevron onClick={onToggleExpand}>
            {isExpanded ? (
              <ChevronUp size="small" />
            ) : (
              <ChevronDown size="small" />
            )}
          </StyledChevron>
        )}
      </FieldLabelContainer>
    </CheckBoxWithToolTip>
  );
};

export const StatusSwitchComponent = ({
  onChange,
  value,
  field,
  isSubField,
  updateSelectedCustomTimeSheetField,
  isFieldDisabled,
}: {
  onChange: any;
  value: boolean;
  field: ITimeSheetFieldOption;
  isSubField: boolean;
  updateSelectedCustomTimeSheetField: (
    selectedCustomTimeSheetField: string,
  ) => void;
  isFieldDisabled: boolean;
}) => {
  const { setValue } = useFormContext();
  const intl = useIntl();
  const track = useTracking();

  return (
    <StatusSwitchContainer data-testid={field.automationId}>
      {!isSubField && (
        <span>
          {value
            ? intl.formatMessage({ id: 'time-entries.switch.label.active' })
            : intl.formatMessage({
                id: 'time-entries.switch.label.inactive',
              })}
        </span>
      )}
      <Switch
        onChange={() => {
          const newValue = !value;
          // Track the change
          const trackingPoint = getTrackingPoint(field.key);
          if (trackingPoint) {
            track({
              ...trackingPoint,
              ui_action: newValue ? 'enabled' : 'disabled',
            });
          }
          onChange(newValue);
          if (
            field.key === 'isBillingFieldEnabled' ||
            field.key === 'timeSheetEntryNotesEnabled'
          ) {
            if (field.subFields && field.subFields.length > 0 && value) {
              // When disabling parent field, automatically disable all subfields
              // Don't track these as user interactions since they're automatic consequences
              field.subFields.forEach((subField) => {
                setValue(subField.key, false, { shouldDirty: true });
              });
            } else if (field.key === 'timeSheetEntryNotesEnabled') {
              // When enabling parent field, set default subfield values
              // Don't track these as user interactions since they're automatic defaults
              setValue('timeSheetEntryEditNotesEnabled', true, {
                shouldDirty: true,
              });
            }
          }
          // When disabling parent field, also disable any required field toggles
          if (!newValue && field.requiredField) {
            setValue(field.requiredField.key, false, { shouldDirty: true });
          }

          if (!isSubField) {
            updateSelectedCustomTimeSheetField(field.key);
          }
        }}
        checked={value}
        disabled={isFieldDisabled}
        aria-label={field.key || ''}
      />
    </StatusSwitchContainer>
  );
};

export const FieldsPreview: React.FC<IFieldsPreview> = ({
  editTimeSheetFields,
  updateSelectedCustomTimeSheetField,
  featureFlagForRequiredTimeSheetFields,
  setIsTimesheetPreviewOpen = () => {},
  onFieldAssignmentDetailViewChange,
  onDimensionsSetDefaults,
}) => {
  const { control, getValues, setValue } =
    useFormContext<ITimeEntrySettingsFormState>();
  const intl = useIntl();
  const sandbox = useSandbox();
  const track = useTracking();

  const initialValuesRef = React.useRef<Record<string, any>>({});
  if (Object.keys(initialValuesRef.current).length === 0) {
    initialValuesRef.current = getValues();
  }

  // Feature flag check for customer assignments
  const { isEnabled: isAssignmentsEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.SBSEG_QBO_R4_ASSIGNMENTS,
    defaultValue: false,
    checkIESMasterFlag: true,
    excludePayrollFirst: true,
  });

  const { isVisible: isDimensionsSectionVisible } = useDimensionVisibility();
  const customDimensions = useWatch({
    name: 'customDimensions',
  }) as ITimeEntrySettingsFormState['customDimensions'];
  const dimensionDefinitions = useWatch({
    name: 'dimensionDefinitions',
  }) as ITimeEntrySettingsFormState['dimensionDefinitions'];

  const timesheetDimensionPreviewFields = useMemo(
    () =>
      isDimensionsSectionVisible
        ? mapDimensionDefinitionsToPreviewFields(
            dimensionDefinitions,
            customDimensions,
          )
        : [],
    [isDimensionsSectionVisible, customDimensions, dimensionDefinitions],
  );
  const dimensionsLoading =
    isDimensionsSectionVisible &&
    (customDimensions === undefined || dimensionDefinitions === undefined);

  // Fetch standard field assignment summary for customer assignment counts
  // Only call the hook if the feature flag is enabled (hook will handle the check internally too)
  const {
    data: assignmentSummary,
    loading: assignmentLoading,
    totalTimeAgainstAssignments,
    error: assignmentError,
    refetch,
  } = useStandardFieldAssignmentSummary();
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>(
    {
      isBillingFieldEnabled: true,
      timeSheetEntryNotesEnabled: true,
    },
  );

  const [standardFieldsSectionCollapsed, setStandardFieldsSectionCollapsed] =
    useState(false);

  // State for standard field assignment drawer - pass whole field object
  const [activeFieldAssignment, setActiveFieldAssignment] =
    useState<ITimeSheetFieldOption | null>(null);

  // State for viewing field assignment detail
  const [viewingFieldDetail, setViewingFieldDetail] =
    useState<ITimeSheetFieldOption | null>(null);

  useEffect(() => {
    onFieldAssignmentDetailViewChange?.(!!viewingFieldDetail);
  }, [viewingFieldDetail, onFieldAssignmentDetailViewChange]);

  // State for error message from field assignment
  const [errorInfo, setErrorInfo] = useState<DetailedErrorInfo | null>(null);

  // State for success toast
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Refs for tour steps
  const standardFieldColumnRef = useRef<HTMLSpanElement>(null);
  const customersColumnRef = useRef<HTMLSpanElement>(null);
  const firstRowActionRef = useRef<HTMLSpanElement>(null);

  // Guided tooltip state
  const [showGuidedToolTip, setShowGuidedToolTip] = useState<boolean>(false);

  // Handle tour completion status from TourFramework
  const handleTourReady = useCallback(
    (status: { isCompleted: boolean; isLoading?: boolean }) => {
      if (status.isLoading) {
        return;
      }
      // Show tour if not already completed, hide if completed
      setShowGuidedToolTip(!status.isCompleted);
    },
    [],
  );

  // Returns the total column count for the table (used for section header colspan and subfield colspan)
  const getSubfieldColSpan = () => {
    let columns = 2; // Field + Status
    if (featureFlagForRequiredTimeSheetFields) columns += 1; // Required
    if (isAssignmentsEnabled) columns += 2; // Customers + Action
    return columns;
  };

  // Helper function to get customer assignment count for a field
  const getAssignmentCount = (fieldKey: string): number => {
    if (!assignmentSummary) return 0;

    const fieldLabel = getFieldAssignmentLabel(fieldKey);
    if (!fieldLabel) return 0; // Return 0 for unmapped fields (will show "None")

    const summary = assignmentSummary.find(
      (item) => item.standardFieldLabel === fieldLabel,
    );
    return summary ? summary.assignedTimeAgainstCount : 0;
  };

  // Helper function to render customer assignment cell content based on loading/error states
  const renderCustomerAssignmentContent = (
    fieldKey: string,
    isFieldEnabled: boolean,
  ) => {
    // Special cases: Customer and Notes fields should always show empty
    if (
      fieldKey ===
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED ||
      fieldKey ===
        TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE
    ) {
      return <span />;
    }

    // If field is globally enabled, show "All" (field is available to all customers)
    if (isFieldEnabled) {
      return (
        <span data-testid={`customer-assignment-text-${fieldKey}`}>
          {intl.formatMessage({ id: 'assignments.status.all' })}
        </span>
      );
    }

    // For all other fields, show normal assignment logic
    if (assignmentLoading) {
      return <Activity shape="dots" size="small" />;
    }
    if (assignmentError) {
      return (
        <span style={{ color: '#d32f2f', fontSize: '12px' }}>
          Error loading data
        </span>
      );
    }

    const assignmentDisplay = getAssignmentDisplayText(
      getAssignmentCount(fieldKey), // This will return 0 if no mapping exists
      totalTimeAgainstAssignments,
      intl,
    );

    return (
      <span data-testid={`customer-assignment-text-${fieldKey}`}>
        {assignmentDisplay.text}
      </span>
    );
  };

  const toggleFieldExpansion = (fieldKey: string) => {
    setExpandedFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey],
    }));
  };

  // Handler for assign customers action - pass whole field object
  const handleAssignCustomers = (field: ITimeSheetFieldOption) => {
    // Track assign customers click for standard field
    track({
      ...STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS.VIEW_CUSTOMER_ASSIGNMENT_DRAWER,
      assigned_to: 'standard_field',
    });
    setActiveFieldAssignment(field);
  };

  // Handler for view field detail action
  const handleViewFieldDetail = (field: ITimeSheetFieldOption) => {
    // Track view standard field click
    track(STANDARD_FIELD_ASSIGNMENTS_TRACKING_POINTS.VIEW_STANDARD_FIELD);
    setIsTimesheetPreviewOpen(false);
    setViewingFieldDetail(field);
  };

  // Handler for showing success message
  const handleShowSuccess = useCallback(
    (msg: string) => {
      setSuccessMessage(msg);
      setShowSuccessToast(true);
      setActiveFieldAssignment(null); // Close drawer
      // Refetch assignment summary to update counts
      refetch();
    },
    [refetch],
  );

  // Handler for showing error message
  const handleError = useCallback((error: DetailedErrorInfo) => {
    setErrorInfo(error);

    if (error.isPartialSuccess) {
      // For partial success, close drawer and refresh the data
      setActiveFieldAssignment(null);
      refetch();
    }
    // For pure errors, keep drawer open (don't call setActiveFieldAssignment(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parentFieldKeys = editTimeSheetFields
    ? editTimeSheetFields.map(
        (field) => field.key as keyof ITimeEntrySettingsFormState,
      )
    : [];
  const parentFieldValues = useWatch({ control, name: parentFieldKeys });

  // If viewing field detail, render the detail view instead of the main content
  if (viewingFieldDetail) {
    return (
      <FieldAssignmentDetailView
        field={viewingFieldDetail}
        fieldTitle={getTimeSheetFieldTitle(
          viewingFieldDetail,
          intl.formatMessage,
        )}
        onBack={() => setViewingFieldDetail(null)}
      />
    );
  }

  return (
    <>
      {/* Error message from field assignment - shown above title */}
      {errorInfo && (
        <ErrorMessageContainer>
          <PageMessage
            type={errorInfo.isPartialSuccess ? 'warn' : 'error'}
            onClose={() => setErrorInfo(null)}
          >
            <div>
              <strong>{errorInfo.title}</strong>
              {errorInfo.subtitle && <div>{errorInfo.subtitle}</div>}
            </div>
          </PageMessage>
        </ErrorMessageContainer>
      )}

      <FieldSectionTitle>
        {intl.formatMessage({
          id: 'time-entries.section.title.time-sheet-settings-header',
        })}
      </FieldSectionTitle>
      {isAssignmentsEnabled && (
        <FieldSectionSubTitle>
          {intl.formatMessage({
            id: 'time-entries.standard.fields.assignments-subheader',
          })}
          {isDimensionsSectionVisible && (
            <EditLink
              onClick={() => {
                track(TIME_ENTRY_SETTINGS_TRACKING_POINTS.DIMENSIONS_MANAGE);
                sandbox.navigation.navigate(LINKS.MANAGE_DIMENSIONS_URL);
              }}
              data-testid="manage-dimensions-link"
            >
              {intl.formatMessage({
                id: 'time-entries.section.dimensions.manage-all-companies-link',
              })}
            </EditLink>
          )}
        </FieldSectionSubTitle>
      )}

      <ButtonContainer>
        <StyledButton
          onClick={setIsTimesheetPreviewOpen}
          priority="tertiary"
          size="medium"
          data-testid="preview-timesheet-link"
        >
          {intl.formatMessage({
            id: 'time-entries.link.preview-timesheet',
          })}
          <MenuExpand size="small" />
        </StyledButton>
      </ButtonContainer>
      <StyledTable
        divider="horizontal"
        responsive="elevate"
        hover="row"
        summary="Time tracking settings fields configuration table"
        density="roomy"
      >
        <Table.Header>
          <Table.Row>
            <TableHeaderCell>
              <span ref={standardFieldColumnRef}>
                {intl.formatMessage({
                  id: 'time-entries.section.title.time-sheet.checkbox.header',
                })}
              </span>
            </TableHeaderCell>
            {isAssignmentsEnabled && (
              <TableHeaderCell>
                <span ref={customersColumnRef}>
                  {intl.formatMessage({
                    id: 'time-entries.table.header.customers-assigned',
                  })}
                </span>
              </TableHeaderCell>
            )}
            <TableHeaderCell>
              {intl.formatMessage({
                id: 'time-entries.table.header.status',
              })}
            </TableHeaderCell>
            {featureFlagForRequiredTimeSheetFields && (
              <TableHeaderCell>
                {intl.formatMessage({
                  id: 'time-entries.section.title.time-sheet.required',
                })}
              </TableHeaderCell>
            )}
            {isAssignmentsEnabled && (
              <TableHeaderCell>
                <ActionCellHeaderContent>
                  {intl.formatMessage({
                    id: 'datagridview.columnheader.action',
                  })}
                </ActionCellHeaderContent>
              </TableHeaderCell>
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {editTimeSheetFields && editTimeSheetFields.length > 0 && (
            <>
              {/* Standard fields collapsible section header */}
              <Table.Row
                data-testid="standard-fields-section-header"
                onClick={() =>
                  setStandardFieldsSectionCollapsed((prev) => !prev)
                }
              >
                <SectionGroupCell colSpan={getSubfieldColSpan()}>
                  <SectionGroupTitle>
                    {intl.formatMessage(
                      {
                        id: 'time-entries.section.title.standard-fields-with-count',
                        defaultMessage: 'Standard fields ({count})',
                      },
                      { count: editTimeSheetFields.length },
                    )}
                    <StyledChevron>
                      {standardFieldsSectionCollapsed ? (
                        <ChevronDown size="small" />
                      ) : (
                        <ChevronUp size="small" />
                      )}
                    </StyledChevron>
                  </SectionGroupTitle>
                </SectionGroupCell>
              </Table.Row>
            </>
          )}

          {!standardFieldsSectionCollapsed &&
            editTimeSheetFields &&
            editTimeSheetFields.length > 0 &&
            editTimeSheetFields.map((field, idx) => {
              // Get the parent value from the array
              const parentValue = parentFieldValues?.[idx];
              const savedValue = initialValuesRef.current[field.key] ?? false;

              const subFields = field.subFields
                ? filterSubFieldsByIXP(
                    field.subFields,
                    field.key,
                    featureFlagForRequiredTimeSheetFields,
                  )
                : [];
              const isExpanded =
                subFields.length > 0
                  ? expandedFields[field.key] !== false
                  : false;

              return (
                <React.Fragment key={field.key}>
                  {/* Main field row */}
                  <Table.Row key={`main-${field.key}`}>
                    <DisplayCell data-testid={`field-label-${field.key}`}>
                      <FieldLabelComponent
                        field={field}
                        isSubField={false}
                        hasSubFields={subFields.length > 0}
                        isExpanded={isExpanded}
                        onToggleExpand={() => toggleFieldExpansion(field.key)}
                      />
                    </DisplayCell>
                    {isAssignmentsEnabled && (
                      <Table.Cell data-testid={`field-customers-${field.key}`}>
                        {renderCustomerAssignmentContent(
                          field.key,
                          !!savedValue,
                        )}
                      </Table.Cell>
                    )}
                    <Table.Cell data-testid={`field-status-${field.key}`}>
                      <Controller
                        name={field.key}
                        render={({ field: { onChange, value } }) => (
                          <StatusSwitchComponent
                            onChange={onChange}
                            value={value}
                            field={field}
                            isSubField={false}
                            updateSelectedCustomTimeSheetField={
                              updateSelectedCustomTimeSheetField
                            }
                            isFieldDisabled={field.disabled}
                          />
                        )}
                      />
                    </Table.Cell>
                    {featureFlagForRequiredTimeSheetFields && (
                      <Table.Cell data-testid={`field-required-${field.key}`}>
                        {field.requiredField && (
                          <Controller
                            name={field.requiredField.key}
                            render={({ field: { onChange, value } }) => (
                              <RequiredFieldSwitch
                                onChange={onChange}
                                value={value}
                                field={field.requiredField!}
                                isFieldDisabled={field.disabled || !parentValue}
                                parentFieldKey={field}
                              />
                            )}
                          />
                        )}
                      </Table.Cell>
                    )}
                    {isAssignmentsEnabled && (
                      <Table.Cell data-testid={`field-action-${field.key}`}>
                        {field.key ===
                          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.CUSTOMER_FOR_TIMESHEET_ENABLED ||
                        field.key ===
                          TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.TIME_SHEET_ENTRY_NOTES_ENABLE ? (
                          <span />
                        ) : (
                          <ActionCellContent>
                            <span
                              ref={
                                field.key ===
                                TIME_SHEET_MANAGEMENT_SETTINGS_FIELDS.IS_SERVICE_ENABLE
                                  ? firstRowActionRef
                                  : undefined
                              }
                            >
                              <ComboLink
                                label={intl.formatMessage({
                                  id: 'time-entries.action.view',
                                })}
                                size="mini"
                                onClick={() => {
                                  if (!savedValue) {
                                    handleViewFieldDetail(field);
                                  }
                                }}
                                onSelect={(event) => {
                                  const value = (event.target as any)?.value;
                                  if (
                                    value === 'assign-customers' &&
                                    !savedValue
                                  ) {
                                    handleAssignCustomers(field);
                                  }
                                }}
                                disabled={!!savedValue}
                                data-testid="timesheet-field-action-combo-link"
                              >
                                <MenuItem value="assign-customers">
                                  {intl.formatMessage({
                                    id: 'time-entries.action.assign-customers',
                                  })}
                                </MenuItem>
                              </ComboLink>
                            </span>
                          </ActionCellContent>
                        )}
                      </Table.Cell>
                    )}
                  </Table.Row>
                  {/* Subfields */}
                  {isExpanded &&
                    subFields.map((subField) => (
                      <Table.Row key={`sub-${subField.key}`}>
                        <Table.Cell
                          colSpan={getSubfieldColSpan()}
                          data-testid={`subfield-${subField.key}`}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
                            <FieldLabelComponent field={subField} isSubField />
                            <Controller
                              name={subField.key}
                              render={({ field: { onChange, value } }) => (
                                <StatusSwitchComponent
                                  onChange={onChange}
                                  value={value}
                                  field={subField}
                                  isSubField
                                  updateSelectedCustomTimeSheetField={
                                    updateSelectedCustomTimeSheetField
                                  }
                                  isFieldDisabled={
                                    subField.disabled || !parentValue
                                  }
                                />
                              )}
                            />
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                </React.Fragment>
              );
            })}

          {isDimensionsSectionVisible && (
            <DimensionsSection
              previewFields={timesheetDimensionPreviewFields}
              loading={dimensionsLoading}
              colSpan={getSubfieldColSpan()}
              onSetDefaults={onDimensionsSetDefaults}
            />
          )}
        </Table.Body>
      </StyledTable>
      {/* Success toast */}
      {showSuccessToast && (
        <SuccessToast
          message={successMessage}
          open={showSuccessToast}
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      {/* Standard Field Assignment Integration */}
      {activeFieldAssignment && (
        <StandardFieldAssignmentIntegration
          field={activeFieldAssignment}
          fieldDisplayName={getTimeSheetFieldTitle(
            activeFieldAssignment,
            intl.formatMessage,
          )}
          onClose={() => setActiveFieldAssignment(null)}
          onError={handleError}
          onShowSuccess={handleShowSuccess}
        />
      )}

      {/* Guided Tour Widget - Widget always rendered, open prop controls visibility */}
      {isAssignmentsEnabled && (
        <Widget
          key="time-tracking-ui/TourFramework-fields-preview"
          widgetId="time-tracking-ui/TourFramework"
          data-testid="guided-tooltip-fields-preview-widget"
          tourId="standard-fields-preview-tour"
          open={showGuidedToolTip}
          steps={FieldAssignmentTourSteps(
            standardFieldColumnRef as React.RefObject<HTMLElement>,
            customersColumnRef as React.RefObject<HTMLElement>,
            firstRowActionRef as React.RefObject<HTMLElement>,
            intl,
          )}
          mode="tooltip"
          onClose={() => {
            sandbox.logger.info('[FieldsPreviewTour] User closed tooltip');
            setShowGuidedToolTip(false);
          }}
          onComplete={handleTourReady}
        />
      )}
    </>
  );
};
