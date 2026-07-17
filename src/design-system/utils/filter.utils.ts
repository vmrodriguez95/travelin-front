/**
 * Filters a collection of plain objects by a free-text query and a `type`
 * filter. The query matches (case-insensitive) against any string field except
 * `type`, which is reserved as the filter dimension used by the filter chips.
 */
export function filterCollection<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  filter: string
): T[] {
  const normalizedQuery = query.trim().toLowerCase()

  return items.filter((item) => {
    const matchesFilter = !filter || item.type === filter
    const matchesQuery =
      !normalizedQuery ||
      Object.entries(item).some(
        ([key, value]) =>
          key !== 'type' &&
          typeof value === 'string' &&
          value.toLowerCase().includes(normalizedQuery)
      )

    return matchesFilter && matchesQuery
  })
}
