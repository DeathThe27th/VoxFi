# Vox — TRUE ONE-SHOT BUILD SPECIFICATION

## EXECUTION CONTRACT — READ THIS FIRST

This is a **true one-shot build**.

The project has already gone through an earlier partial preflight/Phase 1 attempt. The user has **already provided Codex with**:

- `GEMINI_API_KEY`
- `VOX_DEV_WALLET_ADDRESS`
- `VOX_DEV_WALLET_PRIVATE_KEY`

Treat those as already supplied. **Do not ask for them again** unless they are genuinely missing from the current workspace/environment or demonstrably invalid.

The development wallet is a fresh disposable wallet funded only with X Layer Testnet OKB. Never use or request a real-funds wallet.

### Your behavior from this point

1. Read this entire file before changing code.
2. Inspect everything already created by the previous attempt. Preserve useful working code; repair or replace bad/incomplete code.
3. Determine what remains missing.
4. Before starting the continuous build, ask the user **once** for any additional blocking credentials/resources you can identify now. The user explicitly permits development credentials to be pasted into the Codex conversation.
5. If OKX credentials have not already been supplied, ask for the exact required OKX values in that single request.
6. Immediately place supplied secrets into `.env.local`, ensure `.env.local` is ignored by Git, and never echo secret values back.
7. **After the user supplies the requested missing items, begin immediately. Do not ask “shall I continue?”, “ready to proceed?”, or request another confirmation.**
8. Build the entire MVP continuously from the current repository state until the completion requirements in this document are satisfied.
9. Internal milestones/sections in this document are an implementation order only. **They are NOT permission gates.** Never stop merely to report “Phase X complete.”
10. Do not send progress-only messages that require user acknowledgement. Keep working.
11. Run builds, typechecks, tests, and integration checks yourself. When something fails, diagnose it, fix it, rerun it, and continue.
12. Research technical blockers yourself using current official documentation when necessary. Do not offload ordinary engineering decisions to the user.
13. If a preferred integration is unavailable on X Layer Testnet, use the documented fallback rules in this specification and continue. Never fake support.
14. Only interrupt the one-shot if there is a **genuine external blocker that cannot be solved from the repository or public documentation**, such as a newly discovered required credential/account action that only the user can provide. If that happens, ask for only that blocker; once supplied, resume automatically without asking for permission again.
15. Do not stop because one feature is difficult. Implement the best real working path allowed by this specification, document any unavoidable limitation, and continue with the rest of the product.
16. Your next normal report after credentials are supplied should be the **final completion report**, unless a genuine user-only blocker occurs.

### Secret handling

- Never commit secrets.
- Never expose server-only credentials in client bundles.
- Never put secrets in README/docs/logs/screenshots/test fixtures.
- Never print the wallet private key, Gemini key, OKX secret, or passphrase back to the user.
- `.env.example` must contain variable names/placeholders only.
- If the prior attempt accidentally committed a secret, remove it from tracked files immediately and warn the user in the final report that rotation is required.

### Definition of “one-shot” for this task

After the one-time missing-requirements request is satisfied, execution should look like:

```text
inspect existing work
→ validate remaining assumptions
→ secure environment
→ scaffold/repair foundation
→ build PWA + UX
→ build Gemini raw-audio agent
→ build conversational state machine
→ build deterministic financial tools
→ integrate X Layer
→ integrate OKX where actually supported
→ implement/test smart account + delegated/session authorization
→ build Shortcut-facing voice API
→ build onboarding/activity/settings/security
→ test real testnet reads/writes
→ run unit/integration tests
→ run typecheck/lint/build
→ fix failures
→ repeat until stable
→ write documentation
→ final completion report
```

No phase-completion stops.

---

## ONE-TIME MISSING-REQUIREMENTS CHECK

Before the continuous build begins, inspect the current workspace and previously supplied environment values.

Verify current official documentation for any still-uncertain infrastructure, especially:

- X Layer Testnet RPC/chain/explorer/native token;
- Gemini audio-capable model and structured output support;
- OKX OnchainOS authentication and **actual X Layer Testnet support for the exact DEX endpoints required**;
- the chosen smart-account/session-key solution on **X Layer Testnet**, not merely X Layer Mainnet.

