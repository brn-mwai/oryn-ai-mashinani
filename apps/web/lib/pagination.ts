/**
 * Pagination utilities for API responses
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total?: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

/**
 * Parse pagination params from request URL
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number } = {}
): PaginationParams {
  const page = parseInt(searchParams.get("page") || "") || defaults.page || 1;
  const limit = Math.min(
    parseInt(searchParams.get("limit") || "") || defaults.limit || 20,
    100 // Max limit
  );
  const cursor = searchParams.get("cursor") || undefined;

  return { page, limit, cursor };
}

/**
 * Calculate pagination offset
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  params: PaginationParams,
  total?: number
): PaginatedResponse<T> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const hasMore = data.length === limit;

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      hasMore,
    },
  };
}

/**
 * Create cursor-based paginated response
 */
export function createCursorPaginatedResponse<T extends { _id: string }>(
  data: T[],
  limit: number
): PaginatedResponse<T> {
  const hasMore = data.length === limit;
  const nextCursor = hasMore && data.length > 0 ? data[data.length - 1]._id : undefined;

  return {
    data,
    pagination: {
      page: 1,
      limit,
      hasMore,
      nextCursor,
    },
  };
}

/**
 * Default pagination config
 */
export const PAGINATION_DEFAULTS = {
  claims: { limit: 20 },
  clients: { limit: 20 },
  messages: { limit: 50 },
  transactions: { limit: 30 },
  notifications: { limit: 20 },
} as const;
