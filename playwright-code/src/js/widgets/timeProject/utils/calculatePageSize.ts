export const LARGE_PAGE_SIZE = 20;
export const SMALL_PAGE_SIZE = 6;
export const HEIGHT_THRESHOLD = 1024;

export const getPageSize = (clientHeight: number): number =>
  clientHeight > HEIGHT_THRESHOLD ? LARGE_PAGE_SIZE : SMALL_PAGE_SIZE;