Then ask the user once for all **currently identifiable blocking missing items**.

Likely OKX values, if not already supplied:

- `OKX_API_KEY`
- `OKX_SECRET_KEY`
- `OKX_API_PASSPHRASE`

Only ask for a smart-account-provider key if you have already verified that the selected provider is actually usable for the required X Layer Testnet path.

Do not require Supabase unless the architecture genuinely needs it. Do not require Vercel credentials for local implementation.

If nothing else is blocking, do not invent requirements: proceed with the values already available.

---

# PROJECT

Build **Vox**, a mobile-first PWA and voice-controlled onchain financial agent for X Layer.

Core concept:

> Speak naturally. Vox understands your financial intent, constructs a real onchain action, reads the plan back to you, accepts conversational follow-up, and executes according to the user’s permissions.

The user should be able to perform common onchain financial actions without navigating a DEX UI.

Examples:

- “Swap $20 worth of ETH to USDC.”
- “Swap half my ETH to USDC.”
- “Get me $100 USDC using ETH.”
- “How much USDC do I have?”
- “What is my portfolio worth?”
- “Send 5 USDC to 0x…”
- “Actually make that $50.”
- “Yes, but swap the USDC to WBTC afterwards.”
- “No, cancel that.”
- “How much ETH would I have left?”
- “Okay, do it.”

The conversation should be natural and stateful. Do not reduce it to rigid commands.

---

# PRIMARY PRODUCT PRINCIPLE

**AI decides what the user means. Deterministic code decides how the transaction happens.**

The LLM/audio model may:

- understand speech;
- understand multilingual input;
- maintain conversational context;
- resolve references such as “that”, “half”, “instead”, “the rest”, “same amount”;
- identify financial intent;
- construct a structured action plan;
- explain the plan;
- request clarification.

The LLM must NOT:

- invent token addresses;
- invent balances;
- invent quotes;
- invent transaction calldata;
- bypass validation;
- sign owner-wallet transactions;
- execute arbitrary contracts.

All financial execution must pass through deterministic validation.

---

# IMPLEMENTATION ORDER — FOUNDATION

Continue automatically after the one-time requirements check is satisfied:

Create a production-quality project using:

- Next.js
- TypeScript
- App Router
- Tailwind CSS
- viem
- wagmi where useful
- a minimal component system such as shadcn/ui only if it improves implementation speed
- Zod for schemas/validation
- Vercel-compatible server routes
- PWA manifest/installability

Keep the dependency count reasonable.

Use strict TypeScript.

No fake functionality.

No placeholder “success” paths that pretend blockchain actions worked.

---

# PRODUCT ARCHITECTURE

Vox has two primary clients:

## A. PWA

The main product UI.

Used for:

- onboarding;
- wallet/smart-account setup;
- voice interaction;
- portfolio/balance view;
- transaction-plan visualization;
- activity;
- settings;
- permission/security controls.

## B. Apple Shortcut voice client

Used for:

- Action Button launch;
- spoken greeting;
- raw audio capture;
- posting audio to Vox API;
- receiving Vox response;
- speaking response with device TTS;
- recording next conversational turn.

Both clients use the same backend conversation/session logic.

Do not create a browser extension in the first MVP unless all required functionality is finished and stable.

---

# USER EXPERIENCE

## Onboarding

Build a simple onboarding flow:

1. Welcome
2. Connect owner wallet
3. Create/configure Vox smart account
4. Configure voice authorization/session permissions
5. Fund smart account if required
6. Ready

Visual language:
- minimal;
- modern;
- mobile-first;
- no gradients;
- no generic neon Web3 dashboard;
- no clutter.

## Voice Authorization setup

Expose controls such as:

- Voice transactions ON/OFF
- maximum voice-authorized amount
- daily/aggregate limit where enforceable
- session expiry
- allowed actions
- allowed assets
- allowed contracts/targets where enforceable
- require stronger authentication above threshold
- revoke Vox access

Explain clearly:

> Voice confirmation does not itself cryptographically sign the transaction. It authorizes Vox to use a previously delegated session permission.

## Main home

Keep it minimal.

Suggested structure:

- Vox wordmark
- portfolio value
- large microphone/hold-to-talk control
- simple prompt suggestion
- Home / Activity / Settings

