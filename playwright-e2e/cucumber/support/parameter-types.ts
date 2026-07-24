import { defineParameterType } from '@cucumber/cucumber';
import { products, users, type UserCredentials } from '../../src/data/users';

/**
 * Custom parameter types keep step text readable while staying typed.
 * e.g. "standard user" → users.standard
 */
defineParameterType({
  name: 'userRole',
  regexp: /standard|locked|problem/,
  transformer(role: string): UserCredentials {
    if (role === 'standard') return users.standard;
    if (role === 'locked') return users.locked;
    return users.problem;
  },
});

defineParameterType({
  name: 'product',
  regexp: /Sauce Labs Backpack|Sauce Labs Bike Light|Sauce Labs Bolt T-Shirt/,
  transformer(name: string): string {
    const match = Object.values(products).find((p) => p === name);
    if (!match) throw new Error(`Unknown product: ${name}`);
    return match;
  },
});

defineParameterType({
  name: 'sortOption',
  regexp: /A to Z|Z to A|Price \(low to high\)|Price \(high to low\)/,
  transformer(label: string): 'az' | 'za' | 'lohi' | 'hilo' {
    switch (label) {
      case 'A to Z':
        return 'az';
      case 'Z to A':
        return 'za';
      case 'Price (low to high)':
        return 'lohi';
      case 'Price (high to low)':
        return 'hilo';
      default:
        throw new Error(`Unknown sort option: ${label}`);
    }
  },
});
