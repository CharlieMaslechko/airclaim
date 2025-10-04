/**
 * Represents an error in vector
 *
 */
export interface ApiError {
  /** The error code. */
  code: string;
  /** The status code of the error. */
  status: string;
  /** The title of the error. */
  title: string;
  /** The detail of the error. */
  detail: string;
  /** The source of the error. */
  source: {
    /** The pointer to the error. */
    pointer: string;
  };
}

/**
 * Represents a list of errors in vector
 *
 */
export interface ApiErrors {
  /** The request ID for the API request. */
  request_id: string;
  /** A list of errors that occurred during the API request. */
  errors: ApiError[];
}