The UI should not feel like a trading terminal.

## Listening state

Show:

- clear listening indicator;
- live waveform/amplitude;
- transcript when available;
- cancel action.

## Transaction plan

Whenever Vox interprets a state-changing action, show a visual financial plan.

Examples:

Single action:

ETH → USDC  
$20 → ~19.9 USDC

Multi-action:

1. ETH → USDC
2. resulting USDC → WBTC

Display:
- source asset;
- destination asset;
- amount;
- expected output;
- route;
- network;
- estimated fee;
- slippage/min-received where available;
- authorization state.

User must be able to see exactly what Vox believes the user requested.

## Conversational modifications

The UI must preserve and update the pending plan.

Examples:

- “Actually make that $50.”
- “Use OKB instead.”
- “Only sell half.”
- “Swap the USDC to WBTC afterwards.”
- “How much ETH would I have left?”
- “Cancel.”

Do not force the user to restart the transaction flow.

---

# VOICE ARCHITECTURE

## Incoming speech

Every incoming utterance must go through the intelligent audio/agent path.

Do not use Apple Dictate Text.

Do not implement a simplistic yes/no STT shortcut.

Raw audio from:

- PWA microphone;
- Apple Shortcut recording;

must be uploaded to Vox backend.

Gemini should receive the audio and enough conversational context to understand the turn.

## Spoken output

Use device/browser TTS for the MVP where practical.

Device TTS is allowed for:
- greeting;
- confirmations;
- transaction results;
- errors;
- conversational responses.

The intelligence belongs in Vox/Gemini, not the TTS engine.

Optionally allow a better server-side TTS provider later, but do not make it a blocker.

## Greeting

For Apple Shortcut:

> “Hello, what are we doing today?”

Keep greeting configurable in the future.

## Action Button Shortcut

Provide final user setup instructions for an Apple Shortcut named something like:

`Vox`

The shortcut should conceptually:

1. Speak Text:
   `Hello, what are we doing today?`
2. Record Audio:
   - Start Recording: Immediately
   - Finish Recording: After Time
   - default duration: configurable, initially around 8–10 seconds
3. POST raw recorded audio to Vox voice API
4. receive structured response containing speakable text and session/conversation ID
5. Speak returned text
6. if the backend expects another user turn, record audio again
7. POST next audio using same conversation/session ID
8. continue until completed/cancelled/timeout

Do not hardcode a permanent 5-second limit.

Design the server API so recording duration can be adjusted later.

---

# GEMINI / AGENT LAYER

Use Gemini audio-capable model(s) verified in preflight.

The agent receives:

- raw audio;
- current conversation state;
- pending financial plan;
- smart-account address;
- relevant wallet state;
- supported tools/actions;
- prior turn summaries;
- quote state where applicable.

The agent must return typed structured output validated with Zod.

Use an internal state machine.

Possible states:

- IDLE
- UNDERSTANDING
- NEEDS_CLARIFICATION
- READ_QUERY
- PLAN_READY
- AWAITING_CONFIRMATION
- PLAN_MODIFIED
- APPROVED
- EXECUTING
- COMPLETED
- CANCELLED
- FAILED

Example structured turn output:

```json
{
  "turnType": "modify_plan",
  "spokenResponse": "Updated. I’ll swap fifty dollars of ETH to USDC. Confirm?",
  "requiresUserResponse": true,
  "plan": {
    "actions": [
      {
        "type": "swap",
        "tokenIn": "ETH",
        "tokenOut": "USDC",
        "amountType": "usd",
        "amount": "50"
      }
    ]
  }
}
```

Do not execute directly from raw model output.

Pass all plans through deterministic validation.

---

# SUPPORTED MVP FINANCIAL INTENTS

Implement a clean tool/action abstraction.

Required MVP:

## Read-only

- get native/token balance
- get portfolio summary
- get token price where reliable source exists
- get transaction/status details

## State-changing

- exact token swap
- USD-denominated swap
- percentage-of-balance swap
- target-output swap
- token/native transfer
- multi-action plan

Examples:

