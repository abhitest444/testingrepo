import {
  setWorldConstructor,
  World,
  type IWorldOptions,
} from '@cucumber/cucumber';
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import dotenv from 'dotenv';
import { CartPage } from '../../src/pages/CartPage';
import { InventoryPage } from '../../src/pages/InventoryPage';
import { LoginPage } from '../../src/pages/LoginPage';

dotenv.config();

export type PlaywrightWorldParams = {
  headed?: boolean;
};

/**
 * Custom World wires Playwright + existing Page Objects into Cucumber steps.
 * Interview talking point: World = shared scenario context (DI for BDD).
 */
export class PlaywrightWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
  loginPage!: LoginPage;
  inventoryPage!: InventoryPage;
  cartPage!: CartPage;
  baseURL: string;

  constructor(options: IWorldOptions) {
    super(options);
    this.baseURL = process.env.BASE_URL ?? 'https://www.saucedemo.com';
  }

  async openBrowser(): Promise<void> {
    const headed = process.env.HEADED === 'true' || process.env.HEADED === '1';
    this.browser = await chromium.launch({ headless: !headed });
    this.context = await this.browser.newContext({
      baseURL: this.baseURL,
      viewport: { width: 1280, height: 720 },
    });
    this.page = await this.context.newPage();
    this.loginPage = new LoginPage(this.page);
    this.inventoryPage = new InventoryPage(this.page);
    this.cartPage = new CartPage(this.page);
  }

  async closeBrowser(): Promise<void> {
    await this.context?.close();
    await this.browser?.close();
  }
}

setWorldConstructor(PlaywrightWorld);
