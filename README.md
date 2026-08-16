# Vox

Vox is a mobile-first, installable voice agent for X Layer. Raw microphone audio is interpreted by Gemini, converted to validated financial intent, and passed into deterministic quoting, policy, and transaction code. Model output never supplies token addresses or arbitrary calldata.

## Current status

The foundation includes the PWA interface, direct Gemini audio endpoint, typed conversational state machine, X Layer balance reads, deterministic token/amount resolution, swap-provider boundary, testnet AMM, and a minimal owner-controlled smart account with scoped session authorization. The contracts below are live on X Layer Testnet.

| Contract | Address |
|---|---|
| Vox Test Ether (`tETH`) | `0x61ae26d50f87eed5403a6be8f173f4da55c99bcf` |
| Vox Test USD Coin (`tUSDC`) | `0xc286b5ddba9ceed6a295d432f1aae16418b93bac` |
| Vox Testnet AMM | `0x6e1861dc468be192e9f6aad391b188168ced68fc` |
| Vox Session Account | `0x576a6fc07724d6cf1e4a9a154f0e28f9a2940b24` |

These are hackathon test contracts, not representations of real ETH or USDC. The AMM derives quotes from real onchain reserves and executes real testnet transactions. It is displayed as “Vox Testnet AMM,” never OKX DEX.

## Local setup

Requirements: Node.js 22+ and npm.

1. Copy `.env.example` to `.env.local`.
2. Add a Gemini API key and a fresh disposable X Layer Testnet wallet.
3. Fund that wallet with testnet OKB from the [official faucet](https://web3.okx.com/en/xlayer/faucet).
4. Run `npm install`, then `npm run dev`.
5. Open `http://localhost:3000` and grant microphone access.

Never use a wallet containing real funds. `.env.local` is ignored. The development key is used only by server-side deployment/test scripts and is not the end-user owner architecture.

## Environment

```text
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3-flash-preview
VOX_DEV_WALLET_ADDRESS=
VOX_DEV_WALLET_PRIVATE_KEY=
VOX_SESSION_PRIVATE_KEY=
OKX_API_KEY=
OKX_SECRET_KEY=
OKX_API_PASSPHRASE=
XLAYER_TESTNET_RPC_URL=https://testrpc.xlayer.tech/terigon
```

Only the first three entries represented in `.env.example` are required for the current build. Model and RPC have safe defaults. No variable containing a secret may use a `NEXT_PUBLIC_` prefix.

## Architecture and security

- `POST /api/voice/turn` accepts a supported audio file up to 12 MB and optional conversation/wallet identifiers.
- Gemini produces schema-constrained intent. Zod validates it again at the trust boundary.
- Plan modifications always create a new plan ID/revision and return to confirmation. A leading “yes” cannot approve added or changed actions.
- The token registry is the only source of token addresses.
- `SwapProvider` separates quoting/building from conversational interpretation.
- `VoxSessionAccount` restricts the session signer by chain (signature domain), target, selector, expiry, per-call native value, aggregate native value, nonce, and revocation state. The owner retains direct execution and revocation.
- Raw audio and owner keys are not persisted by the app. The in-memory conversation store is intentionally single-instance and ephemeral.

The testnet account enforces the chain/signature domain, route target, function selector, expiry, nonce, revocation, per-call native value, and aggregate native value. The deterministic server restricts tokens and amounts. ERC-20 ceilings must move into an audited calldata-aware onchain policy module before mainnet. The testnet session signer is a separate server environment secret; production must replace environment-held key material with an encrypted KMS/HSM signer. Plaintext browser storage is explicitly unsupported.

## Onchain validation evidence

The reproducible `npm run contracts:verify-session` suite proved the required policy matrix on X Layer Testnet:

- Permitted delegated swap without a fresh owner signature: `0x9315fe3c0a2a34f05f369f1d10e4501f6390877a5dd3d416e09556465bd907f0`
- Session configuration: `0x8e5df4571d62a6774d44b4bf6cde739f6e6962be02121f7d5be9b01531307255`
- Short-lived session used for expiry rejection: `0x7e582324c78f58ad1fdb2532b138b65a0f5ac0cac440b48253935d9f17dbcf14`
- Revocation: `0x6bb1dab664035389feb1e542ddc21b88292c16e5830d4e4986da6e28f168d9c8`
- Owner recovery/control: `0x4317eeb9a1d99b6cbdd19afbb4141184e975863eb1cc7790efc77a259ea78deb`
- Separate execution-engine delegated swap: `0x9bf24183562ce6f39e31106f4e77f754a11c14171cdab6ad60d68b0e578a38b5`

Over-limit, disallowed-target, disallowed-function, expired, and revoked calls were simulated and rejected before submission, so they correctly have no transaction hash.

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
npm run contracts:compile
npm run contracts:deploy
npm run contracts:verify-session
npm run test:testnet-execution
```

`contracts:deploy` performs real X Layer Testnet writes and validates that the configured private key matches the configured address.

## X Layer Testnet

- Chain ID: `1952`
- Native gas token: testnet OKB
- RPC: `https://testrpc.xlayer.tech/terigon`
- Explorer: `https://www.okx.com/web3/explorer/xlayer-test`

## Apple Shortcut

Follow [docs/APPLE-SHORTCUT.md](docs/APPLE-SHORTCUT.md). The Shortcut is the zero-touch Action Button client; the installed PWA is the visual control center.

## Deployment

For Vercel, import the repository, add server-only environment variables, and deploy as a Next.js project. Use durable, encrypted persistence before relying on multi-turn state across serverless instances. Set the Shortcut endpoint to the deployed HTTPS URL.

## Mainnet migration

1. Replace test contracts and registry entries with audited canonical mainnet assets.
2. Add the four server-only OKX credentials and verify chain `196` against the live supported-chain endpoint.
3. Enable `OkxSwapProvider`; never silently fall back or mislabel routing.
4. Replace the minimal session account with an audited account/module and KMS- or passkey-backed authorization.
5. Add durable encrypted state, distributed rate limiting, monitoring, independent audits, and transaction simulation.
6. Run the complete policy and transaction suite on a fork and limited-value production account.

## Known limitations

- Conversation and activity persistence is in-memory and not suitable for multi-instance production.
- OKX DEX is deliberately disabled on X Layer Testnet because official testnet routing support was not verified. The authenticated mainnet adapter is implemented, but the current build environment receives an OKX regional-access denial when probing the API.
- This hackathon deployment supports its configured disposable owner wallet and one deployed demo smart account; a general per-user factory is a mainnet-hardening task.
- Test assets are openly mintable and have no value. They exist only to demonstrate real quotes and real state transitions where public testnet liquidity is unavailable.
- Rate limiting is instance-local; production requires a distributed limiter.
