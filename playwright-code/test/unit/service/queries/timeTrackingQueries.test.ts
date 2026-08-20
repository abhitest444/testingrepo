import { GET_TIME_TRACKING_CUSTOM_FIELDS_QUERY } from 'src/js/service/queries/timeTrackingQueries';

describe('GET_TIME_TRACKING_CUSTOM_FIELDS_QUERY', () => {
  it('should be properly defined', () => {
    expect(GET_TIME_TRACKING_CUSTOM_FIELDS_QUERY).toBeDefined();
    expect(typeof GET_TIME_TRACKING_CUSTOM_FIELDS_QUERY).toBe('object');
  });

  it('should have the correct operation name', () => {
    const queryString =
      GET_TIME_TRACKING_CUSTOM_FIELDS_QUERY.loc?.source.body || '';
    expect(queryString).toContain('query getTimeTrackingCustomFields');
  });

  it('should include the required fields', () => {
    const queryString =
      GET_TIME_TRACKING_CUSTOM_FIELDS_QUERY.loc?.source.body || '';
    expect(queryString).toContain('id');
    expect(queryString).toContain('name');
    expect(queryString).toContain('type');
    expect(queryString).toContain('deleted');
  });

  it('should have the correct filter parameter', () => {
    const queryString =
      GET_TIME_TRACKING_CUSTOM_FIELDS_QUERY.loc?.source.body || '';
    expect(queryString).toContain(
      '$filter: TimeTracking_CustomFieldsInputFilter!',
    );
  });
});
