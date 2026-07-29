import { defaults, commonThresholds } from '../lib/config.js';
import { pizzaJourney } from '../lib/journey.js';

/**
 * Stress — higher peak than load. Expects more degradation; thresholds are looser.
 * Answers: "Where does the system start to struggle?"
 *
 * Keep peaks modest against the public QuickPizza demo.
 */
export const options = {
  stages: defaults.stressStages,
  thresholds: {
    ...commonThresholds,
    http_req_failed: ['rate<0.2'],
    http_req_duration: ['p(95)<4000'],
  },
  summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export default function stress() {
  pizzaJourney();
}
