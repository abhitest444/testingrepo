import fs from 'node:fs';
import path from 'node:path';
import { SalesforceCredentials, SalesforceLeadData } from './types';

const DEFAULT_LOGIN_URL =
  'https://orgfarm-0ef5a0e35f-dev-ed.develop.my.salesforce.com';

loadDotEnv();

export function getSalesforceLoginUrl(): string {
  return process.env.SF_LOGIN_URL?.trim() || DEFAULT_LOGIN_URL;
}

export function getSalesforceLightningUrl(): string {
  return (
    process.env.SF_LIGHTNING_URL?.trim() ||
    'https://orgfarm-0ef5a0e35f-dev-ed.develop.lightning.force.com'
  );
}

export function getSalesforceCredentials(): SalesforceCredentials {
  const username = process.env.SF_USERNAME?.trim();
  const password = process.env.SF_PASSWORD?.trim();
  const securityToken = process.env.SF_SECURITY_TOKEN?.trim();

  if (!username || !password) {
    throw new Error(
      'Set SF_USERNAME and SF_PASSWORD (or copy .env.example to .env) before running Salesforce tests.',
    );
  }

  return { username, password, securityToken };
}

export function getSalesforceLeadData(): SalesforceLeadData {
  const stamp = Date.now();
  return {
    firstName: process.env.SF_LEAD_FIRST_NAME?.trim() || 'QA',
    lastName:
      process.env.SF_LEAD_LAST_NAME?.trim() || `Showcase ${stamp}`,
    company:
      process.env.SF_LEAD_COMPANY?.trim() || `Playwright ${stamp}`,
  };
}

function loadDotEnv(): void {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
