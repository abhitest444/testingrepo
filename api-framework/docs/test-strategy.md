# API Framework — Test Strategy

## Suite split

| Suite | Command | Intent |
| --- | --- | --- |
| Contract | `npm run test:contract` | Zod schema validation for auth + booking payloads |
| Lifecycle | (in `npm test`) | Create → read → update → delete with cleanup |
| Negative | `npm run test:negative` | 404 / invalid body / missing-or-bad token |
| Smoke | `npm run test:smoke` | Fast subset tagged `@smoke` |

## Risk model

| Risk | Coverage |
| --- | --- |
| Response contract drift | Zod `safeParse` on auth + booking bodies |
| Broken auth | Valid token vs `{ reason: Bad credentials }` quirk |
| Broken authorization | PUT/DELETE without token or with garbage token |
| Resource leaks on shared API | `BookingJanitor` deletes tracked IDs after each test |
| Silent 404s | Explicit `getRaw` status asserts |

## CI gate

PR job: `npm ci` → `npm run lint` → `npm test` against Restful Booker.

Public demo API flakiness is possible; keep suites small and idempotent.
