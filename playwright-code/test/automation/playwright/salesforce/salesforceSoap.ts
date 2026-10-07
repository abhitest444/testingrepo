import { APIRequestContext } from '@playwright/test';
import { SalesforceCredentials, SalesforceSoapSession } from './types';

const SOAP_LOGIN_URL = 'https://login.salesforce.com/services/Soap/u/61.0';

export async function soapLogin(
  request: APIRequestContext,
  credentials: SalesforceCredentials,
): Promise<SalesforceSoapSession> {
  const password = credentials.securityToken
    ? `${credentials.password}${credentials.securityToken}`
    : credentials.password;

  const response = await request.post(SOAP_LOGIN_URL, {
    headers: {
      'Content-Type': 'text/xml; charset=UTF-8',
      SOAPAction: 'login',
    },
    data: soapLoginEnvelope(credentials.username, password),
  });

  const xml = await response.text();
  const fault = xml.match(/<faultstring>([^<]+)<\/faultstring>/i)?.[1];

  if (!response.ok() || fault || xml.includes('INVALID_LOGIN')) {
    const error = new Error(
      `Salesforce API login failed${fault ? `: ${fault}` : ` (${response.status()})`}.`,
    ) as Error & { soapDisabled?: boolean };
    error.soapDisabled = /SOAP API login\(\) is disabled/i.test(fault || xml);
    throw error;
  }

  const sessionId = xml.match(/sessionId>([^<]+)/)?.[1];
  const serverUrl = xml.match(/serverUrl>([^<]+)/)?.[1];
  if (!sessionId || !serverUrl) {
    throw new Error('Salesforce API login did not return a session.');
  }

  return {
    sessionId,
    instanceUrl: new URL(serverUrl).origin,
  };
}

export function frontdoorUrl(session: SalesforceSoapSession): string {
  const retUrl = encodeURIComponent('/lightning/page/home');
  const sid = encodeURIComponent(session.sessionId);
  return `${session.instanceUrl}/secur/frontdoor.jsp?sid=${sid}&retURL=${retUrl}`;
}

function soapLoginEnvelope(username: string, password: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<env:Envelope xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:env="http://schemas.xmlsoap.org/soap/envelope/">
  <env:Body>
    <n1:login xmlns:n1="urn:partner.soap.sforce.com">
      <n1:username>${escapeXml(username)}</n1:username>
      <n1:password>${escapeXml(password)}</n1:password>
    </n1:login>
  </env:Body>
</env:Envelope>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
