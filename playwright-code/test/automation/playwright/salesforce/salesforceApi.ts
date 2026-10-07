import { APIRequestContext } from '@playwright/test';
import { SalesforceLeadData, SalesforceSoapSession } from './types';

const API_VERSION = 'v61.0';

export default class SalesforceApi {
  constructor(
    private readonly request: APIRequestContext,
    readonly session: SalesforceSoapSession,
  ) {}

  async createLead(lead: SalesforceLeadData): Promise<string> {
    const response = await this.request.post(
      `${this.session.instanceUrl}/services/data/${API_VERSION}/sobjects/Lead`,
      {
        headers: this.headers(),
        data: {
          FirstName: lead.firstName,
          LastName: lead.lastName,
          Company: lead.company,
          Status: 'Open - Not Contacted',
        },
        timeout: 15_000,
      },
    );
    const body = (await response.json()) as { id?: string; message?: string };
    if (!response.ok() || !body.id) {
      throw new Error(
        `Salesforce API could not create the Lead: ${JSON.stringify(body)}`,
      );
    }
    return body.id;
  }

  async cleanupLeadConversion(lead: SalesforceLeadData): Promise<void> {
    const lastName = soql(lead.lastName);
    const company = soql(lead.company);

    const opportunities = await this.queryIds(
      `SELECT Id FROM Opportunity WHERE Account.Name = '${company}'`,
    );
    const contacts = await this.queryIds(
      `SELECT Id FROM Contact WHERE LastName = '${lastName}' AND Account.Name = '${company}'`,
    );
    const accounts = await this.queryIds(
      `SELECT Id FROM Account WHERE Name = '${company}'`,
    );
    const leads = await this.queryIds(
      `SELECT Id FROM Lead WHERE LastName = '${lastName}' AND Company = '${company}'`,
    );

    await this.deleteAll('Opportunity', opportunities);
    await this.deleteAll('Contact', contacts);
    await this.deleteAll('Account', accounts);
    await this.deleteAll('Lead', leads);
  }

  private async queryIds(soqlQuery: string): Promise<string[]> {
    const url = `${this.session.instanceUrl}/services/data/${API_VERSION}/query?q=${encodeURIComponent(soqlQuery)}`;
    const response = await this.request.get(url, {
      headers: this.headers(),
      timeout: 15_000,
    });

    if (!response.ok()) {
      return [];
    }

    const body = (await response.json()) as { records?: { Id: string }[] };
    return (body.records ?? []).map((record) => record.Id);
  }

  private async deleteAll(sobject: string, ids: string[]): Promise<void> {
    for (const id of ids) {
      await this.request
        .delete(
          `${this.session.instanceUrl}/services/data/${API_VERSION}/sobjects/${sobject}/${id}`,
          { headers: this.headers(), timeout: 15_000 },
        )
        .catch(() => undefined);
    }
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.session.sessionId}`,
      'Content-Type': 'application/json',
    };
  }
}

function soql(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}
