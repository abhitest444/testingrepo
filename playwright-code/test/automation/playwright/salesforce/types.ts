export interface SalesforceCredentials {
  username: string;
  password: string;
  securityToken?: string;
}

export interface SalesforceSoapSession {
  sessionId: string;
  instanceUrl: string;
}

export interface SalesforceLeadData {
  firstName: string;
  lastName: string;
  company: string;
}
