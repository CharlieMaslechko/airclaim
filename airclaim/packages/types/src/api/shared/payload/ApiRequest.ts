/**
 * Represents a JSON:API-compliant request payload for creating or updating a resource.
 *
 * @template T - The attributes payload (fields for the resource).
 */
export interface ApiRequest<T> {
  data: {
    /** The resource type (e.g., "user", "reward"). */
    type: string;

    /** The resource ID (optional for create, required for update). */
    id?: string;

    /** The fields being sent in the request. */
    attributes: T;
  };
}
