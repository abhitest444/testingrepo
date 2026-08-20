/**
 * Checks if an object is empty (i.e., has no own properties).
 *
 * @param obj - The object to check.
 * @returns Returns true if the object is empty or null, false otherwise.
 */
export const isEmptyObject = (obj: any): boolean =>
  obj === null ||
  obj === undefined ||
  (typeof obj === 'object' && Object.keys(obj).length === 0);
