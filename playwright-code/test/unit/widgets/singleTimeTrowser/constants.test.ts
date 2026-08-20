import {
  SINGLE_TIME_ENTRY_WIDGET_ID,
  TOAST_TYPES,
} from 'src/js/widgets/singleTimeTrowser/constants';

describe('Single Time Trowser Constants', () => {
  it('should have the correct widget ID', () => {
    expect(SINGLE_TIME_ENTRY_WIDGET_ID).toBe(
      'time-tracking-ui/singleTimeEntryTrowser',
    );
  });
});

describe('TOAST_TYPES', () => {
  it('should have the correct toast types', () => {
    expect(TOAST_TYPES).toEqual({
      SAVE: 'save',
      DELETE: 'delete',
      SAVE_AND_COPY: 'saveAndCopy',
      FEEDBACK: 'feedback',
    });
  });
});
