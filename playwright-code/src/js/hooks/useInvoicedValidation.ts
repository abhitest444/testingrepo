import { useEffect, useRef, useState } from 'react';
import { DefaultValues, FieldValues } from 'react-hook-form';

export type RestrictedFieldType = 'billing' | 'customer' | 'project' | null;
export type FormMode = 'single' | 'weekly';

interface UseInvoicedValidationProps<T extends FieldValues> {
  mode: FormMode;
  currentValues: T;
  defaultValues: T;
  dirtyFields: any;
}

interface UseInvoicedValidationReturn {
  restrictedFieldType: RestrictedFieldType;
  isRestrictedChange: boolean;
  modifiedRows?: Set<number>; // Optional, only used for weekly mode
}

export function useInvoicedValidation<T extends FieldValues>({
  mode,
  currentValues,
  defaultValues,
  dirtyFields,
}: UseInvoicedValidationProps<T>): UseInvoicedValidationReturn {
  const isProcessingChange = useRef(false);
  const [restrictedFieldType, setRestrictedFieldType] =
    useState<RestrictedFieldType>(null);
  const [isRestrictedChange, setIsRestrictedChange] = useState(false);
  const [modifiedRows, setModifiedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isProcessingChange.current) {
      return;
    }

    isProcessingChange.current = true;

    try {
      if (!dirtyFields || Object.keys(dirtyFields).length === 0) {
        setRestrictedFieldType(null);
        setIsRestrictedChange(false);
        setModifiedRows(new Set());
        return;
      }

      // For single mode, just check if any restricted fields changed
      if (mode === 'single') {
        const hasInvoicedEntry = (defaultValues as any)?.invoiceId;
        if (!hasInvoicedEntry) {
          setRestrictedFieldType(null);
          setIsRestrictedChange(false);
          return;
        }

        // Check if any restricted fields were changed
        const changedFields = Object.keys(dirtyFields);
        let detectedType: RestrictedFieldType = null;

        const hasRestrictedChange = changedFields.some((field) => {
          if (field === 'billable') {
            detectedType = 'billing';
            return true;
          }
          if (field === 'timeAgainst' || field === 'timeAgainst.customer') {
            detectedType = 'customer';
            return true;
          }
          if (field === 'timeAgainst.project') {
            detectedType = 'project';
            return true;
          }
          return false;
        });

        setIsRestrictedChange(hasRestrictedChange);
        setRestrictedFieldType(hasRestrictedChange ? detectedType : null);
        return;
      }

      // For weekly mode
      const newModifiedRows = new Set<number>();
      let detectedRestrictedType: RestrictedFieldType = null;
      let foundRestrictedChange = false;

      // Check each row for changes
      currentValues.forEach((currentRow: any, index: number) => {
        const defaultRow = defaultValues[index];

        // Skip if this row isn't invoiced
        if (
          defaultRow?.billableStatus !== 'HAS_BEEN_BILLED' &&
          (defaultRow?.invoiceId === null ||
            defaultRow?.invoiceId === undefined)
        ) {
          return;
        }

        // Check for changes in restricted fields
        if (
          dirtyFields[index] &&
          defaultValues[index]?.billableStatus === 'HAS_BEEN_BILLED' &&
          defaultValues[index]?.invoiceId !== null
        ) {
          const currentRow = currentValues[index];
          const defaultRow = defaultValues[index];

          // Check restricted fields first
          if (
            dirtyFields[index].billable &&
            currentRow?.billable !== defaultRow?.billable
          ) {
            foundRestrictedChange = true;
            detectedRestrictedType = 'billing';
            newModifiedRows.add(index);
          } else if (
            dirtyFields[index]?.timeAgainst &&
            // Only proceed if timeAgainst or its nested fields are actually marked as dirty
            (dirtyFields[index].timeAgainst === true ||
              (typeof dirtyFields[index].timeAgainst === 'object' &&
                (dirtyFields[index].timeAgainst?.customer?.id ||
                  dirtyFields[index].timeAgainst?.project?.id)))
          ) {
            const timeAgainstField = dirtyFields[index].timeAgainst;

            // Check if it's an object with nested fields
            if (typeof timeAgainstField === 'object') {
              if (timeAgainstField.project?.id) {
                foundRestrictedChange = true;
                detectedRestrictedType = 'project';
                newModifiedRows.add(index);
              } else if (timeAgainstField.customer?.id) {
                foundRestrictedChange = true;
                detectedRestrictedType = 'customer';
                newModifiedRows.add(index);
              }
            } else {
              // If timeAgainst is just marked as dirty without nested fields
              foundRestrictedChange = true;
              detectedRestrictedType = 'customer';
              newModifiedRows.add(index);
            }
          } else {
            // For non-restricted fields, check if any values actually changed
            const compareValues = (current: any, previous: any): boolean => {
              // Handle null/undefined
              if (current === previous) return false;
              if (!current || !previous) return true;

              // Handle arrays (specifically for durations)
              if (Array.isArray(current) && Array.isArray(previous)) {
                if (current.length !== previous.length) return true;
                return current.some((item, index) => {
                  const prevItem = previous[index];
                  // For duration objects, only compare the duration value
                  if (
                    item?.duration !== undefined &&
                    prevItem?.duration !== undefined
                  ) {
                    return item.duration !== prevItem.duration;
                  }
                  return compareValues(item, prevItem);
                });
              }

              // Handle primitive types
              if (typeof current !== 'object') {
                return current !== previous;
              }

              // Handle objects by comparing their properties
              const currentKeys = Object.keys(current);
              const previousKeys = Object.keys(previous);

              // Different number of properties means they're different
              if (currentKeys.length !== previousKeys.length) return true;

              // Compare each property
              return currentKeys.some((key) => {
                // Skip empty/undefined values
                if (!current[key] && !previous[key]) return false;

                // For objects containing 'id' field, compare just the id
                if (
                  current[key]?.id !== undefined &&
                  previous[key]?.id !== undefined
                ) {
                  return current[key].id !== previous[key].id;
                }

                // For other objects, recurse
                if (typeof current[key] === 'object') {
                  return compareValues(current[key], previous[key]);
                }

                // For primitive values
                return current[key] !== previous[key];
              });
            };

            const hasChanges = Object.entries(dirtyFields[index]).some(
              ([field, isDirty]) => {
                // Only track changes for non-restricted fields
                if (!isDirty || field === 'billable' || field === 'timeAgainst')
                  return false;
                return compareValues(currentRow?.[field], defaultRow?.[field]);
              },
            );

            if (hasChanges) {
              // For non-restricted changes, just track the modified row without setting restricted type
              newModifiedRows.add(index);
            }
          }
        }
      });

      setModifiedRows(newModifiedRows);
      setRestrictedFieldType(
        foundRestrictedChange ? detectedRestrictedType : null,
      );
      setIsRestrictedChange(foundRestrictedChange);
    } finally {
      isProcessingChange.current = false;
    }
  }, [currentValues, defaultValues, dirtyFields, mode]);

  return {
    restrictedFieldType,
    isRestrictedChange,
    ...(mode === 'weekly' ? { modifiedRows } : {}),
  };
}

export const getRestrictedContentKey = (
  fieldType: RestrictedFieldType,
): string => {
  switch (fieldType) {
    case 'billing':
      return 'invoiced.time.popup.billing.content';
    case 'customer':
      return 'invoiced.time.popup.customer.content';
    case 'project':
      return 'invoiced.time.popup.project.content';
    default:
      return 'invoiced.time.popup.billing.content';
  }
};
