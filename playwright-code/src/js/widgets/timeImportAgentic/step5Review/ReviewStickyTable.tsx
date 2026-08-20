import React, {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from 'react';
import styled from 'styled-components';
import Checkbox from '@ids-ts/checkbox';
import TextField from '@ids-ts/text-field';
import { ChevronRight, Lock } from '@design-systems/icons';
import ClassDropdown from '../components/ClassDropdown';
import ServiceDropdown from '../components/ServiceDropdown';
import CustomerDropdown from '../components/CustomerDropdown';
import LocationDropdown from '../components/LocationDropdown';

const TableContainer = styled.div`
  max-height: 614px;
  overflow-y: auto;
  border: 2px solid rgb(221, 221, 221);
  border-radius: 12px 5px 12px 12px;
  position: relative;

  &::after {
    content: '';
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(to top, white, transparent);
    pointer-events: none;
    display: block;
  }
`;

const SimpleTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-transform: none !important;

  th {
    position: sticky;
    top: 0px;
    background: white;
    padding: 0 12px;
    text-align: left;
    font-weight: 600;
    border-bottom: 1px solid rgb(221, 221, 221);
    font-size: 14px;
    z-index: 99;
    text-transform: none !important;
    min-width: 105px;
  }

  th:first-child,
  td:first-child {
    border-right: 1px solid rgb(221, 221, 221);
    min-width: 50px;
    background: white;
  }

  th:nth-child(2),
  td:nth-child(2) {
    border-right: 1px solid rgb(221, 221, 221);
    min-width: 105px;
    background: white;
  }

  td {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
    min-width: 105px;
  }

  .group-row {
    background: #edeef1 !important;
    font-weight: 600;
    cursor: pointer;

    td {
      background: #edeef1 !important;
    }
  }

  .group-row td {
    padding: 12px !important;
    line-height: 1.4;
  }

  .group-row:hover {
    background: #dfe0e4 !important;

    td {
      background: #dfe0e4 !important;
    }
  }

  th label {
    padding-top: 5px;
    margin: 0 !important;
  }
`;

const StyledChevronRight = styled(ChevronRight)<{ $expanded: boolean }>`
  display: inline-block;
  margin-right: 6px;
  width: 16px;
  height: 16px;
  transform: ${(props) => (props.$expanded ? 'rotate(90deg)' : 'rotate(0deg)')};
  transition: transform 0.2s;
  vertical-align: middle;
`;

const LockIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  opacity: 0.7;
`;

const StyledLockIcon = styled(Lock)`
  width: 16px;
  height: 16px;
`;

const Avatar = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgb(0, 62, 49);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  margin-right: 6px;
  vertical-align: middle;
`;

const EmployeeGroupContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const ErrorCell = styled.td<{ $hasError: boolean }>`
  background-color: ${(props) =>
    props.$hasError ? '#fff5f5' : 'transparent'} !important;
  border-left: ${(props) =>
    props.$hasError ? '3px solid #f56565' : 'none'} !important;
  color: ${(props) => (props.$hasError ? '#c53030' : 'inherit')} !important;
  font-weight: ${(props) => (props.$hasError ? '600' : 'normal')} !important;
`;

interface TimeEntry {
  id: number;
  employee: string;
  [key: string]: any;
}

interface FailedEntryInfo {
  index: number;
  entryId?: number;
  date: string;
  duration: number;
  errorCode: string;
  message: string;
  subCode?: string;
}

interface SaveResultInfo {
  success: boolean;
  message: string;
  savedEntries: number;
  failedEntries: number;
  savedEntryIds?: number[];
}

interface ReviewStickyTableProps {
  timeEntries: TimeEntry[];
  mappedColumns?: string[];
  mappedColumnMappings?: Record<string, string>;
  checkedEntries: Set<number> | string[];
  onCheckboxChange: (entryId: number | string, checked: boolean) => void;
  onSelectAll?: (checked: boolean) => void;
  isEntryLocked?: (entry: any) => boolean;
  onFieldChange?: (entryId: number, field: string, value: any) => void;
  maxHoursPerDay?: number;
  groupBy?: 'employee' | 'date';
  notesRequired?: boolean;
  companySettings?: any;
  customFields?: any[];
  errorHighlights?: Record<string, string[]>; // Map of entryId to array of field names with errors
  showErrorsOnly?: boolean;
  saveResult?: SaveResultInfo | null;
  failedEntries?: FailedEntryInfo[];
}

const formatValue = (column: string, value: any) => {
  if (column === 'billable') {
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return '-';
  }
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return value;
};

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const ReviewStickyTable: React.FC<ReviewStickyTableProps> = ({
  timeEntries,
  mappedColumns = [],
  mappedColumnMappings = {},
  checkedEntries,
  onCheckboxChange,
  onSelectAll,
  isEntryLocked = () => false,
  onFieldChange,
  maxHoursPerDay = 8,
  groupBy = 'employee',
  notesRequired = false,
  companySettings,
  customFields = [],
  errorHighlights = {},
  showErrorsOnly = false,
  saveResult = null,
  failedEntries = [],
}) => {
  // Determine which fields are required
  const requiredFields = useMemo(() => {
    const required = new Set<string>(['employee', 'date', 'hours']); // Base required fields

    if (companySettings?.serviceItemRequired) {
      required.add('service item');
      required.add('serviceitem'); // Also check lowercase no space version
    }
    if (companySettings?.classRequired) {
      required.add('class');
    }
    if (companySettings?.locationRequired) {
      required.add('location');
    }
    if (companySettings?.timeSheetEntryMakesNotesRequiredEnabled) {
      required.add('notes');
    }
    if (companySettings?.requireBillable) {
      required.add('billable');
    }

    // Add required custom fields
    if (customFields) {
      customFields
        .filter((field: any) => field.required)
        .forEach((field: any) => {
          required.add(field.name.toLowerCase());
        });
    }

    return required;
  }, [companySettings, customFields]);

  // Map of entryId -> error message for failed entries
  const failedEntriesByEntryId = useMemo(() => {
    const map = new Map<number, string>();
    failedEntries.forEach((fe) => {
      if (fe.entryId != null) {
        map.set(fe.entryId, fe.message);
      }
    });
    return map;
  }, [failedEntries]);

  const savedEntryIdsSet = useMemo(
    () => new Set(saveResult?.savedEntryIds ?? []),
    [saveResult?.savedEntryIds],
  );

  const hasFailedEntries = failedEntries.length > 0;

  // Adjust visible columns based on groupBy mode; add Reason column when there are failures
  const visibleColumns = useMemo(() => {
    let columns: string[];
    if (groupBy === 'date') {
      columns = [
        'employee',
        ...mappedColumns.filter((col) => col !== 'date' && col !== 'employee'),
      ];
    } else {
      columns = mappedColumns.filter((col) => col !== 'employee');
    }
    if (hasFailedEntries) {
      columns = [...columns, 'reason'];
    }
    return columns;
  }, [groupBy, mappedColumns, hasFailedEntries]);

  // Group entries by employee or date
  const groupedEntries = useMemo(() => {
    const groups: Record<string, TimeEntry[]> = {};

    timeEntries.forEach((entry) => {
      let groupKey: string;

      if (groupBy === 'date') {
        // Group by date field
        groupKey = entry.date || 'Unknown Date';
      } else {
        // Group by employee (default)
        groupKey = entry.employee || 'Unknown';
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(entry);
    });

    return groups;
  }, [timeEntries, groupBy]);

  const sortedGroupKeys = useMemo(
    () => Object.keys(groupedEntries).sort(),
    [groupedEntries],
  );

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // If more than 1 group, only expand the last one
    if (sortedGroupKeys.length > 1) {
      return new Set([sortedGroupKeys[sortedGroupKeys.length - 1]]);
    }
    // If only 1 group, expand it
    return new Set(sortedGroupKeys);
  });

  // Track the previous set of group keys to detect when groups are added/removed
  const prevGroupKeysRef = useRef<string>(sortedGroupKeys.join(','));

  // Reset expanded groups ONLY when the set of groups changes (not when entries within groups change)
  useEffect(() => {
    const currentGroupKeys = sortedGroupKeys.join(',');
    const groupsChanged = currentGroupKeys !== prevGroupKeysRef.current;

    if (groupsChanged) {
      // Groups were added or removed, reset expansion state
      if (sortedGroupKeys.length > 1) {
        setExpandedGroups(
          new Set([sortedGroupKeys[sortedGroupKeys.length - 1]]),
        );
      } else {
        setExpandedGroups(new Set(sortedGroupKeys));
      }
      prevGroupKeysRef.current = currentGroupKeys;
    }
  }, [sortedGroupKeys]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const allNonLockedChecked = useMemo(() => {
    const nonLocked = timeEntries.filter((e) => !isEntryLocked(e));
    const isChecked = (id: any) =>
      Array.isArray(checkedEntries)
        ? checkedEntries.includes(id)
        : checkedEntries.has(id);
    return nonLocked.length > 0 && nonLocked.every((e) => isChecked(e.id));
  }, [timeEntries, checkedEntries, isEntryLocked]);

  const someNonLockedChecked = useMemo(() => {
    const nonLocked = timeEntries.filter((e) => !isEntryLocked(e));
    const isChecked = (id: any) =>
      Array.isArray(checkedEntries)
        ? checkedEntries.includes(id)
        : checkedEntries.has(id);
    const count = nonLocked.filter((e) => isChecked(e.id)).length;
    return count > 0 && count < nonLocked.length;
  }, [timeEntries, checkedEntries, isEntryLocked]);

  const handleGroupCheckbox = (checked: boolean) => {
    if (onSelectAll) {
      onSelectAll(checked);
    } else {
      timeEntries
        .filter((e) => !isEntryLocked(e))
        .forEach((e) => {
          onCheckboxChange(e.id, checked);
        });
    }
  };

  const renderCell = (entry: TimeEntry, column: string) => {
    if (column === 'reason') {
      const reason = failedEntriesByEntryId.get(entry.id) ?? '-';
      if (reason !== '-') {
        return (
          <span style={{ color: '#b91c1c', fontSize: '14px' }}>{reason}</span>
        );
      }
      return reason;
    }
    const value = entry[column];
    const isLocked = isEntryLocked(entry);
    const isEditableHours = onFieldChange && column === 'hours' && !isLocked;
    const isEditableNotes =
      onFieldChange &&
      column === 'notes' &&
      !isLocked &&
      notesRequired &&
      (!value || value === '');

    // Check if this field has an error and should be editable inline (for error screen)
    const entryErrors = errorHighlights[entry.id] || [];
    const hasError = entryErrors.includes(column.toLowerCase());
    const isErrorField =
      showErrorsOnly && hasError && onFieldChange && !isLocked;

    // Special handling for employee column in date view - show with avatar
    if (column === 'employee' && groupBy === 'date') {
      const employeeName = value || 'Unknown';
      return (
        <EmployeeGroupContent>
          <Avatar
            style={{
              width: '24px',
              height: '24px',
              fontSize: '12px',
              marginRight: '8px',
            }}
          >
            {getInitials(employeeName)}
          </Avatar>
          <span>{employeeName}</span>
        </EmployeeGroupContent>
      );
    }

    // Editable error fields (class, service, customer, location, notes, custom fields)
    if (isErrorField) {
      // Standard dropdown fields
      if (column === 'class') {
        return (
          <div style={{ minWidth: '180px' }}>
            <ClassDropdown
              value={entry.classId || ''}
              onChange={(selectedId: string, selectedItem: any) => {
                onFieldChange(
                  entry.id,
                  'class',
                  selectedItem?.name || selectedItem?.fullName,
                );
                onFieldChange(entry.id, 'classId', selectedId);
              }}
              classValue={value || ''}
              disabled={false}
              addNew
            />
          </div>
        );
      }

      if (column === 'service item') {
        return (
          <div style={{ minWidth: '180px' }}>
            <ServiceDropdown
              value={entry.serviceItemId || ''}
              onChange={(selectedId: string, selectedItem: any) => {
                onFieldChange(
                  entry.id,
                  'service item',
                  selectedItem?.name || selectedItem?.fullName,
                );
                onFieldChange(entry.id, 'serviceItemId', selectedId);
              }}
              serviceValue={value || ''}
              disabled={false}
              addNew
            />
          </div>
        );
      }

      if (column === 'customer') {
        return (
          <div style={{ minWidth: '180px' }}>
            <CustomerDropdown
              value={entry.customerId || ''}
              onChange={(selectedId: string, selectedItem: any) => {
                onFieldChange(
                  entry.id,
                  'customer',
                  selectedItem?.name || selectedItem?.fullName,
                );
                onFieldChange(entry.id, 'customerId', selectedId);
              }}
              customerValue={value || ''}
              disabled={false}
              addNew
            />
          </div>
        );
      }

      if (column === 'location') {
        return (
          <div style={{ minWidth: '180px' }}>
            <LocationDropdown
              value={entry.locationId || ''}
              onChange={(selectedId: string, selectedItem: any) => {
                onFieldChange(
                  entry.id,
                  'location',
                  selectedItem?.name || selectedItem?.fullName,
                );
                onFieldChange(entry.id, 'locationId', selectedId);
              }}
              locationValue={value || ''}
              disabled={false}
              addNew
            />
          </div>
        );
      }

      // Notes or other text fields
      if (column === 'notes' || hasError) {
        return (
          <TextField
            value={value || ''}
            onChange={(e) => {
              onFieldChange(entry.id, column, e.target.value);
            }}
            type="text"
            size="small"
            disabled={false}
            readOnly={false}
            errorText={hasError ? 'Required' : undefined}
            style={{ width: '200px', maxWidth: '200px' }}
          />
        );
      }
    }

    // Editable hours field
    if (isEditableHours) {
      // Allow string or number values for hours (to support intermediate typing states)
      const displayValue =
        value === null || value === undefined ? '0' : String(value);
      const numericValue =
        typeof value === 'number' ? value : parseFloat(value) || 0;
      const exceedsLimit = maxHoursPerDay > 0 && numericValue > maxHoursPerDay;

      return (
        <TextField
          value={displayValue}
          onChange={(e) => {
            const val = e.target.value;

            // Check if the value is a valid number and is within 0-24 range
            if (val !== '' && val !== '.' && val !== '-') {
              const numVal = parseFloat(val);
              if (!Number.isNaN(numVal) && (numVal < 0 || numVal > 24)) {
                // Don't allow values less than 0 or greater than 24
                return;
              }
            }

            // Allow any input while typing (store as-is to enable typing)
            // The value will be validated and converted to number when needed
            onFieldChange(entry.id, column, val);

            // If hours is set to 0 or blank, uncheck the entry
            const numVal = parseFloat(val);
            if (val === '' || val === '0' || numVal === 0) {
              onCheckboxChange(entry.id, false);
            }
          }}
          type="text"
          size="small"
          disabled={isLocked}
          readOnly={false}
          warningText={
            exceedsLimit ? `Exceeds ${maxHoursPerDay} hour limit` : undefined
          }
          style={{ width: '160px', maxWidth: '160px' }}
        />
      );
    }

    // Editable notes field when required and empty
    if (isEditableNotes) {
      return (
        <TextField
          value={value || ''}
          onChange={(e) => {
            const val = e.target.value;
            onFieldChange(entry.id, column, val);

            // If notes become non-empty and entry was unchecked, keep it unchecked
            // User will need to manually check it
          }}
          type="text"
          size="small"
          disabled={isLocked}
          readOnly={false}
          errorText="Required"
          style={{ width: '200px', maxWidth: '200px' }}
        />
      );
    }

    return formatValue(column, value);
  };

  return (
    <TableContainer>
      <SimpleTable>
        <thead>
          <tr>
            <th style={{ width: '50px' }}>
              <Checkbox
                theme="gbsgexperimental"
                checked={allNonLockedChecked}
                indeterminate={someNonLockedChecked}
                onChange={(e) => handleGroupCheckbox(e.target.checked ?? false)}
              />
            </th>
            {visibleColumns.map((col) => {
              const isRequired = requiredFields.has(col.toLowerCase());
              const headerText = col.charAt(0).toUpperCase() + col.slice(1);
              return (
                <th key={col}>
                  {headerText}
                  {isRequired && (
                    <span style={{ color: 'red', marginLeft: '4px' }}>*</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedGroupKeys.map((groupKey) => {
            const entries = groupedEntries[groupKey];
            const isExpanded = expandedGroups.has(groupKey);

            // Calculate group checkbox state (entries already filtered to have hours > 0)
            const groupNonLockedEntries = entries.filter(
              (e) => !isEntryLocked(e),
            );
            const groupAllLocked = groupNonLockedEntries.length === 0; // All entries in this group are locked
            const groupCheckedCount = groupNonLockedEntries.filter((e) => {
              const isChecked = Array.isArray(checkedEntries)
                ? checkedEntries.includes(String(e.id))
                : checkedEntries.has(e.id);
              return isChecked;
            }).length;
            const groupAllChecked =
              groupNonLockedEntries.length > 0 &&
              groupCheckedCount === groupNonLockedEntries.length;
            const groupSomeChecked =
              groupCheckedCount > 0 &&
              groupCheckedCount < groupNonLockedEntries.length;

            const handleGroupCheckboxChange = (checked: boolean) => {
              groupNonLockedEntries.forEach((entry) => {
                onCheckboxChange(entry.id, checked);
              });
            };

            return (
              <React.Fragment key={groupKey}>
                <tr className="group-row">
                  <td>
                    {groupAllLocked ? (
                      <LockIconWrapper title="All entries in this group are locked">
                        <StyledLockIcon size="small" />
                      </LockIconWrapper>
                    ) : (
                      <Checkbox
                        theme="gbsgexperimental"
                        checked={groupAllChecked}
                        indeterminate={groupSomeChecked}
                        onChange={(e) =>
                          handleGroupCheckboxChange(e.target.checked ?? false)
                        }
                        disabled={groupNonLockedEntries.length === 0}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </td>
                  <td
                    colSpan={visibleColumns.length}
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <EmployeeGroupContent>
                      <StyledChevronRight $expanded={isExpanded} />
                      {groupBy === 'employee' && (
                        <Avatar>{getInitials(groupKey)}</Avatar>
                      )}
                      <span>
                        {groupKey} ({entries.length})
                      </span>
                    </EmployeeGroupContent>
                  </td>
                </tr>
                {isExpanded &&
                  entries.map((entry) => {
                    const isChecked = Array.isArray(checkedEntries)
                      ? checkedEntries.includes(String(entry.id))
                      : checkedEntries.has(entry.id);
                    const isLocked = isEntryLocked(entry);
                    const entryErrors = errorHighlights[entry.id] || [];
                    const isFailed =
                      saveResult?.success &&
                      failedEntriesByEntryId.has(entry.id);
                    const isSaved =
                      saveResult?.success && savedEntryIdsSet.has(entry.id);
                    let rowBg: string | undefined;
                    if (isFailed) rowBg = '#fef2f2';
                    else if (isSaved) rowBg = '#f0fdf4';

                    return (
                      <tr
                        key={entry.id}
                        className="data-row"
                        style={rowBg ? { backgroundColor: rowBg } : undefined}
                      >
                        <td>
                          {isLocked ? (
                            <LockIconWrapper title="This entry is locked and cannot be modified">
                              <StyledLockIcon size="small" />
                            </LockIconWrapper>
                          ) : (
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) =>
                                onCheckboxChange(
                                  entry.id,
                                  e.target.checked ?? false,
                                )
                              }
                              disabled={isLocked}
                            />
                          )}
                        </td>
                        {visibleColumns.map((col) => {
                          const hasError = entryErrors.includes(
                            col.toLowerCase(),
                          );
                          return (
                            <ErrorCell
                              key={`${entry.id}-${col}`}
                              $hasError={hasError}
                            >
                              {renderCell(entry, col)}
                            </ErrorCell>
                          );
                        })}
                      </tr>
                    );
                  })}
              </React.Fragment>
            );
          })}
        </tbody>
      </SimpleTable>
    </TableContainer>
  );
};

export default ReviewStickyTable;
