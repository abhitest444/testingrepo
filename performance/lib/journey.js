import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, pizzaToken } from '../lib/config.js';
import { getJson, postJson, think } from '../lib/http.js';

/**
 * Shared QuickPizza user journey used by smoke / load / stress.
 */
export function pizzaJourney() {
  const root = baseUrl();

  const health = http.get(`${root}/healthz`, { tags: { name: 'healthz' } });
  check(health, {
    'healthz is 200': (r) => r.status === 200,
  });

  think(0.1, 0.4);

  const quotes = getJson(`${root}/api/quotes`, { name: 'quotes' });
  check(quotes, {
    'quotes is 200': (r) => r.status === 200,
  });

  think(0.2, 0.6);

  const pizza = postJson(
    `${root}/api/pizza`,
    {
      maxCaloriesPerSlice: 1000,
      mustBeVegetarian: false,
      excludedIngredients: [],
      excludedTools: [],
      maxNumberOfToppings: 4,
      minNumberOfToppings: 2,
    },
    { name: 'recommend_pizza' },
    { Authorization: `Token ${pizzaToken()}` },
  );

  check(pizza, {
    'pizza recommendation ok': (r) => r.status === 200,
    'pizza has name': (r) => {
      try {
        const body = r.json();
        return Boolean(body && (body.pizza?.name || body.name));
      } catch {
        return false;
      }
    },
  });

  think();
}
