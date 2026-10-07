import {
  buildPreliminaryNote,
  getCamrTestData,
} from './config';
import { test } from './fixtures/camr.fixture';

test.describe('CAMR Sent to EMR', () => {
  test('updates preliminary note for a queued patient report', async ({
    authenticatedCamr,
    camrPatientReportPage,
  }) => {
    const { patientRowMatch, notePrefix } = getCamrTestData();
    const note = buildPreliminaryNote(notePrefix);

    await authenticatedCamr.openQueue();
    await authenticatedCamr.openPatientReport(patientRowMatch);
    await camrPatientReportPage.setPreliminaryNote(note);
    await camrPatientReportPage.expectPreliminaryNote(note);
  });
});
