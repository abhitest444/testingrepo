import {
  isLockedByCompanySdk,
  resolveTimesheetPermission,
} from 'src/js/widgets/userSettings/components/cards/PermissionsCard/utils/resolveTimesheetPermission';

describe('resolveTimesheetPermission', () => {
  it('forces true when company SDK grant is enabled', () => {
    expect(resolveTimesheetPermission(true, false)).toBe(true);
    expect(resolveTimesheetPermission(true, true)).toBe(true);
  });

  it('uses worker API value when company SDK grant is disabled', () => {
    expect(resolveTimesheetPermission(false, true)).toBe(true);
    expect(resolveTimesheetPermission(false, false)).toBe(false);
  });
});

describe('isLockedByCompanySdk', () => {
  it('reflects company SDK grant state', () => {
    expect(isLockedByCompanySdk(true)).toBe(true);
    expect(isLockedByCompanySdk(false)).toBe(false);
  });
});
