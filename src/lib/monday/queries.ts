/**
 * Centralized GraphQL query definitions. Keeping the literal query strings
 * here (rather than inline in boards.ts) makes it easy to see, at a
 * glance, exactly what fields we ever request from monday.com.
 */

/** Find boards by name inside a given workspace (name match is case-insensitive, done client-side). */
export const LIST_BOARDS_QUERY = /* GraphQL */ `
  query ListBoards {
    boards(limit: 100, order_by: created_at) {
      id
      name
      workspace {
        id
        name
      }
    }
  }
`;

/** Fetch a board's column definitions plus a page of items with their values. */
export const BOARD_ITEMS_QUERY = /* GraphQL */ `
  query BoardItems($boardId: ID!, $cursor: String) {
    boards(ids: [$boardId]) {
      id
      name
      columns {
        id
        title
        type
      }
      items_page(limit: 100, cursor: $cursor) {
        cursor
        items {
          id
          name
          group {
            title
          }
          column_values {
            id
            text
            value
            type
          }
        }
      }
    }
  }
`;
