import gql from 'graphql-tag';

/**
 * Fragment for primary address fields
 * Used to avoid duplication in queries
 */
export const ADDRESS_FRAGMENT = gql`
  fragment AddressFields on DataAccess_ContactAddress {
    lines
    city
    state
    postalCode
  }
`;

/**
 * Query to fetch time entry location details including time entry info and GPS points
 * Used by useTimeEntryLocationData hook
 */
export const TIME_TRACKING_LOCATION_DETAIL_QUERY = gql`
  query TimeTrackingLocationDetail($input: TimeTracking_LocationDetailsInput!) {
    timeTrackingLocationDetail(input: $input) {
      timeEntry {
        id
        startTime
        endTime
        isOpen
        duration
        notes
        timeZone
        timeForType
        timeForContactDAS {
          id
          displayName
          fullName
        }
        timeAgainstContactDAS {
          customer {
            id
            displayName
            fullName
            primaryAddress {
              ...AddressFields
            }
            shippingAddress {
              ...AddressFields
            }
          }
        }
      }
      locationDetail {
        edges {
          node {
            id
            longitude
            latitude
            createdAt
            accuracy
            altitude
            deviceAttributes {
              leftGeofence
              loggedOutOnClock
              locationNotShared
              lowBattery
              batterySaverEnabled
              mockedLocation
              notes
            }
          }
          cursor
        }
      }
    }
  }
  ${ADDRESS_FRAGMENT}
`;
