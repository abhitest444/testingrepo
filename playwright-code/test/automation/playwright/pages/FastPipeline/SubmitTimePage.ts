import { Page, Locator, expect } from '@playwright/test';
import { clickAddTimeDropdown } from '../../commonUtils';

/**
 * Page object for the "Submit Time" experience in WFS (QBO Time entries).
 *
 * Covers the "Submit time" option in the Add time dropdown, the Submit time
 * trowser/drawer, its date picker and Submit/Cancel buttons, and the
 * "Before you submit" confirmation modal.
 *
 * Selectors prefer the stable data-testids emitted by the SubmitTimePanel /
 * SubmitTimeConfirmationModal components and fall back to the visible copy so
 * the object keeps working across shell builds.
 */
export const SUBMIT_TIME_LABELS = {
  addTimeOption: 'Submit time',
  panelHeader: 'Submit time',
  panelDescription:
    'Submit unapproved time up to a chosen date for the past month. Time submissions will be for the entire week of the selected date.',
  datePickerLabel: 'Submit through',
  confirmationTitle: 'Before you submit',
  confirmationMessage:
    'By submitting your timesheets you agree that they are complete and accurate.',
  // Partial match for: "... is locked because it's been submitted or approved.
  // Please unsubmit or have a manager unapprove the day and try again."
  lockedForSubmissionError: 'lease unsubmit or have',
};

class SubmitTimePage {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ---------------------------------------------------------------------------
  // Add time dropdown
  // ---------------------------------------------------------------------------

  getSubmitTimeOption(): Locator {
    return this.page
      .getByRole('option', { name: SUBMIT_TIME_LABELS.addTimeOption })
      .or(
        this.page.getByText(SUBMIT_TIME_LABELS.addTimeOption, { exact: true }),
      )
      .first();
  }

  /** Assert the "Submit time" option is present inside the Add time dropdown. */
  async validateSubmitTimeOptionPresent(): Promise<void> {
    await expect(this.getSubmitTimeOption()).toBeVisible({ timeout: 30000 });
  }

  /** Open the Add time dropdown and click the "Submit time" option. */
  async openSubmitTimePanel(): Promise<void> {
    await clickAddTimeDropdown(this.page);
    await this.page.waitForTimeout(1000);
    await this.getSubmitTimeOption().click();
    await this.expectPanelVisible();
  }

  // ---------------------------------------------------------------------------
  // Submit time trowser (drawer)
  // ---------------------------------------------------------------------------

  get panel(): Locator {
    return this.page
      .getByTestId('submit-time-panel')
      .or(
        this.page.getByRole('heading', {
          name: SUBMIT_TIME_LABELS.panelHeader,
        }),
      )
      .first();
  }

  get panelDescription(): Locator {
    return this.page
      .getByTestId('submit-time-panel-description')
      .or(this.page.getByText(SUBMIT_TIME_LABELS.panelDescription))
      .first();
  }

  get datePicker(): Locator {
    // Prefer the stable testid, but fall back to the "Submit through" label /
    // IDS date input / label text so validation still works when the deployed
    // build doesn't emit the testid.
    return this.page
      .getByTestId('submit-through-date-picker')
      .or(this.page.getByLabel(SUBMIT_TIME_LABELS.datePickerLabel))
      .or(this.page.locator('input[id^="IDSDatePickerInput"]'))
      .or(this.page.getByText(SUBMIT_TIME_LABELS.datePickerLabel))
      .first();
  }

  get submitButton(): Locator {
    return this.page
      .getByTestId('submit-time-panel-submit-button')
      .or(this.page.getByRole('button', { name: 'Submit', exact: true }))
      .first();
  }

  get cancelButton(): Locator {
    return this.page
      .getByTestId('submit-time-panel-cancel-button')
      .or(this.page.getByRole('button', { name: 'Cancel', exact: true }))
      .first();
  }

  async expectPanelVisible(): Promise<void> {
    await expect(this.panel).toBeVisible({ timeout: 30000 });
  }

  /**
   * Validate the Submit time trowser: header, descriptive copy and the
   * "Submit through" date picker are all shown.
   */
  async validateSubmitTimeTrowser(): Promise<void> {
    await this.expectPanelVisible();
    await expect(
      this.page.getByText(SUBMIT_TIME_LABELS.panelHeader).first(),
    ).toBeVisible();
    await expect(this.panelDescription).toBeVisible();
    await expect(this.datePicker).toBeVisible();
  }

