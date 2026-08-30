# Decision Log

## Key assumptions

- **Board names are stable identifiers.** I resolve boards by name
  (`Deal funnel Data`, `Work_Order_Tracker Data`) rather than hardcoding
  IDs, scoped to a `Skylark` workspace to avoid collisions. Assumption:
  whoever imports the CSVs keeps these names (or updates two env vars if
  not) — this felt more robust than a brittle hardcoded ID for a
  take-home where the board is freshly created by hand.
- **"This quarter" / relative time windows are calendar-quarter, not
  fiscal.** Without a stated fiscal year, I default to calendar quarters
  and let the agent state that assumption in its answer rather than
  silently picking one.
- **Ambiguous DD/MM vs MM/DD dates default to DD/MM/YYYY** (non-US
  convention) when a numeric date string doesn't already disambiguate
  itself (e.g. day > 12). This is a guess, not a certainty — flagged in
  `normalize.ts` and worth confirming against however the source system
  actually exported dates.
- **"Sector" (e.g. "energy sector") isn't a column I can guarantee
  exists** on the boards. I told the agent to check what fields are
  actually present and ask a clarifying question if it can't identify a
  sector field, rather than silently ignoring part of the question.
- **Read-only is sufficient.** The spec explicitly says Read only, so
  there is no code path that can mutate monday.com — not even
  accidentally via a wrong tool call, since only two read tools exist.

## Trade-offs chosen, and why

- **Gemini function-calling loop, capped at 4 rounds.** A hard round cap
  is a blunt instrument, but it guarantees the API route can't hang
  indefinitely on a pathological tool-call loop — acceptable for a
  6-hour build; a production version would want smarter loop-detection
  instead of a flat cap.
- **Normalization in code, not in the prompt.** I deliberately did *not*
  ask the LLM to "please clean this data" — deterministic parsing
  (dates, numbers, blank-value detection) lives in
  `src/lib/data/normalize.ts`, and only the *summary* of data-quality
  issues goes to the model. This is slower to write than prompting the
  model to cope with mess, but it's testable, and it means the model's
  stated caveats ("3 of 18 rows missing X") are always factually
  grounded rather than a plausible-sounding guess.
- **No vector DB / RAG, no persistent chat history.** At this data
  volume (tens to low hundreds of rows per board), sending normalized
  records directly to the model in a tool response is simpler and more
  accurate than building retrieval infrastructure. I capped each tool
  response at 250 records with a `truncated` flag so this remains
  honest if a board grows — the model is told when it's seeing a partial
  set rather than being allowed to assume it has everything.
- **Stateless server, client-replayed history.** Simpler to build and
  host than session storage, at the cost of the whole conversation being
  resent every turn. Fine at this scale; would move to server-side
  session state (or trim/summarize old turns) before this got expensive.
- **MCP vs raw API:** I used the raw GraphQL API directly rather than
  monday.com's MCP server. This kept the dependency surface small and
  the tool-calling logic fully under my control (custom normalization,
  custom pagination, custom error messages) rather than being shaped by
  whatever an off-the-shelf MCP server exposes.

## How I interpreted "the agent should help prepare data for leadership updates"

I treated this as a *response mode*, not a separate feature: when a user
asks the agent to prepare something "for leadership" or "for an update,"
the system prompt instructs it to restructure its answer as 3–5 tight
bullet points — headline number first, then supporting context, then one
flagged risk or data-quality caveat if one exists — something a founder
could paste directly into a Slack update or slide, rather than a
conversational paragraph. I chose not to build a separate export/PDF
feature for this, since the assignment explicitly leaves the
interpretation open and the conversational reformatting satisfies the
spirit of "help prepare" within the 6-hour scope.

## What I'd do differently with more time

- **Real column-name resolution instead of trusting `column.title`
  verbatim.** Right now the agent trusts whatever title the board owner
  typed. I'd add light aliasing (e.g. "value" / "deal value" / "amount"
  → one canonical field) so the agent is less sensitive to naming drift.
- **Caching layer for board schema** (column list) with a short TTL, to
  cut latency on repeated questions without re-fetching structure every
  single tool call — currently only the board *ID* is cached, not the
  schema or data.
- **Unit tests around `normalize.ts`**, especially the date-parsing
  branch — that's the highest-risk piece of silent-failure logic in the
  codebase and the one most worth locking down with test cases from the
  actual messy data.
- **Streaming responses** in the chat UI (the API currently returns one
  complete JSON reply) — would make longer analytical answers feel much
  more responsive.
- **A lightweight eval set** — a dozen sample founder questions with
  expected-answer shapes — to catch regressions as the system prompt or
  normalization logic changes, rather than testing by hand.