- “Swap 0.1 ETH to USDC.”
- “Swap $50 of ETH to USDC.”
- “Swap 25% of my ETH to USDC.”
- “Get me $100 USDC using ETH.”
- “Send 5 USDC to 0x…”
- “Swap $100 ETH to USDC and then half the USDC to WBTC.”

Architect so additional capabilities can be added later:

- bridge
- stake
- unstake
- supply
- withdraw
- borrow
- repay
- claim rewards

Do not implement these advanced tools unless time permits and reliable X Layer integrations exist.

---

# TOKEN RESOLUTION

Never let the LLM invent contract addresses.

Create a deterministic token registry/resolver.

For supported assets store/resolve:

- symbol;
- name;
- chain;
- canonical contract address;
- decimals;
- native-token status.

If user names an unsupported/ambiguous token:
- do not guess;
- ask for clarification.

---

# EXECUTION ENGINE

Build a deterministic execution layer.

For every state-changing action:

1. validate intent schema;
2. validate supported chain;
3. resolve token addresses;
4. fetch actual balances;
5. calculate requested amount;
6. check sufficient balance;
7. obtain real quote/route;
8. calculate/verify slippage;
9. verify allowance/approval requirements;
10. simulate if feasible;
11. verify smart-session permission;
12. build transaction/UserOperation;
13. return exact plan for confirmation;
14. execute only after authorized conversational confirmation;
15. monitor result;
16. persist/display transaction hash/status.

The execution engine must not accept arbitrary calldata produced by the LLM.

---

# OKX / SWAP ROUTING

Prefer OKX OnchainOS/DEX if it works for the required X Layer environment.

Wrap routing behind an adapter:

```ts
interface SwapProvider {
  getQuote(...): Promise<SwapQuote>
  buildSwap(...): Promise<PreparedSwap>
}
```

Implement:

`OkxSwapProvider`

If X Layer Testnet is not supported by OKX DEX endpoints, implement a clearly named testnet fallback provider.

Requirements for fallback:

- real onchain execution;
- no fake quotes;
- documented testnet DEX/router;
- adapter-compatible;
- easy to replace with OKX for mainnet.

The product/UI should still identify which routing provider is actually being used.

Do not display “OKX DEX” if the transaction did not route through OKX.

---

# SMART ACCOUNT / SESSION AUTHORIZATION

This is a critical subsystem.

Goal:

The user performs one owner authorization to grant Vox a limited session/delegated signer.

Then a conversational confirmation such as:

> “Yes.”

may cause Vox to use that delegated authority without requiring the owner wallet to sign again, provided the action is within policy.

## Security model

The session/delegated signer must be restricted where technically feasible by:

- chain;
- allowed targets;
- allowed functions;
- token/value limits;
- expiry;
- aggregate/daily usage limit;
- permitted action types.

The owner/private key must never be stored by Vox.

The Vox session signer must be separate from the owner key.

## Stronger-auth fallback

If a requested transaction exceeds the configured voice-authorized threshold or violates a voice-session policy:

- do not execute through the session signer;
- return a response explaining stronger authorization is required;
- provide the appropriate owner/passkey/wallet flow supported by the selected smart-account implementation.

Do not pretend Face ID itself signs EVM transactions unless implemented via a real passkey/WebAuthn-capable account flow.

## Mandatory validation tests

Before integrating the session signer into the agent, create reproducible tests demonstrating:

1. permitted session transaction succeeds without fresh owner signature;
2. over-limit transaction is rejected;
3. disallowed target/function is rejected where policy supports it;
4. expired session is rejected;
5. revoked session is rejected;
6. owner can still recover/control the smart account.

These tests must run on X Layer Testnet or the exact testnet architecture selected for Vox.

Do not mark this subsystem complete without transaction hashes/test evidence.

---

# CONFIRMATION LOGIC

Conversation is non-deterministic; financial authorization state is deterministic.

Example pending plan:

```json
{
  "status": "AWAITING_CONFIRMATION",
  "planId": "abc123",
  "expiresAt": "...",
  "actions": [...]
}
```

A user response such as:

> “Yes.”

can approve the current unchanged plan.

A response such as:

> “Yes, but make it $50.”

must NOT approve the old plan.

It modifies the plan, triggers a new quote, and requires confirmation of the new plan.

A response such as:

> “Yes, and swap the USDC to WBTC afterwards.”

