import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Drawer,
  DrawerHeader,
  DrawerContent,
  DrawerFooter,
} from '@ids-ts/drawer';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalContent,
  ModalActions,
} from '@ids-ts/modal-dialog';
import TextField from '@ids-ts/text-field';
import Button from '@ids-ts/button';
import PageMessage from '@ids-ts/page-message';
import DropdownTypeahead, { MenuItem } from '@ids-ts/dropdown-typeahead';
import { B2, B3 } from '@ids-ts/typography';
import { Activity } from '@ids-ts/loader';
import { useIntl, useTracking } from '@payroll/quicksand';
import { debounce } from 'src/js/service/utils/debounce';
import { TimeProjectRow, EstimateType, ProjectEstimateData } from '../types';
import { useCreateEstimate } from '../hooks/useCreateEstimate';
import { useUpdateEstimate } from '../hooks/useUpdateEstimate';
import { useDeleteEstimate } from '../hooks/useDeleteEstimate';
import { useServiceItemsList } from '../hooks/useServiceItemsList';
import { useAppSelector } from '../store';
import { selectIsEstimateDrawerDirty } from '../store/estimateDrawerSlice';
import { useCreateEstimateTrackingPoints } from '../hooks/useCreateEstimateTrackingPoints';
import { MAX_ESTIMATE_HOURS } from '../constants';
import {
  blockInvalidHoursKeys,
  blockInvalidHoursPaste,
} from '../utils/hoursInputGuards';
import {
  EstimateTypeSection,
  RadioGroup,
  RadioOption,
  RadioRow,
  RadioInput,
  RadioDescription,
  HoursInputSection,
  InputWrapper,
  FooterContainer,
  ErrorContainer,
  ServiceItemSection,
  ServiceItemInputRow,
  DropdownWrapper,
  HoursFieldWrapper,
  ServiceItemTable,
  TableHeader,
  TableCell,
  TotalRow,
  TotalCell,
  ActionWrapper,
  ActionButton,
  ActionMenu,
  ActionMenuItem,
  InlineEditInput,
  InlineEditError,
  SavingOverlay,
} from './CreateEstimateDrawer.styled';

// Inline SVG for the per-row "kebab" action-menu trigger.
//
// We previously used `OverflowWeb` from `@design-systems/icons`, but
// since this widget is the only consumer of that icon in the entire
// repo, webpack splits it into a dedicated single-icon chunk
// (`...OverflowWeb_js.js`). When the dev server's chunk filename
// changes (or the browser caches an old one), the widget fails to
// boot with a `ChunkLoadError`. Inlining the icon removes that
// chunk dependency entirely - same visual, no network request.
const OverflowIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="3" cy="8" r="1.5" />
    <circle cx="8" cy="8" r="1.5" />
    <circle cx="13" cy="8" r="1.5" />
  </svg>
);

interface CreateEstimateDrawerProps {
  project: TimeProjectRow;
  onClose: () => void;
  // The parent typically refetches projects + estimates here. Returning
  // a promise lets the drawer keep its saving spinner up (and stay
  // mounted) until the refresh actually settles, which is what makes
  // the post-save UX feel snappy instead of "drawer-closes-then-summary-flashes-stale-data".
  onSuccess: () => void | Promise<void>;
  isEdit?: boolean;
  // Optional anchor for the Time Projects walkthrough — when provided,
  // attaches to the radio group ("How are you estimating this project?")
  // so the third tour step can surface a tooltip pointing into the drawer.
  estimateTypeSectionRef?: React.Ref<HTMLDivElement>;
}

