import { CamrCredentials, CamrTestData } from './types';

const DEFAULT_BASE_URL = 'http://115.166.142.154:4206';

export function getCamrBaseUrl(): string {
  return process.env.CAMR_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

export function getCamrCredentials(): CamrCredentials {
  return {
    username: process.env.CAMR_USERNAME?.trim() || 'pavan.patidar',
    password: process.env.CAMR_PASSWORD?.trim() || 'Asterix@007',
    clinicName: process.env.CAMR_CLINIC_NAME?.trim() || 'emr',
  };
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
