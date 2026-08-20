import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@ids-ts/button';
import { Switch } from '@ids-ts/switch';
import { useAppContext, useIntl, useTracking } from '@payroll/quicksand';
import { Table } from '@ids-ts/table';
import { Pagination } from '@ids-ts/pagination';
import PageMessage from '@ids-ts/page-message';
import { NewWindow, ChevronDown, ChevronUp } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';
import { Environment } from '@appfabric/sandbox-spec';
import ComboLink, { MenuItem } from '@ids-ts/combo-link';
import { getAssignmentDisplayText } from 'src/js/widgets/common/assignment/assignmentUtils';
import { SuccessToast } from 'src/js/widgets/common/SuccessToast';
import { DetailedErrorInfo } from 'src/js/widgets/assignments/types';
import EmptyCustomFields from './EmptyCustomFields';
import CustomerAssignmentIntegration from './CustomerAssignmentIntegration';
import WorkerAssignmentIntegration from './WorkerAssignmentIntegration';
import {
  CustomField,
  CustomFieldOption,
  toggleCustomFieldRequired,
} from '../store/customFieldsSlice';
import { useAppDispatch } from '../store/hooks';
import { useTimeTrackingSettingsContext } from '../../timeTrackingSettings/context/TimeTrackingSettingsContext';
import { NAVIGATION_ROUTES } from '../../ttoHomePage/constants';
import {
  CUSTOM_FIELDS_TABLE_COLUMNS,
  ASSIGNMENT_COLUMNS,
  TSHEETS_URL,
} from '../utils/constants';
import { CUSTOM_FIELDS_TRACKING_POINTS } from '../../../common/useClickTracking';
import { CUSTOM_FIELD_SETTINGS_TRACKING_POINTS } from '../../assignments/utils/assignmentsTrackingPoints';
import {
  Container,
  HeaderContainer,
  DescriptionContainer,
  LinkContainer,
  Description,
  ButtonContainer,
  ActionButtons,
  RequiredContainer,
  EditLink,
  StyledEditLink,
  StyledTable,
  PaginationContainer,
  StyledPageMessage,
  CenteredErrorContainer,
  OptionRow,
  IndentedCell,
  ErrorMessageContainer,
  ActionsContainer,
  ActionsHeaderCell,
} from './CustomFieldsTable.styled';
import { CustomFieldData } from '../../timeTrackingSettings/types';
import { ASSIGNMENT_ACTIONS } from '../../assignments/constants';

interface CustomFieldsTableProps {
  customFields: CustomField[];
  onEdit: (customField: CustomField) => void;
  onPageChange: (page: number) => void;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  setShowCustomFieldDrawer?: (show: boolean) => void;
  setCustomFieldData?: (data: CustomFieldData | null) => void;
  fetchError?: boolean;
  totalCustomerCount: number;
  totalWorkerCount: number;
  isAssignmentsEnabled: boolean;
  onRefetch?: () => void;
  /** Ref for tour target - points to the table header row */
  tableHeaderRefs?: any;
}