const CreateEstimateDrawer: React.FC<CreateEstimateDrawerProps> = ({
  project,
  onClose,
  onSuccess,
  isEdit = false,
  estimateTypeSectionRef,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const text = (id: string, values?: Record<string, any>) =>
    intl.formatMessage({ id }, values);
  const trackingPoints = useCreateEstimateTrackingPoints();

  const {
    saving,
    saveError,
    saveSuccess,
    hoursValue,
    inputError,
    estimateType,
    serviceItemRows,
    selectedServiceItemId,
    serviceItemHoursValue,
    serviceItemInputError,
    updateHoursValue,
    changeEstimateType,
    updateSelectedServiceItem,
    updateServiceItemHours,
    addServiceItem,
    removeServiceItem,
    editServiceItemHours,
    validateBeforeSave,
    saveEstimate,
    hasTypeChanged,
    prefill,
    reset,
  } = useCreateEstimate();

  const { updateEstimate } = useUpdateEstimate();
  const { deleteEstimate } = useDeleteEstimate();

  const {
    serviceItems: sfoServiceItems,
    serviceItemsLoading: sfoLoading,
    serviceItemsHasMore,
    searchServiceItems,
    loadMoreServiceItems,
  } = useServiceItemsList(project.customerId);

  const estimate: ProjectEstimateData | undefined = useAppSelector(
    (state) => state.projects.estimatesMap[project.projectId],
  );

  const isDirty = useAppSelector(selectIsEstimateDrawerDirty);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showTypeChangeModal, setShowTypeChangeModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingRowHours, setEditingRowHours] = useState('');
  // True from the moment a successful save mutation resolves until the
  // parent's `onSuccess` (which refetches projects + estimates) settles.
  // We keep the drawer mounted and the spinner overlay up during this
  // window so the user sees one continuous loading state instead of a
  // flash of stale summary data.
  const [isFinalizing, setIsFinalizing] = useState(false);
  // Inline-edit hours uses local component state (it's a per-row UI affordance,
  // not part of Redux). Mirror the same validation rules the slice applies to
  // the "Add" service-item hours field so the user gets consistent feedback.
  const [editingRowError, setEditingRowError] = useState<string | null>(null);
  const [serviceItemInputValue, setServiceItemInputValue] = useState('');
  const menuRef = useRef<HTMLDivElement | null>(null);

  /**
   * Auto-dismiss the three-dot action menu when focus leaves its wrapper.
   *
   * We attach this to the wrapper around the trigger button + popover. React's
   * `onBlur` bubbles (it's `focusout` under the hood), so a single handler
   * here observes blur from the trigger button and from each menu item. The
   * `relatedTarget` field tells us where focus is going next:
   *   - Focus moves to another element inside the wrapper (e.g. clicking
   *     "Edit" from the trigger): `wrapper.contains(relatedTarget)` is true,
   *     keep the menu open so the click handler can run.
   *   - Focus moves outside, or `relatedTarget` is `null` (browser blurred
   *     because the user clicked a non-focusable area like an empty section
   *     of the drawer): close the menu.
   *
   * This avoids attaching a document-level listener and keeps the dismissal
   * logic local to the component.
   */
  const handleActionWrapperBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const nextFocus = event.relatedTarget as Node | null;
      if (!event.currentTarget.contains(nextFocus)) {
        setOpenMenuId(null);
      }
    },
    [],
  );

  useEffect(() => {
    if (isEdit && estimate) {
      prefill(estimate);
    } else {
      reset();
    }
    return () => {
      reset();
    };
  }, [isEdit, estimate, prefill, reset]);

  const handleDrawerClose = useCallback(() => {
    // Block close attempts (X button, ESC, backdrop click) while we're
    // mid-save / mid-refetch so we don't tear the drawer down before
    // the parent finishes refreshing the summary view.
    if (saving || isFinalizing) return;
    if (isDirty) {
      setShowUnsavedModal(true);
    } else {
      track(trackingPoints.CLOSE_CREATE_ESTIMATE);
      onClose();
    }
  }, [isDirty, onClose, saving, isFinalizing, track, trackingPoints]);

  const handleUnsavedConfirm = useCallback(() => {
    setShowUnsavedModal(false);
    track(trackingPoints.CLOSE_CREATE_ESTIMATE);
    onClose();
  }, [onClose, track, trackingPoints]);

  const handleUnsavedCancel = useCallback(() => {
    setShowUnsavedModal(false);
  }, []);

  const handleHoursChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      track(trackingPoints.ENTER_HOURS_WORKED);
      updateHoursValue(e.target.value);
    },
    [updateHoursValue, track, trackingPoints],
  );

  const handleEstimateTypeChange = useCallback(
    (type: EstimateType) => {
      if (type === EstimateType.TOTAL_HOURS) {
        track(trackingPoints.ENABLE_BY_HOURS);
      } else {
        track(trackingPoints.ENABLE_BY_SERVICE_ITEM);
      }
      changeEstimateType(type);
    },
    [changeEstimateType, track, trackingPoints],
  );

  const handleSave = useCallback(async () => {
    track(trackingPoints.SAVE_ESTIMATE);
    let effectiveRows = serviceItemRows;

    if (editingRowId && estimateType !== EstimateType.TOTAL_HOURS) {
      // Bail out of save if the inline edit has invalid input - the user
      // sees the inline error and can correct or cancel before retrying.
      if (editingRowError) return;
      // Empty hours -> 0 (optional hours rule).
      const trimmed = editingRowHours.trim();
      const num = trimmed === '' ? 0 : Number(editingRowHours);
      if (Number.isFinite(num) && num >= 0 && num <= MAX_ESTIMATE_HOURS) {
        editServiceItemHours(editingRowId, num);
        effectiveRows = serviceItemRows.map((r) =>
          r.serviceItemId === editingRowId ? { ...r, estimatedHours: num } : r,
        );
      }
      setEditingRowId(null);
      setEditingRowHours('');
      setEditingRowError(null);
    }

    if (!validateBeforeSave(isEdit)) return;
    if (isEdit && hasTypeChanged()) {
      setShowTypeChangeModal(true);
      return;
    }

    let success: boolean;
    if (
      isEdit &&
      estimateType !== EstimateType.TOTAL_HOURS &&
      effectiveRows.length === 0
    ) {
      success = await deleteEstimate(project.projectId);
    } else if (isEdit) {
      success = await updateEstimate({
        projectId: project.projectId,
        rows: effectiveRows,
      });
    } else {
      success = await saveEstimate(project.projectId);
    }
    if (success) {
      // Hold the spinner up across the parent's refetch so the drawer
      // doesn't disappear while the summary view is still rebuilding.
      setIsFinalizing(true);
      try {
        await onSuccess();
      } finally {
        setIsFinalizing(false);
      }
    }
  }, [
    validateBeforeSave,
    saveEstimate,
    updateEstimate,
    deleteEstimate,
    project.projectId,
    onSuccess,
    isEdit,
    hasTypeChanged,
    editingRowId,
    editingRowHours,
    editingRowError,
    editServiceItemHours,
    serviceItemRows,
    estimateType,
    track,
    trackingPoints,
  ]);

  const handleTypeChangeCancel = useCallback(() => {
    track(trackingPoints.CANCEL_ESTIMATE_TYPE_CHANGE);
    setShowTypeChangeModal(false);
  }, [track, trackingPoints]);

  const handleTypeChangeContinue = useCallback(async () => {
    track(trackingPoints.CHANGE_ESTIMATE_TYPE);
    setShowTypeChangeModal(false);
    const deleted = await deleteEstimate(project.projectId);
    if (!deleted) return;
    const created = await saveEstimate(project.projectId);
    if (created) {
      setIsFinalizing(true);
      try {
        await onSuccess();
      } finally {
        setIsFinalizing(false);
      }
    }
  }, [
    deleteEstimate,
    saveEstimate,
    project.projectId,
    onSuccess,
    track,
    trackingPoints,
  ]);

  const handleServiceItemSelect = useCallback(
    (_event: any, infoObject?: any) => {
      const selectedId = infoObject?.selectedItem?.value;
      if (selectedId) {
        track(trackingPoints.SELECT_SERVICE_ITEM_DROPDOWN);
        updateSelectedServiceItem(selectedId);
        setServiceItemInputValue('');
        searchServiceItems('');
      }
    },
    [updateSelectedServiceItem, searchServiceItems, track, trackingPoints],
  );

  const debouncedSearch = useMemo(
    () => debounce((text: string) => searchServiceItems(text), 300),
    [searchServiceItems],
  );

  const handleServiceItemSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const searchValue = e.target.value;
      setServiceItemInputValue(searchValue);
      // Once the user starts typing in the input (including clearing it),
      // drop any previously-selected service item. Without this, the
      // `serviceItemDisplayValue` memo would fall back to the selected item's
      // name when `serviceItemInputValue` becomes empty - making it
      // impossible to clear the field because the typeahead would snap right
      // back to the last selection.
      if (selectedServiceItemId) {
        updateSelectedServiceItem('');
      }
      debouncedSearch(searchValue);
    },
    [debouncedSearch, selectedServiceItemId, updateSelectedServiceItem],
  );

  const handleServiceItemBlur = useCallback(() => {
    setServiceItemInputValue('');
    searchServiceItems('');
  }, [searchServiceItems]);

  const handleDropdownScroll = useCallback(
    (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      const scrollPercent =
        (target.scrollTop + target.clientHeight) / target.scrollHeight;
      if (scrollPercent > 0.8 && serviceItemsHasMore && !sfoLoading) {
        loadMoreServiceItems();
      }
    },
    [serviceItemsHasMore, sfoLoading, loadMoreServiceItems],
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const menuElement = document.querySelector(
        '[data-testid="service-item-dropdown"] [role="listbox"]',
      );
      if (menuElement && !menuRef.current) {
        menuRef.current = menuElement as HTMLDivElement;
        menuElement.addEventListener('scroll', handleDropdownScroll);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (menuRef.current) {
        menuRef.current.removeEventListener('scroll', handleDropdownScroll);
        menuRef.current = null;
      }
    };
  }, [handleDropdownScroll]);

  const handleServiceItemHoursChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      track(trackingPoints.ENTER_SERVICE_HOURS);
      updateServiceItemHours(e.target.value);
    },
    [updateServiceItemHours, track, trackingPoints],
  );

  const handleAddServiceItem = useCallback(() => {
    track(trackingPoints.ADD_SERVICE_ITEM_DETAILS);
    addServiceItem();
  }, [addServiceItem, track, trackingPoints]);

  const handleToggleMenu = useCallback(
    (serviceItemId: string) => {
      track(trackingPoints.CLICK_ELLIPSIS_SERVICE_ITEM);
      setOpenMenuId(openMenuId === serviceItemId ? null : serviceItemId);
    },
    [openMenuId, track, trackingPoints],
  );

  const handleDelete = useCallback(
    (serviceItemId: string) => {
      track(trackingPoints.SELECT_DELETE_SERVICE_ITEM);
      removeServiceItem(serviceItemId);
      setOpenMenuId(null);
      if (editingRowId === serviceItemId) {
        setEditingRowId(null);
        setEditingRowHours('');
        setEditingRowError(null);
      }
    },
    [removeServiceItem, editingRowId, track, trackingPoints],
  );

  const handleEditRow = useCallback(
    (serviceItemId: string, currentHours: number) => {
      track(trackingPoints.EDIT_SERVICE_LINE_ITEM);
      setEditingRowId(serviceItemId);
      setEditingRowHours(String(currentHours));
      setEditingRowError(null);
      setOpenMenuId(null);
    },
    [track, trackingPoints],
  );

  const handleEditRowHoursChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      track(trackingPoints.EDIT_SERVICE_HOURS);
      setEditingRowHours(newValue);
      if (!editingRowId) return;
      // Empty -> 0 (optional hours rule). Anything else has to parse as a
      // finite number in the same range as the "Add" hours field.
      const trimmed = newValue.trim();
      const num = trimmed === '' ? 0 : Number(newValue);
      const isValid =
        Number.isFinite(num) && num >= 0 && num <= MAX_ESTIMATE_HOURS;
      if (isValid) {
        // Commit valid edits to Redux on every keystroke so the dirty-detector
        // notices the change and the Save button enables.
        editServiceItemHours(editingRowId, num);
        setEditingRowError(null);
      } else {
        // Surface the same generic message the Add field uses, and don't
        // commit until the user types a valid value.
        setEditingRowError('timeProject.estimate.validation.invalidHours');
      }
    },
    [track, editingRowId, editServiceItemHours, trackingPoints],
  );

  const addedServiceItemIds = useMemo(
    () => new Set(serviceItemRows.map((row) => row.serviceItemId)),
    [serviceItemRows],
  );

  const dropdownDataSource = useMemo(
    () =>
      sfoServiceItems
        .filter((item) => !addedServiceItemIds.has(item.id))
        .map((item) => ({
          value: item.id,
          label: item.name,
        })),
    [sfoServiceItems, addedServiceItemIds],
  );

  const totalHours = useMemo(
    () => serviceItemRows.reduce((sum, row) => sum + row.estimatedHours, 0),
    [serviceItemRows],
  );

  // Hours are OPTIONAL for service items - the only hard requirement to
  // enable "+ Add" is having selected a service item. Empty hours default to
  // 0 on save. We still gate on `serviceItemInputError` so the user can't
  // add a row with junk text in the hours field.
  const isAddDisabled =
    !selectedServiceItemId || serviceItemInputError !== null;

  // An empty service-item list is only a valid "save" when the user is
  // editing an estimate that was *originally* a service-item estimate -
  // saving in that state maps to a delete-estimate action. If the user
  // switched the type (e.g. from "By hours" to "By service item") they must
  // add at least one row before Save can be clicked, otherwise Save would
  // either no-op or wipe out their existing hours estimate.
  const canSaveEmptyServiceItemList = isEdit && !hasTypeChanged();

  const hasValidInput =
    estimateType === EstimateType.TOTAL_HOURS
      ? Boolean(hoursValue.trim()) && inputError === null
      : canSaveEmptyServiceItemList || serviceItemRows.length > 0;

  // Disable Save until there's a real change to persist (`isDirty`) AND the
  // current form state is valid. Without this the button was clickable on a
  // freshly-prefilled drawer even when nothing had changed. Inline-editing a
  // row's hours with an invalid value also blocks save.
  const isSaveDisabled =
    saving ||
    isFinalizing ||
    !hasValidInput ||
    !isDirty ||
    editingRowError !== null;

  const translatedInputError = inputError ? text(inputError) : undefined;
  const translatedServiceItemError = serviceItemInputError
    ? text(serviceItemInputError)
    : undefined;

  const serviceItemDisplayValue = useMemo(() => {
    if (serviceItemInputValue) return serviceItemInputValue;
    if (!selectedServiceItemId) return '';
    const item = sfoServiceItems.find((si) => si.id === selectedServiceItemId);
    return item?.name || '';
  }, [serviceItemInputValue, selectedServiceItemId, sfoServiceItems]);

  return (
    <>
      <Drawer
        open
        onClose={handleDrawerClose}
        size="medium"
        autoFocus={false}
        restoreFocus
        data-testid="create-estimate-drawer"
      >
        <DrawerHeader
          title={text(
            isEdit
              ? 'timeProject.estimate.editDrawerTitle'
              : 'timeProject.estimate.drawerTitle',
          )}
          onClose={handleDrawerClose}
        />
        <DrawerContent>
          {saveSuccess && (
            <ErrorContainer>
              <PageMessage
                type="success"
                title={text(
                  isEdit
                    ? 'timeProject.estimate.editSaveSuccess'
                    : 'timeProject.estimate.saveSuccess',
                )}
                data-testid="estimate-success-message"
              />
            </ErrorContainer>
          )}
          {saveError && (
            <ErrorContainer>
              <PageMessage
                type="error"
                title={text('timeProject.estimate.error.generic')}
                data-testid="estimate-error-message"
              />
            </ErrorContainer>
          )}

          <EstimateTypeSection ref={estimateTypeSectionRef}>
            <B2 weight="demi">{text('timeProject.estimate.typeQuestion')}</B2>
            <RadioGroup>
              <RadioOption>
                <RadioRow>
                  <RadioInput
                    type="radio"
                    name="estimateType"
                    value={EstimateType.TOTAL_HOURS}
                    checked={estimateType === EstimateType.TOTAL_HOURS}
                    onChange={() =>
                      handleEstimateTypeChange(EstimateType.TOTAL_HOURS)
                    }
                    data-testid="estimate-type-hours"
                  />
                  <B3 weight="demi">{text('timeProject.estimate.byHours')}</B3>
                </RadioRow>
                <RadioDescription>
                  <B3>{text('timeProject.estimate.byHoursDescription')}</B3>
                </RadioDescription>
              </RadioOption>
              <RadioOption>
                <RadioRow>
                  <RadioInput
                    type="radio"
                    name="estimateType"
                    value={EstimateType.BY_SERVICE_ITEM}
                    checked={estimateType === EstimateType.BY_SERVICE_ITEM}
                    onChange={() =>
                      handleEstimateTypeChange(EstimateType.BY_SERVICE_ITEM)
                    }
                    data-testid="estimate-type-service"
                  />
                  <B3 weight="demi">
                    {text('timeProject.estimate.byServiceItem')}
                  </B3>
                </RadioRow>
                <RadioDescription>
                  <B3>
                    {text('timeProject.estimate.byServiceItemDescription')}
                  </B3>
                </RadioDescription>
              </RadioOption>
            </RadioGroup>
          </EstimateTypeSection>

          {estimateType === EstimateType.TOTAL_HOURS && (
            <HoursInputSection>
              <B2 weight="demi">
                {text('timeProject.estimate.hoursQuestion')}
              </B2>
              <InputWrapper>
                <TextField
                  type="number"
                  min={0}
                  max={MAX_ESTIMATE_HOURS}
                  step="any"
                  inputMode="decimal"
                  onKeyDown={blockInvalidHoursKeys}
                  onPaste={blockInvalidHoursPaste}
                  value={hoursValue}
                  onChange={handleHoursChange}
                  placeholder={text('timeProject.estimate.hoursPlaceholder')}
                  errorText={translatedInputError}
                  aria-label={text('timeProject.estimate.hoursPlaceholder')}
                  data-testid="estimate-hours-input"
                />
              </InputWrapper>
            </HoursInputSection>
          )}

          {estimateType === EstimateType.BY_SERVICE_ITEM && (
            <ServiceItemSection>
              <B2 weight="demi">
                {text('timeProject.estimate.serviceItemQuestion')}
              </B2>
              <ServiceItemInputRow>
                <DropdownWrapper>
                  <DropdownTypeahead
                    value={selectedServiceItemId}
                    inputValue={serviceItemDisplayValue}
                    onChange={handleServiceItemSelect}
                    onSearch={handleServiceItemSearch}
                    onBlur={handleServiceItemBlur}
                    onFocus={() =>
                      track(trackingPoints.CLICK_SERVICE_ITEM_DROPDOWN)
                    }
                    dataSource={dropdownDataSource}
                    placeholder={text('timeProject.estimate.selectServiceItem')}
                    aria-label={text('timeProject.estimate.selectServiceItem')}
                    data-testid="service-item-dropdown"
                    renderItem={(item: any, index?: number) => (
                      <MenuItem key={String(index)} value={item.value}>
                        {item.label}
                      </MenuItem>
                    )}
                  />
                </DropdownWrapper>
                <HoursFieldWrapper>
                  <TextField
                    type="number"
                    min={0}
                    max={MAX_ESTIMATE_HOURS}
                    step="any"
                    inputMode="decimal"
                    onKeyDown={blockInvalidHoursKeys}
                    onPaste={blockInvalidHoursPaste}
                    value={serviceItemHoursValue}
                    onChange={handleServiceItemHoursChange}
                    placeholder={text(
                      'timeProject.estimate.serviceItemHoursPlaceholder',
                    )}
                    errorText={translatedServiceItemError}
                    aria-label={text(
                      'timeProject.estimate.serviceItemHoursPlaceholder',
                    )}
                    data-testid="service-item-hours-input"
                  />
                </HoursFieldWrapper>
                <Button
                  purpose="standard"
                  priority="secondary"
                  onClick={handleAddServiceItem}
                  disabled={isAddDisabled}
                  data-testid="service-item-add-button"
                >
                  {text('timeProject.estimate.add')}
                </Button>
              </ServiceItemInputRow>

              {serviceItemRows.length > 0 && (
                <ServiceItemTable data-testid="service-item-table">
                  <thead>
                    <tr>
                      <TableHeader>
                        {text('timeProject.estimate.serviceItemColumn')}
                      </TableHeader>
                      <TableHeader>
                        {text('timeProject.estimate.estimatedHoursColumn')}
                      </TableHeader>
                      <TableHeader>
                        {text('timeProject.estimate.actionsColumn')}
                      </TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceItemRows.map((row) => (
                      <tr
                        key={row.serviceItemId}
                        data-testid={`service-row-${row.serviceItemId}`}
                      >
                        <TableCell>{row.serviceItemName}</TableCell>
                        <TableCell>
                          {editingRowId === row.serviceItemId ? (
                            <>
                              <InlineEditInput
                                type="number"
                                min={0}
                                max={MAX_ESTIMATE_HOURS}
                                step="any"
                                inputMode="decimal"
                                onKeyDown={blockInvalidHoursKeys}
                                onPaste={blockInvalidHoursPaste}
                                value={editingRowHours}
                                onChange={handleEditRowHoursChange}
                                $hasError={editingRowError !== null}
                                aria-invalid={editingRowError !== null}
                                data-testid={`inline-edit-input-${row.serviceItemId}`}
                              />
                              {editingRowError && (
                                <InlineEditError
                                  data-testid={`inline-edit-error-${row.serviceItemId}`}
                                >
                                  {text(editingRowError)}
                                </InlineEditError>
                              )}
                            </>
                          ) : (
                            row.estimatedHours.toFixed(2)
                          )}
                        </TableCell>
                        <TableCell>
                          <ActionWrapper
                            onBlur={
                              openMenuId === row.serviceItemId
                                ? handleActionWrapperBlur
                                : undefined
                            }
                          >
                            <ActionButton
                              onClick={() =>
                                handleToggleMenu(row.serviceItemId)
                              }
                              data-testid={`action-menu-${row.serviceItemId}`}
                            >
                              <OverflowIcon />
                            </ActionButton>
                            {openMenuId === row.serviceItemId && (
                              <ActionMenu>
                                <ActionMenuItem
                                  onClick={() =>
                                    handleEditRow(
                                      row.serviceItemId,
                                      row.estimatedHours,
                                    )
                                  }
                                  data-testid={`action-edit-${row.serviceItemId}`}
                                >
                                  {text('timeProject.estimate.edit')}
                                </ActionMenuItem>
                                <ActionMenuItem
                                  onClick={() =>
                                    handleDelete(row.serviceItemId)
                                  }
                                  data-testid={`action-delete-${row.serviceItemId}`}
                                >
                                  {text('timeProject.estimate.delete')}
                                </ActionMenuItem>
                              </ActionMenu>
                            )}
                          </ActionWrapper>
                        </TableCell>
                      </tr>
                    ))}
                    <TotalRow data-testid="service-item-total-row">
                      <TotalCell>
                        {text('timeProject.estimate.total')}
                      </TotalCell>
                      <TotalCell>
                        {text('timeProject.estimate.totalHours', {
                          count: totalHours.toFixed(2),
                        })}
                      </TotalCell>
                      <TotalCell />
                    </TotalRow>
                  </tbody>
                </ServiceItemTable>
              )}
            </ServiceItemSection>
          )}
        </DrawerContent>
        <DrawerFooter>
          <FooterContainer>
            <Button
              color="primary"
              onClick={handleSave}
              disabled={isSaveDisabled}
              data-testid="estimate-save-button"
            >
              {text('timeProject.estimate.save')}
            </Button>
          </FooterContainer>
        </DrawerFooter>
      </Drawer>
      {(saving || isFinalizing) && (
        <SavingOverlay
          role="status"
          aria-live="polite"
          aria-busy="true"
          data-testid="estimate-saving-overlay"
        >
          <Activity shape="dots" size="large" />
          <B3>
            {text(
              isEdit
                ? 'timeProject.estimate.editSaving'
                : 'timeProject.estimate.saving',
            )}
          </B3>
        </SavingOverlay>
      )}
      {showTypeChangeModal && (
        <Modal
          open
          onClose={handleTypeChangeCancel}
          aria-labelledby="change-type-title"
          data-testid="change-type-modal"
          size="medium"
          dismissible
        >
          <ModalHeader
            onClose={handleTypeChangeCancel}
            data-testid="change-type-modal-header"
          >
            <ModalTitle title={text('timeProject.estimate.changeType.title')} />
          </ModalHeader>
          <ModalContent data-testid="change-type-modal-content">
            <B3>{text('timeProject.estimate.changeType.body')}</B3>
          </ModalContent>
          <ModalActions data-testid="change-type-modal-actions">
            <Button
              priority="secondary"
              onClick={handleTypeChangeCancel}
              disabled={saving}
              data-testid="change-type-cancel"
            >
              {text('timeProject.estimate.changeType.cancel')}
            </Button>
            <Button
              priority="primary"
              onClick={handleTypeChangeContinue}
              disabled={saving}
              data-testid="change-type-continue"
            >
              {text('timeProject.estimate.changeType.continue')}
            </Button>
          </ModalActions>
        </Modal>
      )}
      {showUnsavedModal && (
        <Modal
          open
          onClose={handleUnsavedCancel}
          data-testid="estimate-unsaved-changes-modal"
          size="small"
          dismissible={false}
        >
          <ModalHeader alignment="center">
            <ModalTitle
              title={text('timeProject.estimate.unsavedChanges.title')}
            />
          </ModalHeader>
          <ModalContent alignment="center">
            {text('timeProject.estimate.unsavedChanges.message')}
          </ModalContent>
          <ModalActions alignment="center">
            <Button
              priority="primary"
              onClick={handleUnsavedConfirm}
              data-testid="unsaved-changes-yes"
            >
              {text('timeProject.estimate.unsavedChanges.yes')}
            </Button>
            <Button
              priority="secondary"
              onClick={handleUnsavedCancel}
              data-testid="unsaved-changes-no"
            >
              {text('timeProject.estimate.unsavedChanges.no')}
            </Button>
          </ModalActions>
        </Modal>
      )}
    </>
  );
};

export default CreateEstimateDrawer;
