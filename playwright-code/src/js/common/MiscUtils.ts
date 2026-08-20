import React from 'react';
import { METERS_PER_MILE } from './constants';

/**
 * Groups components into a list of lists
 *
 * @param elements list of React components
 * @param maxFieldsPerRow number of components per row
 */
export const groupComponentsIntoRows = (
  elements: React.JSX.Element[],
  maxFieldsPerRow: number = 3,
) => {
  const rows = [];
  for (let i = 0; i < elements.length; i += maxFieldsPerRow) {
    rows.push(elements.slice(i, i + maxFieldsPerRow));
  }
  return rows;
};

export const convertRecord = (
  input: Record<string, string | number>,
): Record<string, string> =>
  Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, String(value)]),
  );

export const bankersRound = (value: number): number =>
  Math.round(value * 100) / 100;

export const getShowBillRateToAll = (data: any): boolean =>
  data?.Preferences?.TimeTrackingPrefs?.ShowBillRateToAll || false;

export const getTimeDurationInHHMMFormat = (seconds: number): string => {
  const totalHours = Math.floor(seconds / 3600);
  const totalMinutes = Math.round((seconds % 3600) / 60);
  const timeDuration =
    totalMinutes === 60
      ? `${totalHours + 1}:00`
      : `${totalHours}:${totalMinutes.toString().padStart(2, '0')}`;
  return timeDuration;
};

/**
 * get QBO flavor
 * @returns {string} flavor
 */
export function getFlavor() {
  // @ts-ignore: Unchecked runtime.lastError: the 'qbo' property does not exist on type 'Window'.
  const products = window?.qbo?.productEntitlements;
  const qboFlavor = products?.find(
    (product: { flavor: any }) => product.flavor,
  );
  return qboFlavor?.flavor;
}
/**
 * Converts meters to miles:- 1 mile = 1609.34 meters
 * @param meters - The distance in meters (can be null)
 * @returns The distance in miles as a string with 2 decimal places, or null if input is null
 *
 * @example
 * metersToMiles(1609.34) // returns "1.00"
 * metersToMiles(200) // returns "0.12"
 * metersToMiles(0) // returns "0.00"
 * metersToMiles(null) // returns null
 */
export const metersToMiles = (meters: number | null): string | null => {
  // if meters is null, we return null
  if (meters === null) return null;
  // Convert to miles and format to 2 decimal places
  const miles = meters / METERS_PER_MILE;
  return miles.toFixed(2);
};

/**
 * Converts miles to meters: 1 mile = 1609.34 meters
 * This function is used to convert miles to meters for mileage tracking while sending data to QL service.
 * @param miles - The distance in miles (can be null)
 * @returns The distance in meters as an integer, or null if input is null
 *
 * @example
 * milesToMeters(23) // returns 37015
 * milesToMeters(10.5) // returns 16898
 * milesToMeters(0) // returns 0
 * milesToMeters(null) // returns null
 */
export const milesToMeters = (miles: string | number | null): number | null => {
  // if miles is null or 0, we return the input as it is
  if (miles === null || miles === 0) return miles;
  // Round to integer: multiply by METERS_PER_MILE and round
  return Math.round(Number(miles) * METERS_PER_MILE);
};

export const getInitials = (name: string): string => {
  const names = name.trim().split(' ');
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
