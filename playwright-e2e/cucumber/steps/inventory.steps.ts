import { Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { PlaywrightWorld } from '../support/world';

When(
  'I sort products by {sortOption}',
  async function (this: PlaywrightWorld, option: 'az' | 'za' | 'lohi' | 'hilo') {
    await this.inventoryPage.sortBy(option);
  },
);

Then(
  'the product names should be sorted {word}',
  async function (this: PlaywrightWorld, direction: string) {
    const names = await this.inventoryPage.getVisibleProductNames();
    const sorted = [...names].sort((a, b) =>
      direction === 'descending' ? b.localeCompare(a) : a.localeCompare(b),
    );
    expect(names).toEqual(sorted);
  },
);