must:
- create a modified multi-action plan;
- obtain updated quote(s);
- read the complete updated plan back;
- wait for confirmation again.

Never let an initial “yes” approve newly introduced actions.

---

# CONFIRMATION SAFETY

For financial amounts:

If model/audio confidence is poor or the utterance is ambiguous, ask a clarification question.

Examples:

- 15 vs 50
- 0.15 vs 1.5
- ambiguous token
- ambiguous recipient

Never silently pick the higher-value interpretation.

Always show the actual resolved amount in the UI before state-changing execution.

---

# DATA / PERSISTENCE

Keep persistence minimal.

Store only what is useful:

- user preferences;
- voice confirmation setting;
- configured thresholds;
- conversation/session metadata;
- pending-plan state;
- activity/transaction metadata;
- smart-account/session metadata excluding private secret material.

Never store:
- owner private key;
- raw API secrets;
- plaintext session private key in browser/localStorage.

If a server-side session signer is used, protect it appropriately and document the threat model.

Prefer an architecture where session signing material is isolated and revocable.

Use Supabase only if useful and available.

If a simpler persistence path is sufficient for MVP, use it.

---

# API ROUTES

Design clean server routes, for example:

- `POST /api/voice/turn`
- `POST /api/agent/turn`
- `POST /api/plan/quote`
- `POST /api/plan/execute`
- `GET /api/portfolio`
- `GET /api/activity`
- smart-account/session setup endpoints as required

The Apple Shortcut voice route should accept multipart/form-data or another appropriate upload format containing:

- audio file;
- conversation/session ID if present;
- wallet/smart-account identifier where appropriate.

Return structured response similar to:

```json
{
  "conversationId": "...",
  "speak": "I’ll swap twenty dollars of ETH to approximately 19.9 USDC. Confirm?",
  "requiresResponse": true,
  "state": "AWAITING_CONFIRMATION",
  "plan": {...}
}
```

Do not return secret information.

---

# SECURITY

Mandatory:

- server-side API secrets only;
- `.env.local` ignored;
- no owner private key storage;
- schema validation on all external/model input;
- rate limiting where practical;
- request-size limits for audio;
- supported MIME-type validation;
- reject arbitrary contract targets;
- deterministic token/address resolution;
- amount sanity checks;
- confirmation expiry;
- quote expiry/requote behavior;
- transaction simulation where feasible;
- session revocation;
- no logging of secrets.

If using the development wallet private key for deployment/testing:
- confine it to development/server scripts;
- never bundle it;
- never use it as the end-user owner architecture.

---

# PWA

Make Vox installable.

Requirements:

- manifest;
- app icons/placeholders;
- standalone mode;
- mobile-first responsive layout;
- microphone permission handling;
- install guidance if useful.

The PWA voice experience may use hold-to-talk or a clear microphone button.

Do not depend on automatic microphone activation from Action Button → browser/PWA because this has already been tested and does not provide the required zero-touch experience.

---

# ACTIVITY

Build an Activity screen showing:

- action type;
- amount/value;
- token path;
- status;
- timestamp;
- transaction hash/explorer link.

For multi-action plans display grouped actions.

When possible, show:

- what user said;
- what Vox understood;
- what actually executed.

Do not store raw audio by default.

---

# SETTINGS

Implement:

## Voice
- spoken responses on/off
- language: Auto
- greeting preference placeholder/config
- recording-duration preference for Shortcut guidance

## Authorization
- voice confirmation on/off
- voice transaction limit
- aggregate/daily/session limit where supported
- expiry
- allowed assets/actions
- stronger-auth fallback settings

## Wallet
- owner wallet
- smart-account address
- balances
- fund/withdraw guidance

## Security
- active Vox session
- expiry
- permissions
- revoke Vox access

Make **Revoke Vox Access** prominent and functional.

---

# ERROR UX

Handle clearly:

- unsupported token
- insufficient balance
- bad recipient
- quote unavailable
- quote expired
- slippage changed
- smart-session policy rejected
- session expired
- session revoked
- Gemini failure
- malformed audio
- unsupported language/audio
- network/RPC failure
- transaction reverted

The agent should explain failures in simple language without inventing causes.

---

# TESTING

Implement meaningful tests.

Required:

