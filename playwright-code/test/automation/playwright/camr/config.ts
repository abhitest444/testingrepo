import { CamrCredentials, CamrTestData } from './types';

const DEFAULT_BASE_URL = 'http://115.166.142.154:4206';

export function getCamrBaseUrl(): string {
  return process.env.CAMR_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

export function getCamrCredentials(): CamrCredentials {
  const username = process.env.CAMR_USERNAME?.trim();
  const password = process.env.CAMR_PASSWORD?.trim();
  const clinicName = process.env.CAMR_CLINIC_NAME?.trim();

  if (!username || !password || !clinicName) {
    throw new Error(
      'Set CAMR_USERNAME, CAMR_PASSWORD, and CAMR_CLINIC_NAME before running CAMR tests.',
    );
  }

  return { username, password, clinicName };
}

export function getCamrTestData(): CamrTestData {
  return {
    patientRowMatch:
      process.env.CAMR_PATIENT_ROW_MATCH?.trim() || 'Test881',
    notePrefix:
      process.env.CAMR_NOTE_PREFIX?.trim() || 'Test Note updated',
  };
}

/** Unique note body so parallel runs and reruns do not collide on stale text. */
export function buildPreliminaryNote(prefix: string): string {
  return `${prefix} — ${new Date().toISOString()}`;
}
