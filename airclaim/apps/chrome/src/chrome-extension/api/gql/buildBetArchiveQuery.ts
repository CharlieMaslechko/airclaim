const betArchiveQuery = `
  query BetArchive($offset: Int, $limit: Int) {
    user {
      betArchiveList(offset: $offset, limit: $limit) {
        id
        date
        count
      }
    }
  }
`;

export function buildBetArchiveQuery(offset: number = 0, limit: number = 10) {
  return {
    query: betArchiveQuery,
    variables: { offset, limit },
  };
}
