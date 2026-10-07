export interface CamrCredentials {
  username: string;
  password: string;
  clinicName: string;
}

export interface CamrTestData {
  /** Partial text used to locate the patient row in the Sent to EMR queue. */
  patientRowMatch: string;
  /** Prefix for the preliminary note; a timestamp is appended at runtime. */
  notePrefix: string;
}
