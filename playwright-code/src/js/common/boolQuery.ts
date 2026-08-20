export type BoolLeaf = boolean | (() => boolean) | null | undefined;
export type BoolClause = BoolLeaf | BoolQuery;

export interface BoolQuery {
  must?: BoolClause[];
  should?: BoolClause[];
  mustNot?: BoolClause[];
  minimumShouldMatch?: number; // defaults to 1
}

const isBoolQuery = (clause: BoolClause): clause is BoolQuery =>
  typeof clause === 'object' && clause !== null;

const evaluateClause = (clause: BoolClause): boolean => {
  if (clause === null || clause === undefined) return false;
  if (typeof clause === 'boolean') return clause;
  if (typeof clause === 'function') return Boolean(clause());
  if (isBoolQuery(clause)) return resolveBool(clause);
  return false;
};

export const resolveBool = (query: BoolQuery): boolean => {
  const { must, should, mustNot, minimumShouldMatch } = query;

  if (must && !must.every(evaluateClause)) return false;
  if (mustNot && mustNot.some(evaluateClause)) return false;

  if (should && should.length > 0) {
    const required = minimumShouldMatch ?? 1;
    const matched = should.reduce(
      (count, clause) => (evaluateClause(clause) ? count + 1 : count),
      0,
    );
    if (matched < required) return false;
  }

  return true;
};
