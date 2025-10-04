/**
 * Represents a successful API response contract in vector
 *
 * @template T The type of the main data payload.
 * @template U The type of the metadata if defined.
 */
export interface ApiSuccess<T, U = undefined> {
  /** The main data returned by the API. */
  data: T;
  /** Additional metadata about the response. */
  meta: U;
}
