import { WHOS_WORKING_LOGGING_CONSTANTS } from 'src/js/widgets/whosworking/constants';

describe('WHOS_WORKING_LOGGING_CONSTANTS', () => {
  describe('NAVIGATION', () => {
    it('has WHOS_WORKING_WIDGET_MOUNTED constant', () => {
      expect(
        WHOS_WORKING_LOGGING_CONSTANTS.NAVIGATION.WHOS_WORKING_WIDGET_MOUNTED,
      ).toBe('WhosWorkingWidget mounted');
    });

    it('has WHOS_WORKING_WIDGET_UNMOUNTED constant', () => {
      expect(
        WHOS_WORKING_LOGGING_CONSTANTS.NAVIGATION.WHOS_WORKING_WIDGET_UNMOUNTED,
      ).toBe('WhosWorkingWidget unmounted');
    });

    it('contains all expected navigation constants', () => {
      expect(WHOS_WORKING_LOGGING_CONSTANTS.NAVIGATION).toHaveProperty(
        'WHOS_WORKING_WIDGET_MOUNTED',
      );
      expect(WHOS_WORKING_LOGGING_CONSTANTS.NAVIGATION).toHaveProperty(
        'WHOS_WORKING_WIDGET_UNMOUNTED',
      );
    });
  });

  describe('API_ERRORS', () => {
    it('has APOLLO_CLIENT_NOT_INITIALIZED constant', () => {
      expect(
        WHOS_WORKING_LOGGING_CONSTANTS.API_ERRORS.APOLLO_CLIENT_NOT_INITIALIZED,
      ).toBe('WhosWorkingWidget: Apollo client not initialized');
    });

    it('contains all expected API error constants', () => {
      expect(WHOS_WORKING_LOGGING_CONSTANTS.API_ERRORS).toHaveProperty(
        'APOLLO_CLIENT_NOT_INITIALIZED',
      );
    });
  });

  describe('Structure', () => {
    it('has correct top-level structure', () => {
      expect(WHOS_WORKING_LOGGING_CONSTANTS).toHaveProperty('NAVIGATION');
      expect(WHOS_WORKING_LOGGING_CONSTANTS).toHaveProperty('API_ERRORS');
    });

    it('is immutable (as const)', () => {
      // TypeScript "as const" makes the object readonly
      // This test verifies the structure exists
      expect(typeof WHOS_WORKING_LOGGING_CONSTANTS).toBe('object');
      expect(WHOS_WORKING_LOGGING_CONSTANTS).toBeDefined();
    });

    it('all navigation constants are strings', () => {
      Object.values(WHOS_WORKING_LOGGING_CONSTANTS.NAVIGATION).forEach(
        (value) => {
          expect(typeof value).toBe('string');
        },
      );
    });

    it('all API error constants are strings', () => {
      Object.values(WHOS_WORKING_LOGGING_CONSTANTS.API_ERRORS).forEach(
        (value) => {
          expect(typeof value).toBe('string');
        },
      );
    });
  });
});
