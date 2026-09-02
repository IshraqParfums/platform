export interface PaginationSummary {
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  /** True when there are few enough pages to list every number instead of collapsing to "Page X of Y". */
  showAllPages: boolean;
}

const MAX_NUMBERED_PAGES = 7;

export function computePaginationSummary(
  page: number,
  pageSize: number,
  total: number,
): PaginationSummary {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    totalPages,
    rangeStart: (page - 1) * pageSize + 1,
    rangeEnd: Math.min(total, page * pageSize),
    showAllPages: totalPages <= MAX_NUMBERED_PAGES,
  };
}