const CustomFieldsTable: React.FC<CustomFieldsTableProps> = ({
  customFields,
  onPageChange,
  totalItems,
  currentPage,
  pageSize,
  setShowCustomFieldDrawer,
  setCustomFieldData,
  fetchError,
  onEdit,
  totalCustomerCount,
  totalWorkerCount,
  isAssignmentsEnabled,
  onRefetch,
  tableHeaderRefs,
}) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const { sandbox } = useTimeTrackingSettingsContext();
  const { environment, realmId } = useAppContext();
  const track = useTracking();

  // Track which fields are expanded
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  // Get the appropriate ref for a column based on its key
  const getColumnRef = (columnKey: string) => {
    switch (columnKey) {
      case 'name':
        return tableHeaderRefs?.customFieldsTableHeaderRef;
      case 'customersAssigned':
        return tableHeaderRefs?.customersColumnRef;
      case 'teamAssigned':
        return tableHeaderRefs?.workersColumnRef;
      default:
        return null;
    }
  };

  // Assignment integration state
  const [activeCustomerAssignment, setActiveCustomerAssignment] = useState<{
    customField: CustomField;
    customFieldOption?: CustomFieldOption;
  } | null>(null);
  const [activeWorkerAssignment, setActiveWorkerAssignment] = useState<{
    customField: CustomField;
    customFieldOption: CustomFieldOption;
  } | null>(null);

  // State for error message from field assignment
  const [errorInfo, setErrorInfo] = useState<DetailedErrorInfo | null>(null);

  // State for success toast
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Track page view on mount
  useEffect(() => {
    track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELDS_PAGE);
  }, [track]);

  const text = useCallback(
    (id: string, values?: Record<string, string>) =>
      intl.formatMessage({ id }, values),
    [intl],
  );

  const capitalizeFirstLetter = useCallback(
    (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
    [],
  );

  const handleToggleRequired = useCallback(
    (id: string, isRequired: boolean) => {
      track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELDS_REQUIRED_SLIDER);
      dispatch(toggleCustomFieldRequired(id));
    },
    [dispatch, track],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELDS_PAGE);
      onPageChange(page);
    },
    [onPageChange, track],
  );

  const handleAdd = () => {
    track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELDS_ADD_BUTTON);
    track(CUSTOM_FIELD_SETTINGS_TRACKING_POINTS.ADD_CUSTOM_FIELDS);
    if (setShowCustomFieldDrawer) {
      setShowCustomFieldDrawer(true);
      if (setCustomFieldData) setCustomFieldData(null);
    }
  };

  const manageCustomFiledsHandler = () => {
    track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELDS_MANAGE_ASSIGNMENTS);
    if (isAssignmentsEnabled) {
      // Navigate to custom fields page when R4-assignments is enabled
      sandbox.navigation.navigate(NAVIGATION_ROUTES.CUSTOM_FIELDS);
    } else {
      // Use the original TSheets URL when feature flag is disabled
      const urlPrefix =
        environment === Environment.PROD
          ? TSHEETS_URL.PROD
          : TSHEETS_URL.PREPROD;
      const tsheetsUrl = `${urlPrefix}/login_oii?realm_id=${encodeURIComponent(
        realmId!,
      )}`;
      window.open(tsheetsUrl, '_blank');
    }
  };

  const handleEdit = useCallback(
    (customField: CustomField) => {
      track(CUSTOM_FIELDS_TRACKING_POINTS.CUSTOM_FIELDS_EDIT_LINK);
      track(CUSTOM_FIELD_SETTINGS_TRACKING_POINTS.EDIT_CUSTOM_FIELD);
      if (setShowCustomFieldDrawer) {
        onEdit(customField);
      }
    },
    [track, setShowCustomFieldDrawer, onEdit],
  );

  const handleAssignCustomer = useCallback(
    (customField: CustomField, customFieldOption?: CustomFieldOption) => {
      track(
        CUSTOM_FIELD_SETTINGS_TRACKING_POINTS.ASSIGN_CUSTOMERS_CUSTOM_FIELD,
      );
      setActiveCustomerAssignment({ customField, customFieldOption });
    },
    [track],
  );

  const handleAssignTeamMember = useCallback(
    (customField: CustomField, customFieldOption: CustomFieldOption) => {
      track(CUSTOM_FIELD_SETTINGS_TRACKING_POINTS.ASSIGN_WORKERS_CUSTOM_FIELD);
      setActiveWorkerAssignment({ customField, customFieldOption });
    },
    [track],
  );

  // Handler for showing success message
  const handleShowSuccess = useCallback(
    (msg: string) => {
      setSuccessMessage(msg);
      setShowSuccessToast(true);
      // Close both drawers
      setActiveCustomerAssignment(null);
      setActiveWorkerAssignment(null);
      // Refetch assignment summary to update counts
      onRefetch?.();
    },
    [onRefetch],
  );

  // Handler for showing error message
  const handleError = useCallback(
    (error: DetailedErrorInfo) => {
      setErrorInfo(error);

      if (error.isPartialSuccess) {
        // For partial success, close both drawers and refresh the data
        setActiveCustomerAssignment(null);
        setActiveWorkerAssignment(null);
        onRefetch?.();
      }
      // For pure errors, keep drawer open (don't close either drawer)
    },
    [onRefetch],
  );

  const totalPages = Math.ceil(totalItems / pageSize);

  const getAssignmentText = useCallback(
    (assignmentCount: number, totalCount: number) =>
      getAssignmentDisplayText(assignmentCount, totalCount, intl).text,
    [intl],
  );

  const columns = useMemo(() => {
    const baseColumns: Array<{ header: string; key: string }> =
      CUSTOM_FIELDS_TABLE_COLUMNS.map((column) => ({
        header: text(column.translationKey),
        key: column.key,
      }));

    // If feature flag is enabled, insert assignment columns after 'type' column (3rd and 4th position)
    if (isAssignmentsEnabled) {
      const assignmentCols: Array<{ header: string; key: string }> =
        ASSIGNMENT_COLUMNS.map((column) => ({
          header: text(column.translationKey),
          key: column.key,
        }));
      baseColumns.splice(2, 0, ...assignmentCols);
    }

    return baseColumns;
  }, [text, isAssignmentsEnabled]);

  const toggleExpansion = useCallback((fieldId: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  }, []);

  const renderRow = useCallback(
    (item: CustomField) => {
      const isExpanded = expandedFields.has(item.id);
      const hasOptions = item?.options?.length > 0;

      return (
        <Table.Row key={`cf-${item.id}`} data-testid="custom-field-row">
          <Table.Cell
            mobileLabel={text('customFields.table.name')}
            data-testid="custom-field-name"
            onClick={hasOptions ? () => toggleExpansion(item.id) : undefined}
            style={hasOptions ? { cursor: 'pointer' } : undefined}
          >
            {hasOptions ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <strong>
                  {item.name} ({item?.options?.length})
                </strong>
                <IconControl
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpansion(item.id);
                  }}
                  aria-label={
                    isExpanded
                      ? text('weekly.collapserow')
                      : text('weekly.expandrow')
                  }
                  size="small"
                  style={{ backgroundColor: 'transparent' }}
                >
                  {isExpanded ? <ChevronUp /> : <ChevronDown />}
                </IconControl>
              </div>
            ) : (
              <strong>{item.name}</strong>
            )}
          </Table.Cell>
          <Table.Cell
            mobileLabel={text('customFields.table.type')}
            data-testid="custom-field-type"
          >
            {item?.options?.length > 0
              ? text('customFields.type.dropdown')
              : capitalizeFirstLetter(item.type)}
          </Table.Cell>
          {isAssignmentsEnabled && (
            <Table.Cell
              mobileLabel={text('customFields.table.customers-assigned')}
              data-testid={`custom-field-customers-${item.id}`}
            >
              <span data-testid={`custom-field-customers-text-${item.id}`}>
                {getAssignmentText(
                  item.customerAssignmentCount || 0,
                  totalCustomerCount,
                )}
              </span>
            </Table.Cell>
          )}
          {isAssignmentsEnabled && (
            <Table.Cell
              mobileLabel={text('customFields.table.team-assigned')}
              data-testid={`custom-field-team-${item.id}`}
            ></Table.Cell>
          )}
          <Table.Cell
            mobileLabel={text('customFields.table.status')}
            data-testid="custom-field-status"
          >
            {item.isActive
              ? text('customFields.status.active')
              : text('customFields.status.inactive')}
          </Table.Cell>
          <Table.Cell
            mobileLabel={text('customFields.table.required')}
            data-testid="custom-field-required"
          >
            <RequiredContainer>
              <span
                data-testid="custom-field-required-text"
                style={{
                  color: item.isActive ? 'inherit' : '#6b7280',
                  opacity: item.isActive ? 1 : 0.6,
                }}
              >
                {item.isRequired
                  ? text('customFields.required.yes')
                  : text('customFields.required.no')}
              </span>
              <Switch
                checked={item.isRequired}
                onChange={() => handleToggleRequired(item.id, !item.isRequired)}
                disabled={!item.isActive}
                aria-label={text('customFields.toggle.required.aria', {
                  '0': item.name,
                })}
                data-testid="custom-field-required-toggle"
              />
            </RequiredContainer>
          </Table.Cell>

          <Table.Cell
            mobileLabel={text('customFields.table.actions')}
            data-testid="custom-field-actions"
          >
            <ActionsContainer>
              {isAssignmentsEnabled ? (
                <ComboLink
                  label={text('customFields.assign.customer')}
                  size="mini"
                  onClick={() => item.isActive && handleAssignCustomer(item)}
                  onSelect={() => handleEdit(item)}
                  data-testid="custom-field-edit-combo-link"
                  disabled={!item.isActive}
                >
                  <MenuItem
                    value={ASSIGNMENT_ACTIONS.EDIT}
                    disabled={!item.isActive}
                  >
                    {text('customFields.edit.link')}
                  </MenuItem>
                </ComboLink>
              ) : (
                <ActionButtons>
                  <StyledEditLink
                    onClick={() => item.isActive && handleEdit(item)}
                    aria-label={text('customFields.edit.aria')}
                    data-testid="custom-field-edit-link"
                    isActive={item.isActive}
                  >
                    {text('customFields.edit.link')}
                  </StyledEditLink>
                </ActionButtons>
              )}
            </ActionsContainer>
          </Table.Cell>
        </Table.Row>
      );
    },
    [
      text,
      handleToggleRequired,
      capitalizeFirstLetter,
      expandedFields,
      toggleExpansion,
      handleEdit,
      handleAssignCustomer,
      isAssignmentsEnabled,
      getAssignmentText,
      totalCustomerCount,
    ],
  );

  const renderOptionRows = useCallback(
    (item: CustomField) => {
      const isExpanded = expandedFields.has(item.id);
      const hasOptions = item?.options?.length > 0;

      if (!isExpanded || !hasOptions) return [];

      return item.options!.map((option) => (
        <OptionRow
          key={`cfo-${option.id}`}
          data-testid="custom-field-option-row"
        >
          <IndentedCell
            mobileLabel={text('customFields.table.name')}
            data-testid="custom-field-option-name"
          >
            {option.name}
          </IndentedCell>
          <Table.Cell
            mobileLabel={text('customFields.table.type')}
            data-testid="custom-field-option-type"
          >
            {text('customFields.type.listitem')}
          </Table.Cell>
          {isAssignmentsEnabled && (
            <Table.Cell
              mobileLabel={text('customFields.table.customers-assigned')}
              data-testid={`custom-field-option-customers-${option.id}`}
            >
              <span data-testid={`custom-field-option-${option.id}`}>
                {getAssignmentText(
                  option.timeAgainstAssignmentCount || 0,
                  totalCustomerCount,
                )}
              </span>
            </Table.Cell>
          )}
          {isAssignmentsEnabled && (
            <Table.Cell
              mobileLabel={text('customFields.table.team-assigned')}
              data-testid={`custom-field-option-team-${option.id}`}
            >
              <span data-testid={`custom-field-option-team-text-${option.id}`}>
                {getAssignmentText(
                  option.workerAssignmentCount || 0,
                  totalWorkerCount,
                )}
              </span>
            </Table.Cell>
          )}
          <Table.Cell
            mobileLabel={text('customFields.table.status')}
            data-testid="custom-field-option-status"
          >
            {option.deleted
              ? text('customFields.status.inactive')
              : text('customFields.status.active')}
          </Table.Cell>
          <Table.Cell
            mobileLabel={text('customFields.table.required')}
            data-testid="custom-field-option-required"
          />
          <Table.Cell
            mobileLabel={text('customFields.table.actions')}
            data-testid="custom-field-option-actions"
          >
            <ActionsContainer>
              {isAssignmentsEnabled ? (
                <ComboLink
                  label={text('customFields.assign.customer')}
                  size="mini"
                  onClick={() =>
                    item.isActive && handleAssignCustomer(item, option)
                  }
                  data-testid="custom-field-option-edit-combo-link"
                  disabled={!item.isActive || option.deleted}
                >
                  <MenuItem
                    value={ASSIGNMENT_ACTIONS.ASSIGN_WORKERS}
                    onClick={() =>
                      item.isActive && handleAssignTeamMember(item, option)
                    }
                    disabled={!item.isActive || option.deleted}
                  >
                    {text('customFields.assign.team')}
                  </MenuItem>
                  <MenuItem
                    value={ASSIGNMENT_ACTIONS.EDIT}
                    onClick={() =>
                      item.isActive && !option.deleted && handleEdit(item)
                    }
                    disabled={!item.isActive || option.deleted}
                  >
                    {text('customFields.edit.link')}
                  </MenuItem>
                </ComboLink>
              ) : null}
            </ActionsContainer>
          </Table.Cell>
        </OptionRow>
      ));
    },
    [
      expandedFields,
      text,
      isAssignmentsEnabled,
      getAssignmentText,
      totalCustomerCount,
      totalWorkerCount,
      handleEdit,
      handleAssignCustomer,
      handleAssignTeamMember,
    ],
  );

  // Memoize table rows for performance
  const tableRows = useMemo(
    () =>
      customFields.flatMap((item) => [
        renderRow(item),
        ...renderOptionRows(item),
      ]),
    [customFields, renderRow, renderOptionRows],
  );

  return (
    <Container data-testid="custom-fields-table-container">
      <HeaderContainer>
        <h2 data-testid="custom-fields-title">{text('customFields.title')}</h2>
      </HeaderContainer>
      <DescriptionContainer>
        <Description data-testid="custom-fields-description">
          {text('customFields.description')}
        </Description>
        <LinkContainer
          onClick={manageCustomFiledsHandler}
          data-testid="custom-fields-manage-link"
        >
          <EditLink>
            {isAssignmentsEnabled
              ? text('customFields.manage.link.new')
              : text('customFields.manage.link')}
          </EditLink>
          <NewWindow />
        </LinkContainer>
      </DescriptionContainer>

      {/* Error Message - Display at top */}
      {errorInfo && (
        <ErrorMessageContainer>
          <PageMessage
            type={errorInfo.isPartialSuccess ? 'warn' : 'error'}
            open
            onClose={() => setErrorInfo(null)}
          >
            <div>
              <strong>{errorInfo.title}</strong>
              {errorInfo.subtitle && <div>{errorInfo.subtitle}</div>}
              {errorInfo.description && <div>{errorInfo.description}</div>}
            </div>
          </PageMessage>
        </ErrorMessageContainer>
      )}

      <ButtonContainer>
        <Button
          priority="secondary"
          size="medium"
          onClick={handleAdd}
          data-testid="custom-fields-add-button"
          aria-label="custom-fields-add-button"
        >
          {text('customFields.add.button')}
        </Button>
      </ButtonContainer>
      <StyledTable
        hover="row"
        responsive="pin"
        divider="horizontal"
        verticalDividerStyle="dotted"
        data-testid="custom-fields-table"
      >
        <Table.Header>
          <Table.Row data-testid="custom-fields-table-header-row">
            {columns.map((column, index) =>
              column.key === 'actions' ? (
                <ActionsHeaderCell key={column.key}>
                  {column.header}
                </ActionsHeaderCell>
              ) : (
                <Table.Cell key={column.key}>
                  <span ref={getColumnRef(column.key)}>{column.header}</span>
                </Table.Cell>
              ),
            )}
          </Table.Row>
        </Table.Header>
        <Table.Body data-testid="custom-fields-table-body">
          {tableRows}
        </Table.Body>
      </StyledTable>

      {fetchError && (
        <CenteredErrorContainer>
          <StyledPageMessage
            type="warn"
            open={fetchError}
            automationId="CustomFieldsErrorPageMessage"
            title={text('customFields.error.title.subtext')}
            dismissible={false}
            style={{ textAlign: 'center', marginBottom: '16px' }}
          >
            {text('customFields.error.subtext')}
          </StyledPageMessage>
        </CenteredErrorContainer>
      )}

      {!fetchError && customFields.length === 0 && <EmptyCustomFields />}

      <PaginationContainer>
        <Pagination
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          activePage={currentPage}
          onPageChange={handlePageChange}
          data-testid="custom-fields-pagination"
        />
      </PaginationContainer>

      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast
          open
          message={successMessage}
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      {/* Assignment Integrations */}
      {activeCustomerAssignment && (
        <CustomerAssignmentIntegration
          customField={activeCustomerAssignment.customField}
          customFieldOption={activeCustomerAssignment.customFieldOption}
          onClose={() => setActiveCustomerAssignment(null)}
          onError={handleError}
          onShowSuccess={handleShowSuccess}
        />
      )}

      {activeWorkerAssignment && (
        <WorkerAssignmentIntegration
          customFieldId={activeWorkerAssignment.customField.id}
          customFieldOption={activeWorkerAssignment.customFieldOption}
          onClose={() => setActiveWorkerAssignment(null)}
          onError={handleError}
          onShowSuccess={handleShowSuccess}
        />
      )}
    </Container>
  );
};

export default CustomFieldsTable;
