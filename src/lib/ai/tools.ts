/**
 * Tools the LLM can call. Each tool's `execute` function is the ONLY path
 * from the agent to real data — this is what makes "no hardcoded CSV
 * data" true structurally, not just by convention: there is no other
 * source of board data anywhere in the request path.
 */

import { Type, type FunctionDeclaration } from "@google/genai";
import { getBoard } from "@/lib/monday/boards";
import { MondayApiError } from "@/lib/monday/client";
import { normalizeBoard } from "@/lib/data/normalize";
import type { NormalizedBoardData } from "@/types";

// Cap how many records we inline per tool call so a large board doesn't
// blow the model's context. The agent is told the true total and can
// request a narrower slice (e.g. ask a follow-up) if it needs more.
const MAX_RECORDS_RETURNED = 250;

function truncate(data: NormalizedBoardData) {
  const total = data.records.length;
  const records = data.records.slice(0, MAX_RECORDS_RETURNED);
  return {
    boardName: data.boardName,
    totalRecordCount: total,
    returnedRecordCount: records.length,
    truncated: total > records.length,
    dataQuality: data.dataQuality,
    records,
  };
}

async function getDealsTool() {
  const board = await getBoard("deals");
  return truncate(normalizeBoard(board));
}

async function getWorkOrdersTool() {
  const board = await getBoard("workOrders");
  return truncate(normalizeBoard(board));
}

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "get_deals",
    description:
      "Fetch every current record from the 'Deal funnel Data' monday.com board (sales pipeline: owner, client, deal status, close date, closure probability, deal value, etc.). Always call this fresh for any pipeline/sales/revenue question — never rely on a previous call's data for a new question.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: "get_work_orders",
    description:
      "Fetch every current record from the 'Work_Order_Tracker Data' monday.com board (project execution data). Always call this fresh for any operational/project-status question.",
    parameters: { type: Type.OBJECT, properties: {} },
  },
];

export type ToolName = "get_deals" | "get_work_orders";

/**
 * Execute a tool by name and return a JSON-serializable result. Errors are
 * caught and turned into a structured `{ error }` payload rather than
 * thrown, so the model can see the failure and explain it to the user
 * instead of the whole request crashing.
 */
export async function executeTool(name: string, _args: unknown) {
  try {
    switch (name as ToolName) {
      case "get_deals":
        return await getDealsTool();
      case "get_work_orders":
        return await getWorkOrdersTool();
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    if (err instanceof MondayApiError) {
      return { error: err.message, errorKind: err.kind };
    }
    return { error: err instanceof Error ? err.message : "Unknown error calling monday.com." };
  }
}
