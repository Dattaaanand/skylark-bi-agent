# Skylark BI Agent

A conversational business-intelligence agent for Skylark Drones. Ask
founder-level questions about the sales pipeline and project execution;
the agent queries **live monday.com data** — never a static export — and
answers with context, not just numbers.

Built for the "Monday.com Business Intelligence Agent" technical
assignment. See `DECISION_LOG.md` for assumptions and trade-offs.

---

## How it works

```
Browser (chat UI)
      │  POST /api/chat  { messages }
      ▼
Next.js API route  ──►  Agent orchestrator (src/lib/ai/agent.ts)
                              │
                              │  1. sends conversation + tool defs to Gemini
                              │  2. Gemini decides to call get_deals / get_work_orders
                              ▼
                         Tool layer (src/lib/ai/tools.ts)
                              │
                              ▼
                    monday.com client (src/lib/monday/*)
                              │  GraphQL, server-side only, read-only
                              ▼
                         monday.com API
                              │
                              ▼
                  Normalization layer (src/lib/data/normalize.ts)
                    — cleans text, parses dates, coerces numbers,
                      records data-quality issues (nulls, bad dates)
                              │
                              ▼
                    results fed back to Gemini, which writes
                    the final answer (with caveats) → returned to UI
```

**Why this shape:**
- The LLM never sees raw CSVs or hardcoded data — its *only* source of
  facts is the two tools, which always hit monday.com fresh
  (`cache: "no-store"`, no request-level caching). This directly
  satisfies the assignment's "do not hardcode CSV data" requirement.
- Cleaning/normalization happens in code, not by prompting the LLM to
  "please handle messy data" — dates, nulls, and text formatting are
  handled deterministically, and a `dataQuality` report is computed
  alongside the data so the agent can *state* caveats instead of
  guessing whether the data was reliable.
- Board IDs are resolved by **name** (see `src/lib/monday/boards.ts`),
  so re-importing or renaming the CSVs doesn't require touching code —
  only `.env.local`.

## Project structure

```
src/
├── app/
│   ├── page.tsx              # chat page
│   ├── layout.tsx            # fonts, metadata
│   ├── globals.css
│   └── api/
│       ├── chat/route.ts     # POST — main conversational endpoint
│       └── health/route.ts   # GET  — env/connectivity check
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx    # state + fetch to /api/chat
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── TypingIndicator.tsx
│   └── ui/
│       └── SuggestionChip.tsx
├── lib/
│   ├── monday/
│   │   ├── client.ts         # GraphQL fetch + auth + MondayApiError
│   │   ├── queries.ts        # GraphQL query strings
│   │   └── boards.ts         # board discovery (by name) + pagination
│   ├── ai/
│   │   ├── client.ts         # Gemini SDK wrapper
│   │   ├── systemPrompt.ts   # agent persona & behavior rules
│   │   ├── tools.ts          # tool schemas + execution (get_deals, get_work_orders)
│   │   └── agent.ts          # tool-calling orchestration loop
│   └── data/
│       └── normalize.ts      # cleaning, date/number parsing, data-quality report
└── types/
    └── index.ts               # shared types across all layers
```

## Setup

### 1. Import the data into monday.com

Already done if you're reading this after import — confirm the workspace
is named **Skylark** and it contains two boards named exactly:
- `Deal funnel Data`
- `Work_Order_Tracker Data`

(If you named them differently, just update the env vars in step 3 — no
code changes needed.)

### 2. Get an API token

monday.com → your avatar (bottom left) → **Admin** → **API** → copy your
personal token. It only needs read access.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:

| Variable | Required | Notes |
|---|---|---|
| `MONDAY_API_TOKEN` | yes | from step 2 |
| `MONDAY_WORKSPACE_NAME` | recommended | `Skylark` — disambiguates if the board name exists elsewhere |
| `MONDAY_DEALS_BOARD_NAME` | no | defaults to `Deal funnel Data` |
| `MONDAY_WORK_ORDERS_BOARD_NAME` | no | defaults to `Work_Order_Tracker Data` |
| `MONDAY_DEALS_BOARD_ID` / `MONDAY_WORK_ORDERS_BOARD_ID` | no | set to skip name lookup entirely |
| `GEMINI_API_KEY` | yes | from https://aistudio.google.com/app/apikey |
| `GEMINI_MODEL` | no | defaults to `gemini-3.6-flash` (Google retired `gemini-2.0-flash`; check https://ai.google.dev/gemini-api/docs/models if this ever 404s) |

### 4. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Visit `/api/health` to sanity-check both env
vars and both boards are reachable before using the chat.

### 5. Deploy (for the hosted-prototype deliverable)

Push to GitHub, import into [Vercel](https://vercel.com/new), add the
same environment variables in the Vercel project settings, deploy. No
other configuration needed — the API routes run as serverless functions.

## Tech stack

- **Next.js 14 (App Router, TypeScript)** — single deployable unit for
  UI + API, trivial to host on Vercel with zero local setup for graders.
- **Gemini (`@google/genai`)** — LLM brain, used for its native
  function-calling (tool use) support via the Chat API. (Note: the older
  `@google/generative-ai` package is deprecated and its models are being
  retired — this project uses Google's current SDK.)
- **monday.com GraphQL API v2** — read-only queries only; no mutations
  anywhere in the codebase.
- **Tailwind CSS** — styling.

No database — the agent is stateless per request; conversation history
is held client-side and replayed to the API each turn. Fine for a
prototype at this scope; see `DECISION_LOG.md` for what changes at
scale.