  async isSubmitButtonEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled();
  }

  /** Transient error banner shown when the trowser's summary fetch fails. */
  get summaryErrorBanner(): Locator {
    return this.page
      .getByText(/an error occurred\.?\s*please try again/i)
      .first();
  }

  /**
   * Wait for the Submit-time trowser summary to finish loading and reflect the
   * eligible hours (Submit button becomes enabled).
   *
   * The trowser fetches eligible hours asynchronously and can either still be
   * loading (spinner) or fail with a transient "An error occurred. Please try
   * again." banner — in both cases the summary reads "0h 0m" and Submit stays
   * disabled. Re-selecting the "Submit through" date re-triggers the fetch, so
   * retry a few times before giving up rather than asserting on a fixed wait.
   *
   * @param submitThroughDate date to re-pick when retrying (m/d/yyyy); omit to
   *   re-pick today (the picker default).
   * @returns true once Submit is enabled (non-zero eligible hours loaded).
   */
  async waitForSubmitSummaryReady(
    submitThroughDate?: string,
    {
      retries = 3,
      settleTimeoutMs = 15000,
    }: { retries?: number; settleTimeoutMs?: number } = {},
  ): Promise<boolean> {
    const today = new Date();
    const retryDate =
      submitThroughDate ??
      `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Ready once Submit becomes enabled (eligible hours have loaded).
        await expect(this.submitButton).toBeEnabled({
          timeout: settleTimeoutMs,
        });
        return true;
      } catch {
        const errored = await this.summaryErrorBanner
          .isVisible({ timeout: 1000 })
          .catch(() => false);
        const summary = (await this.getSubmitSummaryText()).toLowerCase();
        console.log(
          `⚠ Submit summary not ready (attempt ${attempt}/${retries}) — ${
            errored ? 'error banner shown' : `summary="${summary || 'empty'}"`
          }`,
        );
        if (attempt === retries) {
          break;
        }
        // Re-pick the date to re-trigger the async eligible-hours fetch.
        await this.selectSubmitThroughDate(retryDate);
        await this.page.waitForTimeout(3000);
      }
    }
    return false;
  }

  /** Summary line under the calendar, e.g. "0h 0m to submit through …". */
  get submitSummary(): Locator {
    return this.page
      .getByTestId('submit-time-panel-summary')
      .or(this.page.getByText(/to submit through/i))
      .first();
  }

  /** Read the summary hours text under the calendar (empty string if absent). */
  async getSubmitSummaryText(): Promise<string> {
    if (
      await this.submitSummary.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      return (await this.submitSummary.textContent())?.trim() ?? '';
    }
    return '';
  }

  /**
   * Whether the summary shows zero eligible time (e.g. "0h 0m" / "0.00"),
   * meaning there is nothing to submit for the selected date.
   *
   * Only the hours portion (before "to submit through …") is inspected — the
   * period label after it contains date digits (day/year) that would otherwise
   * be misread as non-zero hours.
   */
  async isSubmitSummaryZero(): Promise<boolean> {
    const full = (await this.getSubmitSummaryText()).toLowerCase();
    if (!full) return false;
    if (full.includes('to submit through')) {
      const hoursPart = full.split('to submit through')[0];
      // Zero when the hours portion has no non-zero digit (e.g. "0h 0m").
      return !/[1-9]/.test(hoursPart);
    }
    // No period marker — fall back to explicit zero-hours patterns.
    return /\b0h\s*0m\b|\b0\.00\b|\b0\s*hrs?\b/.test(full);
  }

  /**
   * Pick a "Submit through" date. When no date is provided the picker keeps its
   * default (today), which already covers the current week. Date format is
   * m/d/yyyy (e.g. "7/2/2026").
   */
  async selectSubmitThroughDate(date?: string): Promise<void> {
    const input = this.page
      .locator('[data-testid="submit-through-date-picker"] input')
      .or(this.page.getByLabel(SUBMIT_TIME_LABELS.datePickerLabel))
      .or(this.page.locator('input[id^="IDSDatePickerInput"]'))
      .first();
    await input.waitFor({ state: 'visible', timeout: 30000 });
    if (date) {
      await input.click();
      await input.fill(date);
      await this.page.keyboard.press('Enter');
    }
    await this.page.waitForTimeout(500);
  }

  async clickSubmit(): Promise<void> {
    await this.submitButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
    await expect(this.panel).toBeHidden({ timeout: 15000 });
  }

  // ---------------------------------------------------------------------------
  // "Before you submit" confirmation modal
  // ---------------------------------------------------------------------------

  get confirmationModal(): Locator {
    return this.page
      .getByTestId('submit-time-confirmation-modal')
      .or(
        this.page
          .getByRole('dialog')
          .filter({ hasText: SUBMIT_TIME_LABELS.confirmationTitle }),
      )
      .first();
  }

  get confirmationMessage(): Locator {
    return this.page
      .getByTestId('submit-time-confirmation-modal-message')
      .or(this.page.getByText(SUBMIT_TIME_LABELS.confirmationMessage))
      .first();
  }

  get confirmButton(): Locator {
    return this.page
      .getByTestId('submit-time-confirmation-modal-confirm')
      .or(this.page.getByRole('button', { name: 'Confirm', exact: true }))
      .first();
  }

  get confirmationCancelButton(): Locator {
    return this.page
      .getByTestId('submit-time-confirmation-modal-cancel')
      .or(this.page.getByRole('button', { name: 'Cancel', exact: true }))
      .first();
  }

  /** Validate the confirmation modal title and agreement copy. */
  async validateConfirmationDetails(): Promise<void> {
    await expect(this.confirmationModal).toBeVisible({ timeout: 30000 });
    await expect(
      this.page.getByText(SUBMIT_TIME_LABELS.confirmationTitle).first(),
    ).toBeVisible();
    await expect(this.confirmationMessage).toBeVisible();
  }

  async clickConfirm(): Promise<void> {
    await this.confirmButton.click();
    await expect(this.confirmationModal).toBeHidden({ timeout: 30000 });
  }

  async clickCancelConfirmation(): Promise<void> {
    await this.confirmationCancelButton.click();
  }

  // ---------------------------------------------------------------------------
  // Locked-for-submission validation (submitted/approved entry cannot be edited)
  // ---------------------------------------------------------------------------

  /**
   * Assert the "... is locked because it's been submitted or approved. Please
   * unsubmit or have a manager unapprove the day and try again." message.
   */
  async validateLockedForSubmissionError(): Promise<void> {
    await expect(
      this.page.locator(
        `//*[contains(text(), '${SUBMIT_TIME_LABELS.lockedForSubmissionError}')]`,
      ),
    ).toBeVisible({ timeout: 30000 });
  }
}

export default SubmitTimePage;
