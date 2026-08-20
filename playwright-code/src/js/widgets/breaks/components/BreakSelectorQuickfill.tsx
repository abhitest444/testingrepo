import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Typography } from '@ids-ts/typography';
import { useIntl } from '@payroll/quicksand';
import BreaksByAssigneeDropdown from './BreaksByAssigneeDropdown';
import { useQuickfills, useAppDispatch } from '../store/hooks';
import { setFilteredBreaksByAssignee } from '../store/quickfillsSlice';
import { BreakRule } from '../types';
import useQuickfillsCrud from '../hooks/useQuickfillsCrud';

interface BreakSelectorQuickfillProps {
  assigneeId: string;
  onBreakSelected?: (breakId: string, breakRule: BreakRule) => void;
  filter?: {
    isActive?: boolean;
    isDefaultPolicy?: boolean;
    includeDeleted?: boolean;
    allowAuto?: boolean;
    allowManual?: boolean;
    breakType?: any; // Payroll_Break type
  };
  width?: number;
  errorText?: string;
  value?: string;
  breakId?: string; // Optional breakId to load as default value
  [key: string]: any;
}

const BreakSelectorQuickfill: React.FC<BreakSelectorQuickfillProps> = ({
  assigneeId,
  onBreakSelected,
  filter,
  width,
  errorText,
  value,
  breakId,
}) => {
  const [selectedBreakId, setSelectedBreakId] = useState<string>(breakId || '');
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const lastFilterRef = useRef<string>('');
  const { clearQuickfillData } = useQuickfillsCrud();

  // Use value prop if provided, otherwise use internal state
  const displayValue = value !== undefined ? value : selectedBreakId;

  // Get breaks from Redux state
  const {
    getBreaksForAssignee,
    getFilteredBreaksForAssignee,
    setFilteredBreaksByAssignee,
  } = useQuickfills();
  const availableBreaks = getBreaksForAssignee(assigneeId);
  const filteredBreaks = getFilteredBreaksForAssignee(assigneeId);

  // Apply client-side filtering with AND operators
  const computedFilteredBreaks = useMemo(() => {
    if (availableBreaks.length === 0) return availableBreaks;

    // If no filter is provided, return all breaks
    if (!filter) return availableBreaks;

    return availableBreaks.filter((breakRule) => {
      // If no filter conditions are specified, include all breaks
      const hasFilterConditions = Object.values(filter).some(
        (value) => value !== undefined,
      );
      if (!hasFilterConditions) return true;

      // Apply AND logic - break passes if ALL of the specified filter conditions match
      const conditions = [];

      // Check isActive filter
      if (filter.isActive !== undefined) {
        conditions.push(breakRule.isActive === filter.isActive);
      }

      // Check isDefaultPolicy filter
      if (filter.isDefaultPolicy !== undefined) {
        conditions.push(breakRule.isDefaultPolicy === filter.isDefaultPolicy);
      }

      // Check allowAuto filter
      if (filter.allowAuto !== undefined) {
        conditions.push(breakRule.allowAuto === filter.allowAuto);
      }

      // Check allowManual filter
      if (filter.allowManual !== undefined) {
        conditions.push(breakRule.allowManual === filter.allowManual);
      }

      // Check breakType filter
      if (filter.breakType !== undefined) {
        conditions.push(breakRule.breakType === filter.breakType);
      }

      // If no conditions were checked, include the break
      if (conditions.length === 0) return true;

      // Return true if ALL conditions are true (AND logic)
      return conditions.every((condition) => condition === true);
    });
  }, [availableBreaks, filter]);

  // Create a string representation of the filter for comparison
  const filterKey = useMemo(() => {
    if (!filter) return '';
    return JSON.stringify(filter);
  }, [filter]);

  // Update Redux state with filtered breaks only when filter changes
  useEffect(() => {
    if (availableBreaks.length > 0 && filterKey !== lastFilterRef.current) {
      lastFilterRef.current = filterKey;

      setFilteredBreaksByAssignee(assigneeId, computedFilteredBreaks);
    }
  }, [
    filterKey,
    assigneeId,
    setFilteredBreaksByAssignee,
    availableBreaks.length,
    computedFilteredBreaks,
  ]);

  // Clear filtered breaks when assigneeId changes
  useEffect(() => {
    // Clear filtered breaks when assigneeId changes to prevent showing old filtered results
    // Set to undefined to indicate no filter is applied
    setFilteredBreaksByAssignee(assigneeId, undefined as any);
    lastFilterRef.current = '';
  }, [assigneeId, setFilteredBreaksByAssignee]);

  // Clear filtered breaks when there's no filter
  useEffect(() => {
    if (!filter && availableBreaks.length > 0) {
      // Set to undefined to indicate no filter is applied
      setFilteredBreaksByAssignee(assigneeId);
    }
  }, [filter, assigneeId, setFilteredBreaksByAssignee, availableBreaks.length]);

  const handleBreakChange = (breakId: string) => {
    setSelectedBreakId(breakId);
    const breakRule = computedFilteredBreaks.find(
      (breakRule) => breakRule.id === breakId,
    );
    if (breakRule && onBreakSelected) {
      onBreakSelected(breakId, breakRule);
    }
  };

  const handleBreaksLoaded = (breaks: BreakRule[]) => {
    // Handle initial breakId selection when breaks are loaded
    if (breakId && breaks.length > 0 && !value && onBreakSelected) {
      const breakRule = breaks.find((breakRule) => breakRule.id === breakId);
      if (breakRule) {
        onBreakSelected(breakId, breakRule);
      }
    }
  };

  // Clear quickfill data on unmount
  useEffect(
    () => () => {
      clearQuickfillData();
    },
    [clearQuickfillData],
  );

  return (
    <div className="break-selector-quickfill">
      <BreaksByAssigneeDropdown
        assigneeId={assigneeId}
        value={displayValue}
        onChange={handleBreakChange}
        label={intl.formatMessage(
          { id: 'breaks.dropdown.label' },
          { defaultValue: 'Select Break' },
        )}
        placeholder={intl.formatMessage(
          { id: 'breaks.dropdown.placeholder' },
          { defaultValue: 'Choose a break...' },
        )}
        width={width}
        showActiveOnly={filter?.isActive ?? true}
        onBreaksLoaded={handleBreaksLoaded}
        errorText={errorText}
        includeDeleted={filter?.includeDeleted ?? false}
      />
    </div>
  );
};

export default BreakSelectorQuickfill;
