import { defaults, commonThresholds } from '../lib/config.js';
import { pizzaJourney } from '../lib/journey.js';

/**
 * Load — ramps virtual users, asserts SLA-ish thresholds.
 * Answers: "Does p95 stay acceptable under moderate traffic?"
 */
export const options = {
  stages: defaults.loadStages,
  thresholds: {
    ...commonThresholds,
    http_req_failed: ['rate<0.08'],
    // Gate on p95 (SLA). p99 on a shared public demo can spike from cold TLS/outliers.
    http_req_duration: ['p(95)<1500'],
    checks: ['rate>0.9'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function load() {
  pizzaJourney();
}
