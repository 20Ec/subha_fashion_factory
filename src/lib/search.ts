/** Picks the first value when Next.js gives an array of search params. */
export function firstValue(input: string | string[] | undefined) {
  return Array.isArray(input) ? input[0] : input;
}

/**
 * Trims a search term and removes characters that would break a PostgREST
 * `.or()` expression or act as unintended LIKE wildcards.
 */
export function cleanQuery(input: string | string[] | undefined) {
  return (firstValue(input) ?? "")
    .replace(/[,()%*\\"_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
