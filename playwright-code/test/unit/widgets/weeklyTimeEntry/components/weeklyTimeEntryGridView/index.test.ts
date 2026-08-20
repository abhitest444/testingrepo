import { DeleteButton } from 'src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryGridView/DeleteButton';
import { CustomerCell } from 'src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryGridView/CustomerCell';
import { DayCell } from 'src/js/widgets/weeklyTimeEntry/components/weeklyTimeEntryGridView/DayCell';

describe('weeklyTimeEntryGridView exports', () => {
  it('exports DeleteButton component', () => {
    expect(DeleteButton).toBeDefined();
    expect(typeof DeleteButton).toBe('function');
  });

  it('exports CustomerCell component', () => {
    expect(CustomerCell).toBeDefined();
    expect(typeof CustomerCell).toBe('function');
  });

  it('exports DayCell component', () => {
    expect(DayCell).toBeDefined();
    expect(typeof DayCell).toBe('function');
  });
});
