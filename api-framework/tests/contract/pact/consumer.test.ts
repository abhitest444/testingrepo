import { describe, it } from 'vitest';
import { PactV4, MatchersV3 } from '@pact-foundation/pact';
import assert from 'node:assert/strict';
import path from 'path';

/**
 * Pact Consumer Contract — defines what the frontend expects from the Booking API.
 *
 * Uses PactV4 with matchers for type-based matching.
 * The provider verification (provider.test.ts) checks the real API
 * against these contracts.
 *
 * Key principle: match on structure and types, not exact values.
 * The real API returns different data each time — that's expected.
 */

const { like, integer, boolean, string } = MatchersV3;

const provider = new PactV4({
  consumer: 'PlaywrightE2E-Frontend',
  provider: 'RestfulBooker-API',
  dir: path.resolve(__dirname, '../../../pacts'),
  logLevel: 'warn',
});

describe('Pact consumer contracts — Booking API', () => {
  describe('GET /booking/:id', () => {
    it('returns a booking with the expected structure', async () => {
      await provider
        .addInteraction()
        .given('a booking exists')
        .uponReceiving('a request for a booking')
        .withRequest('GET', '/booking/1', (builder) => {
          builder.headers({ Accept: 'application/json' });
        })
        .willRespondWith(200, (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody({
              firstname: like('Sally'),
              lastname: like('Broccoli'),
              totalprice: integer(111),
              depositpaid: boolean(true),
              bookingdates: like({
                checkin: like('2013-02-23'),
                checkout: like('2014-10-23'),
              }),
            });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/booking/1`, {
            headers: { Accept: 'application/json' },
          });
          assert.equal(response.status, 200);
          const body = await response.json();
          assert.equal(typeof body.firstname, 'string');
          assert.equal(typeof body.lastname, 'string');
          assert.equal(typeof body.totalprice, 'number');
          assert.equal(typeof body.depositpaid, 'boolean');
          assert.ok(body.bookingdates, 'bookingdates should exist');
        });
    });

    it('returns 404 when booking does not exist', async () => {
      await provider
        .addInteraction()
        .given('no booking with ID 99999 exists')
        .uponReceiving('a request for a non-existent booking')
        .withRequest('GET', '/booking/99999', (builder) => {
          builder.headers({ Accept: 'application/json' });
        })
        .willRespondWith(404, (builder) => {
          builder.headers({});
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/booking/99999`, {
            headers: { Accept: 'application/json' },
          });
          assert.equal(response.status, 404);
        });
    });
  });

  describe('POST /booking', () => {
    it('creates a booking and returns the created resource', async () => {
      await provider
        .addInteraction()
        .given('the API is available')
        .uponReceiving('a request to create a new booking')
        .withRequest('POST', '/booking', (builder) => {
          builder
            .headers({
              Accept: 'application/json',
              'Content-Type': 'application/json',
            })
            .jsonBody({
              firstname: 'Jim',
              lastname: 'Brown',
              totalprice: 111,
              depositpaid: true,
              bookingdates: {
                checkin: '2018-01-01',
                checkout: '2019-01-01',
              },
              additionalneeds: 'Breakfast',
            });
        })
        .willRespondWith(200, (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody({
              bookingid: integer(1),
              booking: like({
                firstname: like('Jim'),
                lastname: like('Brown'),
                totalprice: integer(111),
                depositpaid: boolean(true),
                bookingdates: like({
                  checkin: like('2018-01-01'),
                  checkout: like('2019-01-01'),
                }),
              }),
            });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/booking`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firstname: 'Jim',
              lastname: 'Brown',
              totalprice: 111,
              depositpaid: true,
              bookingdates: {
                checkin: '2018-01-01',
                checkout: '2019-01-01',
              },
              additionalneeds: 'Breakfast',
            }),
          });
          assert.equal(response.status, 200);
          const body = await response.json();
          assert.equal(typeof body.bookingid, 'number');
          assert.ok(body.bookingid > 0, 'bookingid should be positive');
          assert.ok(body.booking, 'booking object should exist');
          assert.equal(typeof body.booking.firstname, 'string');
        });
    });
  });

  describe('POST /auth', () => {
    it('returns a token for valid credentials', async () => {
      await provider
        .addInteraction()
        .given('valid credentials are provided')
        .uponReceiving('a request to authenticate')
        .withRequest('POST', '/auth', (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody({
              username: 'admin',
              password: 'password123',
            });
        })
        .willRespondWith(200, (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody({
              token: string('abc123def456'),
            });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'admin',
              password: 'password123',
            }),
          });
          assert.equal(response.status, 200);
          const body = await response.json();
          assert.equal(typeof body.token, 'string');
          assert.ok(body.token.length > 0, 'token should not be empty');
        });
    });

    it('returns failure reason for bad credentials', async () => {
      await provider
        .addInteraction()
        .given('invalid credentials are provided')
        .uponReceiving('a request to authenticate with bad credentials')
        .withRequest('POST', '/auth', (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody({
              username: 'admin',
              password: 'wrong',
            });
        })
        .willRespondWith(200, (builder) => {
          builder
            .headers({ 'Content-Type': 'application/json' })
            .jsonBody({
              reason: string('Bad credentials'),
            });
        })
        .executeTest(async (mockServer) => {
          const response = await fetch(`${mockServer.url}/auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'admin',
              password: 'wrong',
            }),
          });
          assert.equal(response.status, 200);
          const body = await response.json();
          assert.equal(typeof body.reason, 'string');
          assert.ok(body.reason.length > 0, 'reason should not be empty');
        });
    });
  });
});
