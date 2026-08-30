/**
 * Board discovery + full-item fetch.
 *
 * Design choice: rather than hardcoding board IDs, we resolve boards by
 * NAME (from env config) unless explicit IDs are provided. This means the
 * agent survives the "P.S. - set up appropriate column types and
 * structure as you see fit" freedom in the assignment: whoever imports
 * the CSVs doesn't have to hand-edit an ID into the code afterwards.
 *
 * Results are cached in-memory for the lifetime of the server process
 * (board *structure* changes rarely; item data is always fetched fresh).
 */

import { mondayRequest, MondayApiError } from "./client";
import { BOARD_ITEMS_QUERY, LIST_BOARDS_QUERY } from "./queries";
import type { MondayBoard, MondayItem } from "@/types";

interface BoardsListResponse {
  boards: { id: string; name: string; workspace: { id: string; name: string } | null }[];
}

interface BoardItemsResponse {
  boards: MondayBoard[];
}

let boardIdCache: { deals?: string; workOrders?: string } = {};

export type BoardKind = "deals" | "workOrders";

const BOARD_NAME_ENV: Record<BoardKind, { idEnv: string; nameEnv: string; fallbackName: string }> = {
  deals: {
    idEnv: "MONDAY_DEALS_BOARD_ID",
    nameEnv: "MONDAY_DEALS_BOARD_NAME",
    fallbackName: "Deal funnel Data",
  },
  workOrders: {
    idEnv: "MONDAY_WORK_ORDERS_BOARD_ID",
    nameEnv: "MONDAY_WORK_ORDERS_BOARD_NAME",
    fallbackName: "Work_Order_Tracker Data",
  },
};

/** Resolve a board's ID, either from env override or by name lookup against the workspace. */
export async function resolveBoardId(kind: BoardKind): Promise<string> {
  if (boardIdCache[kind]) return boardIdCache[kind] as string;

  const config = BOARD_NAME_ENV[kind];
  const pinnedId = process.env[config.idEnv];
  if (pinnedId) {
    boardIdCache[kind] = pinnedId;
    return pinnedId;
  }

  const targetName = (process.env[config.nameEnv] || config.fallbackName).trim().toLowerCase();
  const workspaceName = (process.env.MONDAY_WORKSPACE_NAME || "").trim().toLowerCase();

  const data = await mondayRequest<BoardsListResponse>(LIST_BOARDS_QUERY);

  const candidates = data.boards.filter((b) => b.name.trim().toLowerCase() === targetName);

  const match =
    (workspaceName
      ? candidates.find((b) => b.workspace?.name?.trim().toLowerCase() === workspaceName)
      : undefined) ?? candidates[0];

  if (!match) {
    throw new MondayApiError(
      `Could not find a board named "${config.fallbackName}" in monday.com. ` +
        `Confirm it's imported and that ${config.nameEnv} / MONDAY_WORKSPACE_NAME match its actual name, ` +
        `or set ${config.idEnv} directly to skip name lookup.`,
      "not_found"
    );
  }

  boardIdCache[kind] = match.id;
  return match.id;
}

/** Fetch every item on a board, paginating through items_page automatically. */
export async function fetchAllBoardItems(boardId: string): Promise<MondayBoard> {
  let cursor: string | null = null;
  let mergedItems: MondayItem[] = [];
  let boardMeta: MondayBoard | null = null;

  do {
    const data: BoardItemsResponse = await mondayRequest<BoardItemsResponse>(BOARD_ITEMS_QUERY, {
      boardId,
      cursor,
    });

    const board = data.boards[0];
    if (!board) {
      throw new MondayApiError(`Board ${boardId} not found or not accessible with this token.`, "not_found");
    }

    boardMeta = boardMeta ?? board;
    mergedItems = mergedItems.concat(board.items_page.items);
    cursor = board.items_page.cursor;
  } while (cursor);

  return {
    ...(boardMeta as MondayBoard),
    items_page: { cursor: null, items: mergedItems },
  };
}

/** Convenience: resolve + fetch in one call for a named board kind. */
export async function getBoard(kind: BoardKind): Promise<MondayBoard> {
  const boardId = await resolveBoardId(kind);
  return fetchAllBoardItems(boardId);
}

/** Test-only / dev helper to reset the in-memory board ID cache. */
export function _resetBoardIdCache() {
  boardIdCache = {};
}
