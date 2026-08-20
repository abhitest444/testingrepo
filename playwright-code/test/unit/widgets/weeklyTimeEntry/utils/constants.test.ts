import { WEEKLY_TIME_ENTRY_WIDGET_ID } from '../../../../../src/js/widgets/weeklyTimeEntry/utils/constants';

describe('constants', () => {
  describe('WEEKLY_TIME_ENTRY_WIDGET_ID', () => {
    it('should export the correct widget ID', () => {
      expect(WEEKLY_TIME_ENTRY_WIDGET_ID).toBe(
        'time-tracking-ui/weeklyTimeEntryTrowser',
      );
    });
  });
});
