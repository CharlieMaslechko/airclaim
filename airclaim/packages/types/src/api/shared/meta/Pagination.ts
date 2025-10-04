/**
 * Represents pagination metadata in vector
 */
export interface PaginationMeta {
  /** Current page number (for page-based pagination). */
  page?: number;
  /** Number of items per page (for page-based pagination). */
  per_page?: number;
  /** Total number of items available (optional). */
  total_count?: number;
  /** Whether there is another page of results (true/false). */
  has_next_page: boolean;
  /** Cursor token for the next page (for cursor-based pagination). */
  next_cursor?: string;
}
