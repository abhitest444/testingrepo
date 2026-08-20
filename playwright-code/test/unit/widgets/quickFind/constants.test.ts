import { QUICK_FIND_CONSTANTS } from '../../../../src/js/widgets/quickFind/constants';

describe('QuickFind Constants', () => {
  describe('QUICK_FIND_CONSTANTS', () => {
    it('should have correct WIDGET_NAME', () => {
      expect(QUICK_FIND_CONSTANTS.WIDGET_NAME).toBe('QuickFind');
    });

    it('should have correct WIDGET_ID', () => {
      expect(QUICK_FIND_CONSTANTS.WIDGET_ID).toBe('time-tracking-ui/quickFind');
    });

    it('should be a readonly object', () => {
      expect(QUICK_FIND_CONSTANTS).toEqual({
        WIDGET_NAME: 'QuickFind',
        WIDGET_ID: 'time-tracking-ui/quickFind',
      });
    });

    it('should have all required properties', () => {
      expect(QUICK_FIND_CONSTANTS).toHaveProperty('WIDGET_NAME');
      expect(QUICK_FIND_CONSTANTS).toHaveProperty('WIDGET_ID');
    });

    it('should have correct property types', () => {
      expect(typeof QUICK_FIND_CONSTANTS.WIDGET_NAME).toBe('string');
      expect(typeof QUICK_FIND_CONSTANTS.WIDGET_ID).toBe('string');
    });

    it('should match expected values', () => {
      const expectedConstants = {
        WIDGET_NAME: 'QuickFind',
        WIDGET_ID: 'time-tracking-ui/quickFind',
      };

      expect(QUICK_FIND_CONSTANTS).toEqual(expectedConstants);
    });
  });
});
