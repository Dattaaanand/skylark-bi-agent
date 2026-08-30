/**
 * Shared types used across the monday.com client, the agent/tool layer,
 * and the chat UI. Keeping these in one place makes it obvious what shape
 * of data flows between each layer.
 */

// ---------- Chat ----------

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequestBody {
  messages: ChatMessage[];
}

// ---------- monday.com raw API shapes (subset we care about) ----------

export interface MondayColumnValue {
  id: string;
  text: string | null;
  /** Raw JSON string monday.com returns for structured column types. */
  value: string | null;
  type?: string;
}

export interface MondayItem {
  id: string;
  name: string;
  group?: { title: string } | null;
  column_values: MondayColumnValue[];
}

export interface MondayBoard {
  id: string;
  name: string;
  columns: { id: string; title: string; type: string }[];
  items_page: {
    cursor: string | null;
    items: MondayItem[];
  };
}

// ---------- Normalized, agent-facing shapes ----------

/**
 * A board item flattened into a plain object keyed by column *title*
 * (not internal column id), with values cleaned/normalized. This is what
 * gets handed to the LLM and to any aggregation helpers — nobody above
 * this layer should ever see raw monday.com column ids or JSON blobs.
 */
export interface NormalizedRecord {
  id: string;
  name: string;
  group: string | null;
  [columnTitle: string]: string | number | null;
}

export interface DataQualityNote {
  field: string;
  issue: string;
  affectedCount: number;
}

export interface NormalizedBoardData {
  boardName: string;
  records: NormalizedRecord[];
  dataQuality: DataQualityNote[];
}
