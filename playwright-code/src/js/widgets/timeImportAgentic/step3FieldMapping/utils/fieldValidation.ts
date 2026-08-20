/**
 * Utility functions for Step 4 field validation
 */

interface UnmatchedField {
  value: string;
  mappedId?: string;
  mappedName?: string;
  affectedEntryIds: string[];
}

interface ValidationResult {
  hasUnmappedRequired: boolean;
  unmappedRequiredFields: string[];
  unmappedClassCount: number;
  unmappedServiceCount: number;
}

/**
 * Validates required fields and returns detailed information about unmapped fields
 */
export const validateRequiredFields = (
  companySettings: any,
  columnMappings: Record<string, string>,
  unmatchedClasses: Record<string, UnmatchedField>,
  unmatchedServices: Record<string, UnmatchedField>,
): ValidationResult => {
  const isClassMapped = Object.values(columnMappings).includes('class');
  const isServiceMapped =
    Object.values(columnMappings).includes('service item');

  const unmappedRequiredFields: string[] = [];
  let unmappedClassCount = 0;
  let unmappedServiceCount = 0;

  // Check if class is required and has unmapped values
  if (companySettings?.classRequired && isClassMapped) {
    const unmappedClassValues = Object.values(unmatchedClasses).filter(
      (field: UnmatchedField) => !field.mappedId,
    );
    unmappedClassCount = unmappedClassValues.length;
    if (unmappedClassCount > 0) {
      unmappedRequiredFields.push(
        `Class (${unmappedClassCount} unmapped values)`,
      );
    }
  }

  // Check if service is required and has unmapped values
  if (companySettings?.serviceItemRequired && isServiceMapped) {
    const unmappedServiceValues = Object.values(unmatchedServices).filter(
      (field: UnmatchedField) => !field.mappedId,
    );
    unmappedServiceCount = unmappedServiceValues.length;
    if (unmappedServiceCount > 0) {
      unmappedRequiredFields.push(
        `Service Item (${unmappedServiceCount} unmapped values)`,
      );
    }
  }

  return {
    hasUnmappedRequired: unmappedRequiredFields.length > 0,
    unmappedRequiredFields,
    unmappedClassCount,
    unmappedServiceCount,
  };
};

/**
 * Checks if a field type is mapped as a column
 */
export const isFieldTypeMapped = (
  columnMappings: Record<string, string>,
  fieldType: 'class' | 'service item' | 'location' | 'customer',
): boolean => Object.values(columnMappings).includes(fieldType);

/**
 * Gets the count of unmapped fields for a specific field type
 */
export const getUnmappedCount = (
  unmatchedFields: Record<string, UnmatchedField>,
): number => Object.values(unmatchedFields).filter((f) => !f.mappedId).length;