- Zod schema tests
- intent/plan reducer/state-machine tests
- confirmation modification tests
- token-resolution tests
- deterministic amount calculation tests
- session-policy tests
- API route validation tests
- smart-account integration tests
- X Layer Testnet transaction test
- build/typecheck/lint

Critical conversational tests:

1. “Swap $20 ETH to USDC.” → plan
2. “Actually make that $50.” → modified/requoted plan
3. “Yes.” → approve only current plan
4. “Yes, but swap the USDC to WBTC.” → new plan, NOT immediate execution
5. “Cancel.” → cancelled
6. “How much ETH would I have left?” → answer without losing pending plan

---

# DEMO FLOW

The final MVP should be able to demonstrate:

1. Open Vox PWA.
2. Connect owner wallet.
3. Smart account/session configured.
4. User presses iPhone Action Button.
5. Shortcut says:
   “Hello, what are we doing today?”
6. Shortcut automatically records raw audio.
7. User says:
   “Swap twenty dollars of ETH to USDC.”
8. Audio reaches Vox.
9. Gemini understands the utterance.
10. Real wallet state/quote is fetched.
11. Vox returns:
    “I’ll swap approximately twenty dollars of ETH for X USDC. Confirm?”
12. Shortcut speaks that response.
13. Shortcut records again.
14. User says:
    “Actually make it fifty.”
15. Vox modifies and requotes.
16. Vox speaks updated plan.
17. User says:
    “Yes.”
18. Session authorization policy is checked.
19. Real transaction/UserOperation executes on X Layer Testnet.
20. Vox says:
    “Done.”
21. PWA Activity screen shows the actual transaction.

If the selected X Layer Testnet liquidity environment prevents a real ETH/USDC swap, use the validated real testnet fallback transaction path and clearly document/demo what actually happened.

Never fake the transaction.

---

# DESIGN

Aim for a polished hackathon-quality interface.

Do not use:
- gradients;
- neon-purple Web3 visuals;
- cluttered dashboards;
- excessive cards;
- fake charts.

Prefer:
- black/white/neutral base;
- strong typography;
- subtle accent;
- large voice states;
- excellent mobile spacing;
- transaction-plan visualization;
- restrained animation.

The main home should feel closer to a voice assistant than an exchange.

---

# DOCUMENTATION

Create:

- `README.md`
- `.env.example`
- setup instructions
- X Layer Testnet setup
- smart-account/session architecture explanation
- Apple Shortcut instructions
- Vercel deployment instructions
- known limitations
- test instructions
- mainnet migration notes

Also create:

`docs/APPLE-SHORTCUT.md`

with an exact step-by-step Shortcut recipe.

---

# COMPLETION REQUIREMENTS

Before producing the final completion report:

1. `npm run build` or equivalent passes.
2. TypeScript passes.
3. Tests pass.
4. PWA loads correctly.
5. Gemini audio flow works.
6. conversational modifications work.
7. real X Layer Testnet read works.
8. real testnet write transaction works.
9. smart-session/delegated execution is proven or the exact blocker is documented.
10. no secret is committed.
11. `.env.example` contains no secret values.
12. README contains reproducible setup.
13. Apple Shortcut can call the deployed voice API.
14. Activity reflects real transaction state.
15. unsupported integrations are labelled honestly.

At the end, provide me:

- what was built;
- what works;
- what remains limited;
- testnet transaction hashes;
- deployed URL if deployed;
- exact Apple Shortcut setup;
- exact mainnet migration steps.

Do not hide failures or replace unavailable functionality with mocks unless explicitly labelled as a mock and approved by me.


---

# FINAL AUTONOMY RULE

Do not interpret headings, milestones, research checkpoints, integration checkpoints, or test checkpoints as reasons to stop and ask the user for permission.

Once the one-time missing requirements have been supplied, **finish the build**.

A message such as “Phase 1 complete” is not a valid stopping point.

A message such as “the frontend is done; would you like me to continue?” is prohibited.

A message such as “Biconomy does not support this testnet; what should I do?” is prohibited when another compliant implementation/fallback can be researched and built autonomously.

Stop only for an unavoidable user-only external blocker. Otherwise continue until the completion checklist is exhausted and the final report can be produced.
