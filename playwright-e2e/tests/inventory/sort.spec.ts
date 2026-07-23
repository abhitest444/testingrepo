import { expect, test } from '../../src/fixtures/test.fixture';

test.describe('Inventory sorting', () => {
  test('sorts products A to Z and Z to A', async ({ authenticatedPage }) => {
    await authenticatedPage.sortBy('az');
    const ascending = await authenticatedPage.getVisibleProductNames();
    expect([...ascending].sort((a, b) => a.localeCompare(b))).toEqual(ascending);

    await authenticatedPage.sortBy('za');
    const descending = await authenticatedPage.getVisibleProductNames();
    expect([...descending].sort((a, b) => b.localeCompare(a))).toEqual(descending);
  });
});
