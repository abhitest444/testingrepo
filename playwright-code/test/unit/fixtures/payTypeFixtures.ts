export interface MockPayType {
  id: string;
  employerCompensation: { name: string; type: { value: string } };
  active: boolean;
}

export const createMockPayType = (
  id: string,
  name: string,
  typeValue: string,
  overrides?: Partial<MockPayType>,
): MockPayType => ({
  id,
  employerCompensation: { name, type: { value: typeValue } },
  active: true,
  ...overrides,
});

/** Canonical list of 11 pay types covering all common compensation categories. */
export const mockPayTypes: MockPayType[] = [
  createMockPayType('1', 'Hourly', 'HOURLY_PAY'),
  createMockPayType('2', 'Salary', 'SALARY'),
  createMockPayType('3', 'Vacation Pay', 'VACATION_PAY'),
  createMockPayType('4', 'Sick Pay', 'SICK_PAY'),
  createMockPayType('5', 'Holiday Pay', 'HOLIDAY_PAY'),
  createMockPayType('6', 'Bereavement Pay', 'BEREAVEMENT_PAY'),
  createMockPayType('7', 'Unpaid Time Off', 'UNPAID_TIME_OFF'),
  createMockPayType('8', 'Custom 1', 'CUSTOM_1'),
  createMockPayType('9', 'Paid Time Off', 'PAID_TIME_OFF'),
  createMockPayType(
    '10',
    'Employee National Paid Sick Leave',
    'EMPLOYEE_NATL_PAID_SICK_LEAVE',
  ),
  createMockPayType(
    '11',
    'Family National Paid Sick Leave',
    'FAMILY_NATL_PAID_SICK_LEAVE',
  ),
];
