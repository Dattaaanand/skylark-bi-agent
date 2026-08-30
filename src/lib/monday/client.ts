/**
 * Thin, server-only client for the monday.com GraphQL API.
 *
 * - The API token never leaves the server (read from process.env, only
 *   ever imported into route handlers / server-side lib code).
 * - Every call is read-only; we never send mutations.
 * - Errors are normalized into MondayApiError so callers (and eventually
 *   the LLM) can react gracefully instead of crashing the request.
 */

const MONDAY_API_URL = "https://api.monday.com/v2";

export class MondayApiError extends Error {
  constructor(
    message: string,
    public readonly kind: "auth" | "network" | "graphql" | "not_found" | "unknown" = "unknown",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "MondayApiError";
  }
}

function getToken(): string {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) {
    throw new MondayApiError(
      "MONDAY_API_TOKEN is not set. Add it to your environment (see .env.local.example).",
      "auth"
    );
  }
  return token;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
}

/**
 * Execute a raw GraphQL query/mutation against monday.com.
 * Kept generic and low-level; higher-level helpers in boards.ts and
 * queries.ts build on top of this rather than callers using it directly.
 */
export async function mondayRequest<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
        "API-Version": "2024-10",
      },
      body: JSON.stringify({ query, variables }),
      // BI queries should reflect near-live board state.
      cache: "no-store",
    });
  } catch (err) {
    throw new MondayApiError(
      "Could not reach monday.com (network error). Check connectivity and try again.",
      "network",
      err
    );
  }

  if (response.status === 401 || response.status === 403) {
    throw new MondayApiError(
      "monday.com rejected the API token (unauthorized). Verify MONDAY_API_TOKEN is valid and has read access to the workspace.",
      "auth"
    );
  }

  if (!response.ok) {
    throw new MondayApiError(
      `monday.com API returned HTTP ${response.status}.`,
      "network"
    );
  }

  const json = (await response.json()) as GraphQLResponse<T>;

  if (json.errors && json.errors.length > 0) {
    const message = json.errors.map((e) => e.message).join("; ");
    throw new MondayApiError(`monday.com API error: ${message}`, "graphql", json.errors);
  }

  if (!json.data) {
    throw new MondayApiError("monday.com API returned no data.", "unknown", json);
  }

  return json.data;
}
