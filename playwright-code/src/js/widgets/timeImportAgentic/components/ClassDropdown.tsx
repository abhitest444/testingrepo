import React, { useMemo } from 'react';
import QuickFindClassDropdown from 'src/js/widgets/quickFind/components/ClassDropdown';
import type { ClassItem } from 'src/js/widgets/quickFind/types';
import { useAppSelector } from '../store';
import { selectClasses } from '../store/selectors';

export interface ClassDropdownProps {
  value?: string;
  classValue?: string;
  onChange?: (value: string, item?: any) => void;
  onReady?: (data?: any) => void;
  onError?: (error: Error | string) => void;
  label?: string;
  placeholder?: string;
  errorText?: string;
  onLoad?: (data?: any) => void;
  disabled?: boolean;
  addNew?: boolean;
  addNewItemProps?: {
    onClick: () => void;
  };
  width?: string;
  refreshKey?: string | number;
}

/**
 * Class dropdown for time import agentic flow. Uses QuickFind ClassDropdown
 * with preloaded options from timesheet fields data (no entity-drawer widget,
 * so "add new class" drawer does not open on load).
 */
const ClassDropdown: React.FC<ClassDropdownProps> = ({
  value,
  classValue,
  onChange,
  onReady,
  onError,
  label,
  placeholder,
  errorText,
  onLoad,
  disabled = false,
  addNew = false,
  width,
}) => {
  const classesFromStore = useAppSelector(selectClasses);

  const preloadedOptions: ClassItem[] = useMemo(() => {
    if (!classesFromStore?.length) return [];
    return classesFromStore.map((c: any) => ({
      id: c.id,
      name: c.fullName ?? c.name ?? '',
      assigned: true,
      active: true,
    }));
  }, [classesFromStore]);

  const handleChange = (selectedId: string, selectedClass?: ClassItem) => {
    if (onChange) {
      onChange(
        selectedId,
        selectedClass
          ? { id: selectedClass.id, name: selectedClass.name }
          : undefined,
      );
    }
  };

  return (
    <QuickFindClassDropdown
      value={value || ''}
      onChange={handleChange}
      onReady={onReady}
      onError={onError}
      onLoad={onLoad}
      label=""
      placeholder={classValue || placeholder}
      errorText={errorText}
      disabled={disabled}
      addNew={addNew}
      width={width}
      preloadedOptions={preloadedOptions}
    />
  );
};

export default ClassDropdown;
