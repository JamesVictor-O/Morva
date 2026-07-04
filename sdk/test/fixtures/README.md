# Fixtures

`primary-assets-response.json` is **not** a captured real response — this
environment has no funded Particle project/account to call
`getPrimaryAssets()` against. It's constructed to match the exact shape
of the installed SDK's `IAssetsResponse`/`IAsset`/`IChainAggregation`
types (`@particle-network/universal-account-sdk@2.0.3`), verified field
names against `dist/index.d.ts` directly.

Replace this with a real captured response (redact nothing except
amounts/addresses if needed) the first time `scripts/e2e-payment.ts` runs
successfully against mainnet, and delete this note.
