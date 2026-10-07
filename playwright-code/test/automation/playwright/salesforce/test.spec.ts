import { getSalesforceLeadData } from './config';
import { test } from './fixtures/salesforce.fixture';

test.describe('Salesforce Sales Cloud', () => {
  test('converts a Lead to an Account', async ({
    authenticatedSalesforce,
    salesforceApi,
  }) => {
    const lead = getSalesforceLeadData();
    const leadId = await salesforceApi.createLead(lead);

    try {
      await authenticatedSalesforce.openLead(
        leadId,
        `${lead.firstName} ${lead.lastName}`,
      );
      await authenticatedSalesforce.expectLeadOpen(lead);
      await authenticatedSalesforce.convertLead(lead);
      await authenticatedSalesforce.expectAccountOpen(lead.company);
    } finally {
      await salesforceApi.cleanupLeadConversion(lead).catch(() => undefined);
    }
  });
});
