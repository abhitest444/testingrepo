import {
  getPageSize,
  LARGE_PAGE_SIZE,
  SMALL_PAGE_SIZE,
  HEIGHT_THRESHOLD,
} from 'src/js/widgets/timeProject/utils/calculatePageSize';

describe('getPageSize', () => {
  it('returns LARGE_PAGE_SIZE when client height is above the threshold', () => {
    expect(getPageSize(1025)).toBe(LARGE_PAGE_SIZE);
    expect(getPageSize(1080)).toBe(LARGE_PAGE_SIZE);
    expect(getPageSize(2000)).toBe(LARGE_PAGE_SIZE);
  });

  it('returns SMALL_PAGE_SIZE when client height is at or below the threshold', () => {
    expect(getPageSize(1024)).toBe(SMALL_PAGE_SIZE);
    expect(getPageSize(600)).toBe(SMALL_PAGE_SIZE);
    expect(getPageSize(0)).toBe(SMALL_PAGE_SIZE);
  });

  it('exports expected constant values', () => {
    expect(LARGE_PAGE_SIZE).toBe(20);
    expect(SMALL_PAGE_SIZE).toBe(6);
    expect(HEIGHT_THRESHOLD).toBe(1024);
  });
});
