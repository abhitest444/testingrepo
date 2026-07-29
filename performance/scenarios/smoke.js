import { defaults, commonThresholds } from '../lib/config.js';
import { pizzaJourney } from '../lib/journey.js';

/**
 * Smoke — tiny VU count, short duration.
 * Answers: "Is the service basically healthy right now?"
 */
export const options = {
  vus: defaults.smokeVus,
  duration: defaults.smokeDuration,
  thresholds: {
    ...commonThresholds,
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1200'],
    checks: ['rate>0.9'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function smoke() {
  pizzaJourney();
}
