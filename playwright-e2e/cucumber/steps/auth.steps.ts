import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import type { UserCredentials } from '../../src/data/users';
import type { PlaywrightWorld } from '../support/world';

Given('I am on the login page', async function (this: PlaywrightWorld) {
  await this.loginPage.open();
});

Given(
  'I am logged in as a {userRole} user',
  async function (this: PlaywrightWorld, credentials: UserCredentials) {
    await this.loginPage.open();
    await this.loginPage.login(credentials);
    await this.inventoryPage.expectLoaded();
  },
);

Given('I am on the products page', async function (this: PlaywrightWorld) {
  await this.inventoryPage.expectLoaded();
});

When(
  'I log in as a {userRole} user',
  async function (this: PlaywrightWorld, credentials: UserCredentials) {
    await this.loginPage.login(credentials);
  },
);

When(
  'I attempt to log in with username {string} and password {string}',
  async function (this: PlaywrightWorld, username: string, password: string) {
    await this.loginPage.login({ username, password });
  },
);

Then('I should see the products page', async function (this: PlaywrightWorld) {
  await this.inventoryPage.expectLoaded();
});

Then('I should remain on the login page', async function (this: PlaywrightWorld) {
  await this.loginPage.expectStillOnLogin();
});

Then(
  'I should see a login error containing {string}',
  async function (this: PlaywrightWorld, message: string) {
    await this.loginPage.expectErrorContains(message);
  },
);

// Keep expect available for thin assertion steps that don't belong on a page object.
Then('the page URL should contain {string}', async function (this: PlaywrightWorld, fragment: string) {
  await expect(this.page).toHaveURL(new RegExp(fragment));
});
